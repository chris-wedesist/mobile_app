/**
 * @jest-environment node
 */
import { errorHandler, AppError } from './errorHandler';

// Mock Sentry to prevent actual network calls
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

describe('errorHandler', () => {
  it('returns userMessage for AppError and calls Sentry with correct level and tags', () => {
    const error = new AppError('Internal error', 'E123', 'high', 'Something went wrong!');
    const result = errorHandler(error);
    expect(result).toBe('Something went wrong!');
    const Sentry = require('@sentry/react-native');
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { level: 'error', tags: { errorCode: 'E123' } });
  });

  it('returns default message and calls Sentry for unknown error', () => {
    const error = new Error('Unknown');
    const result = errorHandler(error);
    expect(result).toBe('An unexpected error occurred. Please try again later.');
    const Sentry = require('@sentry/react-native');
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
}); 