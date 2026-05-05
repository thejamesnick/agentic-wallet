import { Command } from 'commander';
import { Strategy, ExitCondition, DCASchedule } from '../../types/strategy';
import { StrategyEngine } from '../../core/strategy/engine';
import { StrategyRunner } from '../../core/strategy/runner';
import { JupiterClient } from '../../integrations/jupiter/client';
import { EventLogger } from '../../core/events/logger';

// ---------------------------------------------------------------------------
// Duration parser  – "1h", "30m", "2d", "1w" → seconds
// ---------------------------------------------------------------------------
function parseDuration(input: string): number {
  const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|w)$/i);
  if (!match) {
    throw new Error(
      `Invalid duration "${input}". Use e.g. 30m, 1h, 24h, 1d, 7d, 1w`
    );
  }
  const value = parseFloat(match[1]);
  switch (match[2].toLowerCase()) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86_400;
    case 'w': return value * 604_800;
    default:  throw new Error(`Unknown unit: ${match[2]}`);
  }
}

/** Parse a multiplier from strings like "2x", "0.5x", "2.0", "150%". */
function parseMultiplier(input: string): number {
  const s = input.trim().replace(/x$/i, '').replace(/%$/, '');
  const n = parseFloat(s);
  if (isNaN(n)) throw new Error(`Invalid multiplier: "${input}"`);
  // If given as percentage (e.g. "150%") convert to multiplier
  return input.endsWith('%') ? n / 100 : n;
}

