# 📟 PAW CLI Reference

Complete command reference for PocketAgent Wallet

## Installation

```bash
npm install -g @pocketagent/paw
```

## Command Syntax

PAW supports two syntax styles:

**Simple (Recommended):**
```bash
paw <command> <agent-id> [options]
```

**Explicit (Alternative):**
```bash
paw <command> --agent-id <agent-id> [options]
```

Both work identically - use whichever you prefer!

---

## Commands

### `init` - Create New Wallet

Create a new wallet for an AI agent.

**Syntax:**
```bash
paw init <agent-id> [options]
```

**Options:**
- `--passphrase <passphrase>` - Custom passphrase (auto-generated if not provided)
- `--network <network>` - Network to use (devnet, mainnet-beta, testnet) [default: devnet]

**Examples:**
```bash
# Create wallet on devnet (default)
paw init trading-bot-001

# Create wallet on mainnet
paw init trading-bot-001 --network mainnet-beta

# Create wallet with custom passphrase
paw init trading-bot-001 --passphrase "my-secure-passphrase"
```

**Output:**
```
📟 PAW - PocketAgent Wallet
Creating wallet for agent...

✅ Wallet created successfully!

Agent ID: trading-bot-001
Address:  HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D
Network:  devnet
Created:  2026-02-20T08:45:37.696Z
```

---

### `address` - Show Wallet Address

Display the wallet address for an agent.

**Syntax:**
```bash
paw address <agent-id>
```

**Examples:**
```bash
paw address trading-bot-001
```

**Output:**
```
📟 PAW - Wallet Address
Agent ID: trading-bot-001
Address:  HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D
```

---

### `balance` - Check Balance

Check SOL balance for an agent's wallet.

**Syntax:**
```bash
paw balance <agent-id> [options]
```

**Options:**
- `--network <network>` - Override config network

**Examples:**
```bash
# Check balance on configured network
paw balance trading-bot-001

# Check balance on specific network
paw balance trading-bot-001 --network mainnet-beta
```

**Output:**
```
📟 PAW - Balance
Agent ID: trading-bot-001
Address:  HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D
Balance:  1.649990000 SOL
Network:  devnet
```

---

### `send` - Send SOL

Send SOL to another address.

**Syntax:**
```bash
paw send <agent-id> --to <address> --amount <amount> [options]
```

**Options:**
- `--to <address>` - Recipient address (required)
- `--amount <amount>` - Amount in SOL (required)
- `--network <network>` - Override config network

**Examples:**
```bash
# Send 0.1 SOL
paw send trading-bot-001 --to DJcVfT6dienfSbudJzZ82WN4EkVPgVaT18oBK971Yi2c --amount 0.1

# Send on specific network
paw send trading-bot-001 --to <address> --amount 0.5 --network mainnet-beta
```

**Output:**
```
📟 PAW - Send Transaction
Agent ID: trading-bot-001
To:       DJcVfT6dienfSbudJzZ82WN4EkVPgVaT18oBK971Yi2c
Amount:   0.1 SOL
Network:  devnet

Signing transaction...

✅ Transaction sent!
Signature: 2TciCeoAuNxkgvWNzN5AHERuhHfQn6E5vbrpro8mnKaT...
Explorer:  https://explorer.solana.com/tx/2TciCeoAuNxkgvWNzN5A...?cluster=devnet
```

---

### `history` - Transaction History

View transaction history for an agent's wallet.

**Syntax:**
```bash
paw history <agent-id> [options]
```

**Options:**
- `--limit <number>` - Number of transactions to show [default: 10]
- `--network <network>` - Override config network

**Examples:**
```bash
# Show last 10 transactions
paw history trading-bot-001

# Show last 5 transactions
paw history trading-bot-001 --limit 5

# Check history on specific network
paw history trading-bot-001 --network mainnet-beta
```

**Output:**
```
📟 PAW - Transaction History
Agent ID: trading-bot-001
Network:  devnet

┌──────────────────────┬──────────┬───────────────┬──────────┬─────────────────────────┐
│ Date & Time          │ Type     │ Amount (SOL)  │ Status   │ Signature               │
├──────────────────────┼──────────┼───────────────┼──────────┼─────────────────────────┤
│ 2/20/2026, 9:51:17 … │ 📤 Out   │ -0.250005     │ ✅ Succ… │ 32SsB9yQfu...ygSg34aCMb │
├──────────────────────┼──────────┼───────────────┼──────────┼─────────────────────────┤
│ 2/20/2026, 9:49:54 … │ 📤 Out   │ -0.100005     │ ✅ Succ… │ 2TciCeoAuN...igawDobBqG │
├──────────────────────┼──────────┼───────────────┼──────────┼─────────────────────────┤
│ 2/20/2026, 9:49:16 … │ 📥 In    │ +2.000000     │ ✅ Succ… │ 4LRt9nmBiH...KVaqKEDRKi │
└──────────────────────┴──────────┴───────────────┴──────────┴─────────────────────────┘

View full details: https://explorer.solana.com/address/HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D?cluster=devnet
```

