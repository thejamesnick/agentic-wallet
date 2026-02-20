import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { FileSystemStorage } from '../../core/storage/filesystem';
import { Cluster } from '@solana/web3.js';

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
        network = config.network || 'devnet';
      }

      const balance = await SolanaClient.getBalance(
        walletInfo.address,
        network as Cluster
      );

      console.log('\n📟 PAW - Balance');
      console.log('Agent ID:', agentId);
      console.log('Address: ', walletInfo.address);
      console.log('Balance: ', balance.toFixed(9), 'SOL');
      console.log('Network: ', network);
      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
