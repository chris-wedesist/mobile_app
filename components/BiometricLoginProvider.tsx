import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type BiometricLoginContextType = {
  isLocked: boolean;
  biometricLoginEnabled: boolean;
  biometricAvailable: boolean;
  isInitializing: boolean;
  unlock: () => void;
  lock: () => void;
  checkBiometricLogin: () => Promise<void>;
};

const BiometricLoginContext = createContext<BiometricLoginContextType>({
  isLocked: false,
  biometricLoginEnabled: false,
  biometricAvailable: false,
  isInitializing: true,
  unlock: () => {},
  lock: () => {},
  checkBiometricLogin: async () => {},
});

export function BiometricLoginProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(true); // Start locked by default to prevent flash
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track initialization state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(Date.now());
  const isCheckingRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Initialize previousUserIdRef on mount if user already exists (session persistence)
  useEffect(() => {
    if (!hasInitializedRef.current && user?.id) {
      previousUserIdRef.current = user.id;
      hasInitializedRef.current = true;
    } else if (!user?.id) {
      hasInitializedRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Check if user just logged in (user changed from null to a user ID)
    const isFreshLogin = previousUserIdRef.current === null && user?.id !== null;
    
    if (isFreshLogin) {
      console.log('Fresh login detected, unlocking automatically');
      // On fresh login, unlock automatically and set unlock timestamp
      setIsLocked(false);
      AsyncStorage.setItem('last_biometric_unlock', Date.now().toString());
      lastUnlockTimeRef.current = Date.now();
      previousUserIdRef.current = user?.id || null;
      hasInitializedRef.current = true;
      return;
    }
    
    // Update previous user ID
    previousUserIdRef.current = user?.id || null;
    
    if (user?.id && biometricLoginEnabled && biometricAvailable) {
      // Check if app should be locked (only for returning users, not fresh login)
      checkBiometricLogin();
    } else if (!biometricLoginEnabled || !biometricAvailable) {
      // Unlock if biometric login is disabled or not available
      setIsLocked(false);
    }
  }, [user?.id, biometricLoginEnabled, biometricAvailable]);

  useEffect(() => {
    // Check biometric login when app comes to foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [biometricLoginEnabled, biometricAvailable, user]);

  const checkBiometricAvailability = async () => {
    try {
      if (Platform.OS === 'web') {
        setBiometricAvailable(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const loadBiometricLoginSetting = async () => {
    try {
      setIsInitializing(true);
      
      if (!user?.id) {
        setBiometricLoginEnabled(false);
        setIsLocked(false);
        setIsInitializing(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('biometric_login_enabled')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading biometric login setting:', error);
        setBiometricLoginEnabled(false);
        setIsLocked(false);
        setIsInitializing(false);
        return;
      }

      const enabled = data?.biometric_login_enabled || false;
      setBiometricLoginEnabled(enabled);

      // If enabled and user is authenticated, check if we should lock
      // On app start with existing session, unlock automatically
      // Only lock on app foreground (handled by handleAppStateChange)
      if (enabled && user?.id && biometricAvailable) {
        // Check if this is app initialization with existing session
        // If previousUserIdRef is already set, this is app start with session, not fresh login
        const isAppStart = previousUserIdRef.current === user.id && !hasInitializedRef.current;
        const isFreshLogin = previousUserIdRef.current === null;
        
        if (isFreshLogin || isAppStart) {
          // Fresh login or app start with existing session - unlock automatically
          setIsLocked(false);
          await AsyncStorage.setItem('last_biometric_unlock', Date.now().toString());
          lastUnlockTimeRef.current = Date.now();
          if (!hasInitializedRef.current) {
            previousUserIdRef.current = user.id;
            hasInitializedRef.current = true;
          }
        } else {
          // Returning user - check if should lock
          const shouldLock = await shouldLockApp();
          setIsLocked(shouldLock);
        }
      } else {
        setIsLocked(false);
      }
      
      setIsInitializing(false);
    } catch (error) {
      console.error('Error loading biometric login setting:', error);
      setBiometricLoginEnabled(false);
      setIsLocked(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadBiometricLoginSetting();
    } else {
      setBiometricLoginEnabled(false);
      setIsLocked(false);
      setIsInitializing(false); // Mark as initialized when no user
      previousUserIdRef.current = null; // Reset when user logs out
      hasInitializedRef.current = false;
    }
  }, [user?.id, biometricAvailable]);

  const shouldLockApp = async (): Promise<boolean> => {
    try {
      // Check if we have a recent unlock timestamp
      const lastUnlockTime = await AsyncStorage.getItem('last_biometric_unlock');
      if (lastUnlockTime) {
        const timeSinceUnlock = Date.now() - parseInt(lastUnlockTime, 10);
        // Lock if more than 30 seconds have passed
        return timeSinceUnlock > 30000;
      }
      return true; // Lock if no recent unlock
    } catch (error) {
      return true; // Lock on error
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      user?.id &&
      biometricLoginEnabled &&
      biometricAvailable
    ) {
      // App came to foreground, lock the app
      setIsLocked(true);
    }
    appStateRef.current = nextAppState;
  };

  const checkBiometricLogin = async () => {
    if (isCheckingRef.current) return;
    
    if (!user?.id || !biometricLoginEnabled || !biometricAvailable) {
      setIsLocked(false);
      return;
    }

    isCheckingRef.current = true;
    
    try {
      const shouldLock = await shouldLockApp();
      if (shouldLock) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error checking biometric login:', error);
      setIsLocked(false);
    } finally {
      isCheckingRef.current = false;
    }
  };

  const unlock = async () => {
    setIsLocked(false);
    // Store unlock timestamp
    await AsyncStorage.setItem('last_biometric_unlock', Date.now().toString());
    lastUnlockTimeRef.current = Date.now();
  };

  const lock = () => {
    setIsLocked(true);
  };

  return (
    <BiometricLoginContext.Provider
      value={{
        isLocked,
        biometricLoginEnabled,
        biometricAvailable,
        isInitializing,
        unlock,
        lock,
        checkBiometricLogin,
      }}
    >
      {children}
    </BiometricLoginContext.Provider>
  );
}

export function useBiometricLogin() {
  const context = useContext(BiometricLoginContext);
  if (!context) {
    throw new Error('useBiometricLogin must be used within a BiometricLoginProvider');
  }
  return context;
}

