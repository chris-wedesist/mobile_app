/**
 * Legal Compliance Manager
 * 
 * Handles consent management, privacy rights, and legal compliance
 * for DESIST! mobile application.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConsentRecord {
  privacyPolicy: boolean;
  termsOfService: boolean;
  dataCollection: boolean;
  locationTracking: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analyticsData: boolean;
  locationData: boolean;
  crashReports: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

export interface DataSubjectRequest {
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  userEmail: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
}

class LegalComplianceManager {
  private static instance: LegalComplianceManager;
  private readonly CONSENT_KEY = 'legal_consent_record';
  private readonly PRIVACY_SETTINGS_KEY = 'privacy_settings';
  private readonly CURRENT_POLICY_VERSION = '1.0.0';

  static getInstance(): LegalComplianceManager {
    if (!LegalComplianceManager.instance) {
      LegalComplianceManager.instance = new LegalComplianceManager();
    }
    return LegalComplianceManager.instance;
  }

  /**
   * Record user consent for legal documents
   */
  async recordConsent(consentData: Partial<ConsentRecord>): Promise<void> {
    try {
      const existingConsent = await this.getConsentRecord();
      
      const updatedConsent: ConsentRecord = {
        ...existingConsent,
        ...consentData,
        timestamp: new Date().toISOString(),
        version: this.CURRENT_POLICY_VERSION,
      };

      await AsyncStorage.setItem(this.CONSENT_KEY, JSON.stringify(updatedConsent));
      
      // Log consent for compliance audit trail
      console.log('Consent recorded:', {
        timestamp: updatedConsent.timestamp,
        version: updatedConsent.version,
        consents: Object.keys(consentData),
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw new Error('Failed to save consent record');
    }
  }

  /**
   * Get current consent record
   */
  async getConsentRecord(): Promise<ConsentRecord> {
    try {
      const stored = await AsyncStorage.getItem(this.CONSENT_KEY);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default consent state
      return {
        privacyPolicy: false,
        termsOfService: false,
        dataCollection: false,
        locationTracking: false,
        analytics: false,
        marketing: false,
        timestamp: '',
        version: '',
      };
    } catch (error) {
      console.error('Failed to get consent record:', error);
      return this.getDefaultConsent();
    }
  }

  /**
   * Check if user has given required consents
   */
  async hasRequiredConsents(): Promise<boolean> {
    const consent = await this.getConsentRecord();
    
    return consent.privacyPolicy && 
           consent.termsOfService && 
           consent.dataCollection &&
           consent.version === this.CURRENT_POLICY_VERSION;
  }

  /**
   * Check if consent needs to be updated (new policy version)
   */
  async needsConsentUpdate(): Promise<boolean> {
    const consent = await this.getConsentRecord();
    return consent.version !== this.CURRENT_POLICY_VERSION;
  }

  /**
   * Save privacy settings
   */
  async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
      
      // Log settings change for audit
      console.log('Privacy settings updated:', {
        timestamp: new Date().toISOString(),
        settings,
      });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      throw new Error('Failed to save privacy settings');
    }
  }

  /**
   * Get current privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const stored = await AsyncStorage.getItem(this.PRIVACY_SETTINGS_KEY);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default settings
      return this.getDefaultPrivacySettings();
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return this.getDefaultPrivacySettings();
    }
  }

  /**
   * Submit data subject request (CCPA/GDPR compliance)
   */
  async submitDataSubjectRequest(request: Omit<DataSubjectRequest, 'requestDate' | 'status'>): Promise<string> {
    try {
      const requestId = this.generateRequestId();
      const fullRequest: DataSubjectRequest = {
        ...request,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };

      // Store request locally for tracking
      const requestKey = `data_request_${requestId}`;
      await AsyncStorage.setItem(requestKey, JSON.stringify(fullRequest));

      // TODO: Send request to backend API
      console.log('Data subject request submitted:', fullRequest);

      return requestId;
    } catch (error) {
      console.error('Failed to submit data subject request:', error);
      throw new Error('Failed to submit request');
    }
  }

  /**
   * Get user's data for export (CCPA/GDPR compliance)
   */
  async exportUserData(): Promise<object> {
    try {
      const consent = await this.getConsentRecord();
      const privacySettings = await this.getPrivacySettings();
      
      // Get all user data from storage
      const userData = {
        consent,
        privacySettings,
        exportDate: new Date().toISOString(),
        dataVersion: this.CURRENT_POLICY_VERSION,
      };

      return userData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Delete all user data (CCPA/GDPR compliance)
   */
  async deleteAllUserData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.startsWith('legal_') || 
        key.startsWith('privacy_') ||
        key.startsWith('incident_') ||
        key.startsWith('device_')
      );

      await AsyncStorage.multiRemove(userDataKeys);
      
      console.log('User data deleted:', {
        timestamp: new Date().toISOString(),
        deletedKeys: userDataKeys.length,
      });
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('Failed to delete data');
    }
  }

  /**
   * Check if user can access specific features based on consent
   */
  async canAccessFeature(feature: 'location' | 'analytics' | 'marketing'): Promise<boolean> {
    const consent = await this.getConsentRecord();
    const settings = await this.getPrivacySettings();

    switch (feature) {
      case 'location':
        return consent.locationTracking && settings.locationData;
      case 'analytics':
        return consent.analytics && settings.analyticsData;
      case 'marketing':
        return consent.marketing && settings.marketingEmails;
      default:
        return false;
    }
  }

  /**
   * Log compliance event for audit trail
   */
  async logComplianceEvent(event: {
    type: string;
    description: string;
    metadata?: object;
  }): Promise<void> {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      version: this.CURRENT_POLICY_VERSION,
    };

    console.log('Compliance event:', logEntry);
    
    // TODO: Send to compliance logging service
  }

  private getDefaultConsent(): ConsentRecord {
    return {
      privacyPolicy: false,
      termsOfService: false,
      dataCollection: false,
      locationTracking: false,
      analytics: false,
      marketing: false,
      timestamp: '',
      version: '',
    };
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataCollection: true, // Required for app functionality
      analyticsData: false,
      locationData: true,
      crashReports: true,
      marketingEmails: false,
      securityAlerts: true, // Required for security
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const complianceManager = LegalComplianceManager.getInstance();
