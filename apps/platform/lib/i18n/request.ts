import { cookies, headers } from 'next/headers';
import { fallbackLng, languages } from './translations';
import { getRequestConfig } from 'next-intl/server';
import { NAMESPACES } from '@newcondo/i18n';


/**
 * Language detection for Next.js 15 App Router
 * Extracts language from cookies, headers, or URL
 */

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'en';

  const messages = Object.fromEntries(
    await Promise.all(
      NAMESPACES.map(async (namespace) => {
        const module = await import(`@newcondo/i18n/locales/${locale}/${namespace}.json`);
        return [namespace, module.default];
      })
    )
  );

  return { locale, messages };
});

/**
 * Get language from cookie
 */
async function getLanguageFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const i18nextCookie = cookieStore.get('i18next');
    return i18nextCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Get language from Accept-Language header
 */
async function getLanguageFromHeader(): Promise<string | null> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (!acceptLanguage) return null;

    // Parse Accept-Language header
    // Format: "en-US,en;q=0.9,fr;q=0.8"
    const languages = acceptLanguage
      .split(',')
      .map((lang: string) => {
        const [code, qValue] = lang.trim().split(';');
        const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
        return { code: code.split('-')[0].toLowerCase(), quality };
      })
      .sort((a, b) => b.quality - a.quality);

    return languages[0]?.code || null;
  } catch {
    return null;
  }
}

/**
 * Get language from pathname
 * For locale-based routing: /en/dashboard, /fr/properties
 */
function getLanguageFromPathname(pathname?: string): string | null {
  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);
  const potentialLang = segments[0];

  if ((languages as readonly string[]).includes(potentialLang)) {
    return potentialLang;
  }

  return null;
}

/**
 * Detect language from request
 * Priority: Cookie > Pathname > Accept-Language Header > Fallback
 */
export async function detectLanguage(pathname?: string): Promise<string> {
  // 1. Check cookie
  const cookieLang = await getLanguageFromCookie();
  if (cookieLang && (languages as readonly string[]).includes(cookieLang)) {
    return cookieLang;
  }

  // 2. Check pathname (for locale-based routing)
  const pathLang = getLanguageFromPathname(pathname);
  if (pathLang && (languages as readonly string[]).includes(pathLang)) {
    return pathLang;
  }

  // 3. Check Accept-Language header
  const headerLang = await getLanguageFromHeader();
  if (headerLang && (languages as readonly string[]).includes(headerLang)) {
    return headerLang;
  }

  // 4. Fallback to default
  return fallbackLng;
}

/**
 * Set language cookie
 * Used for persisting user's language preference
 */
export async function setLanguageCookie(lang: string) {
  if (!(languages as readonly string[]).includes(lang)) {
    console.warn(`Attempted to set unsupported language: ${lang}`);
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set('i18next', lang, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Get current language from request
 * Convenience function that combines detection and validation
 */
export async function getCurrentLanguage(pathname?: string): Promise<string> {
  return detectLanguage(pathname);
}

/**
 * Check if current request is in a specific language
 */
export async function isCurrentLanguage(lang: string, pathname?: string): Promise<boolean> {
  return (await getCurrentLanguage(pathname)) === lang;
}

/**
 * Get language direction for current request
 */
export async function getRequestLanguageDirection(pathname?: string): Promise<'ltr' | 'rtl'> {
  const lang = await getCurrentLanguage(pathname);
  const rtlLanguages = ['ar', 'he']; // Arabic, Hebrew
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
}


/**
 * Validate and normalize language code
 */
export function normalizeLanguageCode(lang: string): string {
  const normalizedLang = lang.toLowerCase().split('-')[0];
  return (languages as readonly string[]).includes(normalizedLang) ? normalizedLang : fallbackLng;
}

export {
  extractLocaleFromPathname,
  buildPathnameWithLocale,
  getAlternateLanguageUrls
} from './request.utils';