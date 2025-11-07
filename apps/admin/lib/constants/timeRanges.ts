// apps/admin/src/lib/constants/timeRanges.ts

import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';

/**
 * Time range types
 */
export type TimeRangeType = 
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_14_days'
  | 'last_30_days'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom';

/**
 * Get date range for a given time range type
 */
export const getDateRangeForType = (
  type: TimeRangeType,
  customStart?: Date,
  customEnd?: Date
): { startDate: Date; endDate: Date } => {
  const now = new Date();

  switch (type) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };

    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };

    case 'last_7_days':
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now),
      };

    case 'last_14_days':
      return {
        startDate: startOfDay(subDays(now, 13)),
        endDate: endOfDay(now),
      };

    case 'last_30_days':
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now),
      };

    case 'this_week':
      return {
        startDate: startOfWeek(now),
        endDate: endOfWeek(now),
      };

    case 'last_week':
      const lastWeek = subWeeks(now, 1);
      return {
        startDate: startOfWeek(lastWeek),
        endDate: endOfWeek(lastWeek),
      };

    case 'this_month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };

    case 'this_quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };

    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter),
      };

    case 'this_year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };

    case 'last_year':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
      };

    case 'all_time':
      return {
        startDate: new Date('2024-01-01'), // Platform start date
        endDate: endOfDay(now),
      };

    case 'custom':
      if (customStart && customEnd) {
        return {
          startDate: startOfDay(customStart),
          endDate: endOfDay(customEnd),
        };
      }
      // Fallback to today if custom dates not provided
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };

    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
  }
};

/**
 * Time range options for dropdowns
 */
export const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_14_days', label: 'Last 14 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
] as const;

/**
 * Common time range presets
 */
export const COMMON_TIME_RANGES = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_30_DAYS: 'last_30_days',
  THIS_QUARTER: 'this_quarter',
  THIS_YEAR: 'this_year',
} as const;

/**
 * Get comparison period for a given time range
 */
export const getComparisonPeriod = (
  type: TimeRangeType,
  customStart?: Date,
  customEnd?: Date
): { startDate: Date; endDate: Date } => {
  const currentRange = getDateRangeForType(type, customStart, customEnd);
  const daysDiff = Math.floor(
    (currentRange.endDate.getTime() - currentRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    startDate: subDays(currentRange.startDate, daysDiff + 1),
    endDate: subDays(currentRange.endDate, daysDiff + 1),
  };
};

/**
 * Time granularity options
 */
export const TIME_GRANULARITY_OPTIONS = [
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
] as const;

/**
 * Get recommended granularity for time range
 */
export const getRecommendedGranularity = (type: TimeRangeType): string => {
  switch (type) {
    case 'today':
    case 'yesterday':
      return 'hour';
    case 'last_7_days':
    case 'last_14_days':
    case 'this_week':
    case 'last_week':
      return 'day';
    case 'last_30_days':
    case 'this_month':
    case 'last_month':
      return 'day';
    case 'this_quarter':
    case 'last_quarter':
      return 'week';
    case 'this_year':
    case 'last_year':
      return 'month';
    case 'all_time':
      return 'month';
    default:
      return 'day';
  }
};

/**
 * Quick filter presets for analytics
 */
export const QUICK_FILTER_PRESETS = {
  PERFORMANCE_TODAY: {
    timeRange: 'today' as TimeRangeType,
    metrics: ['active_users', 'new_listings', 'total_revenue'],
  },
  WEEKLY_OVERVIEW: {
    timeRange: 'this_week' as TimeRangeType,
    metrics: ['new_users', 'active_listings', 'total_transactions'],
  },
  MONTHLY_REPORT: {
    timeRange: 'this_month' as TimeRangeType,
    metrics: ['total_revenue', 'new_users', 'rented_properties'],
  },
  QUARTERLY_REVIEW: {
    timeRange: 'this_quarter' as TimeRangeType,
    metrics: ['gross_revenue', 'user_retention_rate', 'agent_performance'],
  },
} as const;

/**
 * Refresh intervals for real-time dashboards (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  REAL_TIME: 5000, // 5 seconds
  FAST: 10000, // 10 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 60000, // 1 minute
  VERY_SLOW: 300000, // 5 minutes
} as const;

/**
 * Date format patterns for different granularities
 */
export const DATE_FORMAT_BY_GRANULARITY = {
  hour: 'MMM d, h:mm a',
  day: 'MMM d, yyyy',
  week: "'Week of' MMM d",
  month: 'MMM yyyy',
  quarter: "QQQ ''yy",
  year: 'yyyy',
} as const;

/**
 * Get label for time range
 */
export const getTimeRangeLabel = (type: TimeRangeType): string => {
  const option = TIME_RANGE_OPTIONS.find(opt => opt.value === type);
  return option?.label || 'Custom Range';
};

/**
 * Check if time range is custom
 */
export const isCustomTimeRange = (type: TimeRangeType): boolean => {
  return type === 'custom';
};

/**
 * Get previous period for comparison
 */
export const getPreviousPeriod = (
  startDate: Date,
  endDate: Date
): { startDate: Date; endDate: Date } => {
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    startDate: subDays(startDate, daysDiff + 1),
    endDate: subDays(endDate, daysDiff + 1),
  };
};

/**
 * Time zone options (Nigeria-focused)
 */
export const TIMEZONE_OPTIONS = [
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT)' },
] as const;

/**
 * Default timezone for the platform
 */
export const DEFAULT_TIMEZONE = 'Africa/Lagos';