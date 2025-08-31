import { useState, useEffect } from 'react';
import { SupportedLanguage, LocaleConfig } from '../types/translation';
import { translationService } from '../services/TranslationService';

export interface UseTranslationReturn {
  t: (key: string, options?: Record<string, string | number>) => string;
  currentLanguage: SupportedLanguage;
  availableLanguages: LocaleConfig[];
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  isRTL: boolean;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatNumber: (numberValue: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function useTranslation(): UseTranslationReturn {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    translationService.getCurrentLanguage()
  );
  const [isRTL, setIsRTL] = useState<boolean>(translationService.isRTL());

  useEffect(() => {
    // Update state when language changes
    setCurrentLanguage(translationService.getCurrentLanguage());
    setIsRTL(translationService.isRTL());
  }, []);

  const setLanguage = async (language: SupportedLanguage): Promise<void> => {
    await translationService.setLanguage(language);
    setCurrentLanguage(language);
    setIsRTL(translationService.isRTL());
  };

  const t = (key: string, options?: Record<string, string | number>): string => {
    return translationService.translate(key, options);
  };

  return {
    t,
    currentLanguage,
    availableLanguages: translationService.getAvailableLanguages(),
    setLanguage,
    isRTL,
    formatDate: translationService.formatDate.bind(translationService),
    formatTime: translationService.formatTime.bind(translationService),
    formatNumber: translationService.formatNumber.bind(translationService),
    formatCurrency: translationService.formatCurrency.bind(translationService)
  };
}
