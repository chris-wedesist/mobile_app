import { useTranslation as useI18nTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages, isLanguageSupported } from '@/utils/i18n';

/**
 * Custom hook for translation with additional utilities
 * Provides easy access to translations and language management
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * Translate a key with optional parameters
   * @param key - Translation key (e.g., 'common.welcome')
   * @param params - Optional parameters for interpolation
   * @returns Translated string
   */
  const translate = (key: string, params?: Record<string, any>): string => {
    return t(key, params);
  };

  /**
   * Change the current language
   * @param language - Language code (e.g., 'en', 'es', 'fr')
   */
  const switchLanguage = async (language: string) => {
    if (isLanguageSupported(language)) {
      await changeLanguage(language);
    } else {
      console.warn(`Language ${language} is not supported`);
    }
  };

  /**
   * Get current language code
   * @returns Current language code
   */
  const getLanguage = (): string => {
    return getCurrentLanguage();
  };

  /**
   * Get list of supported languages
   * @returns Array of supported language codes
   */
  const getLanguages = (): string[] => {
    return getSupportedLanguages();
  };

  /**
   * Check if a language is supported
   * @param language - Language code to check
   * @returns True if language is supported
   */
  const isSupported = (language: string): boolean => {
    return isLanguageSupported(language);
  };

  /**
   * Get language display name
   * @param language - Language code
   * @returns Display name for the language
   */
  const getLanguageName = (language: string): string => {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
    };
    return languageNames[language] || language;
  };

  return {
    t: translate,
    i18n,
    switchLanguage,
    getLanguage,
    getLanguages,
    isSupported,
    getLanguageName,
    currentLanguage: getCurrentLanguage(),
    supportedLanguages: getSupportedLanguages(),
  };
};

export default useTranslation; 