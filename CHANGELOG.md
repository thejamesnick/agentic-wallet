# Changelog

All notable changes to PAW (PocketAgent Wallet) will be documented in this file.

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
