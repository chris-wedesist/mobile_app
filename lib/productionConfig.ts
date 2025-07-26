// Production Configuration for Real API Integration
// This file contains production-ready API configurations and settings

export interface ProductionAPIConfig {
  // Legal Directory APIs
  MARTINDALE_API_KEY?: string;
  AVVO_API_KEY?: string;
  
  // Legal Aid Organization APIs
  LSC_API_KEY?: string;
  PROBONO_NET_API_KEY?: string;
  
  // Civil Rights Organization APIs
  ACLU_API_KEY?: string;
  NLG_API_KEY?: string;
  SPLC_API_KEY?: string;
  
  // Rate Limiting
  DEFAULT_RATE_LIMIT: number;
  MAX_RETRIES: number;
  REQUEST_TIMEOUT: number;
  
  // Caching
  CACHE_DURATION: number; // in milliseconds
  MAX_CACHE_SIZE: number;
  
  // Monitoring
  ENABLE_API_MONITORING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Data Validation
  REQUIRE_VERIFICATION: boolean;
  MIN_ATTORNEY_RATING: number;
  MAX_DISTANCE_RADIUS: number; // in miles
}

// Production Configuration
export const PRODUCTION_CONFIG: ProductionAPIConfig = {
  // API Keys - Set these in environment variables
  MARTINDALE_API_KEY: process.env.MARTINDALE_API_KEY,
  AVVO_API_KEY: process.env.AVVO_API_KEY,
  LSC_API_KEY: process.env.LSC_API_KEY,
  PROBONO_NET_API_KEY: process.env.PROBONO_NET_API_KEY,
  ACLU_API_KEY: process.env.ACLU_API_KEY,
  NLG_API_KEY: process.env.NLG_API_KEY,
  SPLC_API_KEY: process.env.SPLC_API_KEY,
  
  // Rate Limiting
  DEFAULT_RATE_LIMIT: 100, // requests per hour
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  
  // Caching
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  MAX_CACHE_SIZE: 1000, // maximum cached responses
  
  // Monitoring
  ENABLE_API_MONITORING: true,
  LOG_LEVEL: 'info',
  
  // Data Validation
  REQUIRE_VERIFICATION: true,
  MIN_ATTORNEY_RATING: 3.0,
  MAX_DISTANCE_RADIUS: 100, // 100 miles
};

// API Health Monitoring
export interface APIHealthStatus {
  apiName: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  successRate: number;
}

export class APIHealthMonitor {
  private static instance: APIHealthMonitor;
  private healthStatus: Map<string, APIHealthStatus> = new Map();
  
  static getInstance(): APIHealthMonitor {
    if (!APIHealthMonitor.instance) {
      APIHealthMonitor.instance = new APIHealthMonitor();
    }
    return APIHealthMonitor.instance;
  }
  
  updateHealthStatus(apiName: string, isHealthy: boolean, responseTime: number): void {
    const current = this.healthStatus.get(apiName) || {
      apiName,
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      successRate: 100,
    };
    
    current.isHealthy = isHealthy;
    current.lastCheck = new Date();
    current.responseTime = responseTime;
    
    if (!isHealthy) {
      current.errorCount++;
    }
    
    // Calculate success rate (simplified)
    const totalChecks = current.errorCount + (current.isHealthy ? 1 : 0);
    current.successRate = totalChecks > 0 ? ((totalChecks - current.errorCount) / totalChecks) * 100 : 100;
    
    this.healthStatus.set(apiName, current);
  }
  
  getHealthStatus(): Map<string, APIHealthStatus> {
    return this.healthStatus;
  }
  
  getUnhealthyAPIs(): string[] {
    const unhealthy: string[] = [];
    this.healthStatus.forEach((status, apiName) => {
      if (!status.isHealthy || status.successRate < 80) {
        unhealthy.push(apiName);
      }
    });
    return unhealthy;
  }
}

// Data Validation Utilities
export class DataValidator {
  static validateAttorneyData(attorney: any): boolean {
    if (!attorney) return false;
    
    // Required fields
    const requiredFields = ['name', 'lat', 'lng', 'specialization'];
    for (const field of requiredFields) {
      if (!attorney[field]) return false;
    }
    
    // Validate coordinates
    if (typeof attorney.lat !== 'number' || typeof attorney.lng !== 'number') {
      return false;
    }
    
    if (attorney.lat < -90 || attorney.lat > 90 || attorney.lng < -180 || attorney.lng > 180) {
      return false;
    }
    
    // Validate rating
    if (attorney.rating && (attorney.rating < 0 || attorney.rating > 5)) {
      return false;
    }
    
    return true;
  }
  
  static validateLocationData(latitude: number, longitude: number, radius: number): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radius !== 'number') {
      return false;
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }
    
    if (radius <= 0 || radius > PRODUCTION_CONFIG.MAX_DISTANCE_RADIUS) {
      return false;
    }
    
    return true;
  }
}

// Production Logging
export class ProductionLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = PRODUCTION_CONFIG.LOG_LEVEL;
  
  static debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
  
  static info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }
  
  static warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }
  
  static error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }
  
  private static shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

// Cache Management
export class APICache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static maxSize = PRODUCTION_CONFIG.MAX_CACHE_SIZE;
  private static cacheDuration = PRODUCTION_CONFIG.CACHE_DURATION;
  
  static set(key: string, data: any): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static getSize(): number {
    return this.cache.size;
  }
}

// Export utilities for use in other modules
export const productionUtils = {
  config: PRODUCTION_CONFIG,
  healthMonitor: APIHealthMonitor.getInstance(),
  validator: DataValidator,
  logger: ProductionLogger,
  cache: APICache,
}; 