import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  shadows,
  radius,
} from '../constants/theme';
import CoverStoryNotes from './CoverStoryNotes';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

export default function CoverStoryManager() {
  const [isActive, setIsActive] = useState(false);
  const { width, height } = useWindowDimensions();
  const slideAnim = useState(new Animated.Value(height))[0];

  useEffect(() => {
    const handleCoverStory = (event: KeyboardEvent) => {
      // Activate cover story with Ctrl + Shift + N
      if (event.ctrlKey && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        toggleCoverStory();
      }
      // Deactivate with Escape
      if (event.key === 'Escape') {
        deactivateCoverStory();
      }
    };

    // Handle Android back button
    const handleBackButton = () => {
      if (isActive) {
        deactivateCoverStory();
        return true;
      }
      return false;
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleCoverStory);
    } else {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackButton
      );
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('keydown', handleCoverStory);
      }
      // BackHandler subscription is automatically cleaned up
    };
  }, [isActive]);

  // Log cover story activation/deactivation
  useEffect(() => {
    if (isActive) {
      logCoverStoryEvent('activated');
    }
  }, [isActive]);

  const toggleCoverStory = () => {
    if (isActive) {
      deactivateCoverStory();
    } else {
      activateCoverStory();
    }
  };

  const activateCoverStory = () => {
    setIsActive(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const deactivateCoverStory = () => {
    logCoverStoryEvent('deactivated');
    Animated.spring(slideAnim, {
      toValue: height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setIsActive(false));
  };

  const logCoverStoryEvent = async (action: 'activated' | 'deactivated') => {
    try {
      await supabase.from('cover_story_events').insert([
        {
          action,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          metadata: {
            screen_dimensions: { width, height },
            activation_method:
              action === 'activated' ? 'keyboard_shortcut' : 'escape_key',
          },
        },
      ]);
    } catch (error) {
      console.error('Error logging cover story event:', error);
    }
  };

  if (!isActive) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <CoverStoryNotes />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.surface,
    zIndex: 9999,
  },
});
