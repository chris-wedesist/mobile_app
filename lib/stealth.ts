import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricAuthManager } from './security/biometricAuth';
import { screenProtectionManager } from './security/screenProtection';
import { threatDetectionEngine } from './security/threatDetection';

export type AppMode = 'stealth' | 'normal';

export interface StealthConfig {
  currentMode: AppMode;
  isFirstLaunch: boolean;
  lastToggleTime: Date;
  toggleCount: number;
  securityEnabled: boolean;
  preferredCoverStory: string;
  emergencyResetEnabled: boolean;
  biometricRequired: boolean;
  screenProtectionEnabled: boolean;
  threatDetectionEnabled: boolean;
}

const STORAGE_KEY = 'desist_stealth_config';
const DEFAULT_CONFIG: StealthConfig = {
  currentMode: 'stealth', // Default to stealth mode for safety
  isFirstLaunch: true,
  lastToggleTime: new Date(),
  toggleCount: 0,
  securityEnabled: true,
  preferredCoverStory: 'calculator',
  emergencyResetEnabled: true,
  biometricRequired: false,
  screenProtectionEnabled: true,
  threatDetectionEnabled: true,
};

export class StealthManager {
  private static instance: StealthManager;
  private config: StealthConfig = DEFAULT_CONFIG;
  private initialized = false;

