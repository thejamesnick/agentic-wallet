# 📟 PAW Skills for AI Agents

**PocketAgent Wallet (PAW)** - Agentic wallet for AI agents on Solana

## What is PAW?

PAW is a high-performance agentic wallet designed for AI agents to execute crypto operations at Telegram bot speed. Built with Helius RPC for maximum throughput.

Key capabilities:
- Create and manage wallets programmatically
- Sign transactions automatically (no human approval needed)
- Execute swaps in milliseconds via Jupiter DEX
- Hold SOL and any SPL token
- Real-time balance and transaction tracking

## Quick Command Reference

### Essential Commands

```bash
# Create wallet (defaults to mainnet-beta for real trading)
paw init <agent-id>

# Or specify network:
# paw init <agent-id> --network devnet  # For testing with free SOL
# paw init <agent-id> --network mainnet-beta  # For real trading (default)

# Import existing wallet from private key
paw import <agent-id> --private-key <base58-private-key>

# Get address
paw address <agent-id>

# Get address with QR code (for mobile wallet scanning)
paw address <agent-id> --qr

# Export private key (for backup or importing to other wallets)
# For humans - interactive (requires typing agent ID to confirm)
paw export <agent-id>
# For AI agents - automated (skips confirmation)
paw export <agent-id> --confirm <agent-id>

# Check total portfolio (SOL + tokens in USD)
paw balance <agent-id>

# List all tokens
paw tokens <agent-id>

# 🛡️ Guardrails - Spending limits and safety (NEW!)
paw guardrails <agent-id> --enable --profile micro    # Enable with micro profile ($100 wallets)
paw guardrails <agent-id> --enable --profile degen    # Enable with degen profile (meme trading)
paw guardrails <agent-id> --disable                   # Disable all limits
paw guardrails <agent-id> --show                      # Check status and spending

# 📊 Events - Event logging and webhooks (NEW!)
paw events <agent-id> --subscribe                     # Enable file-based event logging
paw events <agent-id> --subscribe --path ./my.log     # Custom log path
paw events <agent-id> --subscribe --format webhook --url <url>  # Enable webhooks
paw events <agent-id> --show                          # View recent events
paw events <agent-id> --show --limit 50               # Show last 50 events
paw events <agent-id> --unsubscribe                   # Disable logging
paw events <agent-id> --clear                         # Clear event log

# 🔔 Real-Time Balance Monitoring (NEW!)
paw monitor <agent-id>                                # Monitor wallet for balance changes
paw monitor <agent-id> --network mainnet-beta         # Monitor on specific network

# Send SOL
paw send <agent-id> --to <address> --amount <sol-amount>

# Send SPL tokens
paw send <agent-id> --to <address> --amount <token-amount> --token <mint-address>

# Send SOL to multiple addresses (batch payment)
paw multi-send <agent-id> --addresses <addr1>,<addr2> --amounts <amount1>,<amount2>

# Swap tokens (Jupiter DEX)
paw swap <agent-id> --from <token> --to <token> --amount <amount>
# Amount can be exact (0.5) or percentage (50%)

# 🆕 Intent-based buy (agent-friendly!)
paw buy --agent-id <agent-id> --token <symbol> --budget <amount> --currency <SOL|USDC|USDT>
# Example: paw buy --agent-id bot --token BONK --budget 0.2 --max-slippage 10

# 🆕 Intent-based sell (with percentage support!)
paw sell --agent-id <agent-id> --token <symbol> --amount <amount|percentage> --currency <SOL|USDC|USDT>
# Example: paw sell --agent-id bot --token BONK --amount 50% --currency SOL

# 🆕 Dry run mode (test without executing)
paw buy --agent-id <agent-id> --token BONK --budget 0.2 --dry-run
paw sell --agent-id <agent-id> --token BONK --amount 50% --dry-run

# View transaction history
paw history <agent-id>

# Configure wallet settings
paw config <agent-id> --network <devnet|mainnet-beta|testnet>
paw config <agent-id> --slippage <bps>
paw config <agent-id> --priority-fee <lamports>
paw config <agent-id> --show
```

