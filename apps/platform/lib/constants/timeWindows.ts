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
           WORKING_HOURS.DAYS.includes(day);
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