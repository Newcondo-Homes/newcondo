// apps/admin/src/lib/constants/chartColors.ts

/**
 * Primary color palette for charts
 */
export const PRIMARY_COLORS = {
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  INDIGO: '#6366F1',
  TEAL: '#14B8A6',
  ORANGE: '#F97316',
  CYAN: '#06B6D4',
} as const;

/**
 * Status colors
 */
export const STATUS_COLORS = {
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  PENDING: '#F59E0B',
  COMPLETED: '#10B981',
  CANCELLED: '#6B7280',
  FAILED: '#EF4444',
} as const;

/**
 * Chart series colors (for multi-line/multi-bar charts)
 */
export const SERIES_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
] as const;

/**
 * Gradient colors for area charts
 */
export const GRADIENT_COLORS = {
  BLUE: {
    start: '#3B82F6',
    end: '#DBEAFE',
  },
  GREEN: {
    start: '#10B981',
    end: '#D1FAE5',
  },
  PURPLE: {
    start: '#8B5CF6',
    end: '#EDE9FE',
  },
  ORANGE: {
    start: '#F97316',
    end: '#FED7AA',
  },
  RED: {
    start: '#EF4444',
    end: '#FEE2E2',
  },
} as const;

/**
 * Revenue chart colors
 */
export const REVENUE_CHART_COLORS = {
  GROSS_REVENUE: '#10B981',
  NET_REVENUE: '#3B82F6',
  COMMISSION: '#8B5CF6',
  PLATFORM_FEE: '#F59E0B',
  REFUNDS: '#EF4444',
  RENT_REVENUE: '#14B8A6',
  MARKING_REVENUE: '#F97316',
} as const;

/**
 * User type colors
 */
export const USER_TYPE_COLORS = {
  OWNER: '#3B82F6',
  AGENT: '#10B981',
  RENTER: '#F59E0B',
  ADMIN: '#8B5CF6',
} as const;

/**
 * Property status colors
 */
export const PROPERTY_STATUS_COLORS = {
  DRAFT: '#6B7280',
  PENDING: '#F59E0B',
  PUBLISHED: '#3B82F6',
  RENTED: '#10B981',
  UNAVAILABLE: '#EF4444',
} as const;

/**
 * Payment status colors
 */
export const PAYMENT_STATUS_COLORS = {
  PENDING: '#F59E0B',
  SUCCESS: '#10B981',
  FAILED: '#EF4444',
  CANCELLED: '#6B7280',
  REFUNDED: '#8B5CF6',
  HELD: '#F97316',
  RELEASED: '#14B8A6',
} as const;

/**
 * Verification status colors
 */
export const VERIFICATION_STATUS_COLORS = {
  PENDING: '#F59E0B',
  VERIFIED: '#10B981',
  REJECTED: '#EF4444',
} as const;

/**
 * Performance level colors
 */
export const PERFORMANCE_COLORS = {
  EXCELLENT: '#10B981',
  GOOD: '#3B82F6',
  FAIR: '#F59E0B',
  POOR: '#EF4444',
} as const;

/**
 * Heatmap colors (light to dark)
 */
export const HEATMAP_COLORS = [
  '#DBEAFE', // Lightest
  '#BFDBFE',
  '#93C5FD',
  '#60A5FA',
  '#3B82F6',
  '#2563EB',
  '#1D4ED8', // Darkest
] as const;

/**
 * Diverging colors (for showing positive/negative)
 */
export const DIVERGING_COLORS = {
  NEGATIVE_STRONG: '#DC2626',
  NEGATIVE_MEDIUM: '#EF4444',
  NEGATIVE_LIGHT: '#FCA5A5',
  NEUTRAL: '#E5E7EB',
  POSITIVE_LIGHT: '#86EFAC',
  POSITIVE_MEDIUM: '#10B981',
  POSITIVE_STRONG: '#059669',
} as const;

/**
 * Background colors for chart sections
 */
export const BACKGROUND_COLORS = {
  LIGHT_BLUE: '#EFF6FF',
  LIGHT_GREEN: '#F0FDF4',
  LIGHT_YELLOW: '#FFFBEB',
  LIGHT_RED: '#FEF2F2',
  LIGHT_PURPLE: '#FAF5FF',
  LIGHT_GRAY: '#F9FAFB',
} as const;

/**
 * Border colors
 */
export const BORDER_COLORS = {
  LIGHT: '#E5E7EB',
  MEDIUM: '#D1D5DB',
  DARK: '#9CA3AF',
} as const;

/**
 * Text colors for charts
 */
export const TEXT_COLORS = {
  PRIMARY: '#111827',
  SECONDARY: '#6B7280',
  TERTIARY: '#9CA3AF',
  LIGHT: '#D1D5DB',
} as const;

/**
 * Opacity levels
 */
export const OPACITY_LEVELS = {
  SOLID: 1,
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
  VERY_LOW: 0.2,
  TRANSPARENT: 0.1,
} as const;

/**
 * Color palettes for specific chart types
 */
export const CHART_PALETTES = {
  DEFAULT: SERIES_COLORS,
  PASTEL: [
    '#A5B4FC', '#FBBF24', '#34D399', '#F472B6',
    '#A78BFA', '#FCA5A5', '#93C5FD', '#FCD34D',
  ],
  VIBRANT: [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  ],
  MONOCHROME_BLUE: [
    '#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD',
    '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8',
  ],
  MONOCHROME_GREEN: [
    '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC',
    '#4ADE80', '#22C55E', '#16A34A', '#15803D',
  ],
} as const;

/**
 * Get color by index (with wrapping)
 */
export const getColorByIndex = (index: number): string => {
  return SERIES_COLORS[index % SERIES_COLORS.length];
};

/**
 * Get color by value (for thresholds)
 */
export const getColorByValue = (
  value: number,
  thresholds: { excellent: number; good: number; fair: number }
): string => {
  if (value >= thresholds.excellent) return PERFORMANCE_COLORS.EXCELLENT;
  if (value >= thresholds.good) return PERFORMANCE_COLORS.GOOD;
  if (value >= thresholds.fair) return PERFORMANCE_COLORS.FAIR;
  return PERFORMANCE_COLORS.POOR;
};

/**
 * Get gradient for area chart
 */
export const getGradientDefinition = (
  id: string,
  color: keyof typeof GRADIENT_COLORS
): { id: string; start: string; end: string } => {
  return {
    id,
    start: GRADIENT_COLORS[color].start,
    end: GRADIENT_COLORS[color].end,
  };
};

/**
 * Convert hex to rgba
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  const upperStatus = status.toUpperCase();
  
  if (upperStatus in STATUS_COLORS) {
    return STATUS_COLORS[upperStatus as keyof typeof STATUS_COLORS];
  }
  
  return STATUS_COLORS.INFO;
};

/**
 * Get trend color (positive/negative)
 */
export const getTrendColor = (value: number): string => {
  if (value > 5) return DIVERGING_COLORS.POSITIVE_STRONG;
  if (value > 0) return DIVERGING_COLORS.POSITIVE_MEDIUM;
  if (value === 0) return DIVERGING_COLORS.NEUTRAL;
  if (value > -5) return DIVERGING_COLORS.NEGATIVE_MEDIUM;
  return DIVERGING_COLORS.NEGATIVE_STRONG;
};