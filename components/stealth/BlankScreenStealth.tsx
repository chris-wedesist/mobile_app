import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Alert,
} from 'react-native';
import { blankScreenStealthManager } from '../../lib/security/blankScreenStealth';

interface BlankScreenOverlayProps {
  isActive: boolean;
  onDeactivate: () => void;
}

export const BlankScreenOverlay: React.FC<BlankScreenOverlayProps> = ({
  isActive,
  onDeactivate,
}) => {
  const [brightnessLevel, setBrightnessLevel] = useState(0);
  const [activationMethod, setActivationMethod] = useState<string>('both');
  const [longPressDuration, setLongPressDuration] = useState(3000);

  useEffect(() => {
    if (isActive) {
      const config = blankScreenStealthManager.getConfig();
      setBrightnessLevel(config.brightnessLevel);
      setActivationMethod(config.activationMethod);
      setLongPressDuration(config.longPressDeactivationDuration);
    }
  }, [isActive]);

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Start long press detection
      if (activationMethod === 'long_press' || activationMethod === 'both') {
        blankScreenStealthManager.onLongPressStart();
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      // End long press detection
      blankScreenStealthManager.onLongPressEnd();

      // Check for swipe up gesture
      if (gestureState.dy < -50 && Math.abs(gestureState.dx) < 50) {
        blankScreenStealthManager.onSwipeUp();
      }
    },
    onPanResponderTerminate: () => {
      blankScreenStealthManager.onLongPressEnd();
    },
  });

  const handleTap = () => {
    if (activationMethod === 'gesture' || activationMethod === 'both') {
      blankScreenStealthManager.registerGestureTap();
    }
  };

  if (!isActive) {
    return null;
  }

  const screenDimensions = Dimensions.get('screen');
  const overlayOpacity = 1 - brightnessLevel; // Invert brightness for opacity

  return (
    <View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-only">
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.touchArea} {...panResponder.panHandlers}>
          {/* Completely invisible touch area */}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export const BlankScreenStealthComponent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      setIsActive(blankScreenStealthManager.isActive());
    };

    // Initial check
    checkStatus();

    // Set up interval to check status (in case it changes from other parts of the app)
    const interval = setInterval(checkStatus, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleDeactivate = async () => {
    try {
      await blankScreenStealthManager.deactivateBlankScreen();
      setIsActive(false);
    } catch (error) {
      console.error('Failed to deactivate blank screen:', error);
    }
  };

  return (
    <BlankScreenOverlay isActive={isActive} onDeactivate={handleDeactivate} />
  );
};

// Settings component for configuring blank screen stealth
export const BlankScreenSettings: React.FC = () => {
  const [config, setConfig] = useState(blankScreenStealthManager.getConfig());

  useEffect(() => {
    setConfig(blankScreenStealthManager.getConfig());
  }, []);

  const updateActivationMethod = async (method: 'long_press' | 'gesture' | 'both') => {
    await blankScreenStealthManager.setActivationMethod(method);
    setConfig(blankScreenStealthManager.getConfig());
  };

  const updateGestureSequence = async (sequence: 'triple_tap' | 'swipe_up' | 'shake') => {
    await blankScreenStealthManager.setGestureSequence(sequence);
    setConfig(blankScreenStealthManager.getConfig());
  };

  const updateLongPressDuration = async (duration: number) => {
    await blankScreenStealthManager.setLongPressDuration(duration);
    setConfig(blankScreenStealthManager.getConfig());
  };

  const activateBlankScreen = async () => {
    const success = await blankScreenStealthManager.activateBlankScreen();
    if (success) {
      Alert.alert(
        'Blank Screen Activated',
        `Use ${config.activationMethod === 'long_press' ? 'long press' : 
              config.activationMethod === 'gesture' ? 'gesture' : 
              'long press or gesture'} to deactivate.`,
        [{ text: 'OK' }]
      );
    }
  };

  const testEmergencyDeactivation = async () => {
    Alert.alert(
      'Emergency Deactivation Test',
      'This will test the emergency deactivation feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test',
          onPress: async () => {
            await blankScreenStealthManager.emergencyDeactivate();
            Alert.alert('Success', 'Emergency deactivation works correctly.');
          },
        },
      ]
    );
  };

  // This would be integrated into the main settings screen
  // For now, return null as this is just the configuration logic
  return null;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  touchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default BlankScreenStealthComponent;
