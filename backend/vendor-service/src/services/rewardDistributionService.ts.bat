// backend/payment-service/src/services/rewardDistributionService.ts

import { PrismaClient } from '@prisma/client';
import { 
  calculateReferralReward, 
  determineReferralType,
  checkReferralQualification 
} from '../../../shared/src/utils/referralTracking';
import { getUserTier, calculateRewardWithBonus, getMilestoneReward } from '../../../shared/src/constants/rewardTiers';
import { referralNotificationService } from '../../../notification-service/src/services/referralNotificationService';

const prisma = new PrismaClient();

interface ProcessReferralQualificationData {
  referralId: string;
  referredUserId: string;
}

interface DistributeCommissionData {
  rentalId: string;
  propertyId: string;
  rentAmount: number;
  hasSubAgent: boolean;
  listingAgentId?: string;
  subAgentId?: string;
  ownerId: string;
}

class RewardDistributionService {
  /**
   * Process referral qualification and distribute rewards
   */
  async processReferralQualification(data: ProcessReferralQualificationData): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { id: data.referralId },
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

    // Check if referred user meets qualification criteria
    const qualification = checkReferralQualification({
      role: referral.referred.role,
      isPremium: referral.referred.isPremium,
      hasCompletedPayment: true, // Check from payments
      verificationStatus: referral.referred.verificationStatus,
    });

    if (!qualification.qualified) {
      throw new Error(qualification.reason || 'Referral not qualified');
    }

    // Determine referral type
    const referralType = determineReferralType(
      referral.referrer.role,
      referral.referred.role
    );

    // Calculate rewards based on type and tier
    const baseRewards = calculateReferralReward(referralType);
    
    // Get referrer's tier and apply bonus
    const referrerTotalReferrals = await this.getUserReferralCount(referral.referrerId);
    const referrerTier = getUserTier(referrerTotalReferrals);
    
    const referrerReward = calculateRewardWithBonus(
      baseRewards.referrerReward,
      referrerTier.bonusMultiplier
    );
    const referredReward = baseRewards.referredReward;

    // Update referral status
    await prisma.referral.update({
      where: { id: data.referralId },
      data: {
        qualificationMet: true,
        qualifiedAt: new Date(),
        status: 'QUALIFIED',
        referralType: referralType as any,
        referrerReward,
        referredReward,
        rewardType: 'SERVICE_CREDIT',
      },
    });

    // Create reward records
    await this.createRewardRecords({
      referralId: data.referralId,
      referrerId: referral.referrerId,
      referredId: referral.referredId,
      referrerReward,
      referredReward,
      referralType,
    });

    // Check for milestone achievements
    await this.checkAndAwardMilestones(referral.referrerId, referrerTotalReferrals + 1);

