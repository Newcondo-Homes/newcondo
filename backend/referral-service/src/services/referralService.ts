// backend/referral-service/src/services/referralService.ts

import { PrismaClient, ReferralStatus, ReferralType, Role } from '@newcondo/db';
import { 
  CreateReferralDTO, 
  ReferralDashboardData, 
  ReferralFilters,
  ReferralListResponse,
  ReferralStatistics,
  ReferralWithUsers,
  ValidateReferralCodeResult 
} from '../types';
import { generateReferralCode } from '../utils/codeGenerator';
import { buildAllShareLinks } from '../utils/linkBuilder';
import { determineReferralType } from '../utils/rewardCalculator';
import { REFERRAL_ELIGIBILITY, ROLE_REFERRAL_CAPABILITIES } from '../config/referralRules';

const prisma = new PrismaClient();

export class ReferralService {
  /**
   * Get or create referral code for a user
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // User already has a referral code
    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate new unique code
    let referralCode: string;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode },
      });
      isUnique = !existing;
    }

    // Update user with new code
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: referralCode! },
    });

    return referralCode!;
  }

  /**
   * Validate referral code and get referrer info
   */
  async validateReferralCode(code: string): Promise<ValidateReferralCodeResult> {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: {
        id: true,
        name: true,
        role: true,
        verificationStatus: true,
      },
    });

    if (!referrer) {
      return {
        isValid: false,
        error: 'Invalid referral code',
      };
    }

    // Check if referrer is eligible to refer
    const capabilities = ROLE_REFERRAL_CAPABILITIES[referrer.role];
    
    if (!capabilities.canRefer) {
      return {
        isValid: false,
        error: 'This user cannot make referrals',
      };
    }

    return {
      isValid: true,
      referrer: {
        id: referrer.id,
        name: referrer.name,
        role: referrer.role,
      },
    };
  }

  /**
   * Create a new referral
   */
  async createReferral(data: CreateReferralDTO & { referredId: string }): Promise<ReferralWithUsers> {
    const { referrerId, referredId, referralCode } = data;

    // Validate: prevent self-referral
    if (REFERRAL_ELIGIBILITY.PREVENT_SELF_REFERRAL && referrerId === referredId) {
      throw new Error('Cannot refer yourself');
    }

    // Check for existing referral
    if (REFERRAL_ELIGIBILITY.PREVENT_DUPLICATE_REFERRALS) {
      const existing = await prisma.referral.findUnique({
        where: { referredId },
      });

      if (existing) {
        throw new Error('User has already been referred');
      }
    }

    // Get referrer and referred user info
    const [referrer, referred] = await Promise.all([
      prisma.user.findUnique({ where: { id: referrerId } }),
      prisma.user.findUnique({ where: { id: referredId } }),
    ]);

    if (!referrer || !referred) {
      throw new Error('User not found');
    }

    // Determine referral type
    const referralType = determineReferralType(referrer.role, referred.role);

    if (!referralType) {
      throw new Error('Invalid referral combination');
    }

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referredId,
        referralCode: referralCode || referrer.referralCode,
        referralType,
        status: ReferralStatus.PENDING,
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

    return referral;
  }

  /**
   * Get referral dashboard data for a user
   */
  async getReferralDashboard(userId: string): Promise<ReferralDashboardData> {
    // Get or create referral code
    const referralCode = await this.getOrCreateReferralCode(userId);

    // Build share links
    const shareLinks = buildAllShareLinks(referralCode);

    // Get statistics
    const statistics = await this.getReferralStatistics(userId);

    // Get recent referrals
    const recentReferrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referrer: {
          select: { id: true, name: true, email: true, role: true },
        },
        referred: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get reward balances
    const rewards = await prisma.referralReward.findMany({
      where: { userId },
      select: {
        amount: true,
        isRedeemed: true,
        isPaidOut: true,
        status: true,
      },
    });

    const availableRewards = rewards
      .filter(r => r.status === 'APPROVED' && !r.isRedeemed)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const pendingRewards = rewards
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      referralCode,
      referralLink: shareLinks.direct,
      shareLinks,
      statistics,
      recentReferrals,
      availableRewards,
      pendingRewards,
    };
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStatistics(userId: string): Promise<ReferralStatistics> {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        rewards: {
          where: { userId },
        },
      },
    });

    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter(r => r.status === ReferralStatus.PENDING).length;
    const qualifiedReferrals = referrals.filter(r => r.qualificationMet).length;
    const rewardedReferrals = referrals.filter(r => r.status === ReferralStatus.REWARDED).length;

    const totalEarnings = referrals.reduce((sum, r) => {
      return sum + r.rewards.reduce((rewardSum, reward) => {
        return rewardSum + (reward.isPaidOut ? Number(reward.amount) : 0);
      }, 0);
    }, 0);

    const conversionRate = totalReferrals > 0 ? (qualifiedReferrals / totalReferrals) * 100 : 0;

    return {
      totalReferrals,
      pendingReferrals,
      qualifiedReferrals,
      rewardedReferrals,
      totalEarnings,
      conversionRate,
    };
  }

  /**
   * Get referrals with filters and pagination
   */
  async getReferrals(
    userId: string,
    filters: ReferralFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ReferralListResponse> {
    const where: any = { referrerId: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.referralType) {
      where.referralType = filters.referralType;
    }

    if (filters.qualificationMet !== undefined) {
      where.qualificationMet = filters.qualificationMet;
    }

    if (filters.rewardPaid !== undefined) {
      where.referrerRewardPaid = filters.rewardPaid;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          referrer: {
            select: { id: true, name: true, email: true, role: true },
          },
          referred: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.referral.count({ where }),
    ]);

    return {
      referrals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update referral status
   */
  async updateReferralStatus(referralId: string, status: ReferralStatus): Promise<void> {
    await prisma.referral.update({
      where: { id: referralId },
      data: { 
        status,
        ...(status === ReferralStatus.QUALIFIED && {
          qualificationMet: true,
          qualifiedAt: new Date(),
        }),
      },
    });
  }

  /**
   * Track referral click
   */
  async trackClick(referralCode: string): Promise<void> {
    await prisma.referral.updateMany({
      where: { referralCode },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get referral by referred user ID
   */
  async getReferralByReferredId(referredId: string): Promise<ReferralWithUsers | null> {
    const referral = await prisma.referral.findUnique({
      where: { referredId },
      include: {
        referrer: {
          select: { id: true, name: true, email: true, role: true },
        },
        referred: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return referral;
  }
}

export default new ReferralService();