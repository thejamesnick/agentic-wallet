# PAW Project Summary 📟

**Last Updated:** February 20, 2026  
**Status:** Ready to Build 🚀

## What We're Building

**PAW (PocketAgent Wallet)** - A CLI wallet tool for AI agents on Solana

Think: Phantom wallet, but for AI agents instead of humans.

## The Problem

AI agents need to:
- Hold their own crypto
- Execute transactions autonomously
- Interact with DeFi protocols
- Do all this WITHOUT human approval for every action

## Our Solution

A globally-installed CLI tool that agents use via shell commands:

```bash
# Install PAW
npm install -g @pocketagent/paw

# Agent creates wallet
paw init --agent-id trading-bot-001

# Agent trades autonomously
paw swap --from SOL --to USDC --amount 1
```

## Core Architecture

```
AI Agent (OpenClaw, custom bot, etc.)
    ↓ executes shell commands
PAW CLI (globally installed)
    ↓ uses
PAW Core (wallet, signer, storage)
    ↓ interacts with
Solana Blockchain (Devnet)
```

## Key Features

### 1. Programmatic Wallet Creation ✅
- Each agent gets its own wallet
- Isolated key storage per agent
- Multi-agent support built-in

### 2. Automatic Transaction Signing ✅
- No manual approval needed
- SSH-style encrypted keys
- Decrypt only when signing

### 3. DeFi Integration ✅
- Jupiter DEX for token swaps
- Price feeds and routing
- More protocols can be added

### 4. Security First ✅
- AES-256-GCM encryption at rest
- Keys never exposed in plaintext
- Memory cleared after signing
- Passphrase protection

### 5. Framework Agnostic ✅
- Works with any AI framework
- OpenClaw, AutoGPT, LangChain
- Custom Python/JS agents
- Just execute shell commands

## Tech Stack

**Language:** TypeScript/Node.js  
**CLI Framework:** Commander.js  
**Blockchain:** Solana (Devnet)  
**Wallet Library:** @solana/web3.js  
**Encryption:** AES-256-GCM (Node.js crypto)  
**DeFi:** Jupiter Aggregator API  
**Package:** npm (global install)

## Project Structure

```
paw/
├── src/
│   ├── cli/              # CLI commands (init, swap, send, etc.)
│   ├── core/
│   │   ├── wallet/       # Wallet creation & management
│   │   ├── signer/       # Transaction signing
│   │   └── storage/      # Encrypted key storage
│   ├── integrations/
│   │   └── jupiter/      # Jupiter DEX integration
│   └── utils/            # Helpers
├── examples/
│   ├── trading-bot/      # Demo autonomous trading agent
│   ├── openclaw/         # OpenClaw integration
│   └── multi-agent/      # Multiple agents demo
├── docs/
│   ├── README.md         # Main documentation
│   ├── SKILLS.md         # For AI agents (MCP-style)
│   ├── DEEP_DIVE.md      # Technical deep dive
│   └── API.md            # CLI command reference
└── tests/                # Test suite
```

## Bounty Requirements Checklist

### Must Have (Required):
- [ ] ✅ Create wallet programmatically
- [ ] ✅ Sign transactions automatically
- [ ] ✅ Hold SOL and SPL tokens
- [ ] ✅ Interact with test dApp (Jupiter)
- [ ] ✅ Deep dive documentation (written + video)
- [ ] ✅ Open-source code with README
- [ ] ✅ SKILLS.md for AI agents
- [ ] ✅ Working prototype on Solana Devnet
- [ ] ✅ Demo of autonomous agent

### Nice to Have (Bonus Points):
- [ ] ⭐ Multi-agent demonstration
- [ ] ⭐ OpenClaw integration example
- [ ] ⭐ Transaction history viewer
- [ ] ⭐ Multiple agent strategies
- [ ] ⭐ Session mode for high-frequency trading

### Future (Post-Bounty):
- [ ] 🔮 Web UI dashboard
- [ ] 🔮 Multi-chain support (EVM)
- [ ] 🔮 Hardware wallet integration
- [ ] 🔮 On-chain agent registry (Anchor program)

## Security Model (SSH-Style)

**At Rest:** Keys encrypted with AES-256-GCM  
**In Use:** Decrypt in memory, sign, clear immediately  
**Never:** Keys in plaintext on disk or in logs

```
~/.paw/agents/bot-001/keypair.enc  ← Encrypted
         ↓ when signing
    Decrypt in memory
         ↓
    Sign transaction
         ↓
    Clear from memory (keypair.secretKey.fill(0))
         ↓
~/.paw/agents/bot-001/keypair.enc  ← Still encrypted
```

## Demo Flow (For Video)

1. **Install PAW**
   ```bash
   npm install -g @pocketagent/paw
   ```

2. **Create Agent Wallet**
   ```bash
   paw init --agent-id demo-bot
   # Output: Wallet created: 7xK2nF8...
   ```

3. **Fund on Devnet**
   ```bash
   paw address
   # Use Solana faucet to add SOL
   ```

4. **Check Balance**
   ```bash
   paw balance
   # Output: 5.0 SOL
   ```

5. **Execute Swap**
   ```bash
   paw swap --from SOL --to USDC --amount 1
   # Output: Swapped 1 SOL for 142.5 USDC
   # Transaction: https://solscan.io/tx/...
   ```

6. **Run Autonomous Agent**
   ```bash
   node examples/trading-bot/index.js
   # Agent monitors prices and trades automatically
   ```

7. **Multi-Agent Demo**
   ```bash
   # Create 3 agents
   paw init --agent-id trader-1
   paw init --agent-id trader-2
   paw init --agent-id lp-bot
   
   # Run multi-agent script
   node examples/multi-agent/demo.js
   ```

