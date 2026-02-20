#!/usr/bin/env ts-node
/**
 * Check existing wallet and create a dedicated referral wallet
 */

import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SOLANA_CONFIG_DIR = path.join(os.homedir(), '.config', 'solana');
const MAIN_WALLET_PATH = path.join(SOLANA_CONFIG_DIR, 'id.json');
const REFERRAL_WALLET_PATH = path.join(SOLANA_CONFIG_DIR, 'jup-referral.json');

console.log('🔍 Checking Solana Wallets...\n');

// Check main wallet
if (fs.existsSync(MAIN_WALLET_PATH)) {
  try {
    const privateKeyArray = JSON.parse(fs.readFileSync(MAIN_WALLET_PATH, 'utf8'));
    const mainWallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    console.log('✅ Main Wallet Found:');
    console.log(`   Path: ${MAIN_WALLET_PATH}`);
    console.log(`   Address: ${mainWallet.publicKey.toBase58()}\n`);
  } catch (error) {
    console.log('❌ Error reading main wallet:', (error as Error).message);
  }
} else {
  console.log('❌ No main wallet found at:', MAIN_WALLET_PATH);
  console.log('💡 Create one with: solana-keygen new\n');
}

// Check/create referral wallet
if (fs.existsSync(REFERRAL_WALLET_PATH)) {
  try {
    const privateKeyArray = JSON.parse(fs.readFileSync(REFERRAL_WALLET_PATH, 'utf8'));
    const referralWallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    console.log('✅ Referral Wallet Found:');
    console.log(`   Path: ${REFERRAL_WALLET_PATH}`);
    console.log(`   Address: ${referralWallet.publicKey.toBase58()}\n`);
  } catch (error) {
    console.log('❌ Error reading referral wallet:', (error as Error).message);
  }
} else {
  console.log('📝 Creating new referral wallet...');
  
  // Create new keypair
  const referralWallet = Keypair.generate();
  
  // Save to file
  fs.mkdirSync(SOLANA_CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    REFERRAL_WALLET_PATH,
    JSON.stringify(Array.from(referralWallet.secretKey)),
    { mode: 0o600 }
  );
  
  console.log('✅ Referral Wallet Created:');
  console.log(`   Path: ${REFERRAL_WALLET_PATH}`);
  console.log(`   Address: ${referralWallet.publicKey.toBase58()}\n`);
}

console.log('💡 Next Steps:');
console.log('   1. Fund your referral wallet with ~0.02 SOL for setup fees');
console.log('   2. Run: yarn ts-node scripts/setup-referral.ts mainnet-beta');
console.log('   3. Start earning on every swap! 💰\n');

console.log('📋 To fund your wallet:');
console.log('   • Devnet (free): solana airdrop 1 <address> --url devnet');
console.log('   • Mainnet: Send SOL from an exchange or another wallet\n');
