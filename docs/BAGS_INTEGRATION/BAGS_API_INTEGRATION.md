# 🎯 PAW + Bags API Integration
## Autonomous Token Launch & Management for AI Agents

**Version:** 1.0  
**Date:** March 13, 2026  
**Status:** Proposed Integration  

---

## Executive Summary

The Bags API enables PAW agents to autonomously launch tokens, manage royalties, and claim fees on Solana. This transforms PAW from a trading wallet into a complete token ecosystem management platform.

**Key Innovation:** Agents can now create, launch, and manage entire token lifecycles without human intervention.

---

## What is Bags.fm?

**Bags** is a creator-focused Solana memecoin launchpad that:
- 🚀 Allows anyone to launch tokens
- 💰 Provides automatic royalty distribution
- 📊 Tracks trading volume and fees
- 📱 Offers mobile trading app
- 🔗 Exposes API for programmatic access

**Market Position:**
- $1B+ trading volume (last 30 days)
- $21M+ earned by creators
- Competes with Pump.fun, LetsBonk, Raydium LaunchLab
- Growing adoption in memecoin ecosystem

---

## Bags API Overview

### Base URL
```
https://public-api-v2.bags.fm/api/v1/
```

### Authentication
```bash
curl -H "x-api-key: YOUR_API_KEY" \
  https://public-api-v2.bags.fm/api/v1/endpoint
```

### Response Format
```json
{
  "success": true,
  "response": {
    // Response data
  }
}
```

---

## Core API Capabilities

### 1. Token Launch
**Endpoint:** `POST /token-launch/create-transaction`

**What it does:**
- Create new token on Solana
- Set metadata (name, symbol, description, image)
- Configure initial supply
- Execute initial purchase
- Set up fee sharing

**Parameters:**
```typescript
{
  name: string;              // Token name
  symbol: string;            // Token symbol
  supply: number;            // Total supply
  decimals: number;          // Token decimals
  description?: string;      // Token description
  image?: string;            // Token image URL
  initialBuy?: number;       // Initial purchase amount (SOL)
  feeShare?: {
    wallet: string;
    percentage: number;
  }[];
  partner?: string;          // Partner key for referrals
  partnerConfig?: object;    // Partner configuration
}
```

**Use Case:** Agents launching new meme coins autonomously

---

### 2. Fee Sharing & Royalties
**Endpoint:** `POST /token-launch/fee-share`

**What it does:**
- Configure who earns from trading activity
- Support up to 100 fee earners per token
- Distribute fees automatically
- Identify earners by social provider

**Features:**
- ✅ Multiple fee recipients (up to 100)
- ✅ Percentage-based distribution
- ✅ Social provider identification (Twitter, Kick, GitHub)
- ✅ Automatic royalty distribution
- ✅ Real-time fee tracking

**Parameters:**
```typescript
{
  tokenMint: string;
  feeEarners: {
    wallet?: string;
    socialProvider?: 'twitter' | 'kick' | 'github';
    username?: string;
    percentage: number;
  }[];
}
```

**Use Case:** Agents managing creator royalties and revenue sharing

---

### 3. Analytics & Monitoring
**Endpoint:** `GET /token-launch/claim-stats`

**What it does:**
- Retrieve token lifetime fees
- Get creator information
- Track trading volume
- Monitor fee distribution status

**Response:**
```json
{
  "tokenMint": "...",
  "totalFeesEarned": 123.45,
  "creatorAddress": "...",
  "tradingVolume": 50000,
  "feeDistribution": {
    "wallet1": 61.73,
    "wallet2": 61.72
  },
  "lastUpdated": "2026-03-13T10:00:00Z"
}
```

**Use Case:** Agents monitoring token performance and earnings

---

### 4. Fee Claiming
**Endpoint:** `POST /token-launch/claim-txs/v2`

**What it does:**
- Generate transactions to claim earned fees
- Support bulk claiming
- Automatic fee collection
- Multi-wallet distribution

**Parameters:**
```typescript
{
  tokenMint: string;
  claimers: string[];        // Wallet addresses to claim for
  destination?: string;      // Optional: redirect fees to different wallet
}
```

**Response:**
```json
{
  "transactions": [
    {
      "tx": "base64_encoded_transaction",
      "claimer": "wallet_address",
      "amount": 50.5
    }
  ]
}
```

**Use Case:** Agents automatically collecting and distributing earned fees

---

### 5. Real-Time Data Streaming
**SDK:** Bags Data Streaming SDK

**What it does:**
- Subscribe to new token launches
- Monitor token swaps
- Track price updates
- Watch maker actions