## Judging Criteria (How We Win)

### 1. Functional Demonstration (40%)
- ✅ Working wallet creation
- ✅ Automatic signing
- ✅ DeFi interaction (Jupiter swaps)
- ✅ Autonomous agent demo
- ⭐ Multi-agent scalability

### 2. Security & Key Management (30%)
- ✅ SSH-style encryption (AES-256-GCM)
- ✅ Keys never exposed
- ✅ Memory safety (clear after use)
- ✅ Passphrase protection
- ⭐ Session mode for high-frequency

### 3. Documentation & Deep Dive (20%)
- ✅ Clear README with setup
- ✅ SKILLS.md for agents (MCP-style)
- ✅ Technical deep dive (written)
- ✅ Video demonstration
- ✅ Architecture documentation

### 4. Scalability (10%)
- ✅ Multi-agent support
- ✅ Isolated key storage
- ✅ Framework agnostic
- ⭐ Agent registry (future)

## What Makes PAW Different

### vs Traditional Wallets (Phantom, MetaMask):
- ❌ They require manual approval for each transaction
- ✅ PAW signs automatically (agent-controlled)

### vs Other Agentic Wallet Submissions:
- ✅ CLI-first (universal, any framework can use)
- ✅ SSH-style security (industry standard)
- ✅ Multi-agent from day one
- ✅ OpenClaw integration example
- ✅ Simple but complete

### vs SDK-Only Approach:
- ✅ No code dependencies for agents
- ✅ Works with Python, JS, any language
- ✅ Easy to demo and test
- ⭐ Can add SDK wrapper later

## Implementation Plan

### Phase 1: Core Wallet (Week 1)
- [ ] Project setup (TypeScript, npm)
- [ ] Wallet creation (Keypair generation)
- [ ] Encrypted storage (AES-256-GCM)
- [ ] Basic CLI commands (init, address, balance)

### Phase 2: Transaction Signing (Week 2)
- [ ] Transaction builder
- [ ] Automatic signing flow
- [ ] Memory safety (clear keys)
- [ ] Send SOL command

### Phase 3: DeFi Integration (Week 3)
- [ ] Jupiter API integration
- [ ] Token swap command
- [ ] Price feeds
- [ ] Slippage protection

### Phase 4: Demo Agents (Week 4)
- [ ] Simple trading bot
- [ ] OpenClaw integration
- [ ] Multi-agent demo
- [ ] Transaction history

### Phase 5: Documentation (Week 5)
- [ ] README with examples
- [ ] SKILLS.md (MCP-style)
- [ ] Deep dive document
- [ ] Video demonstration
- [ ] API reference

### Phase 6: Testing & Polish (Week 6)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Devnet deployment
- [ ] Bug fixes
- [ ] Final submission

## Success Metrics

**Minimum Viable Submission:**
- ✅ Working CLI tool
- ✅ Create wallet + sign transactions
- ✅ Jupiter swap integration
- ✅ One demo agent
- ✅ Documentation

**Competitive Submission:**
- ✅ All of above
- ✅ Multi-agent support
- ✅ OpenClaw integration
- ✅ Video demo
- ✅ Clean code

**Winning Submission:**
- ✅ All of above
- ✅ SSH-style security (standout feature)
- ✅ Multiple agent strategies
- ✅ Excellent documentation
- ✅ Professional video
- ✅ Clear differentiation

## Key Differentiators

1. **SSH-Style Security** - Industry standard, well-understood
2. **CLI-First** - Universal, framework agnostic
3. **Multi-Agent Native** - Built for scalability from day one
4. **OpenClaw Ready** - Integration example included
5. **Simple but Complete** - Does one thing well

## Risks & Mitigations

### Risk: "CLI is too simple"
**Mitigation:** Show it's actually more flexible than SDK-only

### Risk: "No on-chain component"
**Mitigation:** Not required by bounty, can add later

### Risk: "Other submissions have more features"
**Mitigation:** Focus on quality over quantity, nail the core

### Risk: "Security concerns"
**Mitigation:** SSH-style is proven, document thoroughly

## Timeline

**Today (Feb 20):** Planning complete ✅  
**Week 1 (Feb 21-27):** Core wallet implementation  
**Week 2 (Feb 28-Mar 6):** Transaction signing  
**Week 3 (Mar 7-13):** DeFi integration  
**Week 4 (Mar 14-20):** Demo agents  
**Week 5 (Mar 21-22):** Documentation  
**Mar 23:** Submission deadline 🎯

## Next Steps

### Immediate (Today):
1. ✅ Planning complete
2. ⬜ Initialize npm project
3. ⬜ Set up TypeScript config
4. ⬜ Create basic project structure

### This Week:
1. ⬜ Implement wallet creation
2. ⬜ Implement encryption
3. ⬜ Build CLI framework
4. ⬜ Test on devnet

### Questions to Resolve:
- ❓ Passphrase: env var or auto-generate?
- ❓ RPC endpoint: public or custom?
- ❓ CLI output: JSON or human-readable?
- ❓ Session mode: include in v1 or later?

## Resources

**Bounty:** https://superteam.fun/earn/listing/defi-developer-challenge-agentic-wallets-for-ai-agents/  
**Solana Docs:** https://docs.solana.com/  
**Jupiter API:** https://station.jup.ag/docs/apis/swap-api  
**OpenClaw:** https://github.com/openclaw  

## Team

**Solo or up to 4 developers**  
**Region:** Nigeria only  
**KYC:** Required for winners

---

## Ready to Build? 🚀

We have:
- ✅ Clear product vision
- ✅ Solid architecture
- ✅ Security model defined
- ✅ Implementation plan
- ✅ All requirements mapped

**Status: READY TO START CODING**

Let's build PAW! 📟
