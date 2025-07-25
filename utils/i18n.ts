import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Import translation resources
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

// Get device language
const getDeviceLanguage = (): string => {
  let locale = 'en';
  
  if (Platform.OS === 'ios') {
    locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
             NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 
             'en';
  } else {
    locale = NativeModules.I18nManager?.localeIdentifier || 'en';
  }
  
  // Extract language code (e.g., 'en-US' -> 'en')
  return locale.split('-')[0];
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // React Native doesn't support Suspense yet
    },
    
    // Mobile-specific options
    compatibilityJSON: 'v4', // Updated to v4
  });

// Set initial language
const initializeLanguage = async () => {
  try {
    // Check if user has set a language preference
    const savedLanguage = await AsyncStorage.getItem('user_language');
    if (savedLanguage && Object.keys(resources).includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
      return;
    }
    
    // Use device language if available in our resources
    const deviceLanguage = getDeviceLanguage();
    const supportedLanguage = Object.keys(resources).includes(deviceLanguage) 
      ? deviceLanguage 
      : 'en';
    
    await i18n.changeLanguage(supportedLanguage);
  } catch (error) {
    console.error('Error initializing language:', error);
    // Fallback to English
    await i18n.changeLanguage('en');
  }
};

// Initialize language on startup
initializeLanguage();

// Export language utilities
export const changeLanguage = async (language: string) => {
  try {
    if (!isLanguageSupported(language)) {
      console.warn(`Language ${language} is not supported`);
      return;
    }
    
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user_language', language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export const getSupportedLanguages = (): string[] => {
  return Object.keys(resources);
};

export const isLanguageSupported = (language: string): boolean => {
  return Object.keys(resources).includes(language);
};

export default i18n; 