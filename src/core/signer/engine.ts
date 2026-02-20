import { Transaction, Keypair } from '@solana/web3.js';
import { WalletManager } from '../wallet/manager';
import { EncryptionService } from '../storage/encryption';

export class SignerEngine {
  /**
   * Sign a transaction with agent's keypair
   * Keypair is decrypted in memory, used for signing, then immediately cleared
   */
  static async signTransaction(
    agentId: string,
    transaction: Transaction,
    passphrase: string
  ): Promise<Transaction> {
    let keypair: Keypair | null = null;

    try {
      // Load and decrypt keypair (exists only in memory)
      keypair = await WalletManager.loadKeypair(agentId, passphrase);

      // Sign transaction
      transaction.sign(keypair);

      return transaction;
    } finally {
      // CRITICAL: Clear keypair from memory
      if (keypair) {
        EncryptionService.clearKeypair(keypair);
        keypair = null;
      }

      // Suggest garbage collection (not guaranteed but helps)
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Sign multiple transactions
   */
  static async signTransactions(
    agentId: string,
    transactions: Transaction[],
    passphrase: string
  ): Promise<Transaction[]> {
    let keypair: Keypair | null = null;

    try {
      keypair = await WalletManager.loadKeypair(agentId, passphrase);

      // Sign all transactions
      transactions.forEach((tx) => {
        if (keypair) {
          tx.sign(keypair);
        }
      });

      return transactions;
    } finally {
      if (keypair) {
        EncryptionService.clearKeypair(keypair);
        keypair = null;
      }

      if (global.gc) {
        global.gc();
      }
    }
  }
}
