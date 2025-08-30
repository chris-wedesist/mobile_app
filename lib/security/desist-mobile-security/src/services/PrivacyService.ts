import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionService } from '../encryption';
import { SecurityResult } from '../types';
import {
  ConsentPreferences,
  DataDeletionRequest,
  DataExportRequest,
  DataInventory,
  PrivacyAuditLog,
  PrivacyConsent,
  PrivacyRight,
  PrivacyRightRequest,
  PrivacySettings
} from '../types/privacy';
import { PRIVACY_CONSTANTS } from '../constants/privacy';

/**
 * Privacy Service Configuration Constants
 */
const PRIVACY_RETENTION_DAYS = 730; // 2 years default
const EXPORT_EXPIRY_HOURS = 48;
const AUDIT_LOG_MAX_ENTRIES = 1000;
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_SECOND = 1000;
const APPEAL_DEADLINE_DAYS = 30;
const HOURS_PER_DAY = 24;

/**
 * Privacy Service for GDPR/CCPA compliance and privacy management
 */
export class PrivacyService {
  private encryptionService: EncryptionService;
  
  // Configuration constants
  private static readonly DATA_RETENTION_DAYS = PRIVACY_RETENTION_DAYS;
  private static readonly EXPORT_EXPIRY_HOURS = EXPORT_EXPIRY_HOURS;
  private static readonly AUDIT_LOG_MAX_ENTRIES = AUDIT_LOG_MAX_ENTRIES;
  private static readonly CONSENT_VERSION = '1.0';

