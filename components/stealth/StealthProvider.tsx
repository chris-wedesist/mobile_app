import React, { createContext, useContext, useEffect, useState } from 'react';
import { stealthManager, AppMode } from '../../lib/stealth';

interface StealthContextType {
  currentMode: AppMode;
  isLoading: boolean;
  toggleMode: () => Promise<boolean>;
  setMode: (mode: AppMode) => Promise<boolean>;
  resetToStealth: () => Promise<void>;
}

const StealthContext = createContext<StealthContextType | undefined>(undefined);

export function StealthProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<AppMode>('stealth');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeStealthMode();
  }, []);

  const initializeStealthMode = async () => {
    try {
      await stealthManager.initialize();
      const mode = await stealthManager.getCurrentMode();
      setCurrentMode(mode);
    } catch (error) {
      console.error('Failed to initialize stealth mode:', error);
      setCurrentMode('stealth'); // Default to stealth for safety
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = async (): Promise<boolean> => {
    try {
      const success = await stealthManager.toggleMode();
      if (success) {
        const newMode = await stealthManager.getCurrentMode();
        setCurrentMode(newMode);
      }
      return success;
    } catch (error) {
      console.error('Failed to toggle mode:', error);
      return false;
    }
  };

  const setMode = async (mode: AppMode): Promise<boolean> => {
    try {
      const success = await stealthManager.setMode(mode);
      if (success) {
        setCurrentMode(mode);
      }
      return success;
    } catch (error) {
      console.error('Failed to set mode:', error);
      return false;
    }
  };

  const resetToStealth = async (): Promise<void> => {
    try {
      await stealthManager.resetToStealth();
      setCurrentMode('stealth');
    } catch (error) {
      console.error('Failed to reset to stealth:', error);
    }
  };

  const value: StealthContextType = {
    currentMode,
    isLoading,
    toggleMode,
    setMode,
    resetToStealth,
  };

  return (
    <StealthContext.Provider value={value}>{children}</StealthContext.Provider>
  );
}

export function useStealthContext(): StealthContextType {
  const context = useContext(StealthContext);
  if (context === undefined) {
    throw new Error('useStealthContext must be used within a StealthProvider');
  }
  return context;
}

export default StealthProvider;
