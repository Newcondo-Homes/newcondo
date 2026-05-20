import { Request, Response, NextFunction } from 'express';
import {i18next} from '@newcondo/i18n/client';
import Backend from '@newcondo/i18n';
import { join } from 'path';

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'fr', 'pcm'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Extend Express Request to include locale and i18n
declare global {
  namespace Express {
    interface Request {
      locale: SupportedLocale;
      t: typeof i18next.t;
    }
  }
}

/**
 * Initialize i18next with backend loading
 */
export async function initI18n(): Promise<void> {
  const backendInstance = typeof Backend === 'function' ? new (Backend as any)() : Backend;

  await i18next.use(backendInstance).init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    preload: [...SUPPORTED_LOCALES],
    ns: ['errors', 'notifications', 'email', 'sms'],
    defaultNS: 'errors',
    backend: {
      loadPath: join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    interpolation: {
      escapeValue: false, // React/templates handle escaping
    },
    saveMissing: false,
    missingKeyHandler: (lngs, ns, key) => {
      console.warn(`Missing translation key: ${key} in namespace: ${ns} for languages: ${lngs.join(', ')}`);
    },
  });
}

/**
 * Detect locale from various sources
 */
function detectLocale(req: Request): SupportedLocale {
  // 1. Check query parameter (?lang=fr)
  if (req.query.lang && typeof req.query.lang === 'string') {
    const queryLang = req.query.lang.toLowerCase() as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(queryLang)) {
      return queryLang;
    }
  }

  // 2. Check custom header (X-Locale)
  const headerLocale = req.headers['x-locale'] as string;
  if (headerLocale) {
    const locale = headerLocale.toLowerCase() as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(locale)) {
      return locale;
    }
  }

  // 3. Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase().split('-')[0]);

    for (const lang of languages) {
      if (SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
        return lang as SupportedLocale;
      }
    }
  }

  // 4. Check user preferences from JWT token (if authenticated)
  if (req.user && 'preferredLocale' in req.user) {
    const userLocale = (req.user as any).preferredLocale as string;
    if (userLocale && SUPPORTED_LOCALES.includes(userLocale as SupportedLocale)) {
      return userLocale as SupportedLocale;
    }
  }

  // 5. Default locale
  return DEFAULT_LOCALE;
}

/**
 * i18n middleware for Express
 * Attaches locale and translation function to request
 */
export function i18nMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure i18next is initialized
      if (!i18next.isInitialized) {
        await initI18n();
      }

      // Detect and set locale
      const locale = detectLocale(req);
      req.locale = locale;

      // Create a translation function bound to the detected locale
      req.t = i18next.getFixedT(locale);

      // Set locale in response header for client reference
      res.setHeader('Content-Language', locale);

      next();
    } catch (error) {
      console.error('i18n middleware error:', error);
      // Fall back to default locale on error
      req.locale = DEFAULT_LOCALE;
      req.t = i18next.getFixedT(DEFAULT_LOCALE);
      next();
    }
  };
}

/**
 * Get translation for a specific locale
 * Useful for background jobs, email templates, etc.
 */
export function getTranslation(locale: SupportedLocale = DEFAULT_LOCALE) {
  return i18next.getFixedT(locale);
}

/**
 * Change locale dynamically
 */
export async function changeLocale(locale: SupportedLocale): Promise<void> {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  await i18next.changeLanguage(locale);
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): readonly SupportedLocale[] {
  return SUPPORTED_LOCALES;
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}