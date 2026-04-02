import { useTranslation as useI18NextTranslation, UseTranslationOptions } from 'react-i18next';
import { Namespace, getNamespaceWithDependencies } from '../config/namespaces';
import { TFunction } from 'i18next';

/**
 * Translation key type for type safety
 */
export type TranslationKey = string;

/**
 * Interpolation options for translation variables
 */
export interface InterpolationOptions {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Translation function type
 */
export type TranslationFunction = (
  key: TranslationKey,
  options?: InterpolationOptions
) => string;

/**
 * Enhanced useTranslation hook result
 */
export interface UseTranslationResult {
  t: TFunction;
  i18n: any;
  ready: boolean;
  
  // Helper functions
  tSafe: (key: TranslationKey, fallback: string, options?: InterpolationOptions) => string;
  tPlural: (key: TranslationKey, count: number, options?: InterpolationOptions) => string;
  tArray: (keys: TranslationKey[], options?: InterpolationOptions) => string[];
  exists: (key: TranslationKey) => boolean;
}

/**
 * Enhanced useTranslation hook with additional utilities
 * 
 * @param namespace - Translation namespace to use
 * @param options - Additional i18next options
 * @returns Translation utilities and functions
 * 
 * @example
 * ```tsx
 * const { t, tSafe, tPlural } = useTranslation('common');
 * 
 * <h1>{t('welcome')}</h1>
 * <p>{t('greeting', { name: 'John' })}</p>
 * <span>{tPlural('item', 5)}</span>
 * ```
 */
export const useTranslation = (
  namespace: Namespace = 'common',
  options?: UseTranslationOptions<string>
): UseTranslationResult => {
  // Load namespace with its dependencies
  const namespacesWithDeps = getNamespaceWithDependencies(namespace);
  
  const { t, i18n, ready } = useI18NextTranslation(namespacesWithDeps, options);

  /**
   * Safe translation with fallback
   * Returns fallback text if translation is missing
   */
  const tSafe = (
    key: TranslationKey,
    fallback: string,
    options?: InterpolationOptions
  ): string => {
    const translation = t(key, options);
    return translation === key ? fallback : translation;
  };

  /**
   * Plural translation helper
   * Automatically handles pluralization based on count
   */
  const tPlural = (
    key: TranslationKey,
    count: number,
    options?: InterpolationOptions
  ): string => {
    return t(key, { count, ...options });
  };

  /**
   * Translate multiple keys at once
   * Useful for translating arrays of options
   */
  const tArray = (
    keys: TranslationKey[],
    options?: InterpolationOptions
  ): string[] => {
    return keys.map(key => t(key, options));
  };

  /**
   * Check if a translation key exists
   */
  const exists = (key: TranslationKey): boolean => {
    return i18n.exists(key, options as Record<string, unknown>);
  };

  return {
    t,
    i18n,
    ready,
    tSafe,
    tPlural,
    tArray,
    exists,
  };
};

/**
 * Hook for translating from multiple namespaces
 * 
 * @param namespaces - Array of namespaces to load
 * @returns Translation utilities
 * 
 * @example
 * ```tsx
 * const { t } = useTranslationMultiple(['common', 'auth']);
 * 
 * <h1>{t('common:welcome')}</h1>
 * <p>{t('auth:login.title')}</p>
 * ```
 */
export const useTranslationMultiple = (
  namespaces: Namespace[],
  options?: UseTranslationOptions<string>
) => {
  return useI18NextTranslation(namespaces, options);
};

/**
 * Hook to get raw translation without React binding
 * Useful for server-side or utility functions
 */
export const useTranslationRaw = (namespace: Namespace = 'common') => {
  const { i18n } = useI18NextTranslation(namespace);
  
  return {
    t: i18n.getFixedT(i18n.language, namespace),
    language: i18n.language,
  };
};