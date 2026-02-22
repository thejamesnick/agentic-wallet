import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import bs58 from 'bs58';
import * as readline from 'readline';

export const exportCommand = new Command('export')
  .description('📟 Export wallet private key')
  .argument('<agent-id>', 'Agent identifier')
  .option('--confirm <agent-id>', 'Skip confirmation prompt (for automation)')
  .action(async (agentId, options) => {
    try {
      // Security warning
      console.log('\n⚠️  WARNING: SENSITIVE DATA EXPORT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('This will display your wallet private key in PLAINTEXT!');
      console.log('Anyone with this information can STEAL YOUR FUNDS!');
      console.log('Only export in a secure, private location.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Confirmation
      if (!options.confirm || options.confirm !== agentId) {
        // Interactive confirmation
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question(`Type '${agentId}' to confirm export: `, resolve);
        });

        rl.close();

        if (answer !== agentId) {
          console.log('\n❌ Export cancelled - confirmation did not match\n');
          process.exit(1);
        }
      }

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(agentId);

      console.log('\n📟 PAW - Wallet Export');
      console.log('Agent ID:', agentId);
      console.log('');

      // Export as base58 encoded private key
      const privateKeyBase58 = bs58.encode(keypair.secretKey);
      
      console.log('🔑 Private Key (Base58):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(privateKeyBase58);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  Keep this secret and secure!');
      console.log('⚠️  Never share it with anyone!');
      console.log('💡 Import this into Phantom, Solflare, or any Solana wallet');

      console.log('');

      // Clear keypair from memory
      keypair.secretKey.fill(0);

    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
