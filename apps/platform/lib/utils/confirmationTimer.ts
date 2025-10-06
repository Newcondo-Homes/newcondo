import { differenceInMilliseconds, differenceInHours, differenceInMinutes, differenceInSeconds, isPast, addHours } from 'date-fns';

export const CONFIRMATION_PERIOD_HOURS = 24;

/**
 * Calculate remaining time in confirmation period
 */
export function calculateRemainingTime(confirmationDeadline: Date | string): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isExpired: boolean;
  percentage: number;
} {
  const deadline = typeof confirmationDeadline === 'string' 
    ? new Date(confirmationDeadline) 
    : confirmationDeadline;
  
  const now = new Date();
  const isExpired = isPast(deadline);
  
  if (isExpired) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isExpired: true,
      percentage: 100
    };
  }
  
  const totalMilliseconds = differenceInMilliseconds(deadline, now);
  const hours = Math.floor(differenceInHours(deadline, now));
  const minutes = Math.floor(differenceInMinutes(deadline, now)) % 60;
  const seconds = Math.floor(differenceInSeconds(deadline, now)) % 60;
  
  // Calculate percentage of time elapsed
  const totalPeriodMs = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;
  const elapsedMs = totalPeriodMs - totalMilliseconds;
  const percentage = Math.min(Math.max((elapsedMs / totalPeriodMs) * 100, 0), 100);
  
  return {
    hours,
    minutes,
    seconds,
    totalMilliseconds,
    isExpired: false,
    percentage
  };
}

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(confirmationDeadline: Date | string): string {
  const { hours, minutes, seconds, isExpired } = calculateRemainingTime(confirmationDeadline);
  
  if (isExpired) {
    return 'Expired';
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }
  
  return `${seconds}s remaining`;
}

/**
 * Get urgency level based on remaining time
 */
export function getUrgencyLevel(confirmationDeadline: Date | string): 'low' | 'medium' | 'high' | 'critical' {
  const { hours, isExpired } = calculateRemainingTime(confirmationDeadline);
  
  if (isExpired) {
    return 'critical';
  }
  
  if (hours <= 2) {
    return 'critical';
  }
  
  if (hours <= 6) {
    return 'high';
  }
  
  if (hours <= 12) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate confirmation deadline from payment date
 */
export function calculateConfirmationDeadline(paymentDate: Date | string): Date {
  const payment = typeof paymentDate === 'string' ? new Date(paymentDate) : paymentDate;
  return addHours(payment, CONFIRMATION_PERIOD_HOURS);
}

/**
 * Check if confirmation period is active
 */
export function isConfirmationPeriodActive(confirmationDeadline: Date | string): boolean {
  const { isExpired } = calculateRemainingTime(confirmationDeadline);
  return !isExpired;
}

/**
 * Get timer color based on urgency
 */
export function getTimerColor(confirmationDeadline: Date | string): string {
  const urgency = getUrgencyLevel(confirmationDeadline);
  
  const colors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  
  return colors[urgency];
}

/**
 * Get progress bar color based on percentage
 */
export function getProgressBarColor(percentage: number): string {
  if (percentage < 50) {
    return 'bg-green-500';
  }
  
  if (percentage < 75) {
    return 'bg-yellow-500';
  }
  
  if (percentage < 90) {
    return 'bg-orange-500';
  }
  
  return 'bg-red-500';
}