## AI Agent Workflow Examples

### Example 1: Safe Trading with Guardrails, Events, and Real-Time Monitoring (NEW!)

```bash
# Enable guardrails for safety (micro profile for $100 wallet)
paw guardrails trading-bot-001 --enable --profile micro

# Enable webhook events
paw events trading-bot-001 --subscribe --format webhook --url http://localhost:3000/webhook

# Start real-time balance monitoring (in background)
paw monitor trading-bot-001 &

# Now your agent receives webhooks for:
# - Transactions executed by PAW (buy/sell/send)
# - Balance changes from external sources (someone sends you SOL)
# - Guardrail blocks
# - Errors

# Check limits
paw guardrails trading-bot-001 --show
# Shows: 0.1 SOL/tx, 0.5 SOL/hour, 2 SOL/day

# Try to buy within limits
paw buy --agent-id trading-bot-001 --token BONK --budget 0.05
# ✅ Allowed (under 0.1 SOL limit)
# Webhook fired: transaction_executed

# Try to buy over limits
paw buy --agent-id trading-bot-001 --token BONK --budget 0.2
# ❌ Blocked by guardrails!
# Webhook fired: guardrail_blocked

# Someone sends you SOL
# Webhook fired: balance_changed (detected by monitor)
```

### Example 2: Check Balance Before Action

```bash
# Get balance
paw balance trading-bot-001

# Output shows total portfolio:
# 💰 Total Portfolio:
#    ~1.649990 SOL
#    ~138.68 USD
```

### Example 2: Intent-Based Buy (NEW!)

```bash
# Buy BONK with 0.2 SOL budget
paw buy --agent-id trading-bot-001 --token BONK --budget 0.2 --max-slippage 10

# Output shows execution plan:
# ✨ Intent Summary:
# Intent:          Buy BONK
# Budget:          0.2 SOL
# Max Slippage:    10%
# 
# 📈 Quote:
# Expected Output: 58329.000000 BONK
# Worst Case:      52496.100000 BONK (after 10% slippage)
# Price Impact:    4.8%
# Confidence:      95%
#
# 📋 Execution Plan:
# 1. Approve SOL spend
# 2. Execute Jupiter swap
# 3. Confirm on Solana

# Test strategy first with dry run
paw buy --agent-id trading-bot-001 --token BONK --budget 0.2 --dry-run
```

### Example 3: Intent-Based Sell (NEW!)

```bash
# Sell 50% of BONK holdings
paw sell --agent-id trading-bot-001 --token BONK --amount 50% --currency SOL

# Sell exact amount
paw sell --agent-id trading-bot-001 --token BONK --amount 1000 --currency USDC

# Test before executing
paw sell --agent-id trading-bot-001 --token BONK --amount 50% --dry-run
```

### Example 4: Fast Token Swap (Classic Method)

```bash
# Swap exact amount: 0.1 SOL to USDC
paw swap trading-bot-001 --from SOL --to USDC --amount 0.1 --network mainnet-beta

# Swap percentage: 50% of SOL to USDC
paw swap trading-bot-001 --from SOL --to USDC --amount 50% --network mainnet-beta

# Swap 100% (exit position)
paw swap trading-bot-001 --from BONK --to USDC --amount 100% --network mainnet-beta

# Executes in <2 seconds using Jupiter aggregator
```

### Example 5: Send Payment

```bash
# Send 0.5 SOL to another agent
paw send agent-alice --to DJcVfT6dienfSbudJzZ82WN4EkVPgVaT18oBK971Yi2c --amount 0.5

# Send SPL tokens (e.g., USDC)
paw send agent-alice --to DJcVfT6dienfSbudJzZ82WN4EkVPgVaT18oBK971Yi2c --amount 10 --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Or send to another agent by ID (if you know their address)
paw send agent-alice --to <address> --amount 0.5
```

