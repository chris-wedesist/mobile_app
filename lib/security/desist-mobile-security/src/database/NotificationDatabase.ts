/**
 * Database models and operations for push notifications
 * Production-ready database integration with proper indexing and relationships
 */

export interface DeviceRegistrationRecord {
  id: string;
  userId?: string;
  deviceId: string;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  isActive: boolean;
  registeredAt: Date;
  lastUpdated: Date;
  lastSeenAt?: Date;
  preferences?: NotificationPreferencesRecord;
}

export interface NotificationPreferencesRecord {
  id: string;
  deviceId: string;
  incidentAlerts: boolean;
  reportUpdates: boolean;
  emergencyNotifications: boolean;
  safetyAlerts: boolean;
  systemUpdates: boolean;
  marketing: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;   // HH:MM format
  updatedAt: Date;
}

export interface NotificationLogRecord {
  id: string;
  deviceId: string;
  userId?: string;
  notificationType: string;
  title: string;
  body: string;
  priority: string;
  status: 'sent' | 'delivered' | 'failed' | 'expired';
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  messageId?: string;
  receiptId?: string;
  metadata?: Record<string, unknown>;
}

export interface ComplianceEventRecord {
  id: string;
  deviceId?: string;
  userId?: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Database operations for push notification system
 * This is a TypeScript interface definition - implement with your preferred database (PostgreSQL, MongoDB, etc.)
 */
export interface NotificationDatabase {
  // Device Registration Operations
  registerDevice(registration: Omit<DeviceRegistrationRecord, 'id' | 'registeredAt' | 'lastUpdated'>): Promise<DeviceRegistrationRecord>;
  updateDevice(deviceId: string, updates: Partial<DeviceRegistrationRecord>): Promise<DeviceRegistrationRecord | null>;
  getDevice(deviceId: string): Promise<DeviceRegistrationRecord | null>;
  getDeviceByToken(pushToken: string): Promise<DeviceRegistrationRecord | null>;
  getDevicesByUser(userId: string): Promise<DeviceRegistrationRecord[]>;
  getActiveDevices(limit?: number): Promise<DeviceRegistrationRecord[]>;
  deactivateDevice(deviceId: string): Promise<boolean>;
  deleteDevice(deviceId: string): Promise<boolean>;

  // Notification Preferences Operations
  updatePreferences(deviceId: string, preferences: Omit<NotificationPreferencesRecord, 'id' | 'deviceId' | 'updatedAt'>): Promise<NotificationPreferencesRecord>;
  getPreferences(deviceId: string): Promise<NotificationPreferencesRecord | null>;

  // Notification Logging Operations
  logNotification(log: Omit<NotificationLogRecord, 'id' | 'sentAt'>): Promise<NotificationLogRecord>;
  updateNotificationStatus(id: string, status: NotificationLogRecord['status'], metadata?: Record<string, unknown>): Promise<boolean>;
  getNotificationHistory(deviceId: string, limit?: number): Promise<NotificationLogRecord[]>;
  getNotificationStats(startDate: Date, endDate: Date): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    byType: Record<string, number>;
    byPlatform: Record<string, number>;
  }>;

  // Compliance Logging Operations
  logComplianceEvent(event: Omit<ComplianceEventRecord, 'id' | 'timestamp'>): Promise<ComplianceEventRecord>;
  getComplianceEvents(deviceId?: string, userId?: string, eventType?: string, limit?: number): Promise<ComplianceEventRecord[]>;

  // Maintenance Operations
  cleanupExpiredTokens(expiredBeforeDays: number): Promise<number>;
  cleanupOldLogs(olderThanDays: number): Promise<number>;
  getHealthMetrics(): Promise<{
    totalActiveDevices: number;
    totalUsers: number;
    recentNotifications: number;
    errorRate: number;
  }>;
}

/**
 * SQL Database Implementation Example (PostgreSQL/MySQL)
 * This would be implemented based on your chosen database
 */
