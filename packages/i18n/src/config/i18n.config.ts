import i18n, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';
import { NAMESPACES } from './namespaces';

/**
 * Core i18next configuration
 */
export const i18nConfig: InitOptions = {
  // Fallback locale
  fallbackLng: DEFAULT_LOCALE,
  
  // Supported languages
  supportedLngs: SUPPORTED_LOCALES,
  
  // Default namespace
  defaultNS: 'common',
  
  // Available namespaces
  ns: NAMESPACES,
  
  // Debug mode (from environment)
  debug: process.env.NEXT_PUBLIC_I18N_DEBUG === 'true',
  
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
    formatSeparator: ',',
    format: (value, format, lng) => {
      // Custom formatters can be added here
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'lowercase') return value.toLowerCase();
      if (format === 'capitalize') {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return value;
    }
  },
  
  // React-specific options
  react: {
    useSuspense: false, // Set to false for Next.js compatibility
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'b', 'span'],
  },
  
  // Detection options (browser only)
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    lookupQuerystring: 'lang',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'i18nextLng',
    caches: ['localStorage', 'cookie'],
    cookieMinutes: 10080, // 1 week
    cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
  },
  
  // Backend options
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/add/{{lng}}/{{ns}}',
    // Use custom backend URL if provided
    ...(process.env.NEXT_PUBLIC_I18N_BACKEND_URL && {
      loadPath: `${process.env.NEXT_PUBLIC_I18N_BACKEND_URL}/{{lng}}/{{ns}}.json`,
    }),
  },
  
  // Load strategy
  load: 'languageOnly', // Only load 'en' not 'en-US'
  
  // Prevent namespace conflicts
  keySeparator: '.',
  nsSeparator: ':',
  
  // Pluralization
  pluralSeparator: '_',
  contextSeparator: '_',
  
  // Missing key handling
  saveMissing: process.env.NEXT_PUBLIC_I18N_DEBUG === 'true',
  missingKeyHandler: (lngs, ns, key) => {
    if (process.env.NEXT_PUBLIC_I18N_DEBUG === 'true') {
      console.warn(`Missing translation key: ${ns}:${key} for languages:`, lngs);
    }
  },
  
  // Return empty string for missing keys instead of key
  returnEmptyString: false,
  returnNull: false,
  
  // Performance optimization
  ...(process.env.NEXT_PUBLIC_I18N_CACHE_ENABLED === 'true' && {
    cache: {
      enabled: true,
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }),
};

/**
 * Initialize i18next instance
 * Can be called on both client and server
 */
export const initI18n = async (serverLocale?: string) => {
  // Don't initialize if already initialized
  if (i18n.isInitialized) {
    if (serverLocale && i18n.language !== serverLocale) {
      await i18n.changeLanguage(serverLocale);
    }
    return i18n;
  }

  // Determine if we're in browser or server
  const isBrowser = typeof window !== 'undefined';

  // Configure plugins based on environment
  const plugins = [initReactI18next];
  
  if (isBrowser) {
    // Browser-only plugins
    plugins.push(Backend, LanguageDetector);
  }

  // Initialize with plugins
  await i18n.use(...plugins).init({
    ...i18nConfig,
    lng: serverLocale || DEFAULT_LOCALE,
  });

  // Set up event listeners for debugging
  if (process.env.NEXT_PUBLIC_I18N_DEBUG === 'true') {
    i18n.on('languageChanged', (lng) => {
      console.log('[i18n] Language changed to:', lng);
    });
    
    i18n.on('loaded', (loaded) => {
      console.log('[i18n] Loaded namespaces:', loaded);
    });
    
    i18n.on('failedLoading', (lng, ns, msg) => {
      console.error('[i18n] Failed to load:', { lng, ns, msg });
    });
  }

  return i18n;
};

/**
 * Get current i18n instance
 */
export const getI18n = () => i18n;

/**
 * Check if i18n is initialized
 */
export const isI18nInitialized = () => i18n.isInitialized;

export default i18n;