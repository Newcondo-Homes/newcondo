// src/i18n/utils/translator.ts

import { TFunction } from '@newcondo/i18n';
import { SupportedLocale, DEFAULT_LOCALE } from '@newcondo/i18n';
import { i18next } from "@newcondo/i18n/client";

/**
 * Translator class for managing translations
 */
export class Translator {
  private locale: SupportedLocale;
  private t: TFunction;

  constructor(locale: SupportedLocale = DEFAULT_LOCALE) {
    this.locale = locale;
    this.t = i18next.getFixedT(locale);
  }

  /**
   * Translate a key with optional interpolation
   */
  translate(key: string, options?: Record<string, any>): string {
    // FIXED: Cast return value to string or pass string constraint to t()
    return this.t(key, options) as string;
  }

  /**
   * Translate error messages
   */
  translateError(errorKey: string, options?: Record<string, any>): string {
    // FIXED: Added <string> generic constraint
    return this.t(`errors.${errorKey}`, options) as string;
  }

  /**
   * Translate notification messages
   */
  translateNotification(notificationKey: string, options?: Record<string, any>): string {
    // FIXED: Added <string> generic constraint
    return this.t(`notifications.${notificationKey}`, options) as string;
  }

  /**
   * Translate email content
   */
  translateEmail(emailKey: string, options?: Record<string, any>): string {
    // FIXED: Added <string> generic constraint
    return this.t(`email.${emailKey}`, options) as string;
  }

  /**
   * Translate SMS content
   */
  translateSMS(smsKey: string, options?: Record<string, any>): string {
    // FIXED: Added <string> generic constraint
    return this.t(`sms.${smsKey}`, options) as string;
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.locale;
  }

  /**
   * Change locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.t = i18next.getFixedT(locale);
  }

  /**
   * Check if translation key exists
   */
  exists(key: string): boolean {
    return i18next.exists(key, { lng: this.locale });
  }
}

/**
 * Create a translator instance for a specific locale
 */
export function createTranslator(locale: SupportedLocale = DEFAULT_LOCALE): Translator {
  return new Translator(locale);
}

/**
 * Translate with automatic locale detection from request
 */
export function translateForRequest(req: any, key: string, options?: Record<string, any>): string {
  const locale = req.locale || DEFAULT_LOCALE;
  const translator = createTranslator(locale);
  return translator.translate(key, options);
}

/**
 * Batch translate multiple keys
 */
export function batchTranslate(
  locale: SupportedLocale,
  keys: string[],
  options?: Record<string, any>
): Record<string, string> {
  const translator = createTranslator(locale);
  const translations: Record<string, string> = {};

  for (const key of keys) {
    translations[key] = translator.translate(key, options);
  }

  return translations;
}

/**
 * Get translation with fallback
 */
export function translateWithFallback(
  locale: SupportedLocale,
  key: string,
  fallback: string,
  options?: Record<string, any>
): string {
  const translator = createTranslator(locale);
  
  if (translator.exists(key)) {
    return translator.translate(key, options);
  }

  return fallback;
}

/**
 * Translate enum values
 */
export function translateEnum<T extends string>(
  locale: SupportedLocale,
  enumKey: string,
  value: T
): string {
  const translator = createTranslator(locale);
  const key = `enums.${enumKey}.${value}`;
  
  if (translator.exists(key)) {
    return translator.translate(key);
  }

  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Pluralization helper
 */
export function translatePlural(
  locale: SupportedLocale,
  key: string,
  count: number,
  options?: Record<string, any>
): string {
  const translator = createTranslator(locale);
  return translator.translate(key, { ...options, count });
}

/**
 * Date formatting with locale
 */
export function formatDate(locale: SupportedLocale, date: Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = 
    format === 'short'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Time formatting with locale
 */
export function formatTime(locale: SupportedLocale, date: Date, includeSeconds: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };

  return new Intl.DateTimeFormat(locale, { ...options, hour12: false }).format(date);
}

/**
 * Relative time formatting
 */
export function formatRelativeTime(
  locale: SupportedLocale,
  date: Date,
  baseDate: Date = new Date()
): string {
  const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (absDiff < 60) {
    value = diffInSeconds;
    unit = 'second';
  } else if (absDiff < 3600) {
    value = Math.floor(diffInSeconds / 60);
    unit = 'minute';
  } else if (absDiff < 86400) {
    value = Math.floor(diffInSeconds / 3600);
    unit = 'hour';
  } else if (absDiff < 2592000) {
    value = Math.floor(diffInSeconds / 86400);
    unit = 'day';
  } else if (absDiff < 31536000) {
    value = Math.floor(diffInSeconds / 2592000);
    unit = 'month';
  } else {
    value = Math.floor(diffInSeconds / 31536000);
    unit = 'year';
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(value, unit);
}