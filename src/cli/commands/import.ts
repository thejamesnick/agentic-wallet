import { Command } from 'commander';
import { Keypair } from '@solana/web3.js';
import { WalletConfig } from '../../types/wallet';
import { EncryptionService } from '../../core/storage/encryption';
import { FileSystemStorage } from '../../core/storage/filesystem';
import bs58 from 'bs58';

export const importCommand = new Command('import')
  .description('📟 Import existing wallet from private key')
  .argument('<agent-id>', 'Agent identifier for the imported wallet')
  .requiredOption('--private-key <key>', 'Base58 encoded private key')
  .option('--network <network>', 'Network to use (devnet, mainnet-beta, testnet)', 'mainnet-beta')
  .action(async (agentId, options) => {
    try {
      // Check if wallet already exists
      if (await FileSystemStorage.exists(agentId)) {
        console.error(`\n❌ Error: Wallet for agent "${agentId}" already exists`);
        console.log('\nUse a different agent ID or delete the existing wallet first.');
        console.log('');
        process.exit(1);
      }

      console.log('\n📟 PAW - Import Wallet');
      console.log('Agent ID:', agentId);
      console.log('Network: ', options.network);
      console.log('');

      // Decode private key from base58
      let keypair: Keypair;
      try {
        const privateKeyBytes = bs58.decode(options.privateKey);
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } catch (error) {
        console.error('❌ Error: Invalid private key');
        console.log(`\nDetails: ${(error as Error).message}`);
        console.log('');
        process.exit(1);
      }

      // Generate passphrase for encryption
      const passphrase = EncryptionService.generatePassphrase();

      // Encrypt keypair
      const encryptedKeypair = EncryptionService.encrypt(keypair, passphrase);

      // Save encrypted keypair to disk
      await FileSystemStorage.saveKeypair(agentId, encryptedKeypair);

      // Save passphrase (encrypted with machine-specific key)
      await FileSystemStorage.savePassphrase(agentId, passphrase);

      // Save config
      await FileSystemStorage.saveConfig(agentId, {
        agentId,
        publicKey: keypair.publicKey.toBase58(),
        createdAt: new Date().toISOString(),
        network: options.network,
      });

      console.log('✅ Wallet imported successfully!\n');
      console.log('Agent ID:', agentId);
      console.log('Address: ', keypair.publicKey.toBase58());
      console.log('Network: ', options.network);
      console.log('');

      // Clear keypair from memory
      EncryptionService.clearKeypair(keypair);

    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