### Example 6: Monitor Transactions

```bash
# Check last 10 transactions
paw history trading-bot-001 --limit 10

# Shows table with:
# - Transaction signature
# - Type (send/receive)
# - Amount
# - Status (success/failed)
# - Timestamp
```

### Example 7: Multi-Agent Setup

```bash
# Create multiple agents
paw init agent-alice
paw init agent-bob
paw init trading-bot-001

# Each agent has independent wallet and config
# Stored in ~/.paw/agents/<agent-id>/
```

## Decision-Making Script for AI Agents

```bash
#!/bin/bash
# Autonomous trading agent with intent-based commands

AGENT="trading-bot-001"

# 1. Check portfolio
BALANCE=$(paw balance $AGENT)

# 2. Get transaction history
HISTORY=$(paw history $AGENT --limit 5)

# 3. Make decision based on balance
# If balance > 1 SOL, buy some BONK

# Test strategy first (dry run)
paw buy --agent-id $AGENT --token BONK --budget 0.5 --max-slippage 10 --dry-run

# Execute if dry run looks good
paw buy --agent-id $AGENT --token BONK --budget 0.5 --max-slippage 10

# 4. Monitor position
paw tokens $AGENT

# 5. Take profit when ready (sell 50%)
paw sell --agent-id $AGENT --token BONK --amount 50% --currency SOL

# 6. Verify transaction
paw history $AGENT --limit 1
```

## Performance Features

### Lightning Fast Execution
- **Helius RPC**: Premium RPC endpoints for mainnet and devnet
- **Connection Pooling**: Reuses connections for speed
- **Jupiter DEX**: Best price aggregation across all Solana DEXs
- **Real-time Prices**: Live SOL price from CoinGecko

### Speed Comparison
- Balance check: ~200ms
- Token swap: ~1-2 seconds
- Send transaction: ~500ms
- History fetch: ~300ms

Similar to Telegram trading bots - fast enough for real-time trading!

## Network Configuration

```bash
# Set network (persists in config)
paw config <agent-id> --network mainnet-beta

# Set default slippage for all swaps (in basis points)
paw config <agent-id> --slippage 1000  # 10% for meme coins

# Set default priority fee for faster execution
paw config <agent-id> --priority-fee 100000  # 100k lamports

# Set multiple settings at once
paw config <agent-id> --network mainnet-beta --slippage 1000 --priority-fee 100000

# View current configuration
paw config <agent-id> --show

# Networks:
# - devnet: Free testing (use faucet for SOL)
# - mainnet-beta: Real money, production
# - testnet: Testing network

# Override config for single command
paw balance <agent-id> --network mainnet-beta
paw swap <agent-id> --from SOL --to USDC --amount 0.1 --slippage 500
```

## Common Token Addresses

```bash
# Mainnet tokens
SOL: Native token (use "SOL")
USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
BONK: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

# Use token symbol or mint address
paw swap bot-1 --from SOL --to USDC --amount 0.1
```

## Security Model

### Double Encryption (Safe Inside a Safe)
1. **Layer 1**: Wallet keypair encrypted with AES-256-GCM + passphrase
2. **Layer 2**: Passphrase encrypted with machine-specific key

### Machine-Specific Key
Generated from:
- Hostname + Username + OS + Architecture + Home directory
- Wallet files are useless if stolen (only work on your machine)

⚠️ **IMPORTANT - Machine Binding:**
Your wallets are bound to THIS specific machine. If you:
- Change your hostname
- Change your username
- Reinstall your OS
- Move to a different computer

Your wallet files will NOT decrypt! Always export your private keys BEFORE making system changes:
```bash
paw export <agent-id>  # Backup your keys!
```

### Memory Safety
- Keypairs loaded only when needed
- Cleared from memory immediately after use
- No plaintext secrets on disk

