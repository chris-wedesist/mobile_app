import { create } from 'zustand';
import { useStore } from './store';
import { performanceOptimizer } from './performanceOptimizer';
import { errorHandler } from './errorHandler';

// Extended state interface for app-specific state
interface AppExtendedState {
  // Loading states
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Error states
  error: string | null;
  errors: Record<string, string | null>;
  
  // Data states
  cachedData: Record<string, any>;
  lastUpdated: Record<string, number>;
  
  // App state
  isOnline: boolean;
  isInitialized: boolean;
  currentScreen: string;
  
  // Actions
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  setCachedData: (key: string, data: any) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  clearErrors: () => void;
  clearCache: () => void;
}

// Create separate extended store
export const useExtendedStore = create<AppExtendedState>((set, get) => ({
  // Extended initial state
  isLoading: false,
  loadingStates: {},
  error: null,
  errors: {},
  cachedData: {},
  lastUpdated: {},
  isOnline: true,
  isInitialized: false,
  currentScreen: 'home',
  
  // Extended actions
  setLoading: (key: string, loading: boolean) => 
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: loading },
      isLoading: Object.values({ ...state.loadingStates, [key]: loading }).some(Boolean)
    })),
    
  setError: (key: string, error: string | null) => 
    set((state) => ({
      errors: { ...state.errors, [key]: error },
      error: error || Object.values({ ...state.errors, [key]: error }).find(Boolean) || null
    })),
    
  setCachedData: (key: string, data: any) => 
    set((state) => ({
      cachedData: { ...state.cachedData, [key]: data },
      lastUpdated: { ...state.lastUpdated, [key]: Date.now() }
    })),
    
  setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
  setCurrentScreen: (currentScreen: string) => set({ currentScreen }),
  
  clearErrors: () => set({ error: null, errors: {} }),
  clearCache: () => set({ cachedData: {}, lastUpdated: {} }),
}));

// State management utilities
export class StateManager {
  /**
   * Initialize app state
   */
  static async initialize() {
    try {
      const store = useExtendedStore.getState();
      
      // Set initialization state
      store.setLoading('app', true);
      
      // Check online status
      const isOnline = navigator.onLine !== undefined ? navigator.onLine : true;
      store.setOnlineStatus(isOnline);
      
      // Load cached data from performance optimizer
      await this.loadCachedData();
      
      // Mark as initialized
      store.setLoading('app', false);
      useExtendedStore.setState({ isInitialized: true });
      
    } catch (error) {
      errorHandler(error);
      useExtendedStore.getState().setError('app', 'Failed to initialize app');
    }
  }
  
  /**
   * Load cached data from performance optimizer
   */
  static async loadCachedData() {
    try {
      // This would integrate with performanceOptimizer to load cached data
      // For now, we'll just set a flag
      console.log('Loading cached data from performance optimizer...');
    } catch (error) {
      errorHandler(error);
    }
  }
  
  /**
   * Handle data fetching with state management
   */
  static async fetchWithState<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    cacheConfig?: { key: string; duration?: number }
  ): Promise<T> {
    const store = useExtendedStore.getState();
    
    try {
      // Set loading state
      store.setLoading(key, true);
      store.setError(key, null);
      
      // Use performance optimizer for fetching
      const data = await performanceOptimizer.fetchWithCache(key, fetchFunction, {
        key: cacheConfig?.key || key,
        duration: cacheConfig?.duration || 300000 // 5 minutes default
      });
      
      // Update cached data in state
      store.setCachedData(key, data);
      
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.setError(key, errorMessage);
      errorHandler(error);
      throw error;
      
    } finally {
      store.setLoading(key, false);
    }
  }
  
  /**
   * Get loading state for a specific key
   */
  static isLoading(key: string): boolean {
    return useExtendedStore.getState().loadingStates[key] || false;
  }
  
  /**
   * Get error state for a specific key
   */
  static getError(key: string): string | null {
    return useExtendedStore.getState().errors[key] || null;
  }
  
  /**
   * Get cached data for a specific key
   */
  static getCachedData(key: string): any {
    return useExtendedStore.getState().cachedData[key];
  }
  
  /**
   * Clear all state
   */
  static clearAll() {
    const store = useExtendedStore.getState();
    store.clearErrors();
    store.clearCache();
    useStore.getState().clearUser();
  }
}

// Export hooks for easy usage
export const useAppState = () => useExtendedStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  isOnline: state.isOnline,
  isInitialized: state.isInitialized,
  currentScreen: state.currentScreen,
}));

export const useLoadingState = (key: string) => 
  useExtendedStore((state) => state.loadingStates[key] || false);

export const useErrorState = (key: string) => 
  useExtendedStore((state) => state.errors[key] || null);

export const useCachedData = (key: string) => 
  useExtendedStore((state) => state.cachedData[key]);

export const useOnlineStatus = () => 
  useExtendedStore((state) => state.isOnline);

// Export the state manager for direct usage
export default StateManager; 