import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlankScreenStealthComponent } from '../../components/stealth/BlankScreenStealth';
import { useVideoAccessAuth } from '../../components/security/VideoAccessPin';
import {
  activateBlankScreen,
  enableBlankScreenStealth,
  isBlankScreenActive,
} from '../../lib/stealth';
import { setNewRecordingDetected } from '../../lib/security/biometricAuth';
import { colors, spacing, typography } from '../../constants/theme';

export default function Phase3DemoScreen() {
  const [isBlankActive, setIsBlankActive] = useState(false);

  const { requestVideoAccess, VideoAccessPinModal } = useVideoAccessAuth();

  useEffect(() => {
    // Initialize features
    enableBlankScreenStealth();

    // Check blank screen status
    const BLANK_SCREEN_CHECK_INTERVAL = 1000;
    const interval = setInterval(() => {
      setIsBlankActive(isBlankScreenActive());
    }, BLANK_SCREEN_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleActivateBlankScreen = async () => {
    Alert.alert(
      'Activate Blank Screen',
      'Your screen will appear completely off. Use triple tap or long press (3 seconds) to deactivate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            const success = await activateBlankScreen();
            if (!success) {
              Alert.alert('Error', 'Failed to activate blank screen mode.');
            }
          },
        },
      ]
    );
  };

  const handleVideoAccess = () => {
    requestVideoAccess(() => {
      Alert.alert(
        'Video Access Granted',
        'You now have access to video recordings. This simulates accessing video files.',
        [{ text: 'OK' }]
      );
    });
  };

  const simulateNewRecording = async () => {
    await setNewRecordingDetected(true);
    Alert.alert(
      'New Recording Detected',
      'A new recording has been simulated. The next video access will require PIN authentication.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <BlankScreenStealthComponent />
      <VideoAccessPinModal />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          <Text style={styles.title}>Phase 3 Demo</Text>
          <Text style={styles.subtitle}>Advanced Stealth Features</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Blank Screen Stealth</Text>
          </View>

          <Text style={styles.description}>
            This feature makes your device appear completely off while the app
            continues running in stealth mode.
          </Text>

          <View style={styles.featureBox}>
            <View style={styles.featureRow}>
              <Ionicons name="eye-off" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Completely black screen</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="hand-left" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Triple tap to deactivate</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={styles.featureText}>
                Long press (3s) alternative
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.demoButton,
              isBlankActive
                ? styles.demoButtonDisabled
                : styles.demoButtonActive,
            ]}
            onPress={handleActivateBlankScreen}
            disabled={isBlankActive}
          >
            <Ionicons
              name={isBlankActive ? 'checkmark-circle' : 'power'}
              size={20}
              color={isBlankActive ? colors.success : colors.background}
            />
            <Text
              style={[
                styles.demoButtonText,
                isBlankActive ? styles.demoButtonTextDisabled : {},
              ]}
            >
              {isBlankActive ? 'Blank Screen Active' : 'Try Blank Screen'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={24} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Video Access PIN</Text>
          </View>

          <Text style={styles.description}>
            Enhanced security requires PIN authentication when accessing videos
            after new recordings are detected.
          </Text>

          <View style={styles.featureBox}>
            <View style={styles.featureRow}>
              <Ionicons name="shield" size={20} color={colors.primary} />
              <Text style={styles.featureText}>PIN protection for videos</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="recording" size={20} color={colors.primary} />
              <Text style={styles.featureText}>
                Triggered by new recordings
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="key" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Secure PIN storage</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleVideoAccess}
          >
            <Ionicons name="play-circle" size={20} color={colors.background} />
            <Text style={styles.demoButtonText}>Test Video Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={simulateNewRecording}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>
              Simulate New Recording
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.text.secondary} />
            <Text style={styles.infoTitle}>How to Use</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Blank Screen:</Text> Tap "Try Blank
              Screen" above. Screen will go completely black. Triple tap or long
              press to return.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Video PIN:</Text> First access will
              prompt you to set a PIN. After simulating a new recording, PIN
              will be required again.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These Phase 3 features provide maximum stealth and security for
            sensitive situations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold as any,
    marginTop: spacing.md,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.background,
    marginTop: spacing.md,
    paddingVertical: spacing.lg + spacing.xs,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.semiBold as any,
    marginLeft: spacing.sm + spacing.xs,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.lg,
  },
  featureBox: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginLeft: spacing.md,
    flex: 1,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
  },
  demoButtonActive: {
    backgroundColor: colors.primary,
  },
  demoButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
  },
  demoButtonText: {
    color: colors.background,
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  demoButtonTextDisabled: {
    color: colors.success,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.body,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  infoSection: {
    backgroundColor: colors.background,
    marginTop: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  infoNumber: {
    fontSize: typography.fontSize.body,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.surface,
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    marginRight: spacing.lg,
    marginTop: 2,
  },
  infoText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
