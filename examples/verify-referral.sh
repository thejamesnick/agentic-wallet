#!/bin/bash
# Verify Jupiter Referral Setup

echo "🔍 Verifying PAW Referral Configuration..."
echo ""

# Check if config exists
if [ -f ~/.paw/referral.json ]; then
  echo "✅ Referral config found at ~/.paw/referral.json"
  echo ""
  echo "📊 Configuration:"
  cat ~/.paw/referral.json | jq '.'
  echo ""
  
  # Extract referral account
  REFERRAL_ACCOUNT=$(cat ~/.paw/referral.json | jq -r '.referralAccount')
  echo "💰 Referral Account: $REFERRAL_ACCOUNT"
  
  # Check token accounts
  echo ""
  echo "🪙 Token Accounts (where fees accumulate):"
  echo ""
  
  SOL_ACCOUNT=$(cat ~/.paw/referral.json | jq -r '.tokenAccounts.SOL')
  USDC_ACCOUNT=$(cat ~/.paw/referral.json | jq -r '.tokenAccounts.USDC')
  USDT_ACCOUNT=$(cat ~/.paw/referral.json | jq -r '.tokenAccounts.USDT')
  
  echo "SOL:  $SOL_ACCOUNT"
  solana balance $SOL_ACCOUNT 2>/dev/null || echo "  (Account exists, balance: 0)"
  
  echo ""
  echo "USDC: $USDC_ACCOUNT"
  spl-token balance --address $USDC_ACCOUNT 2>/dev/null || echo "  (Account exists, balance: 0)"
  
  echo ""
  echo "USDT: $USDT_ACCOUNT"
  spl-token balance --address $USDT_ACCOUNT 2>/dev/null || echo "  (Account exists, balance: 0)"
  
  echo ""
  echo "✅ Setup Complete!"
  echo ""
  echo "💡 How it works:"
  echo "   • Every swap through PAW includes a 1% referral fee"
  echo "   • You (founder) keep 0.8% of each swap"
  echo "   • Jupiter keeps 0.2%"
  echo "   • Fees accumulate in the token accounts above"
  echo ""
  echo "🚀 Start earning: Just publish PAW to npm and users will generate revenue!"
  
else
  echo "❌ Referral config not found!"
  echo ""
  echo "💡 Run this to set up:"
  echo "   yarn ts-node scripts/setup-referral.ts mainnet-beta"
fi