  static getInstance(): StealthManager {
    if (!StealthManager.instance) {
      StealthManager.instance = new StealthManager();
    }
    return StealthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
          lastToggleTime: new Date(JSON.parse(storedConfig).lastToggleTime),
        };
      } else {
        // First launch - save default config
        await this.saveConfig();
      }

      // Initialize security systems
      await this.initializeSecurity();

      this.initialized = true;
      console.log(
        'StealthManager initialized with mode:',
        this.config.currentMode
      );
    } catch (error) {
      console.error('Failed to initialize StealthManager:', error);
      // Fallback to safe defaults
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  private async initializeSecurity(): Promise<void> {
    try {
      if (this.config.securityEnabled) {
        // Initialize biometric authentication
        await biometricAuthManager.initialize();

        // Initialize screen protection
        await screenProtectionManager.initialize();
        if (
          this.config.screenProtectionEnabled &&
          this.config.currentMode === 'normal'
        ) {
          await screenProtectionManager.enableScreenProtection();
        }

        // Initialize threat detection
        if (this.config.threatDetectionEnabled) {
          await threatDetectionEngine.initialize();
          await threatDetectionEngine.startMonitoring();
        }

        console.log('Security systems initialized');
      }
    } catch (error) {
      console.error('Failed to initialize security systems:', error);
    }
  }

  async getCurrentMode(): Promise<AppMode> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.config.currentMode;
  }

  async toggleMode(password?: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Security check for toggle frequency (prevent accidental toggles)
      const now = new Date();
      const timeSinceLastToggle =
        now.getTime() - this.config.lastToggleTime.getTime();

      // Require at least 5 seconds between toggles
      if (timeSinceLastToggle < 5000) {
        console.warn('Toggle attempt too soon after last toggle');
        return false;
      }

      // Biometric authentication check if required
      if (this.config.biometricRequired && this.config.securityEnabled) {
        const authRequired =
          await biometricAuthManager.isAuthenticationRequired();
        if (authRequired) {
          const authResult =
            await biometricAuthManager.authenticateWithBiometric(
              'Authenticate to switch app mode'
            );
          if (!authResult.success) {
            console.warn('Biometric authentication failed for mode toggle');
            return false;
          }
        }
      }

      // Toggle the mode
      const newMode: AppMode =
        this.config.currentMode === 'stealth' ? 'normal' : 'stealth';

      // Log usage pattern for threat detection
      if (this.config.threatDetectionEnabled) {
        await threatDetectionEngine.logUsagePattern('mode_toggle', undefined, {
          fromMode: this.config.currentMode,
          toMode: newMode,
        });
      }

      // Update screen protection based on new mode
      await this.updateSecurityForMode(newMode);

      this.config = {
        ...this.config,
        currentMode: newMode,
        lastToggleTime: now,
        toggleCount: this.config.toggleCount + 1,
        isFirstLaunch: false,
      };

      await this.saveConfig();

      console.log(`Mode toggled to: ${newMode}`);
      return true;
    } catch (error) {
      console.error('Failed to toggle mode:', error);
      return false;
    }
  }

  private async updateSecurityForMode(mode: AppMode): Promise<void> {
    try {
      if (!this.config.securityEnabled) return;

      if (mode === 'normal' && this.config.screenProtectionEnabled) {
        // Enable screen protection for normal mode
        await screenProtectionManager.enableScreenProtection();
      } else if (mode === 'stealth') {
        // Disable screen protection for stealth mode (to appear normal)
        await screenProtectionManager.disableScreenProtection();
      }
    } catch (error) {
      console.error('Failed to update security for mode:', error);
    }
  }

  async setMode(mode: AppMode): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.config = {
        ...this.config,
        currentMode: mode,
        lastToggleTime: new Date(),
      };

      await this.saveConfig();
      console.log(`Mode set to: ${mode}`);
      return true;
    } catch (error) {
      console.error('Failed to set mode:', error);
      return false;
    }
  }

  async resetToStealth(): Promise<void> {
    if (!this.config.emergencyResetEnabled) {
      console.warn('Emergency reset is disabled');
      return;
    }

    try {
      this.config = {
        ...DEFAULT_CONFIG,
        currentMode: 'stealth',
        lastToggleTime: new Date(),
      };

      await this.saveConfig();
      console.log('Emergency reset to stealth mode completed');
    } catch (error) {
      console.error('Failed to reset to stealth mode:', error);
    }
  }

  async getConfig(): Promise<StealthConfig> {
    if (!this.initialized) {
      await this.initialize();
    }
    return { ...this.config };
  }

  async updateConfig(updates: Partial<StealthConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    this.config = {
      ...this.config,
      ...updates,
    };

    await this.saveConfig();
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save stealth config:', error);
      throw error;
    }
  }

  // Method to validate toggle gesture sequence
  validateToggleSequence(sequence: number[]): boolean {
    // Expected sequence: 7 taps within 5 seconds
    const EXPECTED_SEQUENCE_LENGTH = 7;
    const MAX_SEQUENCE_TIME = 5000; // 5 seconds

    if (sequence.length !== EXPECTED_SEQUENCE_LENGTH) {
      return false;
    }

    // Check timing - all taps should be within 5 seconds
    const firstTap = sequence[0];
    const lastTap = sequence[sequence.length - 1];

    return lastTap - firstTap <= MAX_SEQUENCE_TIME;
  }

  // Method to clear all data (emergency use)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.config = DEFAULT_CONFIG;
      this.initialized = false;
      console.log('All stealth data cleared');
    } catch (error) {
      console.error('Failed to clear stealth data:', error);
    }
  }

  // Method to check if in stealth mode (synchronous, for quick checks)
  isStealthMode(): boolean {
    return this.config.currentMode === 'stealth';
  }

  // Method to get preferred cover story
  getPreferredCoverStory(): string {
    return this.config.preferredCoverStory;
  }

  // Method to set preferred cover story
  async setPreferredCoverStory(coverStory: string): Promise<void> {
    await this.updateConfig({ preferredCoverStory: coverStory });
  }

  // Method to get usage statistics
  getUsageStats(): {
    toggleCount: number;
    lastToggleTime: Date;
    isFirstLaunch: boolean;
  } {
    return {
      toggleCount: this.config.toggleCount,
      lastToggleTime: this.config.lastToggleTime,
      isFirstLaunch: this.config.isFirstLaunch,
    };
  }

  // Security configuration methods
  async enableBiometricAuth(): Promise<boolean> {
    try {
      const success = await biometricAuthManager.enableBiometricAuth();
      if (success) {
        this.config.biometricRequired = true;
        await this.saveConfig();
      }
      return success;
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      return false;
    }
  }

  async disableBiometricAuth(): Promise<void> {
    try {
      await biometricAuthManager.disableBiometricAuth();
      this.config.biometricRequired = false;
      await this.saveConfig();
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
    }
  }

  async enableScreenProtection(): Promise<boolean> {
    try {
      const success = await screenProtectionManager.enableScreenProtection();
      if (success) {
        this.config.screenProtectionEnabled = true;
        await this.saveConfig();
      }
      return success;
    } catch (error) {
      console.error('Failed to enable screen protection:', error);
      return false;
    }
  }

  async disableScreenProtection(): Promise<boolean> {
    try {
      const success = await screenProtectionManager.disableScreenProtection();
      if (success) {
        this.config.screenProtectionEnabled = false;
        await this.saveConfig();
      }
      return success;
    } catch (error) {
      console.error('Failed to disable screen protection:', error);
      return false;
    }
  }

  async enableThreatDetection(): Promise<void> {
    try {
      await threatDetectionEngine.startMonitoring();
      this.config.threatDetectionEnabled = true;
      await this.saveConfig();
    } catch (error) {
      console.error('Failed to enable threat detection:', error);
    }
  }

  async disableThreatDetection(): Promise<void> {
    try {
      await threatDetectionEngine.stopMonitoring();
      this.config.threatDetectionEnabled = false;
      await this.saveConfig();
    } catch (error) {
      console.error('Failed to disable threat detection:', error);
    }
  }

  // Get comprehensive security status
  async getSecurityStatus(): Promise<{
    biometricEnabled: boolean;
    screenProtectionEnabled: boolean;
    threatDetectionEnabled: boolean;
    securityLevel: 'low' | 'medium' | 'high';
  }> {
    const biometricEnabled = biometricAuthManager.isEnabled();
    const screenStatus = screenProtectionManager.getProtectionStatus();
    const threatStatus = threatDetectionEngine.getSecurityStatus();

    // Calculate security level
    let securityLevel: 'low' | 'medium' | 'high' = 'low';
    const securityFeatures = [
      biometricEnabled,
      screenStatus.isActive,
      threatStatus.monitoring,
    ].filter(Boolean).length;

    if (securityFeatures >= 3) {
      securityLevel = 'high';
    } else if (securityFeatures >= 2) {
      securityLevel = 'medium';
    }

    return {
      biometricEnabled,
      screenProtectionEnabled: screenStatus.isActive,
      threatDetectionEnabled: threatStatus.monitoring,
      securityLevel,
    };
  }
}

// Export singleton instance
export const stealthManager = StealthManager.getInstance();

// Export helper functions for common operations
export const getCurrentMode = () => stealthManager.getCurrentMode();
export const toggleMode = (password?: string) =>
  stealthManager.toggleMode(password);
export const setMode = (mode: AppMode) => stealthManager.setMode(mode);
export const resetToStealth = () => stealthManager.resetToStealth();
export const isStealthMode = () => stealthManager.isStealthMode();
