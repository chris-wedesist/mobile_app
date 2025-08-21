import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stealthManager } from '../../lib/stealth';
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { screenProtectionManager } from '../../lib/security/screenProtection';
import { emergencyProtocolManager } from '../../lib/security/emergencyProtocols';
import { threatDetectionEngine, SecurityThreat } from '../../lib/security/threatDetection';

interface SecurityStatus {
  overall: 'high' | 'medium' | 'low';
  biometric: boolean;
  screenProtection: boolean;
  emergencyEnabled: boolean;
  threatMonitoring: boolean;
  recentThreats: number;
  lastUpdate: Date;
}

export const SecurityMonitor: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    overall: 'low',
    biometric: false,
    screenProtection: false,
    emergencyEnabled: false,
    threatMonitoring: false,
    recentThreats: 0,
    lastUpdate: new Date(),
  });
  const [recentThreats, setRecentThreats] = useState<SecurityThreat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    updateSecurityStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(updateSecurityStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const updateSecurityStatus = async () => {
    try {
      // Initialize all systems
      await Promise.all([
        stealthManager.initialize(),
        biometricAuthManager.initialize(),
        screenProtectionManager.initialize(),
        emergencyProtocolManager.initialize(),
        threatDetectionEngine.initialize(),
      ]);

      // Get status from each system
      const overallSecurity = await stealthManager.getSecurityStatus();
      const biometricEnabled = biometricAuthManager.isEnabled();
      const screenStatus = screenProtectionManager.getProtectionStatus();
      const emergencyConfig = emergencyProtocolManager.getConfig();
      const threatStatus = threatDetectionEngine.getSecurityStatus();
      const threats = threatDetectionEngine.getRecentThreats(60); // Last hour

      setSecurityStatus({
        overall: overallSecurity.securityLevel,
        biometric: biometricEnabled,
        screenProtection: screenStatus.isActive,
        emergencyEnabled: emergencyConfig.isEnabled,
        threatMonitoring: threatStatus.monitoring,
        recentThreats: threats.length,
        lastUpdate: new Date(),
      });

      setRecentThreats(threats.slice(0, 5)); // Show last 5 threats
    } catch (error) {
      console.error('Failed to update security status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await updateSecurityStatus();
    setIsRefreshing(false);
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#34C759';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return 'shield-checkmark';
      case 'medium':
        return 'shield';
      case 'low':
        return 'shield-outline';
      default:
        return 'shield-outline';
    }
  };

  const getThreatSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC02';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#007AFF']}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Security Monitor</Text>
          <Text style={styles.lastUpdate}>
            Updated {formatTime(securityStatus.lastUpdate)}
          </Text>
        </View>
      </View>

      <View style={styles.overallStatusCard}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={getSecurityLevelIcon(securityStatus.overall) as any}
            size={32}
            color={getSecurityLevelColor(securityStatus.overall)}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusLevel}>
              Security Level: {securityStatus.overall.toUpperCase()}
            </Text>
            <Text style={styles.statusDescription}>
              {securityStatus.overall === 'high' && 'All systems operational'}
              {securityStatus.overall === 'medium' && 'Some features need attention'}
              {securityStatus.overall === 'low' && 'Security improvements needed'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.systemsGrid}>
        <View style={styles.systemCard}>
          <Ionicons
            name={securityStatus.biometric ? 'finger-print' : 'finger-print-outline'}
            size={24}
            color={securityStatus.biometric ? '#34C759' : '#8E8E93'}
          />
          <Text style={styles.systemTitle}>Biometric</Text>
          <Text style={[
            styles.systemStatus,
            { color: securityStatus.biometric ? '#34C759' : '#8E8E93' }
          ]}>
            {securityStatus.biometric ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={securityStatus.screenProtection ? 'shield-checkmark' : 'shield-outline'}
            size={24}
            color={securityStatus.screenProtection ? '#34C759' : '#8E8E93'}
          />
          <Text style={styles.systemTitle}>Screen Protection</Text>
          <Text style={[
            styles.systemStatus,
            { color: securityStatus.screenProtection ? '#34C759' : '#8E8E93' }
          ]}>
            {securityStatus.screenProtection ? 'Protected' : 'Unprotected'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={securityStatus.emergencyEnabled ? 'warning' : 'warning-outline'}
            size={24}
            color={securityStatus.emergencyEnabled ? '#FF9500' : '#8E8E93'}
          />
          <Text style={styles.systemTitle}>Emergency</Text>
          <Text style={[
            styles.systemStatus,
            { color: securityStatus.emergencyEnabled ? '#FF9500' : '#8E8E93' }
          ]}>
            {securityStatus.emergencyEnabled ? 'Ready' : 'Disabled'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={securityStatus.threatMonitoring ? 'eye' : 'eye-outline'}
            size={24}
            color={securityStatus.threatMonitoring ? '#007AFF' : '#8E8E93'}
          />
          <Text style={styles.systemTitle}>Threat Detection</Text>
          <Text style={[
            styles.systemStatus,
            { color: securityStatus.threatMonitoring ? '#007AFF' : '#8E8E93' }
          ]}>
            {securityStatus.threatMonitoring ? 'Monitoring' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.threatsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Security Events</Text>
          <View style={styles.threatBadge}>
            <Text style={styles.threatBadgeText}>
              {securityStatus.recentThreats}
            </Text>
          </View>
        </View>

        {recentThreats.length > 0 ? (
          <View style={styles.threatsList}>
            {recentThreats.map((threat) => (
              <View key={threat.id} style={styles.threatItem}>
                <View style={[
                  styles.severityIndicator,
                  { backgroundColor: getThreatSeverityColor(threat.severity) }
                ]} />
                <View style={styles.threatInfo}>
                  <Text style={styles.threatDescription}>{threat.description}</Text>
                  <Text style={styles.threatTime}>
                    {threat.type} • {formatTime(threat.timestamp)}
                  </Text>
                </View>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={getThreatSeverityColor(threat.severity)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noThreats}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            <Text style={styles.noThreatsText}>No recent security events</Text>
            <Text style={styles.noThreatsSubtext}>
              Your app is secure and functioning normally
            </Text>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => stealthManager.toggleMode()}
        >
          <Ionicons name="swap-horizontal" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Toggle App Mode</Text>
          <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={updateSecurityStatus}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Refresh Status</Text>
          <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => threatDetectionEngine.clearSecurityData()}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
            Clear Security Log
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  overallStatusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 16,
    marginTop: 0,
  },
  systemCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    marginRight: '2%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  systemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  systemStatus: {
    fontSize: 10,
    fontWeight: '500',
  },
  threatsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  threatBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  threatBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  threatsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  threatInfo: {
    flex: 1,
  },
  threatDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  threatTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  noThreats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
  },
  noThreatsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 12,
    marginBottom: 4,
  },
  noThreatsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    margin: 16,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});

export default SecurityMonitor;
