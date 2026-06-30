// backend/payment-service/src/middleware/referralCommissionMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import { referralCommissionService } from '../services/referralCommissionService';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Referral Commission Middleware
 * Auto-calculates and applies commissions on rent payments
 */

/**
 * Extract referral code from various sources
 */
function extractReferralCode(req: Request): string | null {
  // Check multiple sources for referral code
  const sources = [
    req.body.referralCode,
    req.query.ref,
    req.query.referralCode,
    req.cookies?.nc_agent_ref,
    req.cookies?.nc_ref_attr,
    req.referralAttribution?.referralCode,
    req.agentReferralAttribution?.referralCode,
  ];

  for (const source of sources) {
    if (source && typeof source === 'string') {
      return source;
    }
  }

  return null;
}

/**
 * Main middleware to calculate and apply commissions
 */
export async function calculateCommissionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Only process for successful rent payments
    if (req.body.paymentType !== 'RENT') {
      return next();
    }

    const { propertyId, unitId, amount, renterId } = req.body;

    if (!propertyId || !amount || !renterId) {
      return next();
    }

    // Extract referral code
    const referralCode = extractReferralCode(req);

    // Calculate commission breakdown
    const breakdown = await referralCommissionService.calculateCommissions({
      paymentId: req.body.paymentId || 'PENDING', // Will be updated after payment creation
      propertyId,
      unitId,
      rentAmount: new Decimal(amount),
      renterId,
      referralCode: referralCode || undefined,
    });

    // Store breakdown in request for later use
    req.commissionBreakdown = breakdown;

    // Add commission details to response locals
    res.locals.commissionBreakdown = breakdown;

    // Log commission calculation
    console.log('[Commission Middleware] Calculated commissions:', {
      propertyId,
      totalRent: breakdown.totalRent.toString(),
      platformCommission: breakdown.platformCommission.toString(),
      listingAgentCommission: breakdown.listingAgentCommission?.toString(),
      subAgentCommission: breakdown.subAgentCommission?.toString(),
      newCondoAmount: breakdown.newCondoAmount.toString(),
    });

    next();
  } catch (error) {
    console.error('[Commission Middleware] Error calculating commissions:', error);
    // Don't block the payment if commission calculation fails
    next();
  }
}

/**
 * Middleware to apply commissions after successful payment
 */
export async function applyCommissionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const paymentId = res.locals.paymentId || req.body.paymentId;
    const breakdown = req.commissionBreakdown || res.locals.commissionBreakdown;

    if (!paymentId || !breakdown) {
      return next();
    }

    // Verify payment was successful
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { status: true },
    });

    if (!payment || payment.status !== 'SUCCESS') {
      return next();
    }

    // Distribute commissions to virtual accounts
    await referralCommissionService.distributeCommissions(paymentId, breakdown);

    console.log('[Commission Middleware] Commissions distributed for payment:', paymentId);

    // Check if this qualifies a referral
    const referralCode = extractReferralCode(req);
    if (referralCode) {
      await qualifyReferral(referralCode, req.body.renterId, paymentId);
    }

    next();
  } catch (error) {
    console.error('[Commission Middleware] Error applying commissions:', error);
    // Don't block the response if commission application fails
    next();
  }
}

/**
 * Qualify a referral when payment is successful
 */
async function qualifyReferral(
  referralCode: string,
  userId: string,
  paymentId: string
): Promise<void> {
  try {
    // Find referral by code and referred user
    const referral = await prisma.referral.findFirst({
      where: {
        referralCode,
        referredId: userId,
        status: 'PENDING',
        qualificationMet: false,
      },
      include: {
        referrer: {
          select: { id: true, name: true, email: true, role: true },
        },
        referred: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!referral) {
      console.log('[Commission Middleware] No pending referral found for code:', referralCode);
      return;
    }

    // Mark referral as qualified
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        qualificationMet: true,
        qualifiedAt: new Date(),
        status: 'QUALIFIED',
      },
    });

    console.log('[Commission Middleware] Referral qualified:', referral.id);

    // Create rewards for both referrer and referred
    await createReferralRewards(referral);

    // Log qualification event
    await prisma.eventLog.create({
      data: {
        userId: referral.referrerId,
        type: 'REFERRAL_QUALIFIED',
        metadata: {
          referralId: referral.id,
          referredUserId: userId,
          paymentId,
          referralType: referral.referralType,
        },
      },
    });
  } catch (error) {
    console.error('[Commission Middleware] Error qualifying referral:', error);
  }
}

/**
 * Create rewards for referrer and referred user
 */
