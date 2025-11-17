/**
 * RTL (Right-to-Left) language support utilities
 */

import { Locale } from '../types/locale.types';

// Languages that use RTL text direction
const RTL_LANGUAGES: string[] = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a locale uses RTL text direction
 */
export function isRTL(locale: Locale): boolean {
  const langCode = locale.split('-')[0];
  return RTL_LANGUAGES.includes(langCode);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get CSS direction property value
 */
export function getDirectionStyle(locale: Locale): React.CSSProperties {
  return {
    direction: getTextDirection(locale),
  };
}

/**
 * Get alignment class based on locale
 */
export function getAlignmentClass(
  locale: Locale,
  defaultAlign: 'left' | 'right' | 'center' = 'left'
): string {
  if (defaultAlign === 'center') {
    return 'text-center';
  }

  const isRTLLang = isRTL(locale);

  if (defaultAlign === 'left') {
    return isRTLLang ? 'text-right' : 'text-left';
  }

  return isRTLLang ? 'text-left' : 'text-right';
}

/**
 * Get flexbox direction class based on locale
 */
export function getFlexDirectionClass(
  locale: Locale,
  reverse: boolean = false
): string {
  const isRTLLang = isRTL(locale);
  
  if (reverse) {
    return isRTLLang ? 'flex-row' : 'flex-row-reverse';
  }

  return isRTLLang ? 'flex-row-reverse' : 'flex-row';
}

/**
 * Get appropriate margin/padding direction
 */
export function getSpacingDirection(
  locale: Locale,
  side: 'start' | 'end'
): 'left' | 'right' {
  const isRTLLang = isRTL(locale);

  if (side === 'start') {
    return isRTLLang ? 'right' : 'left';
  }

  return isRTLLang ? 'left' : 'right';
}

/**
 * Convert logical properties to physical properties
 */
export function convertLogicalToPhysical(
  locale: Locale,
  logicalProperty: 'margin-start' | 'margin-end' | 'padding-start' | 'padding-end' | 'border-start' | 'border-end'
): string {
  const isRTLLang = isRTL(locale);
  const [property, side] = logicalProperty.split('-');

  if (side === 'start') {
    return `${property}-${isRTLLang ? 'right' : 'left'}`;
  }

  return `${property}-${isRTLLang ? 'left' : 'right'}`;
}

/**
 * Get icon rotation for RTL
 */
export function getIconRotation(locale: Locale, iconType: 'arrow' | 'chevron' = 'arrow'): number {
  // Rotate directional icons 180 degrees for RTL
  return isRTL(locale) ? 180 : 0;
}

/**
 * Mirror coordinate for RTL layouts
 */
export function mirrorCoordinate(locale: Locale, x: number, containerWidth: number): number {
  if (!isRTL(locale)) {
    return x;
  }
  return containerWidth - x;
}

/**
 * Get appropriate transform for RTL
 */
export function getRTLTransform(locale: Locale, shouldMirror: boolean = true): string {
  if (!shouldMirror || !isRTL(locale)) {
    return '';
  }
  return 'scaleX(-1)';
}

/**
 * Apply RTL-aware sorting
 */
export function sortForLocale<T>(
  items: T[],
  locale: Locale,
  compareFn: (a: T, b: T) => number
): T[] {
  const sorted = [...items].sort(compareFn);
  
  // For RTL languages, you might want to reverse certain UI elements
  // but not necessarily the data itself. This depends on context.
  return sorted;
}