**Events:**
```typescript
- token_launch: New token created
- token_swap: Token traded
- price_update: Price changed
- maker_action: Maker activity
```

**Use Case:** Agents reacting to new launches in real-time

---

## PAW + Bags Integration Opportunities

### Integration 1: Autonomous Token Launch Agent

**Command:**
```bash
paw bags launch \
  --name "MyMeme" \
  --symbol "MEME" \
  --supply 1000000 \
  --decimals 6 \
  --description "The ultimate meme coin" \
  --image "https://example.com/image.png" \
  --initial-buy 0.5 \
  --fee-share alice:50,bob:50
```

**What happens:**
1. Agent creates token on Bags
2. Agent executes initial purchase (0.5 SOL)
3. Agent configures fee sharing (50% Alice, 50% Bob)
4. Token goes live on Bags launchpad
5. Agent returns token mint address

**Implementation:**
```typescript
class BagsLaunchCommand {
  async execute(options: LaunchOptions) {
    // 1. Validate parameters
    // 2. Call Bags API: POST /token-launch/create-transaction
    // 3. Sign transaction with agent keypair
    // 4. Submit to Solana
    // 5. Return token mint
  }
}
```

---

### Integration 2: Autonomous Fee Collection Agent

**Command:**
```bash
paw bags claim-fees \
  --token <mint> \
  --auto-claim \
  --distribute-to alice,bob,charlie
```

**What happens:**
1. Agent queries token fee stats
2. Agent generates claim transactions
3. Agent signs and submits transactions
4. Agent distributes fees to recipients
5. Agent reports earnings

**Implementation:**
```typescript
class BagsClaimCommand {
  async execute(options: ClaimOptions) {
    // 1. Get token stats: GET /token-launch/claim-stats
    // 2. Generate claim txs: POST /token-launch/claim-txs/v2
    // 3. Sign transactions
    // 4. Submit to Solana
    // 5. Distribute fees
    // 6. Report results
  }
}
```

---

### Integration 3: Launch Monitoring Agent

**Command:**
```bash
paw bags monitor \
  --watch-new-launches \
  --auto-buy-threshold 0.1 \
  --take-profit 2x \
  --stop-loss 0.5x
```

**What happens:**
1. Agent subscribes to new launch events
2. Agent monitors launches in real-time
3. Agent automatically buys promising tokens
4. Agent manages positions with take-profit/stop-loss
5. Agent reports performance

**Implementation:**
```typescript
class BagsMonitorCommand {
  async execute(options: MonitorOptions) {
    // 1. Subscribe to launch events (Bags SDK)
    // 2. Analyze new tokens
    // 3. Execute buys via Jupiter
    // 4. Manage positions
    // 5. Report metrics
  }
}
```

---

### Integration 4: Creator Royalty Agent

**Command:**
```bash
paw bags royalties \
  --token <mint> \
  --claim-and-distribute \
  --recipients alice:40,bob:30,charlie:30 \
  --auto-claim-interval 1h
```

**What happens:**
1. Agent monitors token fees
2. Agent claims fees on schedule
3. Agent distributes to recipients
4. Agent tracks distribution history
5. Agent sends notifications

**Implementation:**
```typescript
class BagsRoyaltiesCommand {
  async execute(options: RoyaltiesOptions) {
    // 1. Set up monitoring interval
    // 2. Query fee stats periodically
    // 3. Generate and sign claim txs
    // 4. Distribute to recipients
    // 5. Log distribution history
    // 6. Send notifications
  }
}
```

---

### Integration 5: Multi-Token Portfolio Agent

**Command:**
```bash
paw bags portfolio \
  --launch-tokens 5 \
  --initial-buy-per-token 0.2 \
  --fee-share-strategy equal \
  --auto-claim-earnings \
  --reinvest-profits
```

**What happens:**
1. Agent launches 5 tokens
2. Agent buys 0.2 SOL of each
3. Agent configures equal fee sharing
4. Agent monitors all tokens
5. Agent claims and reinvests earnings
6. Agent manages portfolio

**Implementation:**
```typescript
class BagsPortfolioCommand {
  async execute(options: PortfolioOptions) {
    // 1. Launch multiple tokens
    // 2. Execute initial buys
    // 3. Configure fee sharing
    // 4. Monitor portfolio
    // 5. Claim earnings
    // 6. Reinvest profits
    // 7. Report performance
  }
}
```

---

## Real-World Use Cases

### Use Case 1: Memecoin Launch Factory
**Scenario:** Agent launches 10 meme coins per day

