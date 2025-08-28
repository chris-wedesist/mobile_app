/**
 * Security Configuration for Rate Limiting and Human Verification
 * 
 * This file centralizes all security-related configuration to ensure
 * consistent protection across the application.
 */

export interface SecurityConfig {
  rateLimiting: {
    incidentReports: {
      maxAttempts: number;
      windowHours: number;
    };
    loginAttempts: {
      maxAttempts: number;
      windowHours: number;
    };
    passwordReset: {
      maxAttempts: number;
      windowHours: number;
    };
    apiRequests: {
      maxAttempts: number;
      windowMinutes: number;
    };
  };
  captcha: {
    enabled: boolean;
    siteKey: string;
    baseUrl: string;
    theme: 'light' | 'dark';
    size: 'compact' | 'normal';
  };
  deviceTracking: {
    enabled: boolean;
    storageKey: string;
  };
  logging: {
    enabled: boolean;
    logSecurityEvents: boolean;
    retentionDays: number;
  };
}

const defaultConfig: SecurityConfig = {
  rateLimiting: {
    incidentReports: {
      maxAttempts: 3,
      windowHours: 1,
    },
    loginAttempts: {
      maxAttempts: 5,
      windowHours: 1,
    },
    passwordReset: {
      maxAttempts: 3,
      windowHours: 24,
    },
    apiRequests: {
      maxAttempts: 100,
      windowMinutes: 15,
    },
  },
  captcha: {
    enabled: true,
    siteKey: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '',
    baseUrl: process.env.EXPO_PUBLIC_APP_URL || '',
    theme: 'light',
    size: 'normal',
  },
  deviceTracking: {
    enabled: true,
    storageKey: 'device_security_id',
  },
  logging: {
    enabled: true,
    logSecurityEvents: true,
    retentionDays: 30,
  },
};

/**
 * Get the current security configuration
 * Can be overridden by environment variables or runtime settings
 */
export function getSecurityConfig(): SecurityConfig {
  return {
    ...defaultConfig,
    // Override with environment-specific settings if needed
    captcha: {
      ...defaultConfig.captcha,
      enabled: process.env.EXPO_PUBLIC_CAPTCHA_ENABLED !== 'false',
    },
    logging: {
      ...defaultConfig.logging,
      enabled: process.env.NODE_ENV !== 'test',
    },
  };
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: SecurityConfig): string[] {
  const errors: string[] = [];

  if (config.captcha.enabled && !config.captcha.siteKey) {
    errors.push('CAPTCHA is enabled but no site key is configured');
  }

  if (config.captcha.enabled && !config.captcha.baseUrl) {
    errors.push('CAPTCHA is enabled but no base URL is configured');
  }

  if (config.rateLimiting.incidentReports.maxAttempts <= 0) {
    errors.push('Incident report rate limit must be greater than 0');
  }

  if (config.rateLimiting.loginAttempts.maxAttempts <= 0) {
    errors.push('Login attempt rate limit must be greater than 0');
  }

  return errors;
}

export const securityConfig = getSecurityConfig();
