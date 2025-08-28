# DESIST! Mobile App - Technical Implementation Guide

## 🔧 Technical Architecture Overview

This guide provides comprehensive technical documentation for developers and system administrators working with the DESIST! mobile security platform.

## 📋 System Architecture

### Technology Stack

#### Frontend (Mobile App)
```typescript
// Core Dependencies
{
  "expo": "~49.0.0",
  "react": "18.2.0", 
  "react-native": "0.72.0",
  "expo-router": "^2.0.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "typescript": "^5.1.6"
}
```

#### Backend Services
```typescript
// Server Dependencies
{
  "express": "^4.18.0",
  "express-rate-limit": "^6.7.0",
  "helmet": "^6.1.0",
  "cors": "^2.8.5",
  "node-fetch": "^3.3.0"
}
```

#### Security Components
```typescript
// Security Libraries
{
  "crypto": "node built-in",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "express-validator": "^6.15.0"
}
```

### Project Structure

```
desist-mobile-security/
├── src/
│   ├── security/           # Core security services
│   │   ├── encryption/     # AES encryption utilities
│   │   ├── auth/          # Authentication services
│   │   ├── rateLimiting/  # Rate limiting implementation
│   │   ├── captcha/       # CAPTCHA integration
│   │   └── threats/       # Threat detection
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── components/            # React Native components
│   ├── legal/            # Legal compliance components
│   └── security/         # Security-related UI
├── lib/                  # Business logic libraries
│   ├── legal/           # Legal compliance management
│   └── security/        # Security utilities
├── screens/             # App screens
├── docs/                # Documentation
│   ├── training/        # Training materials
│   ├── api/            # API documentation
│   └── deployment/     # Deployment guides
└── tests/              # Test suites
```

## 🛡️ Security Implementation

### Encryption Service

#### AES-256 Encryption
```typescript
// Core encryption implementation
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  
  async encrypt(data: string, key: Buffer): Promise<EncryptedData> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('DESIST_AUTH_DATA'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm
    };
  }
  
  async decrypt(encryptedData: EncryptedData, key: Buffer): Promise<string> {
    const decipher = crypto.createDecipher(
      encryptedData.algorithm, 
      key
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from('DESIST_AUTH_DATA'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### Key Management
```typescript
// Secure key management
class KeyManager {
  private keyRotationInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  async generateKey(): Promise<Buffer> {
    return crypto.randomBytes(32); // 256-bit key
  }
  
  async rotateKeys(): Promise<void> {
    const newKey = await this.generateKey();
    await this.secureStorage.storeKey('current', newKey);
    await this.secureStorage.archiveKey('previous');
    
    // Schedule next rotation
    setTimeout(() => this.rotateKeys(), this.keyRotationInterval);
  }
  
  async getActiveKey(): Promise<Buffer> {
    return await this.secureStorage.getKey('current');
  }
}
```

### Authentication System

#### JWT Token Management
```typescript
// JWT authentication service
class AuthenticationService {
  private jwtSecret = process.env.JWT_SECRET;
  private tokenExpiry = '24h';
  
  async generateToken(user: UserProfile): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: this.tokenExpiry
    });
  }
  
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
  
  async refreshToken(oldToken: string): Promise<string> {
    const payload = await this.verifyToken(oldToken);
    const user = await this.userService.getUserById(payload.userId);
    return this.generateToken(user);
  }
}
```

#### Biometric Authentication
```typescript
// Biometric authentication integration
class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    // Check device biometric capabilities
    return await LocalAuthentication.hasHardwareAsync() &&
           await LocalAuthentication.isEnrolledAsync();
  }
  
  async authenticateWithBiometrics(): Promise<AuthResult> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access DESIST!',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: false
    });
    
    if (result.success) {
      return { success: true, method: 'biometric' };
    } else {
      throw new AuthenticationError('Biometric authentication failed');
    }
  }
}
```

### Rate Limiting Implementation

#### Device-Based Rate Limiting
```typescript
// Enhanced rate limiting with device tracking
class RateLimiter {
  private limits = new Map<string, RateLimit>();
  private storage: AsyncStorage;
  
