import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext';
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
  const { isRecording } = useRecording();
  const [isLocked, setIsLocked] = useState(true); // Start locked by default to prevent flash
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track initialization state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(Date.now());
  const isCheckingRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // Track if this is a fresh login (user just signed in) vs app restart (user loaded from storage)
  const isFreshLoginRef = useRef(false);
  const hasCheckedInitialUserRef = useRef(false);

  // Check if this is a fresh login by looking for a flag set during sign-in
  useEffect(() => {
    const checkFreshLogin = async () => {
      if (!hasCheckedInitialUserRef.current && user?.id) {
        hasCheckedInitialUserRef.current = true;
        
        // Check if there's a "fresh_login" flag in AsyncStorage
        // This flag is set during sign-in and cleared after first unlock
        const freshLoginFlag = await AsyncStorage.getItem('fresh_login');
        isFreshLoginRef.current = freshLoginFlag === 'true';
        
        if (isFreshLoginRef.current) {
          console.log('Fresh login detected, unlocking automatically');
          // On fresh login, unlock automatically and set unlock timestamp
          setIsLocked(false);
          await AsyncStorage.setItem('last_biometric_unlock', Date.now().toString());
          await AsyncStorage.removeItem('fresh_login'); // Clear the flag
          lastUnlockTimeRef.current = Date.now();
          previousUserIdRef.current = user.id;
          hasInitializedRef.current = true;
          return;
        } else {
          // App restart with existing session - should check if we need to lock
          previousUserIdRef.current = user.id;
          hasInitializedRef.current = true;
        }
      }
    };
    
    checkFreshLogin();
  }, [user?.id]);
    
  useEffect(() => {
    // Update previous user ID when user changes
    if (user?.id) {
      previousUserIdRef.current = user.id;
    } else {
      // User logged out - reset state
      previousUserIdRef.current = null;
      hasInitializedRef.current = false;
      hasCheckedInitialUserRef.current = false;
      isFreshLoginRef.current = false;
    }
    
    // Only check biometric lock if:
    // 1. User is authenticated
    // 2. Biometric login is enabled
    // 3. Biometric is available
    // 4. This is NOT a fresh login (already handled above)
    if (user?.id && biometricLoginEnabled && biometricAvailable && !isFreshLoginRef.current) {
      // Check if app should be locked (only for returning users, not fresh login)
      // But skip if recording is active
      if (!isRecording) {
        checkBiometricLogin();
      } else {
        setIsLocked(false);
      }
    } else if (!biometricLoginEnabled || !biometricAvailable) {
      // Unlock if biometric login is disabled or not available
      setIsLocked(false);
    }
  }, [user?.id, biometricLoginEnabled, biometricAvailable, isRecording]);

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

      // Check if this is a fresh login (user just signed in, not app restart)
      const freshLoginFlag = await AsyncStorage.getItem('fresh_login');
      const isFreshLogin = freshLoginFlag === 'true';

      // If enabled and user is authenticated, check if we should lock
      if (enabled && user?.id && biometricAvailable) {
        // Don't lock on fresh login - it will be handled by the fresh login check
        if (isFreshLogin) {
          console.log('Fresh login detected in loadBiometricLoginSetting, skipping lock');
          setIsLocked(false);
        } else {
          // App restart with existing session - check if we should lock
          // Only unlock if unlock was very recent (within 30 seconds)
          const shouldLock = await shouldLockApp();
          setIsLocked(shouldLock);
        }
        
        // Mark that we've initialized for this user
        if (!hasInitializedRef.current) {
          previousUserIdRef.current = user.id;
          hasInitializedRef.current = true;
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
      isFreshLoginRef.current = false; // Reset for next login
      hasCheckedInitialUserRef.current = false; // Reset for next app start
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
      // Don't lock if recording is active (camera conflicts with biometric auth)
      if (isRecording) {
        console.log('Recording is active, skipping biometric lock');
        return;
      }
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

    // Don't lock if recording is active (camera conflicts with biometric auth)
    if (isRecording) {
      console.log('Recording is active, skipping biometric lock check');
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

