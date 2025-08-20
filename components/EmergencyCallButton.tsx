import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

let isEmergencyButtonMounted = false;

export default function EmergencyCallButton() {
  // Add a check to prevent duplicate rendering
  const [shouldRender, setShouldRender] = useState(false);

  const BUTTON_SIZE = 60;

  // Initialize with a position that's visible on screen
  const [position, setPosition] = useState({ x: 20, y: 100 });

  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const [requireLongPress, setRequireLongPress] = useState(true);
  const longPressTimer = useRef<number | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isEmergencyButtonMounted) {
      isEmergencyButtonMounted = true;
      setShouldRender(true);

      return () => {
        isEmergencyButtonMounted = false;
      };
    }
  }, []);

  useEffect(() => {
    if (shouldRender) {
      loadPosition();
      loadSettings();
    }
  }, [shouldRender]);

  const loadPosition = async () => {
    try {
      const savedPosition = await AsyncStorage.getItem(
        'emergencyButtonPosition'
      );
      if (savedPosition) {
        const { x, y } = JSON.parse(savedPosition);
        // Ensure position is within screen bounds
        const safeX = Math.min(Math.max(0, x), screenWidth - BUTTON_SIZE);
        const safeY = Math.min(Math.max(50, y), screenHeight - BUTTON_SIZE);
        setPosition({ x: safeX, y: safeY });
      }
    } catch (error) {
      console.error('Error loading button position:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('emergencyButtonSettings');
      if (settings) {
        const { requireLongPress: savedRequireLongPress } =
          JSON.parse(settings);
        setRequireLongPress(savedRequireLongPress !== false); // Default to true if not specified
      }
    } catch (error) {
      console.error('Error loading button settings:', error);
    }
  };

  const savePosition = async (x: number, y: number) => {
    try {
      await AsyncStorage.setItem(
        'emergencyButtonPosition',
        JSON.stringify({ x, y })
      );
    } catch (error) {
      console.error('Error saving button position:', error);
    }
  };

  // Track the start position of the drag
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    setDragStart({ x: pageX, y: pageY });
    // Small delay before considering it a drag to allow for press detection
    setTimeout(() => setIsDragging(true), 100);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;

    const { pageX, pageY } = e.nativeEvent;
    const deltaX = pageX - dragStart.x;
    const deltaY = pageY - dragStart.y;

    // Update position based on the drag
    setPosition((prev) => ({
      x: Math.min(Math.max(0, prev.x + deltaX), screenWidth - BUTTON_SIZE),
      y: Math.min(Math.max(50, prev.y + deltaY), screenHeight - BUTTON_SIZE),
    }));

    // Update the drag start position
    setDragStart({ x: pageX, y: pageY });
  };

  const onTouchEnd = () => {
    if (isDragging) {
      // Save the final position
      savePosition(position.x, position.y);
      setIsDragging(false);
    }
  };

  // If we shouldn't render (because another instance exists), return null
  if (!shouldRender) return null;

  const handlePressIn = () => {
    if (requireLongPress) {
      setIsLongPressing(true);

      // Animate the progress indicator
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000, // 3 seconds
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // Set a timer for the long press
      longPressTimer.current = setTimeout(() => {
        makeEmergencyCall();
        setIsLongPressing(false);
        progressAnim.setValue(0);
      }, 3000);
    } else {
      // If long press is not required, call immediately
      makeEmergencyCall();
    }
  };

  const handlePressOut = () => {
    if (isLongPressing) {
      setIsLongPressing(false);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      // Reset the progress animation
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  };

  const makeEmergencyCall = async () => {
    try {
      const emergencyContact = await AsyncStorage.getItem('emergencyContact');
      if (!emergencyContact) {
        router.push('/(tabs)/settings?section=emergency');
        return;
      }

      await Linking.openURL(`tel:${emergencyContact}`);
    } catch (error) {
      console.error('Error handling emergency call:', error);
    }
  };

  return (
    <View
      style={[styles.container, { left: position.x, top: position.y }]}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <TouchableOpacity
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        {isLongPressing && requireLongPress && (
          <Animated.View
            style={[
              styles.progressOverlay,
              {
                height: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}
        <MaterialIcons
          name="phone"
          size={28}
          color={colors.text.primary}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999, // Ensure it's above everything else
    elevation: 10, // For Android
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: radius.round,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.md,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  icon: {
    zIndex: 2, // Ensure icon stays above the progress overlay
  },
});
