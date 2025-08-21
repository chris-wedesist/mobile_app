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
import { biometricAuthManager, BiometricType } from '../../lib/security/biometricAuth';

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
      const availability = await biometricAuthManager.checkBiometricAvailability();
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
      const result = await biometricAuthManager.authenticateWithBiometric(title);
      
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
        return Platform.OS === 'ios' ? 'Look at your iPhone to authenticate with Face ID' : 'Look at the camera';
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
                color={isAuthenticating ? '#007AFF' : '#333'}
                style={styles.biometricIcon}
              />
            </TouchableOpacity>

            <Text style={styles.instructionText}>
              {isAuthenticating ? 'Authenticating...' : getBiometricText()}
            </Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
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
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  biometricButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  biometricButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  biometricIcon: {
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fallbackButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default BiometricPrompt;
