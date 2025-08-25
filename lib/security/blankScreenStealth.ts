import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { Dimensions, StatusBar } from 'react-native';

export interface BlankScreenConfig {
  isEnabled: boolean;
  activationMethod: 'long_press' | 'gesture' | 'both';
  longPressDeactivationDuration: number; // milliseconds
  gestureDeactivationSequence: 'triple_tap' | 'swipe_up' | 'shake';
  isCurrentlyActive: boolean;
  lastActivationTime: Date;
  brightnessLevel: number; // 0-1, how dark the screen should be
  showStatusBar: boolean;
  emergencyDeactivationEnabled: boolean;
}

const BLANK_SCREEN_CONFIG_KEY = 'desist_blank_screen_config';

const DEFAULT_CONFIG: BlankScreenConfig = {
  isEnabled: true,
  activationMethod: 'both',
  longPressDeactivationDuration: 3000, // 3 seconds
  gestureDeactivationSequence: 'triple_tap',
  isCurrentlyActive: false,
  lastActivationTime: new Date(0),
  brightnessLevel: 0, // Completely black
  showStatusBar: false,
  emergencyDeactivationEnabled: true,
};

export class BlankScreenStealthManager {
  private static instance: BlankScreenStealthManager;
  private config: BlankScreenConfig = DEFAULT_CONFIG;
  private initialized = false;
  private longPressTimer: any = null;
  private gestureSequence: number[] = [];
  private gestureTimeout: any = null;
  private appStateSubscription: any = null;

  static getInstance(): BlankScreenStealthManager {
    if (!BlankScreenStealthManager.instance) {
      BlankScreenStealthManager.instance = new BlankScreenStealthManager();
    }
    return BlankScreenStealthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedConfig = await AsyncStorage.getItem(BLANK_SCREEN_CONFIG_KEY);
      if (storedConfig) {
        this.config = {
          ...DEFAULT_CONFIG,
          ...JSON.parse(storedConfig),
          lastActivationTime: new Date(JSON.parse(storedConfig).lastActivationTime),
        };
      }

      // Set up app state monitoring
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      this.initialized = true;
      console.log('BlankScreenStealthManager initialized');
    } catch (error) {
      console.error('Failed to initialize BlankScreenStealthManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }

  async activateBlankScreen(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.config = {
        ...this.config,
        isCurrentlyActive: true,
        lastActivationTime: new Date(),
      };

      await this.saveConfig();
      
      // Hide status bar for complete blank effect
      if (!this.config.showStatusBar) {
        StatusBar.setHidden(true, 'fade');
      }

      console.log('Blank screen stealth mode activated');
      return true;
    } catch (error) {
      console.error('Failed to activate blank screen:', error);
      return false;
    }
  }

  async deactivateBlankScreen(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      this.config = {
        ...this.config,
        isCurrentlyActive: false,
      };

      await this.saveConfig();
      
      // Restore status bar
      StatusBar.setHidden(false, 'fade');

      // Clear any active timers
      this.clearTimers();

      console.log('Blank screen stealth mode deactivated');
      return true;
    } catch (error) {
      console.error('Failed to deactivate blank screen:', error);
      return false;
    }
  }

  // Handle long press deactivation
  onLongPressStart(): void {
    if (!this.config.isCurrentlyActive) return;
    
    if (this.config.activationMethod === 'long_press' || this.config.activationMethod === 'both') {
      this.longPressTimer = setTimeout(() => {
        this.deactivateBlankScreen();
      }, this.config.longPressDeactivationDuration);
    }
  }

  onLongPressEnd(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // Handle gesture deactivation
  registerGestureTap(): void {
    if (!this.config.isCurrentlyActive) return;

    if (this.config.activationMethod === 'gesture' || this.config.activationMethod === 'both') {
      const now = Date.now();
      this.gestureSequence.push(now);

      // Clear old taps (older than 2 seconds)
      this.gestureSequence = this.gestureSequence.filter(
        (tap) => now - tap < 2000
      );

      // Check for gesture pattern
      if (this.config.gestureDeactivationSequence === 'triple_tap' && this.gestureSequence.length >= 3) {
        this.deactivateBlankScreen();
        this.gestureSequence = [];
        return;
      }

      // Clear timeout and set new one
      if (this.gestureTimeout) {
        clearTimeout(this.gestureTimeout);
      }

      this.gestureTimeout = setTimeout(() => {
        this.gestureSequence = [];
      }, 2000);
    }
  }

  // Handle swipe up gesture
  onSwipeUp(): void {
    if (!this.config.isCurrentlyActive) return;

    if (this.config.gestureDeactivationSequence === 'swipe_up') {
      this.deactivateBlankScreen();
    }
  }

  // Handle shake gesture
  onShake(): void {
    if (!this.config.isCurrentlyActive) return;

    if (this.config.gestureDeactivationSequence === 'shake') {
      this.deactivateBlankScreen();
    }
  }

  // Emergency deactivation (for safety)
  async emergencyDeactivate(): Promise<void> {
    if (!this.config.emergencyDeactivationEnabled) return;

    try {
      await this.deactivateBlankScreen();
      console.log('Emergency blank screen deactivation completed');
    } catch (error) {
      console.error('Failed to emergency deactivate blank screen:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    // Deactivate blank screen if app goes to background for safety
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (this.config.isCurrentlyActive) {
        this.deactivateBlankScreen();
      }
    }
  }

  private clearTimers(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.gestureTimeout) {
      clearTimeout(this.gestureTimeout);
      this.gestureTimeout = null;
    }
    this.gestureSequence = [];
  }

  // Configuration methods
  async setActivationMethod(method: 'long_press' | 'gesture' | 'both'): Promise<void> {
    this.config.activationMethod = method;
    await this.saveConfig();
  }

  async setLongPressDuration(duration: number): Promise<void> {
    this.config.longPressDeactivationDuration = Math.max(1000, Math.min(10000, duration));
    await this.saveConfig();
  }

  async setGestureSequence(sequence: 'triple_tap' | 'swipe_up' | 'shake'): Promise<void> {
    this.config.gestureDeactivationSequence = sequence;
    await this.saveConfig();
  }

  async setBrightnessLevel(level: number): Promise<void> {
    this.config.brightnessLevel = Math.max(0, Math.min(1, level));
    await this.saveConfig();
  }

  async enableStatusBarInBlankMode(enabled: boolean): Promise<void> {
    this.config.showStatusBar = enabled;
    await this.saveConfig();
  }

  // Getters
  isActive(): boolean {
    return this.config.isCurrentlyActive;
  }

  getConfig(): BlankScreenConfig {
    return { ...this.config };
  }

  getBrightnessLevel(): number {
    return this.config.brightnessLevel;
  }

  getActivationMethod(): string {
    return this.config.activationMethod;
  }

  getGestureSequence(): string {
    return this.config.gestureDeactivationSequence;
  }

  getLongPressDuration(): number {
    return this.config.longPressDeactivationDuration;
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        BLANK_SCREEN_CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Failed to save blank screen config:', error);
      throw error;
    }
  }

  // Clean up subscriptions
  destroy(): void {
    this.clearTimers();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const blankScreenStealthManager = BlankScreenStealthManager.getInstance();

// Export helper functions
export const activateBlankScreen = () => blankScreenStealthManager.activateBlankScreen();
export const deactivateBlankScreen = () => blankScreenStealthManager.deactivateBlankScreen();
export const isBlankScreenActive = () => blankScreenStealthManager.isActive();
export const emergencyDeactivateBlankScreen = () => blankScreenStealthManager.emergencyDeactivate();
