// apps/admin/src/lib/utils/dateUtils.ts

/**
 * Date manipulation and formatting utilities
 */

/**
 * Get start of day
 */
export const startOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of week (Monday)
 */
export const startOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of week (Sunday)
 */
export const endOfWeek = (date: Date = new Date()): Date => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of month
 */
export const startOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of month
 */
export const endOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of year
 */
export const startOfYear = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of year
 */
export const endOfYear = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Add hours to date
 */
export const addHours = (date: Date, hours: number): Date => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
};

/**
 * Add minutes to date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

/**
 * Subtract days from date
 */
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

/**
 * Get difference in days between two dates
 */
export const diffInDays = (date1: Date, date2: Date): number => {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Get difference in hours between two dates
 */
export const diffInHours = (date1: Date, date2: Date): number => {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diff / (1000 * 60 * 60));
};

/**
 * Get difference in minutes between two dates
 */
export const diffInMinutes = (date1: Date, date2: Date): number => {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diff / (1000 * 60));
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = subtractDays(new Date(), 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Check if date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date.getTime() > new Date().getTime();
};

/**
 * Check if date is within a range
 */
export const isWithinRange = (date: Date, start: Date, end: Date): boolean => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

/**
 * Get date range for filter
 */
export const getDateRange = (
  filter: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'all'
): { start: Date; end: Date } | null => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
      
    case 'yesterday':
      const yesterday = subtractDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };
      
    case 'last_7_days':
      return {
        start: startOfDay(subtractDays(now, 7)),
        end: endOfDay(now),
      };
      
    case 'last_30_days':
      return {
        start: startOfDay(subtractDays(now, 30)),
        end: endOfDay(now),
      };
      
    case 'this_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
      
    case 'last_month':
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
      
    case 'all':
    default:
      return null;
  }
};

/**
 * Format date to ISO string for API
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse ISO string to date
 */
export const fromISOString = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Get time remaining until a date
 */
export const getTimeRemaining = (targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} => {
  const total = targetDate.getTime() - new Date().getTime();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
  };
};

/**
 * Check if date has expired (is in the past)
 */
export const hasExpired = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isPast(dateObj);
};

/**
 * Get expiry status
 */
export const getExpiryStatus = (
  expiryDate: Date | string | null | undefined
): 'expired' | 'expiring_soon' | 'valid' => {
  if (!expiryDate) return 'valid';
  
  const dateObj = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  
  if (isPast(dateObj)) {
    return 'expired';
  }
  
  const daysUntilExpiry = diffInDays(dateObj, new Date());
  if (daysUntilExpiry <= 7) {
    return 'expiring_soon';
  }
  
  return 'valid';
};

/**
 * Format time ago (e.g., "2 hours ago")
 */
export const timeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return 'Just now';
};

/**
 * Get business days between two dates (excluding weekends)
 */
export const getBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Check if date is a weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Get next business day
 */
export const getNextBusinessDay = (date: Date): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

/**
 * Get week number of the year
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Get quarter of the year (1-4)
 */
export const getQuarter = (date: Date): number => {
  return Math.floor(date.getMonth() / 3) + 1;
};