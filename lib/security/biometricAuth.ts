import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricConfig {
  isEnabled: boolean;
  requireBiometric: boolean;
  fallbackToPin: boolean;
  biometricType: BiometricType;
  lastAuthTime: Date;
  maxAuthInterval: number; // in milliseconds
  videoAccessPinEnabled: boolean; // NEW: PIN required for video access
  lastVideoAccessTime: Date; // NEW: Track last video access
  videoPinRequired: boolean; // NEW: Whether PIN is required for videos
  newRecordingDetected: boolean; // NEW: Flag for new recordings
}

const BIOMETRIC_CONFIG_KEY = 'desist_biometric_config';
const PIN_STORAGE_KEY = 'desist_pin_hash';

const DEFAULT_CONFIG: BiometricConfig = {
  isEnabled: false,
  requireBiometric: false,
  fallbackToPin: false,
  biometricType: 'none',
  lastAuthTime: new Date(0),
  maxAuthInterval: 5 * 60 * 1000, // 5 minutes
  videoAccessPinEnabled: true, // NEW: Default to requiring PIN for videos
  lastVideoAccessTime: new Date(0), // NEW: No previous video access
  videoPinRequired: true, // NEW: PIN required by default
  newRecordingDetected: false, // NEW: No new recordings initially
};

export class BiometricAuthManager {
  private static instance: BiometricAuthManager;
  private config: BiometricConfig = DEFAULT_CONFIG;
  private initialized = false;

