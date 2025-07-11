import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type BiometricAuthProps = {
  onSuccess?: () => void;
  onFail?: () => void;
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
};

export async function biometricVerify(prompt: string = 'Confirm your identity') {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: 'Enter Passcode',
    });

    return { success: result.success, error: result.success ? undefined : result.error };
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
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
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
        setError(result.error ? `Authentication failed: ${result.error}` : 'Authentication cancelled');
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
    if (biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      return <MaterialIcons name="face" size={32} color={colors.accent} />;
    }
    return <MaterialIcons name="fingerprint" size={32} color={colors.accent} />;
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.authButton, isAuthenticating && styles.authButtonDisabled]}
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
                <MaterialIcons name="close" size={24} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Biometric authentication is not available on web. This is a simulation.
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    gap: 10,
    ...shadows.sm,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}15`,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 10,
    gap: 8,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  successButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  successButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});