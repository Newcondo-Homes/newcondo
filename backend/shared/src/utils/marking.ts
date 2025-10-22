/**
 * Marking Job Utilities
 * Handles time slots, queue management, and marking job calculations
 */

import { addHours, addDays, isBefore, isAfter, differenceInMilliseconds } from 'date-fns';
import { MarkingJobStatus, UrgencyLevel } from '@prisma/client';

// Constants
export const MARKING_TIME_SLOT_HOURS = 3;
export const MAX_COMPLETION_DAYS = 3;
export const CONFIRMATION_WINDOW_DAYS = 2;
export const PARTIAL_PAYMENT_AMOUNT = 1000; // NGN
export const FULL_MARKING_FEE = 20000; // NGN
export const AGENT_COMMISSION_PERCENTAGE = 0.25; // 25%
export const NEWCONDO_MARKING_FEE = 25000; // NGN

/**
 * Calculate the time slot expiry for a marking job
 * @param assignedAt - The time when the job was assigned
 * @returns The expiry time (3 hours from assignment)
 */
export const calculateTimeSlotExpiry = (assignedAt: Date): Date => {
  return addHours(assignedAt, MARKING_TIME_SLOT_HOURS);
};

/**
 * Calculate the maximum completion time for a marking job
 * @param createdAt - The time when the job was created
 * @returns The maximum completion time (3 days from creation)
 */
export const calculateMaxCompletionTime = (createdAt: Date): Date => {
  return addDays(createdAt, MAX_COMPLETION_DAYS);
};

/**
 * Calculate the confirmation deadline for property owner
 * @param markedAt - The time when the property was marked
 * @returns The confirmation deadline (2 days from marking)
 */
export const calculateConfirmationDeadline = (markedAt: Date): Date => {
  return addDays(markedAt, CONFIRMATION_WINDOW_DAYS);
};

/**
 * Check if a time slot has expired
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns true if expired, false otherwise
 */
export const isTimeSlotExpired = (timeSlotExpiry: Date): boolean => {
  return isBefore(timeSlotExpiry, new Date());
};

/**
 * Check if the confirmation deadline has passed
 * @param confirmationDeadline - The confirmation deadline
 * @returns true if deadline passed, false otherwise
 */
export const isConfirmationDeadlinePassed = (confirmationDeadline: Date): boolean => {
  return isBefore(confirmationDeadline, new Date());
};

/**
 * Calculate agent commission for a marking job
 * @param markingFee - The total marking fee
 * @returns The agent's commission amount
 */
export const calculateAgentCommission = (markingFee: number): number => {
  return markingFee * AGENT_COMMISSION_PERCENTAGE;
};

/**
 * Calculate platform fee for a marking job
 * @param markingFee - The total marking fee
 * @returns The platform's fee amount
 */
export const calculatePlatformFee = (markingFee: number): number => {
  return markingFee * (1 - AGENT_COMMISSION_PERCENTAGE);
};

/**
 * Calculate partial payment for initial marking completion
 * @returns The partial payment amount
 */
export const getPartialPaymentAmount = (): number => {
  return PARTIAL_PAYMENT_AMOUNT;
};

/**
 * Calculate remaining payment after partial payment
 * @param totalFee - The total marking fee
 * @param partialPayment - The partial payment already made
 * @returns The remaining payment amount
 */
export const calculateRemainingPayment = (
  totalFee: number,
  partialPayment: number
): number => {
  return totalFee - partialPayment;
};

/**
 * Calculate how many partial payments can be made from the remaining fee
 * @param remainingFee - The remaining fee amount
 * @returns Number of partial payments possible
 */
export const calculatePartialPaymentCycles = (remainingFee: number): number => {
  return Math.floor(remainingFee / PARTIAL_PAYMENT_AMOUNT);
};

/**
 * Get the marking fee based on who is marking
 * @param markerType - Type of marker ('self', 'newcondo', 'known_person', 'agent')
 * @returns The marking fee amount
 */
export const getMarkingFee = (markerType: 'self' | 'newcondo' | 'known_person' | 'agent'): number => {
  switch (markerType) {
    case 'self':
      return 0; // No fee if marking themselves
    case 'newcondo':
      return NEWCONDO_MARKING_FEE;
    case 'known_person':
      return 0; // No fee if sending someone they know
    case 'agent':
      return FULL_MARKING_FEE;
    default:
      return FULL_MARKING_FEE;
  }
};

/**
 * Calculate time remaining in a time slot
 * @param timeSlotExpiry - The expiry time of the slot
 * @returns Milliseconds remaining (0 if expired)
 */
export const getTimeSlotRemaining = (timeSlotExpiry: Date): number => {
  const now = new Date();
  if (isBefore(timeSlotExpiry, now)) {
    return 0;
  }
  return differenceInMilliseconds(timeSlotExpiry, now);
};

