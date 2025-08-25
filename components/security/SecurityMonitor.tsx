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
import {
  colors,
  shadows,
  radius,
  typography,
  spacing,
} from '../../constants/theme';
import { stealthManager } from '../../lib/stealth';
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { screenProtectionManager } from '../../lib/security/screenProtection';
import { emergencyProtocolManager } from '../../lib/security/emergencyProtocols';
import {
  threatDetectionEngine,
  SecurityThreat,
} from '../../lib/security/threatDetection';

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
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.error;
      default:
        return colors.text.muted;
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
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.accent;
      case 'low':
        return colors.success;
      default:
        return colors.text.muted;
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
          colors={[colors.primary]}
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
              {securityStatus.overall === 'medium' &&
                'Some features need attention'}
              {securityStatus.overall === 'low' &&
                'Security improvements needed'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.systemsGrid}>
        <View style={styles.systemCard}>
          <Ionicons
            name={
              securityStatus.biometric ? 'finger-print' : 'finger-print-outline'
            }
            size={24}
            color={
              securityStatus.biometric ? colors.success : colors.text.muted
            }
          />
          <Text style={styles.systemTitle}>Biometric</Text>
          <Text
            style={[
              styles.systemStatus,
              {
                color: securityStatus.biometric
                  ? colors.success
                  : colors.text.muted,
              },
            ]}
          >
            {securityStatus.biometric ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={
              securityStatus.screenProtection
                ? 'shield-checkmark'
                : 'shield-outline'
            }
            size={24}
            color={
              securityStatus.screenProtection
                ? colors.success
                : colors.text.muted
            }
          />
          <Text style={styles.systemTitle}>Screen Protection</Text>
          <Text
            style={[
              styles.systemStatus,
              {
                color: securityStatus.screenProtection
                  ? colors.success
                  : colors.text.muted,
              },
            ]}
          >
            {securityStatus.screenProtection ? 'Protected' : 'Unprotected'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={
              securityStatus.emergencyEnabled ? 'warning' : 'warning-outline'
            }
            size={24}
            color={
              securityStatus.emergencyEnabled
                ? colors.warning
                : colors.text.muted
            }
          />
          <Text style={styles.systemTitle}>Emergency</Text>
          <Text
            style={[
              styles.systemStatus,
              {
                color: securityStatus.emergencyEnabled
                  ? colors.warning
                  : colors.text.muted,
              },
            ]}
          >
            {securityStatus.emergencyEnabled ? 'Ready' : 'Disabled'}
          </Text>
        </View>

        <View style={styles.systemCard}>
          <Ionicons
            name={securityStatus.threatMonitoring ? 'eye' : 'eye-outline'}
            size={24}
            color={
              securityStatus.threatMonitoring
                ? colors.primary
                : colors.text.muted
            }
          />
          <Text style={styles.systemTitle}>Threat Detection</Text>
          <Text
            style={[
              styles.systemStatus,
              {
                color: securityStatus.threatMonitoring
                  ? colors.primary
                  : colors.text.muted,
              },
            ]}
          >
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
                <View
                  style={[
                    styles.severityIndicator,
                    {
                      backgroundColor: getThreatSeverityColor(threat.severity),
                    },
                  ]}
                />
                <View style={styles.threatInfo}>
                  <Text style={styles.threatDescription}>
                    {threat.description}
                  </Text>
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
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={colors.success}
            />
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
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Toggle App Mode</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={updateSecurityStatus}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Refresh Status</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => threatDetectionEngine.clearSecurityData()}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
          <Text style={[styles.actionButtonText, { color: colors.error }]}>
            Clear Security Log
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.muted}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: colors.text.primary,
  },
  lastUpdate: {
    fontSize: typography.fontSize.caption,
    fontFamily: 'Inter-Regular',
    color: colors.text.secondary,
  },
  overallStatusCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    ...shadows.small,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  statusLevel: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: typography.fontSize.caption,
    fontFamily: 'Inter-Regular',
    color: colors.text.secondary,
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: spacing.md,
    marginTop: 0,
  },
  systemCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: radius.small,
    padding: spacing.md,
    marginBottom: spacing.xs,
    marginRight: '2%',
    alignItems: 'center',
    ...shadows.small,
  },
  systemTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: 4,
    textAlign: 'center',
  },
  systemStatus: {
    fontSize: typography.fontSize.small,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  threatsSection: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  threatBadge: {
    backgroundColor: colors.error,
    borderRadius: radius.large,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  threatBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
    color: colors.background,
  },
  threatsList: {
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    overflow: 'hidden',
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: radius.small,
    marginRight: spacing.sm,
  },
  threatInfo: {
    flex: 1,
  },
  threatDescription: {
    fontSize: typography.fontSize.caption,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  threatTime: {
    fontSize: typography.fontSize.caption,
    color: colors.text.muted,
  },
  noThreats: {
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  noThreatsText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.success,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  noThreatsSubtext: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickActions: {
    margin: spacing.md,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.medium,
    marginBottom: spacing.xs,
    ...shadows.small,
  },
  actionButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default SecurityMonitor;
