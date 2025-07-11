import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Camera, CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

// Number of taps required to trigger panic mode
const REQUIRED_TAPS = 5;
// Maximum time between taps (ms)
const TAP_INTERVAL = 2000;

export default function PanicGestureHandler() {
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    setIsRecording(true);
    try {
      recordingPromise.current = cameraRef.current.recordAsync();
      const recording = await recordingPromise.current;
      await handleRecordingComplete(recording);
    } catch (error) {
      console.error('Recording failed:', error);
    } finally {
      setIsRecording(false);
      recordingPromise.current = null;
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleRecordingComplete = async (recording: { uri: string }) => {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      const location = await Location.getCurrentPositionAsync({});

      // Upload to Supabase Storage
      const fileName = `panic-${Date.now()}.mp4`;
      const filePath = `public/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, await FileSystem.readAsStringAsync(recording.uri, {
          encoding: FileSystem.EncodingType.Base64
        }));

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);
      const publicUrl = data?.publicURL;

      // Create safe encounter record
      const { data: encounterData, error: encounterError } = await supabase
        .from('safe_encounters')
        .insert([{
          encounter_type: 'police_interaction',
          description: 'Panic gesture triggered recording',
          media_url: publicUrl,
          location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
        }])
        .select()
        .single();

      if (encounterError) throw encounterError;

      // Send emergency alert
      await sendEmergencyAlert(location);

      // Optional: Auto-wipe local recording
      await FileSystem.deleteAsync(recording.uri);

    } catch (error) {
      console.error('Error handling recording:', error);
    }
  };

  const sendEmergencyAlert = async (location: Location.LocationObject) => {
    try {
      const emergencyContact = await AsyncStorage.getItem('emergencyContact');
      const emergencyMessage = await AsyncStorage.getItem('emergencyMessage');
      
      if (!emergencyContact) return;

      if (Platform.OS !== 'web') {
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) return;

        const locationUrl = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
        const message = `${emergencyMessage}\n\nLocation: ${locationUrl}`;

        await SMS.sendSMSAsync([emergencyContact], message);
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  };

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      const now = Date.now();
      if (now - lastTapTime.current > TAP_INTERVAL) {
        tapCount.current = 0;
      }
      
      tapCount.current += 1;
      lastTapTime.current = now;

      if (tapCount.current >= REQUIRED_TAPS) {
        tapCount.current = 0;
        startRecording();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(3000)
    .onStart(() => {
      stopRecording();
    });

  const gesture = Gesture.Race(tapGesture, longPressGesture);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          ref={cameraRef}
          style={styles.hiddenCamera}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hiddenCamera: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});