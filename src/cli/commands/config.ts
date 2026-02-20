import { Command } from 'commander';
import { FileSystemStorage } from '../../core/storage/filesystem';

export const configCommand = new Command('config')
  .description('📟 View or update wallet configuration')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--network <network>', 'Set network (devnet, mainnet-beta, testnet)')
  .option('--show', 'Show current configuration')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw config <agent-id> [options]');
        console.log('   or: paw config --agent-id <agent-id> [options]');
        console.log('');
        process.exit(1);
      }

      // Check if wallet exists
      if (!(await FileSystemStorage.exists(agentId))) {
        console.error('\n❌ Error: Wallet not found for agent:', agentId);
        process.exit(1);
      }

      // Load current config
      const config = await FileSystemStorage.loadConfig(agentId);

      // If --show or no options, display config
      if (options.show || !options.network) {
        console.log('\n📟 PAW - Wallet Configuration');
        console.log('Agent ID:', config.agentId);
        console.log('Address: ', config.publicKey);
        console.log('Network: ', config.network);
        console.log('Created: ', new Date(config.createdAt).toLocaleString());
        console.log('');
        return;
      }

      // Update network
      if (options.network) {
        const validNetworks = ['devnet', 'mainnet-beta', 'testnet'];
        if (!validNetworks.includes(options.network)) {
          console.error('\n❌ Error: Invalid network. Must be one of:', validNetworks.join(', '));
          process.exit(1);
        }

        const oldNetwork = config.network;
        config.network = options.network;
        await FileSystemStorage.saveConfig(agentId, config);

        console.log('\n📟 PAW - Configuration Updated');
        console.log('Agent ID:', config.agentId);
        console.log('Network: ', `${oldNetwork} → ${options.network}`);
        console.log('');
        console.log('✅ Network changed successfully!');
        console.log('');
      }
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