  async checkRateLimit(deviceId: string, endpoint: string): Promise<RateLimitResult> {
    const key = `${deviceId}:${endpoint}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    let rateLimit = await this.getRateLimit(key);
    
    if (!rateLimit) {
      rateLimit = {
        requests: 0,
        windowStart: now,
        lastRequest: now
      };
    }
    
    // Reset window if expired
    if (now - rateLimit.windowStart > windowMs) {
      rateLimit = {
        requests: 0,
        windowStart: now,
        lastRequest: now
      };
    }
    
    rateLimit.requests += 1;
    rateLimit.lastRequest = now;
    
    await this.storeRateLimit(key, rateLimit);
    
    const isBlocked = rateLimit.requests > maxRequests;
    const remainingRequests = Math.max(0, maxRequests - rateLimit.requests);
    const resetTime = rateLimit.windowStart + windowMs;
    
    return {
      isBlocked,
      remainingRequests,
      resetTime,
      currentRequests: rateLimit.requests
    };
  }
  
  private async getRateLimit(key: string): Promise<RateLimit | null> {
    const stored = await this.storage.getItem(`rate_limit_${key}`);
    return stored ? JSON.parse(stored) : null;
  }
  
  private async storeRateLimit(key: string, rateLimit: RateLimit): Promise<void> {
    await this.storage.setItem(`rate_limit_${key}`, JSON.stringify(rateLimit));
  }
}
```

### CAPTCHA Integration

#### Google reCAPTCHA Implementation
```typescript
// CAPTCHA verification service
class CaptchaService {
  private siteKey = process.env.RECAPTCHA_SITE_KEY;
  private secretKey = process.env.RECAPTCHA_SECRET_KEY;
  private verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  
  async generateCaptcha(): Promise<CaptchaChallenge> {
    return {
      siteKey: this.siteKey,
      action: 'submit_report',
      theme: 'light'
    };
  }
  
  async verifyCaptcha(token: string, userIP: string): Promise<CaptchaResult> {
    const response = await fetch(this.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: this.secretKey,
        response: token,
        remoteip: userIP
      })
    });
    
    const result = await response.json();
    
    return {
      success: result.success,
      score: result.score || 0,
      action: result.action,
      challengeTs: result.challenge_ts,
      hostname: result.hostname,
      errorCodes: result['error-codes'] || []
    };
  }
  
  async isValidSubmission(token: string, userIP: string): Promise<boolean> {
    const result = await this.verifyCaptcha(token, userIP);
    return result.success && result.score >= 0.5; // Threshold for human
  }
}
```

### Threat Detection

#### Runtime Application Self-Protection (RASP)
```typescript
// Threat detection and response
class ThreatDetectionService {
  private suspiciousPatterns = [
    /sql\s*injection/i,
    /script\s*tag/i,
    /javascript:/i,
    /<script[^>]*>/i,
    /eval\s*\(/i
  ];
  
  async analyzeThreat(input: string, context: ThreatContext): Promise<ThreatLevel> {
    const threats = [];
    
    // Pattern-based detection
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'pattern_match',
          pattern: pattern.source,
          severity: 'medium'
        });
      }
    }
    
    // Behavioral analysis
    if (context.rapidRequests > 10) {
      threats.push({
        type: 'rate_abuse',
        severity: 'high'
      });
    }
    
    // Content analysis
    if (input.length > 10000) {
      threats.push({
        type: 'payload_size',
        severity: 'low'
      });
    }
    
    return this.calculateThreatLevel(threats);
  }
  
  async respondToThreat(threat: ThreatLevel, context: ThreatContext): Promise<ThreatResponse> {
    switch (threat.level) {
      case 'critical':
        return {
          action: 'block',
          quarantine: true,
          alertSecurity: true,
          logIncident: true
        };
      case 'high':
        return {
          action: 'challenge',
          requireCaptcha: true,
          alertSecurity: true,
          logIncident: true
        };
      case 'medium':
        return {
          action: 'monitor',
          increaseScrutiny: true,
          logIncident: true
        };
      default:
        return {
          action: 'allow',
          logIncident: false
        };
    }
  }
}
```

## 📱 Mobile App Implementation

### Secure Storage Implementation

#### AsyncStorage with Encryption
```typescript
// Secure storage wrapper
class SecureStorage {
  private encryption: EncryptionService;
  private keyManager: KeyManager;
  
  async storeSecurely(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    const encryptionKey = await this.keyManager.getActiveKey();
    const encrypted = await this.encryption.encrypt(serialized, encryptionKey);
    
    await AsyncStorage.setItem(key, JSON.stringify(encrypted));
  }
  
  async retrieveSecurely<T>(key: string): Promise<T | null> {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    
    const encrypted = JSON.parse(stored);
    const encryptionKey = await this.keyManager.getActiveKey();
    const decrypted = await this.encryption.decrypt(encrypted, encryptionKey);
    
    return JSON.parse(decrypted);
  }
  
  async removeSecurely(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
```

### Network Security

#### SSL Pinning Implementation
```typescript
// SSL certificate pinning
class NetworkSecurity {
  private pinnedCertificates = [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Production cert
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=' // Backup cert
  ];
  
  async secureRequest(url: string, options: RequestOptions): Promise<Response> {
    // Add certificate pinning
    const secureOptions = {
      ...options,
      agent: this.createSecureAgent(),
      headers: {
        ...options.headers,
        'X-Request-ID': this.generateRequestId(),
        'X-Device-ID': await this.getDeviceId(),
        'X-App-Version': this.getAppVersion()
      }
    };
    
    return fetch(url, secureOptions);
  }
  
  private createSecureAgent(): Agent {
    return new https.Agent({
      checkServerIdentity: (hostname, cert) => {
        // Implement certificate pinning logic
        return this.verifyCertificatePin(cert);
      }
    });
  }
}
```

## ⚖️ Legal Compliance Implementation

### Consent Management System

#### GDPR/CCPA Compliance
```typescript
// Comprehensive consent management
class ComplianceManager {
  async recordConsent(consents: ConsentRecord): Promise<void> {
    const consentData = {
      ...consents,
      timestamp: new Date().toISOString(),
      version: this.getCurrentPolicyVersion(),
      ipAddress: await this.getIPAddress(),
      userAgent: this.getUserAgent(),
      legalBasis: this.determineLegalBasis(consents)
    };
    
    await this.secureStorage.storeSecurely('user_consents', consentData);
    
    // Log for compliance audit
    await this.logComplianceEvent({
      type: 'consent_recorded',
      description: 'User consent preferences updated',
      metadata: { consentTypes: Object.keys(consents) }
    });
  }
  
  async handleDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    switch (request.type) {
      case 'access':
        await this.exportUserData(request.userId);
        break;
      case 'deletion':
        await this.deleteUserData(request.userId);
        break;
      case 'portability':
        await this.exportPortableData(request.userId);
        break;
      case 'rectification':
        await this.updateUserData(request.userId, request.corrections);
        break;
    }
    
    // Document the request handling
    await this.logComplianceEvent({
      type: 'data_subject_request',
      description: `Processed ${request.type} request`,
      metadata: { userId: request.userId, requestId: request.id }
    });
  }
}
```

### Privacy Settings Management

#### Granular Privacy Controls
```typescript
// Privacy preferences system
class PrivacyManager {
  async updatePrivacyPreferences(
    userId: string, 
    preferences: PrivacyPreferences
  ): Promise<void> {
    // Validate preferences
    const validatedPrefs = await this.validatePreferences(preferences);
    
    // Apply immediately
    await this.applyPrivacySettings(userId, validatedPrefs);
    
    // Store permanently
    await this.storePrivacyPreferences(userId, validatedPrefs);
    
    // Notify relevant services
    await this.notifyServicesOfChanges(userId, validatedPrefs);
    
    // Log for audit
    await this.logPrivacyChange(userId, validatedPrefs);
  }
  
  async applyPrivacySettings(
    userId: string, 
    preferences: PrivacyPreferences
  ): Promise<void> {
    // Location services
    if (!preferences.locationTracking) {
      await this.disableLocationServices(userId);
    }
    
    // Analytics
    if (!preferences.analytics) {
      await this.optOutOfAnalytics(userId);
    }
    
    // Marketing
    if (!preferences.marketing) {
      await this.unsubscribeFromMarketing(userId);
    }
    
    // Data collection
    if (!preferences.dataCollection) {
      await this.minimizeDataCollection(userId);
    }
  }
}
```

## 🚀 Deployment & Infrastructure

### Production Environment Setup

#### Environment Configuration
```bash
# Production environment variables
export NODE_ENV=production
export JWT_SECRET=your-super-secure-jwt-secret
export RECAPTCHA_SITE_KEY=6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7
export RECAPTCHA_SECRET_KEY=6Ld-ALYrAAAAABAjYRpVcK7j6TZPIzcSjBFD7FYr
export ENCRYPTION_KEY=your-32-byte-encryption-key
export DATABASE_URL=your-encrypted-database-connection
export API_BASE_URL=https://api.wedesist.com
export SENTRY_DSN=your-error-tracking-dsn
```

#### Docker Deployment
```dockerfile
# Dockerfile for production deployment
FROM node:18-alpine

# Security updates
RUN apk upgrade --no-cache

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S desist -u 1001

# App directory
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# App source
COPY --chown=desist:nodejs . .

# Build application
RUN npm run build

# Security scanning
RUN npm audit --audit-level=high

# Switch to non-root user
USER desist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
```

#### Kubernetes Configuration
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: desist-mobile-api
  labels:
    app: desist-mobile-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: desist-mobile-api
  template:
    metadata:
      labels:
        app: desist-mobile-api
    spec:
      containers:
      - name: api
        image: desist/mobile-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: desist-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Monitoring & Observability

#### Application Monitoring
```typescript
// Performance monitoring
class MonitoringService {
  private metrics = new Map<string, Metric>();
  
  async trackRequest(endpoint: string, duration: number, status: number): Promise<void> {
    const metric = {
      endpoint,
      duration,
      status,
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    await this.recordMetric('api_request', metric);
    
    // Alert on anomalies
    if (duration > 5000) { // 5 second threshold
      await this.alertOnSlowRequest(metric);
    }
    
    if (status >= 500) {
      await this.alertOnServerError(metric);
    }
  }
  
  async trackSecurityEvent(event: SecurityEvent): Promise<void> {
    await this.recordMetric('security_event', {
      type: event.type,
      severity: event.severity,
      source: event.source,
      timestamp: Date.now(),
      metadata: event.metadata
    });
    
    // Real-time security alerts
    if (event.severity === 'critical') {
      await this.immediateSecurityAlert(event);
    }
  }
}
```

#### Health Check Implementation
```typescript
// Comprehensive health checks
class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkExternalServices(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
      this.checkSecurityServices()
    ]);
    
    return {
      status: this.determineOverallHealth(checks),
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0],
        externalServices: checks[1],
        memory: checks[2],
        disk: checks[3],
        security: checks[4]
      },
      uptime: process.uptime(),
      version: this.getAppVersion()
    };
  }
  
  private async checkSecurityServices(): Promise<ServiceHealth> {
    const services = [
      { name: 'encryption', check: () => this.testEncryption() },
      { name: 'authentication', check: () => this.testAuth() },
      { name: 'rateLimiting', check: () => this.testRateLimit() },
      { name: 'captcha', check: () => this.testCaptcha() }
    ];
    
    const results = await Promise.allSettled(
      services.map(service => service.check())
    );
    
    return {
      status: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'degraded',
      details: results.map((result, index) => ({
        service: services[index].name,
        status: result.status,
        error: result.status === 'rejected' ? result.reason : null
      }))
    };
  }
}
```

## 🔄 Testing Strategy

### Security Testing

#### Automated Security Tests
```typescript
// Security test suite
describe('Security Implementation', () => {
  describe('Encryption Service', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'sensitive user data';
      const key = await keyManager.generateKey();
      
      const encrypted = await encryptionService.encrypt(plaintext, key);
      const decrypted = await encryptionService.decrypt(encrypted, key);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted.encrypted).not.toBe(plaintext);
    });
    
    it('should fail with wrong key', async () => {
      const plaintext = 'sensitive user data';
      const key1 = await keyManager.generateKey();
      const key2 = await keyManager.generateKey();
      
      const encrypted = await encryptionService.encrypt(plaintext, key1);
      
      await expect(
        encryptionService.decrypt(encrypted, key2)
      ).rejects.toThrow();
    });
  });
  
  describe('Rate Limiting', () => {
    it('should block after limit exceeded', async () => {
      const deviceId = 'test-device';
      const endpoint = '/api/test';
      
      // Make requests up to limit
      for (let i = 0; i < 100; i++) {
        const result = await rateLimiter.checkRateLimit(deviceId, endpoint);
        expect(result.isBlocked).toBe(false);
      }
      
      // Next request should be blocked
      const blockedResult = await rateLimiter.checkRateLimit(deviceId, endpoint);
      expect(blockedResult.isBlocked).toBe(true);
    });
  });
});
```

#### Penetration Testing
```typescript
// Automated penetration testing
class SecurityPenTest {
  async runSecurityTests(): Promise<SecurityTestResults> {
    const tests = [
      this.testSQLInjection(),
      this.testXSSVulnerabilities(),
      this.testAuthenticationBypass(),
      this.testRateLimitEvasion(),
      this.testDataExfiltration()
    ];
    
    const results = await Promise.allSettled(tests);
    
    return {
      testResults: results,
      vulnerabilities: this.identifyVulnerabilities(results),
      recommendations: this.generateRecommendations(results)
    };
  }
  
  private async testSQLInjection(): Promise<TestResult> {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO admin (user) VALUES ('hacker'); --"
    ];
    
    for (const input of maliciousInputs) {
      const response = await this.makeTestRequest('/api/search', { query: input });
      
      if (response.status === 500 || response.data?.includes('SQL')) {
        return {
          test: 'SQL Injection',
          status: 'vulnerable',
          input,
          response: response.data
        };
      }
    }
    
    return { test: 'SQL Injection', status: 'secure' };
  }
}
```

### Compliance Testing

#### GDPR/CCPA Compliance Tests
```typescript
// Compliance testing suite
describe('Privacy Compliance', () => {
  describe('Data Subject Rights', () => {
    it('should export user data on request', async () => {
      const userId = 'test-user-123';
      const exportData = await complianceManager.exportUserData(userId);
      
      expect(exportData).toHaveProperty('personalData');
      expect(exportData).toHaveProperty('consentHistory');
      expect(exportData).toHaveProperty('dataProcessingActivities');
      expect(exportData.format).toBe('json');
    });
    
    it('should delete user data completely', async () => {
      const userId = 'test-user-456';
      
      await complianceManager.deleteUserData(userId);
      
      const userData = await userService.getUserById(userId);
      expect(userData).toBeNull();
      
      const consents = await complianceManager.getUserConsents(userId);
      expect(consents).toBeNull();
    });
  });
  
  describe('Consent Management', () => {
    it('should record consent with proper metadata', async () => {
      const consents = {
        privacyPolicy: true,
        termsOfService: true,
        dataCollection: true,
        marketing: false
      };
      
      await complianceManager.recordConsent(consents);
      
      const storedConsents = await complianceManager.getCurrentConsents();
      expect(storedConsents).toMatchObject(consents);
      expect(storedConsents).toHaveProperty('timestamp');
      expect(storedConsents).toHaveProperty('version');
    });
  });
});
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/login
```typescript
// User authentication
interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  captchaToken?: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: number;
}

// Example usage
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    deviceId: 'device-uuid-here'
  })
});
```

#### POST /auth/refresh
```typescript
// Token refresh
interface RefreshRequest {
  refreshToken: string;
  deviceId: string;
}

