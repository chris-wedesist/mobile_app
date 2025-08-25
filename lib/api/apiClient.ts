import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-production-server.com';
const API_TIMEOUT = 10000; // 10 seconds

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  message: string;
  deviceId: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  device: {
    deviceId: string;
    appVersion: string;
    platform: string;
    securityConfig?: any;
    isOnline: boolean;
    registeredAt?: string;
    lastSeen?: string;
  };
}

export interface DeviceRegistration {
  deviceId: string;
  appVersion: string;
  platform: 'ios' | 'android';
  securityConfig: any;
}

export interface SyncData {
  deviceId: string;
  timestamp: string;
  config: any;
  performanceMetrics: any;
  accessAttempts: number;
  isLockedOut: boolean;
}

export interface CommandData {
  id: string;
  command: 'activate' | 'deactivate' | 'wipe' | 'update_config' | 'report_status';
  parameters?: any;
  priority: 'low' | 'normal' | 'high';
  timestamp: string;
}

export interface StatusReportData {
  deviceId: string;
  isActive: boolean;
  lastActivationTime: string;
  performanceMetrics: any;
  accessAttempts: number;
  isLockedOut: boolean;
  timestamp: string;
}

class ApiClient {
  private deviceToken: string | null = null;
  private refreshToken: string | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens(): Promise<void> {
    try {
      this.deviceToken = await AsyncStorage.getItem('device_access_token');
      this.refreshToken = await AsyncStorage.getItem('device_refresh_token');
      this.deviceId = await AsyncStorage.getItem('device_id');
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  private async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem('device_access_token', accessToken);
      await AsyncStorage.setItem('device_refresh_token', refreshToken);
      this.deviceToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('device_access_token');
      await AsyncStorage.removeItem('device_refresh_token');
      this.deviceToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}/api${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (requireAuth && this.deviceToken) {
        headers['Authorization'] = `Bearer ${this.deviceToken}`;
      }

      if (this.deviceId) {
        headers['X-Device-ID'] = this.deviceId;
      }

      headers['X-App-Version'] = '1.0.0';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.status === 401 && requireAuth) {
        // Token expired, try to refresh
        const refreshResult = await this.refreshAccessToken();
        if (refreshResult.success) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.deviceToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          const retryData = await retryResponse.json();
          
          return {
            success: retryResponse.ok,
            data: retryResponse.ok ? retryData : undefined,
            error: retryResponse.ok ? undefined : retryData.message || 'Request failed',
            message: retryData.message,
          };
        } else {
          await this.clearTokens();
          return {
            success: false,
            error: 'Authentication failed',
            message: 'Please re-register your device',
          };
        }
      }

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Request failed',
        message: data.message,
      };
    } catch (error: any) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout' : 'Network error',
        message: error.message,
      };
    }
  }

  async registerDevice(registration: DeviceRegistration): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(registration),
      },
      false
    );

    if (response.success && response.data?.tokens) {
      await this.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      this.deviceId = registration.deviceId;
      await AsyncStorage.setItem('device_id', registration.deviceId);
    }

    return response;
  }

  async loginDevice(deviceId: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
      },
      false
    );

    if (response.success && response.data?.tokens) {
      await this.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      this.deviceId = deviceId;
      await AsyncStorage.setItem('device_id', deviceId);
    }

    return response;
  }

  async refreshAccessToken(): Promise<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>> {
    if (!this.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      };
    }

    const response = await this.makeRequest<{ tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      },
      false
    );

    if (response.success && response.data?.tokens) {
      await this.saveTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response;
  }

  async logoutDevice(): Promise<ApiResponse> {
    if (!this.deviceId) {
      return { success: false, error: 'No device registered' };
    }

    const response = await this.makeRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ deviceId: this.deviceId }),
    });

    await this.clearTokens();
    return response;
  }

  async getDeviceStatus(deviceId: string): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${deviceId}/status`);
  }

  async updateDeviceConfig(deviceId: string, config: any): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${deviceId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  async syncDeviceState(syncData: SyncData): Promise<ApiResponse<{ pendingCommands: CommandData[] }>> {
    return this.makeRequest(`/devices/${syncData.deviceId}/sync`, {
      method: 'POST',
      body: JSON.stringify(syncData),
    });
  }

  async sendStatusReport(statusData: StatusReportData): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${statusData.deviceId}/status-report`, {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  async getPendingCommands(deviceId: string): Promise<ApiResponse<{ commands: CommandData[] }>> {
    return this.makeRequest(`/devices/${deviceId}/commands`);
  }

  async acknowledgeCommand(
    deviceId: string,
    commandId: string,
    executed: boolean,
    result?: any
  ): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${deviceId}/commands/${commandId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({
        executed,
        result,
        executionTime: new Date().toISOString(),
      }),
    });
  }

  async remoteWipeDevice(deviceId: string, confirmationCode: string, reason?: string): Promise<ApiResponse> {
    return this.makeRequest(`/devices/${deviceId}/wipe`, {
      method: 'POST',
      body: JSON.stringify({
        confirmationCode,
        reason: reason || 'manual_wipe',
      }),
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.deviceToken;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const registerDevice = (registration: DeviceRegistration) =>
  apiClient.registerDevice(registration);

export const loginDevice = (deviceId: string) =>
  apiClient.loginDevice(deviceId);

export const syncDeviceState = (syncData: SyncData) =>
  apiClient.syncDeviceState(syncData);

export const sendStatusReport = (statusData: StatusReportData) =>
  apiClient.sendStatusReport(statusData);

export const getPendingCommands = (deviceId: string) =>
  apiClient.getPendingCommands(deviceId);

export const acknowledgeCommand = (
  deviceId: string,
  commandId: string,
  executed: boolean,
  result?: any
) => apiClient.acknowledgeCommand(deviceId, commandId, executed, result);

export default apiClient;
