import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { FileSystemStorage } from '../../core/storage/filesystem';
import { PublicKey, Cluster } from '@solana/web3.js';
import { PriceService } from '../../utils/price';
import { JupiterClient } from '../../integrations/jupiter/client';

export const balanceCommand = new Command('balance')
  .description('📟 Check wallet balance')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--network <network>', 'Network to use (overrides config)')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw balance <agent-id>');
        console.log('   or: paw balance --agent-id <agent-id>');
        console.log('');
        process.exit(1);
      }

      const walletInfo = await WalletManager.getWalletInfo(agentId);
      
      // Use network from options or fall back to config
      let network = options.network;
      if (!network) {
        const config = await FileSystemStorage.loadConfig(agentId);
        network = config.network || 'mainnet-beta';
      }

      const connection = SolanaClient.getConnection(network as Cluster);
      const publicKey = new PublicKey(walletInfo.address);

      // Get SOL balance
      const solBalanceLamports = await connection.getBalance(publicKey);
      const solBalance = solBalanceLamports / 1e9;

      // Get SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Collect all mints with positive balance
      const mints: string[] = [];
      const tokenBalances: Record<string, number> = {};

      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const tokenBalance = parsedInfo.tokenAmount.uiAmount || 0;

        if (tokenBalance > 0) {
          mints.push(mint);
          tokenBalances[mint] = tokenBalance;
        }
      }

      // Calculate total value in USD
      const SOL_PRICE = await PriceService.getSolPrice();
      let totalUSD = solBalance * SOL_PRICE;
      
      // Fetch prices for all tokens
      let tokenPrices: Record<string, number> = {};
      if (mints.length > 0) {
        // console.log('Fetching token prices...');
        tokenPrices = await JupiterClient.getTokenPrices(mints);
      }

      // Add SPL token values
      for (const mint of mints) {
        // Use price from Jupiter, or 0 if not found
        // For stablecoins (USDC/USDT), Jupiter returns ~1.00
        const price = tokenPrices[mint] || 0;
        const balance = tokenBalances[mint];
        
        totalUSD += balance * price;
      }

      const totalSOL = totalUSD / SOL_PRICE;

      console.log('\n📟 PAW - Balance');
      console.log('Agent ID:', agentId);
      console.log('Address: ', walletInfo.address);
      console.log('Network: ', network);
      console.log('');
      console.log('💰 Total Portfolio:');
      console.log('   ~' + totalSOL.toFixed(6), 'SOL');
      console.log('   ~' + totalUSD.toFixed(2), 'USD');
      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
