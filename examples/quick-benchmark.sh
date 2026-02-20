#!/bin/bash
# Quick PAW Performance Test

echo "PAW Performance Test"
echo "===================="
echo ""

# Test balance check
echo "Testing balance check (3 runs)..."
time node dist/cli/index.js balance agent-alice > /dev/null 2>&1
time node dist/cli/index.js balance agent-alice > /dev/null 2>&1
time node dist/cli/index.js balance agent-alice > /dev/null 2>&1

echo ""
echo "Testing tokens list (3 runs)..."
time node dist/cli/index.js tokens agent-alice > /dev/null 2>&1
time node dist/cli/index.js tokens agent-alice > /dev/null 2>&1
time node dist/cli/index.js tokens agent-alice > /dev/null 2>&1

echo ""
echo "Testing history (3 runs)..."
time node dist/cli/index.js history agent-alice > /dev/null 2>&1
time node dist/cli/index.js history agent-alice > /dev/null 2>&1
time node dist/cli/index.js history agent-alice > /dev/null 2>&1

echo ""
echo "Testing address (local, 3 runs)..."
time node dist/cli/index.js address agent-alice > /dev/null 2>&1
time node dist/cli/index.js address agent-alice > /dev/null 2>&1
time node dist/cli/index.js address agent-alice > /dev/null 2>&1

echo ""
echo "Done!"
echo ""
echo "Note: Times include Node.js startup (~500-700ms)"
echo "Actual network operations are much faster!"
