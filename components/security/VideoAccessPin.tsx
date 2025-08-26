import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  authenticateForVideoAccess,
  biometricAuthManager,
  isVideoPinRequired,
  setVideoAccessPin,
} from '../../lib/security/biometricAuth';

interface VideoAccessPinProps {
  isVisible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  isFirstTimeSetup?: boolean;
}

export const VideoAccessPinModal: React.FC<VideoAccessPinProps> = ({
  isVisible,
  onSuccess,
  onCancel,
  isFirstTimeSetup = false,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Reset state when modal opens
      setPin('');
      setConfirmPin('');
      setStep(isFirstTimeSetup ? 'enter' : 'enter');
      setAttempts(0);
    }
  }, [isVisible, isFirstTimeSetup]);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long.');
      return;
    }

    setIsLoading(true);

    try {
      if (isFirstTimeSetup) {
        if (step === 'enter') {
          // First time setup - ask for confirmation
          setStep('confirm');
          setIsLoading(false);
          return;
        } else if (step === 'confirm') {
          // Confirm PIN matches
          if (pin !== confirmPin) {
            Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
            setStep('enter');
            setPin('');
            setConfirmPin('');
            setIsLoading(false);
            return;
          }

          // Set the new PIN
          const success = await setVideoAccessPin(pin);
          if (success) {
            Alert.alert(
              'PIN Set Successfully',
              'Your video access PIN has been created.',
              [{ text: 'OK', onPress: onSuccess }]
            );
          } else {
            Alert.alert('Error', 'Failed to set PIN. Please try again.');
          }
        }
      } else {
        // Normal authentication
        const result = await authenticateForVideoAccess(pin);

        if (result.success) {
          onSuccess();
        } else {
          setAttempts((prev) => prev + 1);

          if (attempts >= 2) {
            Alert.alert(
              'Too Many Attempts',
              'Too many failed attempts. Please try again later.',
              [{ text: 'OK', onPress: onCancel }]
            );
          } else {
            Alert.alert(
              'Incorrect PIN',
              `Invalid PIN. ${2 - attempts} attempt${
                2 - attempts !== 1 ? 's' : ''
              } remaining.`
            );
          }
          setPin('');
        }
      }
    } catch (error) {
      console.error('PIN submission error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const renderPinDots = (currentPin: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentPin.length
                ? styles.pinDotFilled
                : styles.pinDotEmpty,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keypadButton} />;
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keypadButton}
                  onPress={() => {
                    if (key === 'backspace') {
                      if (step === 'confirm') {
                        setConfirmPin((prev) => prev.slice(0, -1));
                      } else {
                        setPin((prev) => prev.slice(0, -1));
                      }
                    } else {
                      if (step === 'confirm') {
                        if (confirmPin.length < 6) {
                          setConfirmPin((prev) => prev + key);
                        }
                      } else {
                        if (pin.length < 6) {
                          setPin((prev) => prev + key);
                        }
                      }
                    }
                  }}
                  disabled={isLoading}
                >
                  {key === 'backspace' ? (
                    <Ionicons name="backspace" size={24} color="#333" />
                  ) : (
                    <Text style={styles.keypadButtonText}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const getTitle = () => {
    if (isFirstTimeSetup) {
      return step === 'enter' ? 'Set Video Access PIN' : 'Confirm Your PIN';
    }
    return 'Enter Video Access PIN';
  };

  const getMessage = () => {
    if (isFirstTimeSetup) {
      return step === 'enter'
        ? 'Create a PIN to secure access to video recordings'
        : 'Please confirm your PIN';
    }
    return 'PIN required to access video recordings after new recording detected';
  };

  const currentPin = step === 'confirm' ? confirmPin : pin;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Ionicons
            name="videocam-outline"
            size={64}
            color="#007AFF"
            style={styles.icon}
          />

          <Text style={styles.message}>{getMessage()}</Text>

          {renderPinDots(currentPin)}

          {renderKeypad()}

          <TouchableOpacity
            style={[
              styles.submitButton,
              currentPin.length >= 4
                ? styles.submitButtonActive
                : styles.submitButtonInactive,
            ]}
            onPress={handlePinSubmit}
            disabled={currentPin.length < 4 || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                currentPin.length >= 4
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextInactive,
              ]}
            >
              {isLoading
                ? 'Processing...'
                : isFirstTimeSetup && step === 'enter'
                ? 'Continue'
                : isFirstTimeSetup && step === 'confirm'
                ? 'Set PIN'
                : 'Unlock'}
            </Text>
          </TouchableOpacity>

          {!isFirstTimeSetup && (
            <Text style={styles.attemptsText}>Attempts: {attempts}/3</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Hook for easy video access authentication
export const useVideoAccessAuth = () => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState<
    (() => void) | null
  >(null);

  const requestVideoAccess = async (onSuccess: () => void) => {
    try {
      const pinRequired = await isVideoPinRequired();

      if (!pinRequired) {
        // No PIN required, proceed directly
        const result = await authenticateForVideoAccess();
        if (result.success) {
          onSuccess();
        } else {
          Alert.alert('Error', 'Failed to authenticate for video access.');
        }
        return;
      }

      // Check if this is first time setup (no PIN exists)
      const config = biometricAuthManager.getConfig();
      const firstTime = !config.videoAccessPinEnabled;

      setIsFirstTimeSetup(firstTime);
      setOnSuccessCallback(() => onSuccess);
      setShowPinModal(true);
    } catch (error) {
      console.error('Video access request error:', error);
      Alert.alert('Error', 'An error occurred while requesting video access.');
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (onSuccessCallback) {
      onSuccessCallback();
      setOnSuccessCallback(null);
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setOnSuccessCallback(null);
  };

  return {
    requestVideoAccess,
    VideoAccessPinModal: () => (
      <VideoAccessPinModal
        isVisible={showPinModal}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
        isFirstTimeSetup={isFirstTimeSetup}
      />
    ),
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  icon: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: '#007AFF',
  },
  pinDotEmpty: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  keypad: {
    marginBottom: 30,
  },
  keypadRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonActive: {
    backgroundColor: '#007AFF',
  },
  submitButtonInactive: {
    backgroundColor: '#e9ecef',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextActive: {
    color: '#fff',
  },
  submitButtonTextInactive: {
    color: '#adb5bd',
  },
  attemptsText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 10,
  },
});

export default VideoAccessPinModal;
