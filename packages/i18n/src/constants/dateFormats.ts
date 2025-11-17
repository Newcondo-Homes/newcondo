export type DateFormatKey = 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'full' 
  | 'time' 
  | 'dateTime' 
  | 'monthYear'
  | 'dayMonth';

export type DateFormatOptions = Intl.DateTimeFormatOptions;

/**
 * Predefined date format configurations
 */
export const DATE_FORMATS: Record<DateFormatKey, DateFormatOptions> = {
  // Short format: 11/14/25
  short: {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
  },
  
  // Medium format: Nov 14, 2025
  medium: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  
  // Long format: November 14, 2025 at 3:45 PM
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
  
  // Full format: Friday, November 14, 2025 at 3:45:30 PM WAT
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  },
  
  // Time only: 3:45 PM
  time: {
    hour: 'numeric',
    minute: 'numeric',
  },
  
  // Date and time: 11/14/2025, 3:45 PM
  dateTime: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
  
  // Month and year: November 2025
  monthYear: {
    year: 'numeric',
    month: 'long',
  },
  
  // Day and month: Nov 14
  dayMonth: {
    month: 'short',
    day: 'numeric',
  },
};

/**
 * Default date format
 */
export const DEFAULT_DATE_FORMAT: DateFormatKey = 'medium';

/**
 * Time zones for different regions
 */
export const TIME_ZONES = {
  NIGERIA: 'Africa/Lagos', // West Africa Time (WAT)
  UTC: 'UTC',
  NEW_YORK: 'America/New_York',
  LONDON: 'Europe/London',
  PARIS: 'Europe/Paris',
} as const;

/**
 * Default time zone for the platform
 */
export const DEFAULT_TIME_ZONE = TIME_ZONES.NIGERIA;

/**
 * Week start day (0 = Sunday, 1 = Monday, etc.)
 */
export const WEEK_START_DAY = 1; // Monday

/**
 * First day of week for different locales
 */
export const LOCALE_WEEK_START: Record<string, number> = {
  'en-NG': 1, // Monday
  'en-US': 0, // Sunday
  'fr-FR': 1, // Monday
  'en-GB': 1, // Monday
};

/**
 * Get date format options by key
 * @param key - Format key
 * @returns Date format options
 */
export function getDateFormat(key: DateFormatKey): DateFormatOptions {
  return DATE_FORMATS[key] || DATE_FORMATS.medium;
}