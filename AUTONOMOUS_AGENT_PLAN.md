# Autonomous Onchain Agent using Zerion CLI Fork

## Overview
Fork Zerion CLI and build an autonomous agent on top of it. Implement policy-scoped autonomous strategies (DCA, rebalancing, signal-based execution) with Zerion's cross-chain routing as the execution layer. Choose your own interface — CLI, Telegram, Discord, or cron job.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│          Zerion CLI Fork (Extended)                  │
├─────────────────┬──────────────┬────────────────────┤
│  Original CLI   │ New Commands │  Agent Logic       │
│  (Wallet, Swap) │  (Policies)  │  (Strategies)      │
├─────────────────┼──────────────┼────────────────────┤
│ create-wallet   │ set-policy   │ dca-bot            │
│ swap            │ check-policy │ rebalancer         │
│ bridge          │ list-limits  │ signal-trader      │
│ portfolio       │              │                    │
└─────────────────┴──────────────┴────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    ┌───────┐    ┌──────────┐   ┌─────────────┐
    │Zerion │    │  Zerion  │   │  Policy     │
    │Wallet │    │   API    │   │  Engine     │
    │(EVM+  │    │ (Routing)│   │ (Limits)    │
    │Solana)│    │          │   │             │
    └───────┘    └──────────┘   └─────────────┘
        │             │             │
        └─────────────┼─────────────┘
              Solana + EVM Networks
```

## Implementation Plan (2 Hours)

### Hour 1: Foundation Setup (0:00-1:00)
1. **Clone Zerion CLI & Setup** (0:00-0:15)
   - Clone zeriontech/zerion-ai into `submission/zerion-cli-fork/`
   - Set up development environment
   - Examine Zerion's API integration and swap logic

2. **Implement Policy Engine in Zerion Fork** (0:15-0:45)
   - Create `src/core/policies/engine.ts` with spend limits, chain lock, expiry, action filtering
   - Build policy validation middleware
   - Add policy types and defaults

3. **Create PAW Agent Wrapper Commands** (0:45-1:00)
   - Add `src/cli/commands/agent-run.ts` (PAW command that calls Zerion backend)
   - Add `src/cli/commands/agent-policy.ts` (configure policies)
   - Register commands with PAW CLI dispatcher

### Hour 2: Strategies & Demo (1:00-2:00)
1. **Implement Strategies in Zerion Fork** (1:00-1:30)
   - DCA strategy in `submission/zerion-cli-fork/src/core/strategies/dca.ts`
   - Agent runner/scheduler in `submission/zerion-cli-fork/src/integrations/agent/runner.ts`
   - Connect strategy execution → policy validation → Zerion swap

2. **Create Demo & Documentation** (1:30-1:50)
   - Record demo showing `paw agent run` executing real swap
   - Document policy setup and agent usage
   - Write README for hackathon submission

3. **Final Testing & Submission** (1:50-2:00)
   - Test DCA bot with spend limit on devnet/testnet
   - Verify policy enforcement blocks over-spend
   - Ensure all hackathon requirements met
   - Prepare GitHub repo for submission

## Key Features to Implement

### 1. Scoped Policies (Required) ✅
- **Spend Limits**: Per-transaction, hourly, daily caps
- **Chain Lock**: Restrict to Solana (or EVM chains via Zerion)
- **Expiry Windows**: Policy valid until date/time
- **Action Filtering**: Only allow swaps, block bridges or sends
- **Policy Validation**: Checked before every autonomous action

### 2. Autonomous Agent Capabilities (NEW)
- **Strategy-Based Execution**: DCA, rebalancing, signal-triggered
- **Scheduled Execution**: Run at intervals (hourly, daily, weekly)
- **Event-Driven**: React to price signals or external webhooks
- **Real Transactions**: Executes actual swaps via Zerion API
- **Audit Trail**: All actions logged with timestamps and results
- **No Manual Intervention**: Fully autonomous within policies

### 3. Use Cases to Demonstrate
- **DCA Bot**: Buy 1 SOL daily with 50 USDC/day policy limit
- **Rebalancing Agent**: Monitor portfolio, keep 50% SOL/50% USDC
- **Signal-Based Trader**: Execute on price alerts (e.g., SOL > $200)

## Technical Implementation

### Zerion Fork + PAW Agent Flow
```
PAW CLI Command (paw agent run ...)
         ↓
    PAW Agent Wrapper (src/cli/commands/agent-run.ts)
         ↓
    Zerion Fork Backend (submission/zerion-cli-fork/src/core/strategies)
         ↓
    Strategy Evaluates: Should I trade?
         ↓
    Policy Check: Spend limit, chain lock, expiry validation
         ↓
    If approved: Call Zerion's swap endpoint
         ↓
    Zerion API Routes: SOL/USDC swap on Solana
         ↓
    Blockchain: Confirmed transaction
         ↓
    Logging: Event trail recorded (PAW events)
