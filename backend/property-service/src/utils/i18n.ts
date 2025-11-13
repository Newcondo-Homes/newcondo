// backend/property-service/src/utils/i18n.ts

import i18n from '../../../shared/src/i18n/config/i18n.config';

/**
 * Get translation for a given key
 */
export function getTranslation(key: string, locale: string = 'en', options?: any): string {
  return i18n.t(key, { ...options, lng: locale });
}

/**
 * Get property status translation
 */
export function getPropertyStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `property.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get property type translation
 */
export function getPropertyTypeTranslation(type: string, locale: string = 'en'): string {
  const typeKey = `property.type.${type.toLowerCase()}`;
  return getTranslation(typeKey, locale);
}

/**
 * Get approval status translation
 */
export function getApprovalStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `property.approval.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get boundary verification status
 */
export function getBoundaryStatusTranslation(verified: boolean, locale: string = 'en'): string {
  return verified
    ? getTranslation('property.boundary.verified', locale)
    : getTranslation('property.boundary.not_verified', locale);
}

/**
 * Get property structure translation
 */
export function getPropertyStructureTranslation(structure: string, locale: string = 'en'): string {
  const structureKey = `property.structure.${structure.toLowerCase()}`;
  return getTranslation(structureKey, locale);
}

/**
 * Get unit status translation
 */
export function getUnitStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `property.unit.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Format property address with locale
 */
export function formatPropertyAddress(
  address: string,
  city: string,
  state: string,
  country: string,
  locale: string = 'en'
): string {
  // Different locales may have different address formats
  const formats: Record<string, string> = {
    en: `${address}, ${city}, ${state}, ${country}`,
    fr: `${address}, ${city}, ${state}, ${country}`,
    pcm: `${address}, ${city}, ${state}, ${country}`
  };

  return formats[locale] || formats['en'];
}

/**
 * Get property amenities translations
 */
export function getAmenitiesTranslations(amenities: string[], locale: string = 'en'): string[] {
  return amenities.map(amenity => {
    const key = `property.amenities.${amenity.toLowerCase().replace(/\s+/g, '_')}`;
    return getTranslation(key, locale);
  });
}

/**
 * Get property listing message
 */
export function getPropertyListingMessage(
  action: 'created' | 'updated' | 'deleted' | 'published',
  locale: string = 'en'
): string {
  return getTranslation(`property.${action}`, locale);
}

/**
 * Get duplicate property message
 */
export function getDuplicatePropertyMessage(locale: string = 'en'): string {
  return getTranslation('property.duplicate_detected', locale);
}

/**
 * Get boundary marking instructions
 */
export function getBoundaryInstructions(locale: string = 'en'): string {
  return getTranslation('property.boundary.instructions', locale);
}

/**
 * Format property availability message
 */
export function getAvailabilityMessage(
  isAvailable: boolean,
  availableFrom?: Date,
  locale: string = 'en'
): string {
  if (!isAvailable) {
    return getTranslation('property.not_available', locale);
  }

  if (availableFrom && availableFrom > new Date()) {
    return getTranslation('property.available_from', locale, {
      date: availableFrom.toLocaleDateString(locale === 'pcm' ? 'en-NG' : locale)
    });
  }

  return getTranslation('property.available_now', locale);
}

/**
 * Get property verification requirements
 */
export function getVerificationRequirements(locale: string = 'en'): string[] {
  return [
    getTranslation('property.verification.requirement_1', locale),
    getTranslation('property.verification.requirement_2', locale),
    getTranslation('property.verification.requirement_3', locale),
    getTranslation('property.verification.requirement_4', locale)
  ];
}