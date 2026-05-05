import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Strategy, ExitCondition, ExitAction } from '../../types/strategy';
import { StrategyEngine } from './engine';
import { WalletManager } from '../wallet/manager';
import { JupiterClient } from '../../integrations/jupiter/client';
import { PriceService } from '../../utils/price';
import { EventLogger } from '../events/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Get the fraction to sell for a given ExitAction. */
function sellFraction(action: ExitAction): number {
  switch (action) {
    case 'sell_all': return 1.0;
    case 'sell_50':  return 0.5;
    case 'sell_25':  return 0.25;
    default:         return 1.0;
  }
}

// ---------------------------------------------------------------------------
// StrategyRunner
// ---------------------------------------------------------------------------

export class StrategyRunner {
  /**
   * Main blocking loop. Runs until the strategy reaches a terminal state or
   * the process is killed. Designed to be called from `paw strategy run`.
   */
  static async run(strategyId: string, onTick?: (s: Strategy) => void): Promise<void> {
    console.log(`\n📟 Strategy Runner started for: ${strategyId}`);
    console.log('Press Ctrl+C to stop (strategy will remain in its current state)\n');

    // Allow graceful stop on SIGINT
    let stopping = false;
    process.once('SIGINT', () => {
      stopping = true;
      console.log('\n⚡ Stopping runner… strategy state preserved on disk.');
    });

    while (!stopping) {
      let strategy: Strategy;
      try {
        strategy = await StrategyEngine.loadStrategy(strategyId);
      } catch (err) {
        console.error(`❌ Cannot load strategy: ${(err as Error).message}`);
        break;
      }

      // Terminal states – nothing more to do
      if (['completed', 'cancelled', 'failed'].includes(strategy.status)) {
        console.log(`✅ Strategy "${strategyId}" is ${strategy.status}. Exiting.`);
        break;
      }

      // Paused – wait and re-check
      if (strategy.status === 'paused') {
        console.log('⏸  Strategy is paused. Waiting 30 s...');
        await sleep(30_000);
        continue;
      }

      // Execute one monitoring tick
      try {
        strategy = await StrategyRunner.tick(strategy);
        if (onTick) onTick(strategy);
      } catch (err) {
        console.error(`⚠️  Tick error: ${(err as Error).message}`);
      }

      if (['completed', 'cancelled', 'failed'].includes(strategy.status)) {
        console.log(`\n✅ Strategy ${strategy.status}. Runner exiting.`);
        break;
      }

      await sleep(strategy.monitor_interval_seconds * 1_000);
    }
  }

  /**
   * Execute one monitoring iteration.
   * Returns the (potentially mutated) strategy after saving it to disk.
   */
  static async tick(strategy: Strategy): Promise<Strategy> {
    const now = new Date().toISOString();
    strategy.last_checked_at = now;

    if (strategy.type === 'dca') {
      strategy = await StrategyRunner.tickDCA(strategy);
    } else {
      strategy = await StrategyRunner.tickMoonshot(strategy);
    }

    await StrategyEngine.saveStrategy(strategy);
    return strategy;
  }

  // --------------------------------------------------------------------------
  // Moonshot (buy-then-monitor)
  // --------------------------------------------------------------------------

  private static async tickMoonshot(strategy: Strategy): Promise<Strategy> {
    // Step 1: Execute entry if not yet done
    if (strategy.status === 'pending') {
      console.log(`🚀 Executing entry for strategy ${strategy.strategy_id}…`);
      strategy = await StrategyRunner.executeEntry(strategy);
      return strategy;
    }

    // Step 2: Monitor position and check exits
    if (strategy.status !== 'active' || !strategy.position) {
      return strategy;
    }

    const { token_mint, token_symbol } = strategy.entry;
    let currentPriceUsd: number;

    try {
      const prices = await JupiterClient.getTokenPrices([token_mint]);
      currentPriceUsd = prices[token_mint] ?? 0;
    } catch {
      console.warn('⚠️  Could not fetch token price, skipping tick.');
      return strategy;
    }

    const currentValueUsd = currentPriceUsd * strategy.position.amount;
    const costBasisUsd = strategy.position.cost_basis_usd;

    console.log(
      `📊 ${token_symbol}: $${currentPriceUsd.toFixed(6)} | ` +
      `Value: $${currentValueUsd.toFixed(4)} | ` +
      `Cost: $${costBasisUsd.toFixed(4)} | ` +
      `PnL: ${(((currentValueUsd / costBasisUsd) - 1) * 100).toFixed(1)}%`
    );

    // Check exits in priority order
    const sortedExits = [...strategy.exits].sort((a, b) => a.priority - b.priority);
    const entryTimestampMs = new Date(strategy.position.entry_timestamp).getTime();

    for (const exit of sortedExits) {
      if (exit.triggered) continue;

      const triggered = StrategyRunner.checkExitCondition(
        exit,
        currentValueUsd,
        costBasisUsd,
        entryTimestampMs
      );

      if (triggered) {
        console.log(`\n🎯 Exit triggered: "${exit.name}" (${exit.type})`);
        strategy = await StrategyRunner.executeExit(strategy, exit);
        break;
      }
    }

    return strategy;
  }

