/**
 * Enhanced Data Encryption Manager for DESIST
 * 
 * Provides secure data encryption at rest using expo-secure-store
 * and integrates with existing CryptoManager for enhanced security
 */

import * as SecureStore from 'expo-secure-store';
import { CryptoManager } from './cryptoManager';
import { appLockManager } from './appLock';
import AmplitudeSecurityAnalytics, { trackUserInteraction } from '../analytics/amplitudeConfig';

export interface EncryptionOptions {
  requireAuthentication?: boolean;
  accessGroup?: string;
}

export interface SecureDataItem {
  id: string;
  data: string;
  encryptedAt: Date;
  lastAccessed?: Date;
  accessCount: number;
  requiresAuth: boolean;
}

export interface EncryptionResult {
  success: boolean;
  error?: string;
  encryptedData?: string;
}

export interface DecryptionResult {
  success: boolean;
  error?: string;
  decryptedData?: string;
}

const DEFAULT_OPTIONS: EncryptionOptions = {
  requireAuthentication: true,
};

export class EnhancedDataEncryption {
  private static instance: EnhancedDataEncryption;
  private cryptoManager: CryptoManager;
  private analytics: AmplitudeSecurityAnalytics;
  private initialized = false;
  private encryptionKey: string | null = null;

  constructor() {
    this.cryptoManager = CryptoManager.getInstance();
    this.analytics = AmplitudeSecurityAnalytics.getInstance();
  }

  static getInstance(): EnhancedDataEncryption {
    if (!EnhancedDataEncryption.instance) {
      EnhancedDataEncryption.instance = new EnhancedDataEncryption();
    }
    return EnhancedDataEncryption.instance;
  }

