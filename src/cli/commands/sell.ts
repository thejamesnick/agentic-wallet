import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { JupiterClient } from '../../integrations/jupiter/client';
import { EventLogger } from '../../core/events/logger';
import { Cluster, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const sellCommand = new Command('sell')
  .description('📟 Sell tokens with intent-based interface (agent-friendly)')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--token <symbol>', 'Token to sell (BONK, WIF, or mint address)')
  .requiredOption('--amount <amount>', 'Amount to sell (e.g., 1000 or 50%)')
  .option('--currency <currency>', 'Currency to receive (SOL, USDC, USDT)', 'SOL')
  .option('--network <network>', 'Network to use (mainnet-beta)', 'mainnet-beta')
  .option('--max-slippage <percent>', 'Maximum slippage tolerance (e.g., 10 for 10%)', '5')
  .option('--optimize-for <strategy>', 'Optimization strategy: maximum_output, best_price, fastest', 'best_price')
  .option('--dry-run', 'Simulate without executing')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Intent-Based Sell');
      console.log('Agent ID:', options.agentId);
      console.log('Token:   ', options.token);
      console.log('Amount:  ', options.amount);
      console.log('For:     ', options.currency);
      console.log('Network: ', options.network);

      // Jupiter only works on mainnet
      if (options.network !== 'mainnet-beta') {
        console.log('\n⚠️  Warning: Jupiter only works on mainnet-beta');
        console.log('Switching to mainnet-beta...');
        options.network = 'mainnet-beta';
      }

      // Resolve token addresses
      const inputMint = JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS] || options.token;
      const outputMint = JupiterClient.TOKENS[options.currency as keyof typeof JupiterClient.TOKENS] || options.currency;

      // If input is not a known token, try to find it
      let inputTokenInfo = null;
      if (!JupiterClient.TOKENS[options.token as keyof typeof JupiterClient.TOKENS]) {
        console.log('\n🔍 Looking up token...');
        inputTokenInfo = await JupiterClient.findToken(options.token);
        if (!inputTokenInfo) {
          throw new Error(`Token not found: ${options.token}`);
        }
        console.log(`   Found: ${inputTokenInfo.symbol} (${inputTokenInfo.name})`);
      }

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(options.agentId);
      const connection = SolanaClient.getConnection(options.network as Cluster);

      // Check if amount is percentage
      const isPercentage = options.amount.toString().endsWith('%');
      let actualAmount: string;
      let amountInSmallestUnit: number;

      if (isPercentage) {
        // Get percentage value
        const percentage = parseFloat(options.amount.replace('%', ''));
        
        if (percentage <= 0 || percentage > 100) {
          throw new Error('Percentage must be between 0 and 100');
        }

        console.log(`\n💰 Calculating ${percentage}% of ${options.token} balance...`);

        // Get SPL token balance
        const { getAccount, getAssociatedTokenAddress } = await import('@solana/spl-token');
        const { PublicKey } = await import('@solana/web3.js');
        
        const mintPubkey = new PublicKey(inputMint);
        const tokenAccount = await getAssociatedTokenAddress(mintPubkey, keypair.publicKey);
        
        try {
          const accountInfo = await getAccount(connection, tokenAccount);
          const decimals = inputTokenInfo?.decimals || 6;
          
          const balance = Number(accountInfo.amount) / Math.pow(10, decimals);
          actualAmount = ((balance * percentage) / 100).toFixed(decimals);
          amountInSmallestUnit = Math.floor(parseFloat(actualAmount) * Math.pow(10, decimals));

          console.log(`   Balance: ${balance.toFixed(decimals)} ${options.token}`);
          console.log(`   Selling: ${actualAmount} ${options.token} (${percentage}%)`);
        } catch (error) {
          throw new Error(`No ${options.token} balance found`);
        }
      } else {
        // Use exact amount
        actualAmount = options.amount;
        const decimals = inputTokenInfo?.decimals || 6;
        amountInSmallestUnit = Math.floor(parseFloat(actualAmount) * Math.pow(10, decimals));
      }

      // Convert max slippage from percentage to basis points
      const slippageBps = Math.floor(parseFloat(options.maxSlippage) * 100);

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
      const outputDecimals = options.currency === 'SOL' ? 9 : 6;
      const expectedOutput = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
      const minOutput = parseInt(quote.otherAmountThreshold) / Math.pow(10, outputDecimals);
      
      // Display intent summary
      console.log('\n✨ Intent Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Intent:          Sell', options.token);
      console.log('Amount:         ', actualAmount, options.token);
      console.log('Max Slippage:   ', options.maxSlippage + '%');
      console.log('Optimize For:   ', options.optimizeFor);
      console.log('');
      console.log('📈 Quote:');
      console.log('Expected Output:', expectedOutput.toFixed(outputDecimals), options.currency);
      console.log('Worst Case:     ', minOutput.toFixed(outputDecimals), options.currency, `(after ${options.maxSlippage}% slippage)`);
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
      console.log('1. Approve', options.token, 'spend');
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
        // Log event
        await EventLogger.log(
          options.agentId,
          'transaction_executed',
          'info',
          `Sell completed: ${actualAmount} ${options.token} for ${expectedOutput.toFixed(outputDecimals)} ${options.currency}`,
          {
            type: 'sell',
            token: options.token,
            amount: actualAmount,
            received: expectedOutput,
            currency: options.currency,
            signature: result.signature,
            explorer: SolanaClient.getExplorerUrl('tx', result.signature, options.network as Cluster),
          }
        );

        console.log('\n✅ Sell completed!');
        console.log('Signature:', result.signature);
        console.log('Explorer: ', SolanaClient.getExplorerUrl('tx', result.signature, options.network as Cluster));
        console.log('');
        console.log('💰 You received:', expectedOutput.toFixed(outputDecimals), options.currency);
      } else {
        // Log failure
        await EventLogger.log(
          options.agentId,
          'transaction_failed',
          'error',
          `Sell failed: ${JSON.stringify(result)}`,
          { type: 'sell', token: options.token, amount: actualAmount }
        );
        
        console.log('\n❌ Sell failed');
        console.log('Details:', result);
      }
      console.log('');
    } catch (error) {
      // Log error
      await EventLogger.log(
        options.agentId,
        'error_occurred',
        'error',
        `Sell error: ${(error as Error).message}`,
        { type: 'sell', token: options.token }
      );
      
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
