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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, typography, spacing, shadows, radius } from '../../constants/theme';
import { biometricAuthManager } from '../../lib/security/biometricAuth';
import { BiometricPrompt } from '../../components/security/BiometricPrompt';

export default function BiometricSetupScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    try {
      await biometricAuthManager.initialize();
      
      const availability = await biometricAuthManager.checkBiometricAvailability();
      setBiometricAvailable(availability.isAvailable);
      setBiometricType(availability.biometricType);
      
      const enabled = biometricAuthManager.isEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Failed to initialize biometric:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (!biometricAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowBiometricPrompt(true);
  };

  const handleBiometricSuccess = async () => {
    setShowBiometricPrompt(false);
    
    try {
      const success = await biometricAuthManager.enableBiometricAuth();
      if (success) {
        setIsEnabled(true);
        Alert.alert(
          'Success',
          'Biometric authentication has been enabled successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Failed',
          'Failed to enable biometric authentication. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      Alert.alert(
        'Error',
        'An error occurred while enabling biometric authentication.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await biometricAuthManager.disableBiometricAuth();
              setIsEnabled(false);
              Alert.alert(
                'Disabled',
                'Biometric authentication has been disabled.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Failed to disable biometric:', error);
            }
          },
        },
      ]
    );
  };

  const getBiometricIcon = () => {
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

  const getBiometricTitle = () => {
    switch (biometricType) {
      case 'fingerprint':
        return 'Fingerprint Authentication';
      case 'facial':
        return 'Face ID Authentication';
      case 'iris':
        return 'Iris Authentication';
      default:
        return 'Biometric Authentication';
    }
  };

  const getBiometricDescription = () => {
    switch (biometricType) {
      case 'fingerprint':
        return 'Use your fingerprint to securely access the app and switch between modes.';
      case 'facial':
        return 'Use Face ID to securely access the app and switch between modes.';
      case 'iris':
        return 'Use iris scanning to securely access the app and switch between modes.';
      default:
        return 'Use biometric authentication to securely access the app.';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={48} color={colors.primary} />
        <Text style={styles.loadingText}>Checking biometric availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getBiometricIcon() as any}
              size={64}
              color={biometricAvailable ? colors.primary : colors.text.muted}
            />
          </View>
          <Text style={styles.title}>{getBiometricTitle()}</Text>
          <Text style={styles.description}>
            {biometricAvailable
              ? getBiometricDescription()
              : 'Biometric authentication is not available on this device. You can still use the app with manual authentication.'}
          </Text>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[
                styles.statusValue,
                { color: isEnabled ? colors.success : colors.text.muted }
              ]}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Ionicons
              name={isEnabled ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isEnabled ? colors.success : colors.text.muted}
            />
          </View>

          {biometricAvailable && (
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Biometric Type</Text>
                <Text style={styles.statusValue}>
                  {biometricType.charAt(0).toUpperCase() + biometricType.slice(1)}
                </Text>
              </View>
              <Ionicons
                name={getBiometricIcon() as any}
                size={24}
                color={colors.primary}
              />
            </View>
          )}
        </View>

        {biometricAvailable && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text style={styles.featureText}>
                Secure app access with your biometric
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="swap-horizontal" size={20} color={colors.success} />
              <Text style={styles.featureText}>
                Protected mode switching
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="time" size={20} color={colors.success} />
              <Text style={styles.featureText}>
                Automatic re-authentication after timeout
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="key" size={20} color={colors.success} />
              <Text style={styles.featureText}>
                PIN fallback option available
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          {biometricAvailable ? (
            isEnabled ? (
              <TouchableOpacity
                style={[styles.button, styles.disableButton]}
                onPress={handleDisableBiometric}
              >
                <Ionicons name="close-circle" size={20} color={colors.background} />
                <Text style={styles.buttonText}>Disable Biometric</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.enableButton]}
                onPress={handleEnableBiometric}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                <Text style={styles.buttonText}>Enable Biometric</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.unavailableContainer}>
              <Ionicons name="information-circle" size={48} color={colors.text.muted} />
              <Text style={styles.unavailableText}>
                Biometric authentication is not available on this device
              </Text>
              <Text style={styles.unavailableSubtext}>
                Make sure biometric authentication is set up in your device settings
              </Text>
            </View>
          )}
        </View>

        <View style={styles.navigationSection}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('/emergency-setup' as any)}
          >
            <Text style={styles.nextButtonText}>Continue to Emergency Setup</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.back()}
          >
            <Text style={styles.skipButtonText}>Skip Setup</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BiometricPrompt
        visible={showBiometricPrompt}
        title="Enable Biometric Authentication"
        subtitle="Authenticate to enable biometric protection"
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowBiometricPrompt(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
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
    backgroundColor: colors.surface,
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
  statusSection: {
    margin: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    marginBottom: spacing.xs / 2,
  },
  statusValue: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
  },
  featuresSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.subheading,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  featureText: {
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  actionsSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.large,
    marginBottom: spacing.md,
  },
  enableButton: {
    backgroundColor: colors.success,
  },
  disableButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.background,
    marginLeft: spacing.xs,
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 1.33, // 32px equivalent
  },
  unavailableText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  unavailableSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationSection: {
    margin: spacing.xl,
    marginTop: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm + 2,
  },
  nextButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  skipButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.text.muted,
  },
});
