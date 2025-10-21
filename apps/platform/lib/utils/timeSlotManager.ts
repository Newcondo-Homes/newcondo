// apps/platform/lib/utils/timeSlotManager.ts

/**
 * Time Slot Manager Utility
 * Handles time slot calculations, formatting, and validations for the property marking queue system
 */

import { addHours, addDays, differenceInMinutes, differenceInHours, format, isPast, isWithinInterval } from 'date-fns';

// Constants
export const TIME_SLOT_DURATION_HOURS = 3;
export const MAX_COMPLETION_DAYS = 3;
export const CONFIRMATION_WINDOW_HOURS = 48; // 2 days for owner confirmation

/**
 * Calculate time slot expiry from assignment time
 */
export function calculateTimeSlotExpiry(assignedAt: Date): Date {
  return addHours(assignedAt, TIME_SLOT_DURATION_HOURS);
}

/**
 * Calculate max completion time from job creation
 */
export function calculateMaxCompletionTime(createdAt: Date): Date {
  return addDays(createdAt, MAX_COMPLETION_DAYS);
}

/**
 * Calculate confirmation deadline from completion time
 */
export function calculateConfirmationDeadline(completedAt: Date): Date {
  return addHours(completedAt, CONFIRMATION_WINDOW_HOURS);
}

/**
 * Check if a time slot has expired
 */
export function isTimeSlotExpired(timeSlotExpiry: Date): boolean {
  return isPast(timeSlotExpiry);
}

/**
 * Check if confirmation window has expired
 */
export function isConfirmationExpired(confirmationDeadline: Date): boolean {
  return isPast(confirmationDeadline);
}

/**
 * Get remaining time in a time slot in minutes
 */
export function getRemainingTimeSlotMinutes(timeSlotExpiry: Date): number {
  const now = new Date();
  const remaining = differenceInMinutes(timeSlotExpiry, now);
  return remaining > 0 ? remaining : 0;
}

/**
 * Get remaining confirmation time in hours
 */
export function getRemainingConfirmationHours(confirmationDeadline: Date): number {
  const now = new Date();
  const remaining = differenceInHours(confirmationDeadline, now);
  return remaining > 0 ? remaining : 0;
}

/**
 * Format time slot expiry for display
 */
export function formatTimeSlotExpiry(timeSlotExpiry: Date): string {
  const remainingMinutes = getRemainingTimeSlotMinutes(timeSlotExpiry);
  
  if (remainingMinutes === 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  
  return `${minutes}m remaining`;
}

/**
 * Format confirmation deadline for display
 */
export function formatConfirmationDeadline(confirmationDeadline: Date): string {
  const remainingHours = getRemainingConfirmationHours(confirmationDeadline);
  
  if (remainingHours === 0) {
    return 'Expired';
  }
  
  if (remainingHours >= 24) {
    const days = Math.floor(remainingHours / 24);
    const hours = remainingHours % 24;
    return days === 1 
      ? `1 day ${hours}h remaining` 
      : `${days} days ${hours}h remaining`;
  }
  
  return `${remainingHours}h remaining`;
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return format(date, 'MMM dd, yyyy hh:mm a');
}

/**
 * Format date only
 */
export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy');
}

/**
 * Format time only
 */
export function formatTime(date: Date): string {
  return format(date, 'hh:mm a');
}

/**
 * Calculate time slot progress percentage (0-100)
 */
export function calculateTimeSlotProgress(assignedAt: Date, timeSlotExpiry: Date): number {
  const now = new Date();
  const totalDuration = differenceInMinutes(timeSlotExpiry, assignedAt);
  const elapsed = differenceInMinutes(now, assignedAt);
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.floor((elapsed / totalDuration) * 100);
}

/**
 * Get time slot status
 */
export function getTimeSlotStatus(timeSlotExpiry: Date): 'active' | 'warning' | 'expired' {
  const remainingMinutes = getRemainingTimeSlotMinutes(timeSlotExpiry);
  
  if (remainingMinutes === 0) return 'expired';
  if (remainingMinutes <= 30) return 'warning'; // Last 30 minutes
  
  return 'active';
}

/**
 * Check if current time is within a time slot
 */
export function isWithinTimeSlot(assignedAt: Date, timeSlotExpiry: Date): boolean {
  const now = new Date();
  return isWithinInterval(now, { start: assignedAt, end: timeSlotExpiry });
}

/**
 * Calculate estimated completion time based on average agent performance
 */
export function calculateEstimatedCompletion(
  assignedAt: Date,
  averageCompletionMinutes: number = 120 // Default 2 hours
): Date {
  return addHours(assignedAt, averageCompletionMinutes / 60);
}

/**
 * Get time until max completion deadline
 */
export function getTimeUntilDeadline(maxCompletionTime: Date): {
  days: number;
  hours: number;
  isUrgent: boolean;
} {
  const now = new Date();
  const totalHours = differenceInHours(maxCompletionTime, now);
  
  if (totalHours <= 0) {
    return { days: 0, hours: 0, isUrgent: true };
  }
  
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const isUrgent = totalHours <= 24; // Less than 24 hours remaining
  
  return { days, hours, isUrgent };
}

/**
 * Format deadline status for display
 */
export function formatDeadlineStatus(maxCompletionTime: Date): string {
  const { days, hours, isUrgent } = getTimeUntilDeadline(maxCompletionTime);
  
  if (days === 0 && hours === 0) {
    return 'Overdue';
  }
  
  if (days === 0) {
    return `${hours}h until deadline`;
  }
  
  if (days === 1) {
    return `1 day ${hours}h until deadline`;
  }
  
  return `${days} days until deadline`;
}

/**
 * Parse time slot data for UI display
 */
export interface TimeSlotDisplay {
  assignedAt: string;
  expiresAt: string;
  remainingMinutes: number;
  remainingFormatted: string;
  progressPercentage: number;
  status: 'active' | 'warning' | 'expired';
  isExpired: boolean;
}

export function parseTimeSlotForDisplay(
  assignedAt: Date,
  timeSlotExpiry: Date
): TimeSlotDisplay {
  return {
    assignedAt: formatDateTime(assignedAt),
    expiresAt: formatDateTime(timeSlotExpiry),
    remainingMinutes: getRemainingTimeSlotMinutes(timeSlotExpiry),
    remainingFormatted: formatTimeSlotExpiry(timeSlotExpiry),
    progressPercentage: calculateTimeSlotProgress(assignedAt, timeSlotExpiry),
    status: getTimeSlotStatus(timeSlotExpiry),
    isExpired: isTimeSlotExpired(timeSlotExpiry),
  };
}

/**
 * Validate if a new time slot can be assigned
 */
export function canAssignNewTimeSlot(lastAssignedAt?: Date): boolean {
  if (!lastAssignedAt) return true;
  
  const lastExpiry = calculateTimeSlotExpiry(lastAssignedAt);
  return isTimeSlotExpired(lastExpiry);
}

/**
 * Calculate next available time slot
 */
export function calculateNextAvailableTimeSlot(currentExpiry: Date): Date {
  // Next slot starts immediately after current slot expires
  return currentExpiry;
}