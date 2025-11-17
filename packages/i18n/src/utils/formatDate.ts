import { DATE_FORMATS, type DateFormatKey } from '../constants/dateFormats';

export interface FormatDateOptions {
  locale?: string;
  format?: DateFormatKey;
  timeZone?: string;
}

/**
 * Format a date based on locale and format type
 * @param date - Date to format (Date object, string, or timestamp)
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: FormatDateOptions = {}
): string {
  const {
    locale = 'en-NG',
    format = 'medium',
    timeZone = 'Africa/Lagos', // Nigerian time zone
  } = options;

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const formatOptions = DATE_FORMATS[format];

    return new Intl.DateTimeFormat(locale, {
      ...formatOptions,
      timeZone,
    }).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(date);
  }
}

/**
 * Format date with time
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = 'en-NG'
): string {
  return formatDate(date, { locale, format: 'long' });
}

/**
 * Format date as relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'en-NG'
): string {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    // Use Intl.RelativeTimeFormat for localized relative time
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(-diffInMinutes, 'minute');
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(-diffInHours, 'hour');
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(-diffInDays, 'day');
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return rtf.format(-diffInMonths, 'month');
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(-diffInYears, 'year');
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return String(date);
  }
}

/**
 * Format date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param locale - Locale code
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  locale: string = 'en-NG'
): string {
  const start = formatDate(startDate, { locale, format: 'short' });
  const end = formatDate(endDate, { locale, format: 'short' });
  
  return `${start} - ${end}`;
}

/**
 * Get time remaining until a date
 * @param targetDate - Target date
 * @param locale - Locale code
 * @returns Time remaining string
 */
export function getTimeRemaining(
  targetDate: Date | string | number,
  locale: string = 'en-NG'
): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const target = typeof targetDate === 'string' || typeof targetDate === 'number'
    ? new Date(targetDate)
    : targetDate;

  const now = new Date();
  const total = target.getTime() - now.getTime();

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  // Format the string based on what's most relevant
  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  };
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns Boolean indicating if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns Boolean indicating if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  return dateObj.getTime() < new Date().getTime();
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns Boolean indicating if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  return dateObj.getTime() > new Date().getTime();
}

/**
 * Add days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date | string | number, days: number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  
  return result;
}

/**
 * Add hours to a date
 * @param date - Base date
 * @param hours - Number of hours to add
 * @returns New date
 */
export function addHours(date: Date | string | number, hours: number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const result = new Date(dateObj);
  result.setHours(result.getHours() + hours);
  
  return result;
}

/**
 * Format time only (no date)
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  locale: string = 'en-NG'
): string {
  return formatDate(date, { locale, format: 'time' });
}