  static getInstance(): BiometricAuthManager {
    if (!BiometricAuthManager.instance) {
      BiometricAuthManager.instance = new BiometricAuthManager();
    }
    return BiometricAuthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(BIOMETRIC_CONFIG_KEY);
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
          lastAuthTime: new Date(JSON.parse(storedConfig).lastAuthTime),
        };
      }

      // Check biometric availability
      await this.checkBiometricAvailability();
      this.initialized = true;
      console.log('BiometricAuthManager initialized');
    } catch (error) {
      console.error('Failed to initialize BiometricAuthManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  async checkBiometricAvailability(): Promise<{
    isAvailable: boolean;
    biometricType: BiometricType;
    supportedTypes: string[];
  }> {
    try {
      const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (!isHardwareAvailable || !isEnrolled) {
        return {
          isAvailable: false,
          biometricType: 'none',
          supportedTypes: [],
        };
      }

      // Determine the primary biometric type
      let biometricType: BiometricType = 'none';
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        biometricType = 'facial';
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        biometricType = 'fingerprint';
      } else if (
        supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
      ) {
        biometricType = 'iris';
      }

      return {
        isAvailable: true,
        biometricType,
        supportedTypes: supportedTypes.map((type) => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT:
              return 'fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
              return 'facial';
            case LocalAuthentication.AuthenticationType.IRIS:
              return 'iris';
            default:
              return 'unknown';
          }
        }),
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        biometricType: 'none',
        supportedTypes: [],
      };
    }
  }

  async enableBiometricAuth(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        console.warn('Biometric authentication not available');
        return false;
      }

      // Test biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for DESIST',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        this.config = {
          ...this.config,
          isEnabled: true,
          requireBiometric: true,
          biometricType: availability.biometricType,
          lastAuthTime: new Date(),
        };

        await this.saveConfig();
        console.log('Biometric authentication enabled');
        return true;
      } else {
        console.log('Biometric authentication setup cancelled or failed');
        return false;
      }
    } catch (error) {
      console.error('Failed to enable biometric authentication:', error);
      return false;
    }
  }

  async disableBiometricAuth(): Promise<void> {
    this.config = {
      ...this.config,
      isEnabled: false,
      requireBiometric: false,
    };

    await this.saveConfig();
    console.log('Biometric authentication disabled');
  }

  async authenticateWithBiometric(prompt?: string): Promise<{
    success: boolean;
    error?: string;
    fallbackAvailable?: boolean;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.config.isEnabled) {
      return { success: false, error: 'Biometric authentication not enabled' };
    }

    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
          fallbackAvailable: this.config.fallbackToPin,
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt || 'Authenticate to access DESIST',
        cancelLabel: 'Cancel',
        fallbackLabel: this.config.fallbackToPin ? 'Use PIN' : undefined,
        disableDeviceFallback: !this.config.fallbackToPin,
      });

      if (result.success) {
        this.config.lastAuthTime = new Date();
        await this.saveConfig();

        return { success: true };
      } else {
        let errorMsg = 'Authentication failed';
        if ('error' in result && result.error) {
          errorMsg = result.error;
        }
        return {
          success: false,
          error: errorMsg,
          fallbackAvailable: this.config.fallbackToPin,
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'Authentication system error',
        fallbackAvailable: this.config.fallbackToPin,
      };
    }
  }

  async isAuthenticationRequired(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.config.requireBiometric) {
      return false;
    }

    const now = new Date();
    const timeSinceAuth = now.getTime() - this.config.lastAuthTime.getTime();

    return timeSinceAuth > this.config.maxAuthInterval;
  }

  async setAuthInterval(milliseconds: number): Promise<void> {
    this.config.maxAuthInterval = milliseconds;
    await this.saveConfig();
  }

  async enablePinFallback(): Promise<boolean> {
    // This would integrate with a PIN system
    // For now, just enable the fallback option
    this.config.fallbackToPin = true;
    await this.saveConfig();
    return true;
  }

  async disablePinFallback(): Promise<void> {
    this.config.fallbackToPin = false;
    await this.saveConfig();
  }

  getBiometricType(): BiometricType {
    return this.config.biometricType;
  }

  isEnabled(): boolean {
    return this.config.isEnabled;
  }

  getConfig(): BiometricConfig {
    return { ...this.config };
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        BIOMETRIC_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save biometric config:', error);
      throw error;
    }
  }

  // Method to force re-authentication
  async requireReauth(): Promise<void> {
    this.config.lastAuthTime = new Date(0);
    await this.saveConfig();
  }

  // Method to extend current authentication session
  async extendAuthSession(): Promise<void> {
    this.config.lastAuthTime = new Date();
    await this.saveConfig();
  }

  // NEW: Video access PIN protection methods
  async isVideoPinRequired(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If video PIN is disabled, no PIN required
    if (!this.config.videoAccessPinEnabled) {
      return false;
    }

    // If there's a new recording detected, PIN is required
    if (this.config.newRecordingDetected) {
      return true;
    }

    // If user has never accessed videos, PIN is required
    if (this.config.lastVideoAccessTime.getTime() === 0) {
      return true;
    }

    return false;
  }

  async authenticateForVideoAccess(pin?: string): Promise<{
    success: boolean;
    error?: string;
    requiresPin?: boolean;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check if PIN is required
      const pinRequired = await this.isVideoPinRequired();
      
      if (!pinRequired) {
        // Update last access time
        this.config.lastVideoAccessTime = new Date();
        await this.saveConfig();
        return { success: true };
      }

      // PIN is required
      if (!pin) {
        return { 
          success: false, 
          requiresPin: true,
          error: 'PIN required for video access' 
        };
      }

      // Validate PIN (this would integrate with your PIN system)
      const pinValid = await this.validateVideoPin(pin);
      
      if (pinValid) {
        // Clear new recording flag and update access time
        this.config.newRecordingDetected = false;
        this.config.lastVideoAccessTime = new Date();
        await this.saveConfig();
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Invalid PIN' 
        };
      }
    } catch (error) {
      console.error('Video access authentication error:', error);
      return {
        success: false,
        error: 'Authentication system error',
      };
    }
  }

  async setNewRecordingDetected(detected: boolean = true): Promise<void> {
    this.config.newRecordingDetected = detected;
    await this.saveConfig();
    console.log(`New recording detection ${detected ? 'enabled' : 'disabled'}`);
  }

  async enableVideoAccessPin(): Promise<void> {
    this.config.videoAccessPinEnabled = true;
    this.config.videoPinRequired = true;
    await this.saveConfig();
    console.log('Video access PIN protection enabled');
  }

  async disableVideoAccessPin(): Promise<void> {
    this.config.videoAccessPinEnabled = false;
    this.config.videoPinRequired = false;
    this.config.newRecordingDetected = false;
    await this.saveConfig();
    console.log('Video access PIN protection disabled');
  }

  private async validateVideoPin(pin: string): Promise<boolean> {
    // This would integrate with your existing PIN system
    // For now, we'll use a simple storage-based validation
    try {
      const storedPinHash = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (!storedPinHash) {
        // No PIN set yet, this would prompt user to set one
        console.warn('No video access PIN set - would prompt user to create one');
        return false;
      }

      // Simple hash comparison (in production, use proper hashing)
      const pinHash = await this.hashPin(pin);
      return pinHash === storedPinHash;
    } catch (error) {
      console.error('PIN validation error:', error);
      return false;
    }
  }

  async setVideoAccessPin(pin: string): Promise<boolean> {
    try {
      const pinHash = await this.hashPin(pin);
      await AsyncStorage.setItem(PIN_STORAGE_KEY, pinHash);
      
      // Enable video PIN protection when PIN is set
      await this.enableVideoAccessPin();
      
      console.log('Video access PIN set successfully');
      return true;
    } catch (error) {
      console.error('Failed to set video access PIN:', error);
      return false;
    }
  }

  private async hashPin(pin: string): Promise<string> {
    // Simple hash for demo - in production use crypto library
    // This would use expo-crypto or similar for proper hashing
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Getter methods for video access
  isVideoAccessPinEnabled(): boolean {
    return this.config.videoAccessPinEnabled;
  }

  hasNewRecording(): boolean {
    return this.config.newRecordingDetected;
  }

  getLastVideoAccessTime(): Date {
    return this.config.lastVideoAccessTime;
  }
}

// Export singleton instance
export const biometricAuthManager = BiometricAuthManager.getInstance();

// Export helper functions
export const enableBiometric = () => biometricAuthManager.enableBiometricAuth();
export const authenticateWithBiometric = (prompt?: string) =>
  biometricAuthManager.authenticateWithBiometric(prompt);
export const isAuthRequired = () =>
  biometricAuthManager.isAuthenticationRequired();
export const checkBiometricAvailable = () =>
  biometricAuthManager.checkBiometricAvailability();

// NEW: Video access helper functions
export const isVideoPinRequired = () => biometricAuthManager.isVideoPinRequired();
export const authenticateForVideoAccess = (pin?: string) =>
  biometricAuthManager.authenticateForVideoAccess(pin);
export const setNewRecordingDetected = (detected?: boolean) =>
  biometricAuthManager.setNewRecordingDetected(detected);
export const setVideoAccessPin = (pin: string) =>
  biometricAuthManager.setVideoAccessPin(pin);
export const enableVideoAccessPin = () => biometricAuthManager.enableVideoAccessPin();
export const disableVideoAccessPin = () => biometricAuthManager.disableVideoAccessPin();
