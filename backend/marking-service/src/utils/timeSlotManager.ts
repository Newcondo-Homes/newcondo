/**
 * Time Slot Manager Utility
 * Handles time slot calculations and management for property marking jobs
 * 
 * Location: backend/marking-service/src/utils/timeSlotManager.ts
 */

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

interface JobTimingConfig {
  agentTimeSlotDuration: number; // 3 hours in minutes
  ownerConfirmationWindow: number; // 2-3 days in minutes
  maxQueueWaitTime: number; // Maximum time a job can stay in queue
}

const DEFAULT_CONFIG: JobTimingConfig = {
  agentTimeSlotDuration: 180, // 3 hours
  ownerConfirmationWindow: 2880, // 2 days (48 hours)
  maxQueueWaitTime: 10080, // 7 days
};

export class TimeSlotManager {
  private config: JobTimingConfig;

  constructor(config: Partial<JobTimingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate agent time slot (3 hours from assignment)
   */
  calculateAgentTimeSlot(assignmentTime: Date = new Date()): TimeSlot {
    const startTime = new Date(assignmentTime);
    const endTime = new Date(
      assignmentTime.getTime() + this.config.agentTimeSlotDuration * 60 * 1000
    );

    return {
      startTime,
      endTime,
      duration: this.config.agentTimeSlotDuration,
    };
  }

  /**
   * Calculate owner confirmation deadline (2-3 days from marking completion)
   */
  calculateConfirmationDeadline(
    completionTime: Date,
    windowInDays: number = 2
  ): Date {
    const windowInMinutes = windowInDays * 24 * 60;
    return new Date(
      completionTime.getTime() + windowInMinutes * 60 * 1000
    );
  }

  /**
   * Check if agent time slot has expired
   */
  isAgentTimeSlotExpired(timeSlotExpiry: Date): boolean {
    return new Date() > timeSlotExpiry;
  }

  /**
   * Check if owner confirmation window has expired
   */
  isConfirmationWindowExpired(confirmationDeadline: Date): boolean {
    return new Date() > confirmationDeadline;
  }

  /**
   * Calculate remaining time in time slot (in minutes)
   */
  getRemainingTimeSlotMinutes(timeSlotExpiry: Date): number {
    const now = new Date();
    const remainingMs = timeSlotExpiry.getTime() - now.getTime();
    
    if (remainingMs <= 0) return 0;
    
    return Math.floor(remainingMs / (60 * 1000));
  }

  /**
   * Calculate remaining time in confirmation window (in hours)
   */
  getRemainingConfirmationHours(confirmationDeadline: Date): number {
    const now = new Date();
    const remainingMs = confirmationDeadline.getTime() - now.getTime();
    
    if (remainingMs <= 0) return 0;
    
    return Math.floor(remainingMs / (60 * 60 * 1000));
  }

  /**
   * Get time slot progress percentage (0-100)
   */
  getTimeSlotProgress(assignmentTime: Date, timeSlotExpiry: Date): number {
    const now = new Date();
    const totalDuration = timeSlotExpiry.getTime() - assignmentTime.getTime();
    const elapsed = now.getTime() - assignmentTime.getTime();

    if (elapsed >= totalDuration) return 100;
    if (elapsed <= 0) return 0;

    return Math.floor((elapsed / totalDuration) * 100);
  }

  /**
   * Calculate maximum completion time for a job (from creation)
   */
  calculateMaxCompletionTime(jobCreationTime: Date): Date {
    return new Date(
      jobCreationTime.getTime() + this.config.maxQueueWaitTime * 60 * 1000
    );
  }

  /**
   * Check if job has exceeded maximum completion time
   */
  hasExceededMaxCompletionTime(
    jobCreationTime: Date,
    maxCompletionTime?: Date
  ): boolean {
    const deadline = maxCompletionTime || this.calculateMaxCompletionTime(jobCreationTime);
    return new Date() > deadline;
  }

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(expiryTime: Date): string {
    const now = new Date();
    const remainingMs = expiryTime.getTime() - now.getTime();

    if (remainingMs <= 0) return 'Expired';

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Check if time is within business hours (optional constraint)
   */
  isWithinBusinessHours(time: Date = new Date()): boolean {
    const hour = time.getHours();
    const dayOfWeek = time.getDay();

    // Business hours: Mon-Sat, 8 AM - 6 PM
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 6;
    const isBusinessHour = hour >= 8 && hour < 18;

    return isWeekday && isBusinessHour;
  }

  /**
   * Calculate next business hour if current time is outside business hours
   */
  getNextBusinessHour(time: Date = new Date()): Date {
    const nextTime = new Date(time);
    
    // If Sunday, move to Monday 8 AM
    if (nextTime.getDay() === 0) {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(8, 0, 0, 0);
      return nextTime;
    }

    // If after 6 PM, move to next day 8 AM
    if (nextTime.getHours() >= 18) {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(8, 0, 0, 0);
      
      // Skip Sunday
      if (nextTime.getDay() === 0) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
      
      return nextTime;
    }

    // If before 8 AM, move to 8 AM same day
    if (nextTime.getHours() < 8) {
      nextTime.setHours(8, 0, 0, 0);
      return nextTime;
    }

    return nextTime;
  }

  /**
   * Calculate time windows for multiple confirmation attempts
   * Used when owner doesn't confirm and agent gets partial payments
   */
  calculateConfirmationAttempts(
    completionTime: Date,
    maxAttempts: number = 3
  ): Array<{ attemptNumber: number; deadline: Date; compensationPercentage: number }> {
    const attempts = [];
    const windowDays = 2; // 2 days per attempt

    for (let i = 1; i <= maxAttempts; i++) {
      const deadline = new Date(
        completionTime.getTime() + (i * windowDays * 24 * 60 * 60 * 1000)
      );
      
      // Each failed confirmation gives agent a portion of remaining fee
      const compensationPercentage = 25; // 25% per failed confirmation
      
      attempts.push({
        attemptNumber: i,
        deadline,
        compensationPercentage,
      });
    }

    return attempts;
  }

  /**
   * Get current confirmation attempt based on completion time
   */
  getCurrentConfirmationAttempt(
    completionTime: Date,
    maxAttempts: number = 3
  ): number {
    const now = new Date();
    const hoursSinceCompletion = 
      (now.getTime() - completionTime.getTime()) / (60 * 60 * 1000);
    
    const attemptWindow = 48; // 2 days in hours
    const currentAttempt = Math.floor(hoursSinceCompletion / attemptWindow) + 1;

    return Math.min(currentAttempt, maxAttempts);
  }

  /**
   * Calculate time until next queue position opens
   */
  calculateQueueWaitTime(
    queuePosition: number,
    averageCompletionTime: number = 180 // 3 hours default
  ): number {
    // Estimate: each position ahead takes average completion time
    return (queuePosition - 1) * averageCompletionTime;
  }

  /**
   * Validate if preferred time is reasonable
   */
  isValidPreferredTime(preferredTime: Date): {
    isValid: boolean;
    reason?: string;
  } {
    const now = new Date();
    const maxFutureTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if time is in the past
    if (preferredTime <= now) {
      return {
        isValid: false,
        reason: 'Preferred time cannot be in the past',
      };
    }

    // Check if time is too far in the future
    if (preferredTime > maxFutureTime) {
      return {
        isValid: false,
        reason: 'Preferred time cannot be more than 30 days in the future',
      };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const timeSlotManager = new TimeSlotManager();

// Export types
export type { TimeSlot, JobTimingConfig };