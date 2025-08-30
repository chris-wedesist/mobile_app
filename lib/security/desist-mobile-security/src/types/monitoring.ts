/**
 * Performance and Network Monitoring Types
 * 
 * Comprehensive types for device performance monitoring, network diagnostics,
 * and real-time system health tracking within the Desist Mobile Security platform.
 */

/**
 * Performance metrics for device monitoring
 */
export interface PerformanceMetrics {
  memoryUsage: number | null;        // Memory usage in MB
  batteryLevel: number | null;       // Battery level percentage (0-100)
  startupTime: number | null;        // App startup time in milliseconds
  cpuUsage?: number | null;          // CPU usage percentage (if available)
  diskUsage?: number | null;         // Disk usage percentage (if available)
  fpsMetrics?: {
    current: number;
    average: number;
    drops: number;
  };
}

/**
 * Network status and connectivity information
 */
export interface NetworkStatus {
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'vpn' | 'offline' | 'unknown';
  isConnected: boolean;
  isVPN: boolean | null;
  connectionSpeed?: 'slow' | 'moderate' | 'fast' | 'unknown';
  signalStrength?: number;           // Signal strength (0-100)
  bandwidth?: {
    download: number;                // Mbps
    upload: number;                  // Mbps
  };
  latency?: number;                  // Network latency in ms
}

/**
 * Device information and hardware details
 */
export interface DeviceInfo {
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown';
  operatingSystem: string;
  systemVersion: string;
  appVersion: string;
  deviceId: string;
  manufacturer?: string;
  model?: string;
  architecture?: string;
  totalMemory?: number;              // Total device memory in MB
  availableStorage?: number;         // Available storage in MB
}

/**
 * App state and lifecycle information
 */
export interface AppStateInfo {
  currentState: 'active' | 'background' | 'inactive';
  stateHistory: Array<{
    state: string;
    timestamp: Date;
    duration?: number;               // Duration in previous state (ms)
  }>;
  crashCount: number;
  lastCrashTime?: Date;
  sessionStartTime: Date;
  backgroundTime: number;            // Total time spent in background (ms)
}

/**
 * Combined system status for comprehensive monitoring
 */
export interface SystemStatus {
  userId: string;
  timestamp: Date;
  performance: PerformanceMetrics;
  network: NetworkStatus;
  device: DeviceInfo;
  appState: AppStateInfo;
  securityMetrics?: {
    threatsDetected: number;
    lastThreatTime?: Date;
    encryptionStatus: boolean;
    authenticationStatus: boolean;
  };
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  monitoringInterval: number;        // Monitoring interval in ms
  enableNetworkMonitoring: boolean;
  enablePerformanceMetrics: boolean;
  enableDeviceInfo: boolean;
  enableAppStateTracking: boolean;
  autoSync: boolean;
  syncInterval: number;              // Auto-sync interval in ms
  alertThresholds: {
    lowBattery: number;              // Battery level threshold (%)
    highMemoryUsage: number;         // Memory usage threshold (MB)
    slowNetworkSpeed: number;        // Network speed threshold (Mbps)
    highLatency: number;             // Network latency threshold (ms)
  };
}

/**
 * Performance alert types
 */
export type PerformanceAlertType = 
  | 'low_battery'
  | 'high_memory_usage'
  | 'slow_network'
  | 'high_latency'
  | 'connection_lost'
  | 'vpn_detected'
  | 'performance_degradation'
  | 'app_crash'
  | 'security_threat';

/**
 * Performance alert structure
 */
export interface PerformanceAlert {
  id: string;
  type: PerformanceAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Server sync response
 */
export interface SyncResponse {
  success: boolean;
  syncId?: string;
  timestamp?: Date;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  serverCommands?: Array<{
    command: string;
    parameters?: Record<string, unknown>;
    executeAt?: Date;
  }>;
}

/**
 * Network diagnostics result
 */
export interface NetworkDiagnostics {
  connectivity: {
    isReachable: boolean;
    responseTime: number;
    statusCode?: number;
  };
  dns: {
    resolutionTime: number;
    servers: string[];
  };
  bandwidth: {
    downloadSpeed: number;
    uploadSpeed: number;
    testDuration: number;
  };
  security: {
    isSecureConnection: boolean;
    certificateValid: boolean;
    tlsVersion?: string;
  };
}

/**
 * Performance optimization suggestions
 */
export interface PerformanceOptimization {
  category: 'memory' | 'battery' | 'network' | 'storage' | 'general';
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  expectedImprovement: string;
  actionRequired: boolean;
  autoFixAvailable: boolean;
}

/**
 * Comprehensive monitoring result
 */
export interface MonitoringResult {
  status: SystemStatus;
  alerts: PerformanceAlert[];
  diagnostics: NetworkDiagnostics;
  optimizations: PerformanceOptimization[];
  healthScore: number;               // Overall health score (0-100)
  recommendations: string[];
}

/**
 * Hook return types for React Native integration
 */
export interface UsePerformanceMonitoringResult {
  metrics: PerformanceMetrics;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface UseNetworkMonitoringResult {
  status: NetworkStatus;
  isMonitoring: boolean;
  error: string | null;
  runDiagnostics: () => Promise<NetworkDiagnostics>;
}

export interface UseSystemMonitoringResult {
  systemStatus: SystemStatus | null;
  alerts: PerformanceAlert[];
  isLoading: boolean;
  error: string | null;
  sync: () => Promise<SyncResponse>;
  dismissAlert: (alertId: string) => void;
  refreshStatus: () => void;
}
