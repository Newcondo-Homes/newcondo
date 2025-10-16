// backend/marking-service/src/config/timeSlots.ts
// Time slot configuration and management for property marking queue system

import { QUEUE_CONFIG } from './queue';

// Time slot status
export const TIME_SLOT_STATUS = {
  SCHEDULED: 'SCHEDULED', // Time slot assigned but not started
  ACTIVE: 'ACTIVE', // Currently active time slot
  EXPIRED: 'EXPIRED', // Time slot has expired
  COMPLETED: 'COMPLETED', // Job completed within time slot
  CANCELLED: 'CANCELLED', // Time slot cancelled
  EXTENDED: 'EXTENDED', // Time slot was extended (rare cases)
} as const;

export type TimeSlotStatusType = typeof TIME_SLOT_STATUS[keyof typeof TIME_SLOT_STATUS];

// Time slot interface
export interface TimeSlot {
  id: string;
  jobId: string;
  agentId: string;
  queuePosition: number;
  
  // Time boundaries
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  
  // Status tracking
  status: TimeSlotStatusType;
  activatedAt: Date | null;
  completedAt: Date | null;
  
  // Progress tracking
  elapsedMinutes: number;
  remainingMinutes: number;
  percentageComplete: number;
  
  // Warnings
  warningsSent: string[]; // ['75_PERCENT', '90_PERCENT']
  lastWarningAt: Date | null;
  