    // Send notifications
    await this.sendQualificationNotifications({
      referral,
      referrerReward,
      referredReward,
      referralType,
      referrerTier: referrerTier.name,
    });
  }

  /**
   * Create reward records for referrer and referred
   */
  private async createRewardRecords(data: {
    referralId: string;
    referrerId: string;
    referredId: string;
    referrerReward: number;
    referredReward: number;
    referralType: string;
  }): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365); // 1 year expiry

    // Create referrer reward
    await prisma.referralReward.create({
      data: {
        userId: data.referrerId,
        referralId: data.referralId,
        rewardType: 'SERVICE_CREDIT',
        amount: data.referrerReward,
        description: `Referral reward for ${data.referralType}`,
        status: 'APPROVED',
        expiresAt: expiryDate,
      },
    });

    // Create referred reward
    await prisma.referralReward.create({
      data: {
        userId: data.referredId,
        referralId: data.referralId,
        rewardType: 'SERVICE_CREDIT',
        amount: data.referredReward,
        description: `Welcome reward for joining via referral`,
        status: 'APPROVED',
        expiresAt: expiryDate,
      },
    });

    // Send reward earned notifications
    const [referrer, referred] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.referrerId } }),
      prisma.user.findUnique({ where: { id: data.referredId } }),
    ]);

    if (referrer) {
      await referralNotificationService.notifyRewardEarned({
        userId: referrer.id,
        userName: referrer.name || 'User',
        userEmail: referrer.email,
        rewardId: 'temp',
        rewardAmount: data.referrerReward,
        rewardType: 'Service Credit',
        rewardSource: 'Referral Program',
        previousBalance: 0,
        newBalance: data.referrerReward,
      });
    }

    if (referred) {
      await referralNotificationService.notifyRewardEarned({
        userId: referred.id,
        userName: referred.name || 'User',
        userEmail: referred.email,
        rewardId: 'temp',
        rewardAmount: data.referredReward,
        rewardType: 'Service Credit',
        rewardSource: 'Welcome Bonus',
        previousBalance: 0,
        newBalance: data.referredReward,
      });
    }
  }

  /**
   * Check and award milestone rewards
   */
  private async checkAndAwardMilestones(userId: string, totalReferrals: number): Promise<void> {
    const milestone = getMilestoneReward(totalReferrals);
    
    if (!milestone) return;

    // Check if milestone already awarded
    const existingMilestone = await prisma.referralReward.findFirst({
      where: {
        userId,
        description: { contains: milestone.name },
      },
    });

    if (existingMilestone) return;

    // Award milestone reward
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);

    await prisma.referralReward.create({
      data: {
        userId,
        rewardType: milestone.rewardType as any,
        amount: milestone.rewardAmount,
        description: `${milestone.name} Milestone - ${milestone.description}`,
        status: 'APPROVED',
        expiresAt: expiryDate,
      },
    });

    // Send notification
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await referralNotificationService.notifyRewardEarned({
        userId: user.id,
        userName: user.name || 'User',
        userEmail: user.email,
        rewardId: 'milestone',
        rewardAmount: milestone.rewardAmount,
        rewardType: milestone.rewardType,
        rewardSource: 'Milestone Achievement',
        previousBalance: 0,
        newBalance: milestone.rewardAmount,
        milestone: {
          name: milestone.name,
          description: milestone.description,
        },
      });
    }
  }

  /**
   * Distribute commission from rental payment
   */
  async distributeCommission(data: DistributeCommissionData): Promise<void> {
    const platformCommissionRate = 0.2; // 20%
    const totalCommission = data.rentAmount * platformCommissionRate;

    // Get virtual accounts
    const [ownerVirtualAccount, listingAgentVirtualAccount, subAgentVirtualAccount, platformVirtualAccount] = 
      await Promise.all([
        this.getOrCreateVirtualAccount(data.ownerId, data.propertyId),
        data.listingAgentId ? this.getOrCreateVirtualAccount(data.listingAgentId) : null,
        data.subAgentId ? this.getOrCreateVirtualAccount(data.subAgentId) : null,
        this.getPlatformVirtualAccount(),
      ]);

    let listingAgentCommission = 0;
    let subAgentCommission = 0;
    let platformCommission = 0;
    const ownerAmount = data.rentAmount - totalCommission;

    if (data.hasSubAgent && data.listingAgentId && data.subAgentId) {
      // Split 50/50 between listing agent and sub-agent
      listingAgentCommission = totalCommission * 0.5;
      subAgentCommission = totalCommission * 0.5;
      platformCommission = 0;
    } else if (data.listingAgentId) {
      // 50% to listing agent, 50% to platform
      listingAgentCommission = totalCommission * 0.5;
      platformCommission = totalCommission * 0.5;
    } else {
      // All commission to platform
      platformCommission = totalCommission;
    }

    // Distribute funds to virtual accounts
    await prisma.$transaction([
      // Credit owner
      prisma.virtualAccount.update({
        where: { id: ownerVirtualAccount.id },
        data: { balance: { increment: ownerAmount } },
      }),
      // Credit listing agent if applicable
      ...(listingAgentVirtualAccount ? [
        prisma.virtualAccount.update({
          where: { id: listingAgentVirtualAccount.id },
          data: { balance: { increment: listingAgentCommission } },
        }),
      ] : []),
      // Credit sub-agent if applicable
      ...(subAgentVirtualAccount ? [
        prisma.virtualAccount.update({
          where: { id: subAgentVirtualAccount.id },
          data: { balance: { increment: subAgentCommission } },
        }),
      ] : []),
      // Credit platform
      ...(platformCommission > 0 ? [
        prisma.virtualAccount.update({
          where: { id: platformVirtualAccount.id },
          data: { balance: { increment: platformCommission } },
        }),
      ] : []),
    ]);
  }

  /**
   * Get or create virtual account for user
   */
  private async getOrCreateVirtualAccount(
    userId: string,
    propertyId?: string
  ): Promise<any> {
    let virtualAccount = await prisma.virtualAccount.findFirst({
      where: {
        userId,
        propertyId: propertyId || null,
      },
    });

    if (!virtualAccount) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      virtualAccount = await prisma.virtualAccount.create({
        data: {
          userId,
          propertyId: propertyId || null,
          accountNumber: `VA${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
          accountName: user.name || 'NewCondo User',
          bankCode: '000',
          balance: 0,
        },
      });
    }

    return virtualAccount;
  }

  /**
   * Get platform virtual account
   */
  private async getPlatformVirtualAccount(): Promise<any> {
    // This should be a dedicated platform account
    // For now, we'll use a special account
    let platformAccount = await prisma.virtualAccount.findFirst({
      where: { accountNumber: 'PLATFORM_MAIN' },
    });

    if (!platformAccount) {
      platformAccount = await prisma.virtualAccount.create({
        data: {
          accountNumber: 'PLATFORM_MAIN',
          accountName: 'NewCondo Platform',
          bankCode: '000',
          userId: 'PLATFORM', // Special user ID
          balance: 0,
        },
      });
    }

    return platformAccount;
  }

  /**
   * Get user's total referral count
   */
  private async getUserReferralCount(userId: string): Promise<number> {
    return await prisma.referral.count({
      where: {
        referrerId: userId,
        qualificationMet: true,
      },
    });
  }

  /**
   * Send qualification notifications
   */
  private async sendQualificationNotifications(data: {
    referral: any;
    referrerReward: number;
    referredReward: number;
    referralType: string;
    referrerTier: string;
  }): Promise<void> {
    const stats = await this.getUserReferralStats(data.referral.referrerId);

    await referralNotificationService.notifyReferralQualified({
      referrerId: data.referral.referrerId,
      referrerName: data.referral.referrer.name || 'User',
      referrerEmail: data.referral.referrer.email,
      referredName: data.referral.referred.name || 'User',
      referredRole: data.referral.referred.role,
      referralCode: data.referral.referralCode,
      referralType: data.referralType,
      rewardAmount: data.referrerReward,
      rewardType: 'Service Credit',
      rewardStatus: 'Approved',
      totalReferrals: stats.totalReferrals,
      qualifiedReferrals: stats.qualifiedReferrals,
      totalEarnings: stats.totalEarnings,
    });
  }

  /**
   * Get user referral stats
   */
  private async getUserReferralStats(userId: string): Promise<any> {
    const [totalReferrals, qualifiedReferrals, rewards] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId, qualificationMet: true } }),
      prisma.referralReward.aggregate({
        where: { userId, status: 'APPROVED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalReferrals,
      qualifiedReferrals,
      totalEarnings: Number(rewards._sum.amount || 0),
    };
  }

  /**
   * Process agent referral commission
   */
  async processAgentReferralCommission(data: {
    agentReferralId: string;
    paymentId: string;
    rentAmount: number;
  }): Promise<void> {
    const agentReferral = await prisma.agentReferral.findUnique({
      where: { id: data.agentReferralId },
      include: { agent: true },
    });

    if (!agentReferral) {
      throw new Error('Agent referral not found');
    }

    // Calculate commission (from platform's 20% cut)
    const commission = data.rentAmount * 0.2 * 0.5; // 50% of 20% = 10%

    // Create conversion record
    await prisma.agentReferralConversion.create({
      data: {
        referralId: data.agentReferralId,
        paymentId: data.paymentId,
        amount: data.rentAmount,
        commission,
      },
    });

    // Update agent referral stats
    await prisma.agentReferral.update({
      where: { id: data.agentReferralId },
      data: {
        totalEarnings: { increment: commission },
      },
    });
  }
}

export const rewardDistributionService = new RewardDistributionService();