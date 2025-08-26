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
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
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
  
  // Authenticate user
  const authResult = await auth.authenticate('john.doe@example.com', 'secure-password-123', userProfile);
  if (authResult.success && authResult.data) {
    console.log('Authentication successful!');
    console.log('JWT Token:', authResult.data.token.substring(0, 50) + '...');
    console.log('Expires at:', authResult.data.expiresAt);
    
    // Validate token
    const validateResult = await auth.validateToken(authResult.data.token);
    if (validateResult.success && validateResult.data) {
      console.log('Token validation successful!');
      console.log('User ID:', validateResult.data.id);
      console.log('Username:', validateResult.data.username);
    }
  }
  
  // Demonstrate password hashing
  const password = 'my-secure-password';
  const hashedPassword = await auth.hashPassword(password);
  console.log('Hashed password:', hashedPassword);
  
  const isPasswordValid = await auth.verifyPasswordHash(password, hashedPassword);
  console.log('Password verification:', isPasswordValid);
  
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
