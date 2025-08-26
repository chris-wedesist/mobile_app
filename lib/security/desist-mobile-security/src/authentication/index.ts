import * as bcrypt from 'bcryptjs';
import { AuthConfig, SecurityResult, UserProfile } from '../types';

// Constants to avoid magic numbers
const BCRYPT_SALT_ROUNDS = 12;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_TO_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;
const MIN_PASSWORD_LENGTH = 8;
const MFA_CODE_LENGTH = 6;
const RANDOM_BASE = 36;
const SUBSTRING_START = 2;
const SUBSTRING_END = 15;

export class AuthenticationService {
  private config: AuthConfig;
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Hashes a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  public async hashPassword(password: string): Promise<SecurityResult<string>> {
    try {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 8 characters long',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      return {
        success: true,
        data: hash,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HASH_ERROR',
          message: error instanceof Error ? error.message : 'Password hashing failed',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Verifies a password against a hash
   * @param password Plain text password
   * @param hash Stored password hash
   * @returns Verification result
   */
  public async verifyPassword(password: string, hash: string): Promise<SecurityResult<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      return {
        success: true,
        data: isValid,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VERIFY_ERROR',
          message: error instanceof Error ? error.message : 'Password verification failed',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Validates password strength
   * @param password Password to validate
   * @returns Validation result
   */
  public validatePasswordStrength(password: string): SecurityResult<{ score: number; feedback: string[] }> {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    return {
      success: true,
      data: { score, feedback },
      timestamp: new Date()
    };
  }

  /**
   * Initiates multi-factor authentication for a user
   * @param _userProfile User profile (parameter reserved for future implementation)
   * @returns MFA challenge
   */
  public async initiateMFA(_userProfile: UserProfile): Promise<SecurityResult<{ challenge: string; method: string }>> {
    if (!this.config.enableMFA) {
      return {
        success: false,
        error: {
          code: 'MFA_DISABLED',
          message: 'Multi-factor authentication is not enabled',
          severity: 'low'
        },
        timestamp: new Date()
      };
    }

    try {
      const challenge = this.generateMFACode();
      
      return {
        success: true,
        data: {
          challenge,
          method: 'sms'
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MFA_ERROR',
          message: error instanceof Error ? error.message : 'MFA initiation failed',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Verifies multi-factor authentication code
   * @param code User-provided MFA code
   * @param _challenge Server-generated challenge (parameter reserved for future implementation)
   * @returns Verification result
   */
  public async verifyMFA(code: string, _challenge: string): Promise<SecurityResult<boolean>> {
    if (!this.config.enableMFA) {
      return {
        success: false,
        error: {
          code: 'MFA_DISABLED',
          message: 'Multi-factor authentication is not enabled',
          severity: 'low'
        },
        timestamp: new Date()
      };
    }

    try {
      // Simple validation for demo - in production, verify against actual challenge
      const isValid = code.length === MFA_CODE_LENGTH && /^\d+$/.test(code);
      
      return {
        success: true,
        data: isValid,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MFA_VERIFY_ERROR',
          message: error instanceof Error ? error.message : 'MFA verification failed',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Checks if an account is locked due to failed attempts
   * @param identifier User identifier (email, username, etc.)
   * @returns Lock status
   */
  public isAccountLocked(identifier: string): SecurityResult<boolean> {
    const attempts = this.failedAttempts.get(identifier);
    
    if (!attempts) {
      return {
        success: true,
        data: false,
        timestamp: new Date()
      };
    }

    const lockoutTime = this.config.lockoutDuration * MINUTES_TO_MS;
    const isLocked = attempts.count >= this.config.maxFailedAttempts &&
                    (Date.now() - attempts.lastAttempt.getTime()) < lockoutTime;

    return {
      success: true,
      data: isLocked,
      timestamp: new Date()
    };
  }

  /**
   * Records a failed authentication attempt
   * @param identifier User identifier
   * @returns Updated attempt count
   */
  public recordFailedAttempt(identifier: string): SecurityResult<number> {
    const existing = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    
    // Reset count if lockout period has passed
    const lockoutTime = this.config.lockoutDuration * MINUTES_TO_MS;
    if (Date.now() - existing.lastAttempt.getTime() > lockoutTime) {
      existing.count = 0;
    }

    existing.count += 1;
    existing.lastAttempt = new Date();
    this.failedAttempts.set(identifier, existing);

    return {
      success: true,
      data: existing.count,
      timestamp: new Date()
    };
  }

  /**
   * Clears failed attempts for a user (after successful authentication)
   * @param identifier User identifier
   * @returns Success status
   */
  public clearFailedAttempts(identifier: string): SecurityResult<boolean> {
    this.failedAttempts.delete(identifier);
    return {
      success: true,
      data: true,
      timestamp: new Date()
    };
  }

  /**
   * Generates a random MFA code
   * @returns Random 6-digit code
   */
  private generateMFACode(): string {
    return Math.random().toString(RANDOM_BASE).substring(SUBSTRING_START, SUBSTRING_END);
  }
}
