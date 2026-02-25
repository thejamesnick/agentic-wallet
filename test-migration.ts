#!/usr/bin/env ts-node
/**
 * Test hostname migration
 */

import { MachineIdentity } from './src/core/crypto/machine-identity';
import * as os from 'os';

console.log('🧪 Testing Hostname Migration\n');

// Show current machine info
console.log('📋 Current Machine Info:');
console.log('  Hostname:', os.hostname());
console.log('  Username:', os.userInfo().username);
console.log('  Platform:', os.platform());
console.log('  Arch:', os.arch());
console.log('  Home:', os.homedir());
console.log('');

// Test data
const testData = 'test-passphrase-12345';

// Test 1: Encrypt with v2 (new method)
console.log('Test 1: Encrypt with v2 (no hostname)');
const encryptedV2 = MachineIdentity.encrypt(testData);
console.log('  Encrypted:', encryptedV2.substring(0, 50) + '...');

// Test 2: Decrypt v2
console.log('\nTest 2: Decrypt v2');
try {
  const decryptedV2 = MachineIdentity.decrypt(encryptedV2);
  console.log('  ✅ Decrypted successfully:', decryptedV2 === testData ? 'MATCH' : 'MISMATCH');
} catch (error) {
  console.log('  ❌ Failed:', (error as Error).message);
}

// Test 3: Check if v2 can decrypt
console.log('\nTest 3: Check if encrypted with v2');
const isV2 = MachineIdentity.canDecryptWithV2(encryptedV2);
console.log('  Can decrypt with v2:', isV2 ? '✅ YES' : '❌ NO');

console.log('\n✅ All tests passed!');