  private static checkExitCondition(
    exit: ExitCondition,
    currentValueUsd: number,
    costBasisUsd: number,
    entryTimestampMs: number
  ): boolean {
    switch (exit.type) {
      case 'take_profit':
        return exit.multiplier !== undefined &&
          currentValueUsd >= costBasisUsd * exit.multiplier;

      case 'stop_loss':
        return exit.multiplier !== undefined &&
          currentValueUsd <= costBasisUsd * exit.multiplier;

      case 'time_exit':
        return exit.duration_seconds !== undefined &&
          Date.now() - entryTimestampMs >= exit.duration_seconds * 1_000;

      default:
        return false;
    }
  }

  // --------------------------------------------------------------------------
  // DCA (buy on schedule)
  // --------------------------------------------------------------------------

  private static async tickDCA(strategy: Strategy): Promise<Strategy> {
    if (!strategy.dca) return strategy;

    const dca = strategy.dca;
    const now = Date.now();
    const nextRunMs = new Date(dca.next_run_at).getTime();

    if (now < nextRunMs) {
      const remaining = Math.round((nextRunMs - now) / 1_000);
      console.log(
        `⏰ DCA run ${dca.runs_completed + 1}/${dca.runs_total} in ${remaining}s…`
      );
      return strategy;
    }

    console.log(
      `\n💰 DCA run ${dca.runs_completed + 1}/${dca.runs_total} – buying ${strategy.entry.budget} ${strategy.entry.currency}…`
    );

    try {
      strategy = await StrategyRunner.executeDCABuy(strategy);
      dca.runs_completed += 1;
      dca.next_run_at = new Date(now + dca.interval_seconds * 1_000).toISOString();

      if (dca.runs_completed >= dca.runs_total) {
        strategy.status = 'completed';
        strategy.completed_at = new Date().toISOString();
        console.log(`\n✅ DCA strategy completed after ${dca.runs_total} runs!`);

        await EventLogger.log(
          strategy.agent_id,
          'strategy_completed',
          'info',
          `DCA strategy completed: ${dca.runs_total} buys of ${strategy.entry.budget} ${strategy.entry.currency}`,
          { strategy_id: strategy.strategy_id }
        );
      }
    } catch (err) {
      console.error(`❌ DCA buy failed: ${(err as Error).message}`);
      await EventLogger.log(
        strategy.agent_id,
        'strategy_failed',
        'error',
        `DCA buy failed: ${(err as Error).message}`,
        { strategy_id: strategy.strategy_id }
      );
    }

    return strategy;
  }

  // --------------------------------------------------------------------------
  // Trade execution helpers
  // --------------------------------------------------------------------------

  private static async executeEntry(strategy: Strategy): Promise<Strategy> {
    const { entry, agent_id } = strategy;
    const { token_mint, budget, currency, max_slippage_pct } = entry;

    const inputMint =
      JupiterClient.TOKENS[currency as keyof typeof JupiterClient.TOKENS] || currency;

    const amountLamports = currency === 'SOL'
      ? Math.floor(budget * LAMPORTS_PER_SOL)
      : Math.floor(budget * 1e6); // USDC = 6 decimals

    const slippageBps = Math.floor(max_slippage_pct * 100);
    const keypair = await WalletManager.loadKeypairAuto(agent_id);
    const referral = JupiterClient.loadReferralConfig();

    const quote = await JupiterClient.getQuote(
      inputMint,
      token_mint,
      amountLamports,
      slippageBps,
      {
        userPublicKey: keypair.publicKey.toBase58(),
        referralAccount: referral?.referralAccount,
        referralFee: referral?.referralFee,
      }
    );

    const result = await JupiterClient.executeSwap(quote, keypair);

    if (result.status !== 'Success') {
      throw new Error(`Entry swap failed: ${JSON.stringify(result)}`);
    }

    // Estimate tokens received and cost basis
    const outputDecimals = entry.token_decimals;
    const tokensReceived = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
    const solPrice = await PriceService.getSolPrice();
    const costBasisUsd = currency === 'SOL' ? budget * solPrice : budget;
    const entryPriceUsd = costBasisUsd / tokensReceived;

    strategy.position = {
      amount: tokensReceived,
      cost_basis_usd: costBasisUsd,
      entry_price_usd: entryPriceUsd,
      entry_timestamp: new Date().toISOString(),
      entry_tx: result.signature,
    };

    strategy.status = 'active';

    console.log(`✅ Entry executed: bought ${tokensReceived.toFixed(4)} ${entry.token_symbol}`);
    console.log(`   Cost basis: $${costBasisUsd.toFixed(4)} | TX: ${result.signature}`);

    await EventLogger.log(
      agent_id,
      'strategy_entry_executed',
      'info',
      `Strategy entry: bought ${tokensReceived.toFixed(4)} ${entry.token_symbol}`,
      {
        strategy_id: strategy.strategy_id,
        tokens_received: tokensReceived,
        cost_basis_usd: costBasisUsd,
        entry_tx: result.signature,
      }
    );

    return strategy;
  }

