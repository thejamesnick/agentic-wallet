# Changelog

All notable changes to PAW (PocketAgent Wallet) will be documented in this file.

## [1.4.2] - 2026-06-02

### Added - Flexible RPC Configurations & Fallbacks
- **Network-Specific RPC Overrides** - Configure separate RPC URLs using environment variables:
  - `SOLANA_RPC_URL_MAINNET` (for mainnet-beta network)
  - `SOLANA_RPC_URL_DEVNET` (for devnet network)
- **Global overrides** - Specify a generic RPC/WebSocket URL using `SOLANA_RPC_URL` or `SOLANA_WSS_URL` variables.
- **Agent-Specific RPC Config** - Pass custom `"rpcUrl"` inside any agent's `config.json` file (e.g. `rpcUrl: "https://api.devnet.solana.com"`) so that agent operations route through their specific node automatically.
- **Public Fallbacks** - Gracefully fallback to standard, public Solana RPC endpoints instead of failing when default Helius API keys are rate-limited.
- **CLI Commands integration** - Updated `balance`, `buy`, `sell`, `swap`, `send`, and `tokens` commands to honor customized agent RPC configurations.

## [1.4.0] - 2026-03-01

### Added - Webhook Events & Real-Time Balance Monitoring

#### 🔔 Webhook Support
- **HTTP POST Notifications** - Receive events via webhooks instead of file logging
  - Configure with `--format webhook --url <url>`
  - PAW sends HTTP POST to your endpoint for each event
  - Perfect for event-driven agent workflows
  - Example: `paw events bot --subscribe --format webhook --url https://myagent.com/webhook`

#### 📡 Real-Time Balance Monitoring (NEW!)
- **`paw monitor`** - Monitor wallet for balance changes in real-time
  - Uses Helius WebSocket for instant notifications
  - Detects external balance changes (incoming payments)
  - Fires `balance_changed` webhook events
  - Auto-reconnects if connection drops
  - Example: `paw monitor bot`

#### ✨ Features
- **Automatic Retry Logic** - Reliable delivery with exponential backoff
  - 3 retry attempts by default (configurable with `--retry`)
  - Exponential backoff: 2s, 4s, 8s delays
  - Only retries on 5xx errors (server issues)
  - Skips retry on 4xx errors (client issues)

- **Timeout Handling** - Prevents hanging on slow endpoints
  - 5 second timeout by default (configurable with `--timeout`)
  - Aborts request if endpoint doesn't respond
  - Continues to next event without blocking

- **Standard HTTP Format** - Easy to integrate with any agent
  - Content-Type: application/json
  - User-Agent: PAW-Wallet/1.4.0
  - Clean JSON payload with all event details

- **Balance Change Detection** - Know instantly when you receive payments
  - WebSocket connection to Helius
  - Real-time account monitoring
  - Fires webhook with balance change details
  - Works best on mainnet-beta

#### 📡 Webhook Payload
```json
{
  "event_id": "evt_1772375916023_6c44e214",
  "timestamp": "2026-03-01T14:38:36.023Z",
  "agent_id": "agent-alice",
  "type": "transaction_executed",
  "severity": "info",
  "message": "Send completed: 0.001 SOL to ...",
  "payload": {
    "type": "send",
    "to": "...",
    "amount": 0.001,
    "token": "SOL",
    "signature": "...",
    "explorer": "..."
  }
}
```

#### 🧪 Test Webhook Server
- **Included Test Server** - `examples/test-webhook-server.js`
  - Simple Node.js server for testing webhooks
  - Displays all received events in formatted output
  - Perfect for development and debugging
  - Usage: `node examples/test-webhook-server.js`

#### 🎯 Why This Matters
Webhooks + real-time monitoring enable true event-driven agent workflows. Instead of polling or tailing log files, agents receive instant HTTP notifications when wallet events occur. This is perfect for:
- **OpenClaw and AI agents** - Receive notifications in your agent's HTTP server
- **Payment detection** - Know instantly when customers send payments
- **Discord/Telegram bots** - Post transaction updates to chat
- **Monitoring dashboards** - Real-time wallet activity displays
- **Automated responses** - Trigger actions based on wallet events
- **Multi-agent coordination** - Notify other agents of transactions

**Use Cases:**
- Agent receives webhook → Posts to Discord: "🎉 Bought 1000 BONK!"
- Agent receives error webhook → Sends alert: "⚠️ Transaction failed"
- Agent receives guardrail block → Logs security event
- Agent receives transaction → Updates internal database
- Agent receives balance_changed → Processes incoming payment instantly

#### 📚 Documentation
- Created comprehensive `WEBHOOK-SPEC.md` with implementation details
- Updated SKILLS.md with webhook examples
- Added test webhook server with usage instructions
- Included webhook integration examples for agents

### Technical Details
- Webhooks use native fetch API (Node.js 18+)
- Retry logic with exponential backoff (1s, 2s, 4s, 8s)
- Configurable timeout (default: 5000ms)
- No blocking - failed webhooks don't stop event processing
- Webhook config stored in `~/.paw/events/config.json`
- Monitor uses Helius WebSocket (wss://mainnet.helius-rpc.com)
- WebSocket auto-reconnects with exponential backoff
- Balance monitoring requires ws package (included)

---

## [1.3.0] - 2026-03-01

### Added - Event Logging (Agent Visibility)

#### 📊 New Command
- **`paw events`** - Manage event logging and subscriptions
  - Subscribe to event stream with `--subscribe`
  - View recent events with `--show`
  - Unsubscribe with `--unsubscribe`
  - Clear event log with `--clear`
  - Example: `paw events agent-alice --subscribe`

#### ✨ Features
- **File-Based Event Stream** - JSON lines format for easy parsing
  - Events written to `~/.paw/events/<agent-id>.log`
  - One event per line (JSON)
  - Agents can tail the file for real-time updates
  - Custom log path with `--path` option

- **Event Types** - Comprehensive event coverage:
  - `transaction_executed` - Buy/sell/send completed
  - `transaction_failed` - Transaction failed
  - `guardrail_blocked` - Transaction blocked by limits
  - `guardrail_approved` - Transaction requires approval
  - `error_occurred` - Error during operation
  - `wallet_created` - New wallet initialized
  - `config_updated` - Configuration changed

- **Event Filtering** - Subscribe to specific events
  - Filter by event type: `--events transaction_executed,error_occurred`
  - Or log all events (default)

- **Formatted Display** - Human-readable event table
  - Shows timestamp, type, severity, message
  - Color-coded severity (🟢 info, 🟡 warning, 🔴 error)
  - Limit results with `--limit` option

- **Integrated Everywhere** - Events logged automatically
  - Buy command logs success/failure/errors
  - Sell command logs success/failure/errors
  - Send command logs success/failure/errors
  - Guardrails log blocks and approvals

#### 📚 Event Structure
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

#### 🎯 Why This Matters
Event logging gives agents full visibility into wallet operations. Agents can:
- Monitor transactions in real-time
- Track errors and failures
- Audit guardrail blocks
- Build automated responses to events
- Debug issues without manual inspection

**Use Cases:**
- Real-time monitoring dashboards
- Automated error recovery
- Transaction auditing
- Performance tracking
- Compliance logging

### Technical Details
- Events stored in `~/.paw/events/`
- JSON lines format (one event per line)
- Subscription config in `~/.paw/events/config.json`
- No performance impact when disabled
- Automatic file creation on first event

---

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