## Getting Started on Devnet (Testing)

```bash
# 1. Create wallet on devnet for testing
paw init my-first-agent --network devnet

# 2. Get address
ADDRESS=$(paw address my-first-agent | grep "Address:" | awk '{print $2}')

# 3. Get free devnet SOL
solana airdrop 2 $ADDRESS --url devnet

# 4. Check balance
paw balance my-first-agent

# 5. Test send
paw send my-first-agent --to <another-address> --amount 0.1

# 6. Check history
paw history my-first-agent
```

## Use Cases for AI Agents

1. **High-Frequency Trading Bot**: Execute trades based on price signals
2. **Meme Coin Trading**: Snipe launches, scalp pumps, automated take-profit
3. **Portfolio Manager**: Rebalance assets automatically
4. **Payment Processor**: Handle recurring payments
5. **Arbitrage Bot**: Cross-DEX arbitrage opportunities
6. **Yield Optimizer**: Move funds to highest yield protocols
7. **Market Maker**: Provide liquidity and earn fees
8. **DCA Bot**: Dollar-cost averaging strategy

## Meme Trading Capabilities

PAW is built for fast, autonomous meme coin trading with intent-based commands:

### Quick Meme Trading Commands (Intent-Based - RECOMMENDED)

```bash
# Buy meme coin with budget and max slippage
paw buy --agent-id bot --token BONK --budget 0.5 --max-slippage 10

# Test buy first (dry run)
paw buy --agent-id bot --token BONK --budget 0.5 --max-slippage 10 --dry-run

# Sell 100% of meme coin (exit position)
paw sell --agent-id bot --token BONK --amount 100% --currency SOL --max-slippage 10

# Take 50% profit (sell half)
paw sell --agent-id bot --token BONK --amount 50% --currency USDC --max-slippage 10

# Buy with USDC instead of SOL
paw buy --agent-id bot --token WIF --budget 10 --currency USDC --max-slippage 15
```

### Classic Swap Commands (Still Supported)

```bash
# Buy meme coin with custom slippage
paw swap bot --from SOL --to <MEME_MINT> --amount 0.5 --slippage 1000

# Sell 100% of meme coin (exit position)
paw swap bot --from <MEME_MINT> --to SOL --amount 100% --slippage 1000 --priority-fee 100000

# Take 50% profit (sell half)
paw swap bot --from <MEME_MINT> --to USDC --amount 50% --slippage 1000

# Trade popular meme coins by symbol
paw swap bot --from SOL --to BONK --amount 0.5 --slippage 500
```

### Slippage Settings for Meme Coins

```bash
# Intent-based commands use percentage (easier!)
--max-slippage 5      # 5% - Normal meme trading
--max-slippage 10     # 10% - High volatility
--max-slippage 15     # 15% - Very high volatility
--max-slippage 20     # 20% - New launches

# Classic swap commands use basis points
--slippage 50     # 0.5% - Stable tokens
--slippage 100    # 1% - Normal trading
--slippage 500    # 5% - Meme coins (volatile)
--slippage 1000   # 10% - High volatility / low liquidity
--slippage 5000   # 50% - New launches / extreme volatility
```

### Priority Fees for Speed

```bash
--priority-fee 10000    # Normal speed
--priority-fee 50000    # Fast
--priority-fee 100000   # Very fast (meme launches)
--priority-fee 500000   # Ultra fast (competitive sniping)
```

### Example: Sniper Bot (Intent-Based)

```bash
#!/bin/bash
# Snipe new token launch with intent commands

AGENT="sniper-bot"
TARGET="BONK"  # Or any token symbol/mint

# Test strategy first
paw buy --agent-id $AGENT \
  --token $TARGET \
  --budget 0.5 \
  --max-slippage 20 \
  --dry-run

# Execute if dry run looks good
paw buy --agent-id $AGENT \
  --token $TARGET \
  --budget 0.5 \
  --max-slippage 20 \
  --optimize-for fastest

# Verify purchase
paw tokens $AGENT | grep $TARGET
```

