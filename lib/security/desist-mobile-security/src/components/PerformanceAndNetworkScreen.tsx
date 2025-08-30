import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EncryptionService } from '../encryption';
import { COLORS } from '../constants/theme';
import {
  useNetworkMonitoring,
  useNetworkSpeed,
  usePerformanceMonitoring,
  usePerformanceOptimization,
  useSystemMonitoring
} from '../hooks/useMonitoring';

// Constants for score thresholds and UI
const HEALTH_SCORE_GOOD = 80;
const HEALTH_SCORE_FAIR = 60;
const DEVICE_ID_PREVIEW_LENGTH = 8;

interface PerformanceAndNetworkScreenProps {
  userId: string;
  encryptionService: EncryptionService;
  apiBaseUrl?: string;
  onBack?: () => void;
}

const PerformanceAndNetworkScreen: React.FC<PerformanceAndNetworkScreenProps> = ({
  userId,
  encryptionService,
  apiBaseUrl,
  onBack
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'performance' | 'network' | 'system'>('performance');

  // Monitoring hooks
  const {
    metrics: performanceMetrics,
    isLoading: performanceLoading,
    error: performanceError,
    refresh: refreshPerformance
  } = usePerformanceMonitoring(encryptionService);

  const {
    status: networkStatus,
    isMonitoring: networkMonitoring,
    error: networkError,
    runDiagnostics
  } = useNetworkMonitoring(encryptionService);

  const {
    systemStatus,
    alerts,
    isLoading: systemLoading,
    error: systemError,
    sync,
    dismissAlert,
    refreshStatus
  } = useSystemMonitoring(userId, encryptionService, apiBaseUrl, true);

  const {
    recommendations,
    healthScore,
    isOptimizing,
    runOptimization
  } = usePerformanceOptimization(encryptionService);

  const {
    downloadSpeed,
    uploadSpeed,
    isTesting: speedTesting,
    lastTestTime,
    runSpeedTest
  } = useNetworkSpeed(encryptionService);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshPerformance(),
        refreshStatus()
      ]);
    } catch {
      Alert.alert('Error', 'Failed to refresh monitoring data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNetworkDiagnostics = async () => {
    try {
      const diagnostics = await runDiagnostics();
      Alert.alert(
        'Network Diagnostics',
        `Connectivity: ${diagnostics.connectivity.isReachable ? 'Good' : 'Poor'}\nResponse Time: ${diagnostics.connectivity.responseTime}ms\nDownload Speed: ${diagnostics.bandwidth.downloadSpeed} Mbps\nUpload Speed: ${diagnostics.bandwidth.uploadSpeed} Mbps\nDNS Resolution: ${diagnostics.dns.resolutionTime}ms`
      );
    } catch {
      Alert.alert('Error', 'Failed to run network diagnostics');
    }
  };

  const handleSync = async () => {
    try {
      await sync();
      Alert.alert(
        'Sync Complete',
        `Sync completed successfully`
      );
    } catch {
      Alert.alert('Error', 'Failed to sync data to server');
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= HEALTH_SCORE_GOOD) return COLORS.success;
    if (score >= HEALTH_SCORE_FAIR) return COLORS.warning;
    return COLORS.error;
  };

  const getConnectionTypeIcon = (type: string): string => {
    switch (type) {
      case 'wifi': return '📶';
      case 'cellular': return '📱';
      case 'ethernet': return '🌐';
      default: return '❓';
    }
  };

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      {performanceLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : performanceError ? (
        <Text style={styles.errorText}>{performanceError}</Text>
      ) : performanceMetrics ? (
        <>
          {/* Health Score */}
          <View style={styles.healthScoreContainer}>
            <Text style={styles.sectionTitle}>System Health Score</Text>
            <View style={styles.healthScoreCircle}>
              <Text style={[styles.healthScoreText, { color: getHealthScoreColor(healthScore) }]}>
                {healthScore}
              </Text>
            </View>
            {recommendations.length > 0 && (
              <TouchableOpacity
                style={[styles.optimizeButton, isOptimizing && styles.optimizeButtonDisabled]}
                onPress={runOptimization}
                disabled={isOptimizing}
              >
                <Text style={styles.optimizeButtonText}>
                  {isOptimizing ? 'Optimizing...' : 'Optimize Performance'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Performance Metrics */}
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Battery Level</Text>
              <Text style={styles.metricValue}>
                {performanceMetrics.batteryLevel !== null ? `${performanceMetrics.batteryLevel}%` : 'Unknown'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Memory Usage</Text>
              <Text style={styles.metricValue}>
                {performanceMetrics.memoryUsage !== null ? `${performanceMetrics.memoryUsage} MB` : 'Unknown'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CPU Usage</Text>
              <Text style={styles.metricValue}>
                {performanceMetrics.cpuUsage !== null && performanceMetrics.cpuUsage !== undefined ? `${performanceMetrics.cpuUsage.toFixed(1)}%` : 'Unknown'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Disk Usage</Text>
              <Text style={styles.metricValue}>
                {performanceMetrics.diskUsage !== null ? `${performanceMetrics.diskUsage}%` : 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
              {recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>💡 {rec}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </View>
  );

  const renderNetworkTab = () => (
    <View style={styles.tabContent}>
      {/* Network Status */}
      <View style={styles.networkStatusContainer}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}>
            <Text style={styles.networkIcon}>
              {getConnectionTypeIcon(networkStatus.connectionType)}
            </Text>
            <Text style={styles.networkType}>
              {networkStatus.connectionType.toUpperCase()}
            </Text>
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: networkStatus.isConnected ? COLORS.success : COLORS.error }
            ]} />
          </View>
          
          <Text style={styles.networkDetail}>
            Status: {networkStatus.isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          
          {networkStatus.isVPN !== null && (
            <Text style={styles.networkDetail}>
              VPN: {networkStatus.isVPN ? 'Active' : 'Inactive'}
            </Text>
          )}
        </View>
      </View>

      {/* Speed Test */}
      <View style={styles.speedTestContainer}>
        <Text style={styles.sectionTitle}>Connection Speed</Text>
        
        <View style={styles.speedCard}>
          <View style={styles.speedRow}>
            <Text style={styles.speedLabel}>Download</Text>
            <Text style={styles.speedValue}>
              {downloadSpeed !== null ? `${downloadSpeed.toFixed(1)} Mbps` : 'Testing...'}
            </Text>
          </View>
          
          <View style={styles.speedRow}>
            <Text style={styles.speedLabel}>Upload</Text>
            <Text style={styles.speedValue}>
              {uploadSpeed !== null ? `${uploadSpeed.toFixed(1)} Mbps` : 'Testing...'}
            </Text>
          </View>
          
          {lastTestTime && (
            <Text style={styles.lastTestText}>
              Last tested: {lastTestTime.toLocaleTimeString()}
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.testButton, speedTesting && styles.testButtonDisabled]}
            onPress={runSpeedTest}
            disabled={speedTesting}
          >
            <Text style={styles.testButtonText}>
              {speedTesting ? 'Testing...' : 'Run Speed Test'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Diagnostics */}
      <TouchableOpacity style={styles.diagnosticsButton} onPress={handleNetworkDiagnostics}>
        <Text style={styles.diagnosticsButtonText}>Run Network Diagnostics</Text>
      </TouchableOpacity>

      {networkError && (
        <Text style={styles.errorText}>{networkError}</Text>
      )}
    </View>
  );

  const renderSystemTab = () => (
    <View style={styles.tabContent}>
      {systemLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : systemError ? (
        <Text style={styles.errorText}>{systemError}</Text>
      ) : systemStatus ? (
        <>
          {/* System Overview */}
          <View style={styles.systemOverviewContainer}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            
            <View style={styles.systemCard}>
              <Text style={styles.systemLabel}>Device</Text>
              <Text style={styles.systemValue}>{systemStatus.device.deviceName}</Text>
              <Text style={styles.systemSubtext}>
                {systemStatus.device.manufacturer} • {systemStatus.device.operatingSystem} {systemStatus.device.systemVersion}
              </Text>
            </View>

            <View style={styles.systemCard}>
              <Text style={styles.systemLabel}>Uptime</Text>
              <Text style={styles.systemValue}>
                Session Active
              </Text>
            </View>

            <View style={styles.systemCard}>
              <Text style={styles.systemLabel}>App Version</Text>
              <Text style={styles.systemValue}>
                {systemStatus.device.appVersion}
              </Text>
              <Text style={styles.systemSubtext}>
                Device ID: {systemStatus.device.deviceId.substring(0, DEVICE_ID_PREVIEW_LENGTH)}...
              </Text>
            </View>
          </View>

          {/* Alerts */}
          {alerts.length > 0 && (
            <View style={styles.alertsContainer}>
              <Text style={styles.sectionTitle}>Performance Alerts</Text>
              {alerts.filter(alert => !alert.resolved).map((alert) => (
                <View key={alert.id} style={[styles.alertCard, styles[`alert${alert.severity}`]]}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>{alert.type.replace('_', ' ').toUpperCase()}</Text>
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => dismissAlert(alert.id)}
                    >
                      <Text style={styles.dismissButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>
                    {alert.timestamp.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Sync Controls */}
          <View style={styles.syncContainer}>
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.syncButtonText}>Sync to Server</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Performance & Network</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'performance' && styles.activeTab]}
          onPress={() => setSelectedTab('performance')}
        >
          <Text style={[styles.tabText, selectedTab === 'performance' && styles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'network' && styles.activeTab]}
          onPress={() => setSelectedTab('network')}
        >
          <Text style={[styles.tabText, selectedTab === 'network' && styles.activeTabText]}>
            Network
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'system' && styles.activeTab]}
          onPress={() => setSelectedTab('system')}
        >
          <Text style={[styles.tabText, selectedTab === 'system' && styles.activeTabText]}>
            System
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'network' && renderNetworkTab()}
        {selectedTab === 'system' && renderSystemTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.medium,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  healthScoreContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  healthScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  optimizeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  optimizeButtonDisabled: {
    backgroundColor: COLORS.light,
  },
  optimizeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.medium,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  metricSubtext: {
    fontSize: 12,
    color: COLORS.lighter,
    marginTop: 2,
  },
  recommendationsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  recommendationItem: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  networkStatusContainer: {
    marginBottom: 16,
  },
  networkCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  networkType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  networkDetail: {
    fontSize: 14,
    color: COLORS.medium,
    marginBottom: 4,
  },
  speedTestContainer: {
    marginBottom: 16,
  },
  speedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speedLabel: {
    fontSize: 16,
    color: COLORS.medium,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  lastTestText: {
    fontSize: 12,
    color: COLORS.lighter,
    marginTop: 8,
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  testButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  diagnosticsButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  diagnosticsButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  systemOverviewContainer: {
    marginBottom: 16,
  },
  systemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  systemLabel: {
    fontSize: 14,
    color: COLORS.medium,
    marginBottom: 4,
  },
  systemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  systemSubtext: {
    fontSize: 12,
    color: COLORS.lighter,
    marginTop: 2,
  },
  alertsContainer: {
    marginBottom: 16,
  },
  alertCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertlow: {
    backgroundColor: COLORS.locationBackground,
    borderLeftColor: COLORS.info,
  },
  alertmedium: {
    backgroundColor: COLORS.lightGray,
    borderLeftColor: COLORS.warning,
  },
  alerthigh: {
    backgroundColor: COLORS.lightGray,
    borderLeftColor: COLORS.error,
  },
  alertcritical: {
    backgroundColor: COLORS.lightGray,
    borderLeftColor: COLORS.severityCritical,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    fontSize: 18,
    color: COLORS.medium,
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: COLORS.lighter,
  },
  syncContainer: {
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default PerformanceAndNetworkScreen;
