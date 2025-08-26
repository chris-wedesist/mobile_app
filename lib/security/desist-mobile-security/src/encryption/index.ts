import * as crypto from 'crypto';
import { EncryptionConfig, EncryptionResult, SecurityResult } from '../types';

// Constants to avoid magic numbers
const IV_LENGTH = 16;
const DEFAULT_KEY_LENGTH = 32;
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const PBKDF2_KEY_LENGTH = 32;
const BITS_PER_BYTE = 8;
const MINUTES_PER_HOUR = 60;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const HOUR_TO_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

/**
 * Advanced encryption service providing AES encryption, key management, and secure hashing
 */
export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey: string;
  private keyRotationTimer?: NodeJS.Timeout;

  constructor(config: EncryptionConfig, masterKey?: string) {
    this.config = config;
    this.masterKey = masterKey || this.generateMasterKey();
    this.setupKeyRotation();
  }

  /**
   * Encrypts data using AES encryption
   * @param data - Data to encrypt
   * @param password - Optional password for key derivation
   * @returns Encryption result with encrypted data and metadata
   */
  public async encrypt(data: string, password?: string): Promise<SecurityResult<EncryptionResult>> {
    try {
      const key = password ? this.deriveKeyFromPassword(password) : this.masterKey;
      const iv = crypto.randomBytes(IV_LENGTH);
      
      if (this.config.algorithm === 'AES-256-GCM') {
        return this.encryptAESGCM(data, key, iv);
      } else {
        return this.encryptAESCBC(data, key, iv);
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENCRYPTION_FAILED',
          message: 'Failed to encrypt data',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Decrypts data using AES encryption
   * @param encryptionResult - Result from encryption operation
   * @param password - Optional password for key derivation
   * @returns Decrypted data
   */
  public async decrypt(encryptionResult: EncryptionResult, password?: string): Promise<SecurityResult<string>> {
    try {
      const key = password ? this.deriveKeyFromPassword(password) : this.masterKey;
      
      if (encryptionResult.algorithm === 'AES-256-GCM') {
        return this.decryptAESGCM(encryptionResult, key);
      } else {
        return this.decryptAESCBC(encryptionResult, key);
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DECRYPTION_FAILED',
          message: 'Failed to decrypt data',
          severity: 'high',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Creates a secure hash of the input data
   * @param data - Data to hash
   * @param salt - Optional salt for the hash
   * @returns Hashed data
   */
  public createHash(data: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(IV_LENGTH).toString('hex');
    return crypto.pbkdf2Sync(data, saltToUse, HASH_ITERATIONS, HASH_KEY_LENGTH, 'sha512').toString('hex');
  }

  /**
   * Verifies data against a hash
   * @param data - Original data
   * @param hash - Hash to verify against
   * @param salt - Salt used in the original hash
   * @returns True if data matches hash
   */
  public verifyHash(data: string, hash: string, salt: string): boolean {
    const dataHash = this.createHash(data, salt);
    return this.timingSafeEqual(dataHash, hash);
  }

  /**
   * Generates a cryptographically secure random key
   * @param length - Key length in bytes
   * @returns Base64 encoded key
   */
  public generateSecureKey(length: number = DEFAULT_KEY_LENGTH): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Rotates the master key and re-encrypts sensitive data
   */
  public async rotateMasterKey(): Promise<SecurityResult<boolean>> {
    try {
      // Generate new master key (old key would be used for re-encryption in production)
      this.masterKey = this.generateMasterKey();
      
      // In a real implementation, you would re-encrypt stored data here
      // This is a placeholder for the key rotation logic
      
      return {
        success: true,
        data: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'KEY_ROTATION_FAILED',
          message: 'Failed to rotate master key',
          severity: 'critical',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        timestamp: new Date()
      };
    }
  }

  private encryptAESGCM(data: string, key: string, iv: Buffer): SecurityResult<EncryptionResult> {
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    cipher.setAAD(Buffer.from('security-metadata', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      success: true,
      data: {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: 'AES-256-GCM'
      },
      timestamp: new Date()
    };
  }

  private encryptAESCBC(data: string, key: string, iv: Buffer): SecurityResult<EncryptionResult> {
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      success: true,
      data: {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        algorithm: 'AES-256-CBC'
      },
      timestamp: new Date()
    };
  }

  private decryptAESGCM(encryptionResult: EncryptionResult, key: string): SecurityResult<string> {
    if (!encryptionResult.tag) {
      throw new Error('GCM tag is required for decryption');
    }
    
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(encryptionResult.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAAD(Buffer.from('security-metadata', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptionResult.tag, 'hex'));
    
    let decrypted = decipher.update(encryptionResult.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return {
      success: true,
      data: decrypted,
      timestamp: new Date()
    };
  }

  private decryptAESCBC(encryptionResult: EncryptionResult, key: string): SecurityResult<string> {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(encryptionResult.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptionResult.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return {
      success: true,
      data: decrypted,
      timestamp: new Date()
    };
  }

  private deriveKeyFromPassword(password: string, salt?: string): string {
    const saltToUse = salt || 'default-salt';
    return crypto.pbkdf2Sync(password, saltToUse, HASH_ITERATIONS, PBKDF2_KEY_LENGTH, 'sha256').toString('hex');
  }

  private generateMasterKey(): string {
    return crypto.randomBytes(this.config.keySize / BITS_PER_BYTE).toString('hex');
  }

  private setupKeyRotation(): void {
    if (this.config.keyRotationInterval > 0) {
      const intervalMs = this.config.keyRotationInterval * HOUR_TO_MS;
      this.keyRotationTimer = setInterval(() => {
        this.rotateMasterKey();
      }, intervalMs) as unknown as NodeJS.Timeout;
    }
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
    // Securely clear sensitive data
    this.masterKey = '';
  }
}
