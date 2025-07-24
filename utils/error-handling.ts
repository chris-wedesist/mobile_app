import * as Sentry from "@sentry/react-native";

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

export const errorHandler = (error: unknown): string => {
  if (error instanceof AppError) {
    Sentry.captureException(error, {
      level: error.severity,
      tags: { errorCode: error.code }
    });
    return error.userMessage;
  }
  Sentry.captureException(error);
  return 'An unexpected error occurred. Please try again later.';
};