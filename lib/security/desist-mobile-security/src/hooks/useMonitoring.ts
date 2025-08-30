/**
 * React Native Hooks for Performance and Network Monitoring
 * 
 * Custom hooks for integrating the MonitoringService with React Native components,
 * providing real-time performance metrics, network status, and system monitoring.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NetworkDiagnostics,
  NetworkStatus,
  PerformanceAlert,
  PerformanceMetrics,
  SyncResponse,
  SystemStatus,
  UseNetworkMonitoringResult,
  UsePerformanceMonitoringResult,
  UseSystemMonitoringResult
} from '../types/monitoring';
import { MonitoringService } from '../services/MonitoringService';
import { EncryptionService } from '../encryption';

// Constants for intervals and thresholds
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const DEFAULT_SYNC_INTERVAL = 300000; // 5 minutes
const DEFAULT_SPEED_TEST_INTERVAL = 60000; // 1 minute
const OPTIMIZATION_DELAY = 2000; // 2 seconds

// Performance thresholds
const LOW_BATTERY_THRESHOLD = 20;
const HIGH_MEMORY_THRESHOLD = 200;
const BATTERY_SCORE_PENALTY = 15;
const MEMORY_SCORE_PENALTY = 20;
const OFFLINE_SCORE_PENALTY = 25;
const SLOW_NETWORK_PENALTY = 10;
const VPN_SCORE_PENALTY = 5;
const INITIAL_HEALTH_SCORE = 100;
const MIN_HEALTH_SCORE = 0;
const OPTIMIZATION_SCORE_BOOST = 10;

/**
 * Hook for monitoring device performance metrics
 */
export function usePerformanceMonitoring(
  encryptionService: EncryptionService,
  refreshInterval = DEFAULT_REFRESH_INTERVAL
): UsePerformanceMonitoringResult {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: null,
    batteryLevel: null,
    startupTime: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const monitoringServiceRef = useRef<MonitoringService | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      if (!monitoringServiceRef.current) {
        monitoringServiceRef.current = new MonitoringService(encryptionService);
        await monitoringServiceRef.current.initialize();
      }

      const result = await monitoringServiceRef.current.getPerformanceMetrics();
      
      if (result.success && result.data) {
        setMetrics(result.data);
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to load performance metrics');
      }
    } catch {
      setError('Unexpected error loading performance metrics');
    } finally {
      setIsLoading(false);
    }
  }, [encryptionService]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    // Initial load
    loadMetrics();

    // Set up interval for continuous monitoring
    intervalRef.current = setInterval(loadMetrics, refreshInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadMetrics, refreshInterval]);

  return {
    metrics,
    isLoading,
    error,
    refresh
  };
}

/**
 * Hook for monitoring network status and connectivity
 */
export function useNetworkMonitoring(
  encryptionService: EncryptionService
): UseNetworkMonitoringResult {
  const [status, setStatus] = useState<NetworkStatus>({
    connectionType: 'unknown',
    isConnected: false,
    isVPN: null
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const monitoringServiceRef = useRef<MonitoringService | null>(null);

  const updateNetworkStatus = useCallback(async () => {
    try {
      if (!monitoringServiceRef.current) {
        monitoringServiceRef.current = new MonitoringService(encryptionService);
        await monitoringServiceRef.current.initialize();
      }

      const result = await monitoringServiceRef.current.getNetworkStatus();
      
      if (result.success && result.data) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.error?.message || 'Failed to get network status');
      }
    } catch {
      setError('Unexpected error getting network status');
    }
  }, [encryptionService]);

  const runDiagnostics = useCallback(async (): Promise<NetworkDiagnostics> => {
    if (!monitoringServiceRef.current) {
      monitoringServiceRef.current = new MonitoringService(encryptionService);
      await monitoringServiceRef.current.initialize();
    }

    const result = await monitoringServiceRef.current.runNetworkDiagnostics();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Network diagnostics failed');
    }
  }, [encryptionService]);

  useEffect(() => {
    setIsMonitoring(true);
    
    // Initial network status check
    updateNetworkStatus();

    // Listen for app state changes to refresh network status
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateNetworkStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      setIsMonitoring(false);
      subscription.remove();
    };
  }, [updateNetworkStatus]);

  return {
    status,
    isMonitoring,
    error,
    runDiagnostics
  };
}

/**
 * Comprehensive hook for system monitoring with alerts and sync capabilities
 */
