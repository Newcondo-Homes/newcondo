import { cookies, headers } from 'next/headers';
import { fallbackLng, languages } from './translations';

/**
 * Language detection for Next.js 15 App Router
 * Extracts language from cookies, headers, or URL
 */

/**
 * Get language from cookie
 */
function getLanguageFromCookie(): string | null {
  try {
    const cookieStore = cookies();
    const i18nextCookie = cookieStore.get('i18next');
    return i18nextCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Get language from Accept-Language header
 */
function getLanguageFromHeader(): string | null {
  try {
    const headersList = headers();
    const acceptLanguage = headersList.get('accept-language');
    
    if (!acceptLanguage) return null;
    
    // Parse Accept-Language header
    // Format: "en-US,en;q=0.9,fr;q=0.8"
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
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
  
  if (languages.includes(potentialLang)) {
    return potentialLang;
  }
  
  return null;
}

/**
 * Detect language from request
 * Priority: Cookie > Pathname > Accept-Language Header > Fallback
 */
export function detectLanguage(pathname?: string): string {
  // 1. Check cookie
  const cookieLang = getLanguageFromCookie();
  if (cookieLang && languages.includes(cookieLang)) {
    return cookieLang;
  }
  
  // 2. Check pathname (for locale-based routing)
  const pathLang = getLanguageFromPathname(pathname);
  if (pathLang && languages.includes(pathLang)) {
    return pathLang;
  }
  
  // 3. Check Accept-Language header
  const headerLang = getLanguageFromHeader();
  if (headerLang && languages.includes(headerLang)) {
    return headerLang;
  }
  
  // 4. Fallback to default
  return fallbackLng;
}

/**
 * Set language cookie
 * Used for persisting user's language preference
 */
export function setLanguageCookie(lang: string) {
  if (!languages.includes(lang)) {
    console.warn(`Attempted to set unsupported language: ${lang}`);
    return;
  }
  
  cookies().set('i18next', lang, {
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
export function getCurrentLanguage(pathname?: string): string {
  return detectLanguage(pathname);
}

/**
 * Check if current request is in a specific language
 */
export function isCurrentLanguage(lang: string, pathname?: string): boolean {
  return getCurrentLanguage(pathname) === lang;
}

/**
 * Get language direction for current request
 */
export function getRequestLanguageDirection(pathname?: string): 'ltr' | 'rtl' {
  const lang = getCurrentLanguage(pathname);
  const rtlLanguages = ['ar', 'he']; // Arabic, Hebrew
  return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
}

/**
 * Extract locale from pathname
 * Returns both the locale and the pathname without locale
 */
export function extractLocaleFromPathname(pathname: string): {
  locale: string;
  pathnameWithoutLocale: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (languages.includes(potentialLocale)) {
    return {
      locale: potentialLocale,
      pathnameWithoutLocale: '/' + segments.slice(1).join('/'),
    };
  }
  
  return {
    locale: fallbackLng,
    pathnameWithoutLocale: pathname,
  };
}

/**
 * Build pathname with locale
 */
export function buildPathnameWithLocale(
  pathname: string,
  locale: string
): string {
  // Remove existing locale from pathname
  const { pathnameWithoutLocale } = extractLocaleFromPathname(pathname);
  
  // Don't add locale if it's the fallback
  if (locale === fallbackLng) {
    return pathnameWithoutLocale || '/';
  }
  
  // Add locale prefix
  return `/${locale}${pathnameWithoutLocale || ''}`;
}

/**
 * Get alternate language URLs for SEO
 * Useful for hreflang tags
 */
export function getAlternateLanguageUrls(
  pathname: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Array<{ lang: string; url: string }> {
  const { pathnameWithoutLocale } = extractLocaleFromPathname(pathname);
  
  return languages.map((lang) => ({
    lang,
    url: `${baseUrl}${buildPathnameWithLocale(pathnameWithoutLocale, lang)}`,
  }));
}

/**
 * Validate and normalize language code
 */
export function normalizeLanguageCode(lang: string): string {
  const normalizedLang = lang.toLowerCase().split('-')[0];
  return languages.includes(normalizedLang) ? normalizedLang : fallbackLng;
}