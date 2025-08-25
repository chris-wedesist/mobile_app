import {
  preventScreenCaptureAsync,
  allowScreenCaptureAsync,
} from 'expo-screen-capture';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScreenProtectionConfig {
  preventScreenshots: boolean;
  preventRecording: boolean;
  blurOnBackground: boolean;
  showPrivacyScreen: boolean;
  isProtectionActive: boolean;
}

const SCREEN_PROTECTION_CONFIG_KEY = 'desist_screen_protection_config';

const DEFAULT_CONFIG: ScreenProtectionConfig = {
  preventScreenshots: true,
  preventRecording: true,
  blurOnBackground: true,
  showPrivacyScreen: true,
  isProtectionActive: false,
};

export class ScreenProtectionManager {
  private static instance: ScreenProtectionManager;
  private config: ScreenProtectionConfig = DEFAULT_CONFIG;
  private initialized = false;
  private appStateSubscription: any = null;
  private isInBackground = false;

  static getInstance(): ScreenProtectionManager {
    if (!ScreenProtectionManager.instance) {
      ScreenProtectionManager.instance = new ScreenProtectionManager();
    }
    return ScreenProtectionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(
        SCREEN_PROTECTION_CONFIG_KEY
      );
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
        };
      }

      // Set up app state monitoring for background protection
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      this.initialized = true;
      console.log('ScreenProtectionManager initialized');
    } catch (error) {
      console.error('Failed to initialize ScreenProtectionManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  async enableScreenProtection(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Enable screenshot prevention
      if (this.config.preventScreenshots || this.config.preventRecording) {
        await preventScreenCaptureAsync();
        console.log('Screen capture prevention enabled');
      }

      this.config.isProtectionActive = true;
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('Failed to enable screen protection:', error);
      return false;
    }
  }

  async disableScreenProtection(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Disable screenshot prevention
      await allowScreenCaptureAsync();
      console.log('Screen capture prevention disabled');

      this.config.isProtectionActive = false;
      await this.saveConfig();
      return true;
    } catch (error) {
      console.error('Failed to disable screen protection:', error);
      return false;
    }
  }

  async setProtectionLevel(
    config: Partial<ScreenProtectionConfig>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const oldPreventCapture =
      this.config.preventScreenshots || this.config.preventRecording;

    this.config = {
      ...this.config,
      ...config,
    };

    const newPreventCapture =
      this.config.preventScreenshots || this.config.preventRecording;

    // Update screen capture prevention if the setting changed
    if (oldPreventCapture !== newPreventCapture) {
      try {
        if (newPreventCapture && this.config.isProtectionActive) {
          await preventScreenCaptureAsync();
        } else {
          await allowScreenCaptureAsync();
        }
      } catch (error) {
        console.error('Failed to update screen capture prevention:', error);
      }
    }

    await this.saveConfig();
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const isGoingToBackground =
      nextAppState === 'background' || nextAppState === 'inactive';
    const isComingToForeground =
      nextAppState === 'active' && this.isInBackground;

    if (isGoingToBackground && !this.isInBackground) {
      this.handleAppGoingToBackground();
    } else if (isComingToForeground) {
      this.handleAppComingToForeground();
    }

    this.isInBackground = isGoingToBackground;
  }

  private handleAppGoingToBackground(): void {
    if (this.config.blurOnBackground || this.config.showPrivacyScreen) {
      // The privacy screen will be handled by the PrivacyGuard component
      console.log('App going to background - privacy protection activated');
    }
  }

  private handleAppComingToForeground(): void {
    console.log('App coming to foreground - privacy protection deactivated');
  }

  async checkScreenRecordingStatus(): Promise<{
    isRecording: boolean;
    canDetect: boolean;
  }> {
    // Note: Expo doesn't provide direct screen recording detection
    // This would need native implementation for full detection
    // For now, we return a placeholder response
    return {
      isRecording: false,
      canDetect: false,
    };
  }

  getConfig(): ScreenProtectionConfig {
    return { ...this.config };
  }

  isProtectionActive(): boolean {
    return this.config.isProtectionActive;
  }

  shouldShowPrivacyScreen(): boolean {
    return this.config.showPrivacyScreen && this.isInBackground;
  }

  shouldBlurContent(): boolean {
    return this.config.blurOnBackground && this.isInBackground;
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SCREEN_PROTECTION_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save screen protection config:', error);
      throw error;
    }
  }

  // Clean up subscriptions
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // Emergency disable - for emergency situations where screen protection might interfere
  async emergencyDisable(): Promise<void> {
    try {
      await allowScreenCaptureAsync();
      this.config.isProtectionActive = false;
      await this.saveConfig();
      console.log('Emergency screen protection disable completed');
    } catch (error) {
      console.error('Failed to emergency disable screen protection:', error);
    }
  }

  // Check if screenshots are being attempted (placeholder for future native implementation)
  async detectScreenshotAttempt(): Promise<boolean> {
    // This would need native implementation to detect screenshot gestures
    // For now, return false as a placeholder
    return false;
  }

  // Get protection status summary
  getProtectionStatus(): {
    isActive: boolean;
    screenshotsBlocked: boolean;
    recordingBlocked: boolean;
    backgroundProtected: boolean;
  } {
    return {
      isActive: this.config.isProtectionActive,
      screenshotsBlocked:
        this.config.preventScreenshots && this.config.isProtectionActive,
      recordingBlocked:
        this.config.preventRecording && this.config.isProtectionActive,
      backgroundProtected:
        this.config.blurOnBackground || this.config.showPrivacyScreen,
    };
  }
}

// Export singleton instance
export const screenProtectionManager = ScreenProtectionManager.getInstance();

// Export helper functions
export const enableScreenProtection = () =>
  screenProtectionManager.enableScreenProtection();
export const disableScreenProtection = () =>
  screenProtectionManager.disableScreenProtection();
export const setProtectionLevel = (config: Partial<ScreenProtectionConfig>) =>
  screenProtectionManager.setProtectionLevel(config);
export const getProtectionStatus = () =>
  screenProtectionManager.getProtectionStatus();