```bash
# Day 1
paw bags launch --name "Meme1" --symbol "M1" --initial-buy 0.5 --fee-share creator:100
paw bags launch --name "Meme2" --symbol "M2" --initial-buy 0.5 --fee-share creator:100
# ... 8 more launches

# Monitor all tokens
paw bags monitor --watch-all --auto-buy-threshold 0.1

# Claim earnings daily
paw bags claim-fees --auto-claim --distribute-to creator
```

**Result:** Autonomous token factory generating daily revenue

---

### Use Case 2: Creator Royalty Platform
**Scenario:** Platform launches tokens for creators, manages royalties

```bash
# Creator Alice launches token
paw bags launch \
  --name "AliceCoin" \
  --symbol "ALICE" \
  --fee-share alice:70,platform:30

# Platform monitors and claims fees
paw bags royalties \
  --token <alice_mint> \
  --claim-and-distribute \
  --recipients alice:70,platform:30 \
  --auto-claim-interval 1h
```

**Result:** Automated creator economy platform

---

### Use Case 3: Yield Farming Agent
**Scenario:** Agent launches tokens, farms yields, reinvests

```bash
# Launch token
paw bags launch --name "YieldCoin" --symbol "YIELD" --initial-buy 1.0

# Monitor trading
paw bags monitor --token <mint> --track-volume

# Claim fees
paw bags claim-fees --token <mint> --auto-claim

# Reinvest earnings
paw swap --from SOL --to YIELD --amount <earned_fees>
```

**Result:** Self-sustaining yield farming agent

---

### Use Case 4: Multi-Agent Token Ecosystem
**Scenario:** Multiple agents managing different tokens

```bash
# Agent 1: Launch tokens
paw bags launch --name "Token1" --symbol "T1" --fee-share agent1:100

# Agent 2: Monitor launches
paw bags monitor --watch-new-launches --auto-buy-threshold 0.1

# Agent 3: Claim and distribute
paw bags royalties --claim-and-distribute --recipients agent1,agent2,treasury

# Agent 4: Rebalance portfolio
paw swap --from T1 --to SOL --amount 50%
```

**Result:** Coordinated multi-agent token ecosystem

---

## Implementation Roadmap

### Phase 1: MVP (Week 1-2)
**Goal:** Basic token launch capability

- [ ] Add Bags API client
- [ ] Implement `paw bags launch` command
- [ ] Support basic fee sharing
- [ ] Add documentation

**Commands:**
```bash
paw bags launch --name "Test" --symbol "TEST" --initial-buy 0.1
```

---

### Phase 2: Fee Management (Week 3-4)
**Goal:** Automated fee claiming and distribution

- [ ] Implement `paw bags claim-fees` command
- [ ] Add fee distribution logic
- [ ] Support multiple recipients
- [ ] Add fee tracking

**Commands:**
```bash
paw bags claim-fees --token <mint> --auto-claim
paw bags royalties --token <mint> --claim-and-distribute
```

---

### Phase 3: Monitoring (Week 5-6)
**Goal:** Real-time launch monitoring and trading

- [ ] Integrate Bags data streaming SDK
- [ ] Implement `paw bags monitor` command
- [ ] Add auto-buy logic
- [ ] Support take-profit/stop-loss

**Commands:**
```bash
paw bags monitor --watch-new-launches --auto-buy-threshold 0.1
```

---

### Phase 4: Advanced Features (Week 7-8)
**Goal:** Portfolio management and multi-token strategies

- [ ] Implement `paw bags portfolio` command
- [ ] Add multi-token management
- [ ] Support reinvestment strategies
- [ ] Add analytics dashboard

**Commands:**
```bash
paw bags portfolio --launch-tokens 5 --reinvest-profits
```

---

## Technical Architecture

### New Components

```
src/integrations/bags/
├── client.ts              # Bags API client
├── launch.ts              # Token launch logic
├── fees.ts                # Fee claiming logic
├── monitor.ts             # Launch monitoring
└── portfolio.ts           # Portfolio management

src/cli/commands/
├── bags-launch.ts         # paw bags launch
├── bags-claim.ts          # paw bags claim-fees
├── bags-monitor.ts        # paw bags monitor
└── bags-portfolio.ts      # paw bags portfolio
```

### API Client Example

