// Error handling utility - simplified for Expo SDK 53 compatibility

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
    // Log error for debugging
    console.warn(`AppError [${error.code}]: ${error.message}`, error);
    return error.userMessage;
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return 'An unexpected error occurred. Please try again later.';
}; 