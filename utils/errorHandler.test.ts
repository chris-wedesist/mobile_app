/**
 * @jest-environment node
 */
import { AppError, errorHandler } from './errorHandler';

// Updated tests for simplified error handler (without Sentry)
describe('errorHandler', () => {
  // Spy on console methods to verify logging
  const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  afterEach(() => {
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('returns userMessage for AppError and logs to console', () => {
    const error = new AppError(
      'Internal error',
      'E123',
      'high',
      'Something went wrong!'
    );
    const result = errorHandler(error);
    expect(result).toBe('Something went wrong!');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('AppError [E123]: Internal error'),
      error
    );
  });

  it('returns default message and logs to console for unknown error', () => {
    const error = new Error('Unknown');
    const result = errorHandler(error);
    expect(result).toBe(
      'An unexpected error occurred. Please try again later.'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected error:', error);
  });
});
