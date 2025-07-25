import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the store state interface
interface AppState {
  // User state
  user: any | null;
  
  // UI state
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr';
  
  // Actions
  setUser: (user: any | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'es' | 'fr') => void;
  
  // Utility actions
  clearUser: () => void;
  toggleTheme: () => void;
}

// Create the store with persistence
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      theme: 'light',
      language: 'en',
      
      // Actions
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
      
      // Utility actions
      clearUser: () => set({ user: null }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'app-storage', // unique name for the storage key
      storage: createJSONStorage(() => AsyncStorage), // use AsyncStorage for React Native
      partialize: (state) => ({ 
        // Only persist these fields
        user: state.user,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// Export selectors for better performance
export const useUser = () => useStore((state) => state.user);
export const useTheme = () => useStore((state) => state.theme);
export const useLanguage = () => useStore((state) => state.language);

// Export actions
export const useUserActions = () => useStore((state) => ({
  setUser: state.setUser,
  clearUser: state.clearUser,
}));

export const useThemeActions = () => useStore((state) => ({
  setTheme: state.setTheme,
  toggleTheme: state.toggleTheme,
}));

export const useLanguageActions = () => useStore((state) => ({
  setLanguage: state.setLanguage,
}));

// Export the full store for advanced usage
export default useStore; 