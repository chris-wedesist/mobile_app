# Desist Mobile Security

A comprehensive TypeScript library providing advanced security features for mobile applications, including encryption, authentication, secure storage, and threat detection.

## Features

### 🔐 Encryption Module
- **AES-256 Encryption**: Support for both GCM and CBC modes
- **Key Management**: Automated key rotation and secure key derivation
- **Password-based Encryption**: PBKDF2 with configurable iterations
- **Secure Hashing**: SHA-512 with salt for password hashing

### 🔑 Authentication Module
- **JWT Tokens**: Secure token generation and validation
- **Multi-Factor Authentication**: TOTP and SMS/Email verification
- **Account Security**: Failed attempt tracking and account lockout
- **Password Management**: Bcrypt hashing with salt rounds

### 🛡️ Security Features
- **Threat Detection**: Runtime application self-protection
- **Network Security**: SSL pinning and request validation
- **Secure Storage**: Encrypted local data storage
- **Privacy Protection**: Data anonymization and consent management

## Installation

```bash
npm install desist-mobile-security
```

## Quick Start

```typescript
import { DesistMobileSecurity, SecurityConfig } from 'desist-mobile-security';

// Configure security settings
const config: SecurityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    keyRotationInterval: 24, // hours
    deriveKeyFromPassword: true
  },
  authentication: {
    jwtSecret: 'your-super-secret-key',
    jwtExpiryTime: '1h',
    enableBiometric: true,
    enableMFA: true,
    maxFailedAttempts: 5,
    lockoutDuration: 15 // minutes
  },
  storage: {
    encryptionEnabled: true,
    compressionEnabled: true,
    maxStorageSize: 100, // MB
    autoCleanup: true
  },
  network: {
    sslPinning: true,
    certificatePins: [],
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
    dataRetentionPeriod: 30, // days
    enableAuditLogging: true
  }
};

// Initialize the security library
const security = new DesistMobileSecurity(config);

// Example: Encrypt sensitive data
async function encryptData() {
  const encryptionService = security.getEncryptionService();
  const result = await encryptionService.encrypt('sensitive data');
  
  if (result.success && result.data) {
    console.log('Encrypted:', result.data.encryptedData);
  }
}

// Example: Authenticate user
async function authenticateUser() {
  const authService = security.getAuthenticationService();
  const userProfile = {
    id: 'user123',
    username: 'john.doe',
    roles: ['user'],
    permissions: ['read', 'write'],
    lastLogin: new Date()
  };
  
  const result = await authService.authenticate('john.doe', 'password123', userProfile);
  
  if (result.success && result.data) {
    console.log('Token:', result.data.token);
  }
}
```

## API Reference

### EncryptionService

#### Methods

- `encrypt(data: string, password?: string)`: Encrypts data using AES encryption
- `decrypt(encryptionResult: EncryptionResult, password?: string)`: Decrypts previously encrypted data
- `createHash(data: string, salt?: string)`: Creates a secure hash of input data
- `verifyHash(data: string, hash: string, salt: string)`: Verifies data against a hash
- `generateSecureKey(length?: number)`: Generates a cryptographically secure random key
- `rotateMasterKey()`: Rotates the master encryption key

### AuthenticationService

#### Methods

- `authenticate(username: string, password: string, userProfile: UserProfile)`: Authenticates a user
- `validateToken(token: string)`: Validates a JWT token
- `refreshToken(refreshToken: string)`: Refreshes an expired JWT token
- `hashPassword(password: string)`: Hashes a password using bcrypt
- `verifyPasswordHash(password: string, hashedPassword: string)`: Verifies a password against its hash
- `initiateMFA(userProfile: UserProfile)`: Initiates multi-factor authentication
- `verifyMFA(userProfile: UserProfile, code: string, challenge: string)`: Verifies MFA code

## Security Best Practices

### 1. Key Management
- Store encryption keys securely using platform keystore
- Rotate keys regularly based on your security policy
- Never hardcode secrets in your application

### 2. Authentication
- Use strong JWT secrets (256+ bits)
- Implement proper session management
- Enable MFA for sensitive operations

### 3. Data Protection
- Encrypt sensitive data at rest
- Use secure communication channels
- Implement proper input validation

### 4. Threat Detection
- Monitor for security threats in real-time
- Implement proper logging and alerting
- Have incident response procedures

## Testing

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Building

```bash
npm run build
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For security issues, please email security@desist.com
For general support, create an issue on GitHub.

---

**⚠️ Security Notice**: This library provides security functionality but should be used as part of a comprehensive security strategy. Always follow security best practices and conduct regular security audits.
