import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'fr', 'pcm'] as const; // English, French, Nigerian Pidgin
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  pcm: 'Pidgin',
};

// RTL languages (none currently, but structure ready)
export const rtlLocales: Locale[] = [];

// Currency by locale
export const localeCurrency: Record<Locale, string> = {
  en: 'NGN',
  fr: 'NGN',
  pcm: 'NGN',
};

// Number format by locale
export const localeNumberFormat: Record<Locale, Intl.NumberFormatOptions> = {
  en: {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  },
  fr: {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  },
  pcm: {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  },
};

// Date format by locale
export const localeDateFormat: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  fr: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  pcm: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Africa/Lagos',
    now: new Date(),
  };
});