// ---------------------------------------------------------------------------
// Status display helper
// ---------------------------------------------------------------------------
function printStrategyStatus(s: Strategy): void {
  const statusIcon: Record<string, string> = {
    pending:   '⏳',
    active:    '🟢',
    paused:    '⏸ ',
    completed: '✅',
    cancelled: '🚫',
    failed:    '❌',
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📟 Strategy: ${s.strategy_id}`);
  console.log(`   Agent:       ${s.agent_id}`);
  console.log(`   Description: ${s.description}`);
  console.log(`   Type:        ${s.type}`);
  console.log(`   Status:      ${statusIcon[s.status] ?? '?'} ${s.status}`);
  console.log(`   Created:     ${new Date(s.created_at).toLocaleString()}`);

  if (s.entry) {
    console.log(`\n📥 Entry:`);
    console.log(`   Token:       ${s.entry.token_symbol} (${s.entry.token_mint})`);
    console.log(`   Budget:      ${s.entry.budget} ${s.entry.currency}`);
    console.log(`   Max Slippage:${s.entry.max_slippage_pct}%`);
  }

  if (s.position) {
    console.log(`\n💼 Position:`);
    console.log(`   Amount:      ${s.position.amount.toFixed(6)} ${s.entry.token_symbol}`);
    console.log(`   Cost Basis:  $${s.position.cost_basis_usd.toFixed(4)}`);
    console.log(`   Entry Price: $${s.position.entry_price_usd.toFixed(6)}`);
    console.log(`   Entry TX:    ${s.position.entry_tx}`);
    console.log(`   Entry Time:  ${new Date(s.position.entry_timestamp).toLocaleString()}`);
  }

  if (s.exits && s.exits.length > 0) {
    console.log(`\n🚪 Exits:`);
    for (const e of s.exits) {
      const triggered = e.triggered ? `✅ triggered at ${e.triggered_at}` : '⏳ waiting';
      let condition = '';
      if (e.type === 'take_profit' && e.multiplier) {
        condition = `value ≥ ${e.multiplier}× cost basis`;
      } else if (e.type === 'stop_loss' && e.multiplier) {
        condition = `value ≤ ${e.multiplier}× cost basis`;
      } else if (e.type === 'time_exit' && e.duration_seconds) {
        condition = `${e.duration_seconds / 3600}h elapsed`;
      }
      console.log(`   [P${e.priority}] ${e.name}: ${condition} → ${e.action} (${triggered})`);
    }
  }

  if (s.dca) {
    console.log(`\n🔁 DCA Schedule:`);
    console.log(`   Runs:        ${s.dca.runs_completed}/${s.dca.runs_total}`);
    console.log(`   Interval:    ${s.dca.interval_seconds}s`);
    console.log(`   Next Run:    ${new Date(s.dca.next_run_at).toLocaleString()}`);
  }

  if (s.last_checked_at) {
    console.log(`\n🕐 Last checked: ${new Date(s.last_checked_at).toLocaleString()}`);
  }

  if (s.error) {
    console.log(`\n⚠️  Error: ${s.error}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ---------------------------------------------------------------------------
// strategy create
// ---------------------------------------------------------------------------
const createCmd = new Command('create')
  .description('Create a new moonshot strategy (buy + take-profit / stop-loss / time exits)')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--token <symbol>', 'Token to buy (symbol or mint address)')
  .requiredOption('--budget <amount>', 'Budget to spend (e.g. 0.2)')
  .option('--currency <currency>', 'Currency to spend (SOL, USDC)', 'SOL')
  .option('--take-profit <multiplier>', 'Take-profit trigger, e.g. 2x = double (sell_all)')
  .option('--stop-loss <multiplier>', 'Stop-loss trigger, e.g. 0.5x (sell_all)')
  .option('--time-limit <duration>', 'Time-based exit, e.g. 24h (sell_all)')
  .option('--max-slippage <percent>', 'Max slippage %', '5')
  .option('--description <desc>', 'Human-readable description', '')
  .option('--monitor-interval <seconds>', 'How often to check prices (seconds)', '60')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Create Strategy');

      // Validate budget
      const budget = parseFloat(options.budget);
      if (isNaN(budget) || budget <= 0) {
        throw new Error(`Invalid budget "${options.budget}". Must be a positive number.`);
      }

      // Resolve token
      let tokenMint = JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS] ?? options.token;
      let tokenSymbol = options.token.toUpperCase();
      let tokenDecimals = 6; // default for most SPL tokens

      if (!JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS]) {
        console.log('🔍 Looking up token…');
        const tokenInfo = await JupiterClient.findToken(options.token);
        if (!tokenInfo) {
          throw new Error(`Token not found: ${options.token}`);
        }
        tokenMint = tokenInfo.address || tokenInfo.id;
        tokenSymbol = tokenInfo.symbol?.toUpperCase() ?? options.token.toUpperCase();
        tokenDecimals = typeof tokenInfo.decimals === 'number' ? tokenInfo.decimals : 6;
        console.log(`   Found: ${tokenSymbol} (${tokenMint}, ${tokenDecimals} decimals)`);
      }

      // Build exits
      const exits: ExitCondition[] = [];
      let priority = 1;

      if (options.takeProfit) {
        exits.push({
          name: `take_profit_${options.takeProfit}`,
          type: 'take_profit',
          multiplier: parseMultiplier(options.takeProfit),
          action: 'sell_all',
          priority: priority++,
          triggered: false,
        });
      }

      if (options.stopLoss) {
        exits.push({
          name: `stop_loss_${options.stopLoss}`,
          type: 'stop_loss',
          multiplier: parseMultiplier(options.stopLoss),
          action: 'sell_all',
          priority: priority++,
          triggered: false,
        });
      }

      if (options.timeLimit) {
        const durationSec = parseDuration(options.timeLimit);
        exits.push({
          name: `time_exit_${options.timeLimit}`,
          type: 'time_exit',
          duration_seconds: durationSec,
          action: 'sell_all',
          priority: priority++,
          triggered: false,
        });
      }

      if (exits.length === 0) {
        console.log('⚠️  No exits defined. Strategy will monitor but never auto-sell.');
        console.log('   Use --take-profit, --stop-loss, or --time-limit to add exits.');
      }

      const strategyId = StrategyEngine.generateStrategyId();
      const now = new Date().toISOString();

      const strategy: Strategy = {
        strategy_id: strategyId,
        agent_id: options.agentId,
        description: options.description || `${tokenSymbol} moonshot`,
        type: 'moonshot',
        status: 'pending',
        created_at: now,
        updated_at: now,
        entry: {
          token_mint: tokenMint,
          token_symbol: tokenSymbol,
          token_decimals: tokenDecimals,
          budget,
          currency: options.currency as 'SOL' | 'USDC',
          max_slippage_pct: parseFloat(options.maxSlippage),
        },
        exits,
        monitor_interval_seconds: parseInt(options.monitorInterval, 10),
      };

      await StrategyEngine.saveStrategy(strategy);

      await EventLogger.log(
        options.agentId,
        'strategy_created',
        'info',
        `Strategy created: ${strategyId}`,
        { strategy_id: strategyId, type: 'moonshot', token: tokenSymbol }
      );

      console.log(`\n✅ Strategy created: ${strategyId}`);
      console.log(`   Token:  ${tokenSymbol}`);
      console.log(`   Budget: ${options.budget} ${options.currency}`);
      console.log(`   Exits:  ${exits.map(e => e.name).join(', ') || 'none'}`);
      console.log(`\nTo start monitoring:\n  paw strategy run ${strategyId}\n`);
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// strategy dca
// ---------------------------------------------------------------------------
const dcaCmd = new Command('dca')
  .description('Create a DCA (dollar-cost averaging) strategy')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--token <symbol>', 'Token to buy repeatedly')
  .requiredOption('--budget <amount>', 'Budget per run (e.g. 0.1)')
  .requiredOption('--interval <duration>', 'Buy interval, e.g. 1d, 6h, 30m')
  .requiredOption('--runs <n>', 'Total number of buys')
  .option('--currency <currency>', 'Currency to spend', 'SOL')
  .option('--max-slippage <percent>', 'Max slippage %', '3')
  .option('--description <desc>', 'Human-readable description', '')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Create DCA Strategy');

      // Validate budget
      const budget = parseFloat(options.budget);
      if (isNaN(budget) || budget <= 0) {
        throw new Error(`Invalid budget "${options.budget}". Must be a positive number.`);
      }

      // Resolve token
      let tokenMint = JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS] ?? options.token;
      let tokenSymbol = options.token.toUpperCase();
      let tokenDecimals = 6;

      if (!JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS]) {
        console.log('🔍 Looking up token…');
        const tokenInfo = await JupiterClient.findToken(options.token);
        if (!tokenInfo) {
          throw new Error(`Token not found: ${options.token}`);
        }
        tokenMint = tokenInfo.address || tokenInfo.id;
        tokenSymbol = tokenInfo.symbol?.toUpperCase() ?? options.token.toUpperCase();
        tokenDecimals = typeof tokenInfo.decimals === 'number' ? tokenInfo.decimals : 6;
        console.log(`   Found: ${tokenSymbol} (${tokenMint}, ${tokenDecimals} decimals)`);
      }

      const intervalSec = parseDuration(options.interval);
      const runsTotal = parseInt(options.runs, 10);
      if (isNaN(runsTotal) || runsTotal <= 0) {
        throw new Error(`Invalid runs "${options.runs}". Must be a positive integer.`);
      }
      const strategyId = StrategyEngine.generateStrategyId();
      const now = new Date().toISOString();

      const dca: DCASchedule = {
        interval_seconds: intervalSec,
        runs_total: runsTotal,
        runs_completed: 0,
        next_run_at: now, // run immediately on first tick
      };

      const strategy: Strategy = {
        strategy_id: strategyId,
        agent_id: options.agentId,
        description: options.description || `DCA ${tokenSymbol} every ${options.interval} ×${runsTotal}`,
        type: 'dca',
        status: 'pending',
        created_at: now,
        updated_at: now,
        entry: {
          token_mint: tokenMint,
          token_symbol: tokenSymbol,
          token_decimals: tokenDecimals,
          budget,
          currency: options.currency as 'SOL' | 'USDC',
          max_slippage_pct: parseFloat(options.maxSlippage),
        },
        exits: [],
        dca,
        monitor_interval_seconds: Math.min(intervalSec, 60),
      };

      await StrategyEngine.saveStrategy(strategy);

      await EventLogger.log(
        options.agentId,
        'strategy_created',
        'info',
        `DCA strategy created: ${strategyId}`,
        { strategy_id: strategyId, type: 'dca', token: tokenSymbol, runs: runsTotal }
      );

      console.log(`\n✅ DCA strategy created: ${strategyId}`);
      console.log(`   Token:    ${tokenSymbol}`);
      console.log(`   Budget:   ${budget} ${options.currency} per run`);
      console.log(`   Interval: ${options.interval} (${intervalSec}s)`);
      console.log(`   Runs:     ${runsTotal}`);
      console.log(`\nTo start:\n  paw strategy run ${strategyId}\n`);
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// strategy list
// ---------------------------------------------------------------------------
const listCmd = new Command('list')
  .description('List all strategies')
  .option('--agent-id <id>', 'Filter by agent')
  .action(async (options) => {
    try {
      const strategies = await StrategyEngine.listStrategies(options.agentId);

      if (strategies.length === 0) {
        console.log('\n📟 No strategies found.\n');
        return;
      }

      const statusIcon: Record<string, string> = {
        pending: '⏳', active: '🟢', paused: '⏸ ',
        completed: '✅', cancelled: '🚫', failed: '❌',
      };

      console.log(`\n📟 Strategies (${strategies.length})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      for (const s of strategies) {
        const icon = statusIcon[s.status] ?? '?';
        console.log(
          `${icon} ${s.strategy_id.padEnd(32)} [${s.status.padEnd(9)}] ${s.agent_id} | ${s.description}`
        );
      }
      console.log('');
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// strategy status
// ---------------------------------------------------------------------------
const statusCmd = new Command('status')
  .description('Show detailed status of a strategy')
  .argument('<strategy-id>', 'Strategy ID')
  .action(async (strategyId: string) => {
    try {
      const strategy = await StrategyEngine.loadStrategy(strategyId);
      printStrategyStatus(strategy);
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// strategy run
// ---------------------------------------------------------------------------
const runCmd = new Command('run')
  .description('Start the monitoring loop for a strategy (runs in foreground)')
  .argument('<strategy-id>', 'Strategy ID')
  .action(async (strategyId: string) => {
    try {
      await StrategyRunner.run(strategyId, s => {
        // Minimal live output – full status on each tick
        if (['completed', 'cancelled', 'failed'].includes(s.status)) {
          printStrategyStatus(s);
        }
      });
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// strategy pause / resume / cancel
// ---------------------------------------------------------------------------
const pauseCmd = new Command('pause')
  .description('Pause a running strategy')
  .argument('<strategy-id>', 'Strategy ID')
  .action(async (strategyId: string) => {
    try {
      await StrategyEngine.pause(strategyId);
      console.log(`\n⏸  Strategy "${strategyId}" paused.\n`);
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

const resumeCmd = new Command('resume')
  .description('Resume a paused strategy')
  .argument('<strategy-id>', 'Strategy ID')
  .action(async (strategyId: string) => {
    try {
      await StrategyEngine.resume(strategyId);
      console.log(`\n▶️  Strategy "${strategyId}" resumed.\n`);
      console.log(`Start monitoring with:\n  paw strategy run ${strategyId}\n`);
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

const cancelCmd = new Command('cancel')
  .description('Cancel a strategy (no positions are automatically closed)')
  .argument('<strategy-id>', 'Strategy ID')
  .action(async (strategyId: string) => {
    try {
      await StrategyEngine.cancel(strategyId);

      const strategy = await StrategyEngine.loadStrategy(strategyId);
      await EventLogger.log(
        strategy.agent_id,
        'strategy_cancelled',
        'info',
        `Strategy cancelled: ${strategyId}`,
        { strategy_id: strategyId }
      );

      console.log(`\n🚫 Strategy "${strategyId}" cancelled.\n`);
      if (strategy.position && strategy.position.amount > 0) {
        console.log(`⚠️  Note: you still hold ${strategy.position.amount.toFixed(4)} ${strategy.entry.token_symbol}`);
        console.log(`   Manually sell with: paw sell --agent-id ${strategy.agent_id} --token ${strategy.entry.token_mint} --amount 100%\n`);
      }
    } catch (err) {
      console.error('\n❌ Error:', (err as Error).message);
      process.exit(1);
    }
  });

// ---------------------------------------------------------------------------
// Root strategy command
// ---------------------------------------------------------------------------
export const strategyCommand = new Command('strategy')
  .description('📟 Autonomous trading strategies (moonshot & DCA)')
  .addCommand(createCmd)
  .addCommand(dcaCmd)
  .addCommand(listCmd)
  .addCommand(statusCmd)
  .addCommand(runCmd)
  .addCommand(pauseCmd)
  .addCommand(resumeCmd)
  .addCommand(cancelCmd);
