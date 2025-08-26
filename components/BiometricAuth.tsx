import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type BiometricAuthProps = {
  onSuccess?: () => void;
  onFail?: () => void;
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
};

export async function biometricVerify(
  prompt: string = 'Confirm your identity'
) {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return {
        success: false,
        error: 'Biometric authentication not available',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: 'Enter Passcode',
    });

    return {
      success: result.success,
      error: result.success ? null : 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export function BiometricAuth({
  onSuccess,
  onFail,
  promptMessage = 'Authenticate to continue',
  cancelLabel = 'Cancel',
  fallbackLabel = 'Use Passcode',
  disableDeviceFallback = false,
}: BiometricAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [biometricType, setBiometricType] =
    useState<LocalAuthentication.AuthenticationType | null>(null);

  const checkBiometricType = async () => {
    try {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        );
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
      }
    } catch (error) {
      console.error('Error checking biometric type:', error);
    }
  };

  const authenticate = async () => {
    if (Platform.OS === 'web') {
      setModalVisible(true);
      return;
    }

    try {
      setIsAuthenticating(true);
      setError(null);
      await checkBiometricType();

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setError('Biometric authentication is not available on this device');
        onFail?.();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel,
        disableDeviceFallback,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError('Authentication cancelled');
        onFail?.();
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setError('An unexpected error occurred');
      onFail?.();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleWebAuth = (success: boolean) => {
    setModalVisible(false);
    if (success) {
      onSuccess?.();
    } else {
      setError('Authentication cancelled');
      onFail?.();
    }
  };

  const getBiometricIcon = () => {
    if (
      biometricType ===
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    ) {
      return <MaterialIcons name="face" size={32} color={colors.accent} />;
    }
    return <MaterialIcons name="fingerprint" size={32} color={colors.accent} />;
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.authButton,
          isAuthenticating && styles.authButtonDisabled,
        ]}
        onPress={authenticate}
        disabled={isAuthenticating}
      >
        {Platform.OS === 'web' ? (
          <MaterialIcons name="shield" size={24} color={colors.text.primary} />
        ) : (
          getBiometricIcon()
        )}
        <Text style={styles.authButtonText}>
          {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={16} color={colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Web fallback modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => handleWebAuth(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Authentication Required</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => handleWebAuth(false)}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Biometric authentication is not available on web. This is a
              simulation.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleWebAuth(false)}
              >
                <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => handleWebAuth(true)}
              >
                <Text style={styles.successButtonText}>Simulate Success</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}15`,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.fontSize.caption,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalMessage: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontFamily: 'Inter-Medium',
  },
  successButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  successButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.body,
    fontFamily: 'Inter-Medium',
  },
});
