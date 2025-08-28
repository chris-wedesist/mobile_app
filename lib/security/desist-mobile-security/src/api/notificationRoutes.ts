/**
 * Push Notification API Endpoints
 * Handles device registration, notification sending, and token management
 */

import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';

// Re-define interfaces locally to avoid import issues
interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  appVersion: string;
  registeredAt: string;
  lastUpdated: string;
}

interface NotificationData {
  type: 'incident_alert' | 'report_update' | 'emergency' | 'safety_alert' | 'system_update' | 'marketing';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  badge?: number;
}

interface NotificationPreferences {
  incidentAlerts: boolean;
  reportUpdates: boolean;
  emergencyNotifications: boolean;
  safetyAlerts: boolean;
  systemUpdates: boolean;
  marketing: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface DeviceRegistration {
  pushToken: PushToken;
  userId?: string;
  preferences?: NotificationPreferences;
}

// Mock database - in production, use actual database
const registeredDevices = new Map<string, DeviceRegistration>();

const router = express.Router();

// Rate limiting constants
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 100;

// Rate limiting for notification endpoints
const notificationRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many notification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
router.use(notificationRateLimit);

/**
 * Register device for push notifications
 * POST /api/notifications/register
 */
router.post('/register',
  [
    body('token').isString().isLength({ min: 10 }).withMessage('Valid push token required'),
    body('platform').isIn(['ios', 'android', 'web']).withMessage('Valid platform required'),
    body('deviceId').isString().isLength({ min: 5 }).withMessage('Valid device ID required'),
    body('appVersion').isString().isLength({ min: 1 }).withMessage('App version required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const pushToken: PushToken = {
        token: req.body.token as string,
        platform: req.body.platform as 'ios' | 'android' | 'web',
        deviceId: req.body.deviceId as string,
        appVersion: req.body.appVersion as string,
        registeredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Store device registration
      const registration: DeviceRegistration = {
        pushToken,
        userId: req.body.userId as string | undefined,
        preferences: req.body.preferences as NotificationPreferences | undefined
      };

      registeredDevices.set(pushToken.deviceId, registration);

      return res.status(200).json({
        success: true,
        message: 'Device registered successfully',
        data: {
          deviceId: pushToken.deviceId,
          registeredAt: pushToken.registeredAt
        }
      });

    } catch (error) {
      console.error('Device registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }
);

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalDevices = registeredDevices.size;
    
    const platformStats: Record<string, number> = {
      ios: 0,
      android: 0,
      web: 0
    };

    // Count devices by platform
    for (const registration of registeredDevices.values()) {
      const platform = registration.pushToken.platform;
      if (platform in platformStats) {
        platformStats[platform]++;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          byPlatform: platformStats
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

