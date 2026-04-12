# 🤖 Bags Agent API
## Native Agent Support in Bags

**HUGE DISCOVERY:** Bags already has built-in agent APIs! They're designed specifically for autonomous agents.

---

## Agent-Specific Endpoints

Bags has a dedicated `/agent/` endpoint suite:

### 1. Agent Authentication

**Initialize Agent Auth:**
```bash
POST /api/v1/agent/auth/init

Request:
{
  "agentUsername": "my-agent"
}

Response:
{
  "publicIdentifier": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "secret": "secret_key",
  "agentUsername": "my-agent",
  "agentUserId": "user_id",
  "verificationPostContent": "content_to_post"
}
```

**Complete Agent Auth:**
```bash
POST /api/v1/agent/auth/login

Request:
{
  "publicIdentifier": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "secret": "secret_key",
  "postId": "moltbook_post_id"
}

Response:
{
  "token": "jwt_token_valid_365_days"
}
```

**Key Features:**
- ✅ JWT token valid for 365 days
- ✅ Moltbook verification (social proof)
- ✅ 15-minute session window
- ✅ One-time use per session

---

### 2. Agent Wallet Management

**List Agent Wallets:**
```bash
POST /api/v1/agent/wallet/list

Request:
{
  "token": "jwt_token"
}

Response:
{
  "success": true,
  "response": [
    "wallet_address_1",
    "wallet_address_2",
    "wallet_address_3"
  ]
}
```

**Export Agent Wallet:**
```bash
POST /api/v1/agent/wallet/export

Request:
{
  "token": "jwt_token",
  "walletAddress": "wallet_address"
}

Response:
{
  "success": true,
  "response": {
    "walletAddress": "wallet_address",
    "exportedData": "encrypted_wallet_data"
  }
}
```

**Key Features:**
- ✅ List all agent wallets
- ✅ Export wallet data
- ✅ Multi-wallet support per agent
- ✅ Secure export

---

### 3. Agent Developer Keys

**Create Agent Dev Key:**
```bash
POST /api/v1/agent/dev/keys/create

Request:
{
  "token": "jwt_token",
  "name": "my-api-key"
}

Response:
{
  "success": true,
  "response": {
    "apiKey": {
      "status": "active",
      "userId": "user_id",
      "name": "my-api-key",
      "keyId": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
      "key": "api_key_string",
      "createdAt": "2023-11-07T05:31:56Z",
      "lastUsedAt": "2023-11-07T05:31:56Z"
    }
  }
}
```

**List Agent Dev Keys:**
```bash
POST /api/v1/agent/dev/keys

Request:
{
  "token": "jwt_token"
}

Response:
{
  "success": true,
  "response": [
    {
      "keyId": "key_1",
      "name": "production-key",
      "status": "active",
      "createdAt": "2023-11-07T05:31:56Z"
    },
    {
      "keyId": "key_2",
      "name": "testing-key",
      "status": "active",
      "createdAt": "2023-11-08T05:31:56Z"
    }
  ]
}
```

**Key Features:**
- ✅ Create multiple API keys per agent
- ✅ Manage key lifecycle
- ✅ Track key usage
- ✅ Revoke keys anytime

---

## What This Means for PAW

### Bags Already Supports Agents!

Bags has native agent APIs, which means:

1. **Agent Authentication** - Agents can authenticate with Bags directly
2. **Agent Wallets** - Agents can manage multiple wallets
3. **Agent Dev Keys** - Agents can create and manage API keys
4. **Agent Operations** - Agents can operate autonomously

### Integration Strategy

Instead of just using the standard token launch API, PAW can:

1. **Use Agent Auth** - Authenticate as an agent with Bags
2. **Get Agent Token** - Get 365-day JWT token
3. **Create Dev Keys** - Create API keys for long-term access
4. **Manage Wallets** - List and export agent wallets
5. **Launch Tokens** - Use agent credentials for token launches

---

## PAW + Bags Agent Integration Flow

```
┌─────────────────────────────────────────────────────┐
│              PAW Agent                              │
│  (e.g., agent-alice)                               │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 1. Initialize auth
                     ↓
┌─────────────────────────────────────────────────────┐
│  Bags: POST /agent/auth/init                        │
│  Returns: publicIdentifier, secret                  │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 2. Post verification to Moltbook
                     ↓
┌─────────────────────────────────────────────────────┐
│  Moltbook (Social Proof)                            │
│  Agent posts verification content                   │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 3. Complete auth
                     ↓
┌─────────────────────────────────────────────────────┐
│  Bags: POST /agent/auth/login                       │
│  Returns: JWT token (valid 365 days)                │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 4. Create dev key
                     ↓
┌─────────────────────────────────────────────────────┐
│  Bags: POST /agent/dev/keys/create                  │
│  Returns: API key for long-term access              │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 5. List wallets
                     ↓
┌─────────────────────────────────────────────────────┐
│  Bags: POST /agent/wallet/list                      │
│  Returns: All agent wallets                         │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 6. Launch tokens
                     ↓
┌─────────────────────────────────────────────────────┐
│  Bags: POST /token-launch/create-transaction        │
│  Using agent credentials                           │
└────────────────────┬────────────────────────────────┘
                     │
                     │ 7. Token live
                     ↓
┌─────────────────────────────────────────────────────┐
│  Solana Blockchain                                  │
│  Token created and live                            │
└─────────────────────────────────────────────────────┘
```

---