  // Extensions (if applicable)
  originalEndTime: Date;
  extensionMinutes: number;
  extensionReason: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// Time slot configuration by priority
export const TIME_SLOT_DURATIONS = {
  LOW: {
    minutes: QUEUE_CONFIG.TIME_SLOT_DURATION_MINUTES,
    milliseconds: QUEUE_CONFIG.TIME_SLOT_DURATION_MS,
    label: 'Standard (3 hours)',
  },
  NORMAL: {
    minutes: QUEUE_CONFIG.TIME_SLOT_DURATION_MINUTES,
    milliseconds: QUEUE_CONFIG.TIME_SLOT_DURATION_MS,
    label: 'Standard (3 hours)',
  },
  HIGH: {
    minutes: Math.floor(QUEUE_CONFIG.TIME_SLOT_DURATION_MINUTES * 0.8),
    milliseconds: Math.floor(QUEUE_CONFIG.TIME_SLOT_DURATION_MS * 0.8),
    label: 'High Priority (2.4 hours)',
  },
  URGENT: {
    minutes: Math.floor(QUEUE_CONFIG.TIME_SLOT_DURATION_MINUTES * 0.6),
    milliseconds: Math.floor(QUEUE_CONFIG.TIME_SLOT_DURATION_MS * 0.6),
    label: 'Urgent (1.8 hours)',
  },
} as const;

// Time slot warning thresholds
export const WARNING_THRESHOLDS = {
  FIRST_WARNING: {
    percent: 50,
    label: 'Halfway point',
    minutesBefore: (duration: number) => Math.floor(duration * 0.5),
  },
  SECOND_WARNING: {
    percent: 75,
    label: 'Three-quarters complete',
    minutesBefore: (duration: number) => Math.floor(duration * 0.25),
  },
  CRITICAL_WARNING: {
    percent: 90,
    label: 'Critical - 10% remaining',
    minutesBefore: (duration: number) => Math.floor(duration * 0.1),
  },
  FINAL_WARNING: {
    percent: 95,
    label: 'Final warning - 5 minutes left',
    minutesBefore: 5,
  },
} as const;

// Grace period configuration
export const GRACE_PERIOD_CONFIG = {
  ENABLED: true,
  DURATION_MINUTES: QUEUE_CONFIG.ROTATION_GRACE_PERIOD_MINUTES,
  DURATION_MS: QUEUE_CONFIG.ROTATION_GRACE_PERIOD_MS,
  ALLOW_COMPLETION_IN_GRACE: true, // Allow job completion during grace period
  NOTIFY_DURING_GRACE: true,
} as const;

// Time slot extension rules (for exceptional cases)
export const EXTENSION_RULES = {
  ENABLED: false, // Disabled by default - strict FCFS
  MAX_EXTENSIONS: 1,
  MAX_EXTENSION_MINUTES: 30,
  VALID_REASONS: [
    'TRAFFIC_DELAY',
    'PROPERTY_ACCESS_ISSUE',
    'TECHNICAL_DIFFICULTY',
    'WEATHER_CONDITION',
  ] as const,
  REQUIRES_APPROVAL: true,
} as const;

export type ExtensionReasonType = typeof EXTENSION_RULES.VALID_REASONS[number];

// Rotation configuration
export const ROTATION_CONFIG = {
  AUTO_ROTATE: QUEUE_CONFIG.AUTO_ROTATION_ENABLED,
  GRACE_PERIOD_MINUTES: QUEUE_CONFIG.ROTATION_GRACE_PERIOD_MINUTES,
  NOTIFY_NEXT_AGENT: true,
  NOTIFY_EXPIRED_AGENT: true,
  UPDATE_METRICS: true, // Update agent performance metrics on rotation
  
  // Rotation penalties
  PENALIZE_EXPIRED_AGENT: true,
  EXPIRY_PENALTY_POINTS: -0.1, // Reduce reliability score by 0.1
  
  // Next agent notification
  NEXT_AGENT_NOTICE_MINUTES: 15, // Notify next agent 15 mins before rotation
} as const;

// Time slot scheduling rules
export const SCHEDULING_RULES = {
  // Buffer times
  BUFFER_BETWEEN_SLOTS_MINUTES: 5, // 5 min buffer between agent slots
  BUFFER_BEFORE_FIRST_SLOT_MINUTES: 10, // 10 min before first agent starts
  
  // Scheduling constraints
  MIN_ADVANCE_BOOKING_MINUTES: 30, // Jobs must be created 30 min in advance
  MAX_ADVANCE_BOOKING_DAYS: 7, // Can't schedule more than 7 days ahead
  
  // Operating hours (24/7 by default, but can be restricted)
  RESTRICT_TO_BUSINESS_HOURS: false,
  BUSINESS_HOURS_START: 8, // 8 AM
  BUSINESS_HOURS_END: 18, // 6 PM
  ALLOW_WEEKEND_SLOTS: true,
  
  // Holidays (optional)
  SKIP_HOLIDAYS: false,
  HOLIDAY_DATES: [] as Date[],
} as const;

// Performance tracking for time slots
export const TIME_SLOT_METRICS = {
  TRACK_UTILIZATION: true, // Track how much of time slot was used
  TRACK_COMPLETION_TIME: true,
  TRACK_WARNING_EFFECTIVENESS: true,
  
  // Optimal completion ranges
  OPTIMAL_COMPLETION_MIN: 60, // 1 hour
  OPTIMAL_COMPLETION_MAX: 150, // 2.5 hours
  
  // Speed categories
  VERY_FAST: 60, // Under 1 hour
  FAST: 120, // 1-2 hours
  NORMAL: 180, // 2-3 hours
  SLOW: 240, // 3-4 hours (with extension)
} as const;

// Utility functions
export function calculateTimeSlot(
  startTime: Date,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
): { startTime: Date; endTime: Date; durationMinutes: number } {
  const duration = TIME_SLOT_DURATIONS[priority];
  const endTime = new Date(startTime.getTime() + duration.milliseconds);
  
  return {
    startTime,
    endTime,
    durationMinutes: duration.minutes,
  };
}

export function getNextAvailableSlot(
  lastSlotEnd: Date,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
): { startTime: Date; endTime: Date; durationMinutes: number } {
  const bufferMs = SCHEDULING_RULES.BUFFER_BETWEEN_SLOTS_MINUTES * 60 * 1000;
  const startTime = new Date(lastSlotEnd.getTime() + bufferMs);
  
  return calculateTimeSlot(startTime, priority);
}

export function calculateRemainingTime(timeSlot: TimeSlot): {
  remainingMinutes: number;
  percentageComplete: number;
  status: 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
} {
  const now = new Date();
  const elapsed = now.getTime() - timeSlot.startTime.getTime();
  const total = timeSlot.endTime.getTime() - timeSlot.startTime.getTime();
  const remaining = timeSlot.endTime.getTime() - now.getTime();
  
  const remainingMinutes = Math.max(0, Math.floor(remaining / (60 * 1000)));
  const percentageComplete = Math.min(100, Math.floor((elapsed / total) * 100));
  
  let status: 'ON_TRACK' | 'WARNING' | 'CRITICAL' | 'EXPIRED';
  if (remainingMinutes <= 0) {
    status = 'EXPIRED';
  } else if (percentageComplete >= WARNING_THRESHOLDS.CRITICAL_WARNING.percent) {
    status = 'CRITICAL';
  } else if (percentageComplete >= WARNING_THRESHOLDS.SECOND_WARNING.percent) {
    status = 'WARNING';
  } else {
    status = 'ON_TRACK';
  }
  
  return { remainingMinutes, percentageComplete, status };
}

export function shouldSendWarning(
  timeSlot: TimeSlot,
  thresholdPercent: number
): boolean {
  const { percentageComplete } = calculateRemainingTime(timeSlot);
  const warningKey = `${thresholdPercent}_PERCENT`;

  // Check if the percentage complete has reached or passed the threshold
  const hasReachedThreshold = percentageComplete >= thresholdPercent;

  // Check if the warning for this threshold has already been sent
  const isWarningSent = timeSlot.warningsSent.includes(warningKey);

  // Send warning if threshold is reached and warning hasn't been sent yet,
  // and the slot isn't already completed, cancelled, or expired (though expiration check is technically in calculateRemainingTime)
  const isSlotActive = timeSlot.status === TIME_SLOT_STATUS.ACTIVE;

  return hasReachedThreshold && !isWarningSent && isSlotActive;
}

// Full type for warning thresholds for easy iteration
export type WarningThresholdKey = keyof typeof WARNING_THRESHOLDS;
export type WarningThreshold = typeof WARNING_THRESHOLDS[WarningThresholdKey];

/**
 * Gets all warning thresholds that should be sent for the current time slot state.
 * @param timeSlot The current time slot.
 * @returns An array of warning keys (e.g., '50_PERCENT', '75_PERCENT') that should be sent now.
 */
export function getDueWarnings(timeSlot: TimeSlot): string[] {
  const { percentageComplete } = calculateRemainingTime(timeSlot);
  const dueWarnings: string[] = [];
  const activeStatus = timeSlot.status === TIME_SLOT_STATUS.ACTIVE;

  if (!activeStatus) {
    return dueWarnings;
  }

  // Iterate over all warning thresholds
  const thresholds = Object.values(WARNING_THRESHOLDS) as WarningThreshold[];

  for (const threshold of thresholds) {
    const warningKey = `${threshold.percent}_PERCENT`;
    
    // Check if the percentage complete has reached or passed the threshold
    const hasReachedThreshold = percentageComplete >= threshold.percent;

    // Check if the warning for this threshold has already been sent
    const isWarningSent = timeSlot.warningsSent.includes(warningKey);
    
    if (hasReachedThreshold && !isWarningSent) {
      dueWarnings.push(warningKey);
    }
  }

  return dueWarnings;
}