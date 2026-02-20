#!/bin/bash

# PAW Test Flow Script
# This script demonstrates the full wallet functionality

echo "📟 PAW - Full Test Flow"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create two agent wallets
echo -e "${CYAN}Step 1: Creating two agent wallets${NC}"
echo "-----------------------------------"
node dist/cli/index.js init --agent-id agent-alice
echo ""
node dist/cli/index.js init --agent-id agent-bob
echo ""

# Step 2: Show addresses
echo -e "${CYAN}Step 2: Wallet addresses${NC}"
echo "------------------------"
ALICE_ADDR=$(node dist/cli/index.js address --agent-id agent-alice 2>/dev/null | grep "Address:" | awk '{print $2}')
BOB_ADDR=$(node dist/cli/index.js address --agent-id agent-bob 2>/dev/null | grep "Address:" | awk '{print $2}')

echo -e "Alice: ${YELLOW}$ALICE_ADDR${NC}"
echo -e "Bob:   ${YELLOW}$BOB_ADDR${NC}"
echo ""

# Step 3: Fund Alice's wallet
echo -e "${CYAN}Step 3: Funding Alice's wallet${NC}"
echo "-------------------------------"
echo "Requesting airdrop from Solana devnet faucet..."
solana airdrop 1 $ALICE_ADDR --url devnet 2>&1 | head -n 2
echo ""
sleep 2

# Step 4: Check balances
echo -e "${CYAN}Step 4: Check initial balances${NC}"
echo "-------------------------------"
node dist/cli/index.js balance --agent-id agent-alice
node dist/cli/index.js balance --agent-id agent-bob
echo ""

# Step 5: Send from Alice to Bob
echo -e "${CYAN}Step 5: Alice sends 0.1 SOL to Bob${NC}"
echo "-----------------------------------"
node dist/cli/index.js send --agent-id agent-alice --to $BOB_ADDR --amount 0.1
echo ""
sleep 2

# Step 6: Check balances after transfer
echo -e "${CYAN}Step 6: Check balances after transfer${NC}"
echo "--------------------------------------"
node dist/cli/index.js balance --agent-id agent-alice
node dist/cli/index.js balance --agent-id agent-bob
echo ""

# Step 7: Check transaction history
echo -e "${CYAN}Step 7: Transaction history${NC}"
echo "---------------------------"
echo "Alice's transactions:"
node dist/cli/index.js history --agent-id agent-alice --limit 5
echo ""
echo "Bob's transactions:"
node dist/cli/index.js history --agent-id agent-bob --limit 5
echo ""

echo -e "${GREEN}✅ Test flow complete!${NC}"
echo ""
echo "Note: If airdrop failed due to rate limiting, you can:"
echo "1. Wait a few minutes and try again"
echo "2. Use the web faucet: https://faucet.solana.com"
echo "3. Manually fund the wallet and re-run steps 4-7"
