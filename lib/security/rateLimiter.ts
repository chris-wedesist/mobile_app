import AsyncStorage from '@react-native-async-storage/async-storage';

interface RateLimitConfig {
  maxAttempts: number;
  windowHours: number;
  keyPrefix: string;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getWindowKey(identifier: string): string {
    const now = new Date();
    const windowStart = Math.floor(now.getTime() / (this.config.windowHours * 3600 * 1000));
    return `${this.config.keyPrefix}_${identifier}_${windowStart}`;
  }

  async canPerformAction(identifier: string): Promise<boolean> {
    const key = this.getWindowKey(identifier);
    const countStr = await AsyncStorage.getItem(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return count < this.config.maxAttempts;
  }

  async recordAction(identifier: string): Promise<void> {
    const key = this.getWindowKey(identifier);
    const countStr = await AsyncStorage.getItem(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    await AsyncStorage.setItem(key, String(count + 1));
    
    // Set expiration for cleanup (in milliseconds)
    const expirationTime = this.config.windowHours * 3600 * 1000;
    setTimeout(async () => {
      await AsyncStorage.removeItem(key);
    }, expirationTime);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    const key = this.getWindowKey(identifier);
    const countStr = await AsyncStorage.getItem(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return Math.max(0, this.config.maxAttempts - count);
  }

  async getResetTime(identifier: string): Promise<Date> {
    const now = new Date();
    const windowStart = Math.floor(now.getTime() / (this.config.windowHours * 3600 * 1000));
    const nextWindowStart = (windowStart + 1) * this.config.windowHours * 3600 * 1000;
    return new Date(nextWindowStart);
  }
}

// Pre-configured rate limiters for common use cases
export const incidentReportLimiter = new RateLimiter({
  maxAttempts: 3,
  windowHours: 1,
  keyPrefix: 'incident_report'
});

export const loginAttemptLimiter = new RateLimiter({
  maxAttempts: 5,
  windowHours: 1,
  keyPrefix: 'login_attempt'
});

export const passwordResetLimiter = new RateLimiter({
  maxAttempts: 3,
  windowHours: 24,
  keyPrefix: 'password_reset'
});