/**
 * Calculate time remaining until confirmation deadline
 * @param confirmationDeadline - The confirmation deadline
 * @returns Milliseconds remaining (0 if passed)
 */
export const getConfirmationTimeRemaining = (confirmationDeadline: Date): number => {
  const now = new Date();
  if (isBefore(confirmationDeadline, now)) {
    return 0;
  }
  return differenceInMilliseconds(confirmationDeadline, now);
};

/**
 * Determine if a marking job should be auto-cancelled
 * @param createdAt - When the job was created
 * @param status - Current status of the job
 * @returns true if should be cancelled, false otherwise
 */
export const shouldAutoCancelJob = (
  createdAt: Date,
  status: MarkingJobStatus
): boolean => {
  if (status === MarkingJobStatus.COMPLETED || status === MarkingJobStatus.CANCELLED) {
    return false;
  }

  const maxCompletionTime = calculateMaxCompletionTime(createdAt);
  return isBefore(maxCompletionTime, new Date());
};

/**
 * Get priority score for queue sorting
 * @param urgencyLevel - The urgency level of the job
 * @param createdAt - When the job was created
 * @returns Priority score (higher = more priority)
 */
export const calculateQueuePriority = (
  urgencyLevel: UrgencyLevel,
  createdAt: Date
): number => {
  // Base score from urgency
  let score = 0;
  switch (urgencyLevel) {
    case UrgencyLevel.URGENT:
      score = 1000;
      break;
    case UrgencyLevel.HIGH:
      score = 500;
      break;
    case UrgencyLevel.NORMAL:
      score = 100;
      break;
    case UrgencyLevel.LOW:
      score = 50;
      break;
  }

  // Add time-based score (older jobs get higher priority)
  const hoursOld = differenceInMilliseconds(new Date(), createdAt) / (1000 * 60 * 60);
  score += hoursOld;

  return score;
};

/**
 * Format time slot expiry for display
 * @param timeSlotExpiry - The expiry time
 * @returns Human-readable time remaining
 */
export const formatTimeSlotExpiry = (timeSlotExpiry: Date): string => {
  const remaining = getTimeSlotRemaining(timeSlotExpiry);
  if (remaining === 0) {
    return 'Expired';
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

/**
 * Validate marking completion data
 * @param data - Completion data to validate
 * @returns Validation result
 */
export const validateMarkingCompletion = (data: {
  completionImages?: string[];
  boundaryData?: any;
  completionNotes?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.completionImages || data.completionImages.length === 0) {
    errors.push('At least one completion image is required');
  }

  if (data.completionImages && data.completionImages.length < 3) {
    errors.push('Minimum of 3 completion images required');
  }

  if (!data.boundaryData) {
    errors.push('Boundary data is required');
  }

  if (data.boundaryData) {
    // Validate boundary data structure
    if (!data.boundaryData.coordinates || !Array.isArray(data.boundaryData.coordinates)) {
      errors.push('Invalid boundary coordinates');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a shareable marking link token
 * @param propertyId - The property ID
 * @param ownerId - The owner ID
 * @returns A unique token for the shareable link
 */
export const generateMarkingToken = (propertyId: string, ownerId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${propertyId}-${ownerId}-${timestamp}-${random}`;
};

/**
 * Check if agent is within reasonable proximity to property
 * @param agentLat - Agent's latitude
 * @param agentLng - Agent's longitude
 * @param propertyLat - Property's latitude
 * @param propertyLng - Property's longitude
 * @param maxDistanceKm - Maximum distance in kilometers (default: 50km)
 * @returns true if within proximity, false otherwise
 */
export const isAgentWithinProximity = (
  agentLat: number,
  agentLng: number,
  propertyLat: number,
  propertyLng: number,
  maxDistanceKm: number = 50
): boolean => {
  const distance = calculateDistance(agentLat, agentLng, propertyLat, propertyLng);
  return distance <= maxDistanceKm;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export default {
  calculateTimeSlotExpiry,
  calculateMaxCompletionTime,
  calculateConfirmationDeadline,
  isTimeSlotExpired,
  isConfirmationDeadlinePassed,
  calculateAgentCommission,
  calculatePlatformFee,
  getPartialPaymentAmount,
  calculateRemainingPayment,
  calculatePartialPaymentCycles,
  getMarkingFee,
  getTimeSlotRemaining,
  getConfirmationTimeRemaining,
  shouldAutoCancelJob,
  calculateQueuePriority,
  formatTimeSlotExpiry,
  validateMarkingCompletion,
  generateMarkingToken,
  isAgentWithinProximity,
  calculateDistance,
};