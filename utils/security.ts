/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param input The user input to sanitize
 * @returns Sanitized input string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  let sanitized = input.trim();
  
  // Encode HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
};

/**
 * Validates an email address format
 * @param email Email address to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with validation result and reason
 */
export const validatePassword = (password: string): { valid: boolean; reason?: string } => {
  if (!password) {
    return { valid: false, reason: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters' };
  }
  
  // Check for at least one uppercase letter, one lowercase letter, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return { 
      valid: false, 
      reason: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { valid: true };
};

/**
 * Returns a secure error message that doesn't leak sensitive information
 * @param error The original error object
 * @returns A user-friendly error message
 */
export const getSecureErrorMessage = (error: any): string => {
  // Default generic message
  let message = 'An error occurred during authentication. Please try again.';
  
  if (!error) return message;
  
  // Map specific error codes to user-friendly messages
  const errorCode = error.code || '';
  
  switch (errorCode) {
    case 'INVALID_LOGIN_CREDENTIALS':
    case 'INVALID_PASSWORD':
      message = 'Invalid email or password';
      break;
    case 'TOO_MANY_ATTEMPTS':
      message = 'Too many login attempts. Please try again later.';
      break;
    case 'INVALID_CSRF':
      message = 'Security validation failed. Please refresh the page and try again.';
      break;
    case 'USER_NOT_FOUND':
      // Use same message as invalid credentials to prevent user enumeration
      message = 'Invalid email or password';
      break;
    case 'CAPTCHA_INVALID':
      message = 'CAPTCHA verification failed. Please try again.';
      break;
    case 'ACCOUNT_LOCKED':
      message = 'Your account has been temporarily locked. Please contact support.';
      break;
    default:
      // For unknown errors, keep the generic message
      break;
  }
  
  return message;
};

/**
 * Logs authentication failures for security monitoring
 * @param data Information about the failed authentication attempt
 */
export const logAuthenticationFailure = async (data: {
  email: string;
  errorCode: string;
  timestamp: string;
}): Promise<void> => {
  try {
    // In a real implementation, this would log to a secure audit log
    console.error('Authentication failure:', {
      email: data.email.substring(0, 3) + '***', // Mask email for privacy
      errorCode: data.errorCode,
      timestamp: data.timestamp
    });
    
    // Could also send to a security monitoring service or database
  } catch (error) {
    // Fail silently - logging errors shouldn't affect the user experience
    console.error('Error logging authentication failure:', error);
  }
};