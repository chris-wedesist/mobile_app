import { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { BackHandler } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Component to detect 5-tap gesture for iOS panic mode
 */
export function PanicModeTripleTap({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);
  const TAP_INTERVAL = 1000; // 1 second window for 5 taps
  const REQUIRED_TAPS = 5;
  const panicModeEnabledRef = useRef(false);
  const isTriggeringRef = useRef(false);

  useEffect(() => {
    const checkPanicModeEnabled = async () => {
      if (!user?.id) {
        panicModeEnabledRef.current = false;
        return;
      }
      
      try {
        const { data } = await supabase
          .from('users')
          .select('panic_mode_enabled')
          .eq('id', user.id)
          .single();
        
        panicModeEnabledRef.current = data?.panic_mode_enabled || false;
      } catch (error) {
        console.error('Error checking panic mode:', error);
        panicModeEnabledRef.current = false;
      }
    };

    checkPanicModeEnabled();
  }, [user?.id]);

  const handleTripleTap = async () => {
    if (!panicModeEnabledRef.current || !user?.id) return;

    const now = Date.now();
    
    // Reset count if too much time has passed
    if (now - lastTapTime.current > TAP_INTERVAL) {
      tapCount.current = 0;
    }
    
    tapCount.current += 1;
    lastTapTime.current = now;
    
    if (tapCount.current >= REQUIRED_TAPS) {
      tapCount.current = 0;
      await triggerPanicMode();
    }
    
    // Reset tap count after interval
    setTimeout(() => {
      if (tapCount.current > 0 && tapCount.current < REQUIRED_TAPS) {
        tapCount.current = 0;
      }
    }, TAP_INTERVAL);
  };

  const triggerPanicMode = async () => {
    // Prevent multiple simultaneous triggers
    if (isTriggeringRef.current) {
      console.log('Panic mode already triggering, ignoring...');
      return;
    }
    
    try {
      isTriggeringRef.current = true;
      console.log('🚨 Panic Mode triggered by 5 taps');
      
      // Step 1: Sign out user completely
      console.log('Panic Mode: Step 1 - Signing out user...');
      await signOut();
      console.log('Panic Mode: Step 1 - Sign out completed');
      
      // Step 2: Wait for state updates to propagate
      console.log('Panic Mode: Step 2 - Waiting for state updates...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Navigate to login screen
      console.log('Panic Mode: Step 3 - Navigating to login...');
      router.replace('/login' as any);
      
      // Step 4: On Android, safely exit app after a short delay
      if (Platform.OS === 'android') {
        setTimeout(() => {
          console.log('Panic Mode: Step 4 - Exiting app safely...');
          BackHandler.exitApp();
        }, 1000);
      }
      
      console.log('Panic Mode: Process completed successfully');
    } catch (error) {
      console.error('Error triggering panic mode:', error);
      // Even if sign out fails, try to navigate to login
      try {
        router.replace('/login' as any);
      } catch (navError) {
        console.error('Error navigating to login:', navError);
      }
    } finally {
      // Reset after a delay to allow navigation to complete
      setTimeout(() => {
        isTriggeringRef.current = false;
      }, 2000);
    }
  };

  // Only enable triple tap for iOS
  if (Platform.OS !== 'ios') {
    return <>{children}</>;
  }

  const fiveTapGesture = Gesture.Tap()
    .numberOfTaps(REQUIRED_TAPS)
    .maxDuration(TAP_INTERVAL * REQUIRED_TAPS)
    .onStart(() => {
      handleTripleTap();
    });

  return (
    <GestureDetector gesture={fiveTapGesture}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
}

