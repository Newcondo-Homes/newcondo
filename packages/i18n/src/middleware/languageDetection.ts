import acceptLanguage from 'accept-language-parser';
import {
  LocaleCode,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isLocaleSupported,
  getBestMatchingLocale,
} from '../config/locales';

/**
 * Language detection sources
 */
export interface LanguageDetectionSources {
  cookie?: string;
  queryParam?: string;
  header?: string;
  localStorage?: string;
  navigator?: string[];
}

/**
 * Language detection options
 */
export interface LanguageDetectionOptions {
  cookieName?: string;
  queryParamName?: string;
  fallbackLocale?: LocaleCode;
  supportedLocales?: LocaleCode[];
}

/**
 * Detect preferred language from multiple sources
 * Priority: Query Param > Cookie > LocalStorage > Accept-Language Header > Navigator > Default
 * 
 * @param sources - Language detection sources
 * @param options - Detection options
 * @returns Detected locale code
 * 
 * @example
 * ```ts
 * // Server-side (Next.js middleware)
 * const locale = detectLanguage({
 *   cookie: request.cookies.get('locale')?.value,
 *   header: request.headers.get('accept-language'),
 * });
 * 
 * // Client-side
 * const locale = detectLanguage({
 *   localStorage: localStorage.getItem('locale'),
 *   navigator: navigator.languages,
 * });
 * ```
 */
export const detectLanguage = (
  sources: LanguageDetectionSources,
  options: LanguageDetectionOptions = {}
): LocaleCode => {
  const {
    fallbackLocale = DEFAULT_LOCALE,
    supportedLocales = SUPPORTED_LOCALES,
  } = options;

  // 1. Check query parameter (highest priority)
  if (sources.queryParam && isLocaleSupported(sources.queryParam)) {
    return sources.queryParam as LocaleCode;
  }

  // 2. Check cookie
  if (sources.cookie && isLocaleSupported(sources.cookie)) {
    return sources.cookie as LocaleCode;
  }

  // 3. Check localStorage
  if (sources.localStorage && isLocaleSupported(sources.localStorage)) {
    return sources.localStorage as LocaleCode;
  }

  // 4. Check Accept-Language header
  if (sources.header) {
    const headerLocale = parseAcceptLanguage(sources.header, supportedLocales);
    if (headerLocale) {
      return headerLocale;
    }
  }

  // 5. Check navigator languages
  if (sources.navigator && sources.navigator.length > 0) {
    const navigatorLocale = getBestMatchingLocale(sources.navigator);
    if (navigatorLocale) {
      return navigatorLocale;
    }
  }

  // 6. Fallback to default
  return fallbackLocale;
};

/**
 * Parse Accept-Language header and return best matching locale
 * 
 * @param acceptLanguageHeader - Accept-Language header value
 * @param supportedLocales - List of supported locales
 * @returns Best matching locale or null
 */
export const parseAcceptLanguage = (
  acceptLanguageHeader: string | null,
  supportedLocales: LocaleCode[] = SUPPORTED_LOCALES
): LocaleCode | null => {
  if (!acceptLanguageHeader) return null;

  try {
    const languages = acceptLanguage.parse(acceptLanguageHeader);
    
    // Sort by quality factor (q)
    languages.sort((a, b) => (b.quality || 1) - (a.quality || 1));

    // Find first matching supported locale
    for (const lang of languages) {
      const code = lang.code.toLowerCase();
      
      // Exact match
      if (supportedLocales.includes(code as LocaleCode)) {
        return code as LocaleCode;
      }

      // Language-only match (e.g., 'en' from 'en-US')
      const langOnly = code.split('-')[0];
      if (supportedLocales.includes(langOnly as LocaleCode)) {
        return langOnly as LocaleCode;
      }
    }
  } catch (error) {
    console.error('Failed to parse Accept-Language header:', error);
  }

  return null;
};

/**
 * Get preferred locale from browser (client-side only)
 * 
 * @returns Detected locale code
 */
export const getPreferredLocale = (): LocaleCode => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  return detectLanguage({
    queryParam: new URLSearchParams(window.location.search).get('lang') || undefined,
    cookie: document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1],
    localStorage: localStorage.getItem('locale') || undefined,
    navigator: Array.from(navigator.languages),
  });
};

/**
 * Set locale in browser storage
 * 
 * @param locale - Locale to set
 */
export const setLocaleInBrowser = (locale: LocaleCode): void => {
  if (typeof window === 'undefined') return;

  // Set in localStorage
  localStorage.setItem('locale', locale);

  // Set in cookie
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
  document.cookie = `locale=${locale}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

  // Update document attributes
  document.documentElement.lang = locale;
};

/**
 * Server-side language detection for Next.js
 * Use in middleware or getServerSideProps
 * 
 * @param request - Next.js request object
 * @returns Detected locale
 * 
 * @example
 * ```ts
 * // middleware.ts
 * import { NextRequest } from 'next/server';
 * 
 * export function middleware(request: NextRequest) {
 *   const locale = detectServerLocale(request);
 *   // Use locale for routing or response headers
 * }
 * ```
 */
export const detectServerLocale = (request: any): LocaleCode => {
  return detectLanguage({
    queryParam: request.nextUrl?.searchParams?.get('lang') || undefined,
    cookie: request.cookies?.get('locale')?.value,
    header: request.headers?.get('accept-language') || undefined,
  });
};

/**
 * Middleware factory for Next.js route handling
 * 
 * @param options - Detection options
 * @returns Middleware function
 */
export const createLocaleMiddleware = (options: LanguageDetectionOptions = {}) => {
  return (request: any) => {
    const locale = detectServerLocale(request);
    
    // Add locale to request for downstream use
    if (request.nextUrl) {
      request.nextUrl.searchParams.set('locale', locale);
    }
    
    return locale;
  };
};

/**
 * Extract locale from pathname
 * Useful for locale-based routing (e.g., /en/dashboard, /fr/dashboard)
 * 
 * @param pathname - URL pathname
 * @returns Extracted locale or null
 */
export const extractLocaleFromPathname = (pathname: string): LocaleCode | null => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isLocaleSupported(firstSegment)) {
    return firstSegment as LocaleCode;
  }
  
  return null;
};

/**
 * Build pathname with locale prefix
 * 
 * @param pathname - Original pathname
 * @param locale - Locale to add
 * @returns Pathname with locale prefix
 * 
 * @example
 * ```ts
 * buildLocalizedPathname('/dashboard', 'fr'); // '/fr/dashboard'
 * buildLocalizedPathname('/dashboard', 'en'); // '/dashboard' (if en is default)
 * ```
 */
export const buildLocalizedPathname = (
  pathname: string,
  locale: LocaleCode,
  includeDefaultLocale: boolean = false
): string => {
  // Remove existing locale prefix if present
  const withoutLocale = pathname.replace(/^\/(en|fr|pcm)(\/|$)/, '/');
  
  // Don't prefix default locale unless explicitly requested
  if (locale === DEFAULT_LOCALE && !includeDefaultLocale) {
    return withoutLocale;
  }
  
  // Add locale prefix
  return `/${locale}${withoutLocale}`;
};

/**
 * Check if pathname has locale prefix
 * 
 * @param pathname - URL pathname
 * @returns True if pathname has locale prefix
 */
export const hasLocalePrefix = (pathname: string): boolean => {
  return extractLocaleFromPathname(pathname) !== null;
};