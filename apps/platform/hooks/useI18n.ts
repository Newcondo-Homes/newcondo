'use client';

import {  type CurrencyCode } from '@newcondo/i18n';
import { useTranslation }  from '@newcondo/i18n/hooks/useTranslation'

// TODO: when you correct translations bug, make sure to effect the changes in @newcondo/i18n and 
// uncomment the code below.
// import { 
//   languageMetadata,
//   type CurrencyCode, 
//   type Language,
//   type Namespace,
//   DEFAULT_CURRENCY,} from '@newcondo/i18n';

import { useCallback, useMemo } from 'react';
import { changeLanguage, getCurrentLanguage, getLanguageDirection } from '@/lib/i18n/client';
import { type Language, type Namespace,languageMetadata } from '@/lib/i18n/translations';
import { formatCurrency as formatCurrencyUtil, DEFAULT_CURRENCY } from '@/lib/utils/currency';

/**
 * Enhanced i18n hook with additional utilities
 */
export function useI18n(ns: Namespace | Namespace[] = 'common') {
  const { t, i18n, ready } = useTranslation(ns);
  
  const currentLanguage = useMemo(() => getCurrentLanguage() as Language, [i18n.language]);
  const direction = useMemo(() => getLanguageDirection(), [i18n.language]);
  const isRTL = useMemo(() => direction === 'rtl', [direction]);
  
  /**
   * Change language
   */
  const setLanguage = useCallback(async (lang: Language) => {
    await changeLanguage(lang);
  }, []);
  
  /**
   * Format currency with current locale
   */
  const formatLocaleCurrency = useCallback(
    (amount: number | string, currency: CurrencyCode = DEFAULT_CURRENCY) => {
      return formatCurrencyUtil(amount, currency, {locale: currentLanguage});
    },
    [currentLanguage]
  );
  
  /**
   * Format date with current locale
   */
  const formatLocaleDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
    },
    [currentLanguage]
  );
  
  /**
   * Format number with current locale
   */
  const formatLocaleNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(currentLanguage, options).format(value);
    },
    [currentLanguage]
  );
  
  /**
   * Format relative time
   */
  const formatRelativeTime = useCallback(
    (date: Date | string | number, baseDate: Date = new Date()) => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return t('common:time.justNow');
      }
      
      const rtf = new Intl.RelativeTimeFormat(currentLanguage, { numeric: 'auto' });
      
      const intervals = [
        { label: 'year' as Intl.RelativeTimeFormatUnit, seconds: 31536000 },
        { label: 'month' as Intl.RelativeTimeFormatUnit, seconds: 2592000 },
        { label: 'week' as Intl.RelativeTimeFormatUnit, seconds: 604800 },
        { label: 'day' as Intl.RelativeTimeFormatUnit, seconds: 86400 },
        { label: 'hour' as Intl.RelativeTimeFormatUnit, seconds: 3600 },
        { label: 'minute' as Intl.RelativeTimeFormatUnit, seconds: 60 },
      ];
      
      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count !== 0) {
          return rtf.format(-count, interval.label);
        }
      }
      
      return t('common:time.justNow');
    },
    [currentLanguage, t]
  );
  
  /**
   * Pluralization helper
   */
  const pluralize = useCallback(
    (count: number, key: string, options?: any) => {
      return t(key, { count, ...options });
    },
    [t]
  );
  
  /**
   * Get language metadata
   */
  const languageInfo = useMemo(
    () => languageMetadata[currentLanguage],
    [currentLanguage]
  );
  
  return {
    t,
    i18n,
    ready,
    language: currentLanguage,
    setLanguage,
    direction,
    isRTL,
    languageInfo,
    
    // Formatting utilities
    formatCurrency: formatLocaleCurrency,
    formatDate: formatLocaleDate,
    formatNumber: formatLocaleNumber,
    formatRelativeTime,
    pluralize,
  };
}

/**
 * Hook for language-specific formatting only
 */
export function useLocaleFormat() {
  const currentLanguage = getCurrentLanguage() as Language;
  
  const formatCurrency = useCallback(
    (amount: number | string, currency: CurrencyCode = DEFAULT_CURRENCY) => {
      return formatCurrencyUtil(amount, currency, { locale: currentLanguage });
    },
    [currentLanguage]
  );
  
  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' || typeof date === 'number' 
        ? new Date(date) 
        : date;
      
      return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
    },
    [currentLanguage]
  );
  
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(currentLanguage, options).format(value);
    },
    [currentLanguage]
  );
  
  return {
    formatCurrency,
    formatDate,
    formatNumber,
    language: currentLanguage,
  };
}

/**
 * Hook for translation with namespace support
 */
export function useNamespaceTranslation<T extends Namespace>(
  namespace: T
) {
  const { t, ready } = useTranslation(namespace);
  
  return {
    t: (key: string, options?: any) => t(`${namespace}:${key}`, options),
    ready,
  };
}

/**
 * Hook for multiple namespace translations
 */
export function useMultiNamespaceTranslation(namespaces: Namespace[]) {
  const { t, ready } = useTranslation(namespaces);
  
  return {
    t,
    ready,
  };
}

/**
 * Hook to check if translations are ready
 */
export function useTranslationReady(ns: Namespace | Namespace[] = 'common' ) {
  const { ready } = useTranslation(ns);
  return ready;
}

/**
 * Hook for language switcher
 */
export function useLanguageSwitcher() {
  const currentLanguage = getCurrentLanguage() as Language;
  
  const switchLanguage = useCallback(async (lang: Language) => {
    await changeLanguage(lang);
    
    // Reload page to apply language change
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);
  
  return {
    currentLanguage,
    switchLanguage,
    availableLanguages: Object.entries(languageMetadata).map(([code, info]) => ({
      code: code as Language,
      name: info.name,
      nativeName: info.nativeName,
      flag: info.flag,
    })),
  };
}

/**
 * Hook for RTL support
 */
export function useRTL() {
  const direction = getLanguageDirection();
  const isRTL = direction === 'rtl';
  
  return {
    direction,
    isRTL,
    directionClass: isRTL ? 'rtl' : 'ltr',
  };
}

/**
 * Hook for locale-aware list formatting
 */
export function useListFormat(type: 'conjunction' | 'disjunction' = 'conjunction') {
  const currentLanguage = getCurrentLanguage() as Language;
  
  const formatList = useCallback(
    (items: string[]) => {
      const formatter = new Intl.ListFormat(currentLanguage, {
        style: 'long',
        type,
      });
      
      return formatter.format(items);
    },
    [currentLanguage, type]
  );
  
  return formatList;
}

/**
 * Hook for translation with fallback
 */
export function useTranslationWithFallback(ns: Namespace = 'common') {
  const { t } = useTranslation(ns);
  
  const translate = useCallback(
    (key: string, fallback: string, options?: any) => {
      const translation = t(key, options);
      
      // If translation equals key, it wasn't found
      return translation === key ? fallback : translation;
    },
    [t]
  );
  
  return translate;
}

/**
 * Hook for safe translation (returns empty string if not found)
 */
export function useSafeTranslation(ns: Namespace = 'common') {
  const { t } = useTranslation(ns);
  
  const translate = useCallback(
    (key: string, options?: any) => {
      const translation = t(key, options);
      return translation === key ? '' : translation;
    },
    [t]
  );
  
  return translate;
}