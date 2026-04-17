/**
 * Time Window Constants for Property Marking Service
 * Location: apps/platform/lib/constants/timeWindows.ts
 */

// Time windows in milliseconds
export const TIME_WINDOWS = {
  // Agent marking time slot
  AGENT_MARKING_SLOT: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  
  // Property owner confirmation period
  OWNER_CONFIRMATION_WINDOW: 2 * 24 * 60 * 60 * 1000, // 2 days
  OWNER_CONFIRMATION_WINDOW_MAX: 3 * 24 * 60 * 60 * 1000, // 3 days
  
  // Payment lock expiry
  PAYMENT_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Job expiration
  JOB_QUEUE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Notification reminders
  FIRST_REMINDER: 24 * 60 * 60 * 1000, // 1 day before deadline
  SECOND_REMINDER: 12 * 60 * 60 * 1000, // 12 hours before deadline
  FINAL_REMINDER: 2 * 60 * 60 * 1000, // 2 hours before deadline
  
  // Grace periods
  GRACE_PERIOD: 1 * 60 * 60 * 1000, // 1 hour grace period
  
  // Session timeouts
  SHAREABLE_LINK_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  TEMPORARY_TOKEN_EXPIRY: 30 * 60 * 1000, // 30 minutes
} as const;

// Time windows in human-readable format
export const TIME_WINDOW_LABELS = {
  AGENT_MARKING_SLOT: '3 hours',
  OWNER_CONFIRMATION_WINDOW: '2-3 days',
  PAYMENT_LOCK_DURATION: '15 minutes',
  JOB_QUEUE_EXPIRY: '7 days',
  SHAREABLE_LINK_EXPIRY: '24 hours',
} as const;

// Time slots for agent availability
export const AGENT_TIME_SLOTS = [
  { id: 'morning', label: 'Morning', start: '08:00', end: '12:00' },
  { id: 'afternoon', label: 'Afternoon', start: '12:00', end: '16:00' },
  { id: 'evening', label: 'Evening', start: '16:00', end: '20:00' },
] as const;

// Working hours configuration
export const WORKING_HOURS = {
  START: 8, // 8 AM
  END: 20, // 8 PM
  DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
} as const;

// Confirmation deadline calculation
export const CONFIRMATION_DEADLINES = {
  MIN_DAYS: 2,
  MAX_DAYS: 3,
  DEFAULT_DAYS: 2,
} as const;

// Queue position timing
export const QUEUE_TIMING = {
  POSITION_HOLD_TIME: 3 * 60 * 60 * 1000, // 3 hours per agent
  MAX_QUEUE_SIZE: 10, // Maximum agents in queue
  REQUEUE_DELAY: 30 * 60 * 1000, // 30 minutes before requeuing
} as const;

// Notification timing
export const NOTIFICATION_TIMING = {
  IMMEDIATE: 0, // Send immediately
  DELAYED_5MIN: 5 * 60 * 1000,
  DELAYED_30MIN: 30 * 60 * 1000,
  DELAYED_1HR: 60 * 60 * 1000,
  BATCH_INTERVAL: 15 * 60 * 1000, // Send batch notifications every 15 minutes
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 5 * 60 * 1000, // 5 minutes
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY: 60 * 60 * 1000, // 1 hour
} as const;

// Expiry warnings
export const EXPIRY_WARNINGS = {
  CRITICAL: 2 * 60 * 60 * 1000, // 2 hours before expiry
  WARNING: 6 * 60 * 60 * 1000, // 6 hours before expiry
  INFO: 24 * 60 * 60 * 1000, // 24 hours before expiry
} as const;

