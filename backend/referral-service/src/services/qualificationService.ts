// backend/referral-service/src/services/qualificationService.ts

import { PrismaClient, ReferralStatus, ReferralType, Role } from '@newcondo/db';
import { ReferralEligibilityCheck } from '../types';
import { QUALIFICATION_REQUIREMENTS } from '../config/rewards';
import { ROLE_REFERRAL_CAPABILITIES, REFERRAL_ELIGIBILITY } from '../config/referralRules';
import { getDaysDifference } from '../utils/dateHelpers';
import { calculateRewardAmounts } from '../utils/rewardCalculator';
import rewardService from './rewardService';

const prisma = new PrismaClient();

export class QualificationService {
  /**
   * Check if a user is eligible to refer
   */
  async checkReferralEligibility(userId: string): Promise<ReferralEligibilityCheck> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        payments: {
          where: { status: 'SUCCESS' },
          take: 1,
        },
        properties: {
          take: 1,
        },
      },
    });

    if (!user) {
      return {
        isEligible: false,
        reasons: ['User not found'],
        requirements: {},
      };
    }

    const reasons: string[] = [];
    const requirements: any = {};

    // Check role-based capabilities
    const capabilities = ROLE_REFERRAL_CAPABILITIES[user.role];
    
    if (!capabilities.canRefer) {
      reasons.push('Your role is not eligible to make referrals');
      return {
        isEligible: false,
        reasons,
        requirements,
      };
    }

    // Check verification status (if required)
    if (REFERRAL_ELIGIBILITY.REFERRER_MUST_BE_VERIFIED) {
      requirements.isVerified = user.verificationStatus === 'VERIFIED';
      if (!requirements.isVerified) {
        reasons.push('Your account must be verified to make referrals');
      }
    }

    // Check account age
    if (REFERRAL_ELIGIBILITY.MIN_ACCOUNT_AGE_DAYS > 0) {
      const accountAgeDays = getDaysDifference(user.createdAt, new Date());
      requirements.accountAge = accountAgeDays;
      
      if (accountAgeDays < REFERRAL_ELIGIBILITY.MIN_ACCOUNT_AGE_DAYS) {
        reasons.push(
          `Account must be at least ${REFERRAL_ELIGIBILITY.MIN_ACCOUNT_AGE_DAYS} days old (current: ${accountAgeDays} days)`
        );
      }
    }

    // Role-specific requirements
    if (user.role === Role.OWNER && capabilities.mustHaveActiveSubscription) {
      // Check for active subscription (this would need subscription logic)
      requirements.hasActiveSubscription = user.isPremium;
      
      if (!requirements.hasActiveSubscription) {
        reasons.push('You must have an active subscription to make referrals');
      }
    }

    if (user.role === Role.AGENT && capabilities.mustHaveCompletedTransaction) {
      // Check for completed transactions
      const hasCompletedTransaction = user.properties.length > 0 || user.payments.length > 0;
      requirements.hasCompletedTransaction = hasCompletedTransaction;
      
      if (!hasCompletedTransaction) {
        reasons.push('You must complete at least one transaction to make referrals');
      }
    }

    if (user.role === Role.RENTER && ROLE_REFERRAL_CAPABILITIES[Role.RENTER].mustHaveCompletedPayment) {
      // Check for completed payments
      requirements.hasCompletedPayment = user.payments.length > 0;
      
      if (!requirements.hasCompletedPayment) {
        reasons.push('You must complete at least one payment to make referrals');
      }
    }

    const isEligible = reasons.length === 0;

    return {
      isEligible,
      reasons,
      requirements,
    };
  }

  /**
   * Check if a referral qualifies for rewards
   */
  async checkReferralQualification(referralId: string): Promise<boolean> {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer: true,
        referred: true,
      },
    });

    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.qualificationMet) {
      return true;
    }

    const requirements = QUALIFICATION_REQUIREMENTS[referral.referralType!];
    
    if (!requirements) {
      return false;
    }

    // Check based on referral type
    if (requirements.referredMustPaySubscription) {
      const hasSubscription = await this.checkSubscriptionPayment(
        referral.referredId,
        requirements.minimumSubscriptionMonths
      );
      
      if (!hasSubscription) {
        return false;
      }
    }

    if (requirements.referredMustCompleteTransaction) {
      const hasTransaction = await this.checkCompletedTransaction(
        referral.referredId,
        requirements.minimumTransactionAmount
      );
      
      if (!hasTransaction) {
        return false;
      }
    }

    if (requirements.referredMustPayRent) {
      const hasRentPayment = await this.checkRentPayment(
        referral.referredId,
        requirements.minimumRentAmount
      );
      
      if (!hasRentPayment) {
        return false;
      }
    }

    return true;
  }

  /**
   * Qualify a referral and create rewards
   */
  async qualifyReferral(referralId: string, metadata?: any): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer: true,
        referred: true,
      },
    });

    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.qualificationMet) {
      throw new Error('Referral already qualified');
    }

    // Check qualification
    const isQualified = await this.checkReferralQualification(referralId);
    
    if (!isQualified) {
      throw new Error('Referral does not meet qualification requirements');
    }

    // Calculate rewards
    const rewardCalculation = calculateRewardAmounts(referral.referralType!);

    // Update referral status
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        qualificationMet: true,
        qualifiedAt: new Date(),
        status: ReferralStatus.QUALIFIED,
        referrerReward: rewardCalculation.referrerAmount,
        referredReward: rewardCalculation.referredAmount,
      },
    });

    // Create reward for referrer
    await rewardService.createReward({
      userId: referral.referrerId,
      referralId,
      rewardType: rewardCalculation.referralType as any,
      amount: rewardCalculation.referrerAmount,
      description: `Referrer reward: ${rewardCalculation.description}`,
      expiresAt: rewardCalculation.expiryDays
        ? new Date(Date.now() + rewardCalculation.expiryDays * 24 * 60 * 60 * 1000)
        : undefined,
      metadata: {
        ...metadata,
        referralType: referral.referralType,
        recipientType: 'referrer',
      },
    });

    // Create reward for referred user
    await rewardService.createReward({
      userId: referral.referredId,
      referralId,
      rewardType: rewardCalculation.referralType as any,
      amount: rewardCalculation.referredAmount,
      description: `Referred user reward: ${rewardCalculation.description}`,
      expiresAt: rewardCalculation.expiryDays
        ? new Date(Date.now() + rewardCalculation.expiryDays * 24 * 60 * 60 * 1000)
        : undefined,
      metadata: {
        ...metadata,
        referralType: referral.referralType,
        recipientType: 'referred',
      },
    });

    // Auto-approve rewards
    const rewards = await prisma.referralReward.findMany({
      where: { referralId },
    });

    for (const reward of rewards) {
      await rewardService.approveReward(reward.id);
    }

    // Update referral to rewarded status
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: ReferralStatus.REWARDED,
      },
    });
  }

  /**
   * Check if user has paid subscription
   */
  private async checkSubscriptionPayment(userId: string, minimumMonths: number): Promise<boolean> {
    const payments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS',
        paymentType: 'PREMIUM_UPGRADE',
      },
      orderBy: { paidAt: 'desc' },
      take: 1,
    });

    return payments.length > 0;
  }

  /**
   * Check if user has completed a transaction
   */
  private async checkCompletedTransaction(userId: string, minimumAmount: number): Promise<boolean> {
    const transactions = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS',
        amount: { gte: minimumAmount },
      },
      take: 1,
    });

    return transactions.length > 0;
  }

  /**
   * Check if user has paid rent
   */
  private async checkRentPayment(userId: string, minimumAmount: number): Promise<boolean> {
    const rentPayments = await prisma.payment.findMany({
      where: {
        userId,
        status: 'SUCCESS',
        paymentType: 'RENT',
        amount: { gte: minimumAmount },
      },
      take: 1,
    });

    return rentPayments.length > 0;
  }
}

export default new QualificationService();