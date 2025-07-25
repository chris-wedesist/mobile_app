import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorHandler } from './errorHandler';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  duration?: number;
  key: string;
}

class PerformanceOptimizer {
  private cache = new Map<string, CacheItem<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Parallel data fetching with Promise.all for optimal performance
   */
  async fetchParallel<T extends Record<string, any>>(
    fetchFunctions: Record<keyof T, () => Promise<any>>
  ): Promise<T> {
    try {
      const keys = Object.keys(fetchFunctions) as Array<keyof T>;
      const promises = keys.map(key => fetchFunctions[key]());
      
      const results = await Promise.all(promises);
      
      const result: Partial<T> = {};
      keys.forEach((key, index) => {
        result[key] = results[index];
      });
      
      return result as T;
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Intelligent caching with automatic expiration and size management
   */
  async getCached<T>(key: string): Promise<T | null> {
    try {
      const now = Date.now();
      
      // Check in-memory cache first
      const cached = this.cache.get(key);
      if (cached && now < cached.expiresAt) {
        return cached.data;
      } else if (cached && now >= cached.expiresAt) {
        // Remove expired in-memory cache
        this.cache.delete(key);
      }

      // Check AsyncStorage
      const stored = await AsyncStorage.getItem(`cache_${key}`);
      if (stored) {
        try {
          const parsed: CacheItem<T> = JSON.parse(stored);
          if (now < parsed.expiresAt) {
            // Update in-memory cache
            this.cache.set(key, parsed);
            return parsed.data;
          } else {
            // Remove expired cache
            await AsyncStorage.removeItem(`cache_${key}`);
          }
        } catch (parseError) {
          // Remove corrupted cache
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      }

      return null;
    } catch (error) {
      errorHandler(error);
      return null;
    }
  }

  /**
   * Set cache with automatic cleanup
   */
  async setCached<T>(key: string, data: T, config?: CacheConfig): Promise<void> {
    try {
      const duration = config?.duration || CACHE_DURATION;
      const cacheKey = config?.key || key;
      
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      };

      // Update in-memory cache
      this.cache.set(cacheKey, cacheItem);
      
      // Update AsyncStorage
      await AsyncStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cacheItem));
      
      // Cleanup old cache entries
      this.cleanupCache();
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * Fetch with caching - returns cached data if available, otherwise fetches fresh data
   */
  async fetchWithCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config?: CacheConfig
  ): Promise<T> {
    try {
      // Check if request is already pending FIRST
      if (this.pendingRequests.has(key)) {
        console.log(`Request already pending for key: ${key}`);
        return await this.pendingRequests.get(key)!;
      }

      // Check cache only if no pending request
      const cached = await this.getCached<T>(key);
      if (cached !== null) {
        console.log(`Cache hit for key: ${key}`);
        return cached;
      }

      console.log(`Cache miss for key: ${key}, fetching fresh data`);
      
      // Create the fetch promise and store it BEFORE starting the fetch
      const fetchPromise = fetchFunction();
      this.pendingRequests.set(key, fetchPromise);

      try {
        const data = await fetchPromise;
        await this.setCached(key, data, config);
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    } catch (error) {
      // Clean up pending request on error
      this.pendingRequests.delete(key);
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Batch multiple fetch operations with intelligent caching
   */
  async fetchBatch<T extends Record<string, any>>(
    batchConfig: Record<keyof T, { key: string; fetch: () => Promise<any>; cacheConfig?: CacheConfig }>
  ): Promise<T> {
    try {
      const keys = Object.keys(batchConfig) as Array<keyof T>;
      
      // Check cache for all items first
      const cachePromises = keys.map(async (key) => {
        const config = batchConfig[key];
        const cached = await this.getCached(config.key);
        return { key, cached, config };
      });
      
      const cacheResults = await Promise.all(cachePromises);
      
      // Separate cached and uncached items
      const cachedItems: Partial<T> = {};
      const uncachedConfigs: Record<string, { key: keyof T; fetch: () => Promise<any>; cacheConfig?: CacheConfig }> = {};
      
      cacheResults.forEach(({ key, cached, config }) => {
        if (cached !== null) {
          (cachedItems as any)[key] = cached;
        } else {
          uncachedConfigs[config.key] = { key, fetch: config.fetch, cacheConfig: config.cacheConfig };
        }
      });
      
      // Fetch uncached items in parallel
      if (Object.keys(uncachedConfigs).length > 0) {
        const fetchPromises = Object.entries(uncachedConfigs).map(async ([cacheKey, config]) => {
          const data = await config.fetch();
          await this.setCached(cacheKey, data, config.cacheConfig);
          return { key: config.key, data };
        });
        
        const fetchResults = await Promise.all(fetchPromises);
        fetchResults.forEach(({ key, data }) => {
          (cachedItems as any)[key] = data;
        });
      }
      
      return cachedItems as T;
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }

  /**
   * Clear cache entries
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Clear specific pattern
        const keys = await AsyncStorage.getAllKeys();
        const matchingKeys = keys.filter(key => key.startsWith(`cache_${pattern}`));
        await AsyncStorage.multiRemove(matchingKeys);
        
        // Clear in-memory cache
        const cacheKeys = Array.from(this.cache.keys());
        for (const key of cacheKeys) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
      } else {
        // Clear all cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
        this.cache.clear();
      }
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private async cleanupCache(): Promise<void> {
    try {
      if (this.cache.size > MAX_CACHE_SIZE) {
        // Remove oldest entries
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = entries.slice(0, this.cache.size - MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => {
          this.cache.delete(key);
        });
      }
      
      // Cleanup expired entries from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const parsed: CacheItem<any> = JSON.parse(stored);
            if (Date.now() >= parsed.expiresAt) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted cache entries
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      errorHandler(error);
    }
  }

  /**
   * Preload critical data for better UX
   */
  async preloadData<T extends Record<string, any>>(
    preloadConfig: Record<keyof T, { key: string; fetch: () => Promise<any>; cacheConfig?: CacheConfig }>
  ): Promise<void> {
    try {
      const preloadPromises = Object.values(preloadConfig).map(async (config) => {
        try {
          await this.fetchWithCache(config.key, config.fetch, config.cacheConfig);
        } catch (error) {
          // Don't throw on preload errors, just log them
          console.warn(`Preload failed for ${config.key}:`, error);
        }
      });
      
      await Promise.all(preloadPromises);
    } catch (error) {
      errorHandler(error);
    }
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export types for external use
export type { CacheConfig, CacheItem }; 