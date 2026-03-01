# Changelog

All notable changes to PAW (PocketAgent Wallet) will be documented in this file.

## [1.2.0] - 2026-03-01

### Added - Guardrails (Spending Limits & Safety)

#### 🛡️ New Command
- **`paw guardrails`** - Manage spending limits and safety guardrails
  - Enable/disable guardrails for any agent
  - Risk profiles: micro, conservative, moderate, degen, whale
  - Custom limits: per-transaction, per-hour, per-day
  - Approval thresholds for large transactions
  - Reserve SOL for gas fees
  - Real-time spending tracking
  - Example: `paw guardrails agent-alice --enable --profile micro`

#### ✨ Features
- **Risk Profiles** - Pre-configured limit sets for different use cases:
  - **Micro**: 0.1 SOL/tx, 0.5 SOL/hour, 2 SOL/day (perfect for $100 wallets)
  - **Conservative**: 0.5 SOL/tx, 2 SOL/hour, 10 SOL/day
  - **Moderate**: 2 SOL/tx, 10 SOL/hour, 50 SOL/day
  - **Degen**: 10 SOL/tx, 50 SOL/hour, 200 SOL/day (meme trading)
  - **Whale**: 100 SOL/tx, 500 SOL/hour, 2000 SOL/day

- **Transaction Tracking** - Automatic spending history
  - Tracks all buy/sell/send transactions
  - Hourly and daily spending summaries
  - Shows remaining limits in real-time

- **Integrated Protection** - Guardrails check all transactions
  - `paw buy` - Checks before executing swaps
  - `paw send` - Checks before sending SOL/tokens
  - Blocks transactions that exceed limits
  - Optional approval for large amounts

- **Easy On/Off** - Simple enable/disable
  - `--enable` to turn on protection
  - `--disable` to remove all limits
  - `--show` to check current status
  - Disabled by default (opt-in for safety)

#### 🔒 Security Benefits
- **Protects from wallet drainage** - Even if attacker gets access
- **Prevents agent mistakes** - Buggy code can't drain wallet
- **Configurable safety** - Set limits that match your risk tolerance
- **No performance impact** - Only checks when guardrails enabled

#### 📚 Documentation
- Updated SKILLS.md with guardrails examples
- Added risk profile explanations
- Created guardrails usage guide

#### 🎯 Why This Matters
Guardrails transform PAW from "autonomous but risky" to "autonomous and safe". Agents can trade freely within limits you set, but can't drain your entire wallet if something goes wrong.

**Use Cases:**
- Testing new trading strategies with limited risk
- Running untrusted agent code safely
- Setting daily budgets for trading bots
- Protecting against bugs or exploits

### Technical Details
- Guardrails stored in `~/.paw/guardrails/<agent-id>.json`
- Transaction history kept (last 1000 transactions)
- Time-window based limits (rolling hour/day)
- Integrated into buy and send commands
- Zero overhead when disabled

---

## [1.1.0] - 2026-03-01

### Added - Intent-Based Commands (Agentic Wallet v2.0 Phase 1)

#### 🤖 New Commands
- **`paw buy`** - Intent-based token buying with agent-friendly interface
  - High-level interface: specify budget and token, not mint addresses
  - Automatic quote fetching with price impact analysis
  - Confidence scoring based on market conditions
  - Clear execution plan display
  - Dry run mode for testing strategies
  - Example: `paw buy --agent-id bot --token BONK --budget 0.2 --max-slippage 10`

- **`paw sell`** - Intent-based token selling with percentage support
  - Sell by amount or percentage (e.g., 50%)
  - Automatic balance calculation for percentages
  - Same smart quoting and execution planning as buy
  - Example: `paw sell --agent-id bot --token BONK --amount 50% --currency SOL`

#### ✨ Features
- **Dry Run Mode**: Test any buy/sell without executing (`--dry-run` flag)
- **Optimization Strategies**: Choose between `best_price`, `maximum_tokens`, `fastest`
- **Smart Quoting**: Automatic price impact and confidence calculation
- **Execution Plans**: See exactly what will happen before transactions execute
- **Percentage Support**: Sell portions of holdings easily (e.g., `--amount 50%`)

#### 📚 Documentation
- Updated README with intent-based command examples
- Added agent usage examples for buy/sell commands
- Created `examples/intent-trading.sh` demo script
- Updated Quick Start guide with new commands

#### 🎯 Why This Matters
This is Phase 1 of transforming PAW into a truly autonomous agentic wallet. Instead of agents needing to:
- Calculate exact amounts in smallest units
- Look up mint addresses
- Manually set slippage in basis points
- Parse complex swap outputs

They can now:
- Express high-level intents ("buy BONK with 0.2 SOL budget")
- Get clear execution plans with confidence scores
- Test strategies with dry runs
- Use natural percentage-based selling

**Next Up**: Session-based authentication, guardrails, and strategy engine (Phase 2)

### Technical Details
- Built on existing Jupiter swap infrastructure
- Maintains all security features (double encryption, machine-bound keys)
- Backward compatible - all existing commands still work
- Zero breaking changes

---

## [1.0.7] - 2026-02-28

### Added
- Address with QR Code display
- Export private key with safety checks
- Import wallet from private key
- Multi-send (batch SOL payments)
- SPL token send support

### Fixed
- Token decimal handling for various SPL tokens
- Balance calculation for portfolio view

---

## [1.0.0] - 2026-02-15

### Initial Release
- Core wallet infrastructure
- Programmatic wallet creation
- Automated transaction signing
- SOL/SPL token support
- Secure key management (double encryption)
- Jupiter DEX integration
- Multi-agent support
- Interactive dashboard
- Helius RPC integration
