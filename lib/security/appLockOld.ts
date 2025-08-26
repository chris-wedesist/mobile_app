import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { CryptoManager } from './cryptoManager';
import { biometricAuthManager } from './biometricAuth';
import AmplitudeSecurityAnalytics, { trackScreenView, trackUserInteraction } from '../analytics/amplitudeConfig';

export type LockReason = 'background' | 'timeout' | 'manual' | 'security_threat' | 'failed_authentication';
export type UnlockMethod = 'biometric' | 'pin' | 'emergency';

export interface AppLockConfig {
  enabled: boolean;
  lockOnBackground: boolean;
  backgroundLockDelay: number; // milliseconds
  sessionTimeout: number; // milliseconds
  maxFailedAttempts: number;
  lockoutDuration: number; // milliseconds after max failed attempts
  requireBiometricUnlock: boolean;
  allowPinFallback: boolean;
  emergencyUnlockEnabled: boolean;
}

export interface LockState {
  isLocked: boolean;
  lockReason?: LockReason;
  lockedAt?: Date;
  failedAttempts: number;
  isLockedOut: boolean;
  lockoutExpiresAt?: Date;
  lastSuccessfulUnlock?: Date;
  sessionExpiresAt?: Date;
}

// Constants for time calculations
const SECONDS_TO_MS = 1000;
const MINUTES_TO_SECONDS = 60;
const BACKGROUND_LOCK_DELAY_SECONDS = 5;
const SESSION_TIMEOUT_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

const DEFAULT_CONFIG: AppLockConfig = {
  enabled: true,
  lockOnBackground: true,
  backgroundLockDelay: BACKGROUND_LOCK_DELAY_SECONDS * SECONDS_TO_MS,
  sessionTimeout: SESSION_TIMEOUT_MINUTES * MINUTES_TO_SECONDS * SECONDS_TO_MS,
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
  lockoutDuration: LOCKOUT_DURATION_MINUTES * MINUTES_TO_SECONDS * SECONDS_TO_MS,
  requireBiometricUnlock: true,
  allowPinFallback: true,
  emergencyUnlockEnabled: true,
};

const DEFAULT_LOCK_STATE: LockState = {
  isLocked: false,
  failedAttempts: 0,
  isLockedOut: false,
};

export class AppLockManager {
  private static instance: AppLockManager;
  private config: AppLockConfig = DEFAULT_CONFIG;
  private lockState: LockState = DEFAULT_LOCK_STATE;
  private cryptoManager: CryptoManager;
  private analytics: AmplitudeSecurityAnalytics;
  private appStateSubscription: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  private sessionTimer: NodeJS.Timeout | null = null;
  private backgroundTimer: NodeJS.Timeout | null = null;
  private lockStateCallbacks: Array<(_lockState: LockState) => void> = [];
  private initialized = false;

  constructor() {
    this.cryptoManager = CryptoManager.getInstance();
    this.analytics = AmplitudeSecurityAnalytics.getInstance();
  }

