/**
 * Pluralization utilities for different locales
 */

import { Locale } from '../types/locale.types';

type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Get plural form for English
 */
function getPluralFormEnglish(count: number): PluralForm {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
}

/**
 * Get plural form for Nigerian Pidgin (same as English)
 */
function getPluralFormPidgin(count: number): PluralForm {
  return getPluralFormEnglish(count);
}

/**
 * Get plural form for French
 */
function getPluralFormFrench(count: number): PluralForm {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
}

/**
 * Get the correct plural form for a count based on locale
 */
export function getPluralForm(count: number, locale: Locale): PluralForm {
  switch (locale) {
    case 'en':
      return getPluralFormEnglish(count);
    case 'pcm':
      return getPluralFormPidgin(count);
    case 'fr':
      return getPluralFormFrench(count);
    default:
      return getPluralFormEnglish(count);
  }
}

/**
 * Select the correct plural translation
 */
export function selectPlural(
  count: number,
  translations: Partial<Record<PluralForm, string>>,
  locale: Locale
): string {
  const form = getPluralForm(count, locale);
  
  // Try to get the specific form
  if (translations[form]) {
    return translations[form]!;
  }
  
  // Fallback to 'other' if specific form not available
  if (translations.other) {
    return translations.other;
  }
  
  // Last resort: return 'one' form or empty string
  return translations.one || '';
}

/**
 * Format a pluralized string with count
 */
export function formatPlural(
  count: number,
  translations: Partial<Record<PluralForm, string>>,
  locale: Locale,
  includeCount: boolean = true
): string {
  const translation = selectPlural(count, translations, locale);
  
  if (includeCount) {
    return translation.replace('{{count}}', count.toString());
  }
  
  return translation;
}

/**
 * Simple pluralization helper
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  locale: Locale = 'en'
): string {
  if (count === 1) {
    return singular;
  }
  
  return plural || `${singular}s`;
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(num: number, locale: Locale = 'en'): string {
  if (locale === 'fr') {
    // French ordinals
    if (num === 1) return 'er';
    return 'e';
  }

  // English ordinals
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Format ordinal number
 */
export function formatOrdinal(num: number, locale: Locale = 'en'): string {
  if (locale === 'pcm') {
    // Nigerian Pidgin doesn't typically use ordinals
    return `number ${num}`;
  }

  return `${num}${getOrdinalSuffix(num, locale)}`;
}

/**
 * Pluralization examples for different contexts
 */
export const pluralExamples = {
  properties: {
    one: '{{count}} property',
    other: '{{count}} properties',
  },
  bedrooms: {
    one: '{{count}} bedroom',
    other: '{{count}} bedrooms',
  },
  days: {
    one: '{{count}} day',
    other: '{{count}} days',
  },
  hours: {
    one: '{{count}} hour',
    other: '{{count}} hours',
  },
  minutes: {
    one: '{{count}} minute',
    other: '{{count}} minutes',
  },
  users: {
    zero: 'no users',
    one: '{{count}} user',
    other: '{{count}} users',
  },
  items: {
    zero: 'no items',
    one: '{{count}} item',
    other: '{{count}} items',
  },
};