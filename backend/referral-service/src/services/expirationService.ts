// backend/referral-service/src/services/expirationService.ts

import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

/**
 * Expiration Service
 * Handles expiration of referrals and rewards
 */
class ExpirationService {
  // Expiration periods (in days)
  private readonly REFERRAL_EXPIRY_DAYS = 90; // Referral link valid for 90 days
  private readonly REWARD_EXPIRY_DAYS = 365; // Rewards expire after 1 year
  private readonly PENDING_REFERRAL_EXPIRY_DAYS = 30; // Pending referrals expire after 30 days

  /**
   * Expire old pending referrals
   */
  async expirePendingReferrals() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - this.PENDING_REFERRAL_EXPIRY_DAYS);

    const expiredReferrals = await prisma.referral.findMany({
      where: {
        status: 'PENDING',
        qualificationMet: false,
        createdAt: { lt: expiryDate },
        isActive: true,
      },
    });

    if (expiredReferrals.length === 0) {
      return { expired: 0, referrals: [] };
    }

    // Update referrals to expired status
    await prisma.referral.updateMany({
      where: {
        id: { in: expiredReferrals.map((r) => r.id) },
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
      },
    });

    // Log expiration
    await Promise.all(
      expiredReferrals.map((referral) =>
        prisma.eventLog.create({
          data: {
            userId: referral.referrerId,
            type: 'REFERRAL_EXPIRED',
            metadata: {
              referralId: referral.id,
              referredId: referral.referredId,
              reason: 'Pending referral not qualified within time limit',
            },
          },
        })
      )
    );

    return {
      expired: expiredReferrals.length,
      referrals: expiredReferrals.map((r) => r.id),
    };
  }

  /**
   * Expire unredeemed rewards
   */
  async expireUnredeemedRewards() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - this.REWARD_EXPIRY_DAYS);

    const expiredRewards = await prisma.referralReward.findMany({
      where: {
        status: 'APPROVED',
        isRedeemed: false,
        isPaidOut: false,
        createdAt: { lt: expiryDate },
        OR: [
          { expiresAt: null },
          { expiresAt: { lt: new Date() } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (expiredRewards.length === 0) {
      return { expired: 0, rewards: [] };
    }

    // Update rewards to expired status
    await prisma.referralReward.updateMany({
      where: {
        id: { in: expiredRewards.map((r) => r.id) },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Log expiration and notify users
    await Promise.all(
      expiredRewards.map(async (reward) => {
        // Log expiration
        await prisma.eventLog.create({
          data: {
            userId: reward.userId,
            type: 'REWARD_EXPIRED',
            metadata: {
              rewardId: reward.id,
              amount: reward.amount.toString(),
              rewardType: reward.rewardType,
              reason: 'Reward not redeemed within expiry period',
            },
          },
        });

        // Notification will be handled by notification service
        return reward;
      })
    );

    return {
      expired: expiredRewards.length,
      rewards: expiredRewards.map((r) => ({
        id: r.id,
        userId: r.userId,
        amount: r.amount,
        type: r.rewardType,
      })),
    };
  }

  /**
   * Clean up expired referral clicks (older than 90 days)
   */
  async cleanupExpiredClicks() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - this.REFERRAL_EXPIRY_DAYS);

    const result = await prisma.referralClick.deleteMany({
      where: {
        createdAt: { lt: expiryDate },
        convertedToSignup: false, // Keep clicks that converted
      },
    });

    return {
      deleted: result.count,
    };
  }

  /**
   * Find rewards expiring soon (within next 30 days)
   */
  async findExpiringRewards(daysAhead: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const expiringRewards = await prisma.referralReward.findMany({
      where: {
        status: 'APPROVED',
        isRedeemed: false,
        isPaidOut: false,
        expiresAt: {
          lte: expiryDate,
          gte: new Date(), // Not yet expired
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    return expiringRewards;
  }

  /**
   * Check if a referral code is expired
   */
  async isReferralCodeExpired(referralCode: string): Promise<boolean> {
    const referral = await prisma.referral.findFirst({
      where: { referralCode },
      select: {
        createdAt: true,
        status: true,
      },
    });

    if (!referral) return true; // Non-existent code is considered expired

    if (referral.status === 'EXPIRED') return true;

    const expiryDate = new Date(referral.createdAt);
    expiryDate.setDate(expiryDate.getDate() + this.REFERRAL_EXPIRY_DAYS);

    return new Date() > expiryDate;
  }

  /**
   * Set custom expiry date for a reward
   */
  async setRewardExpiry(rewardId: string, expiresAt: Date) {
    const reward = await prisma.referralReward.update({
      where: { id: rewardId },
      data: { expiresAt },
    });

    // Log the change
    await prisma.eventLog.create({
      data: {
        userId: reward.userId,
        type: 'REWARD_EXPIRY_SET',
        metadata: {
          rewardId,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return reward;
  }

  /**
   * Extend expiry date for a reward
   */
  async extendRewardExpiry(rewardId: string, extensionDays: number) {
    const reward = await prisma.referralReward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    const currentExpiry = reward.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + extensionDays);

    return this.setRewardExpiry(rewardId, newExpiry);
  }

  /**
   * Get expiration statistics
   */
  async getExpirationStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      expiredReferralsCount,
      expiredRewardsCount,
      expiredRewardsValue,
      expiringRewardsCount,
    ] = await Promise.all([
      // Expired referrals in last 30 days
      prisma.referral.count({
        where: {
          status: 'EXPIRED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      // Expired rewards in last 30 days
      prisma.referralReward.count({
        where: {
          status: 'EXPIRED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      // Value of expired rewards
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: {
          status: 'EXPIRED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      // Rewards expiring in next 30 days
      prisma.referralReward.count({
        where: {
          status: 'APPROVED',
          isRedeemed: false,
          expiresAt: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      expiredReferrals: {
        count: expiredReferralsCount,
        period: 'last_30_days',
      },
      expiredRewards: {
        count: expiredRewardsCount,
        value: expiredRewardsValue._sum.amount || 0,
        period: 'last_30_days',
      },
      expiringRewards: {
        count: expiringRewardsCount,
        period: 'next_30_days',
      },
    };
  }

  /**
   * Reactivate expired referral (admin function)
   */
  async reactivateReferral(referralId: string, reason: string) {
    const referral = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'PENDING',
        isActive: true,
      },
    });

    // Log reactivation
    await prisma.eventLog.create({
      data: {
        userId: referral.referrerId,
        type: 'REFERRAL_REACTIVATED',
        metadata: {
          referralId,
          reason,
        },
      },
    });

    return referral;
  }

  /**
   * Batch expire items
   */
  async batchExpire() {
    const results = await Promise.all([
      this.expirePendingReferrals(),
      this.expireUnredeemedRewards(),
      this.cleanupExpiredClicks(),
    ]);

    return {
      referrals: results[0],
      rewards: results[1],
      clicks: results[2],
      timestamp: new Date(),
    };
  }
}

export const expirationService = new ExpirationService();