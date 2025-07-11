/**
 * Utility functions for CAPTCHA verification
 */

/**
 * Gets a CAPTCHA token for verification
 * @returns Promise resolving to a CAPTCHA token
 */
export const getCaptchaToken = async (): Promise<string> => {
  // In a real implementation, this would integrate with a CAPTCHA service
  // like reCAPTCHA or hCaptcha
  
  // For demo purposes, we'll return a mock token
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('mock-captcha-token-' + Math.random().toString(36).substring(2));
    }, 500);
  });
};

/**
 * Verifies a CAPTCHA token with the service
 * @param token The CAPTCHA token to verify
 * @returns Promise resolving to a boolean indicating if the token is valid
 */
export const verifyCaptchaToken = async (token: string): Promise<boolean> => {
  // In a real implementation, this would call the CAPTCHA service's API
  // to verify the token
  
  // For demo purposes, we'll simulate verification
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const isValid = Math.random() < 0.95;
      resolve(isValid);
    }, 300);
  });
};