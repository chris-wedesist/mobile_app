/**
 * @jest-environment node
 */
import {
  debounce,
  throttle,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatFileSize,
  generateRandomString,
  generateUniqueId,
  capitalize,
  toTitleCase,
  truncateText,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidName,
  deepClone,
  isEmpty,
  getPlatformValue,
  sleep,
  retryWithBackoff,
  checkOnlineStatus,
  formatCurrency,
  calculateDistance,
} from './helpers';

// Mock fetch for online status check
global.fetch = jest.fn();

describe('Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBe('Jan 15, 2024');
    });

    it('should handle string dates', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toBe('Jan 15, 2024');
    });

    it('should handle custom options', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, { year: 'numeric', month: 'long' });
      expect(formatted).toBe('January 2024');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00');
      const formatted = formatTime(date);
      expect(formatted).toBe('2:30 PM');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format recent time as "Just now"', () => {
      const date = new Date('2024-01-15T11:59:30Z');
      expect(formatRelativeTime(date)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const date = new Date('2024-01-15T11:30:00Z');
      expect(formatRelativeTime(date)).toBe('30 minutes ago');
    });

    it('should format hours ago', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      expect(formatRelativeTime(date)).toBe('2 hours ago');
    });

    it('should format days ago', () => {
      const date = new Date('2024-01-13T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('2 days ago');
    });

    it('should format older dates with full date', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('Jan 1, 2024');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
      expect(typeof result).toBe('string');
    });

    it('should generate different strings', () => {
      const result1 = generateRandomString(10);
      const result2 = generateRandomString(10);
      expect(result1).not.toBe(result2);
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('test')).toBe('Test');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('test string')).toBe('Test String');
      expect(toTitleCase('SINGLE WORD')).toBe('Single Word');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Short text');
    });

    it('should use custom suffix', () => {
      const longText = 'This is a very long text';
      const result = truncateText(longText, 10, '***');
      expect(result).toBe('This is***');
    });
  });

  describe('Validation Functions', () => {
    describe('isValidEmail', () => {
      it('should validate correct emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
      });
    });

    describe('isValidPassword', () => {
      it('should validate strong passwords', () => {
        expect(isValidPassword('StrongPass1!')).toBe(true);
        expect(isValidPassword('Complex123@')).toBe(true);
      });

      it('should reject weak passwords', () => {
        expect(isValidPassword('weak')).toBe(false);
        expect(isValidPassword('nouppercase1!')).toBe(false);
        expect(isValidPassword('NOLOWERCASE1!')).toBe(false);
        expect(isValidPassword('NoNumbers!')).toBe(false);
        expect(isValidPassword('NoSpecial1')).toBe(false);
      });
    });

    describe('isValidPhone', () => {
      it('should validate phone numbers', () => {
        expect(isValidPhone('+1234567890')).toBe(true);
        expect(isValidPhone('(123) 456-7890')).toBe(true);
        expect(isValidPhone('123-456-7890')).toBe(true);
      });

      it('should reject invalid phone numbers', () => {
        expect(isValidPhone('invalid')).toBe(false);
        expect(isValidPhone('123')).toBe(false);
      });
    });

    describe('isValidName', () => {
      it('should validate names', () => {
        expect(isValidName('John')).toBe(true);
        expect(isValidName('Mary Jane')).toBe(true);
        expect(isValidName('O\'Connor')).toBe(true);
      });

      it('should reject invalid names', () => {
        expect(isValidName('')).toBe(false);
        expect(isValidName('A')).toBe(false);
        expect(isValidName('123')).toBe(false);
        expect(isValidName('John@Doe')).toBe(false);
      });
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(null)).toBe(null);
    });

    it('should clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('should clone dates', () => {
      const original = new Date('2024-01-15');
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('isEmpty', () => {
    it('should check if values are empty', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty(new Map())).toBe(true);
      expect(isEmpty(new Set())).toBe(true);
    });

    it('should check if values are not empty', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(new Map([['key', 'value']]))).toBe(false);
      expect(isEmpty(new Set([1, 2, 3]))).toBe(false);
    });
  });

  describe('getPlatformValue', () => {
    it('should return platform-specific values', () => {
      // Note: This test assumes we're running in a Node.js environment
      // In a real React Native environment, Platform.OS would be set
      expect(getPlatformValue('ios', 'android')).toBe('ios');
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const failingFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await retryWithBackoff(failingFn, 3, 10);
      expect(result).toBe('success');
      expect(failingFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryWithBackoff(failingFn, 2, 10)).rejects.toThrow('Always fails');
      expect(failingFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('checkOnlineStatus', () => {
    it('should return true when online', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true });
      const result = await checkOnlineStatus();
      expect(result).toBe(true);
    });

    it('should return false when offline', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const result = await checkOnlineStatus();
      expect(result).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between coordinates', () => {
      // New York to Los Angeles approximate coordinates
      const nyLat = 40.7128;
      const nyLon = -74.0060;
      const laLat = 34.0522;
      const laLon = -118.2437;

      const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
      expect(distance).toBeGreaterThan(3000); // Should be roughly 4000+ km
      expect(distance).toBeLessThan(5000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });
  });
}); 