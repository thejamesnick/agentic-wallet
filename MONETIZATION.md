# 💰 How to Make Money with PAW

## TL;DR

**You (the founder) earn 0.4% on EVERY swap made by ANY agent using PAW!**

No work needed from users. Just publish PAW to npm and watch the money roll in. 💸

---

## Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
yarn add @jup-ag/referral-sdk
```

### 2. Run Setup Script
```bash
yarn ts-node scripts/setup-referral.ts mainnet-beta
```

### 3. Copy Your Referral Account
The script will output something like:
```
Referral Account: ABC123xyz...
```

### 4. Add to Code
Open `src/integrations/jupiter/client.ts` and replace:
```typescript
const FOUNDER_REFERRAL_ACCOUNT = process.env.PAW_REFERRAL_ACCOUNT || null;
```

With:
```typescript
const FOUNDER_REFERRAL_ACCOUNT = 'ABC123xyz...'; // Your referral account
```

### 5. Publish
```bash
yarn build
npm publish --access public
```

**Done!** Now you earn on every swap! 🎉

---

## How Much Can You Earn?

### Conservative Estimate
- 100 agents using PAW
- Each does $10,000 in swaps/month
- **You earn: $4,000/month ($48k/year)**

### Moderate Estimate
- 1,000 agents using PAW
- Each does $10,000 in swaps/month
- **You earn: $40,000/month ($480k/year)**

### Aggressive Estimate
- 10,000 agents using PAW
- Each does $10,000 in swaps/month
- **You earn: $400,000/month ($4.8M/year)** 🚀

---

## Why This Works

1. **Passive Income** - Set it up once, earn forever
2. **Scales Automatically** - More users = more money
3. **No Churn** - Users don't "cancel" like SaaS
4. **Viral Growth** - Open source spreads naturally
5. **Competitive** - 0.5% fee is standard for DEX aggregators

---

## Example User Flow

```bash
# User installs PAW
npm install @pocketagent/paw

# User creates agent
paw init agent-alice

# User swaps tokens
paw swap agent-alice 1 SOL USDC
```

**Behind the scenes:**
- Swap goes through Jupiter
- Your referral account is automatically included
- You earn $0.40 per $100 swapped
- User pays standard 0.5% fee
- Everyone's happy! 💰

---

## Claiming Your Earnings

Visit https://referral.jup.ag and connect your wallet to claim fees anytime.

Fees accumulate in SOL, USDC, and USDT automatically.

---

## Read More

- [Full Setup Guide](docs/REFERRAL_SETUP.md)
- [Revenue Model Details](docs/REVENUE_MODEL.md)
- [Jupiter Referral Docs](https://station.jup.ag/docs/tool-kits/referral-program/)

---

## Questions?

**Q: Do users need to do anything?**  
A: Nope! It's automatic. They just use PAW normally.

**Q: Will users see the fee?**  
A: Yes, it shows in the swap quote. But 0.5% is standard for DEX aggregators.

**Q: Can I change the fee?**  
A: Yes! You can set it from 0.1% to 1%. Default is 0.5%.

**Q: When do I get paid?**  
A: Fees accumulate in real-time. Claim anytime via Jupiter dashboard.

**Q: Is this legal?**  
A: Yes! This is Jupiter's official referral program for integrators.

---

**Now go make that money! 💰🚀**