```typescript
export class BagsClient {
  private apiKey: string;
  private baseUrl = 'https://public-api-v2.bags.fm/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async launchToken(params: LaunchParams): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/token-launch/create-transaction`,
      {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    const data = await response.json();
    return data.response.transaction;
  }

  async getClaimStats(tokenMint: string): Promise<ClaimStats> {
    const response = await fetch(
      `${this.baseUrl}/token-launch/claim-stats?tokenMint=${tokenMint}`,
      {
        headers: { 'x-api-key': this.apiKey },
      }
    );

    const data = await response.json();
    return data.response;
  }

  async generateClaimTransactions(
    tokenMint: string,
    claimers: string[]
  ): Promise<ClaimTransaction[]> {
    const response = await fetch(
      `${this.baseUrl}/token-launch/claim-txs/v2`,
      {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenMint, claimers }),
      }
    );

    const data = await response.json();
    return data.response.transactions;
  }
}
```

---

## Configuration

### Environment Variables

```bash
# .env
BAGS_API_KEY=your_api_key_here
BAGS_ENABLE_MONITORING=true
BAGS_AUTO_CLAIM_INTERVAL=3600  # 1 hour
BAGS_REINVEST_THRESHOLD=10     # Reinvest if earnings > 10 SOL
```

### Agent Configuration

```json
{
  "agentId": "token-launcher",
  "bags": {
    "enabled": true,
    "apiKey": "${BAGS_API_KEY}",
    "autoLaunch": {
      "enabled": true,
      "tokensPerDay": 5,
      "initialBuyPerToken": 0.5
    },
    "autoClaim": {
      "enabled": true,
      "interval": 3600,
      "recipients": ["alice", "bob"]
    },
    "monitoring": {
      "enabled": true,
      "watchNewLaunches": true,
      "autoBuyThreshold": 0.1
    }
  }
}
```

---

## Security Considerations

### API Key Management
- ✅ Store API key in environment variables
- ✅ Never commit API key to git
- ✅ Rotate keys regularly
- ✅ Use separate keys per agent

### Transaction Signing
- ✅ Sign transactions locally
- ✅ Never send private keys to Bags API
- ✅ Verify transaction before signing
- ✅ Use spending limits for safety

### Fee Distribution
- ✅ Validate recipient addresses
- ✅ Verify fee percentages sum to 100%
- ✅ Log all distributions
- ✅ Support multi-sig for large transfers

---

## Testing Strategy

### Unit Tests
```typescript
describe('BagsClient', () => {
  it('should launch token', async () => {
    const client = new BagsClient(apiKey);
    const tx = await client.launchToken({
      name: 'Test',
      symbol: 'TEST',
      supply: 1000000,
    });
    expect(tx).toBeDefined();
  });

  it('should claim fees', async () => {
    const stats = await client.getClaimStats(tokenMint);
    expect(stats.totalFeesEarned).toBeGreaterThan(0);
  });
});
```

### Integration Tests
```typescript
describe('Bags Integration', () => {
  it('should launch and monitor token', async () => {
    // 1. Launch token
    // 2. Execute initial buy
    // 3. Monitor trading
    // 4. Claim fees
    // 5. Verify distribution
  });
});
```

### E2E Tests
```typescript
describe('E2E: Token Lifecycle', () => {
  it('should complete full token lifecycle', async () => {
    // 1. Launch token
    // 2. Wait for trading
    // 3. Claim fees
    // 4. Distribute to recipients
    // 5. Verify on-chain state
  });
});
```

---

## Documentation

### User Guide
- Installation and setup
- Configuration guide
- Command reference
- Examples and tutorials

### Developer Guide
- API client documentation
- Integration patterns
- Testing guide
- Deployment guide

### API Reference
- Endpoint documentation
- Parameter descriptions
- Response formats
- Error handling

---

## Conclusion

The Bags API integration transforms PAW from a trading wallet into a complete token ecosystem management platform. Agents can now:

- ✅ Launch tokens autonomously
- ✅ Manage royalties automatically
- ✅ Claim fees on schedule
- ✅ Monitor launches in real-time
- ✅ Build multi-token portfolios

This opens up entirely new use cases for autonomous AI agents in DeFi:
- Token launch factories
- Creator royalty platforms
- Yield farming agents
- Multi-agent ecosystems

**The future of DeFAI is autonomous token creation and management.** 🚀

---

## Next Steps

1. **Get Bags API Key:** Register at https://bags.fm/developer
2. **Review API Docs:** https://docs.bags.fm/
3. **Start Implementation:** Begin with Phase 1 (MVP)
4. **Test on Devnet:** Launch test tokens
5. **Deploy to Mainnet:** Go live with real tokens

---

**Document Version:** 1.0  
**Last Updated:** March 13, 2026  
**Author:** PAW Team  
**Status:** Proposed Integration  
**Next Review:** After Phase 1 completion

