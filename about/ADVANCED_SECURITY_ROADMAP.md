# PAW Advanced Security Roadmap 🔐

**Status:** Future Implementation (Post v1.0)  
**Priority:** High  
**Complexity:** Advanced

---

## Overview

This document outlines advanced security features for PAW that go beyond the v1.0 implementation. These features are inspired by enterprise-grade security practices and will make PAW production-ready for high-value autonomous agents.

## Current Architecture (v1.0)

```
✅ AES-256-GCM encryption
✅ PBKDF2 key derivation (100k iterations)
✅ Memory-safe key handling
✅ File permissions (0600)
✅ Machine-specific passphrase encryption
```

**This is solid and secure for the bounty!**

## Advanced Features (v2.0+)

### 1. SSH-Agent Integration

**Goal:** Use system SSH keys to encrypt/decrypt wallet keys

**Benefits:**
- Leverage existing SSH infrastructure
- No separate passphrase management
- Hardware-backed SSH keys supported

**Implementation:**
```typescript
// src/core/crypto/ssh-bridge.ts
export class SSHAgentBridge {
  // Check if SSH agent is available
  isAvailable(): boolean {
    try {
      execSync('ssh-add -l', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  // Encrypt wallet key with SSH public key
  async encryptWithSSHKey(
    walletKey: Buffer,
    sshKeyPath: string
  ): Promise<EncryptedPayload> {
    // 1. Generate ephemeral AES key
    const aesKey = randomBytes(32);
    
    // 2. Encrypt wallet with AES
    const encryptedWallet = this.aesEncrypt(walletKey, aesKey);
    
    // 3. Encrypt AES key with SSH public key
    const encryptedAesKey = this.rsaEncryptWithSSH(aesKey, sshKeyPath);
    
    // 4. Clear AES key from memory
    aesKey.fill(0);
    
    return { encryptedWallet, encryptedAesKey };
  }

  // Decrypt using SSH agent
  async decryptWithSSHAgent(
    payload: EncryptedPayload
  ): Promise<Buffer> {
    // 1. Decrypt AES key using SSH agent
    const aesKey = await this.rsaDecryptWithSSHAgent(payload.encryptedAesKey);
    
    try {
      // 2. Decrypt wallet with AES key
      return this.aesDecrypt(payload.encryptedWallet, aesKey);
    } finally {
      // 3. Clear AES key
      aesKey.fill(0);
    }
  }
}
```

**Usage:**
```bash
# Initialize with SSH key
paw init --agent-id bot --auth ssh --ssh-key ~/.ssh/id_ed25519

# Sign transaction (uses SSH agent)
paw swap --from SOL --to USDC --amount 1
# SSH agent handles decryption automatically
```



### 2. Session Management (Unlock/Lock)

**Goal:** Unlock wallet for a session (like `sudo` timeout)

**Benefits:**
- No password needed for each transaction
- Auto-lock after timeout
- Better UX for high-frequency agents

**Implementation:**
```typescript
// src/core/session/manager.ts
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  
  // Unlock wallet for duration
  async unlock(
    agentId: string,
    auth: AuthMethod,
    duration: number = 3600 // 1 hour default
  ): Promise<Session> {
    // Verify auth and cache master key
    const masterKey = await this.deriveKey(auth);
    
    const session: Session = {
      agentId,
      masterKey, // Cached in memory
      unlockedAt: Date.now(),
      expiresAt: Date.now() + (duration * 1000),
      signCount: 0,
    };
    
    this.sessions.set(agentId, session);
    
    // Auto-lock timer
    setTimeout(() => this.lock(agentId), duration * 1000);
    
    return session;
  }

  // Sign within unlocked session (no password)
  async signWithSession(
    agentId: string,
    transaction: Transaction
  ): Promise<string> {
    const session = this.sessions.get(agentId);
    
    if (!session || Date.now() > session.expiresAt) {
      throw new Error('Session expired. Run: paw unlock');
    }
    
    // Use cached master key (no password needed)
    return await this.signTransaction(transaction, session.masterKey);
  }

  // Lock session (clear master key)
  lock(agentId: string): void {
    const session = this.sessions.get(agentId);
    if (session?.masterKey) {
      session.masterKey.fill(0); // Clear from memory
    }
    this.sessions.delete(agentId);
  }
}
```

**Usage:**
```bash
# Unlock for 1 hour
paw unlock --agent-id bot --duration 3600
# Enter passphrase: ****
# ✅ Unlocked (expires in 1:00:00)

# Now sign without password
paw swap --from SOL --to USDC --amount 1
# ✅ Signed (session active)

# Check status
paw status --agent-id bot
# Unlocked | Expires in 45:23 | 12 signatures

# Manual lock
paw lock --agent-id bot
# ✅ Locked
```

### 3. Hardware Key Support (YubiKey/TPM)

**Goal:** Use hardware security keys for wallet encryption

**Benefits:**
- Keys never leave hardware device
- Phishing-resistant
- Enterprise-grade security

**Implementation:**
```typescript
// src/core/crypto/hardware.ts
import { Fido2Lib } from 'fido2-lib';

export class HardwareKeyManager {
  private fido2: Fido2Lib;
  
  // Encrypt wallet with hardware key
  async encryptWithHardwareKey(
    walletKey: Buffer,
    challenge: Buffer
  ): Promise<EncryptedPayload> {
    // 1. Request hardware key signature
    const assertion = await this.fido2.assertionResult({
      challenge: challenge.toString('base64'),
      origin: 'paw://localhost',
    });
    
    // 2. Use signature as encryption key
    const encryptionKey = this.deriveKeyFromAssertion(assertion);
    
    // 3. Encrypt wallet
    const encrypted = this.encrypt(walletKey, encryptionKey);
    
    // 4. Clear key
    encryptionKey.fill(0);
    
    return encrypted;
  }

  // Decrypt with hardware key (requires physical touch)
  async decryptWithHardwareKey(
    encrypted: EncryptedPayload
  ): Promise<Buffer> {
    // User must physically touch YubiKey
    console.log('👆 Touch your security key...');
    
    const assertion = await this.fido2.assertionResult({
      challenge: encrypted.challenge,
      origin: 'paw://localhost',
    });
    
    const decryptionKey = this.deriveKeyFromAssertion(assertion);
    
    try {
      return this.decrypt(encrypted.data, decryptionKey);
    } finally {
      decryptionKey.fill(0);
    }
  }
}
```

**Usage:**
```bash
# Initialize with YubiKey
paw init --agent-id bot --auth hardware --device yubikey

# Sign transaction (requires physical touch)
paw swap --from SOL --to USDC --amount 1
# 👆 Touch your security key...
# ✅ Signed
```

### 4. System Keychain Integration

**Goal:** Use OS-native secure storage

**Benefits:**
- OS-level encryption
- User authentication required
- Platform-native security

**Platforms:**
- **macOS:** Keychain Access
- **Windows:** DPAPI (Data Protection API)
- **Linux:** Secret Service API (gnome-keyring, kwallet)

**Implementation:**
```typescript
// src/core/crypto/keychain.ts
import keytar from 'keytar';

export class KeychainManager {
  private service = 'paw-wallet';
  
  // Save passphrase to system keychain
  async saveToKeychain(
    agentId: string,
    passphrase: string
  ): Promise<void> {
    await keytar.setPassword(this.service, agentId, passphrase);
  }

  // Load passphrase from keychain
  async loadFromKeychain(agentId: string): Promise<string | null> {
    return await keytar.getPassword(this.service, agentId);
  }

  // Delete from keychain
  async deleteFromKeychain(agentId: string): Promise<boolean> {
    return await keytar.deletePassword(this.service, agentId);
  }
}
```

**Usage:**
```bash
# Save to system keychain
paw init --agent-id bot --auth keychain

# macOS: Saved to Keychain Access
# Windows: Saved to Credential Manager
# Linux: Saved to gnome-keyring

# Sign transaction (OS prompts for auth)
paw swap --from SOL --to USDC --amount 1
# macOS: Touch ID or password prompt
# ✅ Signed
```

### 5. Policy-Based Spending Limits

**Goal:** Enforce spending rules at wallet level

**Benefits:**
- Prevent agent from overspending
- Risk management
- Compliance requirements

**Implementation:**
```typescript
// src/core/policy/engine.ts
export class PolicyEngine {
  // Define spending policy
  async setPolicy(agentId: string, policy: SpendingPolicy): Promise<void> {
    const rules: SpendingPolicy = {
      // Auto-approve small transactions
      autoApproveLimit: 100, // $100
      
      // Require 2FA for medium transactions
      twoFactorLimit: 1000, // $1000
      
      // Require manual confirmation for large
      confirmationLimit: 10000, // $10k
      
      // Daily spending cap
      dailyLimit: 5000,
      
      // Per-transaction max
      maxTransactionSize: 2000,
      
      // Allowed protocols
      allowedProtocols: ['jupiter', 'raydium'],
      
      // Time restrictions
      tradingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
    };
    
    await this.savePolicy(agentId, rules);
  }

  // Check if transaction is allowed
  async checkPolicy(
    agentId: string,
    transaction: TransactionRequest
  ): Promise<PolicyResult> {
    const policy = await this.loadPolicy(agentId);
    const amount = transaction.amount;
    
    // Check daily limit
    const dailySpent = await this.getDailySpent(agentId);
    if (dailySpent + amount > policy.dailyLimit) {
      return { allowed: false, reason: 'Daily limit exceeded' };
    }
    
    // Check transaction size
    if (amount > policy.maxTransactionSize) {
      return { allowed: false, reason: 'Transaction too large' };
    }
    
    // Check trading hours
    if (!this.isWithinTradingHours(policy.tradingHours)) {
      return { allowed: false, reason: 'Outside trading hours' };
    }
    
    // Determine approval method
    if (amount < policy.autoApproveLimit) {
      return { allowed: true, method: 'auto' };
    } else if (amount < policy.twoFactorLimit) {
      return { allowed: true, method: '2fa', requires: 'totp' };
    } else {
      return { allowed: true, method: 'manual', requires: 'confirmation' };
    }
  }
}
```

**Usage:**
```bash
# Set policy
paw policy set --agent-id bot \
  --auto-approve 100 \
  --2fa-limit 1000 \
  --daily-limit 5000

# Small transaction (auto-approved)
paw swap --from SOL --to USDC --amount 50
# ✅ Approved automatically

# Medium transaction (requires 2FA)
paw swap --from SOL --to USDC --amount 500
# Enter TOTP code: ______
# ✅ Approved with 2FA

# Large transaction (requires confirmation)
paw swap --from SOL --to USDC --amount 5000
# ⚠️  Large transaction detected
# Amount: $5000
# Confirm? (yes/no): yes
# ✅ Approved
```

