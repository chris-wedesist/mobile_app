/**
 * Production-ready CAPTCHA verification endpoint
 * 
 * This endpoint provides secure server-side verification of reCAPTCHA tokens
 * and integrates with the mobile app's security system.
 */

import { Request, Response } from 'express';
import { verifyCaptchaToken, verifyWithSecurityChecks } from '../../lib/security/captchaVerification';
import { incidentReportLimiter } from '../../lib/security/rateLimiter';

export interface CaptchaVerificationRequest {
  token: string;
  action?: string;
  deviceId?: string;
  incidentData?: {
    description: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
  };
}

export interface CaptchaVerificationResponse {
  success: boolean;
  score?: number;
  error?: string;
  rateLimitInfo?: {
    remainingAttempts: number;
    resetTime: string;
  };
}

/**
 * Main CAPTCHA verification endpoint
 * Handles both standalone verification and integrated incident reporting
 */
export async function verifyCaptchaEndpoint(
  req: Request<{}, CaptchaVerificationResponse, CaptchaVerificationRequest>,
  res: Response<CaptchaVerificationResponse>
): Promise<void> {
  try {
    const { token, action, deviceId, incidentData } = req.body;

    // Validate required fields
    if (!token) {
      res.status(400).json({
        success: false,
        error: 'CAPTCHA token is required'
      });
      return;
    }

    // Verify CAPTCHA token
    const captchaResult = await verifyWithSecurityChecks(
      token,
      action,
      0.5, // minimum score for reCAPTCHA v3
      req.ip
    );

    if (!captchaResult.success) {
      res.status(400).json({
        success: false,
        error: captchaResult.reason || 'CAPTCHA verification failed'
      });
      return;
    }

    // If this is an incident report, check rate limits and process
    if (incidentData && deviceId) {
      const canSubmit = await incidentReportLimiter.canPerformAction(deviceId);
      
      if (!canSubmit) {
        const resetTime = await incidentReportLimiter.getResetTime(deviceId);
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded for incident reports',
          rateLimitInfo: {
            remainingAttempts: 0,
            resetTime: resetTime.toISOString()
          }
        });
        return;
      }

      // Process the incident report
      await processIncidentReport(incidentData, deviceId, req.ip, captchaResult.score);
      
      // Record the rate limit action
      await incidentReportLimiter.recordAction(deviceId);
      
      // Get updated rate limit info
      const remainingAttempts = await incidentReportLimiter.getRemainingAttempts(deviceId);
      const resetTime = await incidentReportLimiter.getResetTime(deviceId);

      res.json({
        success: true,
        score: captchaResult.score,
        rateLimitInfo: {
          remainingAttempts,
          resetTime: resetTime.toISOString()
        }
      });
    } else {
      // Standalone CAPTCHA verification
      res.json({
        success: true,
        score: captchaResult.score
      });
    }

  } catch (error) {
    console.error('CAPTCHA verification endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Process and store incident report
 */
async function processIncidentReport(
  incidentData: NonNullable<CaptchaVerificationRequest['incidentData']>,
  deviceId: string,
  clientIP: string,
  captchaScore?: number
): Promise<void> {
  // TODO: Replace with your actual database/storage logic
  console.log('Processing incident report:', {
    description: incidentData.description,
    severity: incidentData.severity || 'medium',
    category: incidentData.category || 'general',
    deviceId,
    clientIP,
    captchaScore,
    timestamp: new Date().toISOString(),
    verified: true
  });

  // Example: Save to database
  // await database.incidents.create({
  //   description: incidentData.description,
  //   severity: incidentData.severity || 'medium',
  //   category: incidentData.category || 'general',
  //   device_id: deviceId,
  //   client_ip: clientIP,
  //   captcha_score: captchaScore,
  //   verified_human: true,
  //   created_at: new Date()
  // });
}

/**
 * Middleware to log security events
 */
export function logSecurityEvent(
  req: Request,
  res: Response,
  next: Function
): void {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const securityEvent = {
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      method: req.method,
      clientIP: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400
    };
    
    console.log('Security event:', securityEvent);
    
    // TODO: Save to security logs database
    // await database.securityEvents.create(securityEvent);
  });
  
  next();
}

/**
 * Rate limiting middleware for the API endpoint
 */
export function apiRateLimitMiddleware(
  req: Request,
  res: Response,
  next: Function
): void {
  // TODO: Implement API-level rate limiting
  // This is separate from the incident report rate limiting
  // and protects against general API abuse
  
  const clientIP = req.ip;
  const now = Date.now();
  
  // Simple in-memory rate limiting (replace with Redis in production)
  if (!global.apiRateLimit) {
    global.apiRateLimit = new Map();
  }
  
  const key = `api_${clientIP}`;
  const requests = global.apiRateLimit.get(key) || [];
  const oneMinuteAgo = now - 60000;
  
  // Remove old requests
  const recentRequests = requests.filter((timestamp: number) => timestamp > oneMinuteAgo);
  
  if (recentRequests.length >= 30) { // 30 requests per minute
    res.status(429).json({
      success: false,
      error: 'API rate limit exceeded. Please try again later.'
    });
    return;
  }
  
  recentRequests.push(now);
  global.apiRateLimit.set(key, recentRequests);
  
  next();
}
