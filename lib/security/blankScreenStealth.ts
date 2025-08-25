import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { Dimensions, StatusBar, BackHandler, Vibration } from 'react-native';

// Scheduled activation types
export type ScheduledActivation = {
  id: string;
  startTime: Date;
  endTime: Date | null; // null means indefinite until manual deactivation
  repeat: 'once' | 'daily' | 'weekly' | 'monthly' | 'never';
  active: boolean;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc. (for weekly)
  dateOfMonth?: number; // (for monthly)
};

// Fake screen options
export type FakeScreenConfig = {
  enabled: boolean;
  appType: 'browser' | 'notes' | 'calculator' | 'email' | 'custom';
  customAppContent?: string; // JSON string for custom app display
  interactable: boolean; // Whether fake UI elements respond to touches
};

// Access attempts monitoring
export type AccessAttempt = {
  timestamp: Date;
  type: 'failed_unlock' | 'repeated_touches' | 'suspicious_pattern';
  details?: string;
};

export interface BlankScreenConfig {
  isEnabled: boolean;
  activationMethod: 'long_press' | 'gesture' | 'both' | 'scheduled';
  longPressDeactivationDuration: number; // milliseconds
  gestureDeactivationSequence: 'triple_tap' | 'swipe_up' | 'shake' | 'pattern';
  customPattern?: number[][]; // For custom touch pattern (x,y coordinates sequence)
  isCurrentlyActive: boolean;
  lastActivationTime: Date;
  brightnessLevel: number; // 0-1, how dark the screen should be
  showStatusBar: boolean;
  emergencyDeactivationEnabled: boolean;
  
  // Phase 4 additions
  fakeScreenMode: FakeScreenConfig;
  schedules: ScheduledActivation[];
  autoDeactivateAfter: number | null; // milliseconds or null for indefinite
  vibrateOnActivation: boolean;
  accessAttemptLogging: boolean;
  accessAttempts: AccessAttempt[];
  maxAccessAttempts: number;
  lockoutDuration: number; // milliseconds
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
  
  // Phase 4 default configurations
  fakeScreenMode: {
    enabled: false,
    appType: 'browser',
    interactable: true
  },
  schedules: [],
  autoDeactivateAfter: null,
  vibrateOnActivation: true,
  accessAttemptLogging: true,
  accessAttempts: [],
  maxAccessAttempts: 5,
  lockoutDuration: 300000, // 5 minutes
};

export class BlankScreenStealthManager {
  private static instance: BlankScreenStealthManager;
  private config: BlankScreenConfig = DEFAULT_CONFIG;
  private initialized = false;
  private longPressTimer: any = null;
  private gestureSequence: number[] = [];
  private gestureTimeout: any = null;
  private appStateSubscription: any = null;
  private backHandlerSubscription: any = null;
  
  // Phase 4 additions
  private scheduleTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private autoDeactivateTimer: ReturnType<typeof setTimeout> | null = null;
  private patternRecognizer: number[][] = [];
  private patternTimeout: ReturnType<typeof setTimeout> | null = null;
  private lockoutTimer: ReturnType<typeof setTimeout> | null = null;
  private isLockedOut: boolean = false;

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
        const parsedConfig = JSON.parse(storedConfig);
        
        // Process dates from JSON
        const processedConfig = {
          ...parsedConfig,
          lastActivationTime: new Date(parsedConfig.lastActivationTime),
          schedules: (parsedConfig.schedules || []).map((schedule: any) => ({
            ...schedule,
            startTime: new Date(schedule.startTime),
            endTime: schedule.endTime ? new Date(schedule.endTime) : null
          })),
          accessAttempts: (parsedConfig.accessAttempts || []).map((attempt: any) => ({
            ...attempt,
            timestamp: new Date(attempt.timestamp)
          }))
        };
        
