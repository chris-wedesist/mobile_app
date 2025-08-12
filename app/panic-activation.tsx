import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { colors, shadows, radius } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function PanicActivationScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<CameraView>(null);
  const countdownInterval = useRef<any>(null);

  useEffect(() => {
    startPulseAnimation();
    checkPermissions();
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
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
      if (locationStatus !== 'granted') {
        throw new Error('Location permission is required');
      }

      if (!permission?.granted) {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          throw new Error('Camera permission is required');
        }
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const handleActivation = () => {
    setIsActivating(true);
    setCountdown(5);

    // Start countdown animation
    Animated.timing(countdownAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    // Update countdown every second
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current!);
          triggerPanicMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelActivation = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setIsActivating(false);
    setCountdown(5);
    countdownAnim.setValue(0);
  };

  const triggerPanicMode = async () => {
    try {
      setIsRecording(true);

      if (Platform.OS !== 'web' && cameraRef.current) {
        // In a real app, this would start recording and send alerts
        // For demo purposes, we'll just navigate back after a delay
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        // For web, just navigate back
        router.back();
      }
    } catch (error) {
      console.error('Error triggering panic mode:', error);
      setIsActivating(false);
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      {isActivating && (
        <View style={styles.countdownOverlay}>
          <Animated.View
            style={[
              styles.countdownProgress,
              {
                transform: [{
                  scale: countdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  })
                }],
              }
            ]}
          />
          <Text style={styles.countdownText}>{countdown}</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelActivation}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" color={colors.text.primary} size={24} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <MaterialIcons name="error" color={colors.status.error} size={64} />
        </Animated.View>

        <Text style={styles.title}>Emergency Mode</Text>
        <Text style={styles.description}>
          Activating emergency mode will:
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <MaterialIcons name="camera" size={24} color={colors.accent} />
            <Text style={styles.featureText}>
              Start secure video recording
            </Text>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="location-on" size={24} color={colors.accent} />
            <Text style={styles.featureText}>
              Share your location with emergency contacts
            </Text>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="upload" size={24} color={colors.accent} />
            <Text style={styles.featureText}>
              Automatically upload evidence to secure storage
            </Text>
          </View>

          <View style={styles.featureItem}>
            <MaterialIcons name="shield" size={24} color={colors.accent} />
            <Text style={styles.featureText}>
              Alert trusted emergency contacts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.activateButton,
            isActivating && styles.activateButtonActive
          ]}
          onPress={handleActivation}
          disabled={isActivating}>
          <MaterialIcons name="error" color={colors.text.primary} size={24} />
          <Text style={styles.activateButtonText}>
            {isActivating ? 'ACTIVATING...' : 'ACTIVATE EMERGENCY MODE'}
          </Text>
        </TouchableOpacity>
      </View>

      {Platform.OS !== 'web' && (
        <CameraView
          ref={cameraRef}
          style={styles.hiddenCamera}
          facing="back"
        />
      )}
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
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: radius.round,
    backgroundColor: `${colors.status.error}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  featureList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 15,
    gap: 15,
    ...shadows.sm,
  },
  featureText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.error,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: radius.lg,
    gap: 10,
    ...shadows.md,
  },
  activateButtonActive: {
    backgroundColor: colors.status.warning,
  },
  activateButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  countdownProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: radius.round,
    backgroundColor: colors.status.error,
    opacity: 0.3,
  },
  countdownText: {
    color: colors.text.primary,
    fontSize: 120,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  cancelButton: {
    marginTop: 40,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  hiddenCamera: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});