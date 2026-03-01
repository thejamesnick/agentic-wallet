import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { JupiterClient } from '../../integrations/jupiter/client';
import { GuardrailsEngine } from '../../core/guardrails/engine';
import { EventLogger } from '../../core/events/logger';
import { Cluster, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const buyCommand = new Command('buy')
  .description('📟 Buy tokens with intent-based interface (agent-friendly)')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--token <symbol>', 'Token to buy (BONK, WIF, USDC, or mint address)')
  .requiredOption('--budget <amount>', 'Budget to spend (e.g., 0.2)')
  .option('--currency <currency>', 'Currency to spend (SOL, USDC, USDT)', 'SOL')
  .option('--network <network>', 'Network to use (mainnet-beta)', 'mainnet-beta')
  .option('--max-slippage <percent>', 'Maximum slippage tolerance (e.g., 10 for 10%)', '5')
  .option('--optimize-for <strategy>', 'Optimization strategy: maximum_tokens, best_price, fastest', 'best_price')
  .option('--dry-run', 'Simulate without executing')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Intent-Based Buy');
      console.log('Agent ID:', options.agentId);
      console.log('Token:   ', options.token);
      console.log('Budget:  ', options.budget, options.currency);
      console.log('Network: ', options.network);

      // Jupiter only works on mainnet
      if (options.network !== 'mainnet-beta') {
        console.log('\n⚠️  Warning: Jupiter only works on mainnet-beta');
        console.log('Switching to mainnet-beta...');
        options.network = 'mainnet-beta';
      }

      // Resolve token addresses
      const inputMint = JupiterClient.TOKENS[options.currency as keyof typeof JupiterClient.TOKENS] || options.currency;
      const outputMint = JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS] || options.token;

      // If output is not a known token, try to find it
      let outputTokenInfo = null;
      if (!JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS]) {
        console.log('\n🔍 Looking up token...');
        outputTokenInfo = await JupiterClient.findToken(options.token);
        if (!outputTokenInfo) {
          throw new Error(`Token not found: ${options.token}`);
        }
        console.log(`   Found: ${outputTokenInfo.symbol} (${outputTokenInfo.name})`);
      }

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(options.agentId);
      const connection = SolanaClient.getConnection(options.network as Cluster);

      // Calculate amount in smallest unit
      const budgetAmount = parseFloat(options.budget);
      let amountInSmallestUnit: number;

      if (options.currency === 'SOL') {
        amountInSmallestUnit = Math.floor(budgetAmount * LAMPORTS_PER_SOL);
      } else {
        const inputTokenInfo = await JupiterClient.findToken(options.currency);
        const decimals = inputTokenInfo ? inputTokenInfo.decimals : 6;
        amountInSmallestUnit = Math.floor(budgetAmount * Math.pow(10, decimals));
      }

      // Convert max slippage from percentage to basis points
      const slippageBps = Math.floor(parseFloat(options.maxSlippage) * 100);

      // Check guardrails before proceeding
      const guardrailCheck = await GuardrailsEngine.checkTransaction(
        options.agentId,
        budgetAmount,
        options.currency,
        'buy'
      );

      if (!guardrailCheck.allowed) {
        await EventLogger.log(
          options.agentId,
          'guardrail_blocked',
          'warning',
          `Buy blocked: ${guardrailCheck.reason}`,
          { token: options.token, budget: budgetAmount, currency: options.currency }
        );
        
        console.log('\n🛡️  Guardrails: Transaction blocked');
        console.log('Reason:', guardrailCheck.reason);
        console.log('');
        console.log('To adjust limits: paw guardrails', options.agentId, '--show');
        process.exit(1);
      }

      if (guardrailCheck.requiresApproval && !options.dryRun) {
        await EventLogger.log(
          options.agentId,
          'guardrail_approved',
          'info',
          `Buy requires approval: ${budgetAmount} ${options.currency}`,
          { token: options.token, budget: budgetAmount, currency: options.currency }
        );
        
        console.log('\n⚠️  Guardrails: This transaction requires approval');
        console.log('Amount exceeds approval threshold');
        console.log('');
        console.log('To proceed, use: --force flag (coming soon)');
        console.log('Or adjust threshold: paw guardrails', options.agentId, '--approval-threshold <amount>');
        process.exit(1);
      }

      console.log('\n📊 Fetching quote from Jupiter...');
      
      // Load referral config
      const referralConfig = JupiterClient.loadReferralConfig();
      
      const quote = await JupiterClient.getQuote(
        inputMint,
        outputMint,
        amountInSmallestUnit,
        slippageBps,
        {
          userPublicKey: keypair.publicKey.toBase58(),
          referralAccount: referralConfig?.referralAccount,
          referralFee: referralConfig?.referralFee,
        }
      );

      // Calculate output amounts
      const outputDecimals = outputTokenInfo?.decimals || 6;
      const expectedOutput = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
      const minOutput = parseInt(quote.otherAmountThreshold) / Math.pow(10, outputDecimals);
      
      // Display intent summary
      console.log('\n✨ Intent Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Intent:          Buy', options.token);
      console.log('Budget:         ', budgetAmount, options.currency);
      console.log('Max Slippage:   ', options.maxSlippage + '%');
      console.log('Optimize For:   ', options.optimizeFor);
      console.log('');
      console.log('📈 Quote:');
      console.log('Expected Output:', expectedOutput.toFixed(outputDecimals), options.token);
      console.log('Worst Case:     ', minOutput.toFixed(outputDecimals), options.token, `(after ${options.maxSlippage}% slippage)`);
      console.log('Price Impact:   ', quote.priceImpactPct + '%');
      
      // Calculate confidence based on price impact
      let confidence = 0.95;
      const priceImpact = parseFloat(quote.priceImpactPct);
      if (priceImpact > 5) confidence = 0.7;
      else if (priceImpact > 2) confidence = 0.85;
      
      console.log('Confidence:     ', (confidence * 100).toFixed(0) + '%');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Execution plan
      console.log('\n📋 Execution Plan:');
      console.log('1. Approve', options.currency, 'spend');
      console.log('2. Execute Jupiter swap');
      console.log('3. Confirm on Solana');
      console.log('');
      console.log('Estimated Gas: ~0.000005 SOL');
      console.log('Requires Approval: false (under threshold)');

      // Dry run mode
      if (options.dryRun) {
        console.log('\n🧪 DRY RUN - No transaction executed');
        console.log('');
        process.exit(0);
      }

      // Execute swap
      console.log('\n⚡ Executing swap...');
      const result = await JupiterClient.executeSwap(quote, keypair);

      if (result.status === 'Success') {
        // Record transaction in guardrails
        await GuardrailsEngine.recordTransaction(
          options.agentId,
          budgetAmount,
          options.currency,
          'buy',
          guardrailCheck.requiresApproval
        );

        // Log event
        await EventLogger.log(
          options.agentId,
          'transaction_executed',
          'info',
          `Buy completed: ${expectedOutput.toFixed(outputDecimals)} ${options.token}`,
          {
            type: 'buy',
            token: options.token,
            budget: budgetAmount,
            currency: options.currency,
            received: expectedOutput,
            signature: result.signature,
            explorer: SolanaClient.getExplorerUrl('tx', result.signature, options.network as Cluster),
          }
        );

        console.log('\n✅ Buy completed!');
        console.log('Signature:', result.signature);
        console.log('Explorer: ', SolanaClient.getExplorerUrl('tx', result.signature, options.network as Cluster));
        console.log('');
        console.log('💰 You received:', expectedOutput.toFixed(outputDecimals), options.token);
      } else {
        // Log failure
        await EventLogger.log(
          options.agentId,
          'transaction_failed',
          'error',
          `Buy failed: ${JSON.stringify(result)}`,
          { type: 'buy', token: options.token, budget: budgetAmount, currency: options.currency }
        );
        
        console.log('\n❌ Buy failed');
        console.log('Details:', result);
      }
      console.log('');
    } catch (error) {
      // Log error
      await EventLogger.log(
        options.agentId,
        'error_occurred',
        'error',
        `Buy error: ${(error as Error).message}`,
        { type: 'buy', token: options.token }
      );
      
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
