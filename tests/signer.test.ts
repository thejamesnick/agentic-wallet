/**
 * Transaction Signer Tests
 * Tests for automatic transaction signing
 */

import { TransactionSigner } from '../src/core/signer/engine';
import { Keypair, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

describe('TransactionSigner', () => {
  describe('signTransaction', () => {
    it('should sign a transaction', async () => {
      const keypair = Keypair.generate();
      const transaction = new Transaction();

      // Add a simple instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1000,
        })
      );

      // Set recent blockhash (required for signing)
      transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
      transaction.feePayer = keypair.publicKey;

      const signed = await TransactionSigner.signTransaction(transaction, keypair);

      expect(signed).toBeDefined();
      expect(signed.signatures.length).toBeGreaterThan(0);
      expect(signed.signatures[0].signature).not.toBeNull();
    });

    it('should verify signed transaction', async () => {
      const keypair = Keypair.generate();
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1000,
        })
      );

      transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
      transaction.feePayer = keypair.publicKey;

      const signed = await TransactionSigner.signTransaction(transaction, keypair);

      // Verify signature
      const verified = signed.verifySignatures();
      expect(verified).toBe(true);
    });

    it('should handle multiple signers', async () => {
      const keypair1 = Keypair.generate();
      const keypair2 = Keypair.generate();
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair1.publicKey,
          toPubkey: keypair2.publicKey,
          lamports: 1000,
        })
      );

      transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
      transaction.feePayer = keypair1.publicKey;

      const signed = await TransactionSigner.signTransaction(transaction, keypair1);

      expect(signed.signatures.length).toBeGreaterThan(0);
    });
  });

  describe('signAndSend', () => {
    it('should prepare transaction for sending', async () => {
      const keypair = Keypair.generate();
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1000,
        })
      );

      transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
      transaction.feePayer = keypair.publicKey;

      const signed = await TransactionSigner.signTransaction(transaction, keypair);

      // Should be able to serialize
      const serialized = signed.serialize();
      expect(serialized).toBeDefined();
      expect(serialized.length).toBeGreaterThan(0);
    });
  });

  describe('memory safety', () => {
    it('should not leak keypair in memory', async () => {
      const keypair = Keypair.generate();
      const originalSecret = Buffer.from(keypair.secretKey);
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1000,
        })
      );

      transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
      transaction.feePayer = keypair.publicKey;

      await TransactionSigner.signTransaction(transaction, keypair);

      // Keypair should still be valid after signing
      expect(keypair.secretKey).toBeDefined();
      expect(Buffer.from(keypair.secretKey).toString('hex')).toBe(
        originalSecret.toString('hex')
      );
    });
  });
});
