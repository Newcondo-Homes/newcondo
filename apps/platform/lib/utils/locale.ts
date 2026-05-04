import {
  languages,
  fallbackLng,
  languageMetadata,
  type Language,
} from '../i18n/translations';

// Remove getUserLocale and setUserLocale from here entirely
// Keep everything else unchanged below

export function getLocaleDisplayName(locale: Language, inLocale?: Language): string {
  const targetLocale = inLocale || locale;
  try {
    const displayNames = new Intl.DisplayNames([targetLocale], { type: 'language' });
    return displayNames.of(locale) || languageMetadata[locale].name;
  } catch {
    return languageMetadata[locale].name;
  }
}

export function getNativeLocaleName(locale: Language): string {
  return languageMetadata[locale].nativeName;
}

export function detectLocaleFromHeader(acceptLanguage: string): Language {
  if (!acceptLanguage) return fallbackLng;
  const preferredLanguages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      const langCode = code.split('-')[0].toLowerCase();
      return { code: langCode, quality };
    })
    .sort((a, b) => b.quality - a.quality);
  for (const { code } of preferredLanguages) {
    if (languages.includes(code as Language)) {
      return code as Language;
    }
  }
  return fallbackLng;
}

export function getTextDirection(locale: Language): 'ltr' | 'rtl' {
  return languageMetadata[locale].direction;
}

export function isRTLLocale(locale: Language): boolean {
  return getTextDirection(locale) === 'rtl';
}

export function getTimeFormat(locale: Language): '12h' | '24h' {
  return languageMetadata[locale].timeFormat;
}

export function getLocaleDateFormat(locale: Language): string {
  return languageMetadata[locale].dateFormat;
}

export function formatLocaleDate(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric', ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

export function formatLocaleTime(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date) : date;
  const timeFormat = getTimeFormat(locale);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', minute: 'numeric', hour12: timeFormat === '12h', ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

export function formatLocaleDateTime(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date) : date;
  const timeFormat = getTimeFormat(locale);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: timeFormat === '12h', ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

export function formatRelativeLocaleTime(
  date: Date | string | number,
  locale: Language,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date) : date;
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const intervals: Array<{ label: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (Math.abs(count) > 0) return rtf.format(-count, interval.label);
  }
  return rtf.format(0, 'second');
}

export function getLocaleFlag(locale: Language): string {
  return languageMetadata[locale].flag;
}

export function isValidLocale(locale: string): locale is Language {
  return languages.includes(locale as Language);
}

export function normalizeLocale(locale: string): Language {
  const normalized = locale.toLowerCase().split('-')[0];
  return isValidLocale(normalized) ? normalized : fallbackLng;
}

export function getAvailableLocales() {
  return languages.map((locale) => ({
    code: locale,
    name: languageMetadata[locale].name,
    nativeName: languageMetadata[locale].nativeName,
    flag: languageMetadata[locale].flag,
    direction: languageMetadata[locale].direction,
  }));
}

export function formatLocaleList(
  items: string[],
  locale: Language,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
}

export function compareLocales(a: Language, b: Language): number {
  return languageMetadata[a].name.localeCompare(languageMetadata[b].name);
}

export function getLocaleByRegion(region: string): Language {
  const regionLocaleMap: Record<string, Language> = {
    NG: 'en',
    FR: 'fr',
  };
  return regionLocaleMap[region.toUpperCase()] || fallbackLng;
}