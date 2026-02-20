#!/usr/bin/env ts-node
/**
 * Setup Jupiter Referral Account for PAW
 * Run this once to create your referral account and start earning fees
 */

import { ReferralProvider } from '@jup-ag/referral-sdk';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const JUPITER_ULTRA_PROJECT = new PublicKey('DkiqsTrw1u1bYFumumC7sCG2S8K25qc2vemJFHyW2wJc');
const PAW_CONFIG_DIR = path.join(os.homedir(), '.paw');
const REFERRAL_CONFIG_PATH = path.join(PAW_CONFIG_DIR, 'referral.json');

// Top tokens to collect fees in
const FEE_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
];

async function setupReferralAccount() {
  console.log('🚀 Setting up Jupiter Referral Account for PAW...\n');

  // Get network
  const network = process.argv[2] || 'mainnet-beta';
  const rpcUrl = network === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';

  const connection = new Connection(rpcUrl);
  console.log(`📡 Connected to ${network}`);

  // Load or create wallet
  const walletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  if (!fs.existsSync(walletPath)) {
    console.error('❌ No Solana wallet found at ~/.config/solana/id.json');
    console.log('💡 Create one with: solana-keygen new');
    process.exit(1);
  }

  const privateKeyArray = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
  console.log(`👛 Wallet: ${wallet.publicKey.toBase58()}\n`);

  const provider = new ReferralProvider(connection);

  // Step 1: Create referral account
  console.log('📝 Step 1: Creating referral account...');
  const referralTx = await provider.initializeReferralAccountWithName({
    payerPubKey: wallet.publicKey,
    partnerPubKey: wallet.publicKey,
    projectPubKey: JUPITER_ULTRA_PROJECT,
    name: 'PAW-Wallet',
  });

  const referralAccountPubKey = referralTx.referralAccountPubKey;
  const existingAccount = await connection.getAccountInfo(referralAccountPubKey);

  if (!existingAccount) {
    const signature = await sendAndConfirmTransaction(connection, referralTx.tx, [wallet]);
    console.log(`✅ Referral account created: ${referralAccountPubKey.toBase58()}`);
    console.log(`   Transaction: https://solscan.io/tx/${signature}\n`);
  } else {
    console.log(`✅ Referral account already exists: ${referralAccountPubKey.toBase58()}\n`);
  }

  // Step 2: Create token accounts for fees
  console.log('💰 Step 2: Creating token accounts for fee collection...');
  const tokenAccounts: Record<string, string> = {};

  for (const token of FEE_TOKENS) {
    const mint = new PublicKey(token.mint);
    const tokenTx = await provider.initializeReferralTokenAccountV2({
      payerPubKey: wallet.publicKey,
      referralAccountPubKey: referralAccountPubKey,
      mint,
    });

    const existingTokenAccount = await connection.getAccountInfo(tokenTx.tokenAccount);

    if (!existingTokenAccount) {
      const signature = await sendAndConfirmTransaction(connection, tokenTx.tx, [wallet]);
      console.log(`✅ ${token.symbol} token account created: ${tokenTx.tokenAccount.toBase58()}`);
      console.log(`   Transaction: https://solscan.io/tx/${signature}`);
    } else {
      console.log(`✅ ${token.symbol} token account already exists: ${tokenTx.tokenAccount.toBase58()}`);
    }

    tokenAccounts[token.symbol] = tokenTx.tokenAccount.toBase58();
  }

  // Step 3: Save config
  console.log('\n💾 Step 3: Saving configuration...');
  const config = {
    referralAccount: referralAccountPubKey.toBase58(),
    referralFee: 50, // 0.5% fee (you keep 0.4%, Jupiter takes 0.1%)
    tokenAccounts,
    network,
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(PAW_CONFIG_DIR, { recursive: true });
  fs.writeFileSync(REFERRAL_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`✅ Config saved to: ${REFERRAL_CONFIG_PATH}\n`);

  // Summary
  console.log('🎉 Setup Complete!\n');
  console.log('📊 Your Referral Configuration:');
  console.log(`   Referral Account: ${config.referralAccount}`);
  console.log(`   Fee Rate: ${config.referralFee} bps (0.5%)`);
  console.log(`   Your Cut: 0.4% per swap`);
  console.log(`   Jupiter Cut: 0.1% per swap\n`);
  console.log('💡 Next Steps:');
  console.log('   1. PAW will automatically use this referral account for all swaps');
  console.log('   2. Fees accumulate in your token accounts');
  console.log('   3. Run "paw claim-fees" to withdraw your earnings\n');
  console.log('🚀 Start earning on every swap your agents make!');
}

setupReferralAccount().catch(console.error);
