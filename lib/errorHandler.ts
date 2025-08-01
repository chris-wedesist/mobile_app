// Error Handling & Fallbacks Module
// Feature Set 9: Error Handling & Fallbacks

import { ProcessedAttorney } from './dataProcessor';

export interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorType: 'api' | 'network' | 'timeout' | 'validation' | 'unknown';
  retryCount: number;
  lastErrorTime: number;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  progress?: number;
}

// Fallback attorney data for offline scenarios
// Feature Set 9: Fallback Data
const FALLBACK_ATTORNEYS: ProcessedAttorney[] = [
  {
    id: 'fallback_1',
    name: 'Civil Rights Legal Aid Center',
    detailedLocation: '123 Justice Street, Tampa, FL 33602',
    location: '2.1 mi',
    lat: 27.9506,
    lng: -82.4572,
    phone: '(813) 555-0123',
    website: 'https://civilrightslegal.org',
    rating: 4.8,
    cases: 150,
    featured: true,
    image: '',
    languages: ['English', 'Spanish'],
    specialization: 'Civil Rights Law, Immigration Law, Police Misconduct',
    email: 'info@civilrightslegal.org',
    feeStructure: 'mixed',
    firmSize: 'medium',
    experienceYears: 15,
    availability: 'immediate',
    consultationFee: 0,
    acceptsNewClients: true,
    emergencyAvailable: true,
    virtualConsultation: true,
    inPersonConsultation: true,
    verified: true,
    source: 'Fallback Data',
    lastVerified: new Date().toISOString(),
    distance: 3380,
    proBonoAvailable: true,
    slidingScale: true,
    civilRightsSpecializations: ['Civil Rights Law', 'Police Misconduct', 'Discrimination Law'],
    immigrationSpecializations: ['Immigration Law', 'Asylum & Refugee Law', 'Deportation Defense']
  },
  {
    id: 'fallback_2',
    name: 'Immigrant Rights Advocacy Group',
    detailedLocation: '456 Freedom Avenue, St. Petersburg, FL 33701',
    location: '5.3 mi',
    lat: 27.7731,
    lng: -82.6400,
    phone: '(727) 555-0456',
    website: 'https://immigrantrights.org',
    rating: 4.9,
    cases: 200,
    featured: true,
    image: '',
    languages: ['English', 'Spanish', 'Haitian Creole'],
    specialization: 'Immigration Law, Asylum & Refugee Law, Deportation Defense',
    email: 'help@immigrantrights.org',
    feeStructure: 'mixed',
    firmSize: 'large',
    experienceYears: 20,
    availability: 'immediate',
    consultationFee: 0,
    acceptsNewClients: true,
    emergencyAvailable: true,
    virtualConsultation: true,
    inPersonConsultation: true,
    verified: true,
    source: 'Fallback Data',
    lastVerified: new Date().toISOString(),
    distance: 8530,
    proBonoAvailable: true,
    slidingScale: true,
    civilRightsSpecializations: ['Immigrant Rights', 'Discrimination Law'],
    immigrationSpecializations: ['Immigration Law', 'Asylum & Refugee Law', 'Deportation Defense', 'First Amendment Rights']
  },
  {
    id: 'fallback_3',
    name: 'Justice for All Legal Services',
    detailedLocation: '789 Equality Drive, Clearwater, FL 33755',
    location: '8.7 mi',
    lat: 27.9659,
    lng: -82.8001,
    phone: '(727) 555-0789',
    website: 'https://justiceforall.org',
    rating: 4.7,
    cases: 120,
    featured: false,
    image: '',
    languages: ['English', 'Spanish'],
    specialization: 'Constitutional Law, Voting Rights, Employment Discrimination',
    email: 'contact@justiceforall.org',
    feeStructure: 'hourly',
    firmSize: 'small',
    experienceYears: 12,
    availability: 'consultation-only',
    consultationFee: 50,
    acceptsNewClients: true,
    emergencyAvailable: false,
    virtualConsultation: true,
    inPersonConsultation: true,
    verified: true,
    source: 'Fallback Data',
    lastVerified: new Date().toISOString(),
    distance: 14000,
    proBonoAvailable: true,
    slidingScale: false,
    civilRightsSpecializations: ['Constitutional Law', 'Voting Rights', 'Employment Discrimination'],
    immigrationSpecializations: []
  }
];

/**
 * API Error Handling with graceful degradation
 * Feature Set 9: API Error Handling
 */
export class APIErrorHandler {
  private static instance: APIErrorHandler;
  private errorState: ErrorState = {
    hasError: false,
    errorMessage: '',
    errorType: 'unknown',
    retryCount: 0,
    lastErrorTime: 0
  };

  private loadingState: LoadingState = {
    isLoading: false,
    loadingMessage: '',
    progress: 0
  };

  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  static getInstance(): APIErrorHandler {
    if (!APIErrorHandler.instance) {
      APIErrorHandler.instance = new APIErrorHandler();
    }
    return APIErrorHandler.instance;
  }

