// backend/marking-service/src/constants/timeWindows.ts

/**
 * Time window constants for property marking service
 */

export const TIME_WINDOWS = {
  // Agent time slot to complete marking after accepting job
  AGENT_MARKING_WINDOW_HOURS: 3,
  AGENT_MARKING_WINDOW_MS: 3 * 60 * 60 * 1000, // 3 hours in milliseconds

  // Property owner confirmation deadline after property is marked
  OWNER_CONFIRMATION_WINDOW_DAYS: 3,
  OWNER_CONFIRMATION_WINDOW_MS: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds

  // Maximum time from job creation to completion
  MAX_JOB_COMPLETION_DAYS: 7,
  MAX_JOB_COMPLETION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds

  // Job broadcast expiry - how long job stays in queue before auto-cancellation
  JOB_BROADCAST_EXPIRY_HOURS: 48,
  JOB_BROADCAST_EXPIRY_MS: 48 * 60 * 60 * 1000, // 48 hours in milliseconds

  // Payment lock duration for marking jobs
  PAYMENT_LOCK_DURATION_MINUTES: 15,
  PAYMENT_LOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes in milliseconds

  // Time buffer before sending reminder notifications
  REMINDER_BUFFER_HOURS: 6,
  REMINDER_BUFFER_MS: 6 * 60 * 60 * 1000, // 6 hours in milliseconds

  // Agent response time after job broadcast
  AGENT_RESPONSE_WINDOW_HOURS: 24,
  AGENT_RESPONSE_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds

  // Queue position timeout - how long an agent stays in queue
  QUEUE_POSITION_TIMEOUT_HOURS: 4,
  QUEUE_POSITION_TIMEOUT_MS: 4 * 60 * 60 * 1000, // 4 hours in milliseconds

  // Partial payment release delay after marking
  PARTIAL_PAYMENT_RELEASE_DELAY_MINUTES: 5,
  PARTIAL_PAYMENT_RELEASE_DELAY_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
} as const;

/**
 * Helper functions for time calculations
 */
export const timeHelpers = {
  /**
   * Calculate agent marking deadline from acceptance time
   */
  getAgentMarkingDeadline: (acceptedAt: Date): Date => {
    return new Date(acceptedAt.getTime() + TIME_WINDOWS.AGENT_MARKING_WINDOW_MS);
  },

  /**
   * Calculate owner confirmation deadline from marking completion time
   */
  getOwnerConfirmationDeadline: (markedAt: Date): Date => {
    return new Date(markedAt.getTime() + TIME_WINDOWS.OWNER_CONFIRMATION_WINDOW_MS);
  },

  /**
   * Calculate maximum job completion deadline from job creation time
   */
  getMaxJobCompletionDeadline: (createdAt: Date): Date => {
    return new Date(createdAt.getTime() + TIME_WINDOWS.MAX_JOB_COMPLETION_MS);
  },

  /**
   * Calculate job broadcast expiry from creation time
   */
  getJobBroadcastExpiry: (createdAt: Date): Date => {
    return new Date(createdAt.getTime() + TIME_WINDOWS.JOB_BROADCAST_EXPIRY_MS);
  },

  /**
   * Calculate payment lock expiry from lock time
   */
  getPaymentLockExpiry: (lockedAt: Date): Date => {
    return new Date(lockedAt.getTime() + TIME_WINDOWS.PAYMENT_LOCK_DURATION_MS);
  },

  /**
   * Calculate reminder time (6 hours before deadline)
   */
  getReminderTime: (deadline: Date): Date => {
    return new Date(deadline.getTime() - TIME_WINDOWS.REMINDER_BUFFER_MS);
  },

  /**
   * Check if time window has expired
   */
  isExpired: (deadline: Date): boolean => {
    return new Date() > deadline;
  },

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime: (deadline: Date): number => {
    const remaining = deadline.getTime() - new Date().getTime();
    return remaining > 0 ? remaining : 0;
  },

  /**
   * Format remaining time as human-readable string
   */
  formatRemainingTime: (deadline: Date): string => {
    const remaining = timeHelpers.getRemainingTime(deadline);
    
    if (remaining === 0) {
      return 'Expired';
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }

    return `${minutes}m remaining`;
  },
};

/**
 * Notification timing configurations
 */
export const NOTIFICATION_TIMING = {
  // When to send reminder before deadline
  REMINDER_BEFORE_EXPIRY_HOURS: [6, 1], // 6 hours and 1 hour before

  // Delayed notification after event (to avoid spam)
  DELAYED_NOTIFICATION_MINUTES: 2,

  // Batch notification intervals
  BATCH_NOTIFICATION_INTERVAL_MINUTES: 30,
} as const;

export type TimeWindow = keyof typeof TIME_WINDOWS;