  // Storage keys for different data types
  private readonly storageKeys = {
    consent: 'privacy_consent',
    settings: 'privacy_settings',
    auditLog: 'privacy_audit_log',
    requests: 'privacy_requests',
    inventory: 'privacy_inventory'
  };

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Record user consent for data processing
   */
  async recordConsent(
    userId: string,
    preferences: ConsentPreferences,
    ipAddress?: string
  ): Promise<SecurityResult<PrivacyConsent>> {
    try {
      const consent: PrivacyConsent = {
        id: this.generateConsentId(),
        userId,
        dataCollection: preferences.functional,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        locationTracking: preferences.locationServices,
        incidentReporting: preferences.essential, // Always true for incident reporting
        timestamp: new Date(),
        ipAddress,
        consentVersion: PrivacyService.CONSENT_VERSION
      };

      // Encrypt and store consent
      const encryptedConsent = await this.encryptData(consent);
      if (!encryptedConsent.success) {
        return {
          success: false,
          error: {
            code: 'ENCRYPTION_FAILED',
            message: 'Failed to encrypt consent data',
            severity: 'high'
          },
          timestamp: new Date()
        };
      }

      await this.storeEncryptedData(this.storageKeys.consent, userId, encryptedConsent.data!);

      // Log the consent action
      await this.logPrivacyAction(userId, 'consent_given', {
        consentId: consent.id,
        preferences,
        version: PrivacyService.CONSENT_VERSION
      }, ipAddress);

      return {
        success: true,
        data: consent,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONSENT_RECORDING_FAILED',
          message: 'Failed to record user consent',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Withdraw user consent
   */
  async withdrawConsent(
    userId: string,
    ipAddress?: string
  ): Promise<SecurityResult<boolean>> {
    try {
      const currentConsent = await this.getUserConsent(userId);
      if (!currentConsent.success || !currentConsent.data) {
        return {
          success: false,
          error: {
            code: 'CONSENT_NOT_FOUND',
            message: 'No consent record found for user',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      // Update consent with withdrawal date
      const updatedConsent: PrivacyConsent = {
        ...currentConsent.data,
        dataCollection: false,
        analytics: false,
        marketing: false,
        locationTracking: false,
        withdrawalDate: new Date()
      };

      const encryptedConsent = await this.encryptData(updatedConsent);
      if (!encryptedConsent.success) {
        return {
          success: false,
          error: {
            code: 'ENCRYPTION_FAILED',
            message: 'Failed to encrypt updated consent',
            severity: 'high'
          },
          timestamp: new Date()
        };
      }

      await this.storeEncryptedData(this.storageKeys.consent, userId, encryptedConsent.data!);

      // Log the withdrawal
      await this.logPrivacyAction(userId, 'consent_withdrawn', {
        previousConsentId: currentConsent.data.id,
        withdrawalReason: 'user_request'
      }, ipAddress);

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONSENT_WITHDRAWAL_FAILED',
          message: 'Failed to withdraw consent',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user's current consent status
   */
  async getUserConsent(userId: string): Promise<SecurityResult<PrivacyConsent>> {
    try {
      const encryptedData = await this.getEncryptedData(this.storageKeys.consent, userId);
      if (!encryptedData) {
        return {
          success: false,
          error: {
            code: 'CONSENT_NOT_FOUND',
            message: 'No consent record found',
            severity: 'low'
          },
          timestamp: new Date()
        };
      }

      const decryptedConsent = await this.decryptData<PrivacyConsent>(encryptedData);
      if (!decryptedConsent.success) {
        return {
          success: false,
          error: {
            code: 'DECRYPTION_FAILED',
            message: 'Failed to decrypt consent data',
            severity: 'high'
          },
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: decryptedConsent.data!,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONSENT_RETRIEVAL_FAILED',
          message: 'Failed to retrieve consent data',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Request data export (Right to Data Portability)
   */
  async requestDataExport(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<SecurityResult<DataExportRequest>> {
    try {
      const exportRequest: DataExportRequest = {
        userId,
        requestId: this.generateRequestId(),
        requestDate: new Date(),
        status: 'pending',
        format,
        expiresAt: new Date(Date.now() + PrivacyService.EXPORT_EXPIRY_HOURS * MINUTES_PER_HOUR * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND)
      };

      // Store the request
      await this.storeRequest('export', exportRequest);

      // Generate the export data
      const exportData = await this.generateExportData(userId);
      if (exportData.success) {
        exportRequest.status = 'completed';
        exportRequest.fileSize = JSON.stringify(exportData.data).length;
        
        // In a real implementation, you would upload to a secure temporary location
        // and provide a download URL
        exportRequest.downloadUrl = `temp://export_${exportRequest.requestId}`;
        
        await this.storeRequest('export', exportRequest);
      }

      // Log the export request
      await this.logPrivacyAction(userId, 'data_exported', {
        requestId: exportRequest.requestId,
        format,
        status: exportRequest.status
      });

      return {
        success: true,
        data: exportRequest,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATA_EXPORT_FAILED',
          message: 'Failed to process data export request',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Request account and data deletion (Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string,
    scope: 'full' | 'partial' = 'full',
    retentionPeriod?: number
  ): Promise<SecurityResult<DataDeletionRequest>> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestId: this.generateRequestId(),
        requestDate: new Date(),
        status: 'pending',
        deletionScope: scope,
        retentionPeriod: retentionPeriod || 0
      };

      // Store the deletion request
      await this.storeRequest('deletion', deletionRequest);

      // Process deletion (in production, this might be queued for manual review)
      if (scope === 'full') {
        await this.performFullDeletion(userId);
      } else {
        await this.performPartialDeletion(userId);
      }

      deletionRequest.status = 'completed';
      deletionRequest.completedDate = new Date();
      
      await this.storeRequest('deletion', deletionRequest);

      // Log the deletion (this might be the last action before data is removed)
      await this.logPrivacyAction(userId, 'data_deleted', {
        requestId: deletionRequest.requestId,
        scope,
        completedAt: deletionRequest.completedDate
      });

      return {
        success: true,
        data: deletionRequest,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATA_DELETION_FAILED',
          message: 'Failed to process data deletion request',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Submit a privacy right request
   */
  async submitPrivacyRightRequest(
    userId: string,
    rightType: PrivacyRight,
    description: string,
    evidence?: string[]
  ): Promise<SecurityResult<PrivacyRightRequest>> {
    try {
      const request: PrivacyRightRequest = {
        id: this.generateRequestId(),
        userId,
        rightType,
        description,
        status: 'submitted',
        submittedAt: new Date(),
        evidence,
        appealDeadline: new Date(Date.now() + APPEAL_DEADLINE_DAYS * HOURS_PER_DAY * MINUTES_PER_HOUR * MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND) // 30 days
      };

      // Store the request
      await this.storeRequest('privacy_right', request);

      // Log the request
      await this.logPrivacyAction(userId, 'data_accessed', {
        requestType: rightType,
        requestId: request.id,
        description
      });

      return {
        success: true,
        data: request,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRIVACY_REQUEST_FAILED',
          message: 'Failed to submit privacy right request',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get user's data inventory
   */
  async getDataInventory(_userId: string): Promise<SecurityResult<DataInventory>> {
    try {
      // This would collect data from various parts of the app
      const inventory: DataInventory = {
        personalData: {
          profile: {
            email: 'user@example.com', // Would be retrieved from user profile
            // other profile data...
          },
          authentication: {
            hashedPassword: true,
            biometricTemplates: false,
            securityQuestions: false
          },
          incidents: {
            totalReports: 0,
            anonymousReports: 0,
            locations: 0,
            evidence: 0
          },
          usage: {
            sessionData: true,
            deviceInfo: true,
            appUsage: true,
            crashReports: false
          }
        },
        metadata: {
          accountCreated: new Date(),
          lastLogin: new Date(),
          dataSize: '< 1 MB',
          storageLocations: ['Local Device', 'Encrypted Cloud Storage']
        }
      };

      return {
        success: true,
        data: inventory,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVENTORY_FAILED',
          message: 'Failed to generate data inventory',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<SecurityResult<PrivacySettings>> {
    try {
      const currentSettings = await this.getPrivacySettings(userId);
      if (!currentSettings.success || !currentSettings.data) {
        return {
          success: false,
          error: {
            code: 'SETTINGS_NOT_FOUND',
            message: 'Could not retrieve current privacy settings',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      const updatedSettings: PrivacySettings = {
        ...currentSettings.data,
        ...settings,
        userId,
        lastUpdated: new Date()
      };

      const encryptedSettings = await this.encryptData(updatedSettings);
      if (!encryptedSettings.success) {
        return {
          success: false,
          error: {
            code: 'ENCRYPTION_FAILED',
            message: 'Failed to encrypt privacy settings',
            severity: 'high'
          },
          timestamp: new Date()
        };
      }

      await this.storeEncryptedData(this.storageKeys.settings, userId, encryptedSettings.data!);

      await this.logPrivacyAction(userId, 'settings_changed', {
        updatedFields: Object.keys(settings),
        timestamp: new Date()
      });

      return {
        success: true,
        data: updatedSettings,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SETTINGS_UPDATE_FAILED',
          message: 'Failed to update privacy settings',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  // Private helper methods

  public async getPrivacySettings(userId: string): Promise<SecurityResult<PrivacySettings>> {
    try {
      const encryptedData = await this.getEncryptedData(this.storageKeys.settings, userId);
      if (!encryptedData) {
        // Return default settings
        const defaultSettings: PrivacySettings = {
          userId,
          dataMinimization: {
            enabled: true,
            retentionPeriod: PrivacyService.DATA_RETENTION_DAYS,
            autoDelete: false
          },
          anonymization: {
            incidentReports: false,
            locationData: true,
            deviceInfo: true
          },
          sharing: {
            lawEnforcement: false,
            emergencyServices: true,
            analytics: false,
            thirdPartyIntegrations: false
          },
          notifications: {
            privacyUpdates: true,
            dataRequests: true,
            securityAlerts: true
          },
          lastUpdated: new Date()
        };

        return {
          success: true,
          data: defaultSettings,
          timestamp: new Date()
        };
      }

      const decryptedSettings = await this.decryptData<PrivacySettings>(encryptedData);
      return decryptedSettings;

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SETTINGS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve privacy settings',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  private async generateExportData(userId: string): Promise<SecurityResult<Record<string, unknown>>> {
    try {
      const [consent, settings, auditLog, inventory] = await Promise.all([
        this.getUserConsent(userId),
        this.getPrivacySettings(userId),
        this.getAuditLog(userId),
        this.getDataInventory(userId)
      ]);

      const exportData = {
        user: {
          id: userId,
          exportDate: new Date().toISOString(),
          dataVersion: '1.0.0'
        },
        consent: consent.data,
        privacySettings: settings.data,
        auditLog: auditLog.data || [],
        dataInventory: inventory.data,
        // Add other data categories as needed
        incidents: [], // Would be populated from incident service
        notifications: []
      };

      return {
        success: true,
        data: exportData,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_GENERATION_FAILED',
          message: 'Failed to generate export data',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  private async performFullDeletion(userId: string): Promise<void> {
    // Delete all user data across all storage keys
    const keysToDelete = [
      `${this.storageKeys.consent}_${userId}`,
      `${this.storageKeys.settings}_${userId}`,
      `${this.storageKeys.auditLog}_${userId}`,
      `${this.storageKeys.requests}_${userId}`,
      `${this.storageKeys.inventory}_${userId}`
    ];

    await Promise.all(
      keysToDelete.map(key => AsyncStorage.removeItem(key))
    );
  }

  private async performPartialDeletion(userId: string): Promise<void> {
    // Implement partial deletion based on legal requirements
    // This might preserve certain data for legal/safety reasons
    const currentSettings = await this.getPrivacySettings(userId);
    if (currentSettings.success && currentSettings.data) {
      const preservedSettings = {
        ...currentSettings.data,
        dataMinimization: { ...currentSettings.data.dataMinimization, autoDelete: true }
      };
      
      const encryptedSettings = await this.encryptData(preservedSettings);
      if (encryptedSettings.success) {
        await this.storeEncryptedData(this.storageKeys.settings, userId, encryptedSettings.data!);
      }
    }
  }

  private async logPrivacyAction(
    userId: string,
    action: PrivacyAuditLog['action'],
    details: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    try {
      const logEntry: PrivacyAuditLog = {
        id: this.generateLogId(),
        userId,
        action,
        timestamp: new Date(),
        ipAddress,
        details,
        legalBasis: {
          type: 'consent',
          description: 'User consent for data processing',
          dataCategories: ['user_data'],
          processingPurposes: ['service_provision'],
          retentionPeriod: PrivacyService.DATA_RETENTION_DAYS,
          automaticProcessing: false
        }
      };

      const currentLog = await this.getAuditLog(userId);
      const logEntries = currentLog.success && currentLog.data ? currentLog.data : [];
      
      logEntries.push(logEntry);
      
      // Keep only the most recent entries
      if (logEntries.length > PrivacyService.AUDIT_LOG_MAX_ENTRIES) {
        logEntries.splice(0, logEntries.length - PrivacyService.AUDIT_LOG_MAX_ENTRIES);
      }

      const encryptedLog = await this.encryptData(logEntries);
      if (encryptedLog.success) {
        await this.storeEncryptedData(this.storageKeys.auditLog, userId, encryptedLog.data!);
      }

    } catch (error) {
      console.error('Failed to log privacy action:', error);
    }
  }

  private async getAuditLog(userId: string): Promise<SecurityResult<PrivacyAuditLog[]>> {
    try {
      const encryptedData = await this.getEncryptedData(this.storageKeys.auditLog, userId);
      if (!encryptedData) {
        return {
          success: true,
          data: [],
          timestamp: new Date()
        };
      }

      return await this.decryptData<PrivacyAuditLog[]>(encryptedData);

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIT_LOG_RETRIEVAL_FAILED',
          message: 'Failed to retrieve audit log',
          severity: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  private async storeRequest(type: string, request: unknown): Promise<void> {
    const key = `${this.storageKeys.requests}_${type}`;
    const encryptedRequest = await this.encryptData(request);
    if (encryptedRequest.success) {
      await AsyncStorage.setItem(key, JSON.stringify(encryptedRequest.data));
    }
  }

  private async encryptData<T>(data: T): Promise<SecurityResult<string>> {
    const encryptResult = await this.encryptionService.encrypt(JSON.stringify(data));
    if (encryptResult.success && encryptResult.data) {
      return {
        success: true,
        data: encryptResult.data.encryptedData,
        timestamp: new Date()
      };
    }
    
    return {
      success: false,
      error: encryptResult.error || {
        code: 'ENCRYPTION_FAILED',
        message: 'Failed to encrypt data',
        severity: 'high'
      },
      timestamp: new Date()
    };
  }

  private async decryptData<T>(encryptedData: string): Promise<SecurityResult<T>> {
    const decryptResult = await this.encryptionService.decrypt(JSON.parse(encryptedData));
    if (decryptResult.success && decryptResult.data) {
      return {
        success: true,
        data: JSON.parse(decryptResult.data) as T,
        timestamp: new Date()
      };
    }
    return decryptResult as SecurityResult<T>;
  }

  private async storeEncryptedData(storageKey: string, userId: string, encryptedData: string): Promise<void> {
    await AsyncStorage.setItem(`${storageKey}_${userId}`, encryptedData);
  }

  private async getEncryptedData(storageKey: string, userId: string): Promise<string | null> {
    return await AsyncStorage.getItem(`${storageKey}_${userId}`);
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(PRIVACY_CONSTANTS.RANDOM_STRING_BASE).substr(PRIVACY_CONSTANTS.RANDOM_STRING_START, PRIVACY_CONSTANTS.RANDOM_STRING_LENGTH)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(PRIVACY_CONSTANTS.RANDOM_STRING_BASE).substr(PRIVACY_CONSTANTS.RANDOM_STRING_START, PRIVACY_CONSTANTS.RANDOM_STRING_LENGTH)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(PRIVACY_CONSTANTS.RANDOM_STRING_BASE).substr(PRIVACY_CONSTANTS.RANDOM_STRING_START, PRIVACY_CONSTANTS.RANDOM_STRING_LENGTH)}`;
  }
}
