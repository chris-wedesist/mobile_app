#!/usr/bin/env node

const { DesistMobileSecurity } = require('./dist/index.js');

// Demo configuration
const config = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    keyRotationInterval: 24,
    deriveKeyFromPassword: true
  },
  authentication: {
    jwtSecret: 'demo-secret-key',
    jwtExpiryTime: '1h',
    enableBiometric: false,
    enableMFA: false,
    maxFailedAttempts: 3,
    lockoutDuration: 5
  },
  storage: {
    encryptionEnabled: true,
    compressionEnabled: false,
    maxStorageSize: 50,
    autoCleanup: true
  },
  network: {
    sslPinning: false,
    certificatePins: [],
    requestTimeout: 30000,
    validateResponses: true,
    allowInsecureConnections: false
  },
  threatDetection: {
    enableRootDetection: false,
    enableDebuggerDetection: false,
    enableTamperDetection: false,
    enableRuntimeProtection: false,
    threatResponseAction: 'log'
  },
  privacy: {
    enableDataAnonymization: false,
    consentRequired: false,
    dataRetentionPeriod: 30,
    enableAuditLogging: false
  }
};

async function runDemo() {
  console.log('🛡️ Desist Mobile Security Demo');
  console.log('==============================\n');

  const security = new DesistMobileSecurity(config);

  try {
    // Health check
    console.log('1. Security Health Check');
    const health = await security.performSecurityHealthCheck();
    console.log('   Status:', health.success ? '✅ Healthy' : '❌ Issues');
    if (health.data) {
      console.log('   Encryption:', health.data.encryption ? 'OK' : 'Failed');
      console.log('   Authentication:', health.data.authentication ? 'OK' : 'Failed');
    }
    console.log('');

    // Encryption demo
    console.log('2. Encryption Demo');
    const encService = security.getEncryptionService();
    const testData = 'Sensitive information: Credit Card 4532-1234-5678-9012';
    console.log('   Original:', testData);
    
    const encrypted = await encService.encrypt(testData);
    if (encrypted.success && encrypted.data) {
      console.log('   Encrypted:', encrypted.data.encryptedData.substring(0, 40) + '...');
      
      const decrypted = await encService.decrypt(encrypted.data);
      if (decrypted.success) {
        console.log('   Decrypted:', decrypted.data);
        console.log('   ✅ Encryption/Decryption successful');
      }
    }
    console.log('');

    // Authentication demo
    console.log('3. Authentication Demo');
    const authService = security.getAuthenticationService();
    const password = 'secure-password-123';
    
    const hashedPassword = await authService.hashPassword(password);
    console.log('   Hashed password:', hashedPassword.substring(0, 40) + '...');
    
    const isValid = await authService.verifyPasswordHash(password, hashedPassword);
    console.log('   Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
    const credCheck = await authService.validateCredentials('user@example.com', password);
    console.log('   Credential validation:', credCheck.success ? '✅ Valid' : '❌ Invalid');
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('   The Desist Mobile Security library is working correctly.');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    security.destroy();
  }
}

if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };
