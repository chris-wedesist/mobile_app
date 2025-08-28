/**
 * Comprehensive test suite for CAPTCHA verification endpoint
 */

import request from 'supertest';
import express from 'express';
import { verifyCaptchaEndpoint } from '../security/captcha-endpoint';

// Mock the verification functions
jest.mock('../../lib/security/captchaVerification', () => ({
  verifyWithSecurityChecks: jest.fn()
}));

jest.mock('../../lib/security/rateLimiter', () => ({
  incidentReportLimiter: {
    canPerformAction: jest.fn(),
    recordAction: jest.fn(),
    getRemainingAttempts: jest.fn(),
    getResetTime: jest.fn()
  }
}));

import { verifyWithSecurityChecks } from '../../lib/security/captchaVerification';
import { incidentReportLimiter } from '../../lib/security/rateLimiter';

const mockVerifyWithSecurityChecks = verifyWithSecurityChecks as jest.MockedFunction<typeof verifyWithSecurityChecks>;
const mockRateLimiter = incidentReportLimiter as jest.Mocked<typeof incidentReportLimiter>;

// Create test app
const app = express();
app.use(express.json());
app.post('/api/verify-captcha', verifyCaptchaEndpoint);

describe('CAPTCHA Verification Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic CAPTCHA verification', () => {
    it('should verify valid CAPTCHA token', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.8
      });

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-captcha-token',
          action: 'test_action'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        score: 0.8
      });
    });

    it('should reject invalid CAPTCHA token', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: false,
        reason: 'Invalid token'
      });

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'invalid-captcha-token'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should require CAPTCHA token', async () => {
      const response = await request(app)
        .post('/api/verify-captcha')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'CAPTCHA token is required'
      });
    });
  });

  describe('Incident report integration', () => {
    it('should process incident report with valid CAPTCHA and rate limit', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.9
      });
      
      mockRateLimiter.canPerformAction.mockResolvedValue(true);
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(2);
      mockRateLimiter.getResetTime.mockResolvedValue(new Date('2024-01-01T13:00:00Z'));

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-captcha-token',
          action: 'submit_incident',
          deviceId: 'device123',
          incidentData: {
            description: 'Security incident report',
            severity: 'medium'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        score: 0.9,
        rateLimitInfo: {
          remainingAttempts: 2,
          resetTime: '2024-01-01T13:00:00.000Z'
        }
      });

      expect(mockRateLimiter.recordAction).toHaveBeenCalledWith('device123');
    });

    it('should reject incident report when rate limit exceeded', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.9
      });
      
      mockRateLimiter.canPerformAction.mockResolvedValue(false);
      mockRateLimiter.getResetTime.mockResolvedValue(new Date('2024-01-01T13:00:00Z'));

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-captcha-token',
          deviceId: 'device123',
          incidentData: {
            description: 'Security incident report'
          }
        });

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        error: 'Rate limit exceeded for incident reports',
        rateLimitInfo: {
          remainingAttempts: 0,
          resetTime: '2024-01-01T13:00:00.000Z'
        }
      });

      expect(mockRateLimiter.recordAction).not.toHaveBeenCalled();
    });

    it('should reject incident report with invalid CAPTCHA', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: false,
        reason: 'Low score'
      });

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'low-score-token',
          deviceId: 'device123',
          incidentData: {
            description: 'Security incident report'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Low score'
      });

      expect(mockRateLimiter.canPerformAction).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      mockVerifyWithSecurityChecks.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-token'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should handle rate limiter errors', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.8
      });
      
      mockRateLimiter.canPerformAction.mockRejectedValue(new Error('Storage error'));

      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-token',
          deviceId: 'device123',
          incidentData: {
            description: 'Test incident'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('Security validation', () => {
    it('should validate incident data structure', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.8
      });

      // Test with missing description
      const response = await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'valid-token',
          deviceId: 'device123',
          incidentData: {
            severity: 'high'
            // missing description
          }
        });

      // Should still process (description validation would be in processIncidentReport)
      expect(mockVerifyWithSecurityChecks).toHaveBeenCalledWith(
        'valid-token',
        undefined,
        0.5,
        expect.any(String)
      );
    });

    it('should pass correct parameters to CAPTCHA verification', async () => {
      mockVerifyWithSecurityChecks.mockResolvedValue({
        success: true,
        score: 0.7
      });

      await request(app)
        .post('/api/verify-captcha')
        .send({
          token: 'test-token',
          action: 'custom_action'
        });

      expect(mockVerifyWithSecurityChecks).toHaveBeenCalledWith(
        'test-token',
        'custom_action',
        0.5,
        expect.any(String)
      );
    });
  });
});
