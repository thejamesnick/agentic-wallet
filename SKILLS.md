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

### Example 1: Check Balance Before Action

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

1. **Use intent-based commands (buy/sell) for easier automation**
2. **Always test with --dry-run before executing real trades**
3. **Check balance before transactions**
4. **Use --network flag to override config when needed**
5. **Monitor transaction history to verify operations**
6. **Start on devnet for testing, move to mainnet when ready**
7. **Use tokens command to see all assets**
8. **Set network in config to avoid repeating --network flag**
9. **Intent commands show confidence scores - use them for decision making**
10. **Percentage-based selling (50%, 100%) is easier than calculating exact amounts**

## File Locations

```bash
# Wallet data
~/.paw/agents/<agent-id>/wallet.enc
~/.paw/agents/<agent-id>/passphrase.enc
~/.paw/agents/<agent-id>/config.json

# All encrypted except config.json
```

---

**Built for speed, security, and autonomy** 📟

For issues or questions: https://github.com/pocketagent/paw