### Example: Take Profit Bot (Intent-Based)

```bash
#!/bin/bash
# Sell when target hit

AGENT="profit-bot"
MEME="BONK"

# Sell 50% of holdings
paw sell --agent-id $AGENT \
  --token $MEME \
  --amount 50% \
  --currency SOL \
  --max-slippage 10

# Or sell all (100%)
paw sell --agent-id $AGENT \
  --token $MEME \
  --amount 100% \
  --currency SOL \
  --max-slippage 10
```

### Popular Meme Coins

```bash
BONK: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
WIF: EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm
POPCAT: 7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr

# Use symbol or mint address
paw swap bot --from SOL --to BONK --amount 0.5
```

### Why PAW is Fast for Meme Trading

- **Helius RPC**: Premium endpoints for fastest execution
- **Jupiter DEX**: Aggregates ALL Solana DEXs for best prices
- **Auto Priority Fees**: Transactions land faster during congestion
- **<2 Second Swaps**: Fast enough to snipe launches and catch pumps
- **No Human Approval**: Fully autonomous execution

For detailed meme trading strategies, see: `docs/MEME_TRADING_GUIDE.md`

## Command Output Format

All commands output clean, parseable text:

```bash
# Balance output
📟 PAW - Balance
Agent ID: trading-bot-001
Address:  HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D
Network:  devnet

💰 Total Portfolio:
   ~1.649990 SOL
   ~138.68 USD

# Easy to parse with grep/awk for automation
```

## Error Handling

PAW provides clear error messages:

```bash
# Insufficient balance
❌ Error: Insufficient balance. Required: 1.5 SOL, Available: 0.5 SOL

# Invalid address
❌ Error: Invalid recipient address

# Network issues
❌ Error: Failed to connect to Solana network
```

## Tips for AI Agents

1. **Use guardrails to protect from draining wallet (enable with --profile micro for small wallets)**
2. **Enable webhook events for real-time notifications (paw events <agent-id> --subscribe --format webhook --url <url>)**
3. **Use monitor command to detect incoming payments instantly (paw monitor <agent-id>)**
4. **Use intent-based commands (buy/sell) for easier automation**
5. **Always test with --dry-run before executing real trades**
6. **Check balance before transactions**
7. **Use --network flag to override config when needed**
8. **Monitor transaction history to verify operations**
9. **Start on devnet for testing, move to mainnet when ready**
10. **Use tokens command to see all assets**
11. **Set network in config to avoid repeating --network flag**
12. **Intent commands show confidence scores - use them for decision making**
13. **Percentage-based selling (50%, 100%) is easier than calculating exact amounts**
14. **Check guardrails spending with --show to see remaining limits**
15. **Run monitor in background for real-time balance change detection**
16. **Webhook events enable true event-driven agent workflows**

## Guardrails (Spending Limits)

### Risk Profiles

```bash
# Micro - Perfect for $100 wallets
paw guardrails bot --enable --profile micro
# Limits: 0.1 SOL/tx, 0.5 SOL/hour, 2 SOL/day

# Conservative - Cautious trading
paw guardrails bot --enable --profile conservative
# Limits: 0.5 SOL/tx, 2 SOL/hour, 10 SOL/day

# Moderate - Balanced (default)
paw guardrails bot --enable --profile moderate
# Limits: 2 SOL/tx, 10 SOL/hour, 50 SOL/day

# Degen - Meme coin trading
paw guardrails bot --enable --profile degen
# Limits: 10 SOL/tx, 50 SOL/hour, 200 SOL/day

# Whale - Big money
paw guardrails bot --enable --profile whale
# Limits: 100 SOL/tx, 500 SOL/hour, 2000 SOL/day
```

### Custom Limits

