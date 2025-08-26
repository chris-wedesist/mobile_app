import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, typography, spacing, shadows } from '../constants/theme';
import { blankScreenStealthManager } from '../lib/security/blankScreenStealth';
import { threatIntelligenceEngine } from '../lib/intelligence/threatIntelligence';
import { coverApplicationsManager } from '../lib/stealth-advanced/coverApplications';
import { biometricAuthManager } from '../lib/security/biometricAuth';
import { CryptoManager } from '../lib/security/cryptoManager';
import { SecureStorageManager } from '../lib/security/secureStorage';

interface DemoFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'testing';
  action: () => Promise<void>;
}

export default function Phase3DemoScreen() {
  const [features, setFeatures] = useState<DemoFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingMode, setTestingMode] = useState(false);

  useEffect(() => {
    initializeDemoFeatures();
    loadTestingMode();
  }, []);

  const loadTestingMode = async () => {
    try {
      const config = await blankScreenStealthManager.exportConfig();
      setTestingMode(config.testingMode);
    } catch (error) {
      console.error('Failed to load testing mode:', error);
    }
  };

  const initializeDemoFeatures = () => {
    const demoFeatures: DemoFeature[] = [
      {
        id: 'blank_screen',
        title: 'Blank Screen Stealth',
        description: 'Activate blank screen mode to hide app content',
        icon: 'phonelink-off',
        status: 'inactive',
        action: demoBlankScreen,
      },
      {
        id: 'enhanced_crypto',
        title: 'Enhanced Cryptography',
        description: 'Test secure hashing, device fingerprinting, and crypto functions',
        icon: 'enhanced-encryption',
        status: 'inactive',
        action: demoEnhancedCrypto,
      },
      {
        id: 'threat_detection',
        title: 'Threat Intelligence',
        description: 'Run threat assessment and security analysis',
        icon: 'security',
        status: 'inactive',
        action: demoThreatDetection,
      },
      {
        id: 'cover_apps',
        title: 'Cover Applications',
        description: 'Switch between fake app interfaces',
        icon: 'apps',
        status: 'inactive',
        action: demoCoverApplications,
      },
      {
        id: 'biometric_auth',
        title: 'Enhanced Authentication',
        description: 'Test biometric and PIN authentication',
        icon: 'fingerprint',
        status: 'inactive',
        action: demoBiometricAuth,
      },
      {
        id: 'performance_metrics',
        title: 'Performance Analytics',
        description: 'View system performance and usage metrics',
        icon: 'analytics',
        status: 'inactive',
        action: demoPerformanceMetrics,
      },
      {
        id: 'remote_management',
        title: 'Remote Management',
        description: 'Test remote command execution and sync',
        icon: 'cloud-sync',
        status: 'inactive',
        action: demoRemoteManagement,
      },
    ];

    setFeatures(demoFeatures);
  };

  const demoEnhancedCrypto = async () => {
    try {
      setIsLoading(true);
      updateFeatureStatus('enhanced_crypto', 'testing');

      const cryptoManager = CryptoManager.getInstance();
      const storageManager = SecureStorageManager.getInstance();
      
      // Initialize both managers
      await Promise.all([
        cryptoManager.initialize(),
        storageManager.initialize()
      ]);

      // Test data
      const testData = 'sensitive_device_data_12345';
      
      // OLD METHOD (Base64 - insecure)
      const oldHash = Buffer.from(testData).toString('base64');
      
      // NEW METHOD (SHA-256 - secure)
      const secureHash = await cryptoManager.generateSecureHash(testData);
      
      // Generate device fingerprint
      const fingerprint = await cryptoManager.generateDeviceFingerprint();
      
      // Test secure storage with device binding
      const deviceBoundKey = await storageManager.generateDeviceBoundKey('crypto_test');
      await storageManager.setItem(deviceBoundKey, testData, { encrypt: true });
      
      // Get security status with real-time network monitoring
      const [securityStatus, networkSecurity, currentNetworkState] = await Promise.all([
        storageManager.getSecurityStatus(),
        cryptoManager.validateNetworkSecurity(),
        Promise.resolve(cryptoManager.getCurrentNetworkSecurity())
      ]);

      // Register a callback to demonstrate real-time monitoring
      const networkCallback = (securityInfo: any) => {
        console.log('🔄 Real-time network security update:', securityInfo);
      };
      cryptoManager.registerNetworkSecurityCallback(networkCallback);

      updateFeatureStatus('enhanced_crypto', 'active');

      Alert.alert(
        'Enhanced Crypto Demo Complete',
        `🔐 CRYPTOGRAPHIC UPGRADE DEMONSTRATION\n\n` +
        `OLD (Base64): ${oldHash.substring(0, 20)}...\n` +
        `NEW (SHA-256): ${secureHash.substring(0, 20)}...\n\n` +
        `📱 DEVICE FINGERPRINT:\n` +
        `Device: ${fingerprint.systemInfo.brand} ${fingerprint.systemInfo.model}\n` +
        `Security: ${fingerprint.securityFeatures.isEmulator ? 'Emulator' : 'Physical'}\n` +
        `Network: ${fingerprint.networkInfo.connectionType}\n\n` +
        `🌐 REAL-TIME NETWORK MONITORING:\n` +
        `Status: ${currentNetworkState.isMonitoring ? '✅ Active' : '❌ Inactive'}\n` +
        `Security Level: ${currentNetworkState.securityLevel.toUpperCase()}\n` +
        `Issues: ${networkSecurity.issues.length} detected\n\n` +
        `🛡️ SECURITY STATUS:\n` +
        `Encryption: ${securityStatus.encryptionActive ? '✅' : '❌'}\n` +
        `Device Integrity: ${securityStatus.deviceIntegrityValid ? '✅' : '⚠️'}\n` +
        `Network Security: ${securityStatus.networkSecure ? '✅' : '⚠️'}\n\n` +
        `✅ All crypto enhancements working!\n` +
        `🔄 Real-time monitoring enabled!`,
        [
          { 
            text: 'Stop Monitoring', 
            style: 'destructive',
            onPress: () => {
              cryptoManager.removeNetworkSecurityCallback(networkCallback);
              console.log('Network monitoring callback removed');
            }
          },
          { text: 'Excellent!', style: 'default' }
        ]
      );
    } catch (error) {
      updateFeatureStatus('enhanced_crypto', 'inactive');
      Alert.alert('Crypto Demo Error', `Failed to run crypto demo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const demoBlankScreen = async () => {
    try {
      Alert.alert(
        'Blank Screen Demo',
        'This will activate blank screen mode for 5 seconds. Triple-tap to deactivate.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              await blankScreenStealthManager.activateBlankScreen();

              // Auto-deactivate after 5 seconds for demo
              setTimeout(async () => {
                await blankScreenStealthManager.deactivateBlankScreen();
                Alert.alert('Demo Complete', 'Blank screen mode deactivated');
              }, 5000);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to demonstrate blank screen mode');
    }
  };

  const demoThreatDetection = async () => {
    try {
      setIsLoading(true);
      updateFeatureStatus('threat_detection', 'testing');

      const threat = await threatIntelligenceEngine.assessThreat({
        timestamp: new Date(),
        appState: 'active',
      });

      updateFeatureStatus('threat_detection', 'active');

      Alert.alert(
        'Threat Assessment Complete',
        `Risk Score: ${threat.riskScore}/100\nSeverity: ${
          threat.severity
        }\nConfidence: ${(threat.confidence * 100).toFixed(
          1
        )}%\n\nRecommendations:\n${threat.recommendations.join('\n')}`
      );
    } catch (error) {
      updateFeatureStatus('threat_detection', 'inactive');
      Alert.alert('Error', 'Failed to run threat assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCoverApplications = async () => {
    try {
      const availableCovers = coverApplicationsManager.getAvailableCovers();
      const activeCover = coverApplicationsManager.getActiveCover();

      const coverOptions = availableCovers.map((cover) => ({
        text: `${cover.name} ${cover.isActive ? '(Active)' : ''}`,
        onPress: () => {
          coverApplicationsManager.activateCover(cover.name);
          Alert.alert(
            'Cover Application Activated',
            `Now using: ${cover.name}\nDescription: ${cover.description}`
          );
        },
      }));

      Alert.alert(
        'Cover Applications Demo',
        `Current: ${
          activeCover?.name || 'None'
        }\n\nSelect a cover application:`,
        [...coverOptions, { text: 'Cancel', style: 'cancel' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to demonstrate cover applications');
    }
  };

  const demoBiometricAuth = async () => {
    try {
      const isEnabled = biometricAuthManager.isEnabled();
      const hasVideoPin = await biometricAuthManager.isVideoAccessPinEnabled();

      Alert.alert(
        'Authentication Demo',
        `Biometric Auth: ${isEnabled ? 'Enabled' : 'Disabled'}\nVideo PIN: ${
          hasVideoPin ? 'Set' : 'Not Set'
        }\n\nWhat would you like to test?`,
        [
          {
            text: 'Video Access',
            onPress: async () => {
              const success =
                await biometricAuthManager.authenticateForVideoAccess();
              Alert.alert(
                'Video Access Result',
                success ? 'Access granted' : 'Access denied'
              );
            },
          },
          {
            text: 'New Recording Check',
            onPress: async () => {
              const hasNew = biometricAuthManager.hasNewRecording();
              Alert.alert(
                'Recording Status',
                hasNew ? 'New recording detected' : 'No new recordings'
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to demonstrate authentication');
    }
  };

  const demoPerformanceMetrics = async () => {
    try {
      const metrics = blankScreenStealthManager.getPerformanceMetrics();
      const deviceId = blankScreenStealthManager.getDeviceId();

      Alert.alert(
        'Performance Metrics',
        `Device ID: ${deviceId}\n\nUsage Count: ${
          metrics.totalUsageCount
        }\nAvg Duration: ${(metrics.averageDuration / 1000).toFixed(
          1
        )}s\nLast Used: ${metrics.lastUsageTimestamp.toLocaleString()}\n\nActivation Time: ${
          metrics.activationTime
        }ms\nDeactivation Time: ${metrics.deactivationTime}ms`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve performance metrics');
    }
  };

  const demoRemoteManagement = async () => {
    try {
      const config = await blankScreenStealthManager.exportConfig();
      const commandCount = config.remoteManagement.remoteCommands.length;
      const lastSync = config.remoteManagement.lastSyncTime;

      Alert.alert(
        'Remote Management Demo',
        `Status: ${
          config.remoteManagement.enabled ? 'Enabled' : 'Disabled'
        }\nSync: ${
          config.remoteManagement.serverSyncEnabled ? 'Enabled' : 'Disabled'
        }\nCommands: ${commandCount}\nLast Sync: ${
          lastSync?.toLocaleString() || 'Never'
        }\n\nWhat would you like to test?`,
        [
          {
            text: 'Add Test Command',
            onPress: async () => {
              const commandId =
                await blankScreenStealthManager.addRemoteCommand({
                  command: 'report_status',
                  parameters: { demo: true },
                });
              Alert.alert('Command Added', `Command ID: ${commandId}`);
            },
          },
          {
            text: 'Run Diagnostics',
            onPress: async () => {
              await blankScreenStealthManager.runDiagnosticsNow();
              Alert.alert('Diagnostics', 'System diagnostics completed');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to demonstrate remote management');
    }
  };

  const updateFeatureStatus = (
    featureId: string,
    status: 'active' | 'inactive' | 'testing'
  ) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId ? { ...feature, status } : feature
      )
    );
  };

  const toggleTestingMode = async (enabled: boolean) => {
    try {
      await blankScreenStealthManager.enableTestingMode(enabled);
      setTestingMode(enabled);
      Alert.alert(
        'Testing Mode',
        enabled ? 'Testing mode enabled' : 'Testing mode disabled'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle testing mode');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'testing':
        return colors.warning;
      default:
        return colors.text.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'check-circle';
      case 'testing':
        return 'hourglass-empty';
      default:
        return 'radio-button-unchecked';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Phase 3 Demo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            This demo showcases advanced security features from Phase 3
            implementation. All features are functional and ready for testing.
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Testing Mode</Text>
            <Switch
              value={testingMode}
              onValueChange={toggleTestingMode}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
              thumbColor={testingMode ? colors.primary : colors.text.muted}
            />
          </View>
          <Text style={styles.settingDescription}>
            Enable additional logging and diagnostic information
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Demo Features</Text>

        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={feature.action}
            disabled={isLoading && feature.status === 'testing'}
          >
            <View style={styles.featureIcon}>
              <MaterialIcons
                name={feature.icon as any}
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.featureContent}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <View style={styles.statusIndicator}>
                  <MaterialIcons
                    name={getStatusIcon(feature.status) as any}
                    size={16}
                    color={getStatusColor(feature.status)}
                  />
                </View>
              </View>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>

            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.text.muted}
            />
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Phase 3: Intelligence & Network Security
          </Text>
          <Text style={styles.versionText}>
            Build Version: 1.0.0 • {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.body,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  settingLabel: {
    fontSize: typography.fontSize.subheading,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.muted,
  },
  sectionTitle: {
    fontSize: typography.fontSize.heading,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: typography.fontSize.subheading,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  statusIndicator: {
    marginLeft: spacing.sm,
  },
  featureDescription: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.subheading,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  versionText: {
    fontSize: typography.fontSize.caption,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.muted,
  },
});
