import { Command } from 'commander';
import { WalletManager } from '../../core/wallet/manager';
import { SolanaClient } from '../../utils/solana';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, Cluster } from '@solana/web3.js';

export const multiSendCommand = new Command('multi-send')
  .description('📟 Send SOL to multiple addresses')
  .argument('<agent-id>', 'Agent identifier')
  .requiredOption('--addresses <addresses>', 'Comma-separated list of recipient addresses')
  .requiredOption('--amounts <amounts>', 'Comma-separated list of amounts (in SOL)')
  .option('--network <network>', 'Network to use (devnet, mainnet-beta, testnet)', 'mainnet-beta')
  .action(async (agentId, options) => {
    try {
      console.log('\n📟 PAW - Multi-Send');
      console.log('Agent ID:', agentId);
      console.log('Network: ', options.network);
      console.log('');

      // Parse addresses and amounts
      const addresses = options.addresses.split(',').map((addr: string) => addr.trim());
      const amounts = options.amounts.split(',').map((amt: string) => parseFloat(amt.trim()));

      // Validate
      if (addresses.length !== amounts.length) {
        console.error('❌ Error: Number of addresses must match number of amounts');
        console.log(`\nAddresses: ${addresses.length}, Amounts: ${amounts.length}`);
        console.log('');
        process.exit(1);
      }

      if (addresses.length === 0) {
        console.error('❌ Error: At least one recipient required');
        console.log('');
        process.exit(1);
      }

      // Validate addresses
      const recipients: PublicKey[] = [];
      for (let i = 0; i < addresses.length; i++) {
        try {
          recipients.push(new PublicKey(addresses[i]));
        } catch (error) {
          console.error(`❌ Error: Invalid address at position ${i + 1}: ${addresses[i]}`);
          console.log('');
          process.exit(1);
        }
      }

      // Calculate total
      const totalAmount = amounts.reduce((sum: number, amt: number) => sum + amt, 0);
      const totalLamports = Math.floor(totalAmount * LAMPORTS_PER_SOL);

      console.log('📋 Transfer Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      for (let i = 0; i < addresses.length; i++) {
        console.log(`${i + 1}. ${addresses[i]}`);
        console.log(`   Amount: ${amounts[i]} SOL`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total: ${totalAmount} SOL (${recipients.length} recipients)`);
      console.log('');

      // Load keypair
      const keypair = await WalletManager.loadKeypairAuto(agentId);

      // Check balance
      const connection = SolanaClient.getConnection(options.network as Cluster);
      const balance = await connection.getBalance(keypair.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      // Estimate fees (5000 lamports per transfer + base fee)
      const estimatedFees = (recipients.length * 5000 + 5000) / LAMPORTS_PER_SOL;
      const totalNeeded = totalAmount + estimatedFees;

      if (balanceSOL < totalNeeded) {
        console.error(`❌ Error: Insufficient balance`);
        console.log(`\nRequired: ${totalNeeded.toFixed(6)} SOL (${totalAmount} + ~${estimatedFees.toFixed(6)} fees)`);
        console.log(`Available: ${balanceSOL.toFixed(6)} SOL`);
        console.log('');
        process.exit(1);
      }

      console.log('💰 Balance: ', balanceSOL.toFixed(6), 'SOL');
      console.log('💸 Estimated fees: ~', estimatedFees.toFixed(6), 'SOL');
      console.log('');

      // Build transaction with multiple transfers
      const transaction = new Transaction();

      for (let i = 0; i < recipients.length; i++) {
        const lamports = Math.floor(amounts[i] * LAMPORTS_PER_SOL);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: recipients[i],
            lamports,
          })
        );
      }

      console.log('📤 Sending transactions...');

      // Send transaction
      const signature = await connection.sendTransaction(transaction, [keypair]);
      console.log('⏳ Confirming...');

      // Confirm transaction
      await connection.confirmTransaction(signature);

      console.log('\n✅ Multi-send completed!');
      console.log('Signature:', signature);
      console.log('Explorer:  https://explorer.solana.com/tx/' + signature);
      console.log('');

    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
