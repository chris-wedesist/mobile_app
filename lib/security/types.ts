/**
 * TypeScript definitions for security-related functionality
 */

export interface IncidentReport {
  id?: string;
  description: string;
  device_id: string;
  created_at: string;
  verified_human: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  resolved?: boolean;
  resolution_notes?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  windowExceeded: boolean;
}

export interface SecurityEvent {
  id?: string;
  event_type: 'rate_limit_exceeded' | 'captcha_failed' | 'suspicious_activity' | 'incident_reported';
  device_id: string;
  metadata: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface CaptchaVerification {
  token: string;
  verified: boolean;
  timestamp: Date;
  expiresAt: Date;
}

export interface DeviceFingerprint {
  id: string;
  platform: string;
  version: string;
  appVersion?: string;
  buildVersion?: string;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

export interface SecurityMetrics {
  totalIncidents: number;
  rateLimitViolations: number;
  captchaFailures: number;
  successfulVerifications: number;
  timeframe: {
    start: Date;
    end: Date;
  };
}

export interface SecurityAlert {
  id: string;
  type: 'rate_limit' | 'captcha_failure' | 'suspicious_device' | 'multiple_failures';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  deviceId: string;
  timestamp: Date;
  resolved: boolean;
}
