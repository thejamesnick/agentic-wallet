import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
const qrcode = require('qrcode-terminal');

export const addressCommand = new Command('address')
  .description('📟 Show wallet address')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--qr', 'Display address as QR code')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw address <agent-id>');
        console.log('   or: paw address --agent-id <agent-id>');
        console.log('');
        process.exit(1);
      }

      const walletInfo = await WalletManager.getWalletInfo(agentId);

      console.log('\n📟 PAW - Wallet Address');
      console.log('Agent ID:', agentId);
      console.log('Address: ', walletInfo.address);

      if (options.qr) {
        console.log('\n📱 Scan QR Code:\n');
        qrcode.generate(walletInfo.address, { small: true });
      }

      console.log('');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