interface RefreshResponse {
  success: boolean;
  token: string;
  expiresIn: number;
}
```

### Report Management Endpoints

#### POST /reports/submit
```typescript
// Submit incident report
interface ReportSubmissionRequest {
  type: 'harassment' | 'theft' | 'vandalism' | 'other';
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  anonymous: boolean;
  evidence?: {
    photos: string[]; // Base64 encoded
    videos: string[];
    documents: string[];
  };
  captchaToken: string;
}

interface ReportSubmissionResponse {
  success: boolean;
  reportId: string;
  status: 'submitted' | 'under_review';
  estimatedReviewTime: string;
}
```

### Compliance Endpoints

#### GET /privacy/export
```typescript
// Export user data
interface DataExportResponse {
  success: boolean;
  data: {
    personalData: UserData;
    reports: Report[];
    consents: ConsentHistory[];
    activityLog: ActivityLog[];
  };
  format: 'json' | 'csv';
  generatedAt: string;
}
```

#### DELETE /privacy/delete-account
```typescript
// Account deletion request
interface AccountDeletionRequest {
  confirmationCode: string;
  reason?: string;
}

interface AccountDeletionResponse {
  success: boolean;
  deletionId: string;
  completionDate: string;
  dataRetentionPeriod: string;
}
```

## 🔧 Development Setup

### Local Development Environment

#### Prerequisites
```bash
# Required software
Node.js >= 18.0.0
npm >= 9.0.0
React Native CLI
Expo CLI
Android Studio (for Android development)
Xcode (for iOS development, macOS only)
```

#### Installation Steps
```bash
# Clone repository
git clone https://github.com/your-org/desist-mobile-security.git
cd desist-mobile-security

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run start

