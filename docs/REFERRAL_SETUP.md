# 💰 Earning Money from PAW (Founder Guide)

## How It Works

As the founder of PAW, you earn a percentage of EVERY swap made by ANY agent using your wallet!

**Revenue Model:**
- User swaps tokens using PAW
- Jupiter charges a small fee
- **You get 0.4% of every swap** 💸
- Jupiter keeps 0.1%
- User pays 0.5% total

**Example:**
- Agent swaps $1,000 worth of tokens
- You earn: $4
- Jupiter earns: $1
- User pays: $5 total fee

If 100 agents each do $10,000 in swaps per month:
- **You earn: $4,000/month** 🚀

---

## Setup (One-Time, 5 Minutes)

### Step 1: Install Dependencies

```bash
yarn add @jup-ag/referral-sdk
```

### Step 2: Run Setup Script

```bash
# Make sure you have SOL in your wallet for transaction fees
yarn ts-node scripts/setup-referral.ts mainnet-beta
```

This will:
1. Create your referral account on Jupiter
2. Create token accounts for collecting fees (SOL, USDC, USDT)
3. Save your referral account address

### Step 3: Add to Environment Variables

After running the setup, you'll get your referral account address. Add it to your `.env`:

```bash
PAW_REFERRAL_ACCOUNT=YourReferralAccountAddressHere
PAW_REFERRAL_FEE=50  # 50 bps = 0.5% (you keep 0.4%)
```

### Step 4: Build and Publish

```bash
yarn build
npm publish --access public
```

**That's it!** Now every swap made by any agent using PAW earns you money! 💰

---

## Claiming Your Earnings

### Option 1: Use Jupiter Dashboard
Visit https://referral.jup.ag and connect your wallet to see and claim fees.

### Option 2: Create a Claim Script

```typescript
import { ReferralProvider } from '@jup-ag/referral-sdk';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const wallet = Keypair.fromSecretKey(/* your private key */);
const provider = new ReferralProvider(connection);

const transactions = await provider.claimAllV2({
  payerPubKey: wallet.publicKey,
  referralAccountPubKey: new PublicKey('YOUR_REFERRAL_ACCOUNT'),
});

// Sign and send each transaction
for (const tx of transactions) {
  tx.sign([wallet]);
  const sig = await connection.sendRawTransaction(tx.serialize());
  console.log('Claimed:', sig);
}
```

---

## Maximizing Revenue

### 1. **Increase Adoption**
- More users = more swaps = more money
- Market PAW to AI agent developers
- Create tutorials and examples

### 2. **Adjust Fee (Optional)**
- Default: 50 bps (0.5%)
- You can go up to 100 bps (1%) if you provide extra value
- Lower fees = more competitive, higher fees = more revenue per swap

### 3. **Add Premium Features**
- Free tier: 0.5% fee
- Premium tier: 0.3% fee + monthly subscription
- Enterprise: Custom fees + support

### 4. **Track Analytics**
- Monitor total swap volume
- Track number of active agents
- Calculate monthly recurring revenue

---

## Revenue Projections

**Conservative (100 agents, $10k/month each):**
- Volume: $1M/month
- Your cut: $4,000/month
- Annual: $48,000/year

**Moderate (1,000 agents, $10k/month each):**
- Volume: $10M/month
- Your cut: $40,000/month
- Annual: $480,000/year

**Aggressive (10,000 agents, $10k/month each):**
- Volume: $100M/month
- Your cut: $400,000/month
- Annual: $4.8M/year 🚀

---

## Important Notes

1. **Fees are automatic** - No code needed in user's side
2. **Transparent** - Users see the fee in swap quotes
3. **Competitive** - 0.5% is standard for DEX aggregators
4. **Passive income** - Earn while you sleep
5. **Scalable** - More users = more revenue, no extra work

---

## Next Steps

1. ✅ Run setup script
2. ✅ Add referral account to code
3. ✅ Publish to npm
4. 📈 Market to AI developers
5. 💰 Watch the money roll in!

**Questions?** Check Jupiter's referral docs: https://station.jup.ag/docs/tool-kits/referral-program/
