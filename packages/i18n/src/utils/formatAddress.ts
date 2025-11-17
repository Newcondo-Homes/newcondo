/**
 * Format Nigerian addresses based on locale
 */

import { Locale } from '../types/locale.types';

export interface NigerianAddress {
  street?: string;
  area?: string;
  lga?: string;
  city: string;
  state: string;
  country?: string;
}

/**
 * Format full Nigerian address
 */
export function formatAddress(
  address: NigerianAddress,
  locale: Locale = 'en',
  includeCountry: boolean = false
): string {
  const parts: string[] = [];

  if (address.street) parts.push(address.street);
  if (address.area) parts.push(address.area);
  if (address.lga) parts.push(address.lga);
  parts.push(address.city);
  parts.push(address.state);
  if (includeCountry && address.country) parts.push(address.country);

  return parts.filter(Boolean).join(', ');
}

/**
 * Format short address (city, state)
 */
export function formatShortAddress(
  address: Pick<NigerianAddress, 'city' | 'state'>,
  locale: Locale = 'en'
): string {
  return `${address.city}, ${address.state}`;
}

/**
 * Format area with LGA
 */
export function formatAreaWithLGA(
  area: string,
  lga: string,
  locale: Locale = 'en'
): string {
  if (locale === 'pcm') {
    return `${area} for ${lga}`;
  }
  return `${area}, ${lga}`;
}

/**
 * Get state abbreviation
 */
export function getStateAbbreviation(state: string): string {
  const abbreviations: Record<string, string> = {
    Lagos: 'LAG',
    Abuja: 'FCT',
    'Rivers': 'RIV',
    'Oyo': 'OYO',
    'Kano': 'KAN',
    'Kaduna': 'KAD',
    'Ogun': 'OGN',
    'Enugu': 'ENU',
    'Delta': 'DEL',
    // Add more states as needed
  };

  return abbreviations[state] || state.substring(0, 3).toUpperCase();
}

/**
 * Format address for display in cards
 */
export function formatCardAddress(
  address: NigerianAddress,
  locale: Locale = 'en'
): string {
  if (address.area) {
    return `${address.area}, ${address.city}`;
  }
  return `${address.city}, ${address.state}`;
}

/**
 * Parse address string into components
 */
export function parseAddressString(addressString: string): Partial<NigerianAddress> {
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length < 2) {
    return { city: addressString };
  }

  const result: Partial<NigerianAddress> = {};
  
  // Last part is usually state or country
  const lastPart = parts[parts.length - 1];
  if (lastPart.toLowerCase() === 'nigeria') {
    result.country = lastPart;
    result.state = parts[parts.length - 2];
    parts.pop();
    parts.pop();
  } else {
    result.state = lastPart;
    parts.pop();
  }

  // Second to last is city
  if (parts.length > 0) {
    result.city = parts[parts.length - 1];
    parts.pop();
  }

  // Remaining parts are street, area, LGA
  if (parts.length > 0) {
    result.area = parts.join(', ');
  }

  return result;
}

/**
 * Validate Nigerian address components
 */
export function validateAddress(address: Partial<NigerianAddress>): boolean {
  return !!(address.city && address.state);
}

/**
 * Get full location string for property
 */
export function getPropertyLocation(
  address: NigerianAddress,
  locale: Locale = 'en'
): string {
  const parts: string[] = [];

  if (address.area) parts.push(address.area);
  if (address.lga && address.lga !== address.area) parts.push(address.lga);
  parts.push(address.city);

  if (locale === 'pcm') {
    return parts.join(' for ');
  }

  return parts.join(', ');
}