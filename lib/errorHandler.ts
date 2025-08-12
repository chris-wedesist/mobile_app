export const handleSearchError = (error: Error): void => {
  console.error('[API Error]:', error.message);
  // Log to monitoring service if available
};

export const createErrorState = (message?: string) => {
  return {
    isLoading: false,
    hasError: true,
    errorMessage: message || 'Unable to retrieve data. Please try again later.'
  };
}; 