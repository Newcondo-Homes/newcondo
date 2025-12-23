// backend/referral-service/src/services/rewardService.ts

import { PrismaClient, RewardStatus, RewardType } from '@newcondo/db';
import {
  CreateRewardDTO,
  RewardBalanceResponse,
  RewardFilters,
  RewardListResponse,
  RewardSummary,
  ApplyRewardDTO,
  PayoutRewardDTO,
} from '../types';
import { calculateRewardExpiryDate } from '../utils/rewardCalculator';
import { isExpired } from '../utils/dateHelpers';
import { PAYOUT_SETTINGS } from '../config/rewards';

const prisma = new PrismaClient();

export class RewardService {
  /**
   * Create a new reward
   */
  async createReward(data: CreateRewardDTO): Promise<void> {
    const { userId, referralId, rewardType, amount, description, expiresAt, metadata } = data;

    await prisma.referralReward.create({
      data: {
        userId,
        referralId,
        rewardType,
        amount,
        description,
        status: RewardStatus.PENDING,
        expiresAt,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Approve a reward
   */
  async approveReward(rewardId: string): Promise<void> {
    await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.APPROVED,
      },
    });

    // Auto-payout if enabled
    if (PAYOUT_SETTINGS.AUTO_PAYOUT_ENABLED) {
      await this.processAutoPayout(rewardId);
    }
  }

  /**
   * Reject a reward
   */
  async rejectReward(rewardId: string, reason?: string): Promise<void> {
    await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.REJECTED,
        metadata: {
          rejectionReason: reason,
        },
      },
    });
  }

  /**
   * Get reward balance for a user
   */
  async getRewardBalance(userId: string): Promise<RewardBalanceResponse> {
    const rewards = await prisma.referralReward.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        rewardType: true,
        status: true,
        isRedeemed: true,
        expiresAt: true,
      },
    });

    // Calculate total balance
    const totalBalance = rewards.reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate available balance (approved and not redeemed)
    const availableBalance = rewards
      .filter(r => r.status === RewardStatus.APPROVED && !r.isRedeemed && !isExpired(r.expiresAt))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate pending balance
    const pendingBalance = rewards
      .filter(r => r.status === RewardStatus.PENDING)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Get expiring soon rewards (within 7 days)
    const expiringSoon = rewards
      .filter(r => {
        if (!r.expiresAt || r.isRedeemed || r.status !== RewardStatus.APPROVED) return false;
        const daysUntilExpiry = Math.ceil(
          (r.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      })
      .map(r => ({
        amount: Number(r.amount),
        expiryDate: r.expiresAt!,
      }));

    // Group by reward type
    const rewardsByType: Record<RewardType, number> = {} as any;
    rewards
      .filter(r => r.status === RewardStatus.APPROVED && !r.isRedeemed)
      .forEach(r => {
        rewardsByType[r.rewardType] = (rewardsByType[r.rewardType] || 0) + Number(r.amount);
      });

    return {
      userId,
      totalBalance,
      availableBalance,
      pendingBalance,
      expiringSoon,
      rewardsByType,
    };
  }

  /**
   * Get reward summary
   */
  async getRewardSummary(userId: string): Promise<RewardSummary> {
    const rewards = await prisma.referralReward.findMany({
      where: { userId },
    });

    const totalRewards = rewards.length;
    const pendingRewards = rewards.filter(r => r.status === RewardStatus.PENDING).length;
    const approvedRewards = rewards.filter(r => r.status === RewardStatus.APPROVED).length;
    const redeemedRewards = rewards.filter(r => r.isRedeemed).length;
    const expiredRewards = rewards.filter(r => isExpired(r.expiresAt)).length;

    const totalAmount = rewards.reduce((sum, r) => sum + Number(r.amount), 0);
    const availableAmount = rewards
      .filter(r => r.status === RewardStatus.APPROVED && !r.isRedeemed && !isExpired(r.expiresAt))
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const redeemedAmount = rewards
      .filter(r => r.isRedeemed)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      totalRewards,
      pendingRewards,
      approvedRewards,
      redeemedRewards,
      expiredRewards,
      totalAmount,
      availableAmount,
      redeemedAmount,
    };
  }

  /**
   * Get rewards with filters and pagination
   */
  async getRewards(
    userId: string,
    filters: RewardFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<RewardListResponse> {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.rewardType) {
      where.rewardType = filters.rewardType;
    }

    if (filters.isRedeemed !== undefined) {
      where.isRedeemed = filters.isRedeemed;
    }

    if (filters.isPaidOut !== undefined) {
      where.isPaidOut = filters.isPaidOut;
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

    if (filters.expiringBefore) {
      where.expiresAt = {
        lte: filters.expiringBefore,
        gte: new Date(),
      };
    }

    const [rewards, total] = await Promise.all([
      prisma.referralReward.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.referralReward.count({ where }),
    ]);

    const summary = await this.getRewardSummary(userId);

    return {
      rewards,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Apply reward to a transaction
   */
  async applyReward(data: ApplyRewardDTO): Promise<{ discountApplied: number; remainingReward: number }> {
    const { userId, rewardId, targetTransaction } = data;

    // Get the reward
    const reward = await prisma.referralReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (reward.status !== RewardStatus.APPROVED) {
      throw new Error('Reward is not approved');
    }

    if (reward.isRedeemed) {
      throw new Error('Reward has already been redeemed');
    }

    if (isExpired(reward.expiresAt)) {
      throw new Error('Reward has expired');
    }

    // Calculate discount
    const rewardAmount = Number(reward.amount);
    const discountApplied = Math.min(rewardAmount, targetTransaction.amount);
    const remainingReward = rewardAmount - discountApplied;

    // Mark reward as redeemed
    await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        metadata: {
          ...(reward.metadata as object),
          redemptionDetails: {
            transactionType: targetTransaction.type,
            transactionId: targetTransaction.transactionId,
            originalAmount: targetTransaction.amount,
            discountApplied,
          },
        },
      },
    });

    return {
      discountApplied,
      remainingReward,
    };
  }

  /**
   * Process payout for a reward
   */
  async processRewardPayout(data: PayoutRewardDTO): Promise<void> {
    const { rewardId, payoutMethod, payoutReference } = data;

    await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        isPaidOut: true,
        paidOutAt: new Date(),
        payoutReference,
        metadata: {
          payoutMethod,
        },
      },
    });
  }

  /**
   * Auto-process payout for approved rewards
   */
  private async processAutoPayout(rewardId: string): Promise<void> {
    const reward = await prisma.referralReward.findUnique({
      where: { id: rewardId },
      include: {
        user: {
          select: {
            virtualAccounts: true,
          },
        },
      },
    });

    if (!reward || reward.status !== RewardStatus.APPROVED) {
      return;
    }

    // Check if user has virtual account
    const virtualAccount = reward.user.virtualAccounts[0];
    
    if (virtualAccount) {
      // Credit virtual account
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: reward.amount,
          },
        },
      });

      // Mark as paid out
      await this.processRewardPayout({
        rewardId,
        payoutMethod: 'virtual_account',
        payoutReference: `VA-${virtualAccount.accountNumber}`,
      });
    }
  }

  /**
   * Expire old rewards
   */
  async expireOldRewards(): Promise<number> {
    const result = await prisma.referralReward.updateMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        status: RewardStatus.APPROVED,
        isRedeemed: false,
      },
      data: {
        status: RewardStatus.EXPIRED,
      },
    });

    return result.count;
  }
}

export default new RewardService();