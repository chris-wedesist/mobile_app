import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as ExpoAV from 'expo-av';
import { createClient } from '@supabase/supabase-js';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function PanicButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [volume, setVolume] = useState(1);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [countdownAnim] = useState(new Animated.Value(0));
  const soundRef = useRef<ExpoAV.Audio.Sound | null>(null);
  const countdownInterval = useRef<number | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastAlertTime = useRef<number>(0);
  const ALERT_INTERVAL = 60000; // Minimum time between alerts (1 minute)

  useEffect(() => {
    // Start pulsing animation
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

    // Initialize audio on mount only for native platforms
    if (Platform.OS !== 'web') {
      const initializeAudio = async () => {
        try {
          await ExpoAV.Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
          });
          await loadSound();
        } catch (error) {
          console.error('Error initializing audio:', error);
        }
      };

      initializeAudio();
    }

    return () => {
      if (Platform.OS !== 'web' && soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const loadSound = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const { sound } = await ExpoAV.Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2894/2894-preview.mp3' },
        { 
          isLooping: true,
          volume: volume,
          shouldPlay: false,
          progressUpdateIntervalMillis: 50,
        }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        async (location) => {
          const now = Date.now();
          if (now - lastAlertTime.current >= ALERT_INTERVAL) {
            await sendEmergencyAlert(location);
            lastAlertTime.current = now;
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const sendEmergencyAlert = async (location: Location.LocationObject) => {
    try {
      const contacts = await getEmergencyContacts();
      if (!contacts || contacts.length === 0) return;

      const locationUrl = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      
      for (const contact of contacts) {
        const message = contact.custom_message || 
          `EMERGENCY: I need immediate assistance. My location: ${locationUrl}`;

        if (Platform.OS !== 'web') {
          const isAvailable = await SMS.isAvailableAsync();
          if (isAvailable) {
            await SMS.sendSMSAsync([contact.contact_phone], message);
          }
        }

        // Log panic event to Supabase
        await supabase.from('panic_events').insert([{
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
          emergency_alerts_sent: {
            contact: contact.contact_name,
            timestamp: new Date().toISOString(),
            message
          }
        }]);
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  };

  const getEmergencyContacts = async () => {
    try {
      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return contacts;
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return null;
    }
  };

  const playAlarm = async () => {
    if (Platform.OS === 'web') {
      setIsAlarmActive(true);
      return;
    }

    try {
      if (!soundRef.current) {
        await loadSound();
      }
      
      if (!soundRef.current) {
        console.error('Sound not loaded');
        return;
      }
      
      await soundRef.current.setVolumeAsync(volume);
      await soundRef.current.playAsync();
      setIsAlarmActive(true);

      // Start location tracking and emergency alerts
      await startLocationTracking();

      if (Platform.OS === 'ios') {
        ExpoAV.Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
      }
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  };

  const stopAlarm = async () => {
    if (Platform.OS === 'web') {
      setIsAlarmActive(false);
      return;
    }

    try {
      if (!soundRef.current) return;
      await soundRef.current.stopAsync();
      setIsAlarmActive(false);
      setVolume(1);
      stopLocationTracking();
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
    const requiredTime = isAlarmActive ? 3 : 5;
    setCountdown(requiredTime);
    
    Animated.timing(countdownAnim, {
      toValue: 1,
      duration: requiredTime * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    countdownInterval.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    const timer = setTimeout(async () => {
      if (isAlarmActive) {
        await stopAlarm();
      } else {
        await playAlarm();
      }
    }, requiredTime * 1000);
    setPressTimer(timer);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setCountdown(0);
    countdownAnim.setValue(0);
  };

  if (Platform.OS === 'web') {
    return (
      <>
        {isPressed && (
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
            <Text style={styles.countdownLabel}>
              {isAlarmActive ? 'Stopping Alarm' : 'Activating Alarm'}
            </Text>
          </View>
        )}
        <View style={styles.container}>
          {isAlarmActive && (
            <View style={styles.volumeContainer}>
              <MaterialIcons name="volume-up" color={colors.text.primary} size={20} />
              <Text style={styles.volumeText}>Volume: {Math.round(volume * 100)}%</Text>
            </View>
          )}
          <Animated.View
            style={[
              styles.pulseContainer,
              {
                transform: [{ scale: pulseAnim }],
                opacity: isPressed ? 0 : 0.5,
              },
            ]}>
            <View style={[styles.button, isAlarmActive && styles.buttonActive]} />
          </Animated.View>
          <TouchableOpacity
            style={[
              styles.button,
              isPressed && styles.buttonPressed,
              isAlarmActive && styles.buttonActive,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}>
            <MaterialIcons name="error" color={colors.text.primary} size={32} />
            <Text style={styles.text}>
              {isPressed 
                ? `Hold ${isAlarmActive ? '3s' : '5s'} to ${isAlarmActive ? 'Stop' : 'Trigger'}`
                : isAlarmActive ? 'ALARM ACTIVE' : 'Panic Button'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      {isPressed && (
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
          <Text style={styles.countdownLabel}>
            {isAlarmActive ? 'Stopping Alarm' : 'Activating Alarm'}
          </Text>
        </View>
      )}
      <View style={styles.container}>
        {isAlarmActive && (
          <View style={styles.volumeContainer}>
            <MaterialIcons name="volume-up" color={colors.text.primary} size={20} />
            <Text style={styles.volumeText}>Volume: {Math.round(volume * 100)}%</Text>
          </View>
        )}
        <Animated.View
          style={[
            styles.pulseContainer,
            {
              transform: [{ scale: pulseAnim }],
              opacity: isPressed ? 0 : 0.5,
            },
          ]}>
          <View style={[styles.button, isAlarmActive && styles.buttonActive]} />
        </Animated.View>
        <TouchableOpacity
          style={[
            styles.button,
            isPressed && styles.buttonPressed,
            isAlarmActive && styles.buttonActive
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <MaterialIcons name="error" color={colors.text.primary} size={32} />
          <Text style={styles.text}>
            {isPressed 
              ? `Hold ${isAlarmActive ? '3s' : '5s'} to ${isAlarmActive ? 'Stop' : 'Trigger'}`
              : isAlarmActive ? 'ALARM ACTIVE' : 'Panic Button'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: radius.lg,
    marginBottom: 10,
    width: 200,
    ...shadows.sm,
  },
  volumeSlider: {
    flex: 1,
    marginLeft: 10,
    height: 40,
  },
  volumeText: {
    color: colors.text.primary,
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  countdownProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: radius.round,
    backgroundColor: colors.accent,
    opacity: 0.3,
  },
  countdownText: {
    color: colors.text.primary,
    fontSize: 120,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: colors.text.primary,
    fontSize: 24,
    marginTop: 20,
    fontWeight: '600',
  },
  pulseContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: radius.round,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonPressed: {
    backgroundColor: colors.status.error,
    transform: [{ scale: 0.95 }],
  },
  buttonActive: {
    backgroundColor: colors.status.error,
    borderWidth: 3,
    borderColor: colors.text.primary,
  },
  text: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});