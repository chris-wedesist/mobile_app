import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  shadows,
  radius,
  typography,
  spacing,
} from '../../constants/theme';
import {
  biometricAuthManager,
  BiometricType,
} from '../../lib/security/biometricAuth';

interface BiometricPromptProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onFallback?: () => void;
  allowFallback?: boolean;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  title = 'Biometric Authentication',
  subtitle = 'Authenticate to continue',
  description = 'Use your biometric to authenticate',
  onSuccess,
  onCancel,
  onFallback,
  allowFallback = false,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (visible) {
      initializeBiometric();
    }
  }, [visible]);

  const initializeBiometric = async () => {
    try {
      const availability =
        await biometricAuthManager.checkBiometricAvailability();
      setBiometricType(availability.biometricType);

      if (!availability.isAvailable) {
        setError('Biometric authentication is not available');
        if (allowFallback && onFallback) {
          onFallback();
        }
      }
    } catch (error) {
      console.error('Error initializing biometric:', error);
      setError('Failed to initialize biometric authentication');
    }
  };

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setError('');

    try {
      const result = await biometricAuthManager.authenticateWithBiometric(
        title
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Authentication failed');
        if (result.fallbackAvailable && allowFallback && onFallback) {
          // Show fallback option after a brief delay
          setTimeout(() => {
            if (onFallback) onFallback();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setError('Authentication system error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = (): string => {
    switch (biometricType) {
      case 'fingerprint':
        return 'finger-print';
      case 'facial':
        return 'person-circle';
      case 'iris':
        return 'eye';
      default:
        return 'lock-closed';
    }
  };

  const getBiometricText = (): string => {
    switch (biometricType) {
      case 'fingerprint':
        return 'Touch the fingerprint sensor';
      case 'facial':
        return Platform.OS === 'ios'
          ? 'Look at your iPhone to authenticate with Face ID'
          : 'Look at the camera';
      case 'iris':
        return 'Look at the camera for iris scan';
      default:
        return 'Authenticate with biometric';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.biometricSection}>
            <TouchableOpacity
              style={[
                styles.biometricButton,
                isAuthenticating && styles.biometricButtonActive,
              ]}
              onPress={handleAuthenticate}
              disabled={isAuthenticating || biometricType === 'none'}
            >
              <Ionicons
                name={getBiometricIcon() as any}
                size={60}
                color={isAuthenticating ? colors.primary : colors.text.primary}
                style={styles.biometricIcon}
              />
            </TouchableOpacity>

            <Text style={styles.instructionText}>
              {isAuthenticating ? 'Authenticating...' : getBiometricText()}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            {allowFallback && onFallback && (
              <TouchableOpacity
                style={styles.fallbackButton}
                onPress={onFallback}
              >
                <Text style={styles.fallbackButtonText}>Use PIN</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: radius.large,
    padding: spacing.lg,
    margin: spacing.md,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.heading,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  biometricButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  biometricButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  biometricIcon: {
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.small,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallbackButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.small,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.error,
    fontWeight: '500',
  },
});

export default BiometricPrompt;
