# 📟 PAW Testing Guide

This guide shows how to test all PAW wallet functionality.

## Prerequisites

1. Build the project:
```bash
yarn build
```

2. Ensure you have Solana CLI installed (optional, for funding wallets):
```bash
solana --version
```

## Quick Test Commands

### 1. Create Agent Wallets

Create two test agents:

```bash
# Create Alice's wallet
paw init agent-alice

# Create Bob's wallet
paw init agent-bob
```

Expected output:
```
📟 PAW - PocketAgent Wallet
Creating wallet for agent...

✅ Wallet created successfully!

Agent ID: agent-alice
Address:  [SOLANA_ADDRESS]
Network:  devnet
Created:  [TIMESTAMP]

📟 Security:
  • Wallet encrypted with AES-256-GCM
  • Passphrase encrypted with machine-specific key
  • Files stored in ~/.paw/agents/agent-alice
```

### 2. Check Wallet Addresses

```bash
# Get Alice's address
paw address agent-alice

# Get Bob's address
paw address agent-bob
```

### 3. Fund Wallets (Devnet)

Option A - Using Solana CLI:
```bash
solana airdrop 1 [ALICE_ADDRESS] --url devnet
```

Option B - Using Web Faucet:
1. Visit https://faucet.solana.com
2. Paste Alice's address
3. Request devnet SOL

### 4. Check Balances

```bash
# Check Alice's balance
paw balance agent-alice

# Check Bob's balance
paw balance agent-bob
```

Expected output:
```
📟 PAW - Balance
Agent ID: agent-alice
Address:  [ADDRESS]
Balance:  1.000000000 SOL
Network:  devnet
```

### 5. Send Transaction

Send 0.1 SOL from Alice to Bob:

```bash
paw send agent-alice --to [BOB_ADDRESS] --amount 0.1
```

Expected output:
```
📟 PAW - Send Transaction
Agent ID: agent-alice
To:       [BOB_ADDRESS]
Amount:   0.1 SOL
Network:  devnet

Signing transaction...

✅ Transaction sent!
Signature: [TX_SIGNATURE]
Explorer:  https://explorer.solana.com/tx/[TX_SIGNATURE]?cluster=devnet
```

### 6. Verify Balances After Transfer

```bash
# Alice should have ~0.9 SOL (minus fees)
paw balance agent-alice

# Bob should have 0.1 SOL
paw balance agent-bob
```

### 7. Check Transaction History

```bash
# Alice's transaction history
paw history agent-alice --limit 5

# Bob's transaction history
paw history agent-bob --limit 5
```

Expected output:
```
📟 PAW - Transaction History
Agent ID: agent-alice
Network:  devnet

Recent transactions:

✅ [SIGNATURE]
   Time: [TIMESTAMP]
   Slot: [SLOT_NUMBER]
   Explorer: https://explorer.solana.com/tx/[SIGNATURE]?cluster=devnet
```

## Advanced Testing

### Test Token Swaps (Mainnet Only)

Jupiter DEX integration works on mainnet-beta:

```bash
# Swap 0.01 SOL for USDC
node dist/cli/index.js swap \
  --agent-id agent-alice \
  --from SOL \
  --to USDC \
  --amount 0.01 \
  --network mainnet-beta
```

### Test with Custom Passphrase

```bash
# Create wallet with custom passphrase
node dist/cli/index.js init \
  --agent-id secure-agent \
  --passphrase "my-super-secure-passphrase-123"
```

## Automated Test Script

Run the full test flow:

```bash
./test-flow.sh
```

This script will:
1. Create two agent wallets
2. Display their addresses
3. Fund Alice's wallet (if faucet available)
4. Check initial balances
5. Send SOL from Alice to Bob
6. Verify final balances
7. Show transaction history

## Troubleshooting

### Devnet Faucet Rate Limiting

If you see "airdrop request failed", the devnet faucet is rate limited:

**Solutions:**
1. Wait 5-10 minutes and try again
2. Use the web faucet: https://faucet.solana.com
3. Use a different RPC endpoint
4. Test on localnet instead

### Transaction Confirmation Timeout

If transactions timeout:
1. Check Solana devnet status: https://status.solana.com
2. Try again with a different RPC
3. Increase confirmation timeout in code

### Wallet Already Exists

If you see "Wallet already exists":
```bash
# Delete existing wallet
rm -rf ~/.paw/agents/[AGENT_ID]

# Or use a different agent ID
node dist/cli/index.js init --agent-id agent-alice-2
```

## Security Testing

### Verify Encryption

Check that wallet files are encrypted:

```bash
# Try to read the encrypted keypair (should be gibberish)
cat ~/.paw/agents/agent-alice/keypair.enc | head -c 100

# Try to read the encrypted passphrase (should be gibberish)
cat ~/.paw/agents/agent-alice/passphrase.enc | head -c 100
```

### Test Machine-Specific Encryption

1. Create a wallet on your machine
2. Copy `~/.paw/agents/[AGENT_ID]` to another machine
3. Try to use the wallet - it should fail because the machine identity is different

### Verify Memory Clearing

The keypair is cleared from memory after each operation. This is handled automatically by the `SignerEngine`.

## Expected File Structure

After creating a wallet, you should see:

```
~/.paw/
└── agents/
    └── agent-alice/
        ├── config.json          # Public info (address, network, etc)
        ├── keypair.enc          # Encrypted keypair (AES-256-GCM)
        └── passphrase.enc       # Encrypted passphrase (machine-specific)
```

## Performance Benchmarks

Typical operation times on devnet:

- Create wallet: ~100ms
- Load wallet: ~50ms
- Sign transaction: ~100ms
- Send transaction: ~2-5 seconds (network dependent)
- Check balance: ~500ms
- Get history: ~1-2 seconds

## Next Steps

After testing:

1. Review the code in `src/` to understand the implementation
2. Read `technical/DEEP_DIVE.md` for security details
3. Check `about/ARCHITECTURE.md` for system design
4. Build your AI agent integration!
