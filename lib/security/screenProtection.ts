import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Phase 4: Enhanced screen protection options
export interface PrivacyFilter {
  id: string;
  name: string;
  opacity: number; // 0-1, how opaque the filter should be
  color: string; // CSS color string
  blurRadius: number; // blur intensity
  enabled: boolean;
}

export interface ScreenProtectionConfig {
  preventScreenshots: boolean;
  preventRecording: boolean;
  blurOnBackground: boolean;
  showPrivacyScreen: boolean;
  isProtectionActive: boolean;

  // Phase 4 additions
  dynamicPrivacyOverlay: boolean;
  recordingDetection: boolean;
  privacyFilters: PrivacyFilter[];
  activeFilterId: string | null;
  autoEnableThreshold: number; // number of suspicious events before auto-enabling
  sensitivityLevel: 'low' | 'medium' | 'high';
  notifyOnDetection: boolean;
}

const SCREEN_PROTECTION_CONFIG_KEY = 'desist_screen_protection_config';

const DEFAULT_CONFIG: ScreenProtectionConfig = {
  preventScreenshots: true,
  preventRecording: true,
  blurOnBackground: true,
  showPrivacyScreen: true,
  isProtectionActive: false,

  // Phase 4 default configurations
  dynamicPrivacyOverlay: false,
  recordingDetection: true,
  privacyFilters: [
    {
      id: 'default',
      name: 'Standard Privacy',
      opacity: 0.7,
      color: '#000000',
      blurRadius: 10,
      enabled: true,
    },
    {
      id: 'maximum',
      name: 'Maximum Privacy',
      opacity: 1.0,
      color: '#000000',
      blurRadius: 20,
      enabled: true,
    },
    {
      id: 'subtle',
      name: 'Subtle Privacy',
      opacity: 0.3,
      color: '#222222',
      blurRadius: 5,
      enabled: true,
    },
  ],
  activeFilterId: 'default',
  autoEnableThreshold: 3,
  sensitivityLevel: 'medium',
  notifyOnDetection: true,
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

  // Phase 4: Enhanced methods

  // Dynamic privacy overlay methods
  async enableDynamicPrivacyOverlay(enabled: boolean): Promise<void> {
    this.config.dynamicPrivacyOverlay = enabled;
    await this.saveConfig();
  }

  // Screen recording detection
  async enableRecordingDetection(enabled: boolean): Promise<void> {
    this.config.recordingDetection = enabled;
    await this.saveConfig();

    if (enabled) {
      // In a real app, this would initiate recording detection mechanisms
      console.log('Screen recording detection enabled');
    }
  }

  // Privacy filter management
  async addPrivacyFilter(
    name: string,
    opacity: number,
    color: string,
    blurRadius: number
  ): Promise<string> {
    const id = `filter_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const newFilter: PrivacyFilter = {
      id,
      name,
      opacity: Math.max(0, Math.min(1, opacity)), // Ensure between 0-1
      color,
      blurRadius: Math.max(0, blurRadius),
      enabled: true,
    };

    this.config.privacyFilters.push(newFilter);
    await this.saveConfig();

    return id;
  }

  async updatePrivacyFilter(
    id: string,
    updates: Partial<Omit<PrivacyFilter, 'id'>>
  ): Promise<boolean> {
    const filterIndex = this.config.privacyFilters.findIndex(
      (f) => f.id === id
    );

    if (filterIndex === -1) {
      return false;
    }

    this.config.privacyFilters[filterIndex] = {
      ...this.config.privacyFilters[filterIndex],
      ...updates,
    };

    await this.saveConfig();
    return true;
  }

  async removePrivacyFilter(id: string): Promise<boolean> {
    // Don't allow removing the default filter
    if (id === 'default' || id === 'maximum' || id === 'subtle') {
      return false;
    }

    const initialLength = this.config.privacyFilters.length;
    this.config.privacyFilters = this.config.privacyFilters.filter(
      (f) => f.id !== id
    );

    // If we removed the active filter, switch to default
    if (this.config.activeFilterId === id) {
      this.config.activeFilterId = 'default';
    }

    if (initialLength !== this.config.privacyFilters.length) {
      await this.saveConfig();
      return true;
    }

    return false;
  }

  async setActivePrivacyFilter(id: string): Promise<boolean> {
    const filter = this.config.privacyFilters.find((f) => f.id === id);

    if (!filter || !filter.enabled) {
      return false;
    }

    this.config.activeFilterId = id;
    await this.saveConfig();

    return true;
  }

  // Sensitivity configuration
  async setSensitivityLevel(level: 'low' | 'medium' | 'high'): Promise<void> {
    this.config.sensitivityLevel = level;

    // Adjust auto-enable threshold based on sensitivity
    switch (level) {
      case 'low':
        this.config.autoEnableThreshold = 5;
        break;
      case 'medium':
        this.config.autoEnableThreshold = 3;
        break;
      case 'high':
        this.config.autoEnableThreshold = 1;
        break;
    }

    await this.saveConfig();
  }

  async setAutoEnableThreshold(threshold: number): Promise<void> {
    this.config.autoEnableThreshold = Math.max(1, threshold);
    await this.saveConfig();
  }

  async enableNotifications(enabled: boolean): Promise<void> {
    this.config.notifyOnDetection = enabled;
    await this.saveConfig();
  }

  // Helper method to handle screen recording detection
  handleRecordingDetection(): void {
    if (!this.config.recordingDetection) return;

    // In a real app, this would implement complex detection logic
    console.log('Potential screen recording detected');

    // Auto-enable protection if configured
    if (this.config.autoEnableThreshold <= 1) {
      this.enableScreenProtection();
    }

    // Notify if enabled
    if (this.config.notifyOnDetection) {
      console.log('Screen recording notification would appear here');
    }
  }

  // Get the current active privacy filter
  getActivePrivacyFilter(): PrivacyFilter | null {
    if (!this.config.activeFilterId) return null;
    return (
      this.config.privacyFilters.find(
        (f) => f.id === this.config.activeFilterId
      ) || null
    );
  }

  // Get all available privacy filters
  getPrivacyFilters(): PrivacyFilter[] {
    return [...this.config.privacyFilters];
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

// Phase 4 helper exports
export const enableDynamicPrivacyOverlay = (enabled: boolean) =>
  screenProtectionManager.enableDynamicPrivacyOverlay(enabled);
export const enableRecordingDetection = (enabled: boolean) =>
  screenProtectionManager.enableRecordingDetection(enabled);
export const addPrivacyFilter = (
  name: string,
  opacity: number,
  color: string,
  blurRadius: number
) => screenProtectionManager.addPrivacyFilter(name, opacity, color, blurRadius);
export const updatePrivacyFilter = (
  id: string,
  updates: Partial<Omit<PrivacyFilter, 'id'>>
) => screenProtectionManager.updatePrivacyFilter(id, updates);
export const removePrivacyFilter = (id: string) =>
  screenProtectionManager.removePrivacyFilter(id);
export const setActivePrivacyFilter = (id: string) =>
  screenProtectionManager.setActivePrivacyFilter(id);
export const setSensitivityLevel = (level: 'low' | 'medium' | 'high') =>
  screenProtectionManager.setSensitivityLevel(level);
export const getPrivacyFilters = () =>
  screenProtectionManager.getPrivacyFilters();
export const getActivePrivacyFilter = () =>
  screenProtectionManager.getActivePrivacyFilter();
