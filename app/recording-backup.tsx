import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type UploadStatus = {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
};

export default function RecordingBackupScreen() {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([
    {
      id: 'recording',
      title: 'Recording Evidence',
      description: 'Capturing video and audio',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'encryption',
      title: 'Encrypting Data',
      description: 'Securing your evidence',
      progress: 0,
      status: 'pending'
    },
    {
      id: 'upload',
      title: 'Secure Upload',
      description: 'Transferring to secure storage',
      progress: 0,
      status: 'pending'
    }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startPulseAnimation();
    simulateProgress();
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

  const simulateProgress = async () => {
    // Simulate recording progress
    await updateProgress('recording', 3000);
    setCurrentStep(1);

    // Simulate encryption progress
    await updateProgress('encryption', 2000);
    setCurrentStep(2);

    // Simulate upload progress
    await updateProgress('upload', 4000);
    
    // Mark as complete
    setIsComplete(true);
  };

  const updateProgress = (stepId: string, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      setUploadStatuses(prev => prev.map(status =>
        status.id === stepId ? { ...status, status: 'uploading' } : status
      ));

      const interval = setInterval(() => {
        setUploadStatuses(prev => prev.map(status => {
          if (status.id === stepId) {
            const newProgress = Math.min(status.progress + 2, 100);
            if (newProgress === 100) {
              clearInterval(interval);
              resolve();
              return { ...status, progress: newProgress, status: 'complete' };
            }
            return { ...status, progress: newProgress };
          }
          return status;
        }));
      }, duration / 50);
    });
  };

  const handleContinue = () => {
    router.push('/emergency-sms');
  };

  const getStatusColor = (status: UploadStatus['status']) => {
    switch (status) {
      case 'complete':
        return colors.status.success;
      case 'uploading':
        return colors.accent;
      case 'error':
        return colors.status.error;
      default:
        return colors.text.muted;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.recordingIndicator,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <MaterialIcons name="video-label" color={colors.status.error} size={32} />
        </Animated.View>
        <Text style={styles.headerText}>Recording in Progress</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" color={colors.status.error} size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.statusList}>
          {uploadStatuses.map((status, index) => (
            <View 
              key={status.id}
              style={[
                styles.statusCard,
                index === currentStep && styles.activeCard
              ]}>
              <View style={styles.statusHeader}>
                <View style={styles.statusIcon}>
                  {status.status === 'complete' ? (
                    <MaterialIcons name="check" size={24} color={colors.status.success} />
                  ) : status.id === 'recording' ? (
                    <MaterialIcons name="video-label" size={24} color={colors.accent} />
                  ) : status.id === 'encryption' ? (
                    <MaterialIcons name="shield" size={24} color={colors.accent} />
                  ) : (
                    <MaterialIcons name="upload" size={24} color={colors.accent} />
                  )}
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTitle}>{status.title}</Text>
                  <Text style={styles.statusDescription}>
                    {status.description}
                  </Text>
                </View>
                <Text style={styles.progressText}>
                  {status.progress}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { 
                      width: `${status.progress}%`,
                      backgroundColor: getStatusColor(status.status)
                    }
                  ]} 
                />
              </View>

              {status.error && (
                <Text style={styles.statusError}>{status.error}</Text>
              )}
            </View>
          ))}
        </View>

        {isComplete && (
          <View style={styles.completeContainer}>
            <MaterialIcons name="verified" size={48} color={colors.status.success} />
            <Text style={styles.completeText}>Evidence Secured</Text>
            <Text style={styles.completeDescription}>
              Your recording has been safely encrypted and stored
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    gap: 15,
  },
  recordingIndicator: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: `${colors.status.error}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    margin: 20,
    padding: 15,
    borderRadius: radius.lg,
    gap: 10,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusList: {
    gap: 15,
  },
  statusCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  activeCard: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    color: colors.text.muted,
    fontSize: 12,
  },
  progressText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.round,
  },
  statusError: {
    color: colors.status.error,
    fontSize: 12,
    marginTop: 10,
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 40,
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
  continueButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  continueButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});