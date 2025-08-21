import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'stealth' | 'normal';

export interface StealthConfig {
  currentMode: AppMode;
  isFirstLaunch: boolean;
  lastToggleTime: Date;
  toggleCount: number;
  securityEnabled: boolean;
  preferredCoverStory: string;
  emergencyResetEnabled: boolean;
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

      // Toggle the mode
      const newMode: AppMode =
        this.config.currentMode === 'stealth' ? 'normal' : 'stealth';

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
