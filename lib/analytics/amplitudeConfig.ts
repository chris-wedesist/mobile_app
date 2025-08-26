/**
 * Amplitude Analytics Configuration for DESIST Mobile App
 * 
 * Secure analytics tracking for crypto operations and security events
 * Production API Key: f64ed7c86397ce37e2fa4abba740de58
 */

import { init, setUserId, track } from '@amplitude/analytics-react-native';

// Production Amplitude API key
const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || 'f64ed7c86397ce37e2fa4abba740de58';

// Initialize Amplitude with production configuration
export function initializeAmplitude(): void {
  init(AMPLITUDE_API_KEY, undefined, {
    // Performance settings for real-time security events
    flushQueueSize: 10, // Smaller batch size for timely security events
    flushIntervalMillis: 5000, // 5 second flush interval
    
    // Privacy settings for security app
    trackingOptions: {
      city: false, // Enhanced privacy
      ipAddress: false, // Enhanced privacy for security app  
      carrier: false, // Privacy consideration
    },
  });
}

// Track a custom event
export function logAmplitudeEvent(eventName: string, properties?: Record<string, unknown>): void {
  track(eventName, properties);
}

// Identify a user (optional)
export function setAmplitudeUser(userId: string): void {
  setUserId(userId);
}

// Set user properties (optional) - using track for user properties since setUserProperties not available
export function setAmplitudeUserProperties(properties: Record<string, unknown>): void {
  track('user_properties_set', properties);
}

/**
 * Track screen views (mobile equivalent of pageViews)
 */
export function trackScreenView(screenName: string, properties?: Record<string, unknown>): void {
  track('screen_view', {
    screen_name: screenName,
    ...properties,
  });
}

/**
 * Track user interactions (mobile equivalent of session replay insights)
 */
export function trackUserInteraction(interaction: string, properties?: Record<string, unknown>): void {
  track('user_interaction', {
    interaction_type: interaction,
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

interface SecurityEventProperties {
  eventType: 'crypto_operation' | 'network_security' | 'device_fingerprint' | 'auth_attempt';
  securityLevel?: 'high' | 'medium' | 'low' | 'unknown';
  networkType?: string;
  deviceType?: string;
  success?: boolean;
  errorCode?: string;
  duration?: number;
  operation?: string;
  method?: string;
  timestamp?: string;
  appVersion?: string;
}

export class AmplitudeSecurityAnalytics {
  private static instance: AmplitudeSecurityAnalytics;
  private initialized = false;

  static getInstance(): AmplitudeSecurityAnalytics {
    if (!AmplitudeSecurityAnalytics.instance) {
      AmplitudeSecurityAnalytics.instance = new AmplitudeSecurityAnalytics();
    }
    return AmplitudeSecurityAnalytics.instance;
  }

  /**
   * Initialize Amplitude analytics
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      initializeAmplitude();
      this.initialized = true;
      // Successfully initialized Amplitude Analytics
      
      // Track initialization event
      await this.trackSecurityEvent('crypto_manager_initialized', {
        eventType: 'crypto_operation',
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Amplitude Analytics:', error);
    }
  }

  /**
   * Track crypto security events
   */
  async trackSecurityEvent(eventName: string, properties: SecurityEventProperties): Promise<void> {
    if (!this.initialized) {
      console.warn('Amplitude not initialized, skipping event tracking');
      return;
    }

    try {
      const enhancedProperties = {
        ...properties,
        timestamp: properties.timestamp || new Date().toISOString(),
        appVersion: properties.appVersion || process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      };
      
      logAmplitudeEvent(eventName, enhancedProperties);
    } catch (error) {
      console.error('Failed to track security event:', error);
    }
  }

  /**
   * Track crypto operation events with detailed metrics
   */
  async trackCryptoOperation(operation: string, success: boolean, duration?: number, algorithm?: string): Promise<void> {
    await this.trackSecurityEvent('crypto_operation_executed', {
      eventType: 'crypto_operation',
      operation,
      success,
      duration,
      method: algorithm || 'SHA256',
    });
  }

  /**
   * Track network security events with enhanced context
   */
  async trackNetworkSecurityChange(networkType: string, securityLevel: 'high' | 'medium' | 'low' | 'unknown', threats?: string[]): Promise<void> {
    await this.trackSecurityEvent('network_security_analyzed', {
      eventType: 'network_security',
      networkType,
      securityLevel,
      errorCode: threats?.length ? `threats_detected_${threats.length}` : undefined,
    });
  }

  /**
   * Track device fingerprint events with device details
   */
  async trackDeviceFingerprint(deviceType: string, success: boolean, fingerprintHash?: string): Promise<void> {
    await this.trackSecurityEvent('device_fingerprint_generated', {
      eventType: 'device_fingerprint',
      deviceType,
      success,
      method: fingerprintHash ? 'hardware_based' : 'software_fallback',
    });
  }

  /**
   * Track authentication attempts with security context
   */
  async trackAuthAttempt(method: string, success: boolean, errorCode?: string, securityLevel?: 'high' | 'medium' | 'low'): Promise<void> {
    await this.trackSecurityEvent('security_auth_attempt', {
      eventType: 'auth_attempt',
      method,
      success,
      errorCode,
      securityLevel,
    });
  }

  /**
   * Track security threat detection
   */
  async trackThreatDetection(threatType: string, severity: 'high' | 'medium' | 'low', details?: string): Promise<void> {
    await this.trackSecurityEvent('security_threat_detected', {
      eventType: 'network_security',
      securityLevel: severity,
      method: threatType,
      errorCode: details,
    });
  }

  /**
   * Track performance metrics for crypto operations
   */
  async trackPerformanceMetric(operation: string, duration: number, success: boolean): Promise<void> {
    await this.trackSecurityEvent('crypto_performance_metric', {
      eventType: 'crypto_operation',
      operation,
      duration,
      success,
    });
  }

  /**
   * Set user ID and track user security profile
   */
  async setUser(userId: string, securityProfile?: { hasActiveSecurity: boolean; deviceType: string }): Promise<void> {
    if (!this.initialized) return;

    try {
      setAmplitudeUser(userId);
      
      if (securityProfile) {
        setAmplitudeUserProperties({
          hasActiveSecurity: securityProfile.hasActiveSecurity,
          deviceType: securityProfile.deviceType,
          securityFrameworkVersion: '1.0.0',
          lastSecurityUpdate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Track security session metrics
   */
  async trackSecuritySession(sessionType: 'start' | 'end', duration?: number): Promise<void> {
    await this.trackSecurityEvent(`security_session_${sessionType}`, {
      eventType: 'crypto_operation',
      operation: 'session_management',
      duration,
      success: true,
    });
  }
}

export default AmplitudeSecurityAnalytics;
