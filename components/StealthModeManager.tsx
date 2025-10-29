import { useState, useEffect, createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StealthModeContextType = {
  isActive: boolean;
  currentScreen: string | null;
  activate: (trigger?: string) => Promise<void>;
  deactivate: (trigger?: string) => Promise<void>;
  toggle: (trigger?: string) => Promise<void>;
};

const StealthModeContext = createContext<StealthModeContextType>({
  isActive: false,
  currentScreen: null,
  activate: async () => {},
  deactivate: async () => {},
  toggle: async () => {},
});

export function StealthModeProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);

  useEffect(() => {
    loadStealthModeState();
  }, []);

  const loadStealthModeState = async () => {
    try {
      const storedState = await AsyncStorage.getItem('stealth_mode_active');
      const storedScreen = await AsyncStorage.getItem('stealth_mode_screen');
      
      if (storedState === 'true') {
        setIsActive(true);
        setCurrentScreen(storedScreen || 'calculator');
      }
    } catch (error) {
      console.error('Error loading stealth mode state:', error);
    }
  };

  const activate = async (trigger: string = 'manual') => {
    try {
      // Default to calculator for now
      const screen = 'calculator';
      
      setIsActive(true);
      setCurrentScreen(screen);
      
      // Save to storage
      await AsyncStorage.setItem('stealth_mode_active', 'true');
      await AsyncStorage.setItem('stealth_mode_screen', screen);
      
      console.log('Stealth mode activated, navigating to calculator...');
      
      // Navigate to cover story screen
      router.replace('/stealth-calculator');
    } catch (error) {
      console.error('Error activating stealth mode:', error);
      throw error;
    }
  };

  const deactivate = async (trigger: string = 'manual') => {
    try {
      setIsActive(false);
      setCurrentScreen(null);

      // Clear from storage
      await AsyncStorage.removeItem('stealth_mode_active');
      await AsyncStorage.removeItem('stealth_mode_screen');

      console.log('Stealth mode deactivated, navigating to main app...');
      
      // Navigate back to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error deactivating stealth mode:', error);
      throw error;
    }
  };

  const toggle = async (trigger: string = 'manual') => {
    if (isActive) {
      await deactivate(trigger);
    } else {
      await activate(trigger);
    }
  };

  return (
    <StealthModeContext.Provider 
      value={{ 
        isActive, 
        currentScreen,
        activate,
        deactivate,
        toggle
      }}>
      {children}
    </StealthModeContext.Provider>
  );
}

export function useStealthMode() {
  const context = useContext(StealthModeContext);
  if (!context) {
    throw new Error('useStealthMode must be used within a StealthModeProvider');
  }
  return context;
}

export default StealthModeProvider;