#!/usr/bin/env ts-node
/**
 * Claim Jupiter Referral Fees from PAW
 * Transfers accumulated fees to your main wallet
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PAW_CONFIG_DIR = path.join(os.homedir(), '.paw');
const REFERRAL_CONFIG_PATH = path.join(PAW_CONFIG_DIR, 'referral.json');

async function claimFees() {
  console.log('💰 Claiming Jupiter Referral Fees...\n');

  // Load referral config
  if (!fs.existsSync(REFERRAL_CONFIG_PATH)) {
    console.error('❌ Referral config not found!');
    console.log('💡 Run: yarn ts-node scripts/setup-referral.ts mainnet-beta');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(REFERRAL_CONFIG_PATH, 'utf8'));
  const network = config.network || 'mainnet-beta';
  const rpcUrl = network === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';

  const connection = new Connection(rpcUrl);
  console.log(`📡 Connected to ${network}`);

  // Load referral wallet (where fees are)
  const referralWalletPath = path.join(os.homedir(), '.config', 'solana', 'jup-referral.json');
  const mainWalletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  
  if (!fs.existsSync(referralWalletPath) && !fs.existsSync(mainWalletPath)) {
    console.error('❌ No wallet found!');
    process.exit(1);
  }

  const walletPath = fs.existsSync(referralWalletPath) ? referralWalletPath : mainWalletPath;
  const privateKeyArray = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
  
  console.log(`👛 Fee Wallet: ${wallet.publicKey.toBase58()}`);

  // Get destination wallet (where to send fees)
  const destinationAddress = process.argv[2];
  if (!destinationAddress) {
    console.error('\n❌ Please provide destination wallet address!');
    console.log('💡 Usage: yarn ts-node scripts/claim-fees.ts <destination-wallet>');
    console.log('💡 Example: yarn ts-node scripts/claim-fees.ts 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
    process.exit(1);
  }

  const destination = new PublicKey(destinationAddress);
  console.log(`📬 Destination: ${destination.toBase58()}\n`);

  let totalEarnings = 0;

  // Check and claim SOL fees
  console.log('🔍 Checking SOL fees...');
  const solAccount = new PublicKey(config.tokenAccounts.SOL);
  const solBalance = await connection.getBalance(solAccount);
  
  if (solBalance > 0) {
    const solAmount = solBalance / LAMPORTS_PER_SOL;
    console.log(`   Found: ${solAmount.toFixed(6)} SOL`);
    
    // Transfer SOL (leave some for rent)
    const rentExempt = await connection.getMinimumBalanceForRentExemption(0);
    const transferAmount = solBalance - rentExempt;
    
    if (transferAmount > 0) {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: solAccount,
          toPubkey: destination,
          lamports: transferAmount,
        })
      );
      
      const signature = await connection.sendTransaction(tx, [wallet]);
      await connection.confirmTransaction(signature);
      console.log(`   ✅ Transferred ${(transferAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      console.log(`   Tx: https://solscan.io/tx/${signature}`);
      totalEarnings += solAmount;
    }
  } else {
    console.log('   No SOL fees to claim');
  }

  // Check and claim USDC fees
  console.log('\n🔍 Checking USDC fees...');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const usdcAccount = new PublicKey(config.tokenAccounts.USDC);
  
  try {
    const usdcBalance = await connection.getTokenAccountBalance(usdcAccount);
    const usdcAmount = parseFloat(String(usdcBalance.value.uiAmount || '0'));
    
    if (usdcAmount > 0) {
      console.log(`   Found: ${usdcAmount.toFixed(6)} USDC`);
      
      // Get or create destination token account
      const destUsdcAccount = await getAssociatedTokenAddress(usdcMint, destination);
      
      const tx = new Transaction().add(
        createTransferInstruction(
          usdcAccount,
          destUsdcAccount,
          wallet.publicKey,
          BigInt(usdcBalance.value.amount)
        )
      );
      
      const signature = await connection.sendTransaction(tx, [wallet]);
      await connection.confirmTransaction(signature);
      console.log(`   ✅ Transferred ${usdcAmount.toFixed(6)} USDC`);
      console.log(`   Tx: https://solscan.io/tx/${signature}`);
      totalEarnings += usdcAmount;
    } else {
      console.log('   No USDC fees to claim');
    }
  } catch (error) {
    console.log('   No USDC fees to claim');
  }

  // Check and claim USDT fees
  console.log('\n🔍 Checking USDT fees...');
  const usdtMint = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
  const usdtAccount = new PublicKey(config.tokenAccounts.USDT);
  
  try {
    const usdtBalance = await connection.getTokenAccountBalance(usdtAccount);
    const usdtAmount = parseFloat(String(usdtBalance.value.uiAmount || '0'));
    
    if (usdtAmount > 0) {
      console.log(`   Found: ${usdtAmount.toFixed(6)} USDT`);
      
      // Get or create destination token account
      const destUsdtAccount = await getAssociatedTokenAddress(usdtMint, destination);
      
      const tx = new Transaction().add(
        createTransferInstruction(
          usdtAccount,
          destUsdtAccount,
          wallet.publicKey,
          BigInt(usdtBalance.value.amount)
        )
      );
      
      const signature = await connection.sendTransaction(tx, [wallet]);
      await connection.confirmTransaction(signature);
      console.log(`   ✅ Transferred ${usdtAmount.toFixed(6)} USDT`);
      console.log(`   Tx: https://solscan.io/tx/${signature}`);
      totalEarnings += usdtAmount;
    } else {
      console.log('   No USDT fees to claim');
    }
  } catch (error) {
    console.log('   No USDT fees to claim');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (totalEarnings > 0) {
    console.log(`🎉 Total claimed: ~$${totalEarnings.toFixed(2)} USD`);
    console.log(`📬 Sent to: ${destination.toBase58()}`);
  } else {
    console.log('💤 No fees to claim yet');
    console.log('💡 Fees accumulate as agents make swaps through PAW');
  }
  console.log('='.repeat(50) + '\n');
}

claimFees().catch(console.error);
