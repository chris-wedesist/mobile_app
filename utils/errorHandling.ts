import * as Sentry from '@sentry/react-native';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high',
    public userMessage: string
  ) {
    super(message);
  }
}

/**
 * Centralised error handler for the application.
 *
 * 1. Sends all captured exceptions to Sentry.
 * 2. For `AppError` instances, the severity and error code are forwarded
 *    as Sentry context for easier triage.
 * 3. Returns a user-friendly message that can be surfaced in the UI if needed.
 */
export const errorHandler = (error: unknown): string => {
  if (error instanceof AppError) {
    Sentry.captureException(error, {
      level: error.severity,
      tags: { errorCode: error.code },
    });
    return error.userMessage;
  }
  Sentry.captureException(error);
  return 'An unexpected error occurred. Please try again later.';
};