```

### Files to Create (in submission/zerion-cli-fork/)
```
submission/zerion-cli-fork/
├── src/
│   ├── core/
│   │   ├── strategies/              # NEW
│   │   │   ├── dca.ts               # DCA strategy
│   │   │   ├── rebalance.ts         # Rebalancing
│   │   │   ├── signal.ts            # Signal-based
│   │   │   └── types.ts             # Interfaces
│   │   └── policies/                # NEW
│   │       ├── engine.ts            # Policy validation
│   │       └── types.ts             # Policy types
│   ├── integrations/
│   │   └── agent/                   # NEW
│   │       ├── runner.ts            # Event loop
│   │       ├── scheduler.ts         # Cron scheduling
│   │       └── monitor.ts           # Status tracking
│   └── (original Zerion files)
├── cli/
├── plugins/
├── package.json
└── README.md (Zerion fork docs)

(Original PAW files in root — NO CHANGES)
```

**PAW Agent Commands (root src/cli/commands/):**
```
src/cli/commands/
├── agent-run.ts                      # NEW - paw agent run
├── agent-policy.ts                   # NEW - paw agent policy
└── agent-status.ts                   # NEW - paw agent status
```

## Security Model
- **Zerion's Wallet Security**: Inherit Zerion CLI's key management
- **Policy-First Design**: Every autonomous action validated against policies
- **Spend Limits Enforced**: Hard caps on per-tx, hourly, daily spending
- **Chain Lock**: Restrict to specific networks (default: Solana)
- **Expiry Windows**: Policies deactivate after expiry date
- **Audit Trail**: All agent actions logged with details
- **No God-Mode**: All actions bounded by predefined policies

## Interface (Your Choice)

The agent is implemented in the Zerion fork, but accessed via PAW CLI for consistency:

```bash
# PAW agent commands (familiar PAW interface)
paw agent run agent-dca --strategy dca --amount 1.0 --daily

paw agent policy set agent-dca --spend-limit 50 --per day

paw agent status agent-dca

paw agent logs agent-dca
```

**How it works:**
- User runs `paw agent` command
- PAW wrapper calls the Zerion fork backend
- Zerion handles swaps, routing, and execution
- Results logged and displayed via PAW interface

## CLI Commands (PAW Agent + Zerion Fork)

```bash
# Initialize wallet for agent (PAW)
paw init agent-dca

# Set policies (PAW wrapper → Zerion fork)
paw agent policy set agent-dca \
  --spend-limit 50 \
  --spend-period daily \
  --allowed-actions swap \
  --chain solana

# Run DCA agent (PAW wrapper → Zerion fork)
paw agent run agent-dca \
  --strategy dca \
  --target-token SOL \
  --payment-token USDC \
  --amount 1.0 \
  --schedule daily \
  --time "14:00"

# Monitor agent (PAW wrapper → Zerion fork)
paw agent status agent-dca
paw agent logs agent-dca
```

## Delivery (Hackathon Submission)

**Two Parts:**

1. **Root Repo** (agentic-wallet - your main PAW product)
   - Add new agent commands: `src/cli/commands/agent-*.ts`
   - These are PAW subcommands that wrap the Zerion fork
   - Update PAW's CLI index to register new commands

2. **Submission Folder** (submission/zerion-cli-fork/ - hackathon submission)
   - Forked Zerion CLI with agent backend implementation
   - Policy engine (spend limits, chain lock, expiry, action filtering)
   - DCA strategy + scheduler + runner
   - README with setup and usage instructions

**For Hackathon:**
- Push `submission/zerion-cli-fork/` to new GitHub repo (fork of zeriontech/zerion-ai)
- Include demo video showing:
  - Setting policy limit: `paw agent policy set agent-dca --spend-limit 50 --per day`
  - Running agent: `paw agent run agent-dca --strategy dca --amount 1.0 --daily`
  - Verifying policy blocked over-spend attempt
- Write README explaining agent features and how to run

**Hackathon Requirements Met:**
- ✅ Fork Zerion CLI repo (in submission folder)
- ✅ Real onchain transactions (DCA bot executes actual swaps via Zerion API)
- ✅ Scoped policies (50 USDC/day limit enforced before each swap)
- ✅ Custom commands (agent run, agent policy, agent status via PAW)
- ✅ Demo video (show agent executing swap within policy bounds)
- ✅ Open source on GitHub
- ✅ Code quality (modular, documented, tested)

## Timeline
- **0:00-0:15**: Clone Zerion CLI into submission/zerion-cli-fork/
- **0:15-0:45**: Implement policy engine in Zerion fork
- **0:45-1:00**: Create PAW agent commands (agent-run.ts, agent-policy.ts)
- **1:00-1:30**: Implement DCA strategy in Zerion fork + agent runner
- **1:30-1:50**: Create demo script + write documentation
- **1:50-2:00**: Final testing + submission prep