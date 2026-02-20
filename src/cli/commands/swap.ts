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
  .option('--slippage <bps>', 'Slippage tolerance in basis points (default: 50, meme coins: 500-1000)', '50')
  .option('--priority-fee <lamports>', 'Priority fee in lamports for faster execution (default: auto)')
  .action(async (options) => {
    try {
      // Load config to get defaults
      const { FileSystemStorage } = await import('../../core/storage/filesystem');
      const config = await FileSystemStorage.loadConfig(options.agentId);

      // Use config defaults if not specified
      const slippage = options.slippage || config.defaultSlippage || 50;
      const priorityFee = options.priorityFee || config.defaultPriorityFee;

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
      
      // Load keypair first to get public key
      const keypair = await WalletManager.loadKeypairAuto(options.agentId);
      
      // Load referral config if available
      const referralConfig = JupiterClient.loadReferralConfig();
      
      const quote = await JupiterClient.getQuote(
        inputMint,
        outputMint,
        amount,
        parseInt(slippage.toString()),
        {
          userPublicKey: keypair.publicKey.toBase58(),
          referralAccount: referralConfig?.referralAccount,
          referralFee: referralConfig?.referralFee,
        }
      );

      // Display quote
      const outAmount = options.to === 'SOL'
        ? (parseInt(quote.outAmount) / LAMPORTS_PER_SOL).toFixed(6)
        : (parseInt(quote.outAmount) / 1e6).toFixed(6);

      console.log('\n📊 Quote:');
      console.log('Input:  ', options.amount, options.from);
      console.log('Output: ', outAmount, options.to);
      console.log('Price Impact:', quote.priceImpactPct, '%');
      console.log('Slippage:', slippage, 'bps', `(${(parseInt(slippage.toString()) / 100).toFixed(1)}%)`);
      if (quote.feeBps && referralConfig) {
        console.log('💰 Referral Fee:', quote.feeBps, 'bps', `(${(quote.feeBps / 100).toFixed(2)}%)`);
        console.log('   You earn:', `${((quote.feeBps * 0.8) / 100).toFixed(2)}%`);
      }
      if (priorityFee) {
        console.log('Priority Fee:', priorityFee, 'lamports');
      }

      // Execute swap using Ultra API
      console.log('\nExecuting swap...');
      const result = await JupiterClient.executeSwap(quote, keypair);

      if (result.status === 'Success') {
        console.log('\n✅ Swap completed!');
        console.log('Signature:', result.signature);
        console.log('Explorer:  https://explorer.solana.com/tx/' + result.signature);
        if (referralConfig) {
          console.log('\n💰 Referral fee earned! Run "paw claim-fees" to withdraw.');
        }
      } else {
        console.log('\n❌ Swap failed');
        console.log('Details:', result);
      }
      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
