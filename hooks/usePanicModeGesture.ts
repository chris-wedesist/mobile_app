import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Hook to detect panic mode gestures
 * Supports: 
 * - Triple back button press (Android)
 * - Shake device (iOS/Android)
 * Note: Triple tap on screen is handled by PanicModeTripleTap component for iOS
 */
export function usePanicModeGesture() {
  const { user, signOut } = useAuth();
  const [panicModeEnabled, setPanicModeEnabled] = useState(false);
  const powerPressCount = useRef(0);
  const lastPowerPressTime = useRef(0);
  const POWER_PRESS_INTERVAL = 2000; // 2 seconds window
  const REQUIRED_PRESSES = 3; // Triple press
  
  // Shake detection
  const shakeThreshold = useRef(0);
  const lastShakeTime = useRef(0);
  const SHAKE_THRESHOLD = 1.5; // Acceleration threshold for shake
  const SHAKE_INTERVAL = 1000; // 1 second between shakes
  
  // Prevent multiple panic mode triggers
  const isTriggeringRef = useRef(false);

  // Check if panic mode is enabled
  useEffect(() => {
    const checkPanicModeEnabled = async () => {
      if (!user?.id) {
        setPanicModeEnabled(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('users')
          .select('panic_mode_enabled')
          .eq('id', user.id)
          .single();
        
        setPanicModeEnabled(data?.panic_mode_enabled || false);
      } catch (error) {
        console.error('Error checking panic mode:', error);
        setPanicModeEnabled(false);
      }
    };

    checkPanicModeEnabled();
  }, [user?.id]);

  useEffect(() => {
    if (!panicModeEnabled || !user?.id) return;

    let accelerometerSubscription: any = null;

    // Handle triple back button press (Android only)
    let backHandler: any = null;
    if (Platform.OS === 'android') {
      backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        
        // Reset count if too much time has passed
        if (now - lastPowerPressTime.current > POWER_PRESS_INTERVAL) {
          powerPressCount.current = 0;
        }
        
        powerPressCount.current += 1;
        lastPowerPressTime.current = now;
        
        if (powerPressCount.current >= REQUIRED_PRESSES) {
          powerPressCount.current = 0;
          triggerPanicMode();
          return true; // Prevent default back behavior
        }
        
        // For single/double press, allow normal back behavior
        setTimeout(() => {
          if (powerPressCount.current > 0 && powerPressCount.current < REQUIRED_PRESSES) {
            powerPressCount.current = 0;
          }
        }, POWER_PRESS_INTERVAL);
        
        return false; // Allow normal back behavior for single press
      });
    }

    // Handle shake gesture (iOS and Android)
    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(100); // Update every 100ms
      
      accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        
        if (acceleration > SHAKE_THRESHOLD) {
          if (now - lastShakeTime.current > SHAKE_INTERVAL) {
            shakeThreshold.current += 1;
            lastShakeTime.current = now;
            
            // Trigger after 3 shakes within interval
            if (shakeThreshold.current >= 3) {
              shakeThreshold.current = 0;
              triggerPanicMode();
            }
          }
        } else {
          // Reset shake count if no shake detected for a while
          if (now - lastShakeTime.current > SHAKE_INTERVAL * 2) {
            shakeThreshold.current = 0;
          }
        }
      });
    }

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
      if (accelerometerSubscription) {
        accelerometerSubscription.remove();
      }
    };
  }, [panicModeEnabled, user?.id]);

  const triggerPanicMode = async () => {
    // Prevent multiple simultaneous triggers
    if (isTriggeringRef.current) {
      console.log('Panic mode already triggering, ignoring...');
      return;
    }
    
    try {
      isTriggeringRef.current = true;
      console.log('🚨 Panic Mode triggered by gesture');
      
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
}

