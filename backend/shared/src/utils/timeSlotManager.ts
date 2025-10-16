/**
 * Time Slot Manager Utility
 * Location: backend/shared/src/utils/timeSlotManager.ts
 * 
 * Handles time slot expiry and rotation logic for property marking queue system
 */

import { addHours, addDays, isBefore, isAfter, differenceInMinutes, differenceInHours } from 'date-fns';

export interface TimeSlotConfig {
  slotDurationHours: number; // Default: 3 hours per agent
  maxCompletionDays: number; // Default: 3 days for property owner
  bufferMinutes: number; // Buffer time before expiry warnings
  warningThresholdMinutes: number; // When to send expiry warnings
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  expiresAt: Date;
  isExpired: boolean;
  remainingMinutes: number;
  warningRequired: boolean;
}

export interface CompletionWindow {
  deadline: Date;
  isExpired: boolean;
  remainingDays: number;
  remainingHours: number;
}

const DEFAULT_CONFIG: TimeSlotConfig = {
  slotDurationHours: 3,
  maxCompletionDays: 3,
  bufferMinutes: 15,
  warningThresholdMinutes: 30,
};

/**
 * Time Slot Manager Class
 */
export class TimeSlotManager {
  private config: TimeSlotConfig;

  constructor(config: Partial<TimeSlotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new time slot for an agent
   */
  createTimeSlot(startTime: Date = new Date()): TimeSlot {
    const endTime = addHours(startTime, this.config.slotDurationHours);
    const expiresAt = addHours(startTime, this.config.slotDurationHours);

    return {
      startTime,
      endTime,
      expiresAt,
      isExpired: false,
      remainingMinutes: this.config.slotDurationHours * 60,
      warningRequired: false,
    };
  }

  /**
   * Check if a time slot has expired
   */
  isTimeSlotExpired(expiresAt: Date): boolean {
    return isBefore(expiresAt, new Date());
  }

  /**
   * Calculate remaining time in a time slot
   */
  getRemainingTime(expiresAt: Date): {
    remainingMinutes: number;
    remainingHours: number;
    isExpired: boolean;
  } {
    const now = new Date();
    
    if (isBefore(expiresAt, now)) {
      return {
        remainingMinutes: 0,
        remainingHours: 0,
        isExpired: true,
      };
    }

    const remainingMinutes = differenceInMinutes(expiresAt, now);
    const remainingHours = differenceInHours(expiresAt, now);

    return {
      remainingMinutes,
      remainingHours,
      isExpired: false,
    };
  }

  /**
   * Check if time slot requires expiry warning
   */
  requiresWarning(expiresAt: Date): boolean {
    const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);
    
    if (isExpired) return false;
    
    return remainingMinutes <= this.config.warningThresholdMinutes;
  }

  /**
   * Get time slot status with all details
   */
  getTimeSlotStatus(expiresAt: Date): TimeSlot {
    const { remainingMinutes, remainingHours, isExpired } = this.getRemainingTime(expiresAt);
    const warningRequired = this.requiresWarning(expiresAt);

    const startTime = addHours(expiresAt, -this.config.slotDurationHours);

    return {
      startTime,
      endTime: expiresAt,
      expiresAt,
      isExpired,
      remainingMinutes,
      warningRequired,
    };
  }

  /**
   * Create completion window for property owner (max 3 days)
   */
  createCompletionWindow(startDate: Date = new Date()): CompletionWindow {
    const deadline = addDays(startDate, this.config.maxCompletionDays);

    return {
      deadline,
      isExpired: false,
      remainingDays: this.config.maxCompletionDays,
      remainingHours: this.config.maxCompletionDays * 24,
    };
  }

  /**
   * Check if completion window has expired
   */
  isCompletionWindowExpired(deadline: Date): boolean {
    return isBefore(deadline, new Date());
  }

  /**
   * Get completion window status
   */
  getCompletionWindowStatus(deadline: Date): CompletionWindow {
    const now = new Date();
    const isExpired = isBefore(deadline, now);

    if (isExpired) {
      return {
        deadline,
        isExpired: true,
        remainingDays: 0,
        remainingHours: 0,
      };
    }

    const remainingHours = differenceInHours(deadline, now);
    const remainingDays = Math.floor(remainingHours / 24);

    return {
      deadline,
      isExpired: false,
      remainingDays,
      remainingHours,
    };
  }

