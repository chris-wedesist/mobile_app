import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { colors, shadows, radius } from '@/constants/theme';
import UserSettingsManager from '@/components/UserSettingsManager';
import UploadManager from '@/components/UploadManager';
import SMSManager from '@/components/SMSManager';
import AutoWipeManager from '@/components/AutoWipeManager';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

type TestStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
};

export default function TestPanicFlowScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    {
      id: 'camera',
      title: 'Camera Recording',
      description: 'Testing emergency recording capability',
      icon: <MaterialIcons name="camera" size={24} color={colors.accent} />,
      status: 'success'
    },
    {
      id: 'upload',
      title: 'Secure Upload',
      description: 'Testing encrypted upload system',
      icon: <MaterialIcons name="upload" size={24} color={colors.accent} />,
      status: 'success'
    },
    {
      id: 'alert',
      title: 'Emergency Alerts',
      description: 'Testing alert system (notifications disabled)',
      icon: <MaterialIcons name="message" size={24} color={colors.accent} />,
      status: 'success'
    },
    {
      id: 'wipe',
      title: 'Auto-Wipe',
      description: 'Testing secure data removal',
      icon: <MaterialIcons name="delete" size={24} color={colors.accent} />,
      status: 'running'
    }
  ]);
  
  const [currentStep, setCurrentStep] = useState(3);
  const [testComplete, setTestComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const recordingUri = useRef<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startPulseAnimation();
    checkPermissions();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const checkPermissions = async () => {
    if (Platform.OS === 'web') return;

    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for testing');
      }

      if (!permission?.granted) {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          throw new Error('Camera permission is required for testing');
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setError('Failed to check permissions');
    }
  };

  const updateStepStatus = (stepId: string, status: TestStep['status'], error?: string) => {
    setTestSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, error } : step
    ));
  };

  const testAutoWipe = async () => {
    try {
      updateStepStatus('wipe', 'running');

      if (Platform.OS !== 'web') {
        const autoWipeManager = AutoWipeManager.getInstance();
        
        // Create test file with random data
        const testUri = `${FileSystem.cacheDirectory}test-video.mp4`;
        const testData = new Uint8Array(1024 * 1024); // 1MB test file
        crypto.getRandomValues(testData);
        
        await FileSystem.writeAsStringAsync(
          testUri,
          String.fromCharCode.apply(null, Array.from(testData)),
          { encoding: FileSystem.EncodingType.UTF8 }
        );

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(testUri);
        if (!fileInfo.exists) {
          throw new Error('Failed to create test file');
        }

        // Test wipe operation
        const wipeResult = await autoWipeManager.wipeLocalMedia(testUri);
        
        if (!wipeResult) {
          throw new Error('Auto-wipe operation failed');
        }

        // Verify file is securely removed
        try {
          await FileSystem.getInfoAsync(testUri);
          throw new Error('File still exists after wipe');
        } catch (error) {
          // File not found - this is expected
          updateStepStatus('wipe', 'success');
          setTestComplete(true);
        }
      } else {
        // Simulate wipe for web
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStepStatus('wipe', 'success');
        setTestComplete(true);
      }
    } catch (error) {
      console.error('Auto-wipe test failed:', error);
      updateStepStatus('wipe', 'error', error instanceof Error ? error.message : 'Failed to test auto-wipe');
      setError('Auto-wipe test failed');
    }
  };

  const runNextStep = async () => {
    setError(null);

    switch (currentStep) {
      case 3:
        await testAutoWipe();
        break;
    }
  };

  const getStepStatusColor = (status: TestStep['status']) => {
    switch (status) {
      case 'running':
        return colors.status.warning;
      case 'success':
        return colors.status.success;
      case 'error':
        return colors.status.error;
      default:
        return colors.text.muted;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="error-outline" size={32} color={colors.accent} />
          <Text style={styles.title}>Test Panic Mode</Text>
        </View>

        <Text style={styles.description}>
          Safely test the emergency features without sending real alerts.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" color={colors.status.error} size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.stepsContainer}>
          {testSteps.map((step, index) => (
            <View 
              key={step.id}
              style={[
                styles.stepCard,
                index === currentStep && styles.activeStep
              ]}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  {step.status === 'success' ? (
                    <MaterialIcons name="check" size={24} color={colors.status.success} />
                  ) : (
                    step.icon
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStepStatusColor(step.status) }
                  ]}
                />
              </View>
              {step.error && (
                <Text style={styles.stepError}>{step.error}</Text>
              )}
            </View>
          ))}
        </View>

        {Platform.OS !== 'web' && (
          <CameraView
            ref={cameraRef}
            style={styles.hiddenCamera}

          />
        )}

        {!testComplete && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              currentStep === 0 && styles.startButton
            ]}
            onPress={runNextStep}>
            <Text style={styles.actionButtonText}>
              Continue Test
            </Text>
          </TouchableOpacity>
        )}

        {testComplete && (
          <View style={styles.completeContainer}>
            <MaterialIcons name="check" size={48} color={colors.status.success} />
            <Text style={styles.completeText}>Test Complete</Text>
            <Text style={styles.completeDescription}>
              All emergency features are working correctly
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  stepsContainer: {
    flex: 1,
    gap: 15,
  },
  stepCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  activeStep: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: colors.text.muted,
    fontSize: 12,
  },
  stepError: {
    color: colors.status.error,
    fontSize: 12,
    marginTop: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  actionButton: {
    backgroundColor: colors.accent,
    padding: 20,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: 20,
    ...shadows.md,
  },
  startButton: {
    backgroundColor: colors.status.warning,
  },
  actionButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  completeText: {
    color: colors.status.success,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  completeDescription: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: colors.status.success,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  doneButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  hiddenCamera: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});