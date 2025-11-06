// apps/admin/src/lib/utils/dateFormatter.ts

import { format, parseISO, formatDistanceToNow, isValid, differenceInDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy',
  LONG_DATE: 'MMMM d, yyyy',
  FULL_DATE: 'EEEE, MMMM d, yyyy',
  SHORT_DATETIME: 'MMM d, yyyy h:mm a',
  LONG_DATETIME: 'MMMM d, yyyy h:mm:ss a',
  TIME_ONLY: 'h:mm a',
  TIME_24H: 'HH:mm',
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  YEAR_MONTH: 'yyyy-MM',
  MONTH_DAY: 'MMM d',
  DAY_MONTH_YEAR: 'dd/MM/yyyy',
} as const;

/**
 * Format date using common patterns
 */
export const formatDate = (
  date: Date | string,
  formatPattern: keyof typeof DATE_FORMATS = 'SHORT_DATE'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, DATE_FORMATS[formatPattern]);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date with custom pattern
 */
export const formatCustomDate = (
  date: Date | string,
  pattern: string
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return format(dateObj, pattern);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid date';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  formatPattern: keyof typeof DATE_FORMATS = 'SHORT_DATE'
): string => {
  const start = formatDate(startDate, formatPattern);
  const end = formatDate(endDate, formatPattern);
  return `${start} - ${end}`;
};

/**
 * Get date range for period
 */
export const getDateRangeForPeriod = (
  period: 'today' | 'week' | 'month' | 'year' | 'custom',
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } => {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      return { start: startOfDay(now), end: endOfDay(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
};

/**
 * Format time duration
 */
export const formatDuration = (
  startDate: Date | string,
  endDate: Date | string
): string => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  const days = differenceInDays(end, start);
  
  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''}`;
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
};

/**
 * Check if date is in the future
 */
export const isDateInFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
};

/**
 * Format timestamp
 */
export const formatTimestamp = (date: Date | string): string => {
  return formatDate(date, 'LONG_DATETIME');
};

/**
 * Get time of day greeting
 */
export const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Format month and year
 */
export const formatMonthYear = (date: Date | string): string => {
  return formatDate(date, 'YEAR_MONTH');
};

/**
 * Get month name
 */
export const getMonthName = (date: Date | string, short: boolean = false): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, short ? 'MMM' : 'MMMM');
};

/**
 * Get day name
 */
export const getDayName = (date: Date | string, short: boolean = false): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, short ? 'EEE' : 'EEEE');
};

/**
 * Format date for chart labels
 */
export const formatChartDate = (
  date: Date | string,
  granularity: 'day' | 'week' | 'month' | 'year'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  switch (granularity) {
    case 'day':
      return format(dateObj, 'MMM d');
    case 'week':
      return format(dateObj, "'Week of' MMM d");
    case 'month':
      return format(dateObj, 'MMM yyyy');
    case 'year':
      return format(dateObj, 'yyyy');
    default:
      return format(dateObj, 'MMM d');
  }
};

/**
 * Format expiry date with status
 */
export const formatExpiryStatus = (expiryDate: Date | string): {
  formatted: string;
  status: 'expired' | 'expiring_soon' | 'active';
  daysRemaining: number;
} => {
  const dateObj = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const now = new Date();
  const daysRemaining = differenceInDays(dateObj, now);
  
  let status: 'expired' | 'expiring_soon' | 'active';
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= 7) {
    status = 'expiring_soon';
  } else {
    status = 'active';
  }
  
  return {
    formatted: formatDate(dateObj, 'SHORT_DATE'),
    status,
    daysRemaining: Math.max(0, daysRemaining),
  };
};