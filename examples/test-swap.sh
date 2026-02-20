#!/bin/bash

# Jupiter Swap Test Script
# NOTE: Jupiter only works on mainnet-beta, not devnet

echo "📟 PAW - Jupiter Swap Test"
echo "=========================="
echo ""

AGENT_ID="swap-test-agent"

# Step 1: Create wallet on mainnet
echo "1. Creating wallet on mainnet-beta..."
paw init $AGENT_ID --network mainnet-beta
echo ""

# Step 2: Get address
echo "2. Getting wallet address..."
ADDRESS=$(paw address $AGENT_ID | grep "Address:" | awk '{print $2}')
echo "Address: $ADDRESS"
echo ""

# Step 3: Check balance
echo "3. Checking balance..."
paw balance $AGENT_ID
echo ""

# Step 4: Fund wallet (manual step)
echo "4. Fund wallet with SOL:"
echo "   Send at least 0.01 SOL to: $ADDRESS"
echo "   Press Enter when funded..."
read

# Step 5: Check balance again
echo "5. Verifying balance..."
paw balance $AGENT_ID
echo ""

# Step 6: Swap 0.005 SOL for USDC
echo "6. Swapping 0.005 SOL for USDC..."
paw swap $AGENT_ID --from SOL --to USDC --amount 0.005
echo ""

# Step 7: Check tokens
echo "7. Checking token balances..."
paw tokens $AGENT_ID
echo ""

# Step 8: Check history
echo "8. Checking transaction history..."
paw history $AGENT_ID --limit 5
echo ""

echo "✅ Swap test complete!"
echo ""
echo "Note: Jupiter swaps only work on mainnet-beta"
echo "Devnet does not support Jupiter DEX"
