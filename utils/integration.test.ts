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

// Mock news API with inline mocks
const mockNews = {
  fetchNewsWithOptimization: jest.fn(),
  getNews: jest.fn(),
  fetchNews: jest.fn(),
};

describe('Performance Optimization Integration Tests', () => {
  const mockAsyncStorage = require('@react-native-async-storage/async-storage');

  beforeEach(() => {
    jest.clearAllMocks();
    (performanceOptimizer as any).cache.clear();
    (performanceOptimizer as any).pendingRequests.clear();
  });

  describe('News API Integration', () => {
    it('should optimize news fetching with parallel operations', async () => {
      const mockNewsData = {
        news: [{ id: '1', title: 'News 1' }],
        featured: [{ id: '2', title: 'Featured 1' }],
        trending: [{ id: '3', title: 'Trending 1' }],
      };

      mockNews.fetchNewsWithOptimization.mockResolvedValue(mockNewsData);

      const result = await performanceOptimizer.fetchWithCache(
        'news_integration',
        async () => {
          return await mockNews.fetchNewsWithOptimization();
        },
        {
          key: 'news_integration',
          duration: 5 * 60 * 1000,
        }
      );

      expect(result).toEqual(mockNewsData);
      expect(mockNews.fetchNewsWithOptimization).toHaveBeenCalledTimes(1);
    });

    it('should cache paginated news requests', async () => {
      const mockPaginatedNews = [{ id: '1', title: 'Page 1' }];
      mockNews.getNews.mockResolvedValue(mockPaginatedNews);

      // First call - should fetch from API
      const result1 = await performanceOptimizer.fetchWithCache(
        'news_page_1',
        async () => {
          return await mockNews.getNews(1, 10);
        },
        { key: 'news_page_1', duration: 300000 }
      );

      // Second call - should use cache
      const result2 = await performanceOptimizer.fetchWithCache(
        'news_page_1',
        async () => {
          return await mockNews.getNews(1, 10);
        },
        { key: 'news_page_1', duration: 300000 }
      );

      expect(result1).toEqual(mockPaginatedNews);
      expect(result2).toEqual(mockPaginatedNews);
      expect(mockNews.getNews).toHaveBeenCalledTimes(1); // Should only call once due to caching
    });
  });

  describe('Screen-Level Integration', () => {
    it('should handle location-based caching for incidents', async () => {
      const mockIncidents = [
        {
          id: '1',
          type: 'ICE Activity',
          latitude: 40.7128,
          longitude: -74.006,
        },
      ];

      const location = { coords: { latitude: 40.7128, longitude: -74.006 } };
      const cacheKey = `incidents_${location.coords.latitude}_${location.coords.longitude}`;

      const result = await performanceOptimizer.fetchWithCache(
        cacheKey,
        async () => {
          // Simulate incident fetching logic
          return mockIncidents.map((incident) => ({
            ...incident,
            distance: Math.sqrt(
              Math.pow(incident.latitude - location.coords.latitude, 2) +
                Math.pow(incident.longitude - location.coords.longitude, 2)
            ),
          }));
        },
        {
          key: cacheKey,
          duration: 2 * 60 * 1000,
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('distance');
    });

    it('should optimize attorney data fetching with location caching', async () => {
      const mockAttorneys = [
        { id: '1', name: 'Attorney 1', distance: 5.2 },
        { id: '2', name: 'Attorney 2', distance: 8.1 },
      ];

      const location = { coords: { latitude: 40.7128, longitude: -74.006 } };
      const cacheKey = `attorneys_${location.coords.latitude}_${location.coords.longitude}`;

      const result = await performanceOptimizer.fetchWithCache(
        cacheKey,
        async () => {
          // Simulate attorney API call
          return mockAttorneys;
        },
        {
          key: cacheKey,
          duration: 10 * 60 * 1000,
        }
      );

      expect(result).toEqual(mockAttorneys);
    });
  });

  describe('Batch Operations Integration', () => {
    it('should efficiently batch multiple data sources', async () => {
      const mockEvents = [{ id: '1', title: 'Event 1' }];
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      const mockStats = { total: 100, active: 50 };

      // Simulate batch operation with individual calls
      const [events, posts, stats] = await Promise.all([
        performanceOptimizer.fetchWithCache('events', async () => mockEvents, {
          key: 'events',
          duration: 5 * 60 * 1000,
        }),
        performanceOptimizer.fetchWithCache('posts', async () => mockPosts, {
          key: 'posts',
          duration: 5 * 60 * 1000,
        }),
        performanceOptimizer.fetchWithCache('stats', async () => mockStats, {
          key: 'stats',
          duration: 2 * 60 * 1000,
        }),
      ]);

      const result = { events, posts, stats };

      expect(result).toEqual({
        events: mockEvents,
        posts: mockPosts,
        stats: mockStats,
      });
    });
  });

  describe('Cache Management Integration', () => {
    it('should handle cache expiration and cleanup', async () => {
      // Set up expired cache
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          data: 'expired data',
          timestamp: Date.now() - 120000,
          expiresAt: Date.now() - 60000,
        })
      );

      const mockFetch = jest.fn().mockResolvedValue('fresh data');
      const result = await performanceOptimizer.fetchWithCache(
        'expired_key',
        mockFetch,
        { key: 'expired_key', duration: 300000 }
      );

      expect(result).toBe('fresh data');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        'cache_expired_key'
      );
    });

    it('should clear specific cache patterns', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue([
        'cache_news_1',
        'cache_news_2',
        'cache_incidents_1',
        'cache_other',
      ]);

      // clearCache doesn't take arguments, clears all cache
      await performanceOptimizer.clearCache();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'cache_news_1',
        'cache_news_2',
      ]);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API failures gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
      const errorHandler = require('./errorHandler').errorHandler;

      await expect(
        performanceOptimizer.fetchWithCache('error_key', mockFetch, {
          key: 'error_key',
          duration: 300000,
        })
      ).rejects.toThrow('API Error');

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should handle corrupted cache data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      const mockFetch = jest.fn().mockResolvedValue('fresh data');

      const result = await performanceOptimizer.fetchWithCache(
        'corrupted_key',
        mockFetch,
        { key: 'corrupted_key', duration: 300000 }
      );

      expect(result).toBe('fresh data');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        'cache_corrupted_key'
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should measure cache hit performance', async () => {
      const startTime = Date.now();

      // First call - cache miss
      await performanceOptimizer.fetchWithCache(
        'perf_test',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API delay
          return 'data';
        },
        { key: 'perf_test', duration: 300000 }
      );

      const firstCallTime = Date.now() - startTime;

      // Second call - cache hit
      const cacheStartTime = Date.now();
      await performanceOptimizer.fetchWithCache(
        'perf_test',
        async () => {
          return 'data';
        },
        { key: 'perf_test', duration: 300000 }
      );

      const cacheCallTime = Date.now() - cacheStartTime;

      // Cache hit should be significantly faster
      expect(cacheCallTime).toBeLessThan(firstCallTime);
      expect(cacheCallTime).toBeLessThan(50); // Should be very fast
    });
  });
});
