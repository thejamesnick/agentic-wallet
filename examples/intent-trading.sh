#!/bin/bash

# Intent-Based Trading Example
# Demonstrates the new agent-friendly buy/sell commands

AGENT_ID="demo-trader"

echo "📟 PAW - Intent-Based Trading Demo"
echo "===================================="
echo ""

# 1. Dry run - test buy without executing
echo "1️⃣  Testing buy intent (dry run)..."
paw buy \
  --agent-id $AGENT_ID \
  --token BONK \
  --budget 0.1 \
  --currency SOL \
  --max-slippage 10 \
  --dry-run

echo ""
echo "Press Enter to continue..."
read

# 2. Execute buy
echo "2️⃣  Executing buy intent..."
paw buy \
  --agent-id $AGENT_ID \
  --token BONK \
  --budget 0.1 \
  --currency SOL \
  --max-slippage 10 \
  --optimize-for best_price

echo ""
echo "Press Enter to continue..."
read

# 3. Check balance
echo "3️⃣  Checking balance..."
paw balance $AGENT_ID

echo ""
echo "Press Enter to continue..."
read

# 4. Sell 50% of holdings
echo "4️⃣  Selling 50% of BONK..."
paw sell \
  --agent-id $AGENT_ID \
  --token BONK \
  --amount 50% \
  --currency SOL \
  --max-slippage 10

echo ""
echo "✅ Demo complete!"
