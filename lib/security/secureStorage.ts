import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export interface SecureStorageConfig {
  useSecureStore: boolean;
  encryptData: boolean;
  dataExpirationEnabled: boolean;
  defaultExpirationDays: number;
  autoCleanup: boolean;
}

export interface StorageItem {
  value: string;
  timestamp: Date;
  expiresAt?: Date;
  encrypted: boolean;
}

const SECURE_STORAGE_CONFIG_KEY = 'desist_secure_storage_config';
const ENCRYPTION_KEY_SUFFIX = '_encrypted';
const EXPIRATION_SUFFIX = '_expires';

const DEFAULT_CONFIG: SecureStorageConfig = {
  useSecureStore: true,
  encryptData: true,
  dataExpirationEnabled: true,
  defaultExpirationDays: 30,
  autoCleanup: true,
};

export class SecureStorageManager {
  private static instance: SecureStorageManager;
  private config: SecureStorageConfig = DEFAULT_CONFIG;
  private initialized = false;
  private encryptionKey: string = '';

  static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load configuration
      const storedConfig = await AsyncStorage.getItem(
        SECURE_STORAGE_CONFIG_KEY
      );
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
        };
      }

      // Initialize encryption key
      await this.initializeEncryptionKey();

      // Perform cleanup if enabled
      if (this.config.autoCleanup) {
        await this.cleanupExpiredData();
      }

      this.initialized = true;
      console.log('SecureStorageManager initialized');
    } catch (error) {
      console.error('Failed to initialize SecureStorageManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  private async initializeEncryptionKey(): Promise<void> {
    try {
      // Try to get existing encryption key
      const existingKey = await SecureStore.getItemAsync(
        'desist_encryption_key'
      );

      if (existingKey) {
        this.encryptionKey = existingKey;
      } else {
        // Generate new encryption key
        this.encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        await SecureStore.setItemAsync(
          'desist_encryption_key',
          this.encryptionKey
        );
      }
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      // Fallback to a deterministic key (not recommended for production)
      this.encryptionKey = 'fallback_key_' + Date.now();
    }
  }

  async setItem(
    key: string,
    value: string,
    options?: {
      expirationDays?: number;
      useSecureStore?: boolean;
      encrypt?: boolean;
    }
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const useSecureStore =
        options?.useSecureStore ?? this.config.useSecureStore;
      const encrypt = options?.encrypt ?? this.config.encryptData;
      const expirationDays =
        options?.expirationDays ?? this.config.defaultExpirationDays;

      let processedValue = value;

      // Encrypt if requested
      if (encrypt) {
        processedValue = this.encryptValue(value);
      }

      // Create storage item
      const storageItem: StorageItem = {
        value: processedValue,
        timestamp: new Date(),
        encrypted: encrypt,
      };

      // Set expiration if enabled
      if (this.config.dataExpirationEnabled && expirationDays > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);
        storageItem.expiresAt = expiresAt;
      }

      const serializedItem = JSON.stringify(storageItem);

      // Store using appropriate method
      if (useSecureStore) {
        await SecureStore.setItemAsync(key, serializedItem);
      } else {
        await AsyncStorage.setItem(key, serializedItem);
      }

      return true;
    } catch (error) {
      console.error(`Failed to set secure item ${key}:`, error);
      return false;
    }
  }

  async getItem(
    key: string,
    options?: {
      useSecureStore?: boolean;
    }
  ): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const useSecureStore =
        options?.useSecureStore ?? this.config.useSecureStore;

      let serializedItem: string | null;

      // Get from appropriate storage
      if (useSecureStore) {
        serializedItem = await SecureStore.getItemAsync(key);
      } else {
        serializedItem = await AsyncStorage.getItem(key);
      }

      if (!serializedItem) {
        return null;
      }

      const storageItem: StorageItem = JSON.parse(serializedItem);

      // Check expiration
      if (
        storageItem.expiresAt &&
        new Date() > new Date(storageItem.expiresAt)
      ) {
        // Item has expired, remove it
        await this.removeItem(key, { useSecureStore });
        return null;
      }

      let value = storageItem.value;

      // Decrypt if encrypted
      if (storageItem.encrypted) {
        value = this.decryptValue(value);
      }

      return value;
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  async removeItem(
    key: string,
    options?: {
      useSecureStore?: boolean;
    }
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const useSecureStore =
        options?.useSecureStore ?? this.config.useSecureStore;

      if (useSecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }

      return true;
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      return false;
    }
  }

  async getAllKeys(options?: { useSecureStore?: boolean }): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const useSecureStore = options?.useSecureStore ?? false; // Default to AsyncStorage for listing

      if (useSecureStore) {
        // SecureStore doesn't provide a way to list all keys
        // Return empty array for now
        return [];
      } else {
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter(
          (key) =>
            !key.endsWith(ENCRYPTION_KEY_SUFFIX) &&
            !key.endsWith(EXPIRATION_SUFFIX)
        );
      }
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  async setItemWithExpiration(
    key: string,
    value: string,
    expirationDate: Date,
    options?: {
      useSecureStore?: boolean;
      encrypt?: boolean;
    }
  ): Promise<boolean> {
    const expirationDays = Math.ceil(
      (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return this.setItem(key, value, {
      ...options,
      expirationDays: Math.max(1, expirationDays),
    });
  }

  async cleanupExpiredData(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    let cleanedCount = 0;

    try {
      // Clean up AsyncStorage items
      const keys = await AsyncStorage.getAllKeys();

      for (const key of keys) {
        try {
          const item = await AsyncStorage.getItem(key);
          if (item) {
            const storageItem: StorageItem = JSON.parse(item);
            if (
              storageItem.expiresAt &&
              new Date() > new Date(storageItem.expiresAt)
            ) {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // Skip items that aren't in our format
          continue;
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired items`);
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }

    return cleanedCount;
  }

  private encryptValue(value: string): string {
    try {
      return CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
    } catch (error) {
      console.error('Failed to encrypt value:', error);
      return value; // Return unencrypted as fallback
    }
  }

  private decryptValue(encryptedValue: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt value:', error);
      return encryptedValue; // Return as-is if decryption fails
    }
  }

  async updateConfig(updates: Partial<SecureStorageConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.config = {
      ...this.config,
      ...updates,
    };

    await this.saveConfig();
  }

  getConfig(): SecureStorageConfig {
    return { ...this.config };
  }

  async getStorageStats(): Promise<{
    totalItems: number;
    expiredItems: number;
    encryptedItems: number;
    storageSize: number;
  }> {
    const keys = await this.getAllKeys();
    let expiredItems = 0;
    let encryptedItems = 0;
    let storageSize = 0;

    for (const key of keys) {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const storageItem: StorageItem = JSON.parse(item);

          if (
            storageItem.expiresAt &&
            new Date() > new Date(storageItem.expiresAt)
          ) {
            expiredItems++;
          }

          if (storageItem.encrypted) {
            encryptedItems++;
          }

          storageSize += item.length;
        }
      } catch (error) {
        // Skip items that aren't in our format
        continue;
      }
    }

    return {
      totalItems: keys.length,
      expiredItems,
      encryptedItems,
      storageSize,
    };
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SECURE_STORAGE_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save secure storage config:', error);
    }
  }

  // Emergency data wipe
  async emergencyWipe(): Promise<boolean> {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();

      // Clear SecureStore data (we can only clear known keys)
      try {
        await SecureStore.deleteItemAsync('desist_encryption_key');
      } catch (error) {
        // Key might not exist, ignore error
      }

      console.log('Emergency data wipe completed');
      return true;
    } catch (error) {
      console.error('Failed to perform emergency wipe:', error);
      return false;
    }
  }

  // Secure deletion with overwrite
  async secureDelete(
    key: string,
    options?: {
      useSecureStore?: boolean;
      overwritePasses?: number;
    }
  ): Promise<boolean> {
    const overwritePasses = options?.overwritePasses ?? 3;

    try {
      // Overwrite with random data multiple times
      for (let i = 0; i < overwritePasses; i++) {
        const randomData = CryptoJS.lib.WordArray.random(1024).toString();
        await this.setItem(key, randomData, options);
      }

      // Finally remove the item
      return await this.removeItem(key, options);
    } catch (error) {
      console.error(`Failed to securely delete ${key}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const secureStorageManager = SecureStorageManager.getInstance();

// Export helper functions
export const setSecureItem = (key: string, value: string, options?: any) =>
  secureStorageManager.setItem(key, value, options);
export const getSecureItem = (key: string, options?: any) =>
  secureStorageManager.getItem(key, options);
export const removeSecureItem = (key: string, options?: any) =>
  secureStorageManager.removeItem(key, options);
export const cleanupExpiredData = () =>
  secureStorageManager.cleanupExpiredData();
