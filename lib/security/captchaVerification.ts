/**
 * Server-side reCAPTCHA verification utility
 * 
 * This module provides functions to verify CAPTCHA tokens on the server side
 * using the secret key for secure validation.
 */

import { securityConfig } from './securityConfig';

export interface CaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

/**
 * Verify a reCAPTCHA token with Google's verification API
 * This should be called from your backend/server, not from the mobile app directly
 */
export async function verifyCaptchaToken(
  token: string,
  remoteip?: string
): Promise<CaptchaVerificationResult> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: securityConfig.captcha.secretKey,
        response: token,
        ...(remoteip && { remoteip }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CaptchaVerificationResult = await response.json();
    return result;
  } catch (error) {
    console.error('CAPTCHA verification failed:', error);
    return {
      success: false,
      error_codes: ['network-error']
    };
  }
}

/**
 * Verify CAPTCHA token with additional security checks
 */
export async function verifyWithSecurityChecks(
  token: string,
  expectedAction?: string,
  minimumScore: number = 0.5,
  remoteip?: string
): Promise<{
  success: boolean;
  score?: number;
  reason?: string;
}> {
  const result = await verifyCaptchaToken(token, remoteip);

  if (!result.success) {
    return {
      success: false,
      reason: `CAPTCHA verification failed: ${result.error_codes?.join(', ') || 'unknown error'}`
    };
  }

  // Check action if specified (for reCAPTCHA v3)
  if (expectedAction && result.action !== expectedAction) {
    return {
      success: false,
      reason: `Action mismatch: expected ${expectedAction}, got ${result.action}`
    };
  }

  // Check score if available (for reCAPTCHA v3)
  if (result.score !== undefined && result.score < minimumScore) {
    return {
      success: false,
      score: result.score,
      reason: `Score too low: ${result.score} < ${minimumScore}`
    };
  }

  return {
    success: true,
    score: result.score
  };
}

/**
 * Create a server endpoint handler for CAPTCHA verification
 * Example usage with Express.js:
 * 
 * app.post('/api/verify-captcha', handleCaptchaVerification);
 */
export function handleCaptchaVerification(req: any, res: any) {
  return async function(req: any, res: any) {
    try {
      const { token, action, remoteip } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'CAPTCHA token is required'
        });
      }

      const result = await verifyWithSecurityChecks(
        token,
        action,
        0.5, // minimum score
        remoteip || req.ip
      );

      if (result.success) {
        res.json({
          success: true,
          score: result.score
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.reason
        });
      }
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

/**
 * Utility to validate CAPTCHA configuration
 */
export function validateCaptchaConfig(): string[] {
  const errors: string[] = [];

  if (!securityConfig.captcha.secretKey) {
    errors.push('CAPTCHA secret key is not configured');
  }

  if (!securityConfig.captcha.siteKey) {
    errors.push('CAPTCHA site key is not configured');
  }

  if (securityConfig.captcha.secretKey === securityConfig.captcha.siteKey) {
    errors.push('CAPTCHA secret key and site key should be different');
  }

  return errors;
}
