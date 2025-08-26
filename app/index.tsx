import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
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
} from '../constants/theme';
import { stealthManager } from '../lib/stealth';
import { biometricAuthManager } from '../lib/security/biometricAuth';
import { screenProtectionManager } from '../lib/security/screenProtection';
import { emergencyProtocolManager } from '../lib/security/emergencyProtocols';
import { threatDetectionEngine } from '../lib/security/threatDetection';
import { ScreenProtector } from '../components/security/ScreenProtector';

const { width, height } = Dimensions.get('window');

interface AppStatus {
  mode: 'normal' | 'stealth' | 'emergency';
  securityLevel: 'high' | 'medium' | 'low';
  activeFeatures: number;
  isInitialized: boolean;
}

const HomeScreen: React.FC = () => {
  const [appStatus, setAppStatus] = useState<AppStatus>({
    mode: 'normal',
    securityLevel: 'low',
    activeFeatures: 0,
    isInitialized: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // Initialize all security systems
      await Promise.all([
        stealthManager.initialize(),
        biometricAuthManager.initialize(),
        screenProtectionManager.initialize(),
        emergencyProtocolManager.initialize(),
        threatDetectionEngine.initialize(),
      ]);

      // Enable screen protection by default
      await screenProtectionManager.enableScreenProtection();

      // Get current app status
      await updateAppStatus();

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsLoading(false);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize security systems. Some features may not work correctly.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateAppStatus = async () => {
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

      let activeFeatures = 0;
      if (biometricEnabled) activeFeatures++;
      if (screenStatus.isActive) activeFeatures++;
      if (emergencyConfig.isEnabled) activeFeatures++;
      if (threatStatus.monitoring) activeFeatures++;
      if (stealthStatus.securityLevel === 'high') activeFeatures++;

      // Determine app mode based on current state
      let mode: 'normal' | 'stealth' | 'emergency' = 'normal';
      if (stealthStatus.securityLevel === 'high') {
        mode = 'stealth';
      }

      setAppStatus({
        mode,
        securityLevel: stealthStatus.securityLevel,
        activeFeatures,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to update app status:', error);
    }
  };

  const handleModeSwitch = async () => {
    try {
      await stealthManager.toggleMode();
      await updateAppStatus();

      Alert.alert(
        'Mode Switched',
        `App switched to ${
          appStatus.mode === 'stealth' ? 'normal' : 'stealth'
        } mode`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to switch mode:', error);
      Alert.alert('Error', 'Failed to switch app mode');
    }
  };

  const handleQuickAuth = async () => {
    try {
      const availability =
        await biometricAuthManager.checkBiometricAvailability();
      if (availability.isAvailable) {
        const result = await biometricAuthManager.authenticateWithBiometric();
        if (result.success) {
          Alert.alert('Success', 'Authentication successful!');
          router.push('/security-dashboard' as any as any);
        } else {
          Alert.alert('Failed', result.error || 'Authentication failed');
        }
      } else {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available on this device.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Setup',
              onPress: () => router.push('/biometric-setup' as any as any),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Quick auth error:', error);
      Alert.alert('Error', 'Authentication error occurred');
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Mode',
      'Are you in an emergency situation? This will trigger emergency protocols.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyProtocolManager.triggerEmergency('manual');
              Alert.alert(
                'Emergency Triggered',
                'Emergency protocols activated'
              );
            } catch (error) {
              console.error('Emergency trigger error:', error);
              Alert.alert('Error', 'Failed to trigger emergency protocols');
            }
          },
        },
      ]
    );
  };

  const getModeColor = () => {
    switch (appStatus.mode) {
      case 'stealth':
        return colors.mode.stealth;
      case 'emergency':
        return colors.mode.emergency;
      default:
        return colors.mode.normal;
    }
  };

  const getModeIcon = () => {
    switch (appStatus.mode) {
      case 'stealth':
        return 'eye-off';
      case 'emergency':
        return 'warning';
      default:
        return 'eye';
    }
  };

  const getSecurityColor = () => {
    switch (appStatus.securityLevel) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="shield" size={80} color={colors.primary} />
        <Text style={styles.loadingTitle}>DESIST</Text>
        <Text style={styles.loadingSubtitle}>Initializing Security...</Text>
      </View>
    );
  }

  return (
    <ScreenProtector>
      <View style={styles.container}>
        <StatusBar
          barStyle={
            appStatus.mode === 'stealth' ? 'light-content' : 'dark-content'
          }
          backgroundColor={
            appStatus.mode === 'stealth'
              ? colors.text.primary
              : colors.background
          }
        />

        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                appStatus.mode === 'stealth'
                  ? colors.text.primary
                  : colors.background,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[
                  styles.appTitle,
                  {
                    color:
                      appStatus.mode === 'stealth'
                        ? colors.background
                        : colors.text.primary,
                  },
                ]}
              >
                DESIST
              </Text>
              <Text
                style={[
                  styles.appSubtitle,
                  {
                    color:
                      appStatus.mode === 'stealth'
                        ? colors.text.muted
                        : colors.text.secondary,
                  },
                ]}
              >
                Digital Security & Privacy
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={updateAppStatus}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={
                  appStatus.mode === 'stealth'
                    ? colors.background
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.modeIndicator}>
              <Ionicons
                name={getModeIcon() as any}
                size={24}
                color={getModeColor()}
              />
              <Text style={styles.modeText}>
                {appStatus.mode.toUpperCase()} MODE
              </Text>
            </View>

            <View style={styles.securityLevel}>
              <View
                style={[
                  styles.securityDot,
                  { backgroundColor: getSecurityColor() },
                ]}
              />
              <Text style={styles.securityText}>
                Security: {appStatus.securityLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.featuresStatus}>
            <Text style={styles.featuresText}>
              {appStatus.activeFeatures}/5 Security Features Active
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(appStatus.activeFeatures / 5) * 100}%`,
                    backgroundColor: getSecurityColor(),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => router.push('/security-dashboard' as any as any)}
          >
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.background}
            />
            <Text style={styles.actionText}>Security Dashboard</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.background}
            />
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleModeSwitch}
            >
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Switch Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleQuickAuth}
            >
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Quick Auth
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyAction]}
            onPress={handleEmergency}
          >
            <Ionicons name="warning" size={20} color={colors.background} />
            <Text style={[styles.actionText, { color: colors.background }]}>
              Emergency
            </Text>
            <Ionicons name="alert-circle" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Setup Cards */}
        <View style={styles.setupSection}>
          <Text style={styles.sectionTitle}>Security Setup</Text>

          <View style={styles.setupGrid}>
            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/biometric-setup' as any as any)}
            >
              <Ionicons name="finger-print" size={32} color={colors.primary} />
              <Text style={styles.setupTitle}>Biometric</Text>
              <Text style={styles.setupSubtitle}>Face ID / Touch ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/emergency-setup' as any as any)}
            >
              <Ionicons name="people" size={32} color={colors.warning} />
              <Text style={styles.setupTitle}>Emergency</Text>
              <Text style={styles.setupSubtitle}>Contact Setup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/security-test' as any as any)}
            >
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={colors.success}
              />
              <Text style={styles.setupTitle}>Test</Text>
              <Text style={styles.setupSubtitle}>Security Check</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setupCard}
              onPress={() => router.push('/security-dashboard' as any as any)}
            >
              <Ionicons name="analytics" size={32} color={colors.secondary} />
              <Text style={styles.setupTitle}>Monitor</Text>
              <Text style={styles.setupSubtitle}>Live Status</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  loadingTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: '800',
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    letterSpacing: 2,
  },
  loadingSubtitle: {
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: '800',
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xs,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  statusCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.large,
    ...shadows.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  securityLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.round,
    marginRight: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  featuresStatus: {
    marginTop: spacing.sm,
  },
  featuresText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.small,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.small,
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  setupSection: {
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.heading,
    fontWeight: '600',
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  secondaryAction: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    marginRight: spacing.sm,
  },
  emergencyAction: {
    backgroundColor: colors.error,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  actionText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily.medium,
    color: colors.background,
    flex: 1,
    marginLeft: spacing.md,
  },
  setupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  setupCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: radius.medium,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  setupTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  setupSubtitle: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