async function createReferralRewards(referral: any): Promise<void> {
  try {
    const referralType = referral.referralType;
    const referrerRole = referral.referrer.role;
    const referredRole = referral.referred.role;

    // Calculate reward amounts based on referral type
    const { referrerReward, referredReward, rewardType } = calculateRewardAmounts(
      referralType || determineReferralType(referrerRole, referredRole),
      referrerRole,
      referredRole
    );

    // Create referrer reward
    if (referrerReward > 0) {
      const referrerRewardRecord = await prisma.referralReward.create({
        data: {
          userId: referral.referrerId,
          referralId: referral.id,
          rewardType,
          amount: referrerReward,
          description: `Referral reward for inviting ${referral.referred.name}`,
          status: 'APPROVED',
          isRedeemed: false,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      console.log('[Commission Middleware] Created referrer reward:', referrerRewardRecord.id);
    }

    // Create referred user reward
    if (referredReward > 0) {
      const referredRewardRecord = await prisma.referralReward.create({
        data: {
          userId: referral.referredId,
          referralId: referral.id,
          rewardType,
          amount: referredReward,
          description: `Welcome reward from ${referral.referrer.name}`,
          status: 'APPROVED',
          isRedeemed: false,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });

      console.log('[Commission Middleware] Created referred reward:', referredRewardRecord.id);
    }

    // Update referral with reward amounts
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referrerReward,
        referredReward,
        rewardType,
        referrerRewardPaid: false,
        referredRewardPaid: false,
        status: 'REWARDED',
      },
    });

    // Send notification to referrer
    await prisma.eventLog.create({
      data: {
        userId: referral.referrerId,
        type: 'REWARD_EARNED',
        metadata: {
          referralId: referral.id,
          amount: referrerReward.toString(),
          rewardType,
        },
      },
    });

    // Send notification to referred
    await prisma.eventLog.create({
      data: {
        userId: referral.referredId,
        type: 'REWARD_EARNED',
        metadata: {
          referralId: referral.id,
          amount: referredReward.toString(),
          rewardType,
        },
      },
    });
  } catch (error) {
    console.error('[Commission Middleware] Error creating rewards:', error);
  }
}

/**
 * Calculate reward amounts based on referral type
 */
function calculateRewardAmounts(
  referralType: string,
  referrerRole: string,
  referredRole: string
): {
  referrerReward: number;
  referredReward: number;
  rewardType: string;
} {
  // Reward structure from requirements
  const rewardMatrix: Record<string, { referrer: number; referred: number }> = {
    OWNER_TO_OWNER: { referrer: 10000, referred: 10000 },
    OWNER_TO_AGENT: { referrer: 5000, referred: 5000 },
    OWNER_TO_RENTER: { referrer: 2000, referred: 2000 },
    AGENT_TO_OWNER: { referrer: 5000, referred: 5000 },
    AGENT_TO_AGENT: { referrer: 3000, referred: 3000 },
    AGENT_TO_RENTER: { referrer: 5000, referred: 5000 },
    RENTER_TO_RENTER: { referrer: 2000, referred: 2000 },
  };

  const rewards = rewardMatrix[referralType] || { referrer: 5000, referred: 5000 };

  return {
    referrerReward: rewards.referrer,
    referredReward: rewards.referred,
    rewardType: 'SERVICE_CREDIT',
  };
}

/**
 * Determine referral type from user roles
 */
function determineReferralType(referrerRole: string, referredRole: string): string {
  return `${referrerRole}_TO_${referredRole}` as any;
}

/**
 * Middleware to track agent referral conversion
 */
export async function trackAgentReferralConversion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const agentReferralCode = req.cookies?.nc_agent_ref || req.body.agentReferralCode;
    const paymentId = res.locals.paymentId || req.body.paymentId;

    if (!agentReferralCode || !paymentId) {
      return next();
    }

    // Find agent referral
    const agentReferral = await prisma.agentReferral.findUnique({
      where: { referralCode: agentReferralCode },
    });

    if (!agentReferral) {
      return next();
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { amount: true, agentCommission: true },
    });

    if (!payment || !payment.agentCommission) {
      return next();
    }

    // Create conversion record
    await prisma.agentReferralConversion.create({
      data: {
        referralId: agentReferral.id,
        paymentId,
        amount: payment.amount,
        commission: payment.agentCommission,
        isPaid: false,
      },
    });

    // Update agent referral stats
    await prisma.agentReferral.update({
      where: { id: agentReferral.id },
      data: {
        totalEarnings: {
          increment: payment.agentCommission,
        },
      },
    });

    console.log('[Commission Middleware] Agent referral conversion tracked:', agentReferral.id);

    next();
  } catch (error) {
    console.error('[Commission Middleware] Error tracking agent conversion:', error);
    next();
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      commissionBreakdown?: any;
    }
  }
}