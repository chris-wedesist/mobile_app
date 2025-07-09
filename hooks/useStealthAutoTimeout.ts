import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useStealthMode } from '@/components/StealthModeManager';

/**
 * Hook to automatically exit stealth mode after a specified period of inactivity
 * @param timeoutMinutes Number of minutes of inactivity before exiting stealth mode
 */
export function useStealthAutoTimeout(timeoutMinutes = 5) {
  const { isActive, deactivate } = useStealthMode();
  
  useEffect(() => {
    if (!isActive) return;
    
    let timeoutId: NodeJS.Timeout | null = null;
    let lastActivity = Date.now();
    
    // Function to reset the timeout
    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      lastActivity = Date.now();
      
      timeoutId = setTimeout(() => {
        // Only deactivate if we've been inactive for the specified time
        const inactiveTime = Date.now() - lastActivity;
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
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Listen for user interaction to reset the timeout
    const touchHandler = () => {
      resetTimeout();
    };
    
    // Add touch event listener
    document.addEventListener('touchstart', touchHandler);
    document.addEventListener('mousemove', touchHandler);
    document.addEventListener('keydown', touchHandler);
    
    return () => {
      // Clean up
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      subscription.remove();
      document.removeEventListener('touchstart', touchHandler);
      document.removeEventListener('mousemove', touchHandler);
      document.removeEventListener('keydown', touchHandler);
    };
  }, [isActive, timeoutMinutes, deactivate]);
}