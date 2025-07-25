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

// Map custom severity to Sentry SeverityLevel
const mapSeverityToSentryLevel = (severity: 'low' | 'medium' | 'high'): Sentry.SeverityLevel => {
  switch (severity) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
    default:
      return 'error';
  }
};

export const errorHandler = (error: unknown): string => {
  if (error instanceof AppError) {
    Sentry.captureException(error, { level: mapSeverityToSentryLevel(error.severity), tags: { errorCode: error.code } });
    return error.userMessage;
  }
  Sentry.captureException(error);
  return 'An unexpected error occurred. Please try again later.';
}; 