  /**
   * Calculate next rotation time (when current slot expires)
   */
  getNextRotationTime(currentExpiresAt: Date): Date {
    if (this.isTimeSlotExpired(currentExpiresAt)) {
      return new Date(); // Rotate immediately if expired
    }
    return currentExpiresAt;
  }

  /**
   * Extend time slot (e.g., for special circumstances)
   */
  extendTimeSlot(currentExpiresAt: Date, additionalHours: number): Date {
    return addHours(currentExpiresAt, additionalHours);
  }

  /**
   * Calculate total elapsed time since slot creation
   */
  getElapsedTime(startTime: Date): {
    elapsedMinutes: number;
    elapsedHours: number;
  } {
    const now = new Date();
    const elapsedMinutes = differenceInMinutes(now, startTime);
    const elapsedHours = differenceInHours(now, startTime);

    return {
      elapsedMinutes,
      elapsedHours,
    };
  }

  /**
   * Check if time is within buffer period before expiry
   */
  isInBufferPeriod(expiresAt: Date): boolean {
    const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);
    
    if (isExpired) return false;
    
    return remainingMinutes <= this.config.bufferMinutes;
  }

  /**
   * Get all expired time slots from a list
   */
  filterExpiredSlots(slots: { expiresAt: Date; id: string }[]): string[] {
    const now = new Date();
    return slots
      .filter(slot => isBefore(slot.expiresAt, now))
      .map(slot => slot.id);
  }

  /**
   * Sort time slots by expiry time (soonest first)
   */
  sortByExpiry<T extends { expiresAt: Date }>(slots: T[]): T[] {
    return [...slots].sort((a, b) => 
      a.expiresAt.getTime() - b.expiresAt.getTime()
    );
  }

  /**
   * Calculate optimal next slot start time (accounting for queue)
   */
  calculateNextSlotStart(queueLength: number): Date {
    const now = new Date();
    // Add buffer time based on queue length
    return addHours(now, Math.floor(queueLength / 5) * 0.5);
  }

  /**
   * Validate if a time slot can be created
   */
  canCreateTimeSlot(requestedStartTime: Date): {
    isValid: boolean;
    reason?: string;
  } {
    const now = new Date();
    
    if (isBefore(requestedStartTime, now)) {
      return {
        isValid: false,
        reason: 'Start time cannot be in the past',
      };
    }

    return { isValid: true };
  }

  /**
   * Get formatted time remaining string
   */
  formatRemainingTime(expiresAt: Date): string {
    const { remainingMinutes, remainingHours, isExpired } = this.getRemainingTime(expiresAt);

    if (isExpired) {
      return 'Expired';
    }

    if (remainingHours > 0) {
      const minutes = remainingMinutes % 60;
      return `${remainingHours}h ${minutes}m`;
    }

    return `${remainingMinutes}m`;
  }

  /**
   * Get time slot expiry notification data
   */
  getExpiryNotificationData(expiresAt: Date): {
    shouldNotify: boolean;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  } {
    const { remainingMinutes, isExpired } = this.getRemainingTime(expiresAt);

    if (isExpired) {
      return {
        shouldNotify: true,
        urgency: 'critical',
        message: 'Your time slot has expired',
      };
    }

    if (remainingMinutes <= 15) {
      return {
        shouldNotify: true,
        urgency: 'critical',
        message: `Only ${remainingMinutes} minutes remaining!`,
      };
    }

    if (remainingMinutes <= 30) {
      return {
        shouldNotify: true,
        urgency: 'high',
        message: `${remainingMinutes} minutes remaining in your time slot`,
      };
    }

    if (remainingMinutes <= 60) {
      return {
        shouldNotify: true,
        urgency: 'medium',
        message: 'Less than 1 hour remaining',
      };
    }

    return {
      shouldNotify: false,
      urgency: 'low',
      message: '',
    };
  }
}

// Export singleton instance with default config
export const timeSlotManager = new TimeSlotManager();

// Export helper functions for quick access
export const createTimeSlot = (startTime?: Date) => timeSlotManager.createTimeSlot(startTime);
export const isTimeSlotExpired = (expiresAt: Date) => timeSlotManager.isTimeSlotExpired(expiresAt);
export const getRemainingTime = (expiresAt: Date) => timeSlotManager.getRemainingTime(expiresAt);
export const createCompletionWindow = (startDate?: Date) => timeSlotManager.createCompletionWindow(startDate);
export const getCompletionWindowStatus = (deadline: Date) => timeSlotManager.getCompletionWindowStatus(deadline);