import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
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
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { screenProtectionManager } from '../../lib/security/screenProtection';
import { emergencyProtocolManager } from '../../lib/security/emergencyProtocols';
import { threatDetectionEngine } from '../../lib/security/threatDetection';
import { BiometricPrompt } from '../../components/security/BiometricPrompt';
import { ScreenProtectionStatus } from '../../components/security/ScreenProtector';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  icon: string;
}

export default function SecurityTestScreen() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showBiometricTest, setShowBiometricTest] = useState(false);
  const [overallStatus, setOverallStatus] = useState<
    'pass' | 'fail' | 'warning' | 'pending'
  >('pending');

  useEffect(() => {
    runSecurityTests();
  }, []);

  const runSecurityTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Stealth Manager Initialization
      try {
        await stealthManager.initialize();
        const mode = await stealthManager.getCurrentMode();
        results.push({
          name: 'Stealth Manager',
          status: 'pass',
          message: `Initialized successfully. Current mode: ${mode}`,
          icon: 'checkmark-circle',
        });
      } catch (error) {
        results.push({
          name: 'Stealth Manager',
          status: 'fail',
          message: 'Failed to initialize stealth manager',
          icon: 'close-circle',
        });
      }

      // Test 2: Biometric Authentication
      try {
        await biometricAuthManager.initialize();
        const availability =
          await biometricAuthManager.checkBiometricAvailability();
        const isEnabled = biometricAuthManager.isEnabled();

        if (availability.isAvailable) {
          results.push({
            name: 'Biometric Authentication',
            status: isEnabled ? 'pass' : 'warning',
            message: isEnabled
              ? `${availability.biometricType} authentication enabled`
              : `${availability.biometricType} available but not enabled`,
            icon: isEnabled ? 'checkmark-circle' : 'warning',
          });
        } else {
          results.push({
            name: 'Biometric Authentication',
            status: 'warning',
            message: 'Biometric authentication not available on device',
            icon: 'warning',
          });
        }
      } catch (error) {
        results.push({
          name: 'Biometric Authentication',
          status: 'fail',
          message: 'Failed to check biometric availability',
          icon: 'close-circle',
        });
      }

      // Test 3: Screen Protection
      try {
        await screenProtectionManager.initialize();
        const protectionStatus = screenProtectionManager.getProtectionStatus();

        results.push({
          name: 'Screen Protection',
          status: protectionStatus.isActive ? 'pass' : 'warning',
          message: protectionStatus.isActive
            ? 'Screen protection is active'
            : 'Screen protection is not active',
          icon: protectionStatus.isActive ? 'checkmark-circle' : 'warning',
        });
      } catch (error) {
        results.push({
          name: 'Screen Protection',
          status: 'fail',
          message: 'Failed to initialize screen protection',
          icon: 'close-circle',
        });
      }

      // Test 4: Emergency Protocols
      try {
        await emergencyProtocolManager.initialize();
        const emergencyConfig = emergencyProtocolManager.getConfig();
        const contacts = emergencyProtocolManager.getEmergencyContacts();

        if (emergencyConfig.isEnabled && contacts.length > 0) {
          results.push({
            name: 'Emergency Protocols',
            status: 'pass',
            message: `Enabled with ${contacts.length} contact(s)`,
            icon: 'checkmark-circle',
          });
        } else if (emergencyConfig.isEnabled) {
          results.push({
            name: 'Emergency Protocols',
            status: 'warning',
            message: 'Enabled but no emergency contacts configured',
            icon: 'warning',
          });
        } else {
          results.push({
            name: 'Emergency Protocols',
            status: 'warning',
            message: 'Emergency protocols are disabled',
            icon: 'warning',
          });
        }
      } catch (error) {
        results.push({
          name: 'Emergency Protocols',
          status: 'fail',
          message: 'Failed to check emergency protocols',
          icon: 'close-circle',
        });
      }

      // Test 5: Threat Detection
      try {
        await threatDetectionEngine.initialize();
        const threatStatus = threatDetectionEngine.getSecurityStatus();

        results.push({
          name: 'Threat Detection',
          status: threatStatus.monitoring ? 'pass' : 'warning',
          message: threatStatus.monitoring
            ? `Monitoring active - Risk level: ${threatStatus.riskLevel}`
            : 'Threat detection not monitoring',
          icon: threatStatus.monitoring ? 'checkmark-circle' : 'warning',
        });
      } catch (error) {
        results.push({
          name: 'Threat Detection',
          status: 'fail',
          message: 'Failed to initialize threat detection',
          icon: 'close-circle',
        });
      }

      // Test 6: Security Integration
      try {
        const securityStatus = await stealthManager.getSecurityStatus();

        results.push({
          name: 'Security Integration',
          status: securityStatus.securityLevel === 'low' ? 'warning' : 'pass',
          message: `Security level: ${securityStatus.securityLevel}`,
          icon:
            securityStatus.securityLevel === 'low'
              ? 'warning'
              : 'checkmark-circle',
        });
      } catch (error) {
        results.push({
          name: 'Security Integration',
          status: 'fail',
          message: 'Failed to check security integration',
          icon: 'close-circle',
        });
      }

      setTestResults(results);

      // Calculate overall status
      const failCount = results.filter((r) => r.status === 'fail').length;
      const warningCount = results.filter((r) => r.status === 'warning').length;

      if (failCount > 0) {
        setOverallStatus('fail');
      } else if (warningCount > 0) {
        setOverallStatus('warning');
      } else {
        setOverallStatus('pass');
      }
    } catch (error) {
      console.error('Error running security tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleTestBiometric = async () => {
    const isEnabled = biometricAuthManager.isEnabled();

    if (!isEnabled) {
      Alert.alert(
        'Biometric Not Enabled',
        'Biometric authentication is not enabled. Would you like to set it up?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Setup',
            onPress: () => router.push('/biometric-setup' as any as any),
          },
        ]
      );
      return;
    }

    setShowBiometricTest(true);
  };

  const handleBiometricTestSuccess = () => {
    setShowBiometricTest(false);
    Alert.alert(
      'Biometric Test Passed',
      'Biometric authentication is working correctly.',
      [{ text: 'OK' }]
    );
  };

  const handleTestEmergency = () => {
    Alert.alert(
      'Emergency Test',
      'This will simulate an emergency trigger. Your emergency contacts will NOT be notified. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: () => {
            // Simulate emergency without actually triggering
            Alert.alert(
              'Emergency Test Complete',
              'Emergency protocols would activate:\n• Switch to stealth mode\n• Alert emergency contacts\n• Log security event',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleTestScreenProtection = async () => {
    try {
      const status = screenProtectionManager.getProtectionStatus();

      Alert.alert(
        'Screen Protection Test',
        `Current Status:\n• Screenshots: ${
          status.screenshotsBlocked ? 'Blocked' : 'Allowed'
        }\n• Recording: ${
          status.recordingBlocked ? 'Blocked' : 'Allowed'
        }\n• Background: ${
          status.backgroundProtected ? 'Protected' : 'Exposed'
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test screen protection.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return colors.status.success;
      case 'warning':
        return colors.status.warning;
      case 'fail':
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'pass':
        return 'All security systems are functioning properly';
      case 'warning':
        return 'Some security features need attention';
      case 'fail':
        return 'Critical security issues detected';
      default:
        return 'Running security tests...';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  overallStatus === 'pass'
                    ? `${colors.status.success  }20`
                    : `${colors.status.error  }20`,
              },
            ]}
          >
            <Ionicons
              name={overallStatus === 'pass' ? 'shield-checkmark' : 'shield'}
              size={64}
              color={getStatusColor(overallStatus)}
            />
          </View>
          <Text style={styles.title}>Security Test</Text>
          <Text style={styles.description}>{getOverallStatusMessage()}</Text>
        </View>

        <View style={styles.overallStatusSection}>
          <View
            style={[
              styles.statusCard,
              { borderColor: getStatusColor(overallStatus) },
            ]}
          >
            <Ionicons
              name={overallStatus === 'pass' ? 'checkmark-circle' : 'warning'}
              size={24}
              color={getStatusColor(overallStatus)}
            />
            <Text
              style={[
                styles.overallStatusText,
                { color: getStatusColor(overallStatus) },
              ]}
            >
              Overall Status: {overallStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.testResultsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={runSecurityTests}
              disabled={isRunningTests}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={colors.primary}
                style={[
                  styles.refreshIcon,
                  isRunningTests && styles.refreshIconSpinning,
                ]}
              />
              <Text style={styles.refreshButtonText}>
                {isRunningTests ? 'Testing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {testResults.map((result, index) => (
            <View key={index} style={styles.testResultItem}>
              <Ionicons
                name={result.icon as any}
                size={24}
                color={getStatusColor(result.status)}
              />
              <View style={styles.testResultInfo}>
                <Text style={styles.testResultName}>{result.name}</Text>
                <Text style={styles.testResultMessage}>{result.message}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(result.status) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.manualTestsSection}>
          <Text style={styles.sectionTitle}>Manual Tests</Text>

          <TouchableOpacity
            style={styles.manualTestButton}
            onPress={handleTestBiometric}
          >
            <Ionicons name="finger-print" size={24} color={colors.primary} />
            <View style={styles.manualTestInfo}>
              <Text style={styles.manualTestName}>
                Test Biometric Authentication
              </Text>
              <Text style={styles.manualTestDescription}>
                Verify biometric authentication is working
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualTestButton}
            onPress={handleTestScreenProtection}
          >
            <Ionicons name="shield" size={24} color={colors.primary} />
            <View style={styles.manualTestInfo}>
              <Text style={styles.manualTestName}>Test Screen Protection</Text>
              <Text style={styles.manualTestDescription}>
                Check screenshot and recording protection
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualTestButton}
            onPress={handleTestEmergency}
          >
            <Ionicons name="warning" size={24} color={colors.status.error} />
            <View style={styles.manualTestInfo}>
              <Text style={styles.manualTestName}>
                Test Emergency Protocols
              </Text>
              <Text style={styles.manualTestDescription}>
                Simulate emergency trigger (safe test)
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        <ScreenProtectionStatus />

        <View style={styles.navigationSection}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.background}
            />
            <Text style={styles.finishButtonText}>Finish Security Setup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push('/biometric-setup' as any as any)}
          >
            <Text style={styles.setupButtonText}>
              Configure Security Features
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BiometricPrompt
        visible={showBiometricTest}
        title="Biometric Test"
        subtitle="Authenticate to test biometric functionality"
        onSuccess={handleBiometricTestSuccess}
        onCancel={() => setShowBiometricTest(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 1.67, // 40px equivalent
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm + 2,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  overallStatusSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 2,
  },
  overallStatusText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    marginLeft: spacing.sm + 2,
  },
  testResultsSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.small,
  },
  refreshIcon: {
    marginRight: spacing.xs / 2,
  },
  refreshIconSpinning: {
    // Add rotation animation if needed
  },
  refreshButtonText: {
    fontSize: typography.fontSize.small,
    color: colors.primary,
  },
  testResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    marginBottom: spacing.xs,
  },
  testResultInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  testResultName: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  testResultMessage: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  statusBadge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.small,
    marginLeft: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
  manualTestsSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  manualTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    marginBottom: spacing.xs,
  },
  manualTestInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  manualTestName: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  manualTestDescription: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
  },
  navigationSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.status.success,
    borderRadius: radius.large,
    marginBottom: spacing.sm,
  },
  finishButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.background,
    marginLeft: spacing.xs,
  },
  setupButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  setupButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.primary,
  },
});
