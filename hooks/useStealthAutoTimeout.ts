import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useStealthMode } from '@/components/StealthModeManager';

/**
 * Hook to automatically exit stealth mode after a specified period of inactivity
 * @param timeoutMinutes Number of minutes of inactivity before exiting stealth mode
 */
export function useStealthAutoTimeout(timeoutMinutes = 5) {
  const { isActive, deactivate } = useStealthMode();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  
  useEffect(() => {
    if (!isActive) {
      // Clear timeout if stealth mode is not active
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }
    
    // Function to reset the timeout
    const resetTimeout = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      
      lastActivityRef.current = Date.now();
      
      timeoutIdRef.current = setTimeout(() => {
        // Only deactivate if we've been inactive for the specified time
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime >= timeoutMinutes * 60 * 1000) {
          deactivate('auto_timeout');
        }
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Set initial timeout
    resetTimeout();
    
    // Handle app state changes (background/foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, reset the timeout
        resetTimeout();
      } else if (nextAppState === 'background') {
        // App went to background, clear the timeout
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      }
    };
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // Clean up
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      subscription.remove();
    };
  }, [isActive, timeoutMinutes, deactivate]);
  
  // Return a function that can be called to reset the timeout on user interaction
  // Components can call this when they detect user interaction
  return {
    resetTimeout: () => {
      if (isActive && timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        lastActivityRef.current = Date.now();
        timeoutIdRef.current = setTimeout(() => {
          const inactiveTime = Date.now() - lastActivityRef.current;
          if (inactiveTime >= timeoutMinutes * 60 * 1000) {
            deactivate('auto_timeout');
          }
        }, timeoutMinutes * 60 * 1000);
      }
    }
  };
}