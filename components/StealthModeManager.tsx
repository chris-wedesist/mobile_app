import { useState, useEffect, createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

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
      const { data: settings } = await supabase
        .from('user_settings')
        .select('stealth_mode_enabled, cover_story_screen')
        .single();

      if (settings) {
        setIsActive(settings.stealth_mode_enabled);
        setCurrentScreen(settings.cover_story_screen);
      }
    } catch (error) {
      console.error('Error loading stealth mode state:', error);
    }
  };

  const activate = async (trigger: string = 'manual') => {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('cover_story_screen')
        .single();

      if (!settings?.cover_story_screen) {
        throw new Error('No cover story screen selected');
      }

      // Log activation event
      await supabase.rpc('activate_cover_story', {
        p_platform: Platform.OS,
        p_screen_type: settings.cover_story_screen,
        p_trigger_type: trigger,
        p_metadata: {
          device_info: Platform.constants,
          activation_method: trigger
        }
      });

      setIsActive(true);
      setCurrentScreen(settings.cover_story_screen);

      // Navigate to cover story screen
      router.replace(`/stealth-${settings.cover_story_screen}`);
    } catch (error) {
      console.error('Error activating stealth mode:', error);
      throw error;
    }
  };

  const deactivate = async (trigger: string = 'manual') => {
    try {
      // Log deactivation event
      await supabase.rpc('deactivate_cover_story', {
        p_trigger_type: trigger,
        p_metadata: {
          deactivation_method: trigger,
          device_info: Platform.constants
        }
      });

      setIsActive(false);
      setCurrentScreen(null);

      // Navigate back to main app
      router.replace('/');
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