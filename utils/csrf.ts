import { v4 as uuidv4 } from 'uuid';

// In a real application, you would use a more secure storage mechanism
// and potentially a proper CSRF library like 'csrf'
const CSRF_TOKENS = new Map<string, { timestamp: number }>();

// Token expiration time (15 minutes)
const TOKEN_EXPIRATION = 15 * 60 * 1000;

/**
 * Generates a new CSRF token and stores it
 * @returns A new CSRF token
 */
export const generateCSRFToken = (): string => {
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  // Generate a new token
  const token = uuidv4();
  
  // Store the token with its creation timestamp
  CSRF_TOKENS.set(token, { timestamp: Date.now() });
  
  return token;
};

/**
 * Validates a CSRF token
 * @param token The token to validate
 * @returns Boolean indicating if the token is valid
 */
export const validateCSRFToken = (token: string): boolean => {
  if (!token) return false;
  
  const tokenData = CSRF_TOKENS.get(token);
  
  // Token doesn't exist
  if (!tokenData) return false;
  
  // Check if token has expired
  const isExpired = Date.now() - tokenData.timestamp > TOKEN_EXPIRATION;
  
  // If token is valid, remove it to prevent reuse
  if (!isExpired) {
    CSRF_TOKENS.delete(token);
    return true;
  }
  
  // Token has expired
  CSRF_TOKENS.delete(token);
  return false;
};

/**
 * Cleans up expired tokens to prevent memory leaks
 */
const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  
  CSRF_TOKENS.forEach((data, token) => {
    if (now - data.timestamp > TOKEN_EXPIRATION) {
      CSRF_TOKENS.delete(token);
    }
  });
};