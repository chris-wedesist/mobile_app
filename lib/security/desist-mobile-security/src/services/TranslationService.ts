import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LocaleConfig, TranslationResource, TranslationService as ITranslationService } from '../types/translation';
import { en } from '../locales/en';
import { es } from '../locales/es';

const STORAGE_KEY = 'desist_app_language';

export class TranslationService implements ITranslationService {
  private currentLanguage: SupportedLanguage = 'en';
  private translations: Record<SupportedLanguage, TranslationResource>;
  private availableLanguages: LocaleConfig[] = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false, flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳' }
  ];

  constructor() {
    this.translations = {
      en,
      es,
      fr: en, // Fallback to English for now
      de: en, // Fallback to English for now
      pt: en, // Fallback to English for now
      zh: en, // Fallback to English for now
      ja: en, // Fallback to English for now
      ko: en, // Fallback to English for now
      ar: en, // Fallback to English for now
      hi: en  // Fallback to English for now
    };
    this.initializeLanguage();
  }

  private async initializeLanguage(): Promise<void> {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage as SupportedLanguage;
      }
    } catch (error) {
      console.warn('Failed to load saved language preference:', error);
    }
  }

  private isValidLanguage(language: string): boolean {
    return this.availableLanguages.some(lang => lang.code === language);
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    this.currentLanguage = language;
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  getAvailableLanguages(): LocaleConfig[] {
    return this.availableLanguages;
  }

  translate(key: string, options?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value === 'string') {
      // Simple interpolation
      if (options) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return options[param] || match;
        });
      }
      return value;
    }

    return key; // Return key if translation not found
  }

  isRTL(): boolean {
    const langConfig = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    return langConfig?.rtl || false;
  }

  formatDate(date: Date): string {
    const langConfig = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    const locale = langConfig ? `${langConfig.code}-${langConfig.code.toUpperCase()}` : 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  formatTime(date: Date): string {
    const langConfig = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    const locale = langConfig ? `${langConfig.code}-${langConfig.code.toUpperCase()}` : 'en-US';
    
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return date.toLocaleTimeString();
    }
  }

  formatNumber(numberValue: number): string {
    const langConfig = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    const locale = langConfig ? `${langConfig.code}-${langConfig.code.toUpperCase()}` : 'en-US';
    
    try {
      return new Intl.NumberFormat(locale).format(numberValue);
    } catch {
      return numberValue.toString();
    }
  }

  formatCurrency(amount: number, currency = 'USD'): string {
    const langConfig = this.availableLanguages.find(lang => lang.code === this.currentLanguage);
    const locale = langConfig ? `${langConfig.code}-${langConfig.code.toUpperCase()}` : 'en-US';
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();
