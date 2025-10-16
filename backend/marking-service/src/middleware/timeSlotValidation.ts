import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/src/utils/response';

/**
 * Constants for time slot management
 */
export const TIME_SLOT_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
export const MAX_CONFIRMATION_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
export const MIN_TIME_SLOT_BUFFER = 15 * 60 * 1000; // 15 minutes buffer

/**
 * Middleware to validate if a marking job is within its time slot
 * Used when agent attempts to complete a marking job
 */
export const validateTimeSlotActive = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeSlotExpiry } = req.body;

    if (!timeSlotExpiry) {
      return res.status(400).json(
        ApiResponse.error('Time slot expiry information is required')
      );
    }

    const expiryTime = new Date(timeSlotExpiry).getTime();
    const currentTime = Date.now();

    if (currentTime > expiryTime) {
      return res.status(400).json(
        ApiResponse.error('Marking job time slot has expired', {
          expiredAt: new Date(expiryTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
          timeSlotDuration: `${TIME_SLOT_DURATION / (60 * 60 * 1000)} hours`,
        })
      );
    }

    // Calculate remaining time
    const remainingTime = expiryTime - currentTime;
    const remainingMinutes = Math.floor(remainingTime / (60 * 1000));

    if (remainingTime < MIN_TIME_SLOT_BUFFER) {
      return res.status(400).json(
        ApiResponse.error('Insufficient time remaining to complete marking job', {
          remainingMinutes,
          minimumRequiredMinutes: MIN_TIME_SLOT_BUFFER / (60 * 1000),
        })
      );
    }

    next();
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error('Invalid time slot format', error instanceof Error ? error.message : undefined)
    );
  }
};

/**
 * Middleware to validate if property owner is within confirmation period
 * Property owner has 3 days from agent completion to confirm marking
 */
export const validateConfirmationPeriodActive = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { completedAt } = req.body;

    if (!completedAt) {
      return res.status(400).json(
        ApiResponse.error('Job completion timestamp is required')
      );
    }

    const completionTime = new Date(completedAt).getTime();
    const currentTime = Date.now();
    const timeSinceCompletion = currentTime - completionTime;

    if (timeSinceCompletion > MAX_CONFIRMATION_PERIOD) {
      return res.status(400).json(
        ApiResponse.error('Confirmation period has expired', {
          completedAt: new Date(completionTime).toISOString(),
          confirmationDeadline: new Date(completionTime + MAX_CONFIRMATION_PERIOD).toISOString(),
          confirmationPeriodDays: MAX_CONFIRMATION_PERIOD / (24 * 60 * 60 * 1000),
        })
      );
    }

    // Calculate remaining time for owner confirmation
    const remainingTime = MAX_CONFIRMATION_PERIOD - timeSinceCompletion;
    const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
    const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));

    (req as any).confirmationData = {
      remainingTime,
      remainingDays,
      remainingHours,
      deadline: new Date(completionTime + MAX_CONFIRMATION_PERIOD),
    };

    next();
  } catch (error) {
    return res.status(400).json(
      ApiResponse.error('Invalid completion timestamp format', error instanceof Error ? error.message : undefined)
    );
  }
};

/**
 * Helper function to calculate time slot expiry
 */
export const calculateTimeSlotExpiry = (startTime: Date = new Date()): Date => {
  return new Date(startTime.getTime() + TIME_SLOT_DURATION);
};

/**
 * Helper function to calculate confirmation deadline
 */
export const calculateConfirmationDeadline = (completionTime: Date = new Date()): Date => {
  return new Date(completionTime.getTime() + MAX_CONFIRMATION_PERIOD);
};

/**
 * Helper function to check if time slot is still active
 */
export const isTimeSlotActive = (expiryTime: Date): boolean => {
  return expiryTime.getTime() > Date.now();
};

/**
 * Helper function to check if confirmation period is still active
 */
export const isConfirmationPeriodActive = (completionTime: Date): boolean => {
  const deadline = completionTime.getTime() + MAX_CONFIRMATION_PERIOD;
  return deadline > Date.now();
};

/**
 * Helper function to get remaining time in milliseconds
 */
export const getRemainingTimeSlot = (expiryTime: Date): number => {
  return Math.max(0, expiryTime.getTime() - Date.now());
};

/**
 * Helper function to get remaining confirmation time
 */
export const getRemainingConfirmationTime = (completionTime: Date): number => {
  const deadline = completionTime.getTime() + MAX_CONFIRMATION_PERIOD;
  return Math.max(0, deadline - Date.now());
};

/**
 * Middleware to attach time slot utilities to request
 */
export const attachTimeSlotUtilities = (req: Request, res: Response, next: NextFunction) => {
  (req as any).timeSlot = {
    calculateExpiry: calculateTimeSlotExpiry,
    calculateConfirmationDeadline,
    isActive: isTimeSlotActive,
    isConfirmationActive: isConfirmationPeriodActive,
    getRemainingTime: getRemainingTimeSlot,
    getRemainingConfirmation: getRemainingConfirmationTime,
    DURATION: TIME_SLOT_DURATION,
    CONFIRMATION_PERIOD: MAX_CONFIRMATION_PERIOD,
    BUFFER: MIN_TIME_SLOT_BUFFER,
  };

  next();
};