---

### `swap` - Swap Tokens

Swap tokens using Jupiter DEX aggregator.

**Syntax:**
```bash
paw swap <agent-id> --from <token> --to <token> --amount <amount> [options]
```

**Options:**
- `--from <token>` - Input token (SOL, USDC, USDT, BONK or mint address) (required)
- `--to <token>` - Output token (SOL, USDC, USDT, BONK or mint address) (required)
- `--amount <amount>` - Amount to swap (required)
- `--slippage <bps>` - Slippage tolerance in basis points [default: 50]
- `--network <network>` - Override config network (Jupiter only works on mainnet-beta)

**Examples:**
```bash
# Swap 0.1 SOL for USDC
paw swap trading-bot-001 --from SOL --to USDC --amount 0.1 --network mainnet-beta

# Swap with custom slippage
paw swap trading-bot-001 --from SOL --to USDC --amount 0.1 --slippage 100
```

**Output:**
```
📟 PAW - Token Swap
Agent ID: trading-bot-001
From:     SOL
To:       USDC
Amount:   0.1
Network:  mainnet-beta

Fetching quote from Jupiter...

📊 Quote:
Input:   0.1 SOL
Output:  18.234567 USDC
Price Impact: 0.05 %
Slippage: 50 bps

Preparing swap transaction...
Executing swap...

✅ Swap completed!
Signature: 5KJh8F...
Explorer:  https://explorer.solana.com/tx/5KJh8F...
```

---

### `config` - View/Update Configuration

View or update wallet configuration.

**Syntax:**
```bash
paw config <agent-id> [options]
```

**Options:**
- `--network <network>` - Set network (devnet, mainnet-beta, testnet)
- `--show` - Show current configuration

**Examples:**
```bash
# Show configuration
paw config trading-bot-001 --show

# Change network to mainnet
paw config trading-bot-001 --network mainnet-beta

# Change network to devnet
paw config trading-bot-001 --network devnet
```

**Output (show):**
```
📟 PAW - Wallet Configuration
Agent ID: trading-bot-001
Address:  HWd4qkpz5r7c9zSFSUGy2MkkvwuvFd3tqiMkCLiMyb4D
Network:  devnet
Created:  2/20/2026, 9:45:37 AM
```

**Output (update):**
```
📟 PAW - Configuration Updated
Agent ID: trading-bot-001
Network:  devnet → mainnet-beta

✅ Network changed successfully!
```

---

## Network Configuration

PAW stores the default network in each agent's config file. You can:

1. **Set network once:**
```bash
paw config my-agent --network mainnet-beta
```

2. **Use commands without --network flag:**
```bash
paw balance my-agent
paw send my-agent --to <address> --amount 0.1
```

3. **Override temporarily:**
```bash
paw balance my-agent --network devnet
```

---

## Common Workflows

### Create and Fund Wallet

```bash
# 1. Create wallet
paw init my-agent

# 2. Get address
paw address my-agent

# 3. Fund on devnet
solana airdrop 2 <address> --url devnet

# 4. Check balance
paw balance my-agent
```

### Send Transaction

```bash
# 1. Check balance
paw balance my-agent

# 2. Send SOL
paw send my-agent --to <recipient> --amount 0.1

# 3. Verify transaction
paw history my-agent --limit 1
```

### Switch Networks

```bash
# 1. Check current network
paw config my-agent --show

# 2. Switch to mainnet
paw config my-agent --network mainnet-beta

# 3. Check balance on mainnet
paw balance my-agent
```

---

## File Locations

All wallet data is stored in `~/.paw/agents/<agent-id>/`:

```
~/.paw/agents/my-agent/
├── keypair.enc      # Encrypted wallet (AES-256-GCM)
├── .passphrase      # Encrypted passphrase (machine-specific)
└── config.json      # Configuration (network, address, etc.)
```

---

## Error Handling

### Wallet Not Found
```
❌ Error: Wallet for agent "my-agent" not found
```
**Solution:** Create wallet with `paw init my-agent`

### Insufficient Balance
```
❌ Error: Insufficient balance
```
**Solution:** Fund wallet on devnet or mainnet

### Invalid Network
```
❌ Error: Invalid network. Must be one of: devnet, mainnet-beta, testnet
```
**Solution:** Use valid network name

---

## Getting Help

```bash
# General help
paw --help

# Command-specific help
paw init --help
paw balance --help
paw send --help
```

---

**Built for AI agents, by developers who understand autonomy** 📟
