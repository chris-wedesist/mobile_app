import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { stealthManager } from '../../lib/stealth';
import { blankScreenStealthManager } from '../../lib/security/blankScreenStealth';
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { useVideoAccessAuth } from '../security/VideoAccessPin';

const { width } = Dimensions.get('window');

export const Phase3AdvancedStealthSettings: React.FC = () => {
  const [blankScreenEnabled, setBlankScreenEnabled] = useState(false);
  const [blankScreenConfig, setBlankScreenConfig] = useState<any>({});
  const [videoAccessPinEnabled, setVideoAccessPinEnabled] = useState(false);
  const [hasNewRecording, setHasNewRecording] = useState(false);
  const [isBlankScreenActive, setIsBlankScreenActive] = useState(false);

  const { requestVideoAccess, VideoAccessPinModal } = useVideoAccessAuth();

  useEffect(() => {
    loadSettings();

    // Set up interval to check blank screen status
    const interval = setInterval(() => {
      setIsBlankScreenActive(blankScreenStealthManager.isActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      await stealthManager.initialize();
      await blankScreenStealthManager.initialize();

      const stealthConfig = await stealthManager.getConfig();
      const blankConfig = await blankScreenStealthManager.exportConfig();
      const biometricConfig = biometricAuthManager.getConfig();

      setBlankScreenEnabled(stealthConfig.blankScreenStealthEnabled);
      setBlankScreenConfig(blankConfig);
      setVideoAccessPinEnabled(biometricConfig.videoAccessPinEnabled);
      setHasNewRecording(biometricConfig.newRecordingDetected);
      setIsBlankScreenActive(blankScreenStealthManager.isActive());
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleBlankScreenStealth = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await stealthManager.enableBlankScreenStealth();
        if (success) {
          setBlankScreenEnabled(true);
          Alert.alert(
            'Blank Screen Stealth Enabled',
            'You can now activate blank screen mode from the stealth options. The screen will appear completely off until deactivated.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const success = await stealthManager.disableBlankScreenStealth();
        if (success) {
          setBlankScreenEnabled(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle blank screen stealth:', error);
      Alert.alert('Error', 'Failed to update blank screen stealth setting.');
    }
  };

  const toggleVideoAccessPin = async (enabled: boolean) => {
    try {
      if (enabled) {
        // First time setup - show PIN creation modal
        requestVideoAccess(() => {
          setVideoAccessPinEnabled(true);
          Alert.alert(
            'Video Access PIN Enabled',
            'PIN protection is now required when accessing videos after new recordings.',
            [{ text: 'OK' }]
          );
        });
      } else {
        await biometricAuthManager.disableVideoAccessPin();
        setVideoAccessPinEnabled(false);
        Alert.alert(
          'Video Access PIN Disabled',
          'PIN protection for video access has been disabled.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to toggle video access PIN:', error);
      Alert.alert('Error', 'Failed to update video access PIN setting.');
    }
  };

  const activateBlankScreen = async () => {
    if (!blankScreenEnabled) {
      Alert.alert(
        'Feature Not Enabled',
        'Please enable Blank Screen Stealth first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Activate Blank Screen',
      `The screen will appear completely off. Use ${
        blankScreenConfig.activationMethod === 'long_press'
          ? 'long press'
          : blankScreenConfig.activationMethod === 'gesture'
          ? 'triple tap'
          : 'long press or triple tap'
      } to deactivate.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            const success = await stealthManager.activateBlankScreen();
            if (!success) {
              Alert.alert('Error', 'Failed to activate blank screen mode.');
            }
          },
        },
      ]
    );
  };

  const testVideoAccess = () => {
    requestVideoAccess(() => {
      Alert.alert(
        'Video Access Granted',
        'You now have access to video recordings.',
        [{ text: 'OK' }]
      );
    });
  };

  const simulateNewRecording = async () => {
    await biometricAuthManager.setNewRecordingDetected(true);
    setHasNewRecording(true);
    Alert.alert(
      'New Recording Simulated',
      'The next video access attempt will require PIN authentication.',
      [{ text: 'OK' }]
    );
  };

  const configureBlankScreenSettings = () => {
    Alert.alert('Blank Screen Configuration', 'Choose deactivation method:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Long Press Only',
        onPress: () =>
          blankScreenStealthManager.setActivationMethod('long_press'),
      },
      {
        text: 'Triple Tap Only',
        onPress: () => blankScreenStealthManager.setActivationMethod('gesture'),
      },
      {
        text: 'Both Methods',
        onPress: () => blankScreenStealthManager.setActivationMethod('both'),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <VideoAccessPinModal />

      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>Phase 3: Advanced Stealth</Text>
        <Text style={styles.headerSubtitle}>Enhanced security features</Text>
      </View>

      {/* Blank Screen Stealth Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="phone-portrait-outline" size={24} color={colors.text.secondary} />
          <Text style={styles.sectionTitle}>Blank Screen Stealth</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Enable Blank Screen Mode</Text>
            <Text style={styles.settingDescription}>
              Make device appear completely off
            </Text>
          </View>
          <Switch
            value={blankScreenEnabled}
            onValueChange={toggleBlankScreenStealth}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {blankScreenEnabled && (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isBlankScreenActive
                  ? styles.actionButtonActive
                  : styles.actionButtonInactive,
              ]}
              onPress={activateBlankScreen}
              disabled={isBlankScreenActive}
            >
              <Ionicons
                name={isBlankScreenActive ? 'checkmark-circle' : 'power'}
                size={20}
                color={isBlankScreenActive ? colors.success : colors.background}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isBlankScreenActive ? styles.actionButtonTextActive : {},
                ]}
              >
                {isBlankScreenActive
                  ? 'Blank Screen Active'
                  : 'Activate Blank Screen'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configButton}
              onPress={configureBlankScreenSettings}
            >
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={styles.configButtonText}>
                Configure Deactivation
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Deactivation:{' '}
                {blankScreenConfig.activationMethod === 'long_press'
                  ? 'Long press (3s)'
                  : blankScreenConfig.activationMethod === 'gesture'
                  ? 'Triple tap'
                  : 'Long press or triple tap'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Video Access PIN Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="videocam" size={24} color={colors.text.secondary} />
          <Text style={styles.sectionTitle}>Video Access Security</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>PIN for Video Access</Text>
            <Text style={styles.settingDescription}>
              Require PIN after new recordings
            </Text>
          </View>
          <Switch
            value={videoAccessPinEnabled}
            onValueChange={toggleVideoAccessPin}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {videoAccessPinEnabled && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={testVideoAccess}
            >
              <Ionicons name="play-circle-outline" size={20} color={colors.background} />
              <Text style={styles.actionButtonText}>Test Video Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configButton}
              onPress={simulateNewRecording}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.configButtonText}>
                Simulate New Recording
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>New recording detected:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    hasNewRecording
                      ? styles.statusBadgeWarning
                      : styles.statusBadgeSuccess,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {hasNewRecording ? 'YES' : 'NO'}
                  </Text>
                </View>
              </View>
              <Text style={styles.infoText}>
                {hasNewRecording
                  ? 'PIN required for next video access'
                  : 'No PIN required currently'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Security Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={24} color={colors.text.secondary} />
          <Text style={styles.sectionTitle}>Phase 3 Security Status</Text>
        </View>

        <View style={styles.securityGrid}>
          <View style={styles.securityItem}>
            <Ionicons
              name={blankScreenEnabled ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={blankScreenEnabled ? colors.success : colors.error}
            />
            <Text style={styles.securityItemText}>Blank Screen</Text>
          </View>

          <View style={styles.securityItem}>
            <Ionicons
              name={videoAccessPinEnabled ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={videoAccessPinEnabled ? colors.success : colors.error}
            />
            <Text style={styles.securityItemText}>Video PIN</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Phase 3 introduces advanced stealth capabilities for maximum security
        </Text>
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
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.background,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonActive: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  actionButtonInactive: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextActive: {
    color: '#28a745',
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  configButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeSuccess: {
    backgroundColor: '#d4edda',
  },
  statusBadgeWarning: {
    backgroundColor: '#fff3cd',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  securityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  securityItem: {
    alignItems: 'center',
  },
  securityItemText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Phase3AdvancedStealthSettings;