# Run on specific platform
npm run android  # Android emulator
npm run ios      # iOS simulator
npm run web      # Web browser
```

#### Development Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios", 
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "build": "expo build",
    "build:android": "expo build:android",
    "build:ios": "expo build:ios"
  }
}
```

### Code Quality Standards

#### ESLint Configuration
```json
{
  "extends": [
    "@expo/eslint-config",
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error"
  },
  "plugins": ["security"]
}
```

#### TypeScript Configuration Updates
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "esnext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
```

### Performance Optimization

#### Bundle Analysis
```bash
# Analyze bundle size
npx expo export:embed
npx @expo/bundle-analyzer dist

# Optimize images
npx expo optimize

# Tree shake unused code
npm run build -- --analyze
```

#### Memory Management
```typescript
// Memory optimization techniques
class MemoryOptimizer {
  private cacheSize = 50; // Limit cache entries
  private cache = new Map<string, any>();
  
  setWithExpiry(key: string, value: any, ttl: number): void {
    // Implement LRU cache with TTL
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

---

**This technical implementation guide provides comprehensive documentation for developers working with the DESIST! mobile security platform. Follow security best practices, maintain code quality standards, and ensure proper testing coverage for all implementations.**

**Version**: 1.0.0 | **Last Updated**: August 28, 2025 | **Classification**: Technical Documentation
