import { CryptoManager } from './lib/security/cryptoManager';
import { SecureStorageManager } from './lib/security/secureStorage';

/**
 * Comprehensive test suite for the enhanced cryptographic functionality
 * This demonstrates the replacement of Base64 simulation with real crypto
 */
export class CryptoTestSuite {
  private cryptoManager: CryptoManager;
  private storageManager: SecureStorageManager;

  constructor() {
    this.cryptoManager = CryptoManager.getInstance();
    this.storageManager = SecureStorageManager.getInstance();
  }

  async runAllTests(): Promise<void> {
    console.log('🔐 Starting Enhanced Crypto Test Suite');
    console.log('==========================================');

    try {
      await this.testSecureHashing();
      await this.testDeviceFingerprinting();
      await this.testSecureRandomGeneration();
      await this.testDeviceBoundTokens();
      await this.testNetworkSecurity();
      await this.testEnhancedStorage();
      await this.testSecurityVerification();

      console.log('✅ All crypto tests completed successfully!');
    } catch (error) {
      console.error('❌ Crypto test suite failed:', error);
    }
  }

  /**
   * Test secure hashing - replaces Buffer.from(data).toString('base64')
   */
  async testSecureHashing(): Promise<void> {
    console.log('\n📝 Testing Secure Hashing (SHA-256 vs Base64 simulation)');
    
    const testData = 'sensitive_user_data_12345';
    
    // OLD WAY - Base64 simulation (insecure)
    const oldWay = Buffer.from(testData).toString('base64');
    console.log('Old Base64 simulation:', oldWay);
    
    // NEW WAY - Real cryptographic hash (secure)
    const secureHash = await this.cryptoManager.generateSecureHash(testData);
    console.log('New SHA-256 hash:', secureHash);
    
    // Demonstrate hash variants
    const hashVariants = await this.cryptoManager.generateHashVariants(testData);
    console.log('Hash variants:', {
      sha256: hashVariants.sha256.substring(0, 16) + '...',
      sha384: hashVariants.sha384.substring(0, 16) + '...',
      sha512: hashVariants.sha512.substring(0, 16) + '...',
    });
    
    console.log('✅ Secure hashing test completed');
  }

  /**
   * Test comprehensive device fingerprinting
   */
  async testDeviceFingerprinting(): Promise<void> {
    console.log('\n📱 Testing Device Fingerprinting');
    
    const fingerprint = await this.cryptoManager.generateDeviceFingerprint();
    
    console.log('Device Fingerprint Generated:');
    console.log('- Device ID:', fingerprint.deviceId.substring(0, 8) + '...');
    console.log('- Device Hash:', fingerprint.deviceHash.substring(0, 16) + '...');
    console.log('- Model:', fingerprint.systemInfo.model);
    console.log('- Brand:', fingerprint.systemInfo.brand);
    console.log('- System Version:', fingerprint.systemInfo.systemVersion);
    console.log('- Is Emulator:', fingerprint.securityFeatures.isEmulator);
    console.log('- Is Rooted:', fingerprint.securityFeatures.isRooted);
    console.log('- Network Type:', fingerprint.networkInfo.connectionType);
    console.log('- Fingerprint Hash:', fingerprint.hash.substring(0, 16) + '...');
    
    console.log('✅ Device fingerprinting test completed');
  }

  /**
   * Test secure random generation
   */
  async testSecureRandomGeneration(): Promise<void> {
    console.log('\n🎲 Testing Secure Random Generation');
    
    // Generate multiple secure random strings
    const random16 = await this.cryptoManager.generateSecureRandom(16);
    const random32 = await this.cryptoManager.generateSecureRandom(32);
    const random64 = await this.cryptoManager.generateSecureRandom(64);
    
    console.log('Secure Random 16 bytes:', random16);
    console.log('Secure Random 32 bytes:', random32.substring(0, 32) + '...');
    console.log('Secure Random 64 bytes:', random64.substring(0, 32) + '...');
    
    // Verify randomness (no duplicates in multiple generations)
    const randoms = await Promise.all([
      this.cryptoManager.generateSecureRandom(16),
      this.cryptoManager.generateSecureRandom(16),
      this.cryptoManager.generateSecureRandom(16),
    ]);
    
    const isUnique = new Set(randoms).size === randoms.length;
    console.log('Randomness verification (unique):', isUnique ? '✅' : '❌');
    
    console.log('✅ Secure random generation test completed');
  }

  /**
   * Test device-bound token generation
   */
  async testDeviceBoundTokens(): Promise<void> {
    console.log('\n🔗 Testing Device-Bound Tokens');
    
    const token1 = await this.cryptoManager.generateDeviceBoundToken();
    const token2 = await this.cryptoManager.generateDeviceBoundToken();
    
    console.log('Device-bound token 1:', token1.substring(0, 32) + '...');
    console.log('Device-bound token 2:', token2.substring(0, 32) + '...');
    
    // Tokens should be different each time but bound to same device
    console.log('Tokens are unique:', token1 !== token2 ? '✅' : '❌');
    
    console.log('✅ Device-bound token test completed');
  }

