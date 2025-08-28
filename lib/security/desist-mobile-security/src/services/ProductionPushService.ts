/**
 * Production Push Notification Service
 * Integrates with Expo Push API, FCM, and APNS for production notification delivery
 */

import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { configManager } from '../config/ConfigManager';
// Local interface definitions to avoid import issues
interface NotificationData {
  type: 'incident_alert' | 'report_update' | 'emergency' | 'safety_alert' | 'system_update' | 'marketing';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  badge?: number;
}

interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  appVersion: string;
  registeredAt: string;
  lastUpdated: string;
}

interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  receipt?: ExpoPushReceipt;
}

interface BatchNotificationResult {
  totalSent: number;
  successful: number;
  failed: number;
  errors: string[];
  tickets: ExpoPushTicket[];
}

export class ProductionPushService {
  private expo: Expo;
  private config = configManager.getNotificationConfig();

  constructor() {
    // Initialize Expo push service
    this.expo = new Expo({
      accessToken: this.config.expo.accessToken,
      useFcmV1: true, // Use FCM v1 API
    });
  }

  /**
   * Send notification to a single device
   */
  async sendToDevice(
    pushToken: PushToken,
    notification: NotificationData
  ): Promise<PushNotificationResult> {
    try {
      if (!Expo.isExpoPushToken(pushToken.token)) {
        return {
          success: false,
          error: `Invalid Expo push token: ${pushToken.token}`,
        };
      }

      const message: ExpoPushMessage = {
        to: pushToken.token,
        sound: notification.sound === 'default' ? 'default' : notification.sound,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
        priority: this.mapPriorityToExpo(notification.priority),
        channelId: this.getChannelId(notification.type),
        categoryId: notification.type,
        mutableContent: notification.type === 'emergency',
        _contentAvailable: notification.priority === 'critical',
      };

      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (ticket.status === 'error') {
        return {
          success: false,
          error: `Push notification failed: ${ticket.message}`,
        };
      }

      return {
        success: true,
        messageId: ticket.id,
      };

    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: `Send failed: ${error}`,
      };
    }
  }

  /**
   * Send notifications to multiple devices (batch processing)
   */
  async sendBatchNotifications(
    pushTokens: PushToken[],
    notification: NotificationData
  ): Promise<BatchNotificationResult> {
    const result: BatchNotificationResult = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      errors: [],
      tickets: [],
    };

    try {
      // Filter valid Expo push tokens
      const validTokens = pushTokens.filter(token => 
        Expo.isExpoPushToken(token.token)
      );

      const invalidTokenCount = pushTokens.length - validTokens.length;
      if (invalidTokenCount > 0) {
        result.errors.push(`${invalidTokenCount} invalid push tokens filtered out`);
      }

      if (validTokens.length === 0) {
        result.errors.push('No valid push tokens found');
        return result;
      }

      // Create messages for batch sending
      const messages: ExpoPushMessage[] = validTokens.map(token => ({
        to: token.token,
        sound: notification.sound === 'default' ? 'default' : notification.sound,
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          deviceId: token.deviceId,
          platform: token.platform,
        },
        badge: notification.badge,
        priority: this.mapPriorityToExpo(notification.priority),
        channelId: this.getChannelId(notification.type),
        categoryId: notification.type,
        mutableContent: notification.type === 'emergency',
        _contentAvailable: notification.priority === 'critical',
      }));

      // Send in chunks to avoid rate limits
      const chunks = this.expo.chunkPushNotifications(messages);
      
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          result.tickets.push(...tickets);
          result.totalSent += chunk.length;

          // Count successful vs failed
          for (const ticket of tickets) {
            if (ticket.status === 'ok') {
              result.successful++;
            } else {
              result.failed++;
              result.errors.push(`Ticket error: ${ticket.message}`);
            }
          }

        } catch (error) {
          result.failed += chunk.length;
          result.errors.push(`Chunk send failed: ${error}`);
          console.error('Error sending notification chunk:', error);
        }

        // Add delay between chunks to respect rate limits
        await this.delay(100);
      }

      return result;

    } catch (error) {
      result.errors.push(`Batch send failed: ${error}`);
      console.error('Error in batch notification send:', error);
      return result;
    }
  }

  /**
   * Send emergency notification with highest priority
   */
  async sendEmergencyNotification(
    pushTokens: PushToken[],
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<BatchNotificationResult> {
    const emergencyNotification: NotificationData = {
      type: 'emergency',
      title,
      body,
      data: {
        isEmergency: true,
        timestamp: new Date().toISOString(),
        ...data,
      },
      priority: 'critical',
      sound: 'emergency_alert',
    };

    return this.sendBatchNotifications(pushTokens, emergencyNotification);
  }

  /**
   * Check receipt status for sent notifications
   */
  async checkNotificationReceipts(receiptIds: string[]): Promise<ExpoPushReceipt[]> {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts: ExpoPushReceipt[] = [];

      for (const chunk of receiptIdChunks) {
        try {
          const chunkReceipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          receipts.push(...Object.values(chunkReceipts));
        } catch (error) {
          console.error('Error fetching receipt chunk:', error);
        }
      }

      return receipts;
    } catch (error) {
      console.error('Error checking notification receipts:', error);
      return [];
    }
  }

  /**
   * Validate push token format and test delivery
   */
  async validatePushToken(token: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!Expo.isExpoPushToken(token)) {
        return { valid: false, error: 'Invalid Expo push token format' };
      }

      // Send a test notification to validate token
      const testMessage: ExpoPushMessage = {
        to: token,
        title: 'DESIST! Token Validation',
        body: 'Your device is successfully registered for notifications',
        data: { test: true },
        sound: 'default',
        priority: 'normal',
      };

      const tickets = await this.expo.sendPushNotificationsAsync([testMessage]);
      const ticket = tickets[0];

      if (ticket.status === 'error') {
        return { valid: false, error: ticket.message };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: `Validation failed: ${error}` };
    }
  }

  /**
   * Get push service statistics
   */
  async getServiceStats(): Promise<{
    serviceName: string;
    isConfigured: boolean;
    hasAccessToken: boolean;
    apiVersion: string;
  }> {
    return {
      serviceName: 'Expo Push Service',
      isConfigured: !!this.config.expo.projectId,
      hasAccessToken: !!this.config.expo.accessToken,
      apiVersion: 'v2',
    };
  }

  /**
   * Map notification priority to Expo priority
   */
  private mapPriorityToExpo(priority: NotificationData['priority']): 'default' | 'normal' | 'high' {
    switch (priority) {
      case 'low':
      case 'normal':
        return 'normal';
      case 'high':
      case 'critical':
        return 'high';
      default:
        return 'default';
    }
  }

  /**
   * Get notification channel ID based on type
   */
  private getChannelId(type: NotificationData['type']): string {
    switch (type) {
      case 'emergency':
        return 'emergency_alerts';
      case 'incident_alert':
        return 'incident_notifications';
      case 'safety_alert':
        return 'safety_notifications';
      case 'report_update':
        return 'report_updates';
      case 'system_update':
        return 'system_notifications';
      case 'marketing':
        return 'marketing_notifications';
      default:
        return 'default';
    }
  }

  /**
   * Utility function to add delays between batch operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up invalid tokens from a list
   */
  filterValidTokens(pushTokens: PushToken[]): {
    valid: PushToken[];
    invalid: PushToken[];
  } {
    const valid: PushToken[] = [];
    const invalid: PushToken[] = [];

    for (const token of pushTokens) {
      if (Expo.isExpoPushToken(token.token)) {
        valid.push(token);
      } else {
        invalid.push(token);
      }
    }

    return { valid, invalid };
  }

  /**
   * Handle push notification errors and determine retry logic
   */
  shouldRetryPushError(error: any): boolean {
    // Retry on temporary network errors
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') {
      return true;
    }

    // Retry on rate limit errors
    if (error?.code === 'RATE_LIMIT_EXCEEDED') {
      return true;
    }

    // Don't retry on permanent errors
    if (error?.code === 'DEVICE_NOT_REGISTERED' || error?.code === 'INVALID_CREDENTIALS') {
      return false;
    }

    return false;
  }
}

export const productionPushService = new ProductionPushService();
