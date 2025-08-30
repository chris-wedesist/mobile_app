/**
 * Performance and Network Monitoring Service
 * 
 * Comprehensive monitoring service for device performance, network diagnostics,
 * and system health tracking with real-time alerts and server synchronization.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppStateInfo,
  DeviceInfo as DeviceInfoType,
  NetworkDiagnostics,
  NetworkStatus,
  PerformanceAlert,
  PerformanceAlertType,
  PerformanceConfig,
  PerformanceMetrics,
  SyncResponse,
  SystemStatus
} from '../types/monitoring';
import { SecurityResult } from '../types';
import { EncryptionService } from '../encryption';

/**
 * Default configuration for performance monitoring
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  monitoringInterval: 30000,          // 30 seconds
  enableNetworkMonitoring: true,
  enablePerformanceMetrics: true,
  enableDeviceInfo: true,
  enableAppStateTracking: true,
  autoSync: false,
  syncInterval: 300000,               // 5 minutes
  alertThresholds: {
    lowBattery: 20,                   // 20%
    highMemoryUsage: 200,             // 200MB
    slowNetworkSpeed: 1,              // 1 Mbps
    highLatency: 1000                 // 1000ms
  }
};

// Constants for calculations
const PERCENTAGE_MULTIPLIER = 100;
// Memory conversion constants
const BYTES_PER_KB = 1024;
const BYTES_TO_MB_DIVISOR = BYTES_PER_KB * BYTES_PER_KB;
const MAX_APP_STATE_HISTORY = 50;
const ALERT_ID_RADIX = 36;
const ALERT_ID_START = 2;
const ALERT_ID_LENGTH = 9;
const MOCK_MEMORY_BASE = 50;
const MOCK_MEMORY_RANGE = 100;
const MOCK_DOWNLOAD_SPEED_MAX = 100;
const MOCK_UPLOAD_SPEED_MAX = 50;
const MAX_STORED_METRICS = 100;
const MOCK_TEST_DURATION = 3000;

/**
 * Performance and Network Monitoring Service
 */
export class MonitoringService {
  private config: PerformanceConfig;
  private encryptionService: EncryptionService;
  private isMonitoring = false;
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private syncInterval?: ReturnType<typeof setInterval>;
  private appStateHistory: AppStateInfo['stateHistory'] = [];
  private sessionStartTime = new Date();
  private alerts: PerformanceAlert[] = [];
  private apiBaseUrl: string;

  // Storage keys for persistence
  private readonly storageKeys = {
    config: 'monitoring_config',
    alerts: 'monitoring_alerts',
    metrics: 'monitoring_metrics',
    appState: 'monitoring_app_state'
  };

  constructor(encryptionService: EncryptionService, apiBaseUrl = 'https://api.desist.com') {
    this.encryptionService = encryptionService;
    this.config = DEFAULT_CONFIG;
    this.apiBaseUrl = apiBaseUrl;
    this.initializeAppStateTracking();
  }

