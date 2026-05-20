import { ConfirmationPeriod, ConfirmationStatus } from '../types/confirmation';

export class ConfirmationPeriodUtils {
  // TODO: since CONFIRMATION_PERIOD_HOURS may change in the future, find the best
  // place to put it so it can be referenced here or anywhere its needed
  private static readonly CONFIRMATION_PERIOD_HOURS = 24;
  private static readonly WARNING_THRESHOLD_HOURS = 6;

  /**
   * Calculate confirmation period details from payment date
   */
  static calculateConfirmationPeriod(paymentDate: Date): ConfirmationPeriod {
    const startTime = new Date(paymentDate);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + this.CONFIRMATION_PERIOD_HOURS);

    const now = new Date();
    const remainingMs = endTime.getTime() - now.getTime();
    const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));

    return {
      startTime,
      endTime,
      durationHours: this.CONFIRMATION_PERIOD_HOURS,
      isActive: now < endTime && now >= startTime,
      hasExpired: now >= endTime,
      remainingHours: Math.round(remainingHours * 100) / 100,
    };
  }

  /**
   * Check if confirmation period is still active
   */
  static isConfirmationPeriodActive(confirmationDeadline: Date): boolean {
    return new Date() < new Date(confirmationDeadline);
  }

  /**
   * Check if confirmation period has expired
   */
  static hasConfirmationPeriodExpired(confirmationDeadline: Date): boolean {
    return new Date() >= new Date(confirmationDeadline);
  }

  /**
   * Get remaining time in confirmation period
   */
  static getRemainingTime(confirmationDeadline: Date): {
    hours: number;
    minutes: number;
    seconds: number;
    totalMilliseconds: number;
  } {
    const now = new Date();
    const deadline = new Date(confirmationDeadline);
    const remainingMs = Math.max(0, deadline.getTime() - now.getTime());

    return {
      totalMilliseconds: remainingMs,
      hours: Math.floor(remainingMs / (1000 * 60 * 60)),
      minutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((remainingMs % (1000 * 60)) / 1000),
    };
  }

  /**
   * Check if confirmation deadline is approaching (within warning threshold)
   */
  static isDeadlineApproaching(confirmationDeadline: Date): boolean {
    const remaining = this.getRemainingTime(confirmationDeadline);
    const remainingHours = remaining.totalMilliseconds / (1000 * 60 * 60);
    return remainingHours > 0 && remainingHours <= this.WARNING_THRESHOLD_HOURS;
  }

  /**
   * Calculate the release date (immediately after confirmation period ends)
   */
  static calculateReleaseDate(confirmationDeadline: Date): Date {
    return new Date(confirmationDeadline);
  }

  /**
   * Get confirmation status based on current state
   */
  static getConfirmationStatus(
    isConfirmed: boolean,
    confirmationDeadline: Date,
    hasDispute: boolean
  ): ConfirmationStatus {
    if (hasDispute) {
      return ConfirmationStatus.DISPUTED;
    }

    if (isConfirmed) {
      return ConfirmationStatus.CONFIRMED;
    }

    const hasExpired = this.hasConfirmationPeriodExpired(confirmationDeadline);
    if (hasExpired) {
      return ConfirmationStatus.AUTO_CONFIRMED;
    }

    return ConfirmationStatus.PENDING;
  }

  /**
   * Format remaining time as human-readable string
   */
  static formatRemainingTime(confirmationDeadline: Date): string {
    const remaining = this.getRemainingTime(confirmationDeadline);

    if (remaining.totalMilliseconds === 0) {
      return 'Expired';
    }

    if (remaining.hours > 0) {
      return `${remaining.hours}h ${remaining.minutes}m remaining`;
    }

    if (remaining.minutes > 0) {
      return `${remaining.minutes}m ${remaining.seconds}s remaining`;
    }

    return `${remaining.seconds}s remaining`;
  }

  /**
   * Get payments that need confirmation reminder notifications
   */
  static shouldSendReminderNotification(
    confirmationDeadline: Date,
    lastReminderSentAt?: Date
  ): boolean {
    if (!this.isConfirmationPeriodActive(confirmationDeadline)) {
      return false;
    }

    if (!this.isDeadlineApproaching(confirmationDeadline)) {
      return false;
    }

    // Don't send reminder if one was sent in the last 2 hours
    if (lastReminderSentAt) {
      const hoursSinceLastReminder =
        (new Date().getTime() - new Date(lastReminderSentAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < 2) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate confirmation request timing
   */
  static canConfirmPayment(confirmationDeadline: Date): {
    canConfirm: boolean;
    reason?: string;
  } {
    if (this.hasConfirmationPeriodExpired(confirmationDeadline)) {
      return {
        canConfirm: false,
        reason: 'Confirmation period has expired. Payment will be auto-confirmed.',
      };
    }

    return { canConfirm: true };
  }

  /**
   * Calculate auto-confirmation date
   */
  static getAutoConfirmationDate(paymentDate: Date): Date {
    const deadline = new Date(paymentDate);
    deadline.setHours(deadline.getHours() + this.CONFIRMATION_PERIOD_HOURS);
    return deadline;
  }
}