        this.config = {
          ...DEFAULT_CONFIG,
          ...processedConfig
        };
      }

      // Set up app state monitoring
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );
      
      // Set up back handler for emergency deactivation
      this.backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
      
      // Initialize scheduled activations
      this.setupScheduledActivations();

      this.initialized = true;
      console.log('BlankScreenStealthManager initialized with Phase 4 features');
    } catch (error) {
      console.error('Failed to initialize BlankScreenStealthManager:', error);
      this.config = DEFAULT_CONFIG;
      this.initialized = true;
    }
  }
  
  private handleBackPress: () => boolean = () => {
    if (this.config.isCurrentlyActive && this.config.emergencyDeactivationEnabled) {
      this.emergencyDeactivate();
      return true; // Prevent default back action
    }
    return false; // Let default back action occur
  };

  private setupScheduledActivations(): void {
    // Clear any existing schedule timers
    this.clearScheduleTimers();
    
    // Set up timers for each scheduled activation
    const now = new Date();
    
    this.config.schedules.forEach(schedule => {
      if (!schedule.active) return;
      
      // Calculate next activation time
      let nextActivation: Date | null = null;
      
      switch (schedule.repeat) {
        case 'once':
          if (schedule.startTime > now) {
            nextActivation = schedule.startTime;
          }
          break;
          
        case 'daily':
          nextActivation = new Date(now);
          nextActivation.setHours(schedule.startTime.getHours());
          nextActivation.setMinutes(schedule.startTime.getMinutes());
          nextActivation.setSeconds(0);
          if (nextActivation < now) {
            nextActivation.setDate(nextActivation.getDate() + 1);
          }
          break;
          
        case 'weekly':
          if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
            // Find the next day of week
            const todayDay = now.getDay();
            const sortedDays = [...schedule.daysOfWeek].sort((a, b) => {
              const diffA = (a - todayDay + 7) % 7;
              const diffB = (b - todayDay + 7) % 7;
              return diffA === 0 ? 7 : diffA - (diffB === 0 ? 7 : diffB);
            });
            
            const nextDay = sortedDays[0];
            const daysUntilNext = (nextDay - todayDay + 7) % 7;
            
            nextActivation = new Date(now);
            nextActivation.setDate(now.getDate() + daysUntilNext);
            nextActivation.setHours(schedule.startTime.getHours());
            nextActivation.setMinutes(schedule.startTime.getMinutes());
            nextActivation.setSeconds(0);
            
            if (daysUntilNext === 0 && nextActivation < now) {
              nextActivation.setDate(nextActivation.getDate() + 7);
            }
          }
          break;
          
        case 'monthly':
          if (schedule.dateOfMonth) {
            nextActivation = new Date(now);
            nextActivation.setDate(Math.min(schedule.dateOfMonth, this.getDaysInMonth(now.getFullYear(), now.getMonth() + 1)));
            nextActivation.setHours(schedule.startTime.getHours());
            nextActivation.setMinutes(schedule.startTime.getMinutes());
            nextActivation.setSeconds(0);
            
            if (nextActivation < now) {
              nextActivation.setMonth(nextActivation.getMonth() + 1);
              nextActivation.setDate(Math.min(schedule.dateOfMonth, this.getDaysInMonth(nextActivation.getFullYear(), nextActivation.getMonth() + 1)));
            }
          }
          break;
      }
      
      if (nextActivation) {
        const timeUntilActivation = nextActivation.getTime() - now.getTime();
        
        if (timeUntilActivation > 0) {
          const timer = setTimeout(() => {
            this.activateBlankScreen(schedule.id);
            
            // If there's an end time, schedule deactivation
            if (schedule.endTime) {
              const endTime = new Date(schedule.endTime);
              const timeUntilDeactivation = endTime.getTime() - new Date().getTime();
              
              if (timeUntilDeactivation > 0) {
                setTimeout(() => {
                  this.deactivateBlankScreen();
                }, timeUntilDeactivation);
              }
            }
            
            // Re-setup schedules for next occurrence
            this.setupScheduledActivations();
          }, timeUntilActivation);
          
          this.scheduleTimers.set(schedule.id, timer);
        }
      }
    });
  }
  
  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }
  
  private clearScheduleTimers(): void {
    this.scheduleTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.scheduleTimers.clear();
  }

  async activateBlankScreen(scheduleId?: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check if the system is in lockout period
    if (this.isLockedOut) {
      console.log('System is locked out due to too many access attempts');
      return false;
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
      
      // Vibrate on activation if enabled
      if (this.config.vibrateOnActivation) {
        Vibration.vibrate([0, 100, 50, 100]); // Pattern: wait, vibrate, wait, vibrate
      }
      
      // Setup auto-deactivation timer if configured
      if (this.config.autoDeactivateAfter) {
        if (this.autoDeactivateTimer) {
          clearTimeout(this.autoDeactivateTimer);
        }
        
        this.autoDeactivateTimer = setTimeout(() => {
          this.deactivateBlankScreen();
        }, this.config.autoDeactivateAfter);
      }

      console.log('Blank screen stealth mode activated' + (scheduleId ? ` by schedule ${scheduleId}` : ''));
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
    
    // Check if the system is in lockout period
    if (this.isLockedOut) {
      console.log('System is locked out due to too many access attempts');
      return false;
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

    if (
      this.config.activationMethod === 'long_press' ||
      this.config.activationMethod === 'both'
    ) {
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

    if (
      this.config.activationMethod === 'gesture' ||
      this.config.activationMethod === 'both'
    ) {
      const now = Date.now();
      this.gestureSequence.push(now);

      // Clear old taps (older than 2 seconds)
      this.gestureSequence = this.gestureSequence.filter(
        (tap) => now - tap < 2000
      );

      // Check for gesture pattern
      if (
        this.config.gestureDeactivationSequence === 'triple_tap' &&
        this.gestureSequence.length >= 3
      ) {
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
        
        // If too many gesture attempts, log it as a suspicious attempt
        if (this.config.accessAttemptLogging && this.gestureSequence.length > 5) {
          this.logAccessAttempt('repeated_touches', 'Multiple taps detected');
        }
      }, 2000);
    }
  }
  
  // New method for custom pattern recognition
  registerPatternPoint(x: number, y: number): void {
    if (!this.config.isCurrentlyActive) return;
    
    if (
      this.config.gestureDeactivationSequence === 'pattern' && 
      this.config.customPattern && 
      this.config.customPattern.length > 0
    ) {
      this.patternRecognizer.push([x, y]);
      
      // Reset pattern timeout if it exists
      if (this.patternTimeout) {
        clearTimeout(this.patternTimeout);
      }
      
      // Check if pattern matches
      if (this.patternRecognizer.length === this.config.customPattern.length) {
        let matches = true;
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        
        // Compare patterns with tolerance for screen positioning
        for (let i = 0; i < this.patternRecognizer.length; i++) {
          const [inputX, inputY] = this.patternRecognizer[i];
          const [patternX, patternY] = this.config.customPattern[i];
          
          // Allow for 10% tolerance in position
          const xTolerance = screenWidth * 0.1;
          const yTolerance = screenHeight * 0.1;
          
          if (
            Math.abs(inputX - patternX) > xTolerance ||
            Math.abs(inputY - patternY) > yTolerance
          ) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          this.deactivateBlankScreen();
        } else if (this.config.accessAttemptLogging) {
          // Log failed pattern attempt
          this.logAccessAttempt('failed_unlock', 'Incorrect pattern entered');
        }
        
        this.patternRecognizer = [];
      }
      
      // Set timeout to clear pattern after 3 seconds of inactivity
      this.patternTimeout = setTimeout(() => {
        this.patternRecognizer = [];
      }, 3000);
    }
  }
  
  // Log access attempts and handle lockout
  private logAccessAttempt(type: 'failed_unlock' | 'repeated_touches' | 'suspicious_pattern', details?: string): void {
    if (!this.config.accessAttemptLogging) return;
    
    const attempt: AccessAttempt = {
      timestamp: new Date(),
      type,
      details
    };
    
    // Add to access attempts log
    this.config.accessAttempts.push(attempt);
    
    // Keep only the most recent attempts (max 100)
    if (this.config.accessAttempts.length > 100) {
      this.config.accessAttempts = this.config.accessAttempts.slice(-100);
    }
    
    // Save the updated config
    this.saveConfig();
    
    // Check for lockout condition
    const recentAttempts = this.config.accessAttempts.filter(
      a => (new Date().getTime() - a.timestamp.getTime()) < 60000 // Last minute
    );
    
    if (recentAttempts.length >= this.config.maxAccessAttempts) {
      this.triggerLockout();
    }
  }
  
  private triggerLockout(): void {
    if (this.isLockedOut) return;
    
    this.isLockedOut = true;
    console.log(`Lockout triggered for ${this.config.lockoutDuration / 1000} seconds due to too many access attempts`);
    
    // Set timer to release lockout
    this.lockoutTimer = setTimeout(() => {
      this.isLockedOut = false;
      this.lockoutTimer = null;
      console.log('Lockout period ended');
    }, this.config.lockoutDuration);
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
    if (this.autoDeactivateTimer) {
      clearTimeout(this.autoDeactivateTimer);
      this.autoDeactivateTimer = null;
    }
    if (this.patternTimeout) {
      clearTimeout(this.patternTimeout);
      this.patternTimeout = null;
    }
    this.gestureSequence = [];
    this.patternRecognizer = [];
  }

  // Configuration methods
  async setActivationMethod(
    method: 'long_press' | 'gesture' | 'both' | 'scheduled'
  ): Promise<void> {
    this.config.activationMethod = method;
    await this.saveConfig();
    
    if (method === 'scheduled') {
      // Re-setup scheduled activations
      this.setupScheduledActivations();
    }
  }

  async setLongPressDuration(duration: number): Promise<void> {
    this.config.longPressDeactivationDuration = Math.max(
      1000,
      Math.min(10000, duration)
    );
    await this.saveConfig();
  }

  async setGestureSequence(
    sequence: 'triple_tap' | 'swipe_up' | 'shake' | 'pattern'
  ): Promise<void> {
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
  
  // Phase 4 configuration methods
  async configureFakeScreen(config: FakeScreenConfig): Promise<void> {
    this.config.fakeScreenMode = { 
      ...this.config.fakeScreenMode,
      ...config
    };
    await this.saveConfig();
  }
  
  async setCustomPattern(pattern: number[][]): Promise<void> {
    this.config.customPattern = pattern;
    await this.saveConfig();
  }
  
  async addScheduledActivation(schedule: Omit<ScheduledActivation, 'id'>): Promise<string> {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSchedule: ScheduledActivation = {
      ...schedule,
      id
    };
    
    this.config.schedules.push(newSchedule);
    await this.saveConfig();
    
    // Re-setup scheduled activations
    this.setupScheduledActivations();
    
    return id;
  }
  
  async updateScheduledActivation(id: string, schedule: Partial<ScheduledActivation>): Promise<boolean> {
    const index = this.config.schedules.findIndex(s => s.id === id);
    
    if (index === -1) {
      return false;
    }
    
    this.config.schedules[index] = {
      ...this.config.schedules[index],
      ...schedule
    };
    
    await this.saveConfig();
    
    // Re-setup scheduled activations
    this.setupScheduledActivations();
    
    return true;
  }
  
  async removeScheduledActivation(id: string): Promise<boolean> {
    const initialLength = this.config.schedules.length;
    this.config.schedules = this.config.schedules.filter(s => s.id !== id);
    
    // Clear the specific timer if it exists
    if (this.scheduleTimers.has(id)) {
      clearTimeout(this.scheduleTimers.get(id)!);
      this.scheduleTimers.delete(id);
    }
    
    if (initialLength !== this.config.schedules.length) {
      await this.saveConfig();
      return true;
    }
    
    return false;
  }
  
  async setAutoDeactivateTime(milliseconds: number | null): Promise<void> {
    this.config.autoDeactivateAfter = milliseconds;
    await this.saveConfig();
  }
  
  async setVibrateOnActivation(enabled: boolean): Promise<void> {
    this.config.vibrateOnActivation = enabled;
    await this.saveConfig();
  }
  
  async configureAccessAttemptLogging(enabled: boolean, maxAttempts?: number, lockoutDuration?: number): Promise<void> {
    this.config.accessAttemptLogging = enabled;
    
    if (maxAttempts !== undefined) {
      this.config.maxAccessAttempts = Math.max(1, maxAttempts);
    }
    
    if (lockoutDuration !== undefined) {
      this.config.lockoutDuration = Math.max(5000, lockoutDuration);
    }
    
    await this.saveConfig();
  }
  
  async clearAccessAttemptLog(): Promise<void> {
    this.config.accessAttempts = [];
    await this.saveConfig();
  }

  // Getters
  isActive(): boolean {
    return this.config.isCurrentlyActive;
  }
  
  isLockedOutStatus(): boolean {
    return this.isLockedOut;
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
  
  getFakeScreenConfig(): FakeScreenConfig {
    return { ...this.config.fakeScreenMode };
  }
  
  getSchedules(): ScheduledActivation[] {
    return [...this.config.schedules];
  }
  
  getAccessAttempts(): AccessAttempt[] {
    return [...this.config.accessAttempts];
  }
  
  getRecentAccessAttempts(minutesAgo: number = 60): AccessAttempt[] {
    const cutoffTime = new Date(Date.now() - (minutesAgo * 60 * 1000));
    return this.config.accessAttempts.filter(attempt => attempt.timestamp >= cutoffTime);
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
    this.clearScheduleTimers();
    
    if (this.autoDeactivateTimer) {
      clearTimeout(this.autoDeactivateTimer);
      this.autoDeactivateTimer = null;
    }
    
    if (this.lockoutTimer) {
      clearTimeout(this.lockoutTimer);
      this.lockoutTimer = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    // Clean up BackHandler subscription
    if (this.backHandlerSubscription) {
      this.backHandlerSubscription.remove();
      this.backHandlerSubscription = null;
    }
  }
}

// Export singleton instance
export const blankScreenStealthManager =
  BlankScreenStealthManager.getInstance();

// Export helper functions (base functionality)
export const activateBlankScreen = () =>
  blankScreenStealthManager.activateBlankScreen();
export const deactivateBlankScreen = () =>
  blankScreenStealthManager.deactivateBlankScreen();
export const isBlankScreenActive = () => blankScreenStealthManager.isActive();
export const emergencyDeactivateBlankScreen = () =>
  blankScreenStealthManager.emergencyDeactivate();
  
// Phase 4 helper functions
export const configureFakeScreenMode = (config: FakeScreenConfig) => 
  blankScreenStealthManager.configureFakeScreen(config);
export const addSchedule = (schedule: Omit<ScheduledActivation, 'id'>) => 
  blankScreenStealthManager.addScheduledActivation(schedule);
export const updateSchedule = (id: string, schedule: Partial<ScheduledActivation>) => 
  blankScreenStealthManager.updateScheduledActivation(id, schedule);
export const removeSchedule = (id: string) => 
  blankScreenStealthManager.removeScheduledActivation(id);
export const getSchedules = () => 
  blankScreenStealthManager.getSchedules();
export const setCustomUnlockPattern = (pattern: number[][]) => 
  blankScreenStealthManager.setCustomPattern(pattern);
export const registerPatternPoint = (x: number, y: number) => 
  blankScreenStealthManager.registerPatternPoint(x, y);
export const getAccessAttemptLog = () => 
  blankScreenStealthManager.getAccessAttempts();
export const clearAccessAttemptLog = () => 
  blankScreenStealthManager.clearAccessAttemptLog();
export const isSystemLockedOut = () => 
  blankScreenStealthManager.isLockedOutStatus();
