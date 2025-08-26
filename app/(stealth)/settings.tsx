import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';
import { stealthManager } from '../../lib/stealth';
import { router } from 'expo-router';

export default function SettingsScreen() {
  // Fake settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hidden toggle mechanism
  const [versionTapCount, setVersionTapCount] = useState(0);
  const [lastVersionTap, setLastVersionTap] = useState(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    const now = Date.now();

    // Reset counter if too much time has passed (3 seconds)
    if (now - lastVersionTap > 3000) {
      setVersionTapCount(1);
    } else {
      setVersionTapCount((prev) => prev + 1);
    }

    setLastVersionTap(now);

    // Clear any existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Set a timeout to reset the counter
    tapTimeoutRef.current = setTimeout(() => {
      setVersionTapCount(0);
    }, 3000);

    // Check for 7 taps
    if (versionTapCount >= 6) {
      // 7th tap (0-indexed)
      setVersionTapCount(0);
      Vibration.vibrate(100);
      showHiddenMenu();
    }
  };

  const showHiddenMenu = () => {
    Alert.alert(
      'Developer Options',
      'Advanced settings detected. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Advanced Mode',
          onPress: () => handleModeToggle(),
        },
      ],
      { cancelable: true }
    );
  };

  const handleModeToggle = async () => {
    try {
      const success = await stealthManager.toggleMode();
      if (success) {
        // Navigate to normal mode
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Unable to switch modes at this time.');
      }
    } catch (error) {
      console.error('Failed to toggle mode:', error);
      Alert.alert('Error', 'An error occurred while switching modes.');
    }
  };

  const renderSettingsSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingsItem = (
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) =>
    renderSettingsItem(
      title,
      subtitle,
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.text.muted, true: colors.primary }}
        thumbColor={value ? colors.surface : colors.surface}
      />
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderSettingsSection(
          'Notifications',
          <>
            {renderSwitchItem(
              'Push Notifications',
              'Receive alerts and updates',
              notifications,
              setNotifications
            )}
            {renderSwitchItem(
              'Sound',
              'Play sounds for notifications',
              soundEnabled,
              setSoundEnabled
            )}
          </>
        )}

        {renderSettingsSection(
          'Display',
          <>
            {renderSwitchItem(
              'Dark Mode',
              'Use dark theme',
              darkMode,
              setDarkMode
            )}
          </>
        )}

        {renderSettingsSection(
          'Data & Storage',
          <>
            {renderSwitchItem(
              'Auto Backup',
              'Automatically backup your data',
              autoBackup,
              setAutoBackup
            )}
            {renderSettingsItem(
              'Storage Usage',
              '2.4 MB used',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () =>
                Alert.alert(
                  'Storage',
                  'Storage usage details would appear here.'
                )
            )}
          </>
        )}

        {renderSettingsSection(
          'Security',
          <>
            {renderSettingsItem(
              'Privacy',
              'Manage your privacy settings',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () =>
                Alert.alert('Privacy', 'Privacy settings would appear here.')
            )}
            {renderSettingsItem(
              'App Lock',
              'Secure app with biometrics',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () =>
                Alert.alert(
                  'App Lock',
                  'Biometric security settings would appear here.'
                )
            )}
          </>
        )}

        {renderSettingsSection(
          'Support',
          <>
            {renderSettingsItem(
              'Help & FAQ',
              'Get help and find answers',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () => Alert.alert('Help', 'Help documentation would appear here.')
            )}
            {renderSettingsItem(
              'Contact Support',
              'Get in touch with our team',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () =>
                Alert.alert('Support', 'Contact information would appear here.')
            )}
            {renderSettingsItem(
              'Rate App',
              'Share your feedback',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () => Alert.alert('Rate App', 'App store rating would open here.')
            )}
          </>
        )}

        {renderSettingsSection(
          'About',
          <>
            {renderSettingsItem(
              'Terms of Service',
              'Read our terms and conditions',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () => Alert.alert('Terms', 'Terms of service would appear here.')
            )}
            {renderSettingsItem(
              'Privacy Policy',
              'Read our privacy policy',
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.muted}
              />,
              () =>
                Alert.alert(
                  'Privacy Policy',
                  'Privacy policy would appear here.'
                )
            )}
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleVersionTap}
              activeOpacity={0.7}
            >
              <View style={styles.settingsItemContent}>
                <Text style={styles.settingsItemTitle}>Version</Text>
                <Text style={styles.settingsItemSubtitle}>1.0.0</Text>
              </View>
              <Text style={styles.versionText}>
                {versionTapCount > 0 && versionTapCount < 7 && (
                  <Text style={styles.tapIndicator}>{versionTapCount}/7</Text>
                )}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Calculator Pro</Text>
          <Text style={styles.footerSubtext}>© 2024 All rights reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.medium,
    shadowColor: shadows.medium.shadowColor,
    shadowOffset: shadows.medium.shadowOffset,
    shadowOpacity: shadows.medium.shadowOpacity,
    shadowRadius: shadows.medium.shadowRadius,
    elevation: shadows.medium.elevation,
  },
  sectionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: '600',
    color: colors.text.muted,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
  },
  versionText: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
  },
  tapIndicator: {
    fontSize: typography.fontSize.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
  },
});
