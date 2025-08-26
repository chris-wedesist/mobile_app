import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';
import { stealthManager } from '../../lib/stealth';
import { SecurityMonitor } from '../../components/security/SecurityMonitor';
import { BiometricPrompt } from '../../components/security/BiometricPrompt';
import { EmergencyPanel } from '../../components/security/EmergencyPanel';
import { ScreenProtector } from '../../components/security/ScreenProtector';
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { screenProtectionManager } from '../../lib/security/screenProtection';
import { emergencyProtocolManager } from '../../lib/security/emergencyProtocols';
import { threatDetectionEngine } from '../../lib/security/threatDetection';

type TabType = 'monitor' | 'auth' | 'emergency' | 'settings';

interface SecuritySummary {
  isSecure: boolean;
  activeFeatures: number;
  totalFeatures: number;
  lastThreatCount: number;
  recommendedActions: string[];
}

const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary>({
    isSecure: false,
    activeFeatures: 0,
    totalFeatures: 5,
    lastThreatCount: 0,
    recommendedActions: [],
  });
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = async () => {
    try {
      // Initialize all security systems
      await Promise.all([
        stealthManager.initialize(),
        biometricAuthManager.initialize(),
        screenProtectionManager.initialize(),
        emergencyProtocolManager.initialize(),
        threatDetectionEngine.initialize(),
      ]);

      await updateSecuritySummary();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize security systems:', error);
      Alert.alert(
        'Security Error',
        'Failed to initialize security systems. Some features may not work correctly.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateSecuritySummary = async () => {
    try {
      const [
        stealthStatus,
        biometricEnabled,
        screenStatus,
        emergencyConfig,
        threatStatus,
      ] = await Promise.all([
        stealthManager.getSecurityStatus(),
        biometricAuthManager.isEnabled(),
        screenProtectionManager.getProtectionStatus(),
        emergencyProtocolManager.getConfig(),
        threatDetectionEngine.getSecurityStatus(),
      ]);

      const recentThreats = threatDetectionEngine.getRecentThreats(24 * 60); // Last 24 hours

      let activeFeatures = 0;
      const recommendations: string[] = [];

      // Check biometric authentication
      if (biometricEnabled) {
        activeFeatures++;
      } else {
        recommendations.push(
          'Enable biometric authentication for enhanced security'
        );
      }

      // Check screen protection
      if (screenStatus.isActive) {
        activeFeatures++;
      } else {
        recommendations.push('Enable screen protection to prevent screenshots');
      }

      // Check emergency protocols
      if (emergencyConfig.isEnabled) {
        activeFeatures++;
      } else {
        recommendations.push('Configure emergency protocols for safety');
      }

      // Check threat monitoring
      if (threatStatus.monitoring) {
        activeFeatures++;
      } else {
        recommendations.push('Enable threat detection monitoring');
      }

      // Check stealth mode configuration
      if (stealthStatus.securityLevel === 'high') {
        activeFeatures++;
      } else {
        recommendations.push('Optimize stealth mode security settings');
      }

      const isSecure = activeFeatures >= 4 && recentThreats.length === 0;

      setSecuritySummary({
        isSecure,
        activeFeatures,
        totalFeatures: 5,
        lastThreatCount: recentThreats.length,
        recommendedActions: recommendations.slice(0, 3), // Show top 3 recommendations
      });
    } catch (error) {
      console.error('Failed to update security summary:', error);
    }
  };

  const handleQuickAuth = async () => {
    try {
      const isAvailable =
        await biometricAuthManager.checkBiometricAvailability();
      if (isAvailable.isAvailable) {
        setShowBiometricPrompt(true);
      } else {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available on this device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Quick auth error:', error);
    }
  };

  const handleEmergencyAccess = () => {
    Alert.alert(
      'Emergency Access',
      'Are you in an emergency situation? This will open emergency protocols.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency',
          style: 'destructive',
          onPress: () => setShowEmergencyPanel(true),
        },
      ]
    );
  };

  const navigateToSetup = (screen: string) => {
    router.push(`/${screen}` as any as any);
  };

  const getSecurityStatusColor = () => {
    if (securitySummary.isSecure) return colors.success;
    if (securitySummary.activeFeatures >= 3) return colors.warning;
    return colors.error;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitor':
        return <SecurityMonitor />;
      case 'auth':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Authentication</Text>
            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => navigateToSetup('biometric-setup')}
            >
              <Ionicons name="finger-print" size={24} color={colors.primary} />
              <View style={styles.setupCardContent}>
                <Text style={styles.setupCardTitle}>Biometric Setup</Text>
                <Text style={styles.setupCardDesc}>
                  Configure fingerprint/Face ID
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        );
      case 'emergency':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Emergency Protocols</Text>
            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => navigateToSetup('emergency-setup')}
            >
              <Ionicons name="warning" size={24} color={colors.warning} />
              <View style={styles.setupCardContent}>
                <Text style={styles.setupCardTitle}>Emergency Setup</Text>
                <Text style={styles.setupCardDesc}>
                  Configure emergency contacts
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Security Settings</Text>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => navigateToSetup('security-test')}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
              <View style={styles.setupCardContent}>
                <Text style={styles.setupCardTitle}>Security Test</Text>
                <Text style={styles.setupCardDesc}>
                  Test all security features
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => stealthManager.toggleMode()}
            >
              <Ionicons
                name="swap-horizontal"
                size={24}
                color={colors.primary}
              />
              <View style={styles.setupCardContent}>
                <Text style={styles.setupCardTitle}>Toggle App Mode</Text>
                <Text style={styles.setupCardDesc}>Switch between modes</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => screenProtectionManager.enableScreenProtection()}
            >
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.success}
              />
              <View style={styles.setupCardContent}>
                <Text style={styles.setupCardTitle}>Screen Protection</Text>
                <Text style={styles.setupCardDesc}>
                  Enable screenshot protection
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="shield" size={64} color={colors.primary} />
        <Text style={styles.loadingText}>Initializing Security...</Text>
      </View>
    );
  }

  return (
    <ScreenProtector>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Security Dashboard</Text>
            <TouchableOpacity onPress={updateSecuritySummary}>
              <Ionicons name="refresh" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Security Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryStatus}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getSecurityStatusColor() },
                ]}
              />
              <Text style={styles.statusText}>
                {securitySummary.isSecure ? 'Secure' : 'Needs Attention'}
              </Text>
              <Text style={styles.featuresCount}>
                {securitySummary.activeFeatures}/{securitySummary.totalFeatures}{' '}
                Active
              </Text>
            </View>

            {securitySummary.recommendedActions.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>
                  Recommendations:
                </Text>
                {securitySummary.recommendedActions.map((action, index) => (
                  <Text key={index} style={styles.recommendationItem}>
                    • {action}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleQuickAuth}
          >
            <Ionicons name="finger-print" size={20} color={colors.background} />
            <Text style={styles.quickActionText}>Quick Auth</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.emergencyButton]}
            onPress={handleEmergencyAccess}
          >
            <Ionicons name="warning" size={20} color={colors.background} />
            <Text style={styles.quickActionText}>Emergency</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monitor' && styles.activeTab]}
            onPress={() => setActiveTab('monitor')}
          >
            <Ionicons
              name="analytics"
              size={20}
              color={
                activeTab === 'monitor' ? colors.primary : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'monitor' && styles.activeTabText,
              ]}
            >
              Monitor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'auth' && styles.activeTab]}
            onPress={() => setActiveTab('auth')}
          >
            <Ionicons
              name="finger-print"
              size={20}
              color={
                activeTab === 'auth' ? colors.primary : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'auth' && styles.activeTabText,
              ]}
            >
              Auth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'emergency' && styles.activeTab]}
            onPress={() => setActiveTab('emergency')}
          >
            <Ionicons
              name="warning"
              size={20}
              color={
                activeTab === 'emergency'
                  ? colors.primary
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'emergency' && styles.activeTabText,
              ]}
            >
              Emergency
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Ionicons
              name="settings"
              size={20}
              color={
                activeTab === 'settings'
                  ? colors.primary
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'settings' && styles.activeTabText,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>{renderTabContent()}</View>

        {/* Modals */}
        <BiometricPrompt
          visible={showBiometricPrompt}
          onSuccess={() => {
            setShowBiometricPrompt(false);
            Alert.alert('Success', 'Biometric authentication successful!');
          }}
          onCancel={() => {
            setShowBiometricPrompt(false);
          }}
          onFallback={() => {
            setShowBiometricPrompt(false);
            Alert.alert('Fallback', 'Please use your PIN or password');
          }}
        />

        <Modal
          visible={showEmergencyPanel}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Protocols</Text>
              <TouchableOpacity onPress={() => setShowEmergencyPanel(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <EmergencyPanel
              visible={true}
              onClose={() => setShowEmergencyPanel(false)}
              onEmergencyTriggered={() => {
                setShowEmergencyPanel(false);
                Alert.alert(
                  'Emergency Triggered',
                  'Emergency protocols have been activated'
                );
              }}
            />
          </View>
        </Modal>
      </View>
    </ScreenProtector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text.secondary,
    marginTop: 16,
  },
  header: {
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: colors.text.primary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: 16,
  },
  summaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  featuresCount: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  recommendations: {
    marginTop: spacing.sm,
  },
  recommendationsTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  recommendationItem: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emergencyButton: {
    backgroundColor: colors.warning,
  },
  quickActionText: {
    color: colors.background,
    fontSize: typography.fontSize.small,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  tabTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  setupCardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  setupCardTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  setupCardDesc: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.heading,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default SecurityDashboard;
