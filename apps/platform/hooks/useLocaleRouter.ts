'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { type Language, languages, fallbackLng } from '@/lib/i18n/translations';
import { getCurrentLanguage } from '@/lib/i18n/client';

/**
 * Hook for locale-aware routing
 */
export function useLocaleRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLanguage = getCurrentLanguage() as Language;
  
  /**
   * Extract locale from pathname
   */
  const extractLocale = useCallback((path: string): {
    locale: Language;
    pathnameWithoutLocale: string;
  } => {
    const segments = path.split('/').filter(Boolean);
    const potentialLocale = segments[0];
    
    if (languages.includes(potentialLocale as Language)) {
      return {
        locale: potentialLocale as Language,
        pathnameWithoutLocale: '/' + segments.slice(1).join('/'),
      };
    }
    
    return {
      locale: fallbackLng,
      pathnameWithoutLocale: path,
    };
  }, []);
  
  /**
   * Build path with locale
   */
  const buildPathWithLocale = useCallback((
    path: string,
    locale: Language = currentLanguage
  ): string => {
    const { pathnameWithoutLocale } = extractLocale(path);
    
    // Don't add locale prefix if it's the fallback language
    if (locale === fallbackLng) {
      return pathnameWithoutLocale || '/';
    }
    
    return `/${locale}${pathnameWithoutLocale || ''}`;
  }, [currentLanguage, extractLocale]);
  
  /**
   * Navigate to path with current locale
   */
  const push = useCallback((
    path: string,
    options?: { scroll?: boolean; locale?: Language }
  ) => {
    const locale = options?.locale || currentLanguage;
    const localizedPath = buildPathWithLocale(path, locale);
    
    router.push(localizedPath, { scroll: options?.scroll });
  }, [router, currentLanguage, buildPathWithLocale]);
  
  /**
   * Replace current path with locale
   */
  const replace = useCallback((
    path: string,
    options?: { scroll?: boolean; locale?: Language }
  ) => {
    const locale = options?.locale || currentLanguage;
    const localizedPath = buildPathWithLocale(path, locale);
    
    router.replace(localizedPath, { scroll: options?.scroll });
  }, [router, currentLanguage, buildPathWithLocale]);
  
  /**
   * Navigate back
   */
  const back = useCallback(() => {
    router.back();
  }, [router]);
  
  /**
   * Navigate forward
   */
  const forward = useCallback(() => {
    router.forward();
  }, [router]);
  
  /**
   * Refresh current route
   */
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);
  
  /**
   * Prefetch route with locale
   */
  const prefetch = useCallback((
    path: string,
    locale: Language = currentLanguage
  ) => {
    const localizedPath = buildPathWithLocale(path, locale);
    router.prefetch(localizedPath);
  }, [router, currentLanguage, buildPathWithLocale]);
  
  /**
   * Switch language and stay on same page
   */
  const switchLanguage = useCallback((newLocale: Language) => {
    const { pathnameWithoutLocale } = extractLocale(pathname);
    const newPath = buildPathWithLocale(pathnameWithoutLocale, newLocale);
    
    // Preserve search params
    const params = searchParams.toString();
    const fullPath = params ? `${newPath}?${params}` : newPath;
    
    router.push(fullPath);
  }, [pathname, searchParams, router, extractLocale, buildPathWithLocale]);
  
  /**
   * Get localized path for a route
   */
  const getLocalizedPath = useCallback((
    path: string,
    locale?: Language
  ): string => {
    return buildPathWithLocale(path, locale || currentLanguage);
  }, [currentLanguage, buildPathWithLocale]);
  
  /**
   * Get alternate language paths
   */
  const getAlternatePaths = useCallback((): Array<{
    language: Language;
    path: string;
  }> => {
    const { pathnameWithoutLocale } = extractLocale(pathname);
    
    return languages.map((lang) => ({
      language: lang,
      path: buildPathWithLocale(pathnameWithoutLocale, lang),
    }));
  }, [pathname, extractLocale, buildPathWithLocale]);
  
  /**
   * Check if current route is active
   */
  const isActive = useCallback((path: string): boolean => {
    const { pathnameWithoutLocale } = extractLocale(pathname);
    const { pathnameWithoutLocale: targetPath } = extractLocale(path);
    
    return pathnameWithoutLocale === targetPath;
  }, [pathname, extractLocale]);
  
  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
    switchLanguage,
    getLocalizedPath,
    getAlternatePaths,
    isActive,
    pathname,
    currentLanguage,
  };
}

/**
 * Hook for building locale-aware links
 */
export function useLocaleLink() {
  const currentLanguage = getCurrentLanguage() as Language;
  
  const buildLink = useCallback((
    path: string,
    locale: Language = currentLanguage
  ): string => {
    if (locale === fallbackLng) {
      return path;
    }
    
    return `/${locale}${path}`;
  }, [currentLanguage]);
  
  return buildLink;
}

/**
 * Hook for pathname without locale
 */
export function usePathnameWithoutLocale() {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (languages.includes(potentialLocale as Language)) {
    return '/' + segments.slice(1).join('/');
  }
  
  return pathname;
}

/**
 * Hook for locale from pathname
 */
export function useLocaleFromPathname(): Language {
  const pathname = usePathname();
  
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (languages.includes(potentialLocale as Language)) {
    return potentialLocale as Language;
  }
  
  return fallbackLng;
}