import { DesistMobileSecurity } from '../index';
import { SecurityConfig } from '../types';

describe('DesistMobileSecurity', () => {
  let security: DesistMobileSecurity;
  
  const testConfig: SecurityConfig = {
    encryption: {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      keyRotationInterval: 24,
      deriveKeyFromPassword: true
    },
    authentication: {
      jwtSecret: 'test-secret-key',
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

  beforeEach(() => {
    security = new DesistMobileSecurity(testConfig);
  });

  afterEach(() => {
    security.destroy();
  });

  describe('Initialization', () => {
    it('should create a new instance', () => {
      expect(security).toBeInstanceOf(DesistMobileSecurity);
    });

    it('should provide encryption service', () => {
      const encryptionService = security.getEncryptionService();
      expect(encryptionService).toBeDefined();
    });

    it('should provide authentication service', () => {
      const authService = security.getAuthenticationService();
      expect(authService).toBeDefined();
    });
  });

  describe('Security Health Check', () => {
    it('should perform health check', async () => {
      const result = await security.performSecurityHealthCheck();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(typeof result.data.encryption).toBe('boolean');
        expect(typeof result.data.authentication).toBe('boolean');
        expect(typeof result.data.overall).toBe('boolean');
      }
    });
  });

  describe('Encryption Service', () => {
    it('should encrypt and decrypt data', async () => {
      const encryptionService = security.getEncryptionService();
      const testData = 'test sensitive data';
      
      const encryptResult = await encryptionService.encrypt(testData);
      expect(encryptResult.success).toBe(true);
      expect(encryptResult.data).toBeDefined();
      
      if (encryptResult.data) {
        expect(encryptResult.data.encryptedData).toBeDefined();
        expect(encryptResult.data.iv).toBeDefined();
        expect(encryptResult.data.algorithm).toBe('AES-256-GCM');
        
        const decryptResult = await encryptionService.decrypt(encryptResult.data);
        expect(decryptResult.success).toBe(true);
        expect(decryptResult.data).toBe(testData);
      }
    });

    it('should generate secure keys', () => {
      const encryptionService = security.getEncryptionService();
      const key1 = encryptionService.generateSecureKey();
      const key2 = encryptionService.generateSecureKey();
      
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication Service', () => {
    it('should hash and verify passwords', async () => {
      const authService = security.getAuthenticationService();
      const password = 'test-password-123';
      
      const hashedResult = await authService.hashPassword(password);
      expect(hashedResult.success).toBe(true);
      expect(hashedResult.data).toBeDefined();
      expect(hashedResult.data).not.toBe(password);
      
      const hashedPassword = hashedResult.data!;
      const isValid = await authService.verifyPassword(password, hashedPassword);
      expect(isValid.success).toBe(true);
      expect(isValid.data).toBe(true);
      
      const isInvalid = await authService.verifyPassword('wrong-password', hashedPassword);
      expect(isInvalid.success).toBe(true);
      expect(isInvalid.data).toBe(false);
    });
  });
});
