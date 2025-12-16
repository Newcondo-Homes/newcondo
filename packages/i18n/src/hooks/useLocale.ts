import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LocaleCode,
  LocaleConfig,
  DEFAULT_LOCALE,
  LOCALE_CONFIG,
  getAvailableLocales,
  getLocaleConfig,
  isRTL,
} from '../config/locales';

/**
 * Locale change callback type
 */
export type LocaleChangeCallback = (locale: LocaleCode) => void | Promise<void>;

/**
 * Locale context interface
 */
export interface LocaleContext {
  locale: LocaleCode;
  localeConfig: LocaleConfig;
  availableLocales: LocaleConfig[];
  isRTL: boolean;
  changeLocale: (locale: LocaleCode) => Promise<void>;
  resetLocale: () => Promise<void>;
}

/**
 * Hook for managing locale/language state
 * 
 * @returns Locale management utilities
 * 
 * @example
 * ```tsx
 * const { locale, changeLocale, availableLocales } = useLocale();
 * 
 * <select value={locale} onChange={(e) => changeLocale(e.target.value)}>
 *   {availableLocales.map(loc => (
 *     <option key={loc.code} value={loc.code}>{loc.name}</option>
 *   ))}
 * </select>
 * ```
 */
export const useLocale = (): LocaleContext => {
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState<LocaleCode>(() => {
    return (i18n.language as LocaleCode) || DEFAULT_LOCALE;
  });

  // Update locale state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLocale(lng as LocaleCode);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  /**
   * Change the current locale
   */
  const changeLocale = useCallback(async (newLocale: LocaleCode) => {
    try {
      await i18n.changeLanguage(newLocale);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', newLocale);
      }
      
      // Update document direction for RTL support
      if (typeof document !== 'undefined') {
        document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr';
        document.documentElement.lang = newLocale;
      }
      
      // Trigger custom event for other parts of the app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('localeChanged', { 
          detail: { locale: newLocale } 
        }));
      }
    } catch (error) {
      console.error('Failed to change locale:', error);
      throw error;
    }
  }, [i18n]);

  /**
   * Reset to default locale
   */
  const resetLocale = useCallback(async () => {
    await changeLocale(DEFAULT_LOCALE);
  }, [changeLocale]);

  // Get current locale configuration
  const localeConfig = getLocaleConfig(locale);
  
  // Get all available locales
  const availableLocales = getAvailableLocales();
  
  // Check if current locale is RTL
  const isCurrentRTL = isRTL(locale);

  return {
    locale,
    localeConfig,
    availableLocales,
    isRTL: isCurrentRTL,
    changeLocale,
    resetLocale,
  };
};

/**
 * Hook to listen for locale changes
 * 
 * @param callback - Function to call when locale changes
 * 
 * @example
 * ```tsx
 * useLocaleChange((newLocale) => {
 *   console.log('Locale changed to:', newLocale);
 *   // Reload data, update analytics, etc.
 * });
 * ```
 */
export const useLocaleChange = (callback: LocaleChangeCallback) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleLanguageChange = async (lng: string) => {
      await callback(lng as LocaleCode);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, callback]);
};

/**
 * Hook to get locale-specific direction (LTR/RTL)
 * 
 * @returns Current text direction
 */
export const useDirection = (): 'ltr' | 'rtl' => {
  const { isRTL: isRightToLeft } = useLocale();
  return isRightToLeft ? 'rtl' : 'ltr';
};

/**
 * Hook to get all locale configurations
 * 
 * @returns All locale configurations
 */
export const useAllLocales = () => {
  return {
    locales: LOCALE_CONFIG,
    availableLocales: getAvailableLocales(),
    defaultLocale: DEFAULT_LOCALE,
  };
};