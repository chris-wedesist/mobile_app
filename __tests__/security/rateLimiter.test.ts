import { RateLimiter, incidentReportLimiter } from '../../lib/security/rateLimiter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('RateLimiter', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('RateLimiter class', () => {
    const testLimiter = new RateLimiter({
      maxAttempts: 3,
      windowHours: 1,
      keyPrefix: 'test',
    });

    it('should allow action when under limit', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('1');
      
      const canPerform = await testLimiter.canPerformAction('device123');
      
      expect(canPerform).toBe(true);
    });

    it('should deny action when at limit', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('3');
      
      const canPerform = await testLimiter.canPerformAction('device123');
      
      expect(canPerform).toBe(false);
    });

    it('should allow action when no previous attempts', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const canPerform = await testLimiter.canPerformAction('device123');
      
      expect(canPerform).toBe(true);
    });

    it('should record action correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('1');
      
      await testLimiter.recordAction('device123');
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('test_device123'),
        '2'
      );
    });

    it('should calculate remaining attempts correctly', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('1');
      
      const remaining = await testLimiter.getRemainingAttempts('device123');
      
      expect(remaining).toBe(2);
    });

    it('should return zero remaining attempts when at limit', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('3');
      
      const remaining = await testLimiter.getRemainingAttempts('device123');
      
      expect(remaining).toBe(0);
    });

    it('should calculate reset time correctly', async () => {
      const now = new Date('2024-01-01T12:30:00Z');
      jest.setSystemTime(now);
      
      const resetTime = await testLimiter.getResetTime('device123');
      
      // Should be the next hour boundary
      expect(resetTime.getTime()).toBe(new Date('2024-01-01T13:00:00Z').getTime());
    });
  });

  describe('Pre-configured limiters', () => {
    it('should have correct configuration for incident reports', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('2');
      
      const canReport = await incidentReportLimiter.canPerformAction('device123');
      const remaining = await incidentReportLimiter.getRemainingAttempts('device123');
      
      expect(canReport).toBe(true);
      expect(remaining).toBe(1);
    });

    it('should deny incident reports when limit exceeded', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('3');
      
      const canReport = await incidentReportLimiter.canPerformAction('device123');
      
      expect(canReport).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const canPerform = await testLimiter.canPerformAction('device123');
      
      // Should default to allowing action when storage fails
      expect(canPerform).toBe(true);
    });

    it('should handle invalid stored values', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid');
      
      const remaining = await testLimiter.getRemainingAttempts('device123');
      
      // Should treat invalid values as 0
      expect(remaining).toBe(3);
    });
  });

  describe('Time window behavior', () => {
    it('should use different keys for different time windows', async () => {
      const testLimiter = new RateLimiter({
        maxAttempts: 3,
        windowHours: 1,
        keyPrefix: 'test',
      });

      // Mock two different hours
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
      await testLimiter.canPerformAction('device123');
      const key1 = (mockAsyncStorage.getItem as jest.Mock).mock.calls[0][0];

      jest.setSystemTime(new Date('2024-01-01T13:00:00Z'));
      await testLimiter.canPerformAction('device123');
      const key2 = (mockAsyncStorage.getItem as jest.Mock).mock.calls[1][0];

      expect(key1).not.toBe(key2);
    });
  });
});