// Helper functions
export const timeWindowHelpers = {
  /**
   * Calculate agent marking deadline
   */
  getAgentMarkingDeadline: (assignedAt: Date): Date => {
    return new Date(assignedAt.getTime() + TIME_WINDOWS.AGENT_MARKING_SLOT);
  },

  /**
   * Calculate owner confirmation deadline
   */
  getOwnerConfirmationDeadline: (markedAt: Date, days: number = CONFIRMATION_DEADLINES.DEFAULT_DAYS): Date => {
    const daysMs = days * 24 * 60 * 60 * 1000;
    return new Date(markedAt.getTime() + daysMs);
  },

  /**
   * Check if time window is expired
   */
  isExpired: (deadline: Date): boolean => {
    return new Date() > deadline;
  },

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime: (deadline: Date): number => {
    const remaining = deadline.getTime() - Date.now();
    return Math.max(0, remaining);
  },

  /**
   * Format remaining time to human-readable string
   */
  formatRemainingTime: (deadline: Date): string => {
    const remaining = timeWindowHelpers.getRemainingTime(deadline);
    
    if (remaining === 0) return 'Expired';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  },

  /**
   * Check if within grace period
   */
  isWithinGracePeriod: (deadline: Date): boolean => {
    const timeSinceDeadline = Date.now() - deadline.getTime();
    return timeSinceDeadline >= 0 && timeSinceDeadline <= TIME_WINDOWS.GRACE_PERIOD;
  },

  /**
   * Get urgency level based on remaining time
   */
  getUrgencyLevel: (deadline: Date): 'low' | 'medium' | 'high' | 'critical' | 'expired' => {
    const remaining = timeWindowHelpers.getRemainingTime(deadline);
    
    if (remaining === 0) return 'expired';
    if (remaining <= EXPIRY_WARNINGS.CRITICAL) return 'critical';
    if (remaining <= EXPIRY_WARNINGS.WARNING) return 'high';
    if (remaining <= EXPIRY_WARNINGS.INFO) return 'medium';
    return 'low';
  },

  /**
   * Calculate next queue position time slot
   */
  getNextQueueSlot: (currentPosition: number): Date => {
    const slotDuration = QUEUE_TIMING.POSITION_HOLD_TIME;
    return new Date(Date.now() + (currentPosition * slotDuration));
  },

  /**
   * Check if within working hours
   */
  isWithinWorkingHours: (date: Date = new Date()): boolean => {
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return hour >= WORKING_HOURS.START && 
           hour < WORKING_HOURS.END && 
           (WORKING_HOURS.DAYS as readonly string[]).includes(day);
  },
};

// Time window status colors (for UI)
export const TIME_WINDOW_COLORS = {
  low: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  medium: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  high: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  expired: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
} as const;






// // apps/platform/lib/constants/timeWindows.ts

// /**
//  * Time window constants for Property Marking Service
//  * All durations are in milliseconds for consistency
//  */

// // Agent marking time window - 3 hours to complete the job
// export const AGENT_MARKING_WINDOW_HOURS = 3;
// export const AGENT_MARKING_WINDOW_MS = AGENT_MARKING_WINDOW_HOURS * 60 * 60 * 1000;

// // Property owner confirmation time window - 2-3 days
// export const OWNER_CONFIRMATION_MIN_DAYS = 2;
// export const OWNER_CONFIRMATION_MAX_DAYS = 3;
// export const OWNER_CONFIRMATION_WINDOW_MS = OWNER_CONFIRMATION_MAX_DAYS * 24 * 60 * 60 * 1000;

// // Payment lock window for preventing double bookings
// export const PAYMENT_LOCK_WINDOW_MINUTES = 15;
// export const PAYMENT_LOCK_WINDOW_MS = PAYMENT_LOCK_WINDOW_MINUTES * 60 * 1000;

// // Queue position expiry - if agent doesn't respond
// export const QUEUE_POSITION_EXPIRY_MINUTES = 30;
// export const QUEUE_POSITION_EXPIRY_MS = QUEUE_POSITION_EXPIRY_MINUTES * 60 * 1000;

// // Maximum time for entire marking job completion
// export const MAX_MARKING_JOB_DAYS = 7;
// export const MAX_MARKING_JOB_MS = MAX_MARKING_JOB_DAYS * 24 * 60 * 60 * 1000;

// // Notification reminder intervals
// export const REMINDER_INTERVALS = {
//   FIRST_REMINDER_HOURS: 24, // 1 day before deadline
//   SECOND_REMINDER_HOURS: 12, // 12 hours before deadline
//   FINAL_REMINDER_HOURS: 2, // 2 hours before deadline
// } as const;