  /**
   * Initialize the monitoring service with configuration
   */
  public async initialize(config?: Partial<PerformanceConfig>): Promise<SecurityResult<boolean>> {
    try {
      // Load saved configuration
      const savedConfig = await this.loadConfig();
      this.config = { ...DEFAULT_CONFIG, ...savedConfig, ...config };

      // Load saved alerts
      await this.loadAlerts();

      // Start monitoring if enabled
      if (this.config.enablePerformanceMetrics || this.config.enableNetworkMonitoring) {
        await this.startMonitoring();
      }

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'MONITORING_INIT_FAILED',
          message: 'Failed to initialize monitoring service',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Start performance and network monitoring
   */
  public async startMonitoring(): Promise<SecurityResult<boolean>> {
    try {
      if (this.isMonitoring) {
        return {
          success: true,
          data: true,
          timestamp: new Date()
        };
      }

      this.isMonitoring = true;

      // Start periodic monitoring
      this.monitoringInterval = setInterval(
        () => this.performMonitoringCycle(),
        this.config.monitoringInterval
      );

      // Start auto-sync if enabled
      if (this.config.autoSync) {
        this.syncInterval = setInterval(
          () => this.syncToServer(),
          this.config.syncInterval
        );
      }

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'MONITORING_START_FAILED',
          message: 'Failed to start monitoring',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  /**
   * Get current performance metrics
   */
  public async getPerformanceMetrics(): Promise<SecurityResult<PerformanceMetrics>> {
    try {
      const startTime = Date.now();
      
      const [batteryLevel, memoryInfo] = await Promise.all([
        DeviceInfo.getBatteryLevel().catch(() => null),
        this.getMemoryUsage().catch(() => null)
      ]);

      const metrics: PerformanceMetrics = {
        memoryUsage: memoryInfo,
        batteryLevel: batteryLevel ? Math.round(batteryLevel * PERCENTAGE_MULTIPLIER) : null,
        startupTime: Date.now() - startTime
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'METRICS_COLLECTION_FAILED',
          message: 'Failed to collect performance metrics',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get current network status
   */
  public async getNetworkStatus(): Promise<SecurityResult<NetworkStatus>> {
    try {
      const netState = await NetInfo.fetch();
      
      const status: NetworkStatus = {
        connectionType: this.mapConnectionType(netState),
        isConnected: netState.isConnected ?? false,
        isVPN: this.detectVPN(netState),
        connectionSpeed: this.estimateConnectionSpeed(netState),
        signalStrength: this.getSignalStrength(netState)
      };

      return {
        success: true,
        data: status,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'NETWORK_STATUS_FAILED',
          message: 'Failed to get network status',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get device information
   */
  public async getDeviceInfo(): Promise<SecurityResult<DeviceInfoType>> {
    try {
      const [
        deviceName,
        deviceId,
        manufacturer,
        totalMemory
      ] = await Promise.all([
        DeviceInfo.getDeviceName(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getManufacturer(),
        DeviceInfo.getTotalMemory().catch(() => 0)
      ]);

      const deviceInfo: DeviceInfoType = {
        deviceName,
        deviceType: this.mapDeviceType(DeviceInfo.getDeviceType()),
        operatingSystem: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        deviceId,
        manufacturer,
        model: DeviceInfo.getModel(),
        totalMemory: totalMemory ? Math.round(totalMemory / BYTES_TO_MB_DIVISOR) : undefined
      };

      return {
        success: true,
        data: deviceInfo,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DEVICE_INFO_FAILED',
          message: 'Failed to get device information',
          severity: 'low'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get comprehensive system status
   */
  public async getSystemStatus(userId: string): Promise<SecurityResult<SystemStatus>> {
    try {
      const [performanceResult, networkResult, deviceResult] = await Promise.all([
        this.getPerformanceMetrics(),
        this.getNetworkStatus(),
        this.getDeviceInfo()
      ]);

      if (!performanceResult.success || !networkResult.success || !deviceResult.success) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_STATUS_INCOMPLETE',
            message: 'Failed to collect complete system status',
            severity: 'medium'
          },
          timestamp: new Date()
        };
      }

      const appState: AppStateInfo = {
        currentState: AppState.currentState as 'active' | 'background' | 'inactive',
        stateHistory: this.appStateHistory,
        crashCount: 0, // TODO: Implement crash tracking
        sessionStartTime: this.sessionStartTime,
        backgroundTime: this.calculateBackgroundTime()
      };

      const systemStatus: SystemStatus = {
        userId,
        timestamp: new Date(),
        performance: performanceResult.data!,
        network: networkResult.data!,
        device: deviceResult.data!,
        appState
      };

      return {
        success: true,
        data: systemStatus,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'SYSTEM_STATUS_FAILED',
          message: 'Failed to get system status',
          severity: 'high'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Sync system status to server
   */
  public async syncToServer(userId?: string): Promise<SecurityResult<SyncResponse>> {
    try {
      if (!userId) {
        userId = 'anonymous';
      }

      const statusResult = await this.getSystemStatus(userId);
      if (!statusResult.success) {
        return {
          success: false,
          error: statusResult.error,
          timestamp: new Date()
        };
      }

      const response = await fetch(`${this.apiBaseUrl}/device/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          status: statusResult.data,
          alerts: this.alerts.filter(alert => !alert.resolved)
        })
      });

      const syncResponse: SyncResponse = await response.json();

      return {
        success: true,
        data: syncResponse,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: 'Failed to sync to server',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Run network diagnostics
   */
  public async runNetworkDiagnostics(): Promise<SecurityResult<NetworkDiagnostics>> {
    try {
      // Test connectivity
      const connectivityTest = await this.testConnectivity();
      
      // Test DNS resolution
      const dnsTest = await this.testDNS();
      
      // Simple bandwidth estimation
      const bandwidthTest = await this.estimateBandwidth();

      const diagnostics: NetworkDiagnostics = {
        connectivity: connectivityTest,
        dns: dnsTest,
        bandwidth: bandwidthTest,
        security: {
          isSecureConnection: true, // TODO: Implement SSL check
          certificateValid: true,
          tlsVersion: 'TLS 1.3'
        }
      };

      return {
        success: true,
        data: diagnostics,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'DIAGNOSTICS_FAILED',
          message: 'Failed to run network diagnostics',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Get current alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Dismiss an alert
   */
  public dismissAlert(alertId: string): void {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].resolved = true;
      this.alerts[alertIndex].resolvedAt = new Date();
      this.saveAlerts();
    }
  }

  /**
   * Update monitoring configuration
   */
  public async updateConfig(config: Partial<PerformanceConfig>): Promise<SecurityResult<boolean>> {
    try {
      this.config = { ...this.config, ...config };
      await this.saveConfig();
      
      // Restart monitoring with new config if currently monitoring
      if (this.isMonitoring) {
        this.stopMonitoring();
        await this.startMonitoring();
      }

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CONFIG_UPDATE_FAILED',
          message: 'Failed to update configuration',
          severity: 'medium'
        },
        timestamp: new Date()
      };
    }
  }

  // Private helper methods

  private async performMonitoringCycle(): Promise<void> {
    try {
      const [performanceResult, networkResult] = await Promise.all([
        this.getPerformanceMetrics(),
        this.getNetworkStatus()
      ]);

      if (performanceResult.success && performanceResult.data) {
        this.checkPerformanceAlerts(performanceResult.data);
      }

      if (networkResult.success && networkResult.data) {
        this.checkNetworkAlerts(networkResult.data);
      }

      // Save metrics for analysis
      await this.saveMetrics({ 
        performance: performanceResult.data, 
        network: networkResult.data 
      });

    } catch (err) {
      console.error('Monitoring cycle error:', err);
    }
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    // Check battery level
    if (metrics.batteryLevel !== null && 
        metrics.batteryLevel <= this.config.alertThresholds.lowBattery) {
      this.createAlert('low_battery', 'medium', 'Low Battery', 
        `Battery level is ${metrics.batteryLevel}%`);
    }

    // Check memory usage
    if (metrics.memoryUsage !== null && 
        metrics.memoryUsage >= this.config.alertThresholds.highMemoryUsage) {
      this.createAlert('high_memory_usage', 'high', 'High Memory Usage', 
        `Memory usage is ${metrics.memoryUsage}MB`);
    }
  }

  private checkNetworkAlerts(status: NetworkStatus): void {
    // Check connection status
    if (!status.isConnected) {
      this.createAlert('connection_lost', 'high', 'Connection Lost', 
        'Device is offline');
    }

    // Check VPN detection
    if (status.isVPN === true) {
      this.createAlert('vpn_detected', 'medium', 'VPN Detected', 
        'VPN connection detected');
    }
  }

  private createAlert(
    type: PerformanceAlertType, 
    severity: PerformanceAlert['severity'], 
    title: string, 
    message: string
  ): void {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && !alert.resolved
    );

    if (!existingAlert) {
      const alert: PerformanceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(ALERT_ID_RADIX).substr(ALERT_ID_START, ALERT_ID_LENGTH)}`,
        type,
        severity,
        title,
        message,
        timestamp: new Date(),
        resolved: false
      };

      this.alerts.push(alert);
      this.saveAlerts();
    }
  }

  private initializeAppStateTracking(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const now = new Date();
      const previousState = this.appStateHistory[this.appStateHistory.length - 1];
      
      if (previousState) {
        previousState.duration = now.getTime() - previousState.timestamp.getTime();
      }

      this.appStateHistory.push({
        state: nextAppState,
        timestamp: now
      });

      // Keep only last entries
      if (this.appStateHistory.length > MAX_APP_STATE_HISTORY) {
        this.appStateHistory = this.appStateHistory.slice(-MAX_APP_STATE_HISTORY);
      }
    });
  }

  private calculateBackgroundTime(): number {
    return this.appStateHistory
      .filter(state => state.state === 'background' && state.duration)
      .reduce((total, state) => total + (state.duration || 0), 0);
  }

  private mapConnectionType(netState: NetInfoState): NetworkStatus['connectionType'] {
    if (!netState.isConnected) return 'offline';
    
    switch (netState.type) {
      case 'wifi': return 'wifi';
      case 'cellular': return 'cellular';
      case 'ethernet': return 'ethernet';
      case 'vpn': return 'vpn';
      default: return 'unknown';
    }
  }

  private detectVPN(netState: NetInfoState): boolean | null {
    // Basic VPN detection logic
    if (netState.type === 'vpn') return true;
    const details = netState.details as { isConnectionExpensive?: boolean } | null;
    if (details?.isConnectionExpensive) return true;
    return false;
  }

  private estimateConnectionSpeed(netState: NetInfoState): NetworkStatus['connectionSpeed'] {
    if (!netState.isConnected) return 'unknown';
    
    // Basic estimation based on connection type
    switch (netState.type) {
      case 'wifi': return 'fast';
      case 'cellular': {
        const details = netState.details as { cellularGeneration?: string } | null;
        const cellularType = details?.cellularGeneration;
        if (cellularType === '5g') return 'fast';
        if (cellularType === '4g') return 'moderate';
        return 'slow';
      }
      default: return 'unknown';
    }
  }

  private getSignalStrength(netState: NetInfoState): number | undefined {
    const details = netState.details as { strength?: number } | null;
    return details?.strength;
  }

  private async getMemoryUsage(): Promise<number | null> {
    // Mock implementation - replace with actual memory monitoring
    return Math.floor(Math.random() * MOCK_MEMORY_RANGE) + MOCK_MEMORY_BASE;
  }

  private mapDeviceType(deviceType: string): DeviceInfoType['deviceType'] {
    switch (deviceType.toLowerCase()) {
      case 'handset':
      case 'phone':
        return 'phone';
      case 'tablet':
        return 'tablet';
      case 'desktop':
        return 'desktop';
      default:
        return 'unknown';
    }
  }

  private async testConnectivity(): Promise<NetworkDiagnostics['connectivity']> {
    const startTime = Date.now();
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD'
      });
      
      return {
        isReachable: true,
        responseTime: Date.now() - startTime,
        statusCode: response.status
      };
    } catch {
      return {
        isReachable: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testDNS(): Promise<NetworkDiagnostics['dns']> {
    const startTime = Date.now();
    // Mock DNS test - implement actual DNS resolution testing
    return {
      resolutionTime: Date.now() - startTime,
      servers: ['8.8.8.8', '1.1.1.1']
    };
  }

  private async estimateBandwidth(): Promise<NetworkDiagnostics['bandwidth']> {
    // Mock bandwidth test - implement actual bandwidth testing
    return {
      downloadSpeed: Math.random() * MOCK_DOWNLOAD_SPEED_MAX,
      uploadSpeed: Math.random() * MOCK_UPLOAD_SPEED_MAX,
      testDuration: MOCK_TEST_DURATION
    };
  }

  private async loadConfig(): Promise<Partial<PerformanceConfig>> {
    try {
      const configData = await AsyncStorage.getItem(this.storageKeys.config);
      return configData ? JSON.parse(configData) : {};
    } catch {
      return {};
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKeys.config, JSON.stringify(this.config));
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const alertsData = await AsyncStorage.getItem(this.storageKeys.alerts);
      if (alertsData) {
        interface StoredAlert {
          id: string;
          type: PerformanceAlertType;
          severity: PerformanceAlert['severity'];
          title: string;
          message: string;
          timestamp: string;
          resolved: boolean;
          resolvedAt?: string;
          metadata?: Record<string, unknown>;
        }
        
        this.alerts = JSON.parse(alertsData).map((alert: StoredAlert) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
          resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
        }));
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKeys.alerts, JSON.stringify(this.alerts));
    } catch (err) {
      console.error('Failed to save alerts:', err);
    }
  }

  private async saveMetrics(metrics: Record<string, unknown>): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const key = `${this.storageKeys.metrics}_${timestamp}`;
      await AsyncStorage.setItem(key, JSON.stringify(metrics));
      
      // Clean up old metrics (keep last entries)
      const allKeys = await AsyncStorage.getAllKeys();
      const metricsKeys = allKeys
        .filter(storageKey => storageKey.startsWith(this.storageKeys.metrics))
        .sort()
        .slice(0, -MAX_STORED_METRICS);
      
      await AsyncStorage.multiRemove(metricsKeys);
    } catch (err) {
      console.error('Failed to save metrics:', err);
    }
  }
}