```bash
# Set custom limits
paw guardrails bot --enable --per-tx 0.5 --per-hour 2 --per-day 10

# Set approval threshold
paw guardrails bot --enable --approval-threshold 0.3
# Transactions above 0.3 SOL require approval

# Reserve SOL for gas
paw guardrails bot --enable --reserve-gas 0.001
```

### Managing Guardrails

```bash
# Check status and spending
paw guardrails bot --show

# Disable all limits
paw guardrails bot --disable

# Re-enable with different profile
paw guardrails bot --enable --profile degen
```

### Why Use Guardrails?

- **Protect from bugs** - Buggy agent code can't drain wallet
- **Test safely** - Try new strategies with limited risk
- **Prevent exploits** - Even if attacker gets access, damage is limited
- **Daily budgets** - Set spending limits for trading bots
- **Peace of mind** - Sleep well knowing wallet is protected

### Guardrails in Action

```bash
#!/bin/bash
# Safe trading bot with guardrails

AGENT="safe-bot"

# Enable micro profile (0.1 SOL/tx limit)
paw guardrails $AGENT --enable --profile micro

# Try to buy 0.05 SOL of BONK (allowed)
paw buy --agent-id $AGENT --token BONK --budget 0.05
# ✅ Transaction allowed

# Try to buy 0.2 SOL of BONK (blocked)
paw buy --agent-id $AGENT --token BONK --budget 0.2
# ❌ Blocked: Exceeds per-transaction limit

# Check spending
paw guardrails $AGENT --show
# Shows: 0.05 SOL spent, 0.45 SOL remaining this hour
```

## Event Logging (Visibility & Webhooks)

### File-Based Event Logging

```bash
# Enable logging for an agent
paw events bot --subscribe

# Custom log path
paw events bot --subscribe --path ./my-events.log

# Filter specific events
paw events bot --subscribe --events transaction_executed,error_occurred
```

### Webhook Events (Real-Time HTTP Notifications)

```bash
# Enable webhooks (agent receives HTTP POST for each event)
paw events bot --subscribe --format webhook --url https://myagent.com/webhook

# With custom retry and timeout
paw events bot --subscribe \
  --format webhook \
  --url http://localhost:3000/webhook \
  --retry 3 \
  --timeout 5000

# Filter specific events
paw events bot --subscribe \
  --format webhook \
  --url https://myagent.com/webhook \
  --events transaction_executed,error_occurred
```

### Webhook Payload

When an event occurs, PAW sends an HTTP POST to your webhook URL:

```http
POST https://myagent.com/webhook
Content-Type: application/json

{
  "event_id": "evt_1772375916023_6c44e214",
  "timestamp": "2026-03-01T14:38:36.023Z",
  "agent_id": "agent-alice",
  "type": "transaction_executed",
  "severity": "info",
  "message": "Send completed: 0.001 SOL to 9aQGpyZHw4L8YzQGvRA3cVqJz5FvPPdRzFvXYbqzKvXx",
  "payload": {
    "type": "send",
    "to": "9aQGpyZHw4L8YzQGvRA3cVqJz5FvPPdRzFvXYbqzKvXx",
    "amount": 0.001,
    "token": "SOL",
    "signature": "3qRXxpA7C8reodAigk2BnspQQGdFARs3Zt67JHXc9HH1BVpmjaiLBEsiQHmXye9fuREDVX2NkEKgeLTACUkppBUP",
    "explorer": "https://explorer.solana.com/tx/..."
  }
}
```

### Copy-Paste Webhook Server (Node.js)

Save this as `paw-webhook.js` and run with `node paw-webhook.js`:

```javascript
#!/usr/bin/env node
/**
 * 📟 PAW Webhook Server
 * 
 * Copy-paste ready webhook server for receiving PAW events.
 * Perfect for AI agents, Discord bots, monitoring dashboards, etc.
 * 
 * Setup:
 *   1. npm install express
 *   2. node paw-webhook.js
 *   3. paw events <agent-id> --subscribe --format webhook --url http://localhost:3000/webhook
 * 
 * Customize the handleEvent() function for your use case!
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🎯 Customize this function for your agent's logic
function handleEvent(event) {
  console.log('\n' + '='.repeat(60));
  console.log('📟 PAW Event Received');
  console.log('='.repeat(60));
  console.log('Event ID:  ', event.event_id);
  console.log('Agent:     ', event.agent_id);
  console.log('Type:      ', event.type);
  console.log('Severity:  ', event.severity);
  console.log('Message:   ', event.message);
  console.log('Timestamp: ', new Date(event.timestamp).toLocaleString());
  
  // Handle different event types
  switch (event.type) {
    case 'transaction_executed':
      console.log('\n✅ Transaction Success!');
      console.log('Signature: ', event.payload.signature);
      console.log('Explorer:  ', event.payload.explorer);
      // TODO: Post to Discord, update database, notify user, etc.
      break;
      
    case 'transaction_failed':
      console.log('\n❌ Transaction Failed!');
      console.log('Reason:    ', event.message);
      // TODO: Send alert, retry logic, log error, etc.
      break;
      
    case 'guardrail_blocked':
      console.log('\n🛡️  Transaction Blocked by Guardrails');
      console.log('Reason:    ', event.message);
      // TODO: Log security event, notify admin, etc.
      break;
      
    case 'error_occurred':
      console.log('\n⚠️  Error Occurred');
      console.log('Error:     ', event.message);
      // TODO: Send alert, log error, trigger recovery, etc.
      break;
      
    default:
      console.log('\nPayload:', JSON.stringify(event.payload, null, 2));
  }
  
  console.log('='.repeat(60) + '\n');
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  try {
    const event = req.body;
    
    // Validate event structure
    if (!event.event_id || !event.type || !event.agent_id) {
      return res.status(400).json({ 
        error: 'Invalid event structure' 
      });
    }
    
    // Respond immediately (PAW will retry if no 200)
    res.status(200).json({ 
      received: true, 
      event_id: event.event_id,
      timestamp: new Date().toISOString()
    });
    
    // Process event asynchronously
    setImmediate(() => {
      try {
        handleEvent(event);
      } catch (error) {
        console.error('Error handling event:', error);
      }
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'PAW Webhook Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n📟 PAW Webhook Server');
  console.log('='.repeat(60));
  console.log('Status:    Running');
  console.log('Port:      ' + PORT);
  console.log('Webhook:   http://localhost:' + PORT + '/webhook');
  console.log('Health:    http://localhost:' + PORT + '/health');
  console.log('='.repeat(60));
  console.log('\nConfigure PAW with:');
  console.log('  paw events <agent-id> --subscribe --format webhook --url http://localhost:' + PORT + '/webhook');
  console.log('\nWaiting for events...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📟 Shutting down PAW webhook server...');
  process.exit(0);
});
```

**Quick Start:**
```bash
# 1. Install express
npm install express

# 2. Save the code above as paw-webhook.js

# 3. Start the server
node paw-webhook.js

# 4. Configure PAW (in another terminal)
paw events my-agent --subscribe --format webhook --url http://localhost:3000/webhook

# 5. Test it!
paw send --agent-id my-agent --to <address> --amount 0.01
```

### Test Webhook Server

PAW includes a test webhook server for development:

```bash
# Start test server
node examples/test-webhook-server.js

# Configure PAW to use it
paw events bot --subscribe --format webhook --url http://localhost:3000/webhook

# Execute transaction to test
paw send --agent-id bot --to <address> --amount 0.01

# Check server output - you'll see the webhook event!
```

### Real-Time Balance Monitoring

Monitor your wallet for balance changes in real-time using Helius WebSocket:

```bash
# Enable webhooks first
paw events bot --subscribe --format webhook --url http://localhost:3000/webhook

# Start monitoring (keeps running in background)
paw monitor bot

# Now you'll receive webhooks for:
# - Balance changes from external sources (someone sends you SOL)
# - All transaction events (buy/sell/send)
# - Guardrail blocks and errors
```

