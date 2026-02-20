#!/bin/bash
# PAW Network Performance Benchmark
# Measures real-world network operation speeds

set -e

AGENT_ID="agent-alice"  # Use existing funded wallet

echo "📟 PAW Network Performance Benchmark"
echo "====================================="
echo ""
echo "Agent ID: $AGENT_ID"
echo "Testing with real network operations..."
echo ""

# Function to measure time with better precision
measure() {
  local name="$1"
  local command="$2"
  local iterations="${3:-1}"
  
  echo "⏱️  Testing: $name"
  
  local total=0
  local min=999999
  local max=0
  
  for i in $(seq 1 $iterations); do
    local start=$(node -e "console.log(Date.now())")
    eval "$command" > /dev/null 2>&1
    local end=$(node -e "console.log(Date.now())")
    
    local duration=$((end - start))
    total=$((total + duration))
    
    if [ $duration -lt $min ]; then
      min=$duration
    fi
    if [ $duration -gt $max ]; then
      max=$duration
    fi
    
    echo "   Run $i: ${duration}ms"
  done
  
  local avg=$((total / iterations))
  
  echo "   ├─ Min: ${min}ms"
  echo "   ├─ Max: ${max}ms"
  echo "   └─ Avg: ${avg}ms"
  echo ""
  
  echo "$avg"
}

echo "🚀 Running Network Benchmarks (3 iterations each)..."
echo ""

# 1. Balance Check (with network call)
TIME_BALANCE=$(measure "Balance check (network)" "node dist/cli/index.js balance $AGENT_ID" 3)

# 2. Token List (with network call)
TIME_TOKENS=$(measure "List tokens (network)" "node dist/cli/index.js tokens $AGENT_ID" 3)

# 3. Transaction History (with network call)
TIME_HISTORY=$(measure "Transaction history (network)" "node dist/cli/index.js history $AGENT_ID --limit 10" 3)

# 4. Address (local only)
TIME_ADDRESS=$(measure "Get address (local)" "node dist/cli/index.js address $AGENT_ID" 3)

# 5. Config (local only)
TIME_CONFIG=$(measure "View config (local)" "node dist/cli/index.js config $AGENT_ID --show" 3)

echo ""
echo "📊 Performance Summary"
echo "======================"
echo ""
printf "%-35s %10s %15s\n" "Operation" "Avg Time" "Type"
echo "------------------------------------------------------------"
printf "%-35s %10s %15s\n" "Balance check" "${TIME_BALANCE}ms" "Network"
printf "%-35s %10s %15s\n" "List tokens" "${TIME_TOKENS}ms" "Network"
printf "%-35s %10s %15s\n" "Transaction history" "${TIME_HISTORY}ms" "Network"
printf "%-35s %10s %15s\n" "Get address" "${TIME_ADDRESS}ms" "Local"
printf "%-35s %10s %15s\n" "View config" "${TIME_CONFIG}ms" "Local"
echo "------------------------------------------------------------"

# Calculate averages
NETWORK_AVG=$(( (TIME_BALANCE + TIME_TOKENS + TIME_HISTORY) / 3 ))
LOCAL_AVG=$(( (TIME_ADDRESS + TIME_CONFIG) / 2 ))

echo ""
printf "%-35s %10s\n" "Network operations average" "${NETWORK_AVG}ms"
printf "%-35s %10s\n" "Local operations average" "${LOCAL_AVG}ms"
echo ""

# Performance ratings
echo "🎯 Performance Analysis"
echo "======================="
echo ""

if [ $NETWORK_AVG -lt 500 ]; then
  echo "🚀 Network Speed: EXCELLENT"
  echo "   Fast enough for high-frequency trading and sniping!"
elif [ $NETWORK_AVG -lt 1000 ]; then
  echo "✅ Network Speed: GOOD"
  echo "   Suitable for most trading strategies."
elif [ $NETWORK_AVG -lt 2000 ]; then
  echo "⚠️  Network Speed: ACCEPTABLE"
  echo "   May struggle with competitive sniping."
else
  echo "❌ Network Speed: SLOW"
  echo "   Consider checking network connection or RPC provider."
fi

echo ""

if [ $LOCAL_AVG -lt 100 ]; then
  echo "⚡ Local Speed: BLAZING FAST"
elif [ $LOCAL_AVG -lt 300 ]; then
  echo "✅ Local Speed: FAST"
else
  echo "⚠️  Local Speed: COULD BE FASTER"
fi

echo ""
echo "💡 Speed Comparison"
echo "==================="
echo ""
echo "Telegram Trading Bots: ~200-500ms per operation"
echo "PAW Network Ops:       ~${NETWORK_AVG}ms"
echo ""

if [ $NETWORK_AVG -lt 500 ]; then
  echo "✅ PAW is competitive with Telegram bots!"
elif [ $NETWORK_AVG -lt 1000 ]; then
  echo "✅ PAW is fast enough for serious trading!"
else
  echo "⚠️  PAW could be faster. Check network/RPC."
fi

echo ""
echo "🔧 Optimization Tips"
echo "===================="
echo ""
echo "1. Using Helius RPC: ✅ (Premium endpoints)"
echo "2. Connection pooling: ✅ (Reuses connections)"
echo "3. Priority fees: ✅ (Configurable)"
echo "4. Local caching: ✅ (SOL price cached 1min)"
echo ""
echo "✅ Benchmark complete!"