  private static async executeDCABuy(strategy: Strategy): Promise<Strategy> {
    const { entry, agent_id } = strategy;
    const { token_mint, token_symbol, budget, currency, max_slippage_pct } = entry;

    const inputMint =
      JupiterClient.TOKENS[currency as keyof typeof JupiterClient.TOKENS] || currency;

    const amountLamports = currency === 'SOL'
      ? Math.floor(budget * LAMPORTS_PER_SOL)
      : Math.floor(budget * 1e6);

    const slippageBps = Math.floor(max_slippage_pct * 100);
    const keypair = await WalletManager.loadKeypairAuto(agent_id);
    const referral = JupiterClient.loadReferralConfig();

    const quote = await JupiterClient.getQuote(
      inputMint,
      token_mint,
      amountLamports,
      slippageBps,
      {
        userPublicKey: keypair.publicKey.toBase58(),
        referralAccount: referral?.referralAccount,
        referralFee: referral?.referralFee,
      }
    );

    const result = await JupiterClient.executeSwap(quote, keypair);

    if (result.status !== 'Success') {
      throw new Error(`DCA swap failed: ${JSON.stringify(result)}`);
    }

    const outputDecimals = entry.token_decimals;
    const tokensReceived = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);

    console.log(`✅ DCA buy: ${tokensReceived.toFixed(4)} ${token_symbol} | TX: ${result.signature}`);

    await EventLogger.log(
      agent_id,
      'strategy_entry_executed',
      'info',
      `DCA buy: ${tokensReceived.toFixed(4)} ${token_symbol} for ${budget} ${currency}`,
      {
        strategy_id: strategy.strategy_id,
        tokens_received: tokensReceived,
        run: (strategy.dca?.runs_completed ?? 0) + 1,
        tx: result.signature,
      }
    );

    return strategy;
  }

  private static async executeExit(
    strategy: Strategy,
    exit: ExitCondition
  ): Promise<Strategy> {
    if (!strategy.position) return strategy;

    const { entry, agent_id } = strategy;
    const fraction = sellFraction(exit.action);
    const amountToSell = strategy.position.amount * fraction;
    const tokenDecimals = entry.token_decimals;
    const amountSmallestUnit = Math.floor(amountToSell * Math.pow(10, tokenDecimals));

    const outputMint = JupiterClient.TOKENS.SOL;
    const slippageBps = Math.floor(entry.max_slippage_pct * 100);
    const keypair = await WalletManager.loadKeypairAuto(agent_id);
    const referral = JupiterClient.loadReferralConfig();

    const quote = await JupiterClient.getQuote(
      entry.token_mint,
      outputMint,
      amountSmallestUnit,
      slippageBps,
      {
        userPublicKey: keypair.publicKey.toBase58(),
        referralAccount: referral?.referralAccount,
        referralFee: referral?.referralFee,
      }
    );

    const result = await JupiterClient.executeSwap(quote, keypair);

    const solReceived = parseInt(quote.outAmount) / LAMPORTS_PER_SOL;
    const solPrice = await PriceService.getSolPrice();
    const realizedUsd = solReceived * solPrice;

    // Mark exit as triggered
    exit.triggered = true;
    exit.triggered_at = new Date().toISOString();

    // Update position if partial sell
    if (fraction < 1) {
      strategy.position.amount -= amountToSell;
    } else {
      strategy.status = 'completed';
      strategy.completed_at = new Date().toISOString();
    }

    console.log(
      `✅ Exit "${exit.name}": sold ${amountToSell.toFixed(4)} ${entry.token_symbol} → ${solReceived.toFixed(6)} SOL`
    );

    await EventLogger.log(
      agent_id,
      'strategy_exit_triggered',
      'info',
      `Exit "${exit.name}" triggered for strategy ${strategy.strategy_id}`,
      {
        strategy_id: strategy.strategy_id,
        exit_name: exit.name,
        exit_type: exit.type,
        amount_sold: amountToSell,
        token: entry.token_symbol,
        sol_received: solReceived,
        realized_usd: realizedUsd,
        tx: result.signature,
      }
    );

    if (strategy.status === 'completed') {
      await EventLogger.log(
        agent_id,
        'strategy_completed',
        'info',
        `Strategy ${strategy.strategy_id} completed via exit "${exit.name}"`,
        { strategy_id: strategy.strategy_id }
      );
    }

    return strategy;
  }
}