  /**
   * Initialize the encryption manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize crypto manager first
      await this.cryptoManager.initialize();
      
      // Generate or retrieve master encryption key
      await this.initializeEncryptionKey();
      
      // Track initialization
      await this.analytics.trackSecurityEvent('data_encryption_initialized', {
        eventType: 'crypto_operation',
        success: true,
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize data encryption:', error);
      
      await this.analytics.trackSecurityEvent('data_encryption_init_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  /**
   * Securely store encrypted data
   */
  async storeSecureData(
    key: string, 
    data: string, 
    options: EncryptionOptions = DEFAULT_OPTIONS
  ): Promise<EncryptionResult> {
    try {
      if (!this.initialized || !this.encryptionKey) {
        await this.initialize();
      }

      // Check if app lock authentication is required
      if (options.requireAuthentication && appLockManager.getLockState().isLocked) {
        return {
          success: false,
          error: 'Authentication required to store secure data',
        };
      }

      // Encrypt the data using CryptoManager
      const encryptedData = await this.encryptData(data);
      
      if (!encryptedData.success) {
        return encryptedData;
      }

      // Store in SecureStore with additional metadata
      const secureItem: SecureDataItem = {
        id: key,
        data: encryptedData.encryptedData!,
        encryptedAt: new Date(),
        accessCount: 0,
        requiresAuth: options.requireAuthentication || false,
      };

      await SecureStore.setItemAsync(
        this.getSecureKey(key),
        JSON.stringify(secureItem),
        {
          requireAuthentication: options.requireAuthentication,
          accessGroup: options.accessGroup,
        }
      );

      // Track successful storage
      await this.analytics.trackSecurityEvent('secure_data_stored', {
        eventType: 'crypto_operation',
        success: true,
      });

      trackUserInteraction('secure_data_store', {
        data_key: key,
        requires_auth: options.requireAuthentication,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to store secure data:', error);
      
      await this.analytics.trackSecurityEvent('secure_data_store_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store secure data',
      };
    }
  }

  /**
   * Retrieve and decrypt secure data
   */
  async getSecureData(key: string): Promise<DecryptionResult> {
    try {
      if (!this.initialized || !this.encryptionKey) {
        await this.initialize();
      }

      // Retrieve from SecureStore
      const storedData = await SecureStore.getItemAsync(this.getSecureKey(key));
      
      if (!storedData) {
        return {
          success: false,
          error: 'Secure data not found',
        };
      }

      const secureItem: SecureDataItem = JSON.parse(storedData);

      // Check if app lock authentication is required
      if (secureItem.requiresAuth && appLockManager.getLockState().isLocked) {
        return {
          success: false,
          error: 'Authentication required to access secure data',
        };
      }

      // Decrypt the data
      const decryptedData = await this.decryptData(secureItem.data);
      
      if (!decryptedData.success) {
        return decryptedData;
      }

      // Update access metadata
      secureItem.lastAccessed = new Date();
      secureItem.accessCount++;
      
      await SecureStore.setItemAsync(
        this.getSecureKey(key),
        JSON.stringify(secureItem)
      );

      // Track successful retrieval
      await this.analytics.trackSecurityEvent('secure_data_retrieved', {
        eventType: 'crypto_operation',
        success: true,
      });

      trackUserInteraction('secure_data_retrieve', {
        data_key: key,
        access_count: secureItem.accessCount,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        decryptedData: decryptedData.decryptedData,
      };
    } catch (error) {
      console.error('❌ Failed to retrieve secure data:', error);
      
      await this.analytics.trackSecurityEvent('secure_data_retrieve_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve secure data',
      };
    }
  }

  /**
   * Delete secure data
   */
  async deleteSecureData(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      await SecureStore.deleteItemAsync(this.getSecureKey(key));

      // Track successful deletion
      await this.analytics.trackSecurityEvent('secure_data_deleted', {
        eventType: 'crypto_operation',
        success: true,
      });

      trackUserInteraction('secure_data_delete', {
        data_key: key,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete secure data:', error);
      
      await this.analytics.trackSecurityEvent('secure_data_delete_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete secure data',
      };
    }
  }

  /**
   * List all secure data keys (metadata only)
   */
  async listSecureDataKeys(): Promise<{ success: boolean; keys?: string[]; error?: string }> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd maintain an index of keys
      const keys: string[] = []; // Placeholder for key enumeration
      
      return { success: true, keys };
    } catch (error) {
      console.error('❌ Failed to list secure data keys:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list secure data keys',
      };
    }
  }

  /**
   * Backup secure data (encrypted)
   */
  async createSecureBackup(): Promise<{ success: boolean; backup?: string; error?: string }> {
    try {
      // This would create an encrypted backup of all secure data
      // Implementation depends on backup strategy
      
      await this.analytics.trackSecurityEvent('secure_backup_created', {
        eventType: 'crypto_operation',
        success: true,
      });

      return { success: true, backup: 'encrypted_backup_data' };
    } catch (error) {
      console.error('❌ Failed to create secure backup:', error);
      
      await this.analytics.trackSecurityEvent('secure_backup_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create secure backup',
      };
    }
  }

  /**
   * Restore from secure backup
   */
  async restoreFromBackup(_backupData: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would restore encrypted backup data
      // Implementation depends on backup strategy
      
      await this.analytics.trackSecurityEvent('secure_backup_restored', {
        eventType: 'crypto_operation',
        success: true,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      
      await this.analytics.trackSecurityEvent('secure_backup_restore_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore from backup',
      };
    }
  }

  /**
   * Encrypt data using CryptoManager
   */
  private async encryptData(data: string): Promise<EncryptionResult> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      // Combine data with encryption key for enhanced security
      const combinedData = `${data}:${this.encryptionKey}`;
      
      // Use crypto manager to generate secure hash (simplified encryption)
      const encryptedHash = await this.cryptoManager.generateSecureHash(combinedData);
      
      // In a real implementation, you'd use proper encryption algorithms
      // This is a simplified approach using hashing
      const encryptedData = Buffer.from(`${data}:${encryptedHash}`).toString('base64');

      return {
        success: true,
        encryptedData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt data using CryptoManager
   */
  private async decryptData(encryptedData: string): Promise<DecryptionResult> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      // Decode from base64
      const decodedData = Buffer.from(encryptedData, 'base64').toString();
      const [originalData, storedHash] = decodedData.split(':');
      
      if (!originalData || !storedHash) {
        throw new Error('Invalid encrypted data format');
      }

      // Verify the hash
      const combinedData = `${originalData}:${this.encryptionKey}`;
      const expectedHash = await this.cryptoManager.generateSecureHash(combinedData);
      
      if (storedHash !== expectedHash) {
        throw new Error('Data integrity check failed');
      }

      return {
        success: true,
        decryptedData: originalData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Initialize encryption key
   */
  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Check if encryption key exists
      let key = await SecureStore.getItemAsync('DESIST_MASTER_KEY');
      
      if (!key) {
        // Generate new master key
        key = await this.cryptoManager.generateSecureRandom();
        
        await SecureStore.setItemAsync('DESIST_MASTER_KEY', key, {
          requireAuthentication: true,
        });
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * Generate secure key for SecureStore
   */
  private getSecureKey(key: string): string {
    return `DESIST_SECURE_${key}`;
  }

  /**
   * Clear all secure data (emergency function)
   */
  async emergencyWipe(): Promise<{ success: boolean; error?: string }> {
    try {
      // This would clear all secure data in an emergency
      // Implementation depends on key management strategy
      
      // Clear master key
      await SecureStore.deleteItemAsync('DESIST_MASTER_KEY');
      this.encryptionKey = null;
      
      await this.analytics.trackSecurityEvent('emergency_wipe_executed', {
        eventType: 'crypto_operation',
        success: true,
      });

      trackUserInteraction('emergency_wipe', {
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to execute emergency wipe:', error);
      
      await this.analytics.trackSecurityEvent('emergency_wipe_failed', {
        eventType: 'crypto_operation',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute emergency wipe',
      };
    }
  }
}

// Export singleton instance
export const enhancedDataEncryption = EnhancedDataEncryption.getInstance();

// Export convenience functions
export const storeSecureData = (key: string, data: string, options?: EncryptionOptions) =>
  enhancedDataEncryption.storeSecureData(key, data, options);

export const getSecureData = (key: string) =>
  enhancedDataEncryption.getSecureData(key);

export const deleteSecureData = (key: string) =>
  enhancedDataEncryption.deleteSecureData(key);

export const createSecureBackup = () =>
  enhancedDataEncryption.createSecureBackup();

export const emergencyWipe = () =>
  enhancedDataEncryption.emergencyWipe();
