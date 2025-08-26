/**
 * Core types and interfaces for the Desist Mobile Security Library
 */

export const KEY_SIZES = {
  STANDARD: 256,
  EXTENDED: 512,
} as const;

export type KeySize = typeof KEY_SIZES[keyof typeof KEY_SIZES];

export interface SecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthConfig;
  storage: StorageConfig;
  network: NetworkConfig;
  threatDetection: ThreatDetectionConfig;
  privacy: PrivacyConfig;
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-256-CBC';
  keySize: KeySize;
  keyRotationInterval: number; // in hours
  deriveKeyFromPassword: boolean;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiryTime: string;
  enableBiometric: boolean;
  enableMFA: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
}

export interface StorageConfig {
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  maxStorageSize: number; // in MB
  autoCleanup: boolean;
}

export interface NetworkConfig {
  sslPinning: boolean;
  certificatePins: string[];
  requestTimeout: number;
  validateResponses: boolean;
  allowInsecureConnections: boolean;
}

export interface ThreatDetectionConfig {
  enableRootDetection: boolean;
  enableDebuggerDetection: boolean;
  enableTamperDetection: boolean;
  enableRuntimeProtection: boolean;
  threatResponseAction: 'log' | 'block' | 'terminate';
}

export interface PrivacyConfig {
  enableDataAnonymization: boolean;
  consentRequired: boolean;
  dataRetentionPeriod: number; // in days
  enableAuditLogging: boolean;
}

export interface SecurityResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: SecurityError;
  timestamp: Date;
}

export interface SecurityError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

export interface AuthenticationResult {
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  lastLogin: Date;
}

export interface ThreatDetectionResult {
  threatDetected: boolean;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
}

export interface StorageItem {
  key: string;
  value: string | number | boolean | object;
  encrypted: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NetworkRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | object;
  timeout?: number;
}

export interface NetworkResponse {
  status: number;
  headers: Record<string, string>;
  data: string | object;
  validated: boolean;
}
