import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales for the admin dashboard
export const locales = ['en', 'fr', 'pcm'] as const; // English, French, Nigerian Pidgin
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale labels for the language switcher
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  pcm: 'Pidgin',
};

// Currency configuration per locale
export const localeCurrencies: Record<Locale, string> = {
  en: 'NGN',
  fr: 'NGN',
  pcm: 'NGN',
};

// Date format configuration per locale
export const localeDateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
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

// Number format configuration per locale
export const localeNumberFormats: Record
  Locale,
  Intl.NumberFormatOptions
> = {
  en: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  fr: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  pcm: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Africa/Lagos',
    now: new Date(),
  };
});