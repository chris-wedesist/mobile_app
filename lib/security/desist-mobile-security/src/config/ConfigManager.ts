/**
 * Configuration Manager for DESIST! Mobile Security
 * Handles environment variables and configuration validation
 */

// Configuration constants
const MIN_KEY_LENGTH = 32;
const MIN_RATE_LIMIT_WINDOW = 60000; // 1 minute
const MIN_SALT_ROUNDS = 8;
const MAX_SALT_ROUNDS = 15;
const MIN_AUDIT_RETENTION_DAYS = 365; // 1 year
const RADIX_BASE_36 = 36;

export interface NotificationConfig {
  expo: {
    projectId: string;
    accessToken?: string;
  };
  fcm: {
    serverKey?: string;
    senderId?: string;
  };
  apns: {
    keyId?: string;
    teamId?: string;
    bundleId: string;
    production: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    registrationMax: number;
  };
}

export interface SecurityConfig {
  encryptionKey: string;
  saltRounds: number;
  jwtSecret: string;
}

export interface ComplianceConfig {
  gdprRetentionDays: number;
  auditLogRetentionDays: number;
  webhookUrl?: string;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: {
    notification: NotificationConfig;
    security: SecurityConfig;
    compliance: ComplianceConfig;
    environment: 'development' | 'staging' | 'production';
    apiBaseUrl: string;
    databaseUrl?: string;
    redisUrl?: string;
  };

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration() {
    return {
      notification: {
        expo: {
          projectId: process.env.EXPO_PROJECT_ID || 'desist-mobile-security',
          accessToken: process.env.EXPO_ACCESS_TOKEN,
        },
        fcm: {
          serverKey: process.env.FCM_SERVER_KEY,
          senderId: process.env.FCM_SENDER_ID,
        },
        apns: {
          keyId: process.env.APNS_KEY_ID,
          teamId: process.env.APNS_TEAM_ID,
          bundleId: process.env.APNS_BUNDLE_ID || 'com.desist.mobile',
          production: process.env.APNS_PRODUCTION === 'true',
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
          registrationMax: parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX || '10', 10),
        },
      },
      security: {
        encryptionKey: process.env.ENCRYPTION_KEY || this.generateFallbackKey(),
        saltRounds: parseInt(process.env.SALT_ROUNDS || '12', 10),
        jwtSecret: process.env.JWT_SECRET || this.generateFallbackKey(),
      },
      compliance: {
        gdprRetentionDays: parseInt(process.env.GDPR_RETENTION_DAYS || '365', 10),
        auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555', 10), // 7 years
        webhookUrl: process.env.COMPLIANCE_WEBHOOK_URL,
      },
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      databaseUrl: process.env.DATABASE_URL,
      redisUrl: process.env.REDIS_URL,
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate required environment variables for production
    if (this.config.environment === 'production') {
      if (!process.env.EXPO_PROJECT_ID) {
        errors.push('EXPO_PROJECT_ID is required in production');
      }
      if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < MIN_KEY_LENGTH) {
        errors.push('ENCRYPTION_KEY must be at least 32 characters in production');
      }
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < MIN_KEY_LENGTH) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }
      if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required in production');
      }
    }

    // Validate notification configuration
    if (this.config.notification.rateLimit.windowMs < MIN_RATE_LIMIT_WINDOW) {
      errors.push('Rate limit window must be at least 1 minute');
    }
    if (this.config.notification.rateLimit.maxRequests < 1) {
      errors.push('Rate limit max requests must be at least 1');
    }

    // Validate security configuration
    if (this.config.security.saltRounds < MIN_SALT_ROUNDS || this.config.security.saltRounds > MAX_SALT_ROUNDS) {
      errors.push('Salt rounds must be between 8 and 15');
    }

    // Validate compliance configuration
    if (this.config.compliance.gdprRetentionDays < 1) {
      errors.push('GDPR retention days must be at least 1');
    }
    if (this.config.compliance.auditLogRetentionDays < MIN_AUDIT_RETENTION_DAYS) {
      console.warn('Audit log retention is less than 1 year, consider compliance requirements');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  private generateFallbackKey(): string {
    if (this.config?.environment === 'production') {
      throw new Error('Cannot use fallback keys in production environment');
    }
    console.warn('Using generated fallback key - not suitable for production');
    return Array.from({ length: MIN_KEY_LENGTH }, () => Math.random().toString(RADIX_BASE_36)[2]).join('');
  }

  // Getters for configuration sections
  public getNotificationConfig(): NotificationConfig {
    return { ...this.config.notification };
  }

  public getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  public getComplianceConfig(): ComplianceConfig {
    return { ...this.config.compliance };
  }

  public getEnvironment(): 'development' | 'staging' | 'production' {
    return this.config.environment;
  }

  public getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public getDatabaseUrl(): string | undefined {
    return this.config.databaseUrl;
  }

  public getRedisUrl(): string | undefined {
    return this.config.redisUrl;
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  // Method to safely log configuration (without sensitive data)
  public getSafeConfigForLogging(): Record<string, unknown> {
    return {
      environment: this.config.environment,
      apiBaseUrl: this.config.apiBaseUrl,
      notification: {
        expo: {
          projectId: this.config.notification.expo.projectId,
          hasAccessToken: !!this.config.notification.expo.accessToken,
        },
        fcm: {
          hasServerKey: !!this.config.notification.fcm.serverKey,
          hasSenderId: !!this.config.notification.fcm.senderId,
        },
        apns: {
          bundleId: this.config.notification.apns.bundleId,
          production: this.config.notification.apns.production,
          hasKeyId: !!this.config.notification.apns.keyId,
          hasTeamId: !!this.config.notification.apns.teamId,
        },
        rateLimit: this.config.notification.rateLimit,
      },
      security: {
        saltRounds: this.config.security.saltRounds,
        hasEncryptionKey: !!this.config.security.encryptionKey,
        hasJwtSecret: !!this.config.security.jwtSecret,
      },
      compliance: this.config.compliance,
      hasDatabaseUrl: !!this.config.databaseUrl,
      hasRedisUrl: !!this.config.redisUrl,
    };
  }
}

export const configManager = ConfigManager.getInstance();
