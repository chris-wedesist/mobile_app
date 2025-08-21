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
        <Ionicons name="refresh" size={48} color="#007AFF" />
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
              color={biometricAvailable ? '#007AFF' : '#8E8E93'}
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
                { color: isEnabled ? '#34C759' : '#8E8E93' }
              ]}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Ionicons
              name={isEnabled ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isEnabled ? '#34C759' : '#8E8E93'}
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
                color="#007AFF"
              />
            </View>
          )}
        </View>

        {biometricAvailable && (
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={20} color="#34C759" />
              <Text style={styles.featureText}>
                Secure app access with your biometric
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="swap-horizontal" size={20} color="#34C759" />
              <Text style={styles.featureText}>
                Protected mode switching
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="time" size={20} color="#34C759" />
              <Text style={styles.featureText}>
                Automatic re-authentication after timeout
              </Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="key" size={20} color="#34C759" />
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
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Disable Biometric</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.enableButton]}
                onPress={handleEnableBiometric}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Enable Biometric</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.unavailableContainer}>
              <Ionicons name="information-circle" size={48} color="#8E8E93" />
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
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  statusSection: {
    margin: 24,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    margin: 24,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  actionsSection: {
    margin: 24,
    marginTop: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  enableButton: {
    backgroundColor: '#34C759',
  },
  disableButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  unavailableContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  unavailableText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  unavailableSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationSection: {
    margin: 24,
    marginTop: 0,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
