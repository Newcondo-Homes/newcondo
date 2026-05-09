import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';
import { getOptions, fallbackLng, languages } from './translations';

/**
 * Server-side i18n initialization
 * Creates a new instance for each request to avoid state sharing
 */
async function initI18next(lng: string, ns: string | string[]) {
  const i18nInstance = createInstance();

  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`@newcondo/i18n/src/locales/${language}/${namespace}.json`)
      )
    )
    .init({
      ...getOptions(),
      lng,
      ns,
      preload: languages,
    });

  return i18nInstance;
}

/**
 * Get translation function for server components
 * @param lng - Language code
 * @param ns - Namespace (default: 'common')
 * @param options - Additional options
 */
export async function getServerTranslation(
  lng: string = fallbackLng,
  ns: string | string[] = 'common',
  options: { keyPrefix?: string } = {}
) {
  // Validate language
  const validLng = (languages as readonly string[]).includes(lng) ? lng : fallbackLng;

  const i18nextInstance = await initI18next(validLng, ns);

  return {
    t: i18nextInstance.getFixedT(
      validLng,
      (Array.isArray(ns) ? ns[0] : ns) as any ?? null,
      options.keyPrefix
    ),
    i18n: i18nextInstance,
  };
}

/**
 * Translate on server side
 * Convenience function for quick server-side translations
 */
export async function translateServer(
  key: string,
  lng: string = fallbackLng,
  ns: string = 'common',
  options?: any
) {
  const { t } = await getServerTranslation(lng, ns);
  return t(key, options);
}

/**
 * Get all translations for a namespace
 * Useful for pre-loading translations on the client
 */
export async function getNamespaceTranslations(
  lng: string = fallbackLng,
  ns: string = 'common'
) {
  const validLng = (languages as readonly string[]).includes(lng) ? lng : fallbackLng;

  try {
    const translations = await import(
      `@newcondo/i18n/locales/${validLng}/${ns}.json`
    );
    return translations.default || translations;
  } catch (error) {
    console.error(`Failed to load translations for ${validLng}/${ns}:`, error);

    // Fallback to default language
    if (validLng !== fallbackLng) {
      try {
        const fallbackTranslations = await import(
          `@newcondo/i18n/locales/${fallbackLng}/${ns}.json`
        );
        return fallbackTranslations.default || fallbackTranslations;
      } catch (fallbackError) {
        console.error(
          `Failed to load fallback translations for ${fallbackLng}/${ns}:`,
          fallbackError
        );
        return {}
      }
    }

    return {};
  }
}

/**
 * Get multiple namespace translations at once
 */
export async function getMultipleNamespaceTranslations(
  lng: string = fallbackLng,
  namespaces: string[] = ['common']
) {
  const translations: Record<string, any> = {};

  await Promise.all(
    namespaces.map(async (ns) => {
      translations[ns] = await getNamespaceTranslations(lng, ns);
    })
  );

  return translations;
}

/**
 * Check if translations exist for a language
 */
export async function hasTranslations(lng: string, ns: string = 'common'): Promise<boolean> {
  try {
    await import(`./locales/${lng}/${ns}.json`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get available namespaces for a language
 */
//TODO: 
// This would need to be dynamically generated based on available files
// For now, return common namespaces. see function signature below.
// export function getAvailableNamespaces(lng: string = fallbackLng): string[] {

export function getAvailableNamespaces(): string[] {
  return [
    'common',
    'auth',
    'properties',
    'payments',
    'profile',
    'referrals',
    'admin',
    'errors',
    'validation',
  ];
}

/**
 * Preload translations for specific languages and namespaces
 * Useful for optimizing initial page load
 */
export async function preloadTranslations(
  languages: string[],
  namespaces: string[]
) {
  const preloadPromises = languages.flatMap((lng) =>
    namespaces.map((ns) => getNamespaceTranslations(lng, ns))
  );

  await Promise.all(preloadPromises);
}

/**
 * Get translation with fallback
 * If key doesn't exist, return the key itself or a default value
 */
export async function getTranslationWithFallback(
  key: string,
  lng: string = fallbackLng,
  ns: string = 'common',
  defaultValue?: string
): Promise<string> {
  const { t } = await getServerTranslation(lng, ns);
  const translation = t(key);

  // If translation equals the key, it wasn't found
  if (translation === key) {
    return defaultValue || key;
  }

  return translation;
}