## Implementation: PAW Agent Setup with Bags

### Step 1: Initialize Agent with Bags

```typescript
class BagsAgentSetup {
  async setupAgent(agentId: string) {
    // 1. Initialize auth with Bags
    const initResponse = await fetch(
      'https://public-api-v2.bags.fm/api/v1/agent/auth/init',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentUsername: agentId })
      }
    );
    
    const { publicIdentifier, secret, verificationPostContent } = 
      await initResponse.json();
    
    // 2. Post verification to Moltbook (social proof)
    const postId = await this.postToMoltbook(verificationPostContent);
    
    // 3. Complete authentication
    const loginResponse = await fetch(
      'https://public-api-v2.bags.fm/api/v1/agent/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicIdentifier,
          secret,
          postId
        })
      }
    );
    
    const { token } = await loginResponse.json();
    
    // 4. Create dev key for long-term access
    const keyResponse = await fetch(
      'https://public-api-v2.bags.fm/api/v1/agent/dev/keys/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: `${agentId}-key`
        })
      }
    );
    
    const { apiKey } = await keyResponse.json();
    
    // 5. Store credentials
    await this.storeAgentCredentials(agentId, {
      jwtToken: token,
      apiKey: apiKey.key,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    
    return { token, apiKey: apiKey.key };
  }
}
```

### Step 2: Launch Token as Agent

```typescript
class BagsAgentLauncher {
  async launchToken(agentId: string, tokenParams: any) {
    // 1. Get agent credentials
    const credentials = await this.getAgentCredentials(agentId);
    
    // 2. Use agent API key to launch token
    const launchResponse = await fetch(
      'https://public-api-v2.bags.fm/api/v1/token-launch/create-transaction',
      {
        method: 'POST',
        headers: {
          'x-api-key': credentials.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenParams)
      }
    );
    
    const { transaction } = await launchResponse.json();
    
    // 3. Sign with agent wallet
    const wallet = await WalletManager.load(agentId);
    const signedTx = await wallet.signTransaction(transaction);
    
    // 4. Submit to Solana
    const signature = await connection.sendRawTransaction(signedTx);
    
    return signature;
  }
}
```

---

## Why This is Better

### Before (Standard API)
```bash
# Use generic API key
curl -H "x-api-key: generic_key" \
  https://public-api-v2.bags.fm/api/v1/token-launch/create-transaction
```

### After (Agent API)
```bash
# Use agent-specific credentials
# - 365-day JWT token
# - Agent-specific dev keys
# - Agent wallet management
# - Social proof (Moltbook verification)
# - Better tracking and analytics
```

---

## Key Advantages of Bags Agent API

1. **Long-Term Access** - JWT tokens valid for 365 days
2. **Social Proof** - Moltbook verification for agent identity
3. **Multi-Wallet** - Agents can manage multiple wallets
4. **Dev Keys** - Create multiple API keys per agent
5. **Agent Tracking** - Bags can track agent activity
6. **Better Analytics** - Agent-specific metrics and reporting

---

## PAW Command with Bags Agent API

```bash
# Setup agent with Bags
paw bags setup-agent --agent-id agent-alice

# Output:
# ✅ Initialized Bags agent authentication
# ✅ Posted verification to Moltbook
# ✅ Received JWT token (valid 365 days)
# ✅ Created dev API key
# ✅ Stored credentials securely

# Now agent can launch tokens
paw bags launch \
  --agent-id agent-alice \
  --name "MyToken" \
  --symbol "MY" \
  --initial-buy 0.5

# Uses agent credentials automatically
```

---

## Configuration

```json
{
  "agentId": "agent-alice",
  "bags": {
    "enabled": true,
    "agentAuth": {
      "username": "agent-alice",
      "jwtToken": "jwt_token_here",
      "apiKey": "api_key_here",
      "expiresAt": "2027-03-13T00:00:00Z"
    },
    "wallets": [
      "wallet_address_1",
      "wallet_address_2"
    ]
  }
}
```

---

## Security Considerations

### JWT Token Management
- ✅ Valid for 365 days (long-term access)
- ✅ Store securely in encrypted storage
- ✅ Rotate before expiration
- ✅ Revoke if compromised

### API Key Management
- ✅ Create separate keys for different purposes
- ✅ Rotate keys regularly
- ✅ Monitor key usage
- ✅ Revoke unused keys

### Moltbook Verification
- ✅ Provides social proof of agent identity
- ✅ Links agent to social account
- ✅ Helps prevent impersonation
- ✅ Builds trust with Bags

---

## Next Steps

1. **Get Bags Account** - Sign up at bags.fm
2. **Access Dev Dashboard** - Go to dev.bags.fm
3. **Review Agent APIs** - Check docs.bags.fm/api-reference
4. **Implement Agent Auth** - Build agent authentication flow
5. **Test on Devnet** - Launch test tokens as agent
6. **Deploy to Mainnet** - Go live with real tokens

---

## Summary

**Bags already has native agent APIs!**

This is perfect for PAW because:

1. ✅ Bags designed agents in mind
2. ✅ Long-term JWT tokens (365 days)
3. ✅ Agent-specific dev keys
4. ✅ Multi-wallet support
5. ✅ Social proof verification
6. ✅ Better tracking and analytics

**PAW can leverage Bags Agent API to provide seamless agent token launching.**

---

**Document Version:** 1.0  
**Date:** March 13, 2026  
**Status:** Discovery & Implementation Guide

