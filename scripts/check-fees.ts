#!/usr/bin/env ts-node
/**
 * Check Jupiter Referral Fees (without claiming)
 * Shows accumulated fees in SOL, USDC, USDT
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Table from 'cli-table3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PAW_CONFIG_DIR = path.join(os.homedir(), '.paw');
const REFERRAL_CONFIG_PATH = path.join(PAW_CONFIG_DIR, 'referral.json');

async function checkFees() {
  console.log('💰 Checking Jupiter Referral Fees...\n');

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
  console.log(`📡 Network: ${network}`);
  console.log(`📟 Referral Account: ${config.referralAccount}\n`);

  let totalUSD = 0;
  const fees: Array<{ token: string; amount: string; usd: string }> = [];

  // Check SOL fees
  try {
    const solAccount = new PublicKey(config.tokenAccounts.SOL);
    const solBalance = await connection.getBalance(solAccount);
    const solAmount = solBalance / LAMPORTS_PER_SOL;
    
    if (solAmount > 0) {
      const solUSD = solAmount * 82; // Approximate SOL price
      fees.push({
        token: 'SOL',
        amount: solAmount.toFixed(6),
        usd: solUSD.toFixed(2),
      });
      totalUSD += solUSD;
    }
  } catch (error) {
    // Skip if error
  }

  // Check USDC fees
  try {
    const usdcAccount = new PublicKey(config.tokenAccounts.USDC);
    const usdcBalance = await connection.getTokenAccountBalance(usdcAccount);
    const usdcAmount = parseFloat(String(usdcBalance.value.uiAmount || '0'));
    
    if (usdcAmount > 0) {
      fees.push({
        token: 'USDC',
        amount: usdcAmount.toFixed(6),
        usd: usdcAmount.toFixed(2),
      });
      totalUSD += usdcAmount;
    }
  } catch (error) {
    // Skip if error
  }

  // Check USDT fees
  try {
    const usdtAccount = new PublicKey(config.tokenAccounts.USDT);
    const usdtBalance = await connection.getTokenAccountBalance(usdtAccount);
    const usdtAmount = parseFloat(String(usdtBalance.value.uiAmount || '0'));
    
    if (usdtAmount > 0) {
      fees.push({
        token: 'USDT',
        amount: usdtAmount.toFixed(6),
        usd: usdtAmount.toFixed(2),
      });
      totalUSD += usdtAmount;
    }
  } catch (error) {
    // Skip if error
  }

  // Display table
  if (fees.length > 0) {
    const table = new Table({
      head: ['Token', 'Amount', 'USD Value'],
      colWidths: [15, 20, 15],
      style: {
        head: ['cyan'],
        border: ['gray'],
      },
    });

    fees.forEach(fee => {
      table.push([fee.token, fee.amount, `$${fee.usd}`]);
    });

    // Add total row
    table.push([
      { colSpan: 2, content: '💰 Total', hAlign: 'right' },
      `$${totalUSD.toFixed(2)}`,
    ]);

    console.log(table.toString());
    console.log('');
    console.log('💡 To claim fees: yarn ts-node scripts/claim-fees.ts <your-wallet-address>');
    console.log('');
  } else {
    console.log('💤 No fees accumulated yet');
    console.log('💡 Fees accumulate as users make swaps through PAW');
    console.log('');
  }
}

checkFees().catch(console.error);
