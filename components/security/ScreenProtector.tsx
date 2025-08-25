import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  AppStateStatus,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../constants/theme';
import { screenProtectionManager } from '../../lib/security/screenProtection';

interface ScreenProtectorProps {
  children: React.ReactNode;
  showPrivacyScreen?: boolean;
  blurIntensity?: number;
  privacyMessage?: string;
  privacyIcon?: string;
}

export const ScreenProtector: React.FC<ScreenProtectorProps> = ({
  children,
  showPrivacyScreen = true,
  blurIntensity = 80,
  privacyMessage = 'App is protected',
  privacyIcon = 'shield-checkmark',
}) => {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const [shouldShowPrivacy, setShouldShowPrivacy] = useState(false);
  const [shouldBlur, setShouldBlur] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Initialize screen protection
    initializeProtection();

    return () => {
      subscription?.remove();
    };
  }, []);

  const initializeProtection = async () => {
    try {
      await screenProtectionManager.initialize();
      updateProtectionState();
    } catch (error) {
      console.error('Failed to initialize screen protection:', error);
    }
  };

  const updateProtectionState = () => {
    const config = screenProtectionManager.getConfig();
    const isInBackground = appState === 'background' || appState === 'inactive';

    setShouldShowPrivacy(
      config.showPrivacyScreen && isInBackground && showPrivacyScreen
    );
    setShouldBlur(config.blurOnBackground && isInBackground);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    const isGoingToBackground =
      nextAppState === 'background' || nextAppState === 'inactive';
    const isComingToForeground =
      nextAppState === 'active' && appState !== 'active';

    if (isGoingToBackground) {
      // App is going to background - activate privacy protection
      setShouldShowPrivacy(showPrivacyScreen);
      setShouldBlur(true);
    } else if (isComingToForeground) {
      // App is coming to foreground - deactivate privacy protection
      setShouldShowPrivacy(false);
      setShouldBlur(false);
    }

    setAppState(nextAppState);
  };

  const renderPrivacyScreen = () => (
    <View style={styles.privacyOverlay}>
      <View style={styles.privacyContent}>
        <Ionicons
          name={privacyIcon as any}
          size={80}
          color={colors.primary}
          style={styles.privacyIcon}
        />
        <Text style={styles.privacyMessage}>{privacyMessage}</Text>
      </View>
    </View>
  );

  const renderBlurredContent = () => (
    <BlurView intensity={blurIntensity} style={styles.blurOverlay}>
      {shouldShowPrivacy && renderPrivacyScreen()}
    </BlurView>
  );

  return (
    <View style={styles.container}>
      {children}

      {shouldBlur && renderBlurredContent()}
      {shouldShowPrivacy && !shouldBlur && renderPrivacyScreen()}
    </View>
  );
};

export const withScreenProtection = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    showPrivacyScreen?: boolean;
    blurIntensity?: number;
    privacyMessage?: string;
    privacyIcon?: string;
  }
) => {
  return (props: P) => (
    <ScreenProtector
      showPrivacyScreen={options?.showPrivacyScreen}
      blurIntensity={options?.blurIntensity}
      privacyMessage={options?.privacyMessage}
      privacyIcon={options?.privacyIcon}
    >
      <Component {...props} />
    </ScreenProtector>
  );
};

export const ScreenProtectionStatus: React.FC = () => {
  const [status, setStatus] = useState({
    isActive: false,
    screenshotsBlocked: false,
    recordingBlocked: false,
    backgroundProtected: false,
  });

  useEffect(() => {
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = async () => {
    try {
      await screenProtectionManager.initialize();
      const protectionStatus = screenProtectionManager.getProtectionStatus();
      setStatus(protectionStatus);
    } catch (error) {
      console.error('Failed to get protection status:', error);
    }
  };

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <Ionicons
          name={status.isActive ? 'shield-checkmark' : 'shield-outline'}
          size={20}
          color={status.isActive ? colors.success : colors.text.muted}
        />
        <Text
          style={[
            styles.statusText,
            { color: status.isActive ? colors.success : colors.text.muted },
          ]}
        >
          Screen Protection {status.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {status.isActive && (
        <View style={styles.statusDetails}>
          <View style={styles.statusDetailRow}>
            <Ionicons
              name={
                status.screenshotsBlocked ? 'checkmark-circle' : 'close-circle'
              }
              size={16}
              color={status.screenshotsBlocked ? colors.success : colors.error}
            />
            <Text style={styles.statusDetailText}>
              Screenshots {status.screenshotsBlocked ? 'Blocked' : 'Allowed'}
            </Text>
          </View>

          <View style={styles.statusDetailRow}>
            <Ionicons
              name={
                status.recordingBlocked ? 'checkmark-circle' : 'close-circle'
              }
              size={16}
              color={status.recordingBlocked ? colors.success : colors.error}
            />
            <Text style={styles.statusDetailText}>
              Recording {status.recordingBlocked ? 'Blocked' : 'Allowed'}
            </Text>
          </View>

          <View style={styles.statusDetailRow}>
            <Ionicons
              name={
                status.backgroundProtected ? 'checkmark-circle' : 'close-circle'
              }
              size={16}
              color={status.backgroundProtected ? colors.success : colors.error}
            />
            <Text style={styles.statusDetailText}>
              Background {status.backgroundProtected ? 'Protected' : 'Exposed'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  privacyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    width,
    height,
  },
  privacyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIcon: {
    marginBottom: spacing.md,
  },
  privacyMessage: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    width,
    height,
  },
  statusContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.sm,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statusDetails: {
    marginLeft: spacing.xl + spacing.xs,
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDetailText: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
});

export default ScreenProtector;
