// apps/admin/src/lib/constants/index.ts

/**
 * Central export file for all admin constants
 */

// Route constants
export * from './routes';

// Role and permission constants
export * from './roles';
export * from './permissions';

// Status constants
export * from './status';

// Filter constants
export * from './filters';

// Additional constants
export const APP_NAME = 'Newcondo Admin';
export const APP_VERSION = '1.0.0';
export const API_VERSION = 'v1';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Property marking constants
export const MARKING_CONSTANTS = {
  BASE_FEE: 20000, // NGN
  NEWCONDO_MARKING_FEE: 25000, // NGN
  AGENT_COMMISSION_RATE: 0.25, // 25%
  TIME_SLOT_DURATION: 3, // hours
  MAX_COMPLETION_TIME: 3, // days
  INITIAL_PAYMENT_PERCENTAGE: 0.05, // 5% (1000 NGN of 20000)
  CONFIRMATION_WINDOW: 3, // days
} as const;

// Payment confirmation constants
export const PAYMENT_CONFIRMATION = {
  CONFIRMATION_PERIOD: 24, // hours
  AUTO_RELEASE_DELAY: 24, // hours
} as const;

// File upload constants
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  MAX_IMAGES_PER_PROPERTY: 20,
} as const;

// Currency constants
export const CURRENCY = {
  CODE: 'NGN',
  SYMBOL: '₦',
  NAME: 'Nigerian Naira',
} as const;

// Admin action types
export const ADMIN_ACTION_TYPES = {
  USER_VERIFIED: 'USER_VERIFIED',
  USER_REJECTED: 'USER_REJECTED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  PROPERTY_APPROVED: 'PROPERTY_APPROVED',
  PROPERTY_REJECTED: 'PROPERTY_REJECTED',
  PROPERTY_DELETED: 'PROPERTY_DELETED',
  DOCUMENT_APPROVED: 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
  DUPLICATE_RESOLVED: 'DUPLICATE_RESOLVED',
  BOUNDARY_DISPUTE_RESOLVED: 'BOUNDARY_DISPUTE_RESOLVED',
  MARKING_JOB_REASSIGNED: 'MARKING_JOB_REASSIGNED',
  MARKING_JOB_CANCELLED: 'MARKING_JOB_CANCELLED',
  TICKET_RESOLVED: 'TICKET_RESOLVED',
  TICKET_CLOSED: 'TICKET_CLOSED',
  AGENT_SUSPENDED: 'AGENT_SUSPENDED',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Chart colors for analytics
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
} as const;

// Analytics time periods
export const ANALYTICS_PERIODS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'All Time', value: 'all' },
] as const;

// Table constants
export const TABLE_CONSTANTS = {
  DEFAULT_EMPTY_MESSAGE: 'No data available',
  DEFAULT_ERROR_MESSAGE: 'Failed to load data',
  DEFAULT_LOADING_MESSAGE: 'Loading...',
} as const;

// Validation constants
export const VALIDATION_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TITLE_LENGTH: 200,
  PHONE_REGEX: /^(\+234|0)[789][01]\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// System limits
export const SYSTEM_LIMITS = {
  MAX_PROPERTIES_PER_USER: 100,
  MAX_UNITS_PER_PROPERTY: 50,
  MAX_MARKING_JOBS_PER_USER: 10,
  MAX_SUPPORT_TICKETS_PER_USER: 20,
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30, // minutes
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_MULTI_FAMILY_PROPERTIES: true,
  ENABLE_PROPERTY_MARKING: true,
  ENABLE_VIRTUAL_ACCOUNTS: true,
  ENABLE_PREMIUM_FEATURES: true,
  ENABLE_REFERRAL_SYSTEM: true,
  ENABLE_ANALYTICS_EXPORT: true,
  ENABLE_BULK_OPERATIONS: true,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'An unexpected error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_VERIFIED: 'User verified successfully',
  USER_REJECTED: 'User verification rejected',
  PROPERTY_APPROVED: 'Property approved successfully',
  PROPERTY_REJECTED: 'Property rejected',
  DOCUMENT_APPROVED: 'Document approved successfully',
  DOCUMENT_REJECTED: 'Document rejected',
  PAYMENT_REFUNDED: 'Payment refunded successfully',
  PAYMENT_RELEASED: 'Payment released successfully',
  TICKET_RESOLVED: 'Ticket resolved successfully',
  CHANGES_SAVED: 'Changes saved successfully',
} as const;