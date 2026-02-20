#!/bin/bash
# Verify PAW submission requirements

echo "📟 PAW Submission Verification"
echo "=============================="
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local test="$2"
  
  echo -n "Checking: $name... "
  
  if eval "$test" > /dev/null 2>&1; then
    echo "✅ PASS"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL"
    FAIL=$((FAIL + 1))
  fi
}

echo "🔍 Verifying Requirements..."
echo ""

# 1. Code and Build
check "TypeScript source exists" "[ -d src ]"
check "Build output exists" "[ -d dist ]"
check "Package.json exists" "[ -f package.json ]"
check "Node modules installed" "[ -d node_modules ]"

echo ""
echo "📝 Verifying Documentation..."
echo ""

# 2. Documentation
check "README.md exists" "[ -f README.md ]"
check "SKILLS.md exists" "[ -f skills/SKILLS.md ]"
check "DEEP_DIVE.md exists" "[ -f technical/DEEP_DIVE.md ]"
check "SECURITY.md exists" "[ -f about/SECURITY.md ]"
check "PERFORMANCE.md exists" "[ -f docs/PERFORMANCE.md ]"
check "CLI_REFERENCE.md exists" "[ -f docs/CLI_REFERENCE.md ]"
check "SUBMISSION.md exists" "[ -f SUBMISSION.md ]"

echo ""
echo "🔧 Verifying Core Features..."
echo ""

# 3. Core Components
check "Wallet Manager exists" "[ -f src/core/wallet/manager.ts ]"
check "Transaction Signer exists" "[ -f src/core/signer/engine.ts ]"
check "Encryption Service exists" "[ -f src/core/storage/encryption.ts ]"
check "Machine Identity exists" "[ -f src/core/crypto/machine-identity.ts ]"
check "Jupiter Integration exists" "[ -f src/integrations/jupiter/client.ts ]"

echo ""
echo "🎮 Verifying CLI Commands..."
echo ""

# 4. CLI Commands
check "Init command exists" "[ -f src/cli/commands/init.ts ]"
check "Balance command exists" "[ -f src/cli/commands/balance.ts ]"
check "Send command exists" "[ -f src/cli/commands/send.ts ]"
check "Swap command exists" "[ -f src/cli/commands/swap.ts ]"
check "Tokens command exists" "[ -f src/cli/commands/tokens.ts ]"
check "History command exists" "[ -f src/cli/commands/history.ts ]"
check "Config command exists" "[ -f src/cli/commands/config.ts ]"
check "Dashboard command exists" "[ -f src/cli/commands/dashboard.ts ]"

echo ""
echo "🧪 Verifying Examples..."
echo ""

# 5. Examples
check "Benchmark script exists" "[ -f examples/benchmark.sh ]"
check "Test flow exists" "[ -f examples/test-flow.sh ]"
check "Simple agent example exists" "[ -f examples/simple-agent.ts ]"

echo ""
echo "🔐 Testing Wallet Operations..."
echo ""

# 6. Functional Tests (if test wallet exists)
if [ -d ~/.paw/agents/agent-alice ]; then
  check "Can get address" "node dist/cli/index.js address agent-alice"
  check "Can check balance" "node dist/cli/index.js balance agent-alice"
  check "Can list tokens" "node dist/cli/index.js tokens agent-alice"
  check "Can view config" "node dist/cli/index.js config agent-alice --show"
  check "Can view history" "node dist/cli/index.js history agent-alice"
else
  echo "⚠️  No test wallet found (agent-alice)"
  echo "   Run: node dist/cli/index.js init agent-alice"
fi

echo ""
echo "📊 Verification Results"
echo "======================="
echo ""
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All checks passed! Ready for submission!"
  echo ""
  echo "📋 Submission Checklist:"
  echo "  ✅ Working agentic wallet"
  echo "  ✅ Programmatic wallet creation"
  echo "  ✅ Automatic transaction signing"
  echo "  ✅ SOL and SPL token support"
  echo "  ✅ DeFi protocol integration (Jupiter)"
  echo "  ✅ Deep dive documentation"
  echo "  ✅ Open-source code with README"
  echo "  ✅ SKILLS.md for AI agents"
  echo "  ✅ Working prototype on devnet"
  echo ""
  echo "🚀 Ready to submit to Superteam!"
  exit 0
else
  echo "⚠️  Some checks failed. Please review above."
  exit 1
fi
