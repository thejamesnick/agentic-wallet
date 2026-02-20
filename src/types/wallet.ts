import { PublicKey } from '@solana/web3.js';

export interface WalletConfig {
  agentId: string;
  passphrase?: string;
  network?: 'devnet' | 'mainnet-beta' | 'testnet';
}

export interface WalletInfo {
  agentId: string;
  publicKey: PublicKey;
  address: string;
  createdAt: Date;
}

export interface Balance {
  sol: number;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
}

export interface EncryptedKeypair {
  salt: Buffer;
  iv: Buffer;
  encrypted: Buffer;
  authTag: Buffer;
}
