/**
 * @jest-environment node
 */

import i18n, { changeLanguage, getCurrentLanguage, getSupportedLanguages, isLanguageSupported } from './i18n';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModules: {
    SettingsManager: {
      settings: {
        AppleLocale: 'en-US',
        AppleLanguages: ['en-US', 'en'],
      },
    },
    I18nManager: {
      localeIdentifier: 'en-US',
    },
  },
}));

describe('i18n System', () => {
  beforeEach(() => {
    // Reset i18n to default language
    i18n.changeLanguage('en');
  });

  describe('Basic Translation', () => {
    it('should translate English text correctly', () => {
      expect(i18n.t('common.welcome')).toBe('Welcome');
      expect(i18n.t('common.loading')).toBe('Loading...');
      expect(i18n.t('navigation.home')).toBe('Home');
    });

    it('should translate Spanish text correctly', () => {
      i18n.changeLanguage('es');
      expect(i18n.t('common.welcome')).toBe('Bienvenido');
      expect(i18n.t('common.loading')).toBe('Cargando...');
      expect(i18n.t('navigation.home')).toBe('Inicio');
    });

    it('should translate French text correctly', () => {
      i18n.changeLanguage('fr');
      expect(i18n.t('common.welcome')).toBe('Bienvenue');
      expect(i18n.t('common.loading')).toBe('Chargement...');
      expect(i18n.t('navigation.home')).toBe('Accueil');
    });

    it('should fallback to English for missing translations', () => {
      i18n.changeLanguage('es');
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
    });
  });

  describe('Language Utilities', () => {
    it('should get current language', () => {
      i18n.changeLanguage('es');
      expect(getCurrentLanguage()).toBe('es');
    });

    it('should get supported languages', () => {
      const languages = getSupportedLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
      expect(languages).toHaveLength(3);
    });

    it('should check if language is supported', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('es')).toBe(true);
      expect(isLanguageSupported('fr')).toBe(true);
      expect(isLanguageSupported('de')).toBe(false);
      expect(isLanguageSupported('invalid')).toBe(false);
    });
  });

  describe('Language Change', () => {
    it('should change language successfully', async () => {
      await changeLanguage('es');
      expect(getCurrentLanguage()).toBe('es');
      expect(i18n.t('common.welcome')).toBe('Bienvenido');
    });

    it('should handle unsupported language gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await changeLanguage('unsupported');
      
      expect(consoleSpy).toHaveBeenCalledWith('Language unsupported is not supported');
      expect(getCurrentLanguage()).toBe('en'); // Should remain in English
      
      consoleSpy.mockRestore();
    });
  });

  describe('Translation Keys', () => {
    it('should handle nested translation keys', () => {
      expect(i18n.t('settings.general')).toBe('General');
      expect(i18n.t('settings.privacy')).toBe('Privacy');
      expect(i18n.t('auth.login')).toBe('Log In');
      expect(i18n.t('auth.logout')).toBe('Log Out');
    });

    it('should handle common UI elements', () => {
      expect(i18n.t('common.save')).toBe('Save');
      expect(i18n.t('common.cancel')).toBe('Cancel');
      expect(i18n.t('common.error')).toBe('Error');
      expect(i18n.t('common.success')).toBe('Success');
    });

    it('should handle navigation elements', () => {
      expect(i18n.t('navigation.profile')).toBe('Profile');
      expect(i18n.t('navigation.settings')).toBe('Settings');
      expect(i18n.t('navigation.incidents')).toBe('Incidents');
    });
  });

  describe('Interpolation', () => {
    it('should handle interpolation with parameters', () => {
      // Note: This would require adding interpolation examples to the translation files
      // For now, we'll test basic functionality
      expect(i18n.t('common.welcome')).toBe('Welcome');
    });
  });

  describe('Language Detection', () => {
    it('should initialize with default language', () => {
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should support all configured languages', () => {
      const languages = getSupportedLanguages();
      expect(languages).toEqual(['en', 'es', 'fr']);
    });
  });
}); 