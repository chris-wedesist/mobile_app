// Define interfaces and mock service for compilation

// Define interfaces locally
export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'undetermined' | 'denied' | 'granted';
}

export interface NotificationPreferences {
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

export interface NotificationData {
  type: 'incident_alert' | 'report_update' | 'emergency' | 'safety_alert' | 'system_update' | 'marketing';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  sound?: string;
  badge?: number;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  appVersion: string;
  registeredAt: string;
  lastUpdated: string;
}

// Mock notification service for compilation
export const notificationService = {
  async initializeService(): Promise<boolean> {
    return true;
  },
  
  async initialize(): Promise<boolean> {
    return true;
  },
  
  isServiceInitialized(): boolean {
    return true;
  },
  
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    return {
      granted: false,
      canAskAgain: true,
      status: 'undetermined'
    };
  },
  
  async registerForPushNotifications(): Promise<PushToken | null> {
    return null;
  },
  
  async sendNotification(_data: NotificationData): Promise<boolean> {
    // Mock implementation - always returns false
    return false;
  },
  
  async sendLocalNotification(_data: NotificationData): Promise<boolean> {
    // Mock implementation - always returns false
    return false;
  },
  
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return {
      incidentAlerts: true,
      reportUpdates: true,
      emergencyNotifications: true,
      safetyAlerts: true,
      systemUpdates: true,
      marketing: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      }
    };
  },
  
  async updateNotificationPreferences(_preferences: Partial<NotificationPreferences>): Promise<boolean> {
    // Mock implementation - always returns true
    return true;
  }
};
