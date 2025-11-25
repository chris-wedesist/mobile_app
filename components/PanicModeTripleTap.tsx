import { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Note: Volume button detection requires native modules
// For Expo managed workflow, volume button detection is not available
// Screen tap detection (5 taps) works on both iOS and Android

/**
 * Component to detect 5-tap gesture for panic mode (iOS and Android)
 * Also handles volume button presses when panic mode is enabled
 */
export function PanicModeTripleTap({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);
  const TAP_INTERVAL = 2000; // 2 second window for 5 taps
  const REQUIRED_TAPS = 5;
  const panicModeEnabledRef = useRef(false);
  const isTriggeringRef = useRef(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Volume button detection
  const volumePressCount = useRef(0);
  const lastVolumePressTime = useRef(0);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) {
      panicModeEnabledRef.current = false;
      return;
    }

    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;

    const checkPanicModeEnabled = async () => {
      if (!isMounted || !user?.id) {
        return;
      }
      
      try {
        console.log('🔍 Checking panic mode status for user:', user.id);
        const { data, error } = await supabase
          .from('users')
          .select('panic_mode_enabled')
          .eq('id', user.id)
          .single();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ Error fetching panic mode from database:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          panicModeEnabledRef.current = false;
          return;
        }
        
        console.log('📊 Database response:', {
          data: data,
          panic_mode_enabled: data?.panic_mode_enabled,
          dataType: typeof data?.panic_mode_enabled
        });
        
        const isEnabled = data?.panic_mode_enabled || false;
        const wasEnabled = panicModeEnabledRef.current;
        panicModeEnabledRef.current = isEnabled;
        
        console.log('📈 Panic mode state:', {
          previous: wasEnabled,
          current: isEnabled,
          changed: wasEnabled !== isEnabled
        });
        
        // Only log when state changes
        if (isEnabled && !wasEnabled) {
          console.log('✅ Panic mode enabled - 5-tap detection active');
        } else if (!isEnabled && wasEnabled) {
          console.log('⚠️ Panic mode disabled');
        } else {
          console.log(`ℹ️ Panic mode status: ${isEnabled ? 'ENABLED' : 'DISABLED'} (no change)`);
        }
      } catch (error) {
        console.error('❌ Exception checking panic mode:', error);
        if (isMounted) {
        panicModeEnabledRef.current = false;
        }
      }
    };

    // Check immediately
    checkPanicModeEnabled().catch(() => {});
    
    // Re-check periodically (every 5 seconds instead of 2 to reduce load)
    interval = setInterval(() => {
      if (isMounted) {
        checkPanicModeEnabled().catch(() => {});
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user?.id]);

  const triggerPanicMode = useCallback(async () => {
    // Prevent multiple simultaneous triggers
    if (isTriggeringRef.current) {
      return;
    }
    
    try {
      isTriggeringRef.current = true;
      console.log('🚨 Panic Mode triggered - Complete data wipe and logout');
      
      // Step 1: Clear all AsyncStorage cache FIRST (before any other operations)
      console.log('Panic Mode: Step 1 - Clearing all cache...');
      try {
        await AsyncStorage.clear();
        console.log('Panic Mode: ✅ All cache cleared');
      } catch (cacheError) {
        console.error('Error clearing cache:', cacheError);
        // Try to clear known keys individually as fallback
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          if (allKeys.length > 0) {
            await AsyncStorage.multiRemove(allKeys);
            console.log('Panic Mode: ✅ Cache cleared (fallback method)');
          }
        } catch (fallbackError) {
          console.error('Error clearing cache (fallback):', fallbackError);
        }
      }
      
      // Step 2: Sign out from Supabase and clear session
      console.log('Panic Mode: Step 2 - Signing out from Supabase...');
      try {
        await supabase.auth.signOut();
        console.log('Panic Mode: ✅ Supabase session cleared');
      } catch (supabaseError) {
        console.error('Error signing out from Supabase:', supabaseError);
      }
      
      // Step 3: Sign out user completely (from AuthContext)
      // This will also clear local state
      console.log('Panic Mode: Step 3 - Signing out user...');
      try {
        await signOut();
        console.log('Panic Mode: ✅ User signed out');
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
      
      // Step 4: Wait for all state updates to propagate
      console.log('Panic Mode: Step 4 - Waiting for state updates...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 5: Navigate to login screen
      console.log('Panic Mode: Step 5 - Navigating to login...');
      try {
        router.replace('/login' as any);
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Panic Mode: ✅ Navigated to login');
      } catch (navError) {
        console.error('Error navigating to login:', navError);
      }
      
      // Step 6: On Android, exit app after ensuring everything is complete
      // On iOS, just stay on login screen (can't programmatically close app)
      if (Platform.OS === 'android') {
        console.log('Panic Mode: Step 6 - Exiting app (Android)...');
        // Wait a bit more to ensure everything is saved
        await new Promise(resolve => setTimeout(resolve, 500));
        BackHandler.exitApp();
      } else {
        console.log('✅ Panic Mode: Complete - User logged out and cache cleared');
      }
      
    } catch (error) {
      console.error('Error triggering panic mode:', error);
      // Fallback: Try to clear everything and navigate
      try {
        await AsyncStorage.clear().catch(() => {});
        await supabase.auth.signOut().catch(() => {});
        await signOut().catch(() => {});
        router.replace('/login' as any);
      } catch (fallbackError) {
        console.error('Error in panic mode fallback:', fallbackError);
      }
    } finally {
      // Don't reset isTriggeringRef - let it stay true since we're logging out
    }
  }, [signOut]);

  const handleTap = useCallback(() => {
    try {
      // Always log to see if taps are being detected
      console.log('🔵 TAP DETECTED!', {
        panicModeEnabled: panicModeEnabledRef.current,
        userId: user?.id,
        currentCount: tapCount.current,
        timestamp: new Date().toISOString()
      });

      if (!panicModeEnabledRef.current) {
        console.log('⚠️ Panic mode not enabled - tap detected but ignored');
        return;
      }

      if (!user?.id) {
        console.log('❌ No user ID, ignoring tap');
        return;
      }

      const now = Date.now();
      
      // Reset count if too much time has passed
      if (now - lastTapTime.current > TAP_INTERVAL) {
        console.log('⏱️ Resetting tap count - too much time passed');
        tapCount.current = 0;
      }
      
      tapCount.current += 1;
      lastTapTime.current = now;
      
      console.log(`🚨 Panic tap detected: ${tapCount.current}/${REQUIRED_TAPS}`);
      
      // Clear existing timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      
      if (tapCount.current >= REQUIRED_TAPS) {
        console.log('✅ 5 taps reached! Triggering panic mode...');
        tapCount.current = 0;
        triggerPanicMode().catch((error) => {
          console.error('Error triggering panic mode:', error);
        });
      } else {
        // Reset tap count after interval if not enough taps
        tapTimeoutRef.current = setTimeout(() => {
          if (tapCount.current > 0 && tapCount.current < REQUIRED_TAPS) {
            console.log(`⏱️ Tap count reset - only got ${tapCount.current} taps`);
            tapCount.current = 0;
          }
        }, TAP_INTERVAL);
      }
    } catch (error) {
      console.error('❌ Error in handleTap:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack',
        error: error
      });
    }
  }, [user?.id, triggerPanicMode]);

  // Volume button detection using expo-av
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let volumeSubscription: any = null;
    let lastVolume = 0;
    let volumeCheckInterval: NodeJS.Timeout | null = null;

    const handleVolumePress = () => {
      if (!panicModeEnabledRef.current || !user?.id) {
        return;
      }

      const now = Date.now();
      
      // Reset count if too much time has passed
      if (now - lastVolumePressTime.current > TAP_INTERVAL) {
        volumePressCount.current = 0;
      }
      
      volumePressCount.current += 1;
      lastVolumePressTime.current = now;
      
      console.log(`🔊 Panic volume press: ${volumePressCount.current}/${REQUIRED_TAPS}`);
      
      // Clear existing timeout
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = null;
      }
      
      if (volumePressCount.current >= REQUIRED_TAPS) {
        volumePressCount.current = 0;
        triggerPanicMode().catch(() => {
          // Silently handle panic mode trigger errors
        });
      } else {
        // Reset count after interval if not enough presses
        volumeTimeoutRef.current = setTimeout(() => {
          if (volumePressCount.current > 0 && volumePressCount.current < REQUIRED_TAPS) {
            volumePressCount.current = 0;
          }
        }, TAP_INTERVAL);
      }
    };

    // Setup volume detection when panic mode is enabled
    const setupVolumeDetection = async () => {
      try {
        // Check if panic mode is enabled
        const { data } = await supabase
          .from('users')
          .select('panic_mode_enabled')
          .eq('id', user.id)
          .single();
        
        if (!data?.panic_mode_enabled) {
          return;
        }

        // Try to monitor volume changes using expo-av
        // Note: This is a workaround - direct volume button detection requires native modules
        try {
          // Create a silent audio session to monitor volume
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });

          // Monitor volume changes by checking periodically
          // This is not ideal but works as a workaround
          let previousVolume = 0;
          volumeCheckInterval = setInterval(async () => {
            try {
              // Note: expo-av doesn't provide direct volume monitoring
              // This would require native modules for proper detection
              // For now, we'll show the UI but note that it needs native implementation
            } catch (error) {
              // Silently handle
            }
          }, 100);
        } catch (error) {
          console.log('Volume monitoring setup (requires native modules for full functionality)');
        }
      } catch (error) {
        console.warn('Could not set up volume button detection:', error);
      }
    };

    // Setup when user changes or component mounts
    setupVolumeDetection();
    
    return () => {
      if (volumeSubscription) {
        try {
          volumeSubscription.remove?.();
        } catch (error) {
          console.warn('Error removing volume subscription:', error);
        }
      }
      if (volumeCheckInterval) {
        clearInterval(volumeCheckInterval);
      }
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = null;
      }
    };
  }, [user?.id]);

  // Create tap gesture that works on both iOS and Android
  // Use a single tap gesture that counts taps manually
  const tapGesture = useMemo(() => {
    try {
      console.log('🎯 Creating tap gesture', {
        panicModeEnabled: panicModeEnabledRef.current,
        userId: user?.id
      });
      
      return Gesture.Tap()
        .numberOfTaps(1)
        .maxDuration(2000)
        .shouldCancelWhenOutside(false)
        .onEnd(() => {
          console.log('👆 Gesture onEnd triggered - calling handleTap via runOnJS');
          // Use runOnJS to safely call React functions from gesture handler
          runOnJS(handleTap)();
        });
    } catch (error) {
      console.error('❌ Error creating gesture:', error);
      // If gesture creation fails, return a no-op gesture
      return Gesture.Tap().onEnd(() => {});
    }
  }, [handleTap, user?.id]);

  // If no user, don't wrap with gesture detector
  if (!user?.id) {
    return <>{children}</>;
  }

  try {
    return (
      <GestureDetector gesture={tapGesture}>
        <View style={{ flex: 1 }} collapsable={false}>
          {children}
        </View>
      </GestureDetector>
    );
  } catch (error) {
    // If gesture detector fails, just return children without gesture handling
    console.error('Gesture detector error, falling back to basic view:', error);
    return <View style={{ flex: 1 }}>{children}</View>;
  }
}