**How it works:**
- Opens WebSocket connection to Helius
- Subscribes to account changes for your wallet
- Fires `balance_changed` webhook when balance updates
- Auto-reconnects if connection drops
- Works best on mainnet-beta (devnet WebSocket can be unreliable)

**Use cases:**
- Detect incoming payments instantly
- Monitor wallet activity in real-time
- Build event-driven workflows
- Automated responses to deposits

**Example: Payment Detection Bot**
```bash
# Terminal 1: Start webhook server
node paw-webhook.js

# Terminal 2: Start monitoring
paw events payment-bot --subscribe --format webhook --url http://localhost:3000/webhook
paw monitor payment-bot

# Your webhook receives balance_changed events instantly when:
# - Customer sends payment
# - Refund is received
# - Any external transaction affects your balance
```

### View Events

```bash
# Show recent events (last 20)
paw events bot --show

# Show more events
paw events bot --show --limit 100

# Check subscription status
paw events bot
```

### Real-Time Monitoring

```bash
# Tail the log file (in separate terminal)
tail -f ~/.paw/events/bot.log

# Parse with jq
cat ~/.paw/events/bot.log | jq '.type'
cat ~/.paw/events/bot.log | jq 'select(.severity=="error")'
```

### Event Types

- `transaction_executed` - Buy/sell/send completed successfully
- `transaction_failed` - Transaction failed to execute
- `balance_changed` - Balance updated (external deposits/withdrawals detected by monitor)
- `guardrail_blocked` - Transaction blocked by spending limits
- `guardrail_approved` - Transaction requires manual approval
- `error_occurred` - Error during operation
- `wallet_created` - New wallet initialized
- `config_updated` - Configuration changed

### Event Structure

```json
{
  "event_id": "evt_1772369761718_0c0bf2fa",
  "timestamp": "2026-03-01T12:56:01.718Z",
  "agent_id": "agent-alice",
  "type": "transaction_executed",
  "severity": "info",
  "message": "Send completed: 0.01 SOL to ...",
  "payload": {
    "type": "send",
    "to": "...",
    "amount": 0.01,
    "signature": "...",
    "explorer": "..."
  }
}
```

### Why Use Event Logging?

- **Real-time monitoring** - See what's happening as it happens
- **Webhooks for agents** - Receive HTTP POST notifications for event-driven workflows
- **Balance change detection** - Know instantly when you receive payments (with monitor)
- **Debugging** - Track down errors and failures
- **Auditing** - Keep records of all transactions
- **Automation** - Build event-driven workflows (webhooks make this easy!)
- **Compliance** - Maintain transaction logs

### Event Logging in Action

```bash
#!/bin/bash
# Monitored trading bot with event logging and real-time balance monitoring

AGENT="monitored-bot"

# Enable webhook events
paw events $AGENT --subscribe --format webhook --url http://localhost:3000/webhook

# Enable guardrails
paw guardrails $AGENT --enable --profile micro

# Start real-time balance monitoring in background
paw monitor $AGENT &
MONITOR_PID=$!

# Execute trades
paw buy --agent-id $AGENT --token BONK --budget 0.05

# Your webhook receives:
# 1. transaction_executed (from buy command)
# 2. balance_changed (when BONK arrives in wallet)

# Stop monitoring when done
kill $MONITOR_PID
```

## File Locations

```bash
# Wallet data
~/.paw/agents/<agent-id>/wallet.enc
~/.paw/agents/<agent-id>/passphrase.enc
~/.paw/agents/<agent-id>/config.json

# Guardrails
~/.paw/guardrails/<agent-id>.json

# Event logs
~/.paw/events/<agent-id>.log
~/.paw/events/config.json

# All encrypted except config files
```

---

**Built for speed, security, and autonomy** 📟

For issues or questions: https://github.com/pocketagent/paw
