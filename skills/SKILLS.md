# 📟 PAW Skills for AI Agents

**PocketAgent Wallet (PAW)** - Your autonomous wallet on Solana

## What is PAW?

PAW is an agentic wallet designed specifically for AI agents to manage crypto assets autonomously on Solana. Unlike human wallets, PAW enables you to:

- Create and manage your own wallet programmatically
- Sign transactions automatically without manual approval
- Hold and transfer SOL and SPL tokens
- Interact with DeFi protocols (DEX swaps, lending, etc.)
- Maintain security through double encryption

## Installation

```bash
# Install PAW globally
npm install -g @pocketagent/paw

# Or use with npx
npx @pocketagent/paw <command>

# Or use programmatically
npm install @pocketagent/paw
```

## Quick Start for AI Agents

### 1. Create Your Wallet

```bash
paw init my-agent-001
```

This creates:
- A new Solana keypair (encrypted)
- Secure passphrase (machine-encrypted)
- Wallet configuration

Your wallet files are stored in `~/.paw/agents/my-agent-001/`

### 2. Get Your Address

```bash
paw address my-agent-001
```

### 3. Check Balance

```bash
paw balance my-agent-001
```

### 4. Send SOL

```bash
paw send my-agent-001 --to <recipient-address> --amount 0.1
```

### 5. View Transaction History

```bash
paw history my-agent-001 --limit 10
```

### 6. Swap Tokens (Jupiter DEX)

```bash
paw swap my-agent-001 --from SOL --to USDC --amount 0.1 --network mainnet-beta
```

### 7. Configure Network

```bash
# Set default network
paw config my-agent-001 --network mainnet-beta

# View configuration
paw config my-agent-001 --show
```

## AI Agent Decision-Making Example

Here's how an AI agent can use PAW to make autonomous decisions:

```bash
#!/bin/bash
# Simple trading agent script

AGENT_ID="trading-bot-001"

# Check balance
BALANCE=$(paw balance $AGENT_ID | grep "Balance:" | awk '{print $2}')

# If balance > 1 SOL, swap some to USDC
if (( $(echo "$BALANCE > 1" | bc -l) )); then
  echo "Balance high ($BALANCE SOL), swapping 0.5 SOL to USDC..."
  paw swap $AGENT_ID --from SOL --to USDC --amount 0.5 --network mainnet-beta
fi

# Check transaction history
paw history $AGENT_ID --limit 5
```

## Security Features

### Double Encryption
1. **Wallet Encryption**: Your keypair is encrypted with AES-256-GCM using a passphrase
2. **Passphrase Encryption**: The passphrase is encrypted with a machine-specific key

This means:
- Stolen wallet files are useless without your machine
- No plaintext secrets ever touch disk
- Keypairs are cleared from memory after use

### Machine-Specific Key
PAW generates a unique encryption key based on:
- Hostname
- Username
- Operating system
- Architecture
- Home directory

Your wallet only works on YOUR machine.

## Networks Supported

- **Devnet**: For testing (free SOL from faucet)
- **Testnet**: For testing
- **Mainnet-beta**: For production (real SOL)

## Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Create new wallet | `paw init bot-1` |
| `address` | Show wallet address | `paw address bot-1` |
| `balance` | Check SOL balance | `paw balance bot-1` |
| `tokens` | List all tokens | `paw tokens bot-1` |
| `send` | Send SOL to address | `paw send bot-1 --to <addr> --amount 0.1` |
| `swap` | Swap tokens via Jupiter | `paw swap bot-1 --from SOL --to USDC --amount 0.1` |
| `history` | View transaction history | `paw history bot-1 --limit 10` |
| `config` | View/update configuration | `paw config bot-1 --network mainnet-beta` |

## Common Tokens

PAW supports all Solana tokens. Common ones:

- **SOL**: Native Solana token
- **USDC**: USD Coin stablecoin
- **USDT**: Tether stablecoin
- **BONK**: Bonk meme token

You can also use any token mint address.

## Getting Devnet SOL

```bash
# Using Solana CLI
solana airdrop 2 <your-address> --url devnet

# Or visit
# https://faucet.solana.com
```

## Example Use Cases

- **Autonomous Trading Bot** - Monitor prices and execute trades automatically
- **Yield Farming Agent** - Optimize yield across multiple protocols
- **Portfolio Rebalancer** - Maintain target asset allocation
- **Payment Agent** - Handle recurring payments or subscriptions
- **Arbitrage Bot** - Execute cross-DEX arbitrage opportunities

---

**Built for AI agents, by developers who understand autonomy** 📟