export const createDatabaseSchema = `
-- Device registrations table
CREATE TABLE IF NOT EXISTS device_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    push_token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    app_version VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP,
    
    CONSTRAINT unique_device_id UNIQUE (device_id),
    CONSTRAINT valid_platform CHECK (platform IN ('ios', 'android', 'web'))
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) REFERENCES device_registrations(device_id) ON DELETE CASCADE,
    incident_alerts BOOLEAN DEFAULT true,
    report_updates BOOLEAN DEFAULT true,
    emergency_notifications BOOLEAN DEFAULT true,
    safety_alerts BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_device_preferences UNIQUE (device_id)
);

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) NOT NULL,
    user_id UUID,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'expired')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    failure_reason TEXT,
    message_id VARCHAR(255),
    receipt_id VARCHAR(255),
    metadata JSONB,
    
    INDEX idx_device_sent (device_id, sent_at),
    INDEX idx_user_sent (user_id, sent_at),
    INDEX idx_status_sent (status, sent_at),
    INDEX idx_type_sent (notification_type, sent_at)
);

-- Compliance events table
CREATE TABLE IF NOT EXISTS compliance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255),
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    INDEX idx_device_timestamp (device_id, timestamp),
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_event_type_timestamp (event_type, timestamp)
);

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_registrations_active 
    ON device_registrations (is_active, last_updated) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_registrations_user 
    ON device_registrations (user_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_recent 
    ON notification_logs (sent_at DESC) WHERE sent_at > CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_registrations_update_timestamp
    BEFORE UPDATE ON device_registrations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER notification_preferences_update_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
`;

/**
 * MongoDB Schema Example
 */
export const mongoDBSchema = {
  deviceRegistrations: {
    _id: 'ObjectId',
    userId: 'ObjectId', // Reference to users collection
    deviceId: 'String (unique)',
    pushToken: 'String',
    platform: 'String (enum: ios, android, web)',
    appVersion: 'String',
    isActive: 'Boolean',
    registeredAt: 'Date',
    lastUpdated: 'Date',
    lastSeenAt: 'Date',
    preferences: {
      incidentAlerts: 'Boolean',
      reportUpdates: 'Boolean',
      emergencyNotifications: 'Boolean',
      safetyAlerts: 'Boolean',
      systemUpdates: 'Boolean',
      marketing: 'Boolean',
      quietHoursEnabled: 'Boolean',
      quietHoursStart: 'String',
      quietHoursEnd: 'String',
    }
  },
  notificationLogs: {
    _id: 'ObjectId',
    deviceId: 'String',
    userId: 'ObjectId',
    notificationType: 'String',
    title: 'String',
    body: 'String',
    priority: 'String',
    status: 'String (enum: sent, delivered, failed, expired)',
    sentAt: 'Date',
    deliveredAt: 'Date',
    failureReason: 'String',
    messageId: 'String',
    receiptId: 'String',
    metadata: 'Object'
  },
  complianceEvents: {
    _id: 'ObjectId',
    deviceId: 'String',
    userId: 'ObjectId',
    eventType: 'String',
    description: 'String',
    metadata: 'Object',
    timestamp: 'Date',
    ipAddress: 'String',
    userAgent: 'String'
  }
};

/**
 * Database indexes for optimal performance
 */
export const databaseIndexes = {
  deviceRegistrations: [
    { deviceId: 1 }, // Unique index
    { userId: 1, isActive: 1 },
    { isActive: 1, lastUpdated: 1 },
    { pushToken: 1 }, // For token lookups
  ],
  notificationLogs: [
    { deviceId: 1, sentAt: -1 },
    { userId: 1, sentAt: -1 },
    { status: 1, sentAt: -1 },
    { notificationType: 1, sentAt: -1 },
    { sentAt: -1 }, // For recent notifications
  ],
  complianceEvents: [
    { deviceId: 1, timestamp: -1 },
    { userId: 1, timestamp: -1 },
    { eventType: 1, timestamp: -1 },
    { timestamp: -1 }, // For time-based queries
  ]
};