  static getInstance(): AppLockManager {
    if (!AppLockManager.instance) {
      AppLockManager.instance = new AppLockManager();
    }
    return AppLockManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize crypto manager first
      await this.cryptoManager.initialize();
      
      // Track app lock initialization
      trackScreenView('app_lock_manager_init', {
        timestamp: new Date().toISOString(),
        session_id: Date.now().toString(),
      });
      
      // Load saved configuration and state
      await this.loadConfig();
      await this.loadLockState();
      
      // Set up app state monitoring if enabled
      if (this.config.enabled) {
        this.setupAppStateMonitoring();
        this.startSessionTimer();
      }
      
      // Track successful initialization
      await this.analytics.trackSecurityEvent('app_lock_initialized', {
        eventType: 'auth_attempt',
        success: true,
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize AppLockManager:', error);
      
      // Track initialization failure
      await this.analytics.trackSecurityEvent('app_lock_init_failed', {
        eventType: 'auth_attempt',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });
      
      this.initialized = true; // Continue with defaults
    }
  }

  /**
   * Lock the app with specified reason
   */
  async lockApp(reason: LockReason = 'manual'): Promise<void> {
    if (this.lockState.isLocked) return;

    try {
      console.log(`🔒 Locking app due to: ${reason}`);
      
      const lockTime = new Date();
      this.lockState = {
        ...this.lockState,
        isLocked: true,
        lockReason: reason,
        lockedAt: lockTime,
      };
      
      // Clear session timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }
      
      // Save lock state
      await this.saveLockState();
      
      // Track lock event
      await this.analytics.trackSecurityEvent('app_locked', {
        eventType: 'app_lock',
        lockReason: reason,
        timestamp: lockTime.toISOString(),
        success: true,
      });
      
      trackUserInteraction('app_lock_activated', {
        lock_reason: reason,
        timestamp: lockTime.toISOString(),
      });
      
      // Notify callbacks
      this.notifyLockStateChange();
      
      console.log('✅ App locked successfully');
    } catch (error) {
      console.error('❌ Failed to lock app:', error);
      
      await this.analytics.trackSecurityEvent('app_lock_failed', {
        eventType: 'app_lock',
        success: false,
        lockReason: reason,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  /**
   * Attempt to unlock the app
   */
  async unlockApp(method: UnlockMethod, credentials?: string): Promise<{
    success: boolean;
    error: string;
    requiresAuth?: boolean;
  }> {
    if (!this.lockState.isLocked) {
      return { success: true, error: "" };
    }

    try {
      console.log(`🔓 Attempting to unlock app with method: ${method}`);
      
      // Check if in lockout period
      if (this.lockState.isLockedOut) {
        const now = new Date();
        if (this.lockState.lockoutExpiresAt && now < this.lockState.lockoutExpiresAt) {
          const remainingTime = Math.ceil((this.lockState.lockoutExpiresAt.getTime() - now.getTime()) / 1000);
          return {
            success: false,
            error: `Locked out. Try again in ${remainingTime} seconds.`,
          };
        } else {
          // Lockout period expired, reset
          this.lockState.isLockedOut = false;
          this.lockState.lockoutExpiresAt = undefined;
          this.lockState.failedAttempts = 0;
        }
      }
      
      let authResult = { success: false, error: 'Unknown authentication method' };
      
      switch (method) {
        case 'biometric':
          authResult = await this.authenticateWithBiometric();
          break;
        case 'pin':
          if (!credentials) {
            return { success: false, requiresAuth: true, error: 'PIN required' };
          }
          authResult = await this.authenticateWithPin(credentials);
          break;
        case 'emergency':
          authResult = await this.emergencyUnlock();
          break;
      }
      
      if (authResult.success) {
        // Successful unlock
        const unlockTime = new Date();
        this.lockState = {
          ...this.lockState,
          isLocked: false,
          lockReason: undefined,
          lockedAt: undefined,
          failedAttempts: 0,
          isLockedOut: false,
          lockoutExpiresAt: undefined,
          lastSuccessfulUnlock: unlockTime,
          sessionExpiresAt: new Date(unlockTime.getTime() + this.config.sessionTimeout),
        };
        
        await this.saveLockState();
        
        // Restart session timer
        this.startSessionTimer();
        
        // Track successful unlock
        await this.analytics.trackSecurityEvent('app_unlocked', {
          eventType: 'app_lock',
          unlockMethod: method,
          timestamp: unlockTime.toISOString(),
          success: true,
        });
        
        trackUserInteraction('app_unlock_successful', {
          unlock_method: method,
          timestamp: unlockTime.toISOString(),
        });
        
        this.notifyLockStateChange();
        console.log('✅ App unlocked successfully');
        return { success: true, error: "" };
      } else {
        // Failed unlock attempt
        this.lockState.failedAttempts++;
        
        // Check if should enter lockout
        if (this.lockState.failedAttempts >= this.config.maxFailedAttempts) {
          this.lockState.isLockedOut = true;
          this.lockState.lockoutExpiresAt = new Date(Date.now() + this.config.lockoutDuration);
          
          // Track lockout event
          await this.analytics.trackSecurityEvent('app_lockout_triggered', {
            eventType: 'security_threat',
            failedAttempts: this.lockState.failedAttempts,
            lockoutDuration: this.config.lockoutDuration,
            success: true,
          });
        }
        
        await this.saveLockState();
        
        // Track failed unlock
        await this.analytics.trackSecurityEvent('app_unlock_failed', {
          eventType: 'app_lock',
          unlockMethod: method,
          failedAttempts: this.lockState.failedAttempts,
          success: false,
        });
        
        this.notifyLockStateChange();
        return { success: false, error: authResult.error };
      }
    } catch (error) {
      console.error('❌ Failed to unlock app:', error);
      
      await this.analytics.trackSecurityEvent('app_unlock_error', {
        eventType: 'app_lock',
        success: false,
        errorCode: error instanceof Error ? error.message : 'unknown_error',
      });
      
      return { success: false, error: 'Unlock failed due to system error' };
    }
  }

  /**
   * Authenticate using biometric
   */
  private async authenticateWithBiometric(): Promise<{ success: boolean; error: string }> {
    try {
      if (!this.config.requireBiometricUnlock) {
        return { success: false, error: 'Biometric unlock not enabled' };
      }
      
      const result = await biometricAuthManager.authenticateWithBiometric('Unlock DESIST');
      
      if (result.success) {
        return { success: true, error: "" };
      } else {
        return { success: false, error: result.error || 'Biometric authentication failed' };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Biometric system error' };
    }
  }

  /**
   * Authenticate using PIN
   */
  private async authenticateWithPin(pin: string): Promise<{ success: boolean; error: string }> {
    try {
      if (!this.config.allowPinFallback) {
        return { success: false, error: 'PIN unlock not enabled' };
      }
      
      // Use crypto manager to validate PIN
      const pinHash = await this.cryptoManager.generateSecureHash(pin + 'DESIST_APP_LOCK');
      
      // In a real implementation, you'd compare against stored PIN hash
      // For now, we'll use a simple validation (this should be enhanced)
      const storedPinHash = await this.getStoredPinHash();
      
      if (storedPinHash && pinHash === storedPinHash) {
        return { success: true, error: "" };
      } else {
        return { success: false, error: 'Invalid PIN' };
      }
    } catch (error) {
      console.error('PIN authentication error:', error);
      return { success: false, error: 'PIN validation system error' };
    }
  }

  /**
   * Emergency unlock (should be used sparingly)
   */
  private async emergencyUnlock(): Promise<{ success: boolean; error: string }> {
    if (!this.config.emergencyUnlockEnabled) {
      return { success: false, error: 'Emergency unlock not enabled' };
    }
    
    // Log emergency unlock as high-priority security event
    await this.analytics.trackSecurityEvent('emergency_unlock_used', {
      eventType: 'security_event',
      severity: 'high',
      timestamp: new Date().toISOString(),
      success: true,
    });
    
    return { success: true, error: "" };
  }

  /**
   * Set up app state monitoring for background locking
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log(`📱 App state changed to: ${nextAppState}`);
    
    if (nextAppState === 'background' && this.config.lockOnBackground) {
      // Set timer to lock app after delay
      this.backgroundTimer = setTimeout(() => {
        this.lockApp('background');
      }, this.config.backgroundLockDelay);
    } else if (nextAppState === 'active') {
      // Clear background timer if returning to foreground
      if (this.backgroundTimer) {
        clearTimeout(this.backgroundTimer);
        this.backgroundTimer = null;
      }
    }
  }

  /**
   * Start session timeout timer
   */
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    
    this.sessionTimer = setTimeout(() => {
      this.lockApp('timeout');
    }, this.config.sessionTimeout);
  }

  /**
   * Register callback for lock state changes
   */
  onLockStateChange(callback: (state: LockState) => void): void {
    this.lockStateCallbacks.push(callback);
  }

  /**
   * Remove lock state change callback
   */
  removeLockStateCallback(callback: (state: LockState) => void): void {
    const index = this.lockStateCallbacks.indexOf(callback);
    if (index > -1) {
      this.lockStateCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify all callbacks of lock state change
   */
  private notifyLockStateChange(): void {
    this.lockStateCallbacks.forEach(callback => {
      try {
        callback(this.lockState);
      } catch (error) {
        console.error('Lock state callback error:', error);
      }
    });
  }

  /**
   * Get current lock state
   */
  getLockState(): LockState {
    return { ...this.lockState };
  }

  /**
   * Get current configuration
   */
  getConfig(): AppLockConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<AppLockConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    
    // Restart monitoring if settings changed
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.setupAppStateMonitoring();
        this.startSessionTimer();
      } else {
        this.cleanup();
      }
    }
  }

  /**
   * Set PIN for fallback authentication
   */
  async setPin(pin: string): Promise<boolean> {
    try {
      const pinHash = await this.cryptoManager.generateSecureHash(pin + 'DESIST_APP_LOCK');
      // Store PIN hash securely (implementation depends on secure storage solution)
      await this.storePinHash(pinHash);
      return true;
    } catch (error) {
      console.error('Failed to set PIN:', error);
      return false;
    }
  }

  /**
   * Check if app should be locked on startup
   */
  async shouldLockOnStartup(): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    // Check if session has expired
    if (this.lockState.sessionExpiresAt) {
      const now = new Date();
      if (now > this.lockState.sessionExpiresAt) {
        await this.lockApp('timeout');
        return true;
      }
    }
    
    return this.lockState.isLocked;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    
    console.log('🧹 AppLockManager cleaned up');
  }

  // Private helper methods for storage (to be implemented with secure storage)
  private async loadConfig(): Promise<void> {
    // Load from secure storage - placeholder implementation
    console.log('📥 Loading app lock configuration...');
  }

  private async saveConfig(): Promise<void> {
    // Save to secure storage - placeholder implementation
    console.log('💾 Saving app lock configuration...');
  }

  private async loadLockState(): Promise<void> {
    // Load from secure storage - placeholder implementation
    console.log('📥 Loading app lock state...');
  }

  private async saveLockState(): Promise<void> {
    // Save to secure storage - placeholder implementation
    console.log('💾 Saving app lock state...');
  }

  private async getStoredPinHash(): Promise<string | null> {
    // Get from secure storage - placeholder implementation
    return null;
  }

  private async storePinHash(hash: string): Promise<void> {
    // Store in secure storage - placeholder implementation
    console.log('💾 Storing PIN hash...');
  }
}

// Export singleton instance
export const appLockManager = AppLockManager.getInstance();

// Export helper functions
export const lockApp = (reason?: LockReason) => appLockManager.lockApp(reason);
export const unlockApp = (method: UnlockMethod, credentials?: string) => 
  appLockManager.unlockApp(method, credentials);
export const getLockState = () => appLockManager.getLockState();
export const isAppLocked = () => appLockManager.getLockState().isLocked;
export const onLockStateChange = (callback: (state: LockState) => void) => 
  appLockManager.onLockStateChange(callback);