// export const REMINDER_INTERVALS_MS = {
//   FIRST_REMINDER: REMINDER_INTERVALS.FIRST_REMINDER_HOURS * 60 * 60 * 1000,
//   SECOND_REMINDER: REMINDER_INTERVALS.SECOND_REMINDER_HOURS * 60 * 60 * 1000,
//   FINAL_REMINDER: REMINDER_INTERVALS.FINAL_REMINDER_HOURS * 60 * 60 * 1000,
// } as const;

// // Agent compensation release timing
// export const IMMEDIATE_PAYMENT_PERCENTAGE = 20; // 20% paid immediately (1,000 NGN out of 5,000)
// export const PENDING_PAYMENT_PERCENTAGE = 80; // 80% paid after confirmation (4,000 NGN)

// // Auto-release payment if owner doesn't confirm
// export const AUTO_RELEASE_PAYMENT_DAYS = OWNER_CONFIRMATION_MAX_DAYS;
// export const AUTO_RELEASE_PAYMENT_MS = AUTO_RELEASE_PAYMENT_DAYS * 24 * 60 * 60 * 1000;

// // Maximum number of retry attempts for failed confirmations
// export const MAX_CONFIRMATION_RETRIES = 3;

// // Time window before marking job expiry to send warnings
// export const EXPIRY_WARNING_HOURS = 24;
// export const EXPIRY_WARNING_MS = EXPIRY_WARNING_HOURS * 60 * 60 * 1000;

// /**
//  * Helper functions for time window calculations
//  */

// export const calculateAgentDeadline = (startTime: Date): Date => {
//   return new Date(startTime.getTime() + AGENT_MARKING_WINDOW_MS);
// };

// export const calculateConfirmationDeadline = (markingCompletedAt: Date): Date => {
//   return new Date(markingCompletedAt.getTime() + OWNER_CONFIRMATION_WINDOW_MS);
// };

// export const calculatePaymentLockExpiry = (startTime: Date): Date => {
//   return new Date(startTime.getTime() + PAYMENT_LOCK_WINDOW_MS);
// };

// export const calculateQueuePositionExpiry = (assignedAt: Date): Date => {
//   return new Date(assignedAt.getTime() + QUEUE_POSITION_EXPIRY_MS);
// };

// export const calculateMaxJobCompletionTime = (jobCreatedAt: Date): Date => {
//   return new Date(jobCreatedAt.getTime() + MAX_MARKING_JOB_MS);
// };

// export const calculateAutoReleaseDate = (markingCompletedAt: Date): Date => {
//   return new Date(markingCompletedAt.getTime() + AUTO_RELEASE_PAYMENT_MS);
// };

// export const isWithinTimeWindow = (deadline: Date, currentTime: Date = new Date()): boolean => {
//   return currentTime < deadline;
// };

// export const getTimeRemaining = (deadline: Date, currentTime: Date = new Date()): number => {
//   return Math.max(0, deadline.getTime() - currentTime.getTime());
// };

// export const getTimeRemainingFormatted = (deadline: Date, currentTime: Date = new Date()): string => {
//   const remaining = getTimeRemaining(deadline, currentTime);
  
//   if (remaining === 0) {
//     return 'Expired';
//   }

//   const hours = Math.floor(remaining / (60 * 60 * 1000));
//   const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

//   if (hours > 24) {
//     const days = Math.floor(hours / 24);
//     return `${days} day${days !== 1 ? 's' : ''} remaining`;
//   }

//   if (hours > 0) {
//     return `${hours}h ${minutes}m remaining`;
//   }

//   return `${minutes}m remaining`;
// };

// export const shouldSendReminder = (
//   deadline: Date,
//   reminderType: keyof typeof REMINDER_INTERVALS_MS,
//   currentTime: Date = new Date()
// ): boolean => {
//   const timeUntilDeadline = getTimeRemaining(deadline, currentTime);
//   const reminderThreshold = REMINDER_INTERVALS_MS[reminderType];
  
//   return timeUntilDeadline <= reminderThreshold && timeUntilDeadline > 0;
// };

// /**
//  * Time window status types
//  */
// export type TimeWindowStatus = 
//   | 'ACTIVE' 
//   | 'EXPIRING_SOON' 
//   | 'EXPIRED';

