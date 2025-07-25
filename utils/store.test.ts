/**
 * @jest-environment node
 */
import { useStore } from './store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useStore.setState({
      user: null,
      theme: 'light',
      language: 'en',
    });
  });

  describe('User State', () => {
    it('should set user correctly', () => {
      const testUser = { id: '1', name: 'Test User' };
      useStore.getState().setUser(testUser);
      
      expect(useStore.getState().user).toEqual(testUser);
    });

    it('should clear user correctly', () => {
      // First set a user
      useStore.getState().setUser({ id: '1', name: 'Test User' });
      expect(useStore.getState().user).not.toBeNull();
      
      // Then clear user
      useStore.getState().clearUser();
      expect(useStore.getState().user).toBeNull();
    });
  });

  describe('Theme State', () => {
    it('should set theme correctly', () => {
      useStore.getState().setTheme('dark');
      expect(useStore.getState().theme).toBe('dark');
    });

    it('should toggle theme correctly', () => {
      // Start with light theme
      expect(useStore.getState().theme).toBe('light');
      
      // Toggle to dark
      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('dark');
      
      // Toggle back to light
      useStore.getState().toggleTheme();
      expect(useStore.getState().theme).toBe('light');
    });
  });

  describe('Language State', () => {
    it('should set language correctly', () => {
      useStore.getState().setLanguage('es');
      expect(useStore.getState().language).toBe('es');
    });

    it('should support multiple languages', () => {
      const languages = ['en', 'es', 'fr'] as const;
      
      languages.forEach(lang => {
        useStore.getState().setLanguage(lang);
        expect(useStore.getState().language).toBe(lang);
      });
    });
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.theme).toBe('light');
      expect(state.language).toBe('en');
    });
  });
}); 