  /**
   * Handle API errors with appropriate fallbacks
   */
  handleAPIError(error: any, context: string): ProcessedAttorney[] {
    console.error(`❌ API Error in ${context}:`, error);
    
    this.errorState = {
      hasError: true,
      errorMessage: this.getErrorMessage(error),
      errorType: this.getErrorType(error),
      retryCount: this.errorState.retryCount + 1,
      lastErrorTime: Date.now()
    };

    // Log error for monitoring
    this.logError(error, context);

    // Return fallback data if we have retries left
    if (this.errorState.retryCount <= this.maxRetries) {
      console.log(`⚠️ Returning fallback data (attempt ${this.errorState.retryCount}/${this.maxRetries})`);
      return this.getFallbackData();
    }

    // If we've exhausted retries, return empty array
    console.log('❌ All retry attempts exhausted, returning empty results');
    return [];
  }

  /**
   * Get appropriate error message based on error type
   */
  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'No attorneys found in this area. Please try expanding your search radius.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'An error occurred while searching for attorneys. Please try again.';
  }

  /**
   * Determine error type for appropriate handling
   */
  private getErrorType(error: any): 'api' | 'network' | 'timeout' | 'validation' | 'unknown' {
    if (error.status) {
      return 'api';
    }
    if (error.message?.includes('network')) {
      return 'network';
    }
    if (error.message?.includes('timeout')) {
      return 'timeout';
    }
    if (error.message?.includes('validation')) {
      return 'validation';
    }
    return 'unknown';
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: any, context: string): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      errorType: this.errorState.errorType,
      errorMessage: error.message || 'Unknown error',
      status: error.status,
      retryCount: this.errorState.retryCount,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };

    console.log('📊 Error Log:', errorLog);
    
    // In a production app, this would be sent to an error monitoring service
    // like Sentry, LogRocket, or a custom error tracking system
  }

  /**
   * Get fallback attorney data for offline scenarios
   * Feature Set 9: Fallback Data
   */
  getFallbackData(): ProcessedAttorney[] {
    console.log('🔄 Using fallback attorney data');
    return [...FALLBACK_ATTORNEYS];
  }

  /**
   * Reset error state after successful operation
   */
  resetErrorState(): void {
    this.errorState = {
      hasError: false,
      errorMessage: '',
      errorType: 'unknown',
      retryCount: 0,
      lastErrorTime: 0
    };
  }

  /**
   * Get current error state
   */
  getErrorState(): ErrorState {
    return { ...this.errorState };
  }

  /**
   * Set loading state
   * Feature Set 9: Loading States
   */
  setLoadingState(isLoading: boolean, message: string = '', progress?: number): void {
    this.loadingState = {
      isLoading,
      loadingMessage: message,
      progress
    };
  }

  /**
   * Get current loading state
   */
  getLoadingState(): LoadingState {
    return { ...this.loadingState };
  }

  /**
   * Retry mechanism for failed API calls
   * Feature Set 9: Retry Mechanisms
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`❌ Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if we should retry based on error type
   */
  shouldRetry(error: any): boolean {
    const retryableErrors = [
      'network',
      'timeout',
      'api' // Only retry 5xx errors, not 4xx
    ];

    if (error.status && error.status >= 400 && error.status < 500) {
      return false; // Don't retry client errors (4xx)
    }

    return retryableErrors.includes(this.getErrorType(error));
  }

  /**
   * Get user-friendly error message for display
   */
  getUserFriendlyMessage(): string {
    if (!this.errorState.hasError) {
      return '';
    }

    const messages = {
      api: 'Unable to connect to attorney database. Please try again.',
      network: 'Network connection issue. Please check your internet connection.',
      timeout: 'Request is taking longer than expected. Please try again.',
      validation: 'Invalid search parameters. Please adjust your search.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    return messages[this.errorState.errorType] || messages.unknown;
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = APIErrorHandler.getInstance();

/**
 * Utility function to handle API calls with error handling
 */
export async function safeAPICall<T>(
  apiCall: () => Promise<T>,
  context: string,
  fallback: T
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: unknown) {
    console.error(`❌ Error in ${context}:`, error instanceof Error ? error.message : String(error));
    return fallback;
  }
}

/**
 * Utility function to show loading state during API calls
 */
export async function withLoadingState<T>(
  operation: () => Promise<T>,
  loadingMessage: string
): Promise<T> {
  const handler = APIErrorHandler.getInstance();
  
  try {
    handler.setLoadingState(true, loadingMessage);
    const result = await operation();
    handler.setLoadingState(false);
    handler.resetErrorState();
    return result;
  } catch (error) {
    handler.setLoadingState(false);
    throw error;
  }
}

export default {
  APIErrorHandler,
  errorHandler,
  safeAPICall,
  withLoadingState,
  FALLBACK_ATTORNEYS
}; 