#!/bin/bash
# PAW Performance Benchmark
# Measures speed of all wallet operations

set -e

AGENT_ID="benchmark-bot-$(date +%s)"
RECIPIENT="DJcVfT6dienfSbudJzZ82WN4EkVPgVaT18oBK971Yi2c"

echo "📟 PAW Performance Benchmark"
echo "============================"
echo ""
echo "Agent ID: $AGENT_ID"
echo "Network: devnet"
echo ""

# Function to measure time
measure() {
  local name="$1"
  local command="$2"
  
  echo -n "⏱️  $name... "
  
  local start=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
  eval "$command" > /dev/null 2>&1
  local end=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
  
  local duration=$((end - start))
  echo "${duration}ms"
  
  # Return duration for summary
  echo "$duration"
}

echo "🚀 Running Benchmarks..."
echo ""

# 1. Wallet Creation
TIME_INIT=$(measure "Init wallet" "node dist/cli/index.js init $AGENT_ID")

# 2. Get Address
TIME_ADDRESS=$(measure "Get address" "node dist/cli/index.js address $AGENT_ID")

# 3. Check Balance
TIME_BALANCE=$(measure "Check balance" "node dist/cli/index.js balance $AGENT_ID")

# 4. List Tokens
TIME_TOKENS=$(measure "List tokens" "node dist/cli/index.js tokens $AGENT_ID")

# 5. View History
TIME_HISTORY=$(measure "View history" "node dist/cli/index.js history $AGENT_ID")

# 6. View Config
TIME_CONFIG=$(measure "View config" "node dist/cli/index.js config $AGENT_ID --show")

# 7. Update Config
TIME_CONFIG_UPDATE=$(measure "Update config" "node dist/cli/index.js config $AGENT_ID --network mainnet-beta --slippage 1000")

echo ""
echo "📊 Results Summary"
echo "===================="
echo ""
printf "%-25s %10s\n" "Operation" "Time (ms)"
echo "----------------------------------------"
printf "%-25s %10s\n" "Init wallet" "${TIME_INIT}ms"
printf "%-25s %10s\n" "Get address" "${TIME_ADDRESS}ms"
printf "%-25s %10s\n" "Check balance" "${TIME_BALANCE}ms"
printf "%-25s %10s\n" "List tokens" "${TIME_TOKENS}ms"
printf "%-25s %10s\n" "View history" "${TIME_HISTORY}ms"
printf "%-25s %10s\n" "View config" "${TIME_CONFIG}ms"
printf "%-25s %10s\n" "Update config" "${TIME_CONFIG_UPDATE}ms"
echo "----------------------------------------"

# Calculate average
TOTAL=$((TIME_INIT + TIME_ADDRESS + TIME_BALANCE + TIME_TOKENS + TIME_HISTORY + TIME_CONFIG + TIME_CONFIG_UPDATE))
AVG=$((TOTAL / 7))

echo ""
printf "%-25s %10s\n" "Average" "${AVG}ms"
echo ""

# Performance rating
if [ $AVG -lt 500 ]; then
  echo "🚀 Performance: EXCELLENT (Telegram bot speed!)"
elif [ $AVG -lt 1000 ]; then
  echo "✅ Performance: GOOD (Fast enough for trading)"
elif [ $AVG -lt 2000 ]; then
  echo "⚠️  Performance: ACCEPTABLE (Could be faster)"
else
  echo "❌ Performance: SLOW (Needs optimization)"
fi

echo ""
echo "💡 Notes:"
echo "   - Init wallet includes encryption (one-time cost)"
echo "   - Balance/tokens/history depend on network speed"
echo "   - Using Helius RPC for optimal performance"
echo ""

# Cleanup
echo "🧹 Cleaning up test wallet..."
rm -rf ~/.paw/agents/$AGENT_ID

echo "✅ Benchmark complete!"
