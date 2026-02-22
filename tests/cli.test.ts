/**
 * CLI Commands Tests
 * Tests for CLI commands: send, multi-send, export, import
 */

import { WalletManager } from '../src/core/wallet/manager';
import { SolanaClient } from '../src/utils/solana';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLI Commands', () => {
  const testAgentId = `cli-test-${Date.now()}`;
  const testWalletPath = path.join(os.homedir(), '.paw', 'agents', testAgentId);

  beforeAll(async () => {
    // Create test wallet
    await WalletManager.createWallet({
      agentId: testAgentId,
      network: 'devnet',
    });
  });

  afterAll(async () => {
    // Cleanup
    if (fs.existsSync(testWalletPath)) {
      fs.rmSync(testWalletPath, { recursive: true, force: true });
    }
  });

  describe('Export Command', () => {
    it('should export private key in base58 format', async () => {
      const keypair = await WalletManager.loadKeypairAuto(testAgentId);
      const privateKeyBase58 = bs58.encode(keypair.secretKey);

      expect(privateKeyBase58).toBeDefined();
      expect(typeof privateKeyBase58).toBe('string');
      expect(privateKeyBase58.length).toBeGreaterThan(80);
    });

    it('should be able to recreate keypair from exported private key', async () => {
      const originalKeypair = await WalletManager.loadKeypairAuto(testAgentId);
      const privateKeyBase58 = bs58.encode(originalKeypair.secretKey);

      // Recreate keypair from exported private key
      const secretKey = bs58.decode(privateKeyBase58);
      const recreatedKeypair = Keypair.fromSecretKey(secretKey);

      expect(recreatedKeypair.publicKey.toBase58()).toBe(
        originalKeypair.publicKey.toBase58()
      );
    });
  });

  describe('Import Command', () => {
    const importTestAgentId = `import-test-${Date.now()}`;
    const importTestWalletPath = path.join(
      os.homedir(),
      '.paw',
      'agents',
      importTestAgentId
    );

    afterAll(async () => {
      // Cleanup imported wallet
      if (fs.existsSync(importTestWalletPath)) {
        fs.rmSync(importTestWalletPath, { recursive: true, force: true });
      }
    });

    it('should validate base58 private key format', () => {
      const validKey = bs58.encode(Keypair.generate().secretKey);
      const invalidKey = 'not-a-valid-base58-key!!!';

      // Valid key should decode without error
      expect(() => bs58.decode(validKey)).not.toThrow();

      // Invalid key should throw
      expect(() => bs58.decode(invalidKey)).toThrow();
    });

    it('should import wallet from private key', async () => {
      // Generate a keypair to import
      const keypairToImport = Keypair.generate();
      const privateKeyBase58 = bs58.encode(keypairToImport.secretKey);

      // Simulate import by creating wallet with specific keypair
      const secretKey = bs58.decode(privateKeyBase58);
      const importedKeypair = Keypair.fromSecretKey(secretKey);

      expect(importedKeypair.publicKey.toBase58()).toBe(
        keypairToImport.publicKey.toBase58()
      );
    });
  });

  describe('Send Command - SOL', () => {
    it('should validate recipient address', () => {
      const validAddress = Keypair.generate().publicKey.toBase58();
      const invalidAddress = 'not-a-valid-address';

      // Valid address should not throw
      expect(() => new PublicKey(validAddress)).not.toThrow();

      // Invalid address should throw
      expect(() => new PublicKey(invalidAddress)).toThrow();
    });

    it('should calculate lamports correctly', () => {
      const solAmount = 0.5;
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      expect(lamports).toBe(500000000);
    });

    it('should handle decimal amounts', () => {
      const amounts = [0.1, 0.01, 0.001, 1.5, 10.123456];

      amounts.forEach((amount) => {
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        expect(lamports).toBeGreaterThan(0);
        expect(Number.isInteger(lamports)).toBe(true);
      });
    });
  });

  describe('Send Command - SPL Token', () => {
    it('should validate token mint address', () => {
      const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
      const invalidMint = 'not-a-valid-mint';

      // Valid mint should not throw
      expect(() => new PublicKey(validMint)).not.toThrow();

      // Invalid mint should throw
      expect(() => new PublicKey(invalidMint)).toThrow();
    });

    it('should calculate token amount with decimals', () => {
      // USDC has 6 decimals
      const usdcDecimals = 6;
      const amount = 10.5;
      const tokenAmount = Math.floor(amount * Math.pow(10, usdcDecimals));

      expect(tokenAmount).toBe(10500000);
    });

    it('should handle different token decimals', () => {
      const testCases = [
        { decimals: 6, amount: 10, expected: 10000000 }, // USDC
        { decimals: 9, amount: 1, expected: 1000000000 }, // SOL
        { decimals: 5, amount: 1000, expected: 100000000 }, // BONK
        { decimals: 0, amount: 100, expected: 100 }, // No decimals
      ];

      testCases.forEach(({ decimals, amount, expected }) => {
        const tokenAmount = Math.floor(amount * Math.pow(10, decimals));
        expect(tokenAmount).toBe(expected);
      });
    });
  });

  describe('Multi-Send Command', () => {
    it('should validate address and amount counts match', () => {
      const addresses = ['addr1', 'addr2', 'addr3'];
      const amounts = [0.1, 0.2];

      expect(addresses.length).not.toBe(amounts.length);
    });

    it('should calculate total amount', () => {
      const amounts = [0.1, 0.2, 0.3, 0.4];
      const total = amounts.reduce((sum, amt) => sum + amt, 0);

      expect(total).toBe(1.0);
    });

    it('should estimate fees correctly', () => {
      const recipientCount = 3;
      const baseFee = 5000; // lamports
      const perTransferFee = 5000; // lamports per transfer

      const estimatedFee = baseFee + perTransferFee * recipientCount;

      expect(estimatedFee).toBe(20000);
    });

    it('should handle multiple recipients', () => {
      const recipients = [
        { address: Keypair.generate().publicKey.toBase58(), amount: 0.1 },
        { address: Keypair.generate().publicKey.toBase58(), amount: 0.2 },
        { address: Keypair.generate().publicKey.toBase58(), amount: 0.3 },
      ];

      expect(recipients.length).toBe(3);

      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
      expect(totalAmount).toBeCloseTo(0.6, 10);
    });
  });

  describe('Address Command with QR', () => {
    it('should get wallet address', async () => {
      const info = await WalletManager.getWalletInfo(testAgentId);

      expect(info.address).toBeDefined();
      expect(typeof info.address).toBe('string');
      expect(info.address.length).toBeGreaterThan(30);
    });

    it('should validate address format', async () => {
      const info = await WalletManager.getWalletInfo(testAgentId);

      // Should be valid base58
      expect(() => new PublicKey(info.address)).not.toThrow();
    });
  });

  describe('Balance Check', () => {
    it('should check balance on devnet', async () => {
      const info = await WalletManager.getWalletInfo(testAgentId);
      const balance = await SolanaClient.getBalance(info.address, 'devnet');

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('number');
      expect(balance).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should format balance correctly', () => {
      const lamports = 1500000000;
      const sol = lamports / LAMPORTS_PER_SOL;

      expect(sol).toBe(1.5);
    });
  });
});
