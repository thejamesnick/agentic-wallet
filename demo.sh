#!/bin/bash

# ============================================================================
# PAW Autonomous Agent - DCA Bot Demo
# ============================================================================
# This demo shows how to:
# 1. Set up a spending policy with daily limits
# 2. Run an autonomous DCA agent
# 3. Monitor agent execution
# ============================================================================

set -e

echo ""
echo "🤖 PAW Autonomous Agent - DCA Bot Demo"
echo "======================================"
echo ""
echo "This demo shows a Dollar-Cost Averaging (DCA) bot that:"
echo "  • Automatically buys 1 SOL every day"
echo "  • Has a 50 USDC per-transaction limit"
echo "  • Has a 100 USDC daily spending limit"
echo "  • Logs all transactions for audit trail"
echo ""

# Setup
AGENT_ID="dca-demo-$(date +%s)"
echo "📋 Step 1: Initialize agent wallet"
echo "   Agent ID: $AGENT_ID"
echo ""
npm run build 2>/dev/null || true
npx paw init "$AGENT_ID"

echo ""
echo "📋 Step 2: Set spending policy"
echo "   Per-TX Limit: 50 USDC"
echo "   Daily Limit:  100 USDC"
echo "   Hourly Limit: 20 USDC"
echo "   Chain:        Solana only"
echo "   Actions:      Swaps only"
echo ""
npx paw agent policy set \
  --agent-id "$AGENT_ID" \
  --spend-limit 50 \
  --per-day 100 \
  --per-hour 20 \
  --chain solana \
  --allowed-actions swap \
  --expiry 30

echo ""
echo "📊 Step 3: Run DCA agent (once for demo)"
echo "   Strategy:  DCA"
echo "   Amount:    1.0 SOL"
echo "   Payment:   USDC"
echo "   Schedule:  Daily"
echo ""
npx paw agent run \
  --agent-id "$AGENT_ID" \
  --strategy dca \
  --target-token SOL \
  --payment-token USDC \
  --amount 1.0 \
  --schedule daily \
  --time "14:00" \
  --once

echo ""
echo "📊 Step 4: Check agent status"
echo ""
npx paw agent status --agent-id "$AGENT_ID"

echo ""
echo "✅ Demo Complete!"
echo ""
echo "To run the agent continuously in the background:"
echo "  npx paw agent run --agent-id $AGENT_ID --strategy dca --amount 1.0 --schedule daily"
echo ""
echo "To set a new policy:"
echo "  npx paw agent policy set --agent-id $AGENT_ID --spend-limit 100 --per-day 500"
echo ""
echo "To monitor execution:"
echo "  npx paw agent status --agent-id $AGENT_ID"
echo ""