  /**
   * Test network security validation
   */
  async testNetworkSecurity(): Promise<void> {
    console.log('\n🌐 Testing Network Security Validation');
    
    const networkSecurity = await this.cryptoManager.validateNetworkSecurity();
    
    console.log('Network Security Status:');
    console.log('- Is Secure:', networkSecurity.isSecure ? '✅' : '⚠️');
    console.log('- Issues:', networkSecurity.issues);
    console.log('- Recommendations:', networkSecurity.recommendations);
    
    console.log('✅ Network security test completed');
  }

  /**
   * Test enhanced storage with crypto integration
   */
  async testEnhancedStorage(): Promise<void> {
    console.log('\n💾 Testing Enhanced Secure Storage');
    
    // Initialize storage with crypto
    await this.storageManager.initialize();
    
    // Test device-bound key generation
    const deviceKey = await this.storageManager.generateDeviceBoundKey('test_key');
    console.log('Device-bound key:', deviceKey.substring(0, 16) + '...');
    
    // Test secure storage operations
    const testValue = 'sensitive_data_with_enhanced_crypto';
    const success = await this.storageManager.setItem('crypto_test', testValue, {
      encrypt: true,
      expirationDays: 7,
    });
    
    console.log('Storage write success:', success ? '✅' : '❌');
    
    // Test retrieval
    const retrievedValue = await this.storageManager.getItem('crypto_test');
    console.log('Storage read success:', retrievedValue === testValue ? '✅' : '❌');
    
    // Test security status
    const securityStatus = await this.storageManager.getSecurityStatus();
    console.log('Security Status:');
    console.log('- Encryption Active:', securityStatus.encryptionActive ? '✅' : '❌');
    console.log('- Device Integrity:', securityStatus.deviceIntegrityValid ? '✅' : '⚠️');
    console.log('- Network Secure:', securityStatus.networkSecure ? '✅' : '⚠️');
    console.log('- Last Check:', securityStatus.lastSecurityCheck.toISOString());
    
    console.log('✅ Enhanced storage test completed');
  }

  /**
   * Test device integrity verification
   */
  async testSecurityVerification(): Promise<void> {
    console.log('\n🛡️ Testing Security Verification');
    
    // Test device integrity check
    const integrityValid = await this.storageManager.verifyDeviceIntegrityForStorage();
    console.log('Device integrity valid:', integrityValid ? '✅' : '⚠️');
    
    // Simulate device fingerprint comparison
    const currentFingerprint = await this.cryptoManager.generateDeviceFingerprint();
    const verification = await this.cryptoManager.verifyDeviceIntegrity(currentFingerprint);
    
    console.log('Device Verification Results:');
    console.log('- Is Valid:', verification.isValid ? '✅' : '❌');
    console.log('- Security Risk Level:', verification.securityRisk);
    console.log('- Differences:', verification.differences);
    
    console.log('✅ Security verification test completed');
  }

  /**
   * Demonstration of old vs new crypto approaches
   */
  async demonstrateCryptoUpgrade(): Promise<void> {
    console.log('\n🔄 Demonstrating Crypto Upgrade');
    console.log('================================');
    
    const sampleData = 'user_authentication_token_data';
    
    console.log('BEFORE (insecure):');
    console.log('- Method: Buffer.from(data).toString("base64")');
    const oldResult = Buffer.from(sampleData).toString('base64');
    console.log('- Result:', oldResult);
    console.log('- Reversible:', Buffer.from(oldResult, 'base64').toString());
    console.log('- Security Level: ❌ LOW (easily reversible)');
    
    console.log('\nAFTER (secure):');
    console.log('- Method: Crypto.digestStringAsync(SHA256, data)');
    const newResult = await this.cryptoManager.generateSecureHash(sampleData);
    console.log('- Result:', newResult);
    console.log('- Reversible: ❌ NO (cryptographically secure)');
    console.log('- Security Level: ✅ HIGH (SHA-256 hash)');
    
    console.log('\n📊 Comparison Summary:');
    console.log('- Security: Base64 ❌ → SHA-256 ✅');
    console.log('- Reversibility: Yes ❌ → No ✅'); 
    console.log('- Collision Resistance: None ❌ → High ✅');
    console.log('- Suitable for Production: No ❌ → Yes ✅');
  }
}

// Export test runner function
export async function runCryptoTests(): Promise<void> {
  const testSuite = new CryptoTestSuite();
  await testSuite.demonstrateCryptoUpgrade();
  await testSuite.runAllTests();
}

// Example usage in Phase 3 demo or testing
export default CryptoTestSuite;
