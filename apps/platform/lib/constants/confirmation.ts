/**
 * Confirmation Period Constants
 * File: apps/platform/lib/constants/confirmation.ts
 * 
 * Constants related to payment confirmation periods and timelines
 */

/**
 * Confirmation period duration in hours
 * Renter has 24 hours to confirm or dispute the property
 */
export const CONFIRMATION_PERIOD_HOURS = 24;

/**
 * Confirmation period duration in milliseconds
 */
export const CONFIRMATION_PERIOD_MS = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;

/**
 * Warning threshold before confirmation period expires (in hours)
 * Show warning when less than this time remains
 */
export const CONFIRMATION_WARNING_THRESHOLD_HOURS = 6;

/**
 * Grace period after confirmation period expires (in hours)
 * Additional time for system processing before auto-release
 */
export const CONFIRMATION_GRACE_PERIOD_HOURS = 2;

/**
 * Confirmation statuses
 */
export enum ConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
  AUTO_CONFIRMED = 'AUTO_CONFIRMED',
  EXPIRED = 'EXPIRED',
}

/**
 * Dispute reasons
 */
export enum DisputeReason {
  PROPERTY_NOT_AS_DESCRIBED = 'PROPERTY_NOT_AS_DESCRIBED',
  PROPERTY_UNAVAILABLE = 'PROPERTY_UNAVAILABLE',
  PROPERTY_CONDITION_POOR = 'PROPERTY_CONDITION_POOR',
  WRONG_LOCATION = 'WRONG_LOCATION',
  AMENITIES_MISSING = 'AMENITIES_MISSING',
  SAFETY_CONCERNS = 'SAFETY_CONCERNS',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
  OTHER = 'OTHER',
}

/**
 * Dispute reason labels for display
 */
export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  [DisputeReason.PROPERTY_NOT_AS_DESCRIBED]: 'Property not as described',
  [DisputeReason.PROPERTY_UNAVAILABLE]: 'Property unavailable',
  [DisputeReason.PROPERTY_CONDITION_POOR]: 'Property condition is poor',
  [DisputeReason.WRONG_LOCATION]: 'Wrong location',
  [DisputeReason.AMENITIES_MISSING]: 'Amenities missing',
  [DisputeReason.SAFETY_CONCERNS]: 'Safety concerns',
  [DisputeReason.FRAUDULENT_LISTING]: 'Fraudulent listing',
  [DisputeReason.OTHER]: 'Other reason',
};

/**
 * Payment release statuses
 */
export enum ReleaseStatus {
  HELD = 'HELD',
  PENDING_RELEASE = 'PENDING_RELEASE',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

/**
 * Notification timing constants (in hours before expiry)
 */
export const NOTIFICATION_SCHEDULE = {
  FIRST_REMINDER: 18, // 6 hours after payment
  SECOND_REMINDER: 12, // 12 hours after payment
  FINAL_REMINDER: 3, // 21 hours after payment (3 hours before expiry)
  URGENT_REMINDER: 1, // 23 hours after payment (1 hour before expiry)
};

/**
 * Auto-confirmation settings
 */
export const AUTO_CONFIRMATION = {
  ENABLED: true,
  TRIGGER_AFTER_HOURS: CONFIRMATION_PERIOD_HOURS,
  NOTIFICATION_DELAY_MINUTES: 5, // Notify parties 5 minutes after auto-confirmation
};

/**
 * Confirmation checklist items
 */
export const CONFIRMATION_CHECKLIST = [
  {
    id: 'property_exists',
    label: 'I have verified that the property exists at the stated address',
    required: true,
  },
  {
    id: 'matches_description',
    label: 'The property matches the description and photos in the listing',
    required: true,
  },
  {
    id: 'amenities_present',
    label: 'All listed amenities are present and functional',
    required: true,
  },
  {
    id: 'property_available',
    label: 'The property is available for occupancy',
    required: true,
  },
  {
    id: 'agrees_to_fees',
    label: 'I agree to the platform service fees (non-refundable)',
    required: true,
  },
] as const;

/**
 * Dispute evidence requirements
 */
export const DISPUTE_EVIDENCE_REQUIREMENTS = {
  MIN_PHOTOS: 3,
  MAX_PHOTOS: 10,
  DESCRIPTION_MIN_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_MB: 5,
};

/**
 * Refund processing timeline (in business days)
 */
export const REFUND_TIMELINE = {
  PROCESSING_DAYS: 3,
  MAX_PROCESSING_DAYS: 7,
  BUSINESS_DAYS_ONLY: true,
};

/**
 * Commission distribution timing
 */
export const COMMISSION_DISTRIBUTION = {
  TRIGGER_AFTER_CONFIRMATION: true,
  DELAY_MINUTES: 15, // Process 15 minutes after confirmation
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MINUTES: 30,
};

/**
 * Virtual account unlock settings
 */
export const VIRTUAL_ACCOUNT_UNLOCK = {
  AUTO_UNLOCK_AFTER_RELEASE: true,
  UNLOCK_DELAY_MINUTES: 5,
  NOTIFICATION_ON_UNLOCK: true,
};

/**
 * Status badge colors for UI
 */
export const STATUS_COLORS = {
  [ConfirmationStatus.PENDING]: 'warning',
  [ConfirmationStatus.CONFIRMED]: 'success',
  [ConfirmationStatus.DISPUTED]: 'error',
  [ConfirmationStatus.AUTO_CONFIRMED]: 'success',
  [ConfirmationStatus.EXPIRED]: 'default',
  [ReleaseStatus.HELD]: 'warning',
  [ReleaseStatus.PENDING_RELEASE]: 'info',
  [ReleaseStatus.RELEASED]: 'success',
  [ReleaseStatus.REFUNDED]: 'error',
  [ReleaseStatus.PARTIAL_REFUND]: 'warning',
} as const;

/**
 * Time format for display
 */
export const TIME_FORMAT = {
  FULL: 'MMM dd, yyyy hh:mm a',
  DATE_ONLY: 'MMM dd, yyyy',
  TIME_ONLY: 'hh:mm a',
  RELATIVE_SHORT: 'short', // "in 2 hours"
  RELATIVE_LONG: 'long', // "in 2 hours and 30 minutes"
};

/**
 * Helper function to calculate confirmation deadline
 */
export function calculateConfirmationDeadline(paymentDate: Date): Date {
  return new Date(paymentDate.getTime() + CONFIRMATION_PERIOD_MS);
}

/**
 * Helper function to check if confirmation period is expired
 */
export function isConfirmationPeriodExpired(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Helper function to get remaining time in milliseconds
 */
export function getRemainingTimeMs(deadline: Date): number {
  const remaining = deadline.getTime() - new Date().getTime();
  return remaining > 0 ? remaining : 0;
}

/**
 * Helper function to check if warning should be shown
 */
export function shouldShowWarning(deadline: Date): boolean {
  const remainingHours = getRemainingTimeMs(deadline) / (60 * 60 * 1000);
  return remainingHours <= CONFIRMATION_WARNING_THRESHOLD_HOURS && remainingHours > 0;
}

/**
 * Helper function to format remaining time
 */
export function formatRemainingTime(deadline: Date): string {
  const remainingMs = getRemainingTimeMs(deadline);
  
  if (remainingMs === 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}