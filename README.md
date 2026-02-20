# PAW 📟

**PocketAgent Wallet** - Agentic Wallets for Autonomous AI

> Give your AI agents the power to manage their own crypto

## About PAW

PAW (PocketAgent Wallet) is a specialized wallet infrastructure designed for AI agents to autonomously manage crypto assets and interact with DeFi protocols. Unlike traditional wallets built for humans, PAW enables AI agents to hold funds, execute transactions, and participate in DeFi—all without manual approval for every action.

Think of it as giving your AI agent its own pocket of crypto that it can manage intelligently within the guardrails you set.

## What We're Building

PAW provides:

- **Programmatic Wallet Creation** - AI agents create wallets on demand
- **Automated Transaction Signing** - No manual approval needed
- **SOL & SPL Token Support** - Full Solana token compatibility
- **DeFi Protocol Integration** - Interact with Jupiter, Raydium, etc.
- **Safe Key Management** - SSH-style encryption (AES-256-GCM)
- **Multi-Agent Support** - Each agent manages its own wallet independently
- **Optional Monitoring Dashboard** - CLI/UI to observe agent activities

## Submission Requirements

✅ Working prototype on Solana Devnet  
✅ Programmatic wallet creation  
✅ Automatic transaction signing  
✅ DeFi protocol interaction (Jupiter for swaps)  
✅ Deep dive documentation (written + video)  
✅ Open-source code with README  
✅ SKILLS.md for AI agents  
✅ Demo of autonomous agent using the wallet

## Current Status

🚧 **In Development** - Building for the Superteam DeFi Developer Challenge

**Phase 1:** Solana Implementation (Current Focus)
- Starting with Solana for fast, low-cost transactions
- Building core wallet infrastructure
- Implementing basic DeFi integrations

**Phase 2:** Multi-chain Expansion (Planned)
- EVM chains (Ethereum, Base, Polygon)
- Cross-chain capabilities
- Unified API across all chains

## Why Solana First?

We're launching on Solana because:
- ⚡ Fast transaction speeds (400ms block times)
- 💰 Low fees (fractions of a cent)
- 🤖 Perfect for high-frequency agent operations
- 🌊 Rich DeFi ecosystem (Jupiter, Raydium, Marinade, etc.)
- 📈 Growing AI agent community

## Use Cases

- **Trading Bots** - Autonomous DEX trading with risk limits
- **Yield Farmers** - Agents that optimize yield across protocols
- **Portfolio Managers** - Rebalancing and diversification agents
- **Arbitrage Agents** - Cross-DEX opportunity seekers
- **DAO Participants** - Agents that vote and manage treasury

## Tech Stack

- **Language:** TypeScript/Node.js
- **CLI Framework:** Commander.js
- **Blockchain:** Solana (Devnet)
- **Wallet Library:** @solana/web3.js
- **Key Storage:** AES-256-GCM encrypted files (~/.paw/)
- **Encryption:** SSH-style (encrypt at rest, decrypt in memory only)
- **DeFi Integration:** Jupiter Aggregator API
- **Package Manager:** npm

## Security Model

PAW uses an **SSH-style encryption model** for maximum security:

- **At Rest:** Private keys encrypted with AES-256-GCM
- **In Use:** Keys decrypted in memory only when signing
- **After Use:** Keys immediately cleared from memory
- **Never:** Keys stored in plaintext on disk or in logs

**Key Features:**
- 🔐 AES-256-GCM encryption (industry standard)
- 🔑 PBKDF2 key derivation (100,000 iterations)
- 🛡️ Passphrase protection
- 🧹 Memory-safe (keys cleared after signing)
- 🔒 Per-agent isolation

See [SECURITY.md](about/SECURITY.md) for detailed security documentation.

## Project Structure

```
paw/
├── src/
│   ├── cli/           # CLI interface and commands
│   ├── core/          # Core wallet system (TypeScript)
│   │   ├── wallet/    # Wallet creation & management
│   │   ├── signer/    # Automatic transaction signing
│   │   └── storage/   # Secure key storage
│   ├── integrations/  # DeFi protocol integrations
│   │   └── jupiter/   # Jupiter DEX integration
│   └── utils/         # Helper utilities
├── examples/
│   ├── trading-bot/   # Demo trading agent
│   ├── openclaw/      # OpenClaw integration example
│   └── multi-agent/   # Multi-agent demo
├── docs/
│   ├── README.md
│   ├── SKILLS.md      # For AI agents to read
│   ├── DEEP_DIVE.md   # Technical deep dive
│   └── API.md         # CLI command reference
└── tests/             # Test suite
```

## Getting Started

### Installation

```bash
# Install PAW globally (like installing a wallet app)
npm install -g @pocketagent/paw
```

### Quick Start

```bash
# 1. Create a wallet for your agent
paw init --agent-id my-trading-bot

# 2. Get your wallet address
paw address

# 3. Fund it on Solana devnet (use faucet)
# Visit: https://faucet.solana.com

# 4. Check balance
paw balance

# 5. Swap tokens
paw swap --from SOL --to USDC --amount 1

# 6. Send SOL
paw send --to <recipient-address> --amount 0.5
```

### For AI Agents

```javascript
// Your agent can execute PAW commands
const { exec } = require('child_process');

// Initialize wallet
exec('paw init --agent-id trading-bot-001');

// Check balance
exec('paw balance', (err, stdout) => {
  console.log(stdout); // 5.2 SOL, 100 USDC
});

// Execute trade
exec('paw swap --from SOL --to USDC --amount 1');
```

## Roadmap

- [x] Project planning and design
- [ ] Core wallet infrastructure (Solana Devnet)
  - [ ] Programmatic wallet creation
  - [ ] Automated transaction signing
  - [ ] SOL/SPL token support
- [ ] Key management system
  - [ ] Secure key storage for agents
  - [ ] Encryption and access controls
- [ ] DeFi integration (Jupiter DEX)
  - [ ] Token swaps
  - [ ] Price feeds
- [ ] AI agent simulation
  - [ ] Simple trading bot logic
  - [ ] Decision-making framework
- [ ] Multi-agent support
  - [ ] Independent wallet management
  - [ ] Agent registry
- [ ] Monitoring tools (Optional)
  - [ ] CLI for observing agent actions
  - [ ] Transaction history viewer
- [ ] Documentation
  - [ ] README with setup instructions
  - [ ] SKILLS.md for AI agents
  - [ ] Deep dive (written + video)
- [ ] Testing & deployment on Devnet

## Contributing

This project is being developed for the Superteam DeFi Developer Challenge. Stay tuned for contribution guidelines after the initial release!

## License

TBD

---

**Built for the Superteam DeFi Developer Challenge 2026**  
*Empowering AI agents, one paw at a time* �
