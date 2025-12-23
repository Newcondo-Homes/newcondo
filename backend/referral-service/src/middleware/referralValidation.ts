// backend/referral-service/src/middleware/referralValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isValidReferralCode } from '../utils/codeGenerator';

// Validation schemas
const createReferralSchema = z.object({
  referredEmail: z.string().email('Invalid email address'),
  referralCode: z.string().optional(),
});

const trackClickSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required'),
  sessionId: z.string().optional(),
  referrerUrl: z.string().url().optional(),
  landingPage: z.string().url().optional(),
});

const qualifyReferralSchema = z.object({
  referralId: z.string().cuid('Invalid referral ID'),
  qualificationData: z.object({
    paymentId: z.string().cuid().optional(),
    subscriptionId: z.string().cuid().optional(),
    transactionAmount: z.number().positive().optional(),
  }).optional(),
});

const redeemRewardSchema = z.object({
  rewardId: z.string().cuid('Invalid reward ID'),
  redemptionType: z.enum(['auto', 'manual']),
  targetAccount: z.string().optional(),
});

const applyRewardSchema = z.object({
  rewardId: z.string().cuid('Invalid reward ID'),
  targetTransaction: z.object({
    type: z.enum(['rent', 'subscription', 'service']),
    amount: z.number().positive(),
    transactionId: z.string().cuid(),
  }),
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const referralFiltersSchema = z.object({
  status: z.enum(['PENDING', 'QUALIFIED', 'REWARDED', 'EXPIRED', 'CANCELLED']).optional(),
  referralType: z.enum([
    'OWNER_TO_OWNER',
    'OWNER_TO_AGENT',
    'OWNER_TO_RENTER',
    'AGENT_TO_OWNER',
    'AGENT_TO_AGENT',
    'AGENT_TO_RENTER',
    'RENTER_TO_RENTER'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  qualificationMet: z.string().transform(val => val === 'true').optional(),
  rewardPaid: z.string().transform(val => val === 'true').optional(),
});

/**
 * Validate create referral request
 */
export const validateCreateReferral = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = createReferralSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.format(),
        },
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate referral code
 */
export const validateReferralCode = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.params;
    
    if (!code || !isValidReferralCode(code)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERRAL_CODE',
          message: 'Invalid referral code format',
        },
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate track click request
 */
export const validateTrackClick = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = trackClickSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid tracking data',
          details: result.error.format(),
        },
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate qualify referral request
 */
export const validateQualifyReferral = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = qualifyReferralSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid qualification data',
          details: result.error.format(),
        },
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate redeem reward request
 */
export const validateRedeemReward = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = redeemRewardSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid redemption data',
          details: result.error.format(),
        },
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate apply reward request
 */
export const validateApplyReward = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = applyRewardSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reward application data',
          details: result.error.format(),
        },
      });
    }
    
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = paginationSchema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters',
          details: result.error.format(),
        },
      });
    }
    
    req.query = result.data as any;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate referral filters
 */
export const validateReferralFilters = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = referralFiltersSchema.safeParse(req.query);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          details: result.error.format(),
        },
      });
    }
    
    req.query = result.data as any;
    next();
  } catch (error) {
    next(error);
  }
};