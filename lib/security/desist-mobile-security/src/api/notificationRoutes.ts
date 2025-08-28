/**
 * Push Notification API Endpoints
 * Handles device registration, notification sending, and token management
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { PushToken, NotificationData } from '../notifications/NotificationService';

interface DeviceRegistration {
  pushToken: PushToken;
  userId?: string;
  preferences?: any;
}

interface NotificationJob {
  id: string;
  targetDevices: string[];
  notification: NotificationData;
  scheduledFor?: Date;
  status: 'pending' | 'sending' | 'completed' | 'failed';
  createdAt: Date;
  results?: {
    sent: number;
    failed: number;
    errors: string[];
  };
}

// Mock database - in production, use actual database
const registeredDevices = new Map<string, DeviceRegistration>();
const notificationJobs = new Map<string, NotificationJob>();

const router = express.Router();

// Rate limiting for notification endpoints
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many notification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 registration requests per minute
  message: 'Too many registration requests, please try again later',
});

// Apply rate limiting
router.use(notificationRateLimit);

/**
 * Register device for push notifications
 * POST /api/notifications/register
 */
router.post('/register',
  registrationRateLimit,
  [
    body('token').isString().isLength({ min: 10 }).withMessage('Valid push token required'),
    body('platform').isIn(['ios', 'android', 'web']).withMessage('Valid platform required'),
    body('deviceId').isString().isLength({ min: 5 }).withMessage('Valid device ID required'),
    body('appVersion').isString().isLength({ min: 1 }).withMessage('App version required'),
  ],
  async (req, res) => {
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
        token: req.body.token,
        platform: req.body.platform,
        deviceId: req.body.deviceId,
        appVersion: req.body.appVersion,
        registeredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const registration: DeviceRegistration = {
        pushToken,
        userId: req.body.userId,
        preferences: req.body.preferences
      };

      // Store device registration
      registeredDevices.set(pushToken.deviceId, registration);

      console.log(`Device registered: ${pushToken.platform} - ${pushToken.deviceId}`);

      res.json({
        success: true,
        message: 'Device registered successfully',
        deviceId: pushToken.deviceId
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }
);

/**
 * Unregister device from push notifications
 * POST /api/notifications/unregister
 */
router.post('/unregister',
  [
    body('deviceId').isString().isLength({ min: 5 }).withMessage('Valid device ID required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { deviceId } = req.body;
      
      if (registeredDevices.has(deviceId)) {
        registeredDevices.delete(deviceId);
        console.log(`Device unregistered: ${deviceId}`);
        
        res.json({
          success: true,
          message: 'Device unregistered successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

    } catch (error) {
      console.error('Unregistration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during unregistration'
      });
    }
  }
);

/**
 * Send notification to specific devices
 * POST /api/notifications/send
 */
router.post('/send',
  [
    body('notification.type').isIn(['incident_alert', 'report_update', 'emergency', 'safety_alert', 'system_update', 'marketing'])
      .withMessage('Valid notification type required'),
    body('notification.title').isString().isLength({ min: 1, max: 100 }).withMessage('Title required (1-100 characters)'),
    body('notification.body').isString().isLength({ min: 1, max: 500 }).withMessage('Body required (1-500 characters)'),
    body('notification.priority').isIn(['low', 'normal', 'high', 'critical']).withMessage('Valid priority required'),
    body('targetDevices').optional().isArray().withMessage('Target devices must be an array'),
    body('userId').optional().isString().withMessage('User ID must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { notification, targetDevices, userId, scheduledFor } = req.body;
      
      // Determine target devices
      let devices: string[] = [];
      
      if (targetDevices) {
        devices = targetDevices;
      } else if (userId) {
        // Find devices for specific user
        for (const [deviceId, registration] of registeredDevices.entries()) {
          if (registration.userId === userId) {
            devices.push(deviceId);
          }
        }
      } else {
        // Send to all devices (broadcast)
        devices = Array.from(registeredDevices.keys());
      }

      if (devices.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No target devices found'
        });
      }

      // Create notification job
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const job: NotificationJob = {
        id: jobId,
        targetDevices: devices,
        notification,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        status: 'pending',
        createdAt: new Date()
      };

      notificationJobs.set(jobId, job);

      // Process notification (in production, this would be queued)
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        processNotificationJob(jobId);
      }

      res.json({
        success: true,
        message: 'Notification queued successfully',
        jobId,
        targetDeviceCount: devices.length
      });

    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during notification send'
      });
    }
  }
);

/**
 * Send emergency notification to all devices
 * POST /api/notifications/emergency
 */
router.post('/emergency',
  [
    body('title').isString().isLength({ min: 1, max: 100 }).withMessage('Title required (1-100 characters)'),
    body('body').isString().isLength({ min: 1, max: 500 }).withMessage('Body required (1-500 characters)'),
    body('data').optional().isObject().withMessage('Data must be an object'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, body, data } = req.body;

      const emergencyNotification: NotificationData = {
        type: 'emergency',
        title,
        body,
        data: {
          isEmergency: true,
          timestamp: new Date().toISOString(),
          ...data
        },
        priority: 'critical',
        sound: 'emergency_alert.wav'
      };

      // Get all registered devices
      const allDevices = Array.from(registeredDevices.keys());

      if (allDevices.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No registered devices found'
        });
      }

      // Create emergency notification job
      const jobId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const job: NotificationJob = {
        id: jobId,
        targetDevices: allDevices,
        notification: emergencyNotification,
        status: 'pending',
        createdAt: new Date()
      };

      notificationJobs.set(jobId, job);

      // Process immediately (emergency notifications have highest priority)
      processNotificationJob(jobId);

      console.log(`Emergency notification sent to ${allDevices.length} devices`);

      res.json({
        success: true,
        message: 'Emergency notification sent successfully',
        jobId,
        targetDeviceCount: allDevices.length
      });

    } catch (error) {
      console.error('Emergency notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during emergency notification'
      });
    }
  }
);

/**
 * Get notification job status
 * GET /api/notifications/job/:jobId
 */
router.get('/job/:jobId',
  [
    param('jobId').isString().isLength({ min: 5 }).withMessage('Valid job ID required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { jobId } = req.params;
      const job = notificationJobs.get(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Notification job not found'
        });
      }

      res.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          targetDeviceCount: job.targetDevices.length,
          createdAt: job.createdAt,
          scheduledFor: job.scheduledFor,
          results: job.results
        }
      });

    } catch (error) {
      console.error('Get job status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * Get registered device statistics
 * GET /api/notifications/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const totalDevices = registeredDevices.size;
    const platformStats = { ios: 0, android: 0, web: 0 };
    
    for (const registration of registeredDevices.values()) {
      platformStats[registration.pushToken.platform]++;
    }

    const activeJobs = Array.from(notificationJobs.values())
      .filter(job => job.status === 'pending' || job.status === 'sending').length;

    res.json({
      success: true,
      stats: {
        totalDevices,
        platformBreakdown: platformStats,
        activeJobs,
        totalJobs: notificationJobs.size
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Process notification job (mock implementation)
 * In production, this would integrate with actual push notification services
 */
async function processNotificationJob(jobId: string): Promise<void> {
  const job = notificationJobs.get(jobId);
  if (!job) return;

  job.status = 'sending';
  
  try {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Mock sending notifications to each device
    for (const deviceId of job.targetDevices) {
      const registration = registeredDevices.get(deviceId);
      if (!registration) {
        failed++;
        errors.push(`Device ${deviceId} not found`);
        continue;
      }

      try {
        // Mock push notification sending
        // In production, this would call FCM, APNS, or Expo Push API
        await mockSendPushNotification(registration.pushToken, job.notification);
        sent++;
        console.log(`Notification sent to device: ${deviceId}`);
      } catch (error) {
        failed++;
        errors.push(`Failed to send to ${deviceId}: ${error}`);
        console.error(`Failed to send notification to ${deviceId}:`, error);
      }
    }

    job.status = 'completed';
    job.results = { sent, failed, errors };

    console.log(`Notification job ${jobId} completed: ${sent} sent, ${failed} failed`);

  } catch (error) {
    job.status = 'failed';
    job.results = { sent: 0, failed: job.targetDevices.length, errors: [String(error)] };
    console.error(`Notification job ${jobId} failed:`, error);
  }
}

/**
 * Mock push notification sending
 * In production, integrate with FCM, APNS, or Expo Push API
 */
async function mockSendPushNotification(pushToken: PushToken, notification: NotificationData): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock success rate (95% success in this simulation)
  if (Math.random() < 0.05) {
    throw new Error('Mock network error');
  }

  // In production, you would call the appropriate push service:
  // - For Expo: Expo Push API
  // - For native: FCM for Android, APNS for iOS
  console.log(`Mock push notification sent to ${pushToken.platform} device:`, {
    token: pushToken.token.substring(0, 20) + '...',
    title: notification.title,
    body: notification.body,
    priority: notification.priority
  });
}

export default router;