export function useSystemMonitoring(
  userId: string,
  encryptionService: EncryptionService,
  apiBaseUrl?: string,
  autoSync = false,
  syncInterval = DEFAULT_SYNC_INTERVAL
): UseSystemMonitoringResult {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const monitoringServiceRef = useRef<MonitoringService | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initializeService = useCallback(async () => {
    if (!monitoringServiceRef.current) {
      monitoringServiceRef.current = new MonitoringService(encryptionService, apiBaseUrl);
      await monitoringServiceRef.current.initialize({
        autoSync,
        syncInterval
      });
    }
  }, [encryptionService, apiBaseUrl, autoSync, syncInterval]);

  const refreshStatus = useCallback(async () => {
    try {
      await initializeService();
      
      const [statusResult] = await Promise.all([
        monitoringServiceRef.current!.getSystemStatus(userId)
      ]);

      if (statusResult.success && statusResult.data) {
        setSystemStatus(statusResult.data);
        
        // Update alerts from service
        const currentAlerts = monitoringServiceRef.current!.getAlerts();
        setAlerts(currentAlerts);
        
        setError(null);
      } else {
        setError(statusResult.error?.message || 'Failed to get system status');
      }
    } catch {
      setError('Unexpected error refreshing system status');
    } finally {
      setIsLoading(false);
    }
  }, [userId, initializeService]);

  const sync = useCallback(async (): Promise<SyncResponse> => {
    await initializeService();
    
    const result = await monitoringServiceRef.current!.syncToServer(userId);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Sync failed');
    }
  }, [userId, initializeService]);

  const dismissAlert = useCallback((alertId: string) => {
    if (monitoringServiceRef.current) {
      monitoringServiceRef.current.dismissAlert(alertId);
      
      // Update local alerts state
      setAlerts(currentAlerts => 
        currentAlerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, resolved: true, resolvedAt: new Date() }
            : alert
        )
      );
    }
  }, []);

  useEffect(() => {
    // Initial status load
    refreshStatus();

    // Set up status monitoring interval
    statusIntervalRef.current = setInterval(refreshStatus, DEFAULT_REFRESH_INTERVAL); // 30 seconds

    // Set up auto-sync if enabled
    if (autoSync) {
      syncIntervalRef.current = setInterval(() => {
        sync().catch(err => {
          console.warn('Auto-sync failed:', err);
        });
      }, syncInterval);
    }

    // Cleanup
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (monitoringServiceRef.current) {
        monitoringServiceRef.current.stopMonitoring();
      }
    };
  }, [refreshStatus, sync, autoSync, syncInterval]);

  return {
    systemStatus,
    alerts,
    isLoading,
    error,
    sync,
    dismissAlert,
    refreshStatus
  };
}

/**
 * Hook for monitoring app performance with automatic optimization suggestions
 */
export function usePerformanceOptimization(
  encryptionService: EncryptionService
) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [healthScore, setHealthScore] = useState<number>(INITIAL_HEALTH_SCORE);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { metrics } = usePerformanceMonitoring(encryptionService);
  const { status } = useNetworkMonitoring(encryptionService);

  useEffect(() => {
    const generateRecommendations = () => {
      const newRecommendations: string[] = [];
      let score = 100;

      // Battery recommendations
      if (metrics.batteryLevel !== null && metrics.batteryLevel < LOW_BATTERY_THRESHOLD) {
        newRecommendations.push('Enable battery saver mode to extend device usage');
        score -= BATTERY_SCORE_PENALTY;
      }

      // Memory recommendations
      if (metrics.memoryUsage !== null && metrics.memoryUsage > HIGH_MEMORY_THRESHOLD) {
        newRecommendations.push('Close unused apps to free up memory');
        score -= MEMORY_SCORE_PENALTY;
      }

      // Network recommendations
      if (!status.isConnected) {
        newRecommendations.push('Check network connection for optimal performance');
        score -= OFFLINE_SCORE_PENALTY;
      } else if (status.connectionSpeed === 'slow') {
        newRecommendations.push('Switch to WiFi for better performance');
        score -= SLOW_NETWORK_PENALTY;
      }

      // VPN recommendations
      if (status.isVPN) {
        newRecommendations.push('VPN detected - may impact performance');
        score -= VPN_SCORE_PENALTY;
      }

      setRecommendations(newRecommendations);
      setHealthScore(Math.max(score, MIN_HEALTH_SCORE));
    };

    generateRecommendations();
  }, [metrics, status]);

  const runOptimization = useCallback(async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_DELAY));
    
    // Clear some recommendations as "fixed"
    setRecommendations(current => current.slice(0, Math.max(0, current.length - 1)));
    setHealthScore(current => Math.min(INITIAL_HEALTH_SCORE, current + OPTIMIZATION_SCORE_BOOST));
    
    setIsOptimizing(false);
  }, []);

  return {
    recommendations,
    healthScore,
    isOptimizing,
    runOptimization
  };
}

/**
 * Hook for real-time network speed monitoring
 */
export function useNetworkSpeed(
  encryptionService: EncryptionService,
  testInterval = DEFAULT_SPEED_TEST_INTERVAL
) {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const monitoringServiceRef = useRef<MonitoringService | null>(null);

  const runSpeedTest = useCallback(async () => {
    try {
      setIsTesting(true);
      
      if (!monitoringServiceRef.current) {
        monitoringServiceRef.current = new MonitoringService(encryptionService);
        await monitoringServiceRef.current.initialize();
      }

      const result = await monitoringServiceRef.current.runNetworkDiagnostics();
      
      if (result.success && result.data) {
        setDownloadSpeed(result.data.bandwidth.downloadSpeed);
        setUploadSpeed(result.data.bandwidth.uploadSpeed);
        setLastTestTime(new Date());
      }
    } catch (err) {
      console.error('Speed test failed:', err);
    } finally {
      setIsTesting(false);
    }
  }, [encryptionService]);

  useEffect(() => {
    // Initial speed test
    runSpeedTest();

    // Set up periodic testing
    const interval = setInterval(runSpeedTest, testInterval);

    return () => clearInterval(interval);
  }, [runSpeedTest, testInterval]);

  return {
    downloadSpeed,
    uploadSpeed,
    isTesting,
    lastTestTime,
    runSpeedTest
  };
}
