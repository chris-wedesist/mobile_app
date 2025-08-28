import { DesistMobileSecurity, SecurityConfig, EncryptionService, AuthenticationService } from '../src';

// Example configuration for a production mobile app
const securityConfig: SecurityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    keyRotationInterval: 24, // Rotate keys every 24 hours
    deriveKeyFromPassword: true
  },
  authentication: {
    jwtSecret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
      }
      return 'development-only-secret-do-not-use-in-production';
    })(),
    jwtExpiryTime: '1h',
    enableBiometric: true,
    enableMFA: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15 // Lock account for 15 minutes after 5 failed attempts
  },
  storage: {
    encryptionEnabled: true,
    compressionEnabled: true,
    maxStorageSize: 100,
    autoCleanup: true
  },
  network: {
    sslPinning: true,
    certificatePins: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Your certificate pin
    ],
    requestTimeout: 30000,
    validateResponses: true,
    allowInsecureConnections: false
  },
  threatDetection: {
    enableRootDetection: true,
    enableDebuggerDetection: true,
    enableTamperDetection: true,
    enableRuntimeProtection: true,
    threatResponseAction: 'block'
  },
  privacy: {
    enableDataAnonymization: true,
    consentRequired: true,
    dataRetentionPeriod: 30,
    enableAuditLogging: true
  }
};

async function demonstrateEncryption() {
  console.log('🔐 Encryption Demo');
  console.log('==================');
  
  const security = new DesistMobileSecurity(securityConfig);
  const encryption = security.getEncryptionService();
  
  const sensitiveData = 'Credit Card: 4532-1234-5678-9012';
  console.log('Original data:', sensitiveData);
  
  // Encrypt data
  const encryptResult = await encryption.encrypt(sensitiveData);
  if (encryptResult.success && encryptResult.data) {
    console.log('Encrypted data:', encryptResult.data.encryptedData);
    console.log('Algorithm:', encryptResult.data.algorithm);
    
    // Decrypt data
    const decryptResult = await encryption.decrypt(encryptResult.data);
    if (decryptResult.success) {
      console.log('Decrypted data:', decryptResult.data);
    }
  }
  
  // Password-based encryption
  const passwordEncryptResult = await encryption.encrypt(sensitiveData, 'user-password-123');
  if (passwordEncryptResult.success && passwordEncryptResult.data) {
    console.log('Password-encrypted data:', passwordEncryptResult.data.encryptedData);
  }
  
  console.log('');
}

async function demonstrateAuthentication() {
  console.log('🔑 Authentication Demo');
  console.log('=====================');
  
  const security = new DesistMobileSecurity(securityConfig);
  const auth = security.getAuthenticationService();
  
  // Create user profile
  const userProfile = {
    id: 'user_12345',
    username: 'john.doe@example.com',
    roles: ['user', 'premium'],
    permissions: ['read', 'write', 'delete'],
    lastLogin: new Date()
  };
  
  // Demonstrate password hashing and verification
  const password = 'my-secure-password';
  const hashedPasswordResult = await auth.hashPassword(password);
  if (hashedPasswordResult.success && hashedPasswordResult.data) {
    console.warn('Password hashed successfully');
    
    const isPasswordValid = await auth.verifyPassword(password, hashedPasswordResult.data as string);
    console.warn('Password verification:', isPasswordValid.success ? 'Valid' : 'Invalid');
  }
  
  // Demonstrate MFA
  const mfaResult = await auth.initiateMFA(userProfile);
  if (mfaResult.success && mfaResult.data) {
    console.warn('MFA initiated:', mfaResult.data.method);
    
    // Simulate MFA verification
    const mfaVerifyResult = await auth.verifyMFA('123456', mfaResult.data.challenge);
    console.warn('MFA verification:', mfaVerifyResult.success ? 'Valid' : 'Invalid');
  }
  
  console.log('');
}

async function demonstrateSecurityHealthCheck() {
  console.log('🛡️ Security Health Check');
  console.log('========================');
  
  const security = new DesistMobileSecurity(securityConfig);
  const healthCheck = await security.performSecurityHealthCheck();
  
  if (healthCheck.success && healthCheck.data) {
    console.log('Encryption module:', healthCheck.data.encryption ? '✅ OK' : '❌ Failed');
    console.log('Authentication module:', healthCheck.data.authentication ? '✅ OK' : '❌ Failed');
    console.log('Overall status:', healthCheck.data.overall ? '✅ Healthy' : '❌ Issues detected');
  }
  
  console.log('');
}

async function runExamples() {
  console.log('Desist Mobile Security - Usage Examples');
  console.log('=====================================\n');
  
  try {
    await demonstrateEncryption();
    await demonstrateAuthentication();
    await demonstrateSecurityHealthCheck();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export {
  securityConfig,
  demonstrateEncryption,
  demonstrateAuthentication,
  demonstrateSecurityHealthCheck,
  runExamples
};
