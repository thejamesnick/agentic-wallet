# PAW Architecture Clarification 📟

## What is PAW?

PAW is an **agentic wallet CLI tool** that AI agents install and use on their system - just like humans install Phantom or MetaMask, agents install PAW.

## Core Product

**PAW CLI** - A globally installed command-line wallet tool for AI agents

```bash
# Install PAW (like installing a wallet app)
npm install -g @pocketagent/paw

# Agent uses PAW commands
paw init --agent-id my-bot
paw balance
paw swap --from SOL --to USDC --amount 1
```

## Architecture Overview

```
┌─────────────────────────────────────┐
│      AI Agent (OpenClaw, etc.)      │
│                                     │
│  agent.executeCommand(              │
│    "paw swap --from SOL --to USDC"  │
│  )                                  │
└─────────────────────────────────────┘
              ↓ shell command
┌─────────────────────────────────────┐
│    PAW CLI (globally installed)     │ ← Like Phantom, but for agents
│  - Wallet management                │
│  - Transaction signing              │
│  - Key storage (~/.paw/)            │
│  - DeFi integrations                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Solana Blockchain           │
│            (Devnet)                 │
└─────────────────────────────────────┘
```

## Key Concept

**For Humans:**
- Install Phantom wallet app
- Click buttons in UI
- Approve each transaction

**For AI Agents:**
- Install PAW CLI tool
- Execute commands in terminal
- Automatic signing (no approval needed)

## Component Breakdown

### 1. PAW CLI (Main Product)
**Purpose:** Command-line wallet tool that agents install and use

**Installation:**
```bash
# Install globally (like installing a wallet app)
npm install -g @pocketagent/paw

# Initialize wallet for an agent
paw init --agent-id my-trading-bot
```

**Core Commands:**
```bash
# Wallet Management
paw init --agent-id <id>           # Create wallet for agent
paw address                         # Show wallet address
paw balance                         # Show SOL and token balances
paw import --key <private-key>      # Import existing wallet

# Transactions
paw send --to <address> --amount <n>              # Send SOL
paw send-token --token <mint> --to <addr> --amount <n>  # Send SPL token

# DeFi Operations
paw swap --from <token> --to <token> --amount <n>  # Swap on Jupiter
paw stake --validator <addr> --amount <n>           # Stake SOL

# Information
paw history                         # Transaction history
paw status                          # Wallet status and health
paw config                          # Show configuration
```

**Key Storage:**
```
~/.paw/
├── agents/
│   ├── trading-bot-001/
│   │   ├── keypair.json (encrypted)
│   │   └── config.json
│   ├── lp-bot-001/
│   │   ├── keypair.json (encrypted)
│   │   └── config.json
└── global-config.json
```

### 2. PAW Core Library
**Purpose:** Internal library that powers the CLI

**Components:**
- `wallet/` - Wallet creation and management
- `signer/` - Automatic transaction signing
- `storage/` - Encrypted key storage
- `integrations/` - DeFi protocol connections (Jupiter, etc.)
- `rpc/` - Solana RPC client

**Not directly used by agents** - they use the CLI instead.

### 3. Demo Agent (Proof of Concept)
**Purpose:** Show how an AI agent uses PAW CLI

**Example: Simple Trading Bot**
```javascript
// trading-agent.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class TradingAgent {
  constructor(agentId) {
    this.agentId = agentId;
  }

  async initialize() {
    // Create wallet using PAW CLI
    await execPromise(`paw init --agent-id ${this.agentId}`);
    console.log('Wallet initialized');
  }

  async getBalance() {
    const { stdout } = await execPromise('paw balance');
    return stdout;
  }

  async run() {
    while (true) {
      const price = await this.getSOLPrice();
      
      // AI decision logic
      if (price < 100) {
        // Buy SOL
        await execPromise('paw swap --from USDC --to SOL --amount 10');
        console.log('Bought SOL at', price);
      } else if (price > 150) {
        // Sell SOL
        await execPromise('paw swap --from SOL --to USDC --amount 0.5');
        console.log('Sold SOL at', price);
      }
      
      await this.sleep(60000); // Check every minute
    }
  }

  async getSOLPrice() {
    // Fetch price from API
    return 120; // Placeholder
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the agent
const agent = new TradingAgent('trading-bot-001');
agent.initialize().then(() => agent.run());
```

**Example: OpenClaw Integration**
```javascript
// OpenClaw skill for PAW
export const pawSkill = {
  name: 'wallet',
  description: 'Manage crypto wallet and execute DeFi transactions',
  
  commands: {
    balance: () => shell.exec('paw balance'),
    swap: (from, to, amount) => 
      shell.exec(`paw swap --from ${from} --to ${to} --amount ${amount}`),
    send: (to, amount) => 
      shell.exec(`paw send --to ${to} --amount ${amount}`)
  }
};

// OpenClaw agent uses it
Agent: "Check my wallet balance"
→ Executes: paw balance
→ Returns: "5.2 SOL, 100 USDC"

Agent: "Swap 1 SOL for USDC"
→ Executes: paw swap --from SOL --to USDC --amount 1
→ Returns: "Swapped 1 SOL for 142.5 USDC"
```

### 4. Multi-Agent Support
**Purpose:** Show scalability - multiple agents with independent wallets

**Example:**
```bash
# Create wallets for different agents
paw init --agent-id aggressive-trader
paw init --agent-id conservative-trader
paw init --agent-id liquidity-provider

# Each agent operates independently
paw --agent aggressive-trader swap --from SOL --to USDC --amount 2
paw --agent conservative-trader swap --from SOL --to USDC --amount 0.5
paw --agent liquidity-provider stake --validator <addr> --amount 5
```

**Multi-Agent Demo Script:**
```javascript
// multi-agent-demo.js
const agents = [
  { id: 'aggressive-trader', strategy: 'high-frequency' },
  { id: 'conservative-trader', strategy: 'hodl' },
  { id: 'liquidity-provider', strategy: 'yield' }
];

// Initialize all agents
for (const agent of agents) {
  await execPromise(`paw init --agent-id ${agent.id}`);
}

// Run agents concurrently
agents.forEach(agent => {
  runAgentStrategy(agent);
});
```

## User Flow

### For AI Agent Developers:

1. **Install PAW**
   ```bash
   npm install -g @pocketagent/paw
   ```

2. **Initialize Agent Wallet**
   ```bash
   paw init --agent-id my-trading-bot
   # Wallet created: 7xK2nF8...
   ```

3. **Fund Wallet (Devnet)**
   ```bash
   paw address
   # Copy address and use Solana devnet faucet
   ```

4. **Write Agent Code**
   ```javascript
   // Agent executes PAW commands
   const { exec } = require('child_process');
   
   // Check balance
   exec('paw balance', (err, stdout) => {
     console.log(stdout); // 5.2 SOL
   });
   
   // Make trade
   exec('paw swap --from SOL --to USDC --amount 1');
   ```

5. **Run Agent**
   ```bash
   node my-agent.js
   ```

### For AI Agents (Autonomous):

1. **Initialize**
   - Execute: `paw init --agent-id self`
   - Store wallet address

2. **Check Status**
   - Execute: `paw balance`
   - Parse output to get balances

3. **Make Decisions**
   - Use AI logic to decide when to trade
   - Analyze market conditions

4. **Execute Transactions**
   - Execute: `paw swap --from SOL --to USDC --amount 1`
   - Parse output for confirmation

5. **Repeat**
   - Continue autonomous operation
   - No human intervention needed

## Key Principles

### 1. Agent-First Design
- Agents install PAW like humans install Phantom
- CLI commands designed for programmatic execution
- No UI required for core functionality

### 2. Clear Separation of Concerns
- **Agent Logic** = Decision making (when to trade, how much)
- **PAW CLI** = Wallet operations (signing, sending, storing keys)
- Agents execute commands, PAW handles all crypto complexity

### 3. Security by Default
- Keys stored encrypted in `~/.paw/agents/<agent-id>/`
- Each agent has isolated wallet
- Keys never exposed in command output
- Automatic signing within agent's own wallet

### 4. Multi-Agent Support
- Each agent gets its own wallet directory
- Independent key storage
- Concurrent operation supported
- Use `--agent <id>` flag to specify which agent

### 5. Framework Agnostic
- Works with any AI framework that can execute shell commands
- OpenClaw, AutoGPT, LangChain, custom Python/JS agents
- Simple command-line interface
- No code dependencies

## For the Bounty Submission

### Must Have:
- ✅ PAW CLI tool (globally installable)
- ✅ Core wallet operations (create, sign, send)
- ✅ Jupiter integration for swaps
- ✅ Demo agent using PAW (simple trading bot)
- ✅ Multi-agent support demonstration
- ✅ Documentation (README, SKILLS.md, deep dive)

### Demo Flow:
1. Install PAW: `npm install -g @pocketagent/paw`
2. Initialize wallet: `paw init --agent-id demo-bot`
3. Fund on devnet: `paw address` → use faucet
4. Check balance: `paw balance`
5. Execute swap: `paw swap --from SOL --to USDC --amount 1`
6. Show transaction on Solscan
7. Run autonomous agent demo
8. Show multi-agent support

### Nice to Have:
- ✅ OpenClaw integration example
- ✅ Multiple agent strategies
- ✅ Transaction history viewer
- ⬜ Advanced DeFi operations (staking, LP)

### Future (Post-Bounty):
- 🔮 Web UI dashboard for monitoring
- 🔮 Multi-chain support (EVM)
- 🔮 Advanced security features (MPC)
- 🔮 Agent marketplace

## Technology Choices

### Why TypeScript/Node.js?
- Most AI frameworks use JavaScript/Python
- Easy for agents to integrate
- Rich ecosystem for blockchain tools

### Why @solana/web3.js?
- Official Solana library
- Handles all wallet operations
- Well-documented and maintained

### Why Jupiter?
- Best DEX aggregator on Solana
- Simple API
- Automatic best price routing

### Why Encrypted Local Storage?
- Simple but secure
- No external dependencies
- Agent-specific isolation

## Summary

**PAW is a CLI wallet tool for AI agents.**

Agents install PAW globally (`npm install -g @pocketagent/paw`) and use it via command-line interface. Just like humans install Phantom wallet on their computer, agents install PAW on their system.

The CLI provides simple commands for wallet management, transactions, and DeFi operations. Agents execute these commands programmatically, and PAW handles all the blockchain complexity - key management, transaction signing, RPC communication, etc.

This makes PAW:
- **Universal** - Works with any AI framework (OpenClaw, AutoGPT, LangChain, custom agents)
- **Simple** - Clean command-line interface, no code dependencies
- **Secure** - Encrypted key storage, isolated per agent
- **Scalable** - Multiple agents, each with their own wallet

---

**Think of PAW like:**
- **Phantom/MetaMask** - But for agents instead of humans
- **Git CLI** - Installed globally, used via commands
- **Docker CLI** - Tool that agents can execute

PAW is the wallet tool that gives AI agents financial autonomy on Solana.