// export const getTimeWindowStatus = (
//   deadline: Date,
//   warningThresholdMs: number = EXPIRY_WARNING_MS,
//   currentTime: Date = new Date()
// ): TimeWindowStatus => {
//   const remaining = getTimeRemaining(deadline, currentTime);
  
//   if (remaining === 0) {
//     return 'EXPIRED';
//   }
  
//   if (remaining <= warningThresholdMs) {
//     return 'EXPIRING_SOON';
//   }
  
//   return 'ACTIVE';
// };

// /**
//  * Marking job phase tracking
//  */
// export enum MarkingJobPhase {
//   PAYMENT_PENDING = 'PAYMENT_PENDING',
//   AGENT_ASSIGNMENT = 'AGENT_ASSIGNMENT',
//   MARKING_IN_PROGRESS = 'MARKING_IN_PROGRESS',
//   AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
//   COMPLETED = 'COMPLETED',
//   EXPIRED = 'EXPIRED',
//   CANCELLED = 'CANCELLED',
// }

// export interface TimeWindowInfo {
//   phase: MarkingJobPhase;
//   deadline: Date | null;
//   status: TimeWindowStatus;
//   timeRemaining: number;
//   timeRemainingFormatted: string;
//   canProgress: boolean;
//   message: string;
// }

// export const getMarkingJobTimeInfo = (
//   phase: MarkingJobPhase,
//   relevantDate: Date | null,
//   currentTime: Date = new Date()
// ): TimeWindowInfo => {
//   if (!relevantDate) {
//     return {
//       phase,
//       deadline: null,
//       status: 'ACTIVE',
//       timeRemaining: 0,
//       timeRemainingFormatted: 'N/A',
//       canProgress: phase === MarkingJobPhase.PAYMENT_PENDING,
//       message: 'Awaiting action',
//     };
//   }

//   let deadline: Date;
//   let message: string;

//   switch (phase) {
//     case MarkingJobPhase.MARKING_IN_PROGRESS:
//       deadline = calculateAgentDeadline(relevantDate);
//       message = 'Agent marking in progress';
//       break;
    
//     case MarkingJobPhase.AWAITING_CONFIRMATION:
//       deadline = calculateConfirmationDeadline(relevantDate);
//       message = 'Awaiting owner confirmation';
//       break;
    
//     default:
//       deadline = relevantDate;
//       message = 'Processing';
//   }

//   const status = getTimeWindowStatus(deadline, EXPIRY_WARNING_MS, currentTime);
//   const timeRemaining = getTimeRemaining(deadline, currentTime);
//   const timeRemainingFormatted = getTimeRemainingFormatted(deadline, currentTime);
//   const canProgress = status !== 'EXPIRED';

//   return {
//     phase,
//     deadline,
//     status,
//     timeRemaining,
//     timeRemainingFormatted,
//     canProgress,
//     message,
//   };
// };

// /**
//  * Export all constants as a single object for easy import
//  */
// export const TIME_WINDOWS = {
//   AGENT_MARKING_HOURS: AGENT_MARKING_WINDOW_HOURS,
//   AGENT_MARKING_MS: AGENT_MARKING_WINDOW_MS,
//   OWNER_CONFIRMATION_DAYS: OWNER_CONFIRMATION_MAX_DAYS,
//   OWNER_CONFIRMATION_MS: OWNER_CONFIRMATION_WINDOW_MS,
//   PAYMENT_LOCK_MINUTES: PAYMENT_LOCK_WINDOW_MINUTES,
//   PAYMENT_LOCK_MS: PAYMENT_LOCK_WINDOW_MS,
//   QUEUE_EXPIRY_MINUTES: QUEUE_POSITION_EXPIRY_MINUTES,
//   QUEUE_EXPIRY_MS: QUEUE_POSITION_EXPIRY_MS,
//   MAX_JOB_DAYS: MAX_MARKING_JOB_DAYS,
//   MAX_JOB_MS: MAX_MARKING_JOB_MS,
//   AUTO_RELEASE_DAYS: AUTO_RELEASE_PAYMENT_DAYS,
//   AUTO_RELEASE_MS: AUTO_RELEASE_PAYMENT_MS,
//   REMINDERS: REMINDER_INTERVALS_MS,
//   EXPIRY_WARNING_HOURS,
//   EXPIRY_WARNING_MS,
// } as const;