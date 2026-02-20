#!/bin/bash

# Multi-Network Example
# Shows how the same wallet works on different networks

echo "📟 PAW - Multi-Network Example"
echo "=============================="
echo ""

AGENT_ID="multi-network-agent"

# Create wallet (defaults to devnet)
echo "1. Creating wallet..."
paw init --agent-id $AGENT_ID
echo ""

# Get address (same on all networks)
echo "2. Wallet address (same on all networks):"
paw address --agent-id $AGENT_ID
echo ""

# Check balance on different networks
echo "3. Checking balance on different networks:"
echo ""

echo "Devnet:"
paw balance --agent-id $AGENT_ID --network devnet
echo ""

echo "Mainnet-beta:"
paw balance --agent-id $AGENT_ID --network mainnet-beta
echo ""

echo "Testnet:"
paw balance --agent-id $AGENT_ID --network testnet
echo ""

echo "✅ Same wallet, different networks!"
echo ""
echo "Key points:"
echo "  • Your wallet address is the SAME on all networks"
echo "  • Your balance is DIFFERENT on each network"
echo "  • Use --network flag to switch between networks"
echo "  • Devnet: Free SOL for testing"
echo "  • Mainnet: Real SOL (costs money)"
echo "  • Testnet: Free SOL for testing"
