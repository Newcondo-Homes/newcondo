import { fallbackLng, languages } from './translations';

export function extractLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  if ((languages as readonly string[]).includes(potentialLocale)) {
    return {
      locale: potentialLocale,
      pathnameWithoutLocale: '/' + segments.slice(1).join('/'),
    };
  }

  return { locale: fallbackLng, pathnameWithoutLocale: pathname };
}

export function buildPathnameWithLocale(pathname: string, locale: string): string {
  const { pathnameWithoutLocale } = extractLocaleFromPathname(pathname);
  if (locale === fallbackLng) return pathnameWithoutLocale || '/';
  return `/${locale}${pathnameWithoutLocale || ''}`;
}

export function getAlternateLanguageUrls(
  pathname: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
) {
  const { pathnameWithoutLocale } = extractLocaleFromPathname(pathname);
  return (languages as readonly string[]).map((lang) => ({
    lang,
    url: `${baseUrl}${buildPathnameWithLocale(pathnameWithoutLocale, lang)}`,
  }));
}