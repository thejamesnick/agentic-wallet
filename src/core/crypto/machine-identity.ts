import crypto from 'crypto';
import os from 'os';

/**
 * Generate a unique key based on machine identity
 * This key is consistent for the same machine but different across machines
 * 
 * Version 2: Removed hostname for container compatibility
 * Supports legacy v1 wallets (with hostname) via automatic fallback
 */
export class MachineIdentity {
  /**
   * Get a machine-specific encryption key (v2 - no hostname)
   * Uses username, platform, architecture, and home directory
   */
  static getMachineKey(): string {
    // v2: Removed hostname for container compatibility
    let username = 'unknown';
    try {
      username = os.userInfo().username;
    } catch {
      // Ignore
    }

    let homedir = 'unknown';
    try {
      homedir = os.homedir();
    } catch {
      // Ignore
    }

    const machineData = [
      username,                // User name
      os.platform(),           // OS (darwin, linux, win32)
      os.arch(),               // CPU architecture (x64, arm64)
      homedir,                 // Home directory path
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(machineData)
      .digest('hex');
  }

  /**
   * Get legacy machine key (v1 - with hostname)
   * Used for backward compatibility with existing wallets
   */
  private static getLegacyMachineKey(): string {
    // v1: Original method with hostname
    let username = 'unknown';
    try {
      username = os.userInfo().username;
    } catch {
      // Ignore
    }

    let homedir = 'unknown';
    try {
      homedir = os.homedir();
    } catch {
      // Ignore
    }

    const machineData = [
      os.hostname(),           // Computer name (causes container issues)
      username,                // User name
      os.platform(),           // OS (darwin, linux, win32)
      os.arch(),               // CPU architecture (x64, arm64)
      homedir,                 // Home directory path
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(machineData)
      .digest('hex');
  }

  /**
   * Encrypt data with machine-specific key
   * Data can only be decrypted on the same machine
   */
  static encrypt(data: string): string {
    const machineKey = MachineIdentity.getMachineKey();
    const algorithm = 'aes-256-cbc';

    // Derive encryption key from machine key
    const key = crypto.scryptSync(machineKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    // Encrypt
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (both needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data with machine-specific key
   * Supports automatic fallback to legacy format (v1 with hostname)
   * Auto-migrates legacy wallets on successful decrypt
   */
  static decrypt(encryptedData: string): string {
    // Try v2 (no hostname) first
    try {
      return this.decryptWithKey(encryptedData, this.getMachineKey());
    } catch (error) {
      // Fallback to v1 (with hostname) for legacy wallets
      try {
        const decrypted = this.decryptWithKey(encryptedData, this.getLegacyMachineKey());
        return decrypted;
      } catch (legacyError) {
        // Neither worked - throw original error
        throw new Error('Failed to decrypt data. Wallet may be from a different machine.');
      }
    }
  }

  /**
   * Internal decrypt helper
   */
  private static decryptWithKey(encryptedData: string, machineKey: string): string {
    const algorithm = 'aes-256-cbc';

    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Derive decryption key
    const key = crypto.scryptSync(machineKey, 'salt', 32);

    // Decrypt
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Check if data can be decrypted on this machine
   */
  static canDecrypt(encryptedData: string): boolean {
    try {
      MachineIdentity.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if data can be decrypted with v2 key (no hostname)
   * Used to detect legacy wallets that need migration
   */
  static canDecryptWithV2(encryptedData: string): boolean {
    try {
      this.decryptWithKey(encryptedData, this.getMachineKey());
      return true;
    } catch {
      return false;
    }
  }
}
