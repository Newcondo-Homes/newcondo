// apps/platform/lib/constants/propertyManagement.ts

/**
 * Property Management Constants
 * Core constants for property management features
 */

// Property sharing settings
export const PROPERTY_PROMOTION_TYPES = {
  PUBLIC: 'PUBLIC',
  PERMISSION_BASED: 'PERMISSION_BASED',
  RESTRICTED: 'RESTRICTED',
  REQUEST_BASED: 'REQUEST_BASED',
} as const;

export type PropertyPromotionType = typeof PROPERTY_PROMOTION_TYPES[keyof typeof PROPERTY_PROMOTION_TYPES];

// Property sharing labels
export const PROMOTION_TYPE_LABELS: Record<PropertyPromotionType, string> = {
  [PROPERTY_PROMOTION_TYPES.PUBLIC]: 'Public Promotion',
  [PROPERTY_PROMOTION_TYPES.PERMISSION_BASED]: 'Permission-Based Promotion',
  [PROPERTY_PROMOTION_TYPES.RESTRICTED]: 'Restricted (No Promotion)',
  [PROPERTY_PROMOTION_TYPES.REQUEST_BASED]: 'Request-Based Promotion',
};

// Property sharing descriptions
export const PROMOTION_TYPE_DESCRIPTIONS: Record<PropertyPromotionType, string> = {
  [PROPERTY_PROMOTION_TYPES.PUBLIC]: 'Anyone can share your property with a simple share button',
  [PROPERTY_PROMOTION_TYPES.PERMISSION_BASED]: 'Only approved agents can promote your property',
  [PROPERTY_PROMOTION_TYPES.RESTRICTED]: 'No one else can promote this property',
  [PROPERTY_PROMOTION_TYPES.REQUEST_BASED]: 'Agents must request permission to promote',
};

// Property management views
export const PROPERTY_MANAGEMENT_VIEWS = {
  OVERVIEW: 'overview',
  LISTINGS: 'listings',
  PERFORMANCE: 'performance',
  REFERRALS: 'referrals',
  EARNINGS: 'earnings',
  BOUNDARIES: 'boundaries',
  MARKING: 'marking',
  TENANTS: 'tenants',
} as const;

export type PropertyManagementView = typeof PROPERTY_MANAGEMENT_VIEWS[keyof typeof PROPERTY_MANAGEMENT_VIEWS];

// Property actions
export const PROPERTY_ACTIONS = {
  EDIT: 'edit',
  VIEW_DETAILS: 'view_details',
  MANAGE_PROMOTION: 'manage_promotion',
  UPDATE_BOUNDARY: 'update_boundary',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_UNITS: 'manage_units',
  SHARE: 'share',
  ARCHIVE: 'archive',
  DELETE: 'delete',
} as const;

// Property performance metrics
export const PERFORMANCE_METRICS = {
  TOTAL_VIEWS: 'total_views',
  UNIQUE_VIEWERS: 'unique_viewers',
  FAVORITES: 'favorites',
  SHARES: 'shares',
  INQUIRIES: 'inquiries',
  APPLICATIONS: 'applications',
  CONVERSION_RATE: 'conversion_rate',
} as const;

// Rental history filters
export const RENTAL_HISTORY_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  PENDING_CONFIRMATION: 'pending_confirmation',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
} as const;

// Marking job statuses display
export const MARKING_JOB_STATUS_LABELS = {
  QUEUED: 'Queued',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
} as const;

// Marking job status colors
export const MARKING_JOB_STATUS_COLORS = {
  QUEUED: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
} as const;

// Property boundary statuses
export const BOUNDARY_STATUS_LABELS = {
  VERIFIED: 'Verified',
  UNVERIFIED: 'Unverified',
  PENDING: 'Pending Verification',
  DISPUTED: 'Disputed',
} as const;

// Time periods for analytics
export const ANALYTICS_TIME_PERIODS = {
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_3_MONTHS: 'last_3_months',
  LAST_6_MONTHS: 'last_6_months',
  LAST_YEAR: 'last_year',
  ALL_TIME: 'all_time',
} as const;

export type AnalyticsTimePeriod = typeof ANALYTICS_TIME_PERIODS[keyof typeof ANALYTICS_TIME_PERIODS];

// Time period labels
export const TIME_PERIOD_LABELS: Record<AnalyticsTimePeriod, string> = {
  [ANALYTICS_TIME_PERIODS.LAST_7_DAYS]: 'Last 7 Days',
  [ANALYTICS_TIME_PERIODS.LAST_30_DAYS]: 'Last 30 Days',
  [ANALYTICS_TIME_PERIODS.LAST_3_MONTHS]: 'Last 3 Months',
  [ANALYTICS_TIME_PERIODS.LAST_6_MONTHS]: 'Last 6 Months',
  [ANALYTICS_TIME_PERIODS.LAST_YEAR]: 'Last Year',
  [ANALYTICS_TIME_PERIODS.ALL_TIME]: 'All Time',
};

// Pagination defaults
export const PROPERTY_LIST_PAGE_SIZE = 12;
export const RENTAL_HISTORY_PAGE_SIZE = 10;
export const REFERRAL_PAGE_SIZE = 20;

// Property marketing tools
export const MARKETING_TOOLS = {
  SHAREABLE_LINK: 'shareable_link',
  QR_CODE: 'qr_code',
  SOCIAL_MEDIA: 'social_media',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
} as const;

// Sub-agent request statuses
export const SUB_AGENT_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Property unit management
export const UNIT_ACTIONS = {
  ADD_UNIT: 'add_unit',
  EDIT_UNIT: 'edit_unit',
  DELETE_UNIT: 'delete_unit',
  VIEW_UNIT: 'view_unit',
  UPDATE_AVAILABILITY: 'update_availability',
} as const;

// Confirmation period duration (in hours)
export const CONFIRMATION_PERIOD_HOURS = 24;

// Maximum days for marking job completion
export const MAX_MARKING_COMPLETION_DAYS = 3;

// Agent time slot duration (in hours)
export const AGENT_TIME_SLOT_HOURS = 3;

// Export all constants as default for easy importing
export default {
  PROPERTY_PROMOTION_TYPES,
  PROMOTION_TYPE_LABELS,
  PROMOTION_TYPE_DESCRIPTIONS,
  PROPERTY_MANAGEMENT_VIEWS,
  PROPERTY_ACTIONS,
  PERFORMANCE_METRICS,
  RENTAL_HISTORY_FILTERS,
  MARKING_JOB_STATUS_LABELS,
  MARKING_JOB_STATUS_COLORS,
  BOUNDARY_STATUS_LABELS,
  ANALYTICS_TIME_PERIODS,
  TIME_PERIOD_LABELS,
  PROPERTY_LIST_PAGE_SIZE,
  RENTAL_HISTORY_PAGE_SIZE,
  REFERRAL_PAGE_SIZE,
  MARKETING_TOOLS,
  SUB_AGENT_REQUEST_STATUS,
  UNIT_ACTIONS,
  CONFIRMATION_PERIOD_HOURS,
  MAX_MARKING_COMPLETION_DAYS,
  AGENT_TIME_SLOT_HOURS,
};