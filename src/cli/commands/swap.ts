import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { JupiterClient } from '../../integrations/jupiter/client';
import { Cluster, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const swapCommand = new Command('swap')
  .description('📟 Swap tokens using Jupiter DEX')
  .requiredOption('--agent-id <id>', 'Agent identifier')
  .requiredOption('--from <token>', 'Input token (SOL, USDC, USDT, BONK or mint address)')
  .requiredOption('--to <token>', 'Output token (SOL, USDC, USDT, BONK or mint address)')
  .requiredOption('--amount <amount>', 'Amount to swap')
  .option('--network <network>', 'Network to use (devnet, mainnet-beta)', 'mainnet-beta')
  .option('--slippage <bps>', 'Slippage tolerance in basis points', '50')
  .action(async (options) => {
    try {
      console.log('\n📟 PAW - Token Swap');
      console.log('Agent ID:', options.agentId);
      console.log('From:    ', options.from);
      console.log('To:      ', options.to);
      console.log('Amount:  ', options.amount);
      console.log('Network: ', options.network);

      // Jupiter only works on mainnet
      if (options.network !== 'mainnet-beta') {
        console.log('\n⚠️  Warning: Jupiter only works on mainnet-beta');
        console.log('Switching to mainnet-beta...');
        options.network = 'mainnet-beta';
      }

      // Resolve token addresses
      const inputMint = JupiterClient.TOKENS[options.from as keyof typeof JupiterClient.TOKENS] || options.from;
      const outputMint = JupiterClient.TOKENS[options.to as keyof typeof JupiterClient.TOKENS] || options.to;

      // Convert amount to smallest unit
      let amount: number;
      if (options.from === 'SOL') {
        amount = Math.floor(parseFloat(options.amount) * LAMPORTS_PER_SOL);
      } else {
        // For other tokens, assume 6 decimals (USDC/USDT standard)
        amount = Math.floor(parseFloat(options.amount) * 1e6);
      }

      console.log('\nFetching quote from Jupiter...');
      const quote = await JupiterClient.getQuote(
        inputMint,
        outputMint,
        amount,
        parseInt(options.slippage)
      );

      // Display quote
      const outAmount = options.to === 'SOL'
        ? (parseInt(quote.outAmount) / LAMPORTS_PER_SOL).toFixed(6)
        : (parseInt(quote.outAmount) / 1e6).toFixed(6);

      console.log('\n📊 Quote:');
      console.log('Input:  ', options.amount, options.from);
      console.log('Output: ', outAmount, options.to);
      console.log('Price Impact:', quote.priceImpactPct, '%');
      console.log('Slippage:', options.slippage, 'bps');

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(options.agentId);

      // Get swap transaction
      console.log('\nPreparing swap transaction...');
      const swapTransaction = await JupiterClient.getSwapTransaction(
        quote,
        keypair.publicKey.toBase58()
      );

      // Execute swap
      console.log('Executing swap...');
      const connection = SolanaClient.getConnection(options.network as Cluster);
      const signature = await JupiterClient.executeSwap(
        connection,
        swapTransaction,
        keypair
      );

      console.log('\n✅ Swap completed!');
      console.log('Signature:', signature);
      console.log('Explorer:  https://explorer.solana.com/tx/' + signature);
      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
