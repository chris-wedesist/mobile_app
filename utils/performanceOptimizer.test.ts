/**
 * @jest-environment node
 */
import { performanceOptimizer } from './performanceOptimizer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock errorHandler
jest.mock('./errorHandler', () => ({
  errorHandler: jest.fn(),
}));

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchParallel', () => {
    it('should fetch multiple data sources in parallel', async () => {
      const mockFetch1 = jest.fn().mockResolvedValue('data1');
      const mockFetch2 = jest.fn().mockResolvedValue('data2');
      const mockFetch3 = jest.fn().mockResolvedValue('data3');

      const result = await performanceOptimizer.fetchParallel({
        events: mockFetch1,
        posts: mockFetch2,
        stats: mockFetch3,
      });

      expect(result).toEqual({
        events: 'data1',
        posts: 'data2',
        stats: 'data3',
      });

      expect(mockFetch1).toHaveBeenCalledTimes(1);
      expect(mockFetch2).toHaveBeenCalledTimes(1);
      expect(mockFetch3).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in parallel fetching', async () => {
      const mockFetch1 = jest.fn().mockResolvedValue('data1');
      const mockFetch2 = jest.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(
        performanceOptimizer.fetchParallel({
          events: mockFetch1,
          posts: mockFetch2,
        })
      ).rejects.toThrow('Fetch failed');
    });
  });

  describe('fetchWithCache', () => {
    it('should return cached data if available', async () => {
      const mockFetch = jest.fn().mockResolvedValue('fresh data');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Mock cached data
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          data: 'cached data',
          timestamp: Date.now(),
          expiresAt: Date.now() + 60000, // 1 minute from now
        })
      );

      const result = await performanceOptimizer.fetchWithCache('test-key', mockFetch);

      expect(result).toBe('cached data');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh data if cache is expired', async () => {
      const mockFetch = jest.fn().mockResolvedValue('fresh data');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Mock expired cached data
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          data: 'expired data',
          timestamp: Date.now() - 120000, // 2 minutes ago
          expiresAt: Date.now() - 60000, // 1 minute ago
        })
      );

      const result = await performanceOptimizer.fetchWithCache('test-key', mockFetch);

      expect(result).toBe('fresh data');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle pending requests', async () => {
      const mockFetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 100))
      );

      // Start two simultaneous requests
      const promise1 = performanceOptimizer.fetchWithCache('test-key', mockFetch);
      const promise2 = performanceOptimizer.fetchWithCache('test-key', mockFetch);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe('data');
      expect(result2).toBe('data');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should only call once
    });
  });

  describe('fetchBatch', () => {
    it('should batch multiple fetch operations efficiently', async () => {
      const mockFetch1 = jest.fn().mockResolvedValue('data1');
      const mockFetch2 = jest.fn().mockResolvedValue('data2');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      // Mock no cached data
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await performanceOptimizer.fetchBatch({
        events: { key: 'events', fetch: mockFetch1 },
        posts: { key: 'posts', fetch: mockFetch2 },
      });

      expect(result).toEqual({
        events: 'data1',
        posts: 'data2',
      });

      expect(mockFetch1).toHaveBeenCalledTimes(1);
      expect(mockFetch2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache when no pattern is provided', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getAllKeys.mockResolvedValue(['cache_key1', 'cache_key2', 'other_key']);

      await performanceOptimizer.clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['cache_key1', 'cache_key2']);
    });

    it('should clear specific cache pattern', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getAllKeys.mockResolvedValue(['cache_news_1', 'cache_news_2', 'cache_other']);

      await performanceOptimizer.clearCache('news');

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['cache_news_1', 'cache_news_2']);
    });
  });
}); 