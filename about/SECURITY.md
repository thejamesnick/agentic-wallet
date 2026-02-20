# PAW Security Model 🔐

## Overview

PAW uses a **double-encryption security model** where private keys are encrypted at rest with a passphrase, and the passphrase itself is encrypted with a machine-specific key. This creates a "safe inside a safe" architecture where stolen files are useless without access to the original machine.

## Core Principle

```
┌─────────────────────────────────────┐
│  Layer 1: Wallet Encryption         │
│  Private Key → AES-256-GCM          │
│  (encrypted with passphrase)        │
└─────────────────────────────────────┘
         ↓ passphrase stored as
┌─────────────────────────────────────┐
│  Layer 2: Passphrase Encryption     │
│  Passphrase → AES-256-CBC           │
│  (encrypted with machine key)       │
└─────────────────────────────────────┘
         ↓ machine key derived from
┌─────────────────────────────────────┐
│  Layer 3: Machine Identity          │
│  hostname + username + OS + arch    │
│  (unique to this computer)          │
└─────────────────────────────────────┘
```

**Keys never exist unencrypted on disk.**

## Implementation Details

### 1. Key Storage Structure

```bash
~/.paw/
├── agents/
│   ├── trading-bot-001/
│   │   ├── keypair.enc       # AES-256-GCM encrypted private key
│   │   ├── .passphrase       # AES-256-CBC encrypted passphrase (machine-specific)
│   │   └── config.json       # Public metadata (no secrets)
│   ├── lp-bot-001/
│   │   ├── keypair.enc
│   │   ├── .passphrase
│   │   └── config.json
└── global-config.json
```

**All secrets are encrypted - nothing in plaintext!**

### 2. Encryption Algorithm

- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Salt:** Random 32-byte salt per wallet
- **IV:** Random 16-byte initialization vector per encryption

### 3. Passphrase Management

#### Option A: Environment Variable (Recommended for Production)
```bash
export PAW_PASSPHRASE="your-secure-passphrase"
paw init --agent-id my-bot
```

#### Option B: Auto-Generated Passphrase
```bash
paw init --agent-id my-bot --auto-passphrase
# Generates random passphrase and stores in ~/.paw/agents/my-bot/.passphrase
```

#### Option C: Manual Passphrase
```bash
paw init --agent-id my-bot --passphrase "my-secret-phrase"
```

#### Option D: Interactive Prompt
```bash
paw init --agent-id my-bot
# Prompts: "Enter passphrase for agent wallet:"
```

### 4. Transaction Signing Flow

```typescript
class PAWWallet {
  private encryptedKeyPath: string;
  private passphrase: string;
  
  async signTransaction(tx: Transaction): Promise<string> {
    let keypair: Keypair | null = null;
    
    try {
      // 1. Read encrypted key from disk
      const encryptedData = await fs.readFile(this.encryptedKeyPath);
      
      // 2. Decrypt in memory only
      keypair = await this.decryptKey(encryptedData, this.passphrase);
      
      // 3. Sign transaction
      tx.sign(keypair);
      
      // 4. Serialize signed transaction
      const signedTx = tx.serialize();
      
      return signedTx;
      
    } finally {
      // 5. CRITICAL: Clear sensitive data from memory
      if (keypair) {
        keypair.secretKey.fill(0);  // Overwrite with zeros
        keypair = null;              // Remove reference
      }
    }
  }
  
  private async decryptKey(
    encryptedData: Buffer, 
    passphrase: string
  ): Promise<Keypair> {
    // Extract salt and IV from encrypted data
    const salt = encryptedData.slice(0, 32);
    const iv = encryptedData.slice(32, 48);
    const encrypted = encryptedData.slice(48);
    
    // Derive key from passphrase
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    
    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    // Create keypair from decrypted secret key
    return Keypair.fromSecretKey(decrypted);
  }
}
```

### 5. Memory Safety

**Critical Security Measures:**

```typescript
// After using keypair, always clear it
function clearKeypair(keypair: Keypair) {
  // Overwrite secret key with zeros
  keypair.secretKey.fill(0);
  
  // Remove reference
  keypair = null;
  
  // Suggest garbage collection (not guaranteed)
  if (global.gc) {
    global.gc();
  }
}
```

**Why This Matters:**
- Prevents key from lingering in memory
- Reduces attack surface for memory dumps
- Follows security best practices

### 6. Key Never Exposed

**Keys are NEVER visible in:**
- ❌ Command output
- ❌ Log files
- ❌ Error messages
- ❌ Transaction history
- ❌ Debug output
- ❌ Network traffic (only signed transactions)

**Only way to see key:**
```bash
paw export-key --agent-id my-bot
# WARNING: This will expose your private key in plaintext.
# This should only be used for backup or migration.
# Continue? (y/N)
```

## Security Features

### 1. Encryption at Rest ✅
- All private keys stored encrypted with AES-256-GCM
- Strong key derivation (PBKDF2, 100k iterations)
- Unique salt and IV per wallet

### 2. Minimal Memory Exposure ✅
- Keys decrypted only when needed
- Immediately cleared after use
- No persistent in-memory storage (by default)

### 3. Agent Isolation ✅
- Each agent has separate encrypted key file
- Independent passphrases supported
- No shared key material

### 4. Passphrase Protection ✅
- Multiple passphrase options
- Environment variable support
- No hardcoded secrets

### 5. Audit Trail ✅
- All transactions logged (without keys)
- Timestamp and agent ID recorded
- Transaction hashes for verification

## Advanced: Session Mode (Optional)

For high-frequency trading agents that need to sign many transactions quickly:

```typescript
class PAWSession {
  private keypair: Keypair | null = null;
  private sessionTimeout: number = 3600000; // 1 hour
  private timeoutHandle: NodeJS.Timeout | null = null;
  
  async startSession(agentId: string, passphrase: string) {
    // Decrypt and hold key in memory
    this.keypair = await this.decryptKey(agentId, passphrase);
    
    console.log(`Session started for ${agentId}`);
    console.log(`Session will expire in ${this.sessionTimeout / 1000}s`);
    
    // Auto-clear after timeout
    this.timeoutHandle = setTimeout(() => {
      this.endSession();
      console.log('Session expired');
    }, this.sessionTimeout);
  }
  
  async signTransaction(tx: Transaction): Promise<string> {
    if (!this.keypair) {
      throw new Error('No active session. Start session first.');
    }
    
    tx.sign(this.keypair);
    return tx.serialize();
  }
  
  endSession() {
    if (this.keypair) {
      // Clear key from memory
      this.keypair.secretKey.fill(0);
      this.keypair = null;
    }
    
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}
```

**Usage:**
```bash
# Start session (key stays in memory for 1 hour)
paw session start --agent-id trading-bot --timeout 3600

# Execute multiple transactions quickly
paw swap --from SOL --to USDC --amount 1
paw swap --from USDC --to SOL --amount 100
# ... many more transactions

# End session manually
paw session end
```

**Trade-offs:**
- ✅ Faster signing (no decrypt per transaction)
- ✅ Better for high-frequency agents
- ⚠️ Key in memory longer (higher risk)
- ⚠️ Requires explicit session management

## Comparison to Other Wallet Models

| Model | PAW | MetaMask | Phantom | Hardware Wallet |
|-------|-----|----------|---------|-----------------|
| Encryption at rest | ✅ AES-256 | ✅ Password | ✅ Password | ✅ Hardware |
| Automatic signing | ✅ Yes | ❌ Manual | ❌ Manual | ❌ Manual |
| Agent-friendly | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Memory safety | ✅ Clear after use | ⚠️ Browser | ⚠️ Browser | ✅ Never exposed |
| Multi-agent | ✅ Isolated | ❌ Single user | ❌ Single user | ⚠️ One device |

## Security Best Practices

### For Agent Developers:

1. **Use Environment Variables for Passphrases**
   ```bash
   export PAW_PASSPHRASE="$(openssl rand -base64 32)"
   ```

2. **Rotate Passphrases Regularly**
   ```bash
   paw rotate-passphrase --agent-id my-bot
   ```

3. **Limit Agent Permissions**
   ```bash
   paw config set --agent-id my-bot --max-tx-amount 1.0
   ```

4. **Monitor Agent Activity**
   ```bash
   paw history --agent-id my-bot --tail
   ```

5. **Use Session Mode Carefully**
   - Only for trusted environments
   - Set short timeouts
   - End sessions when done

### For Production Deployments:

1. **Never commit passphrases to git**
   ```bash
   echo ".passphrase" >> .gitignore
   ```

2. **Use secrets management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

3. **Enable audit logging**
   ```bash
   paw config set --audit-log enabled
   ```

4. **Set spending limits**
   ```bash
   paw config set --agent-id my-bot --daily-limit 10.0
   ```

5. **Regular backups**
   ```bash
   paw backup --agent-id my-bot --output backup.enc
   ```

## Threat Model

### What PAW Protects Against:

✅ **Disk access attacks** - Keys encrypted at rest  
✅ **Log file exposure** - Keys never logged  
✅ **Accidental commits** - Keys not in plaintext  
✅ **Memory dumps (partial)** - Keys cleared after use  
✅ **Unauthorized transactions** - Passphrase required  

### What PAW Does NOT Protect Against:

❌ **Compromised passphrase** - Attacker can decrypt keys  
❌ **Malicious code execution** - Can intercept in-memory keys  
❌ **Physical access to running process** - Memory can be dumped  
❌ **Keyloggers** - Can capture passphrase input  
❌ **Social engineering** - User may export keys  

### Mitigation Strategies:

1. **Use strong passphrases** (32+ characters, random)
2. **Limit session duration** (auto-expire after timeout)
3. **Monitor for suspicious activity** (unusual transactions)
4. **Use hardware wallets for high-value agents** (future feature)
5. **Implement spending limits** (max per transaction/day)

## Future Enhancements

### Planned Security Features:

1. **Hardware Wallet Support**
   - Ledger/Trezor integration
   - Keys never leave device
   - Agent signs via USB/Bluetooth

2. **Multi-Signature Wallets**
   - Require multiple agents to approve
   - Threshold signatures (2-of-3, etc.)
   - On-chain enforcement

3. **Time-Locked Transactions**
   - Delay high-value transactions
   - Allow cancellation window
   - Emergency pause mechanism

4. **Biometric Authentication**
   - Fingerprint/Face ID for mobile agents
   - Hardware security module (HSM)
   - Secure enclave integration

5. **Zero-Knowledge Proofs**
   - Prove agent identity without revealing keys
   - Private transaction execution
   - On-chain privacy

## Conclusion

PAW's SSH-style security model provides a balance between:
- **Security** - Keys encrypted at rest, cleared from memory
- **Usability** - Automatic signing for agents
- **Flexibility** - Multiple passphrase options, session mode

This approach is:
- ✅ Industry-standard (SSH, GPG use similar models)
- ✅ Agent-friendly (no manual approvals)
- ✅ Auditable (all transactions logged)
- ✅ Scalable (multi-agent support)

**Remember:** Security is a spectrum. PAW provides strong protection for devnet prototypes and production agents, but always assess your specific threat model and requirements.

---

**Questions or concerns?** Open an issue or contact the PAW team.
