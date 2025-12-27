// backend/admin-service/src/services/referralAdminService.ts

import { PrismaClient } from '@prisma/client';
import { rewardDistributionService } from '../../../payment-service/src/services/rewardDistributionService';

const prisma = new PrismaClient();

class ReferralAdminService {
  /**
   * Get all referrals with filters
   */
  async getAllReferrals(params: {
    page: number;
    limit: number;
    status?: string;
    referralType?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<any> {
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.referralType) where.referralType = params.referralType;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }
    if (params.search) {
      where.OR = [
        { referralCode: { contains: params.search, mode: 'insensitive' } },
        { referrer: { name: { contains: params.search, mode: 'insensitive' } } },
        { referred: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          referred: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.count({ where }),
    ]);

    return {
      data: referrals,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Get referral details
   */
  async getReferralDetails(referralId: string): Promise<any> {
    return await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer: true,
        referred: true,
        rewards: true,
      },
    });
  }

  /**
   * Approve referral manually
   */
  async approveReferral(data: {
    referralId: string;
    adminId: string;
    notes?: string;
  }): Promise<void> {
    // Process qualification
    await rewardDistributionService.processReferralQualification({
      referralId: data.referralId,
      referredUserId: '', // Will be fetched inside
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: 'USER_VERIFIED',
        targetType: 'Referral',
        targetId: data.referralId,
        description: `Manually approved referral: ${data.notes || 'No notes'}`,
      },
    });
  }

  /**
   * Reject referral
   */
  async rejectReferral(data: {
    referralId: string;
    adminId: string;
    reason: string;
  }): Promise<void> {
    await prisma.referral.update({
      where: { id: data.referralId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: 'USER_REJECTED',
        targetType: 'Referral',
        targetId: data.referralId,
        description: `Rejected referral: ${data.reason}`,
      },
    });
  }

  /**
   * Get all rewards with filters
   */
  async getAllRewards(params: {
    page: number;
    limit: number;
    status?: string;
    rewardType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.rewardType) where.rewardType = params.rewardType;
    if (params.userId) where.userId = params.userId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [rewards, total] = await Promise.all([
      prisma.referralReward.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          referral: {
            select: {
              id: true,
              referralCode: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralReward.count({ where }),
    ]);

    return {
      data: rewards,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Update reward status
   */
  async updateRewardStatus(data: {
    rewardId: string;
    status: string;
    adminId: string;
    notes?: string;
  }): Promise<void> {
    await prisma.referralReward.update({
      where: { id: data.rewardId },
      data: {
        status: data.status as any,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: 'PROPERTY_APPROVED', // Reusing for rewards
        targetType: 'Reward',
        targetId: data.rewardId,
        description: `Updated reward status to ${data.status}: ${data.notes || ''}`,
      },
    });
  }

  /**
   * Get system overview
   */
  async getSystemOverview(period: string): Promise<any> {
    const periodStart = this.getPeriodStartDate(period);

    const [
      totalReferrals,
      qualifiedReferrals,
      totalRewards,
      totalRewardValue,
      activeUsers,
    ] = await Promise.all([
      prisma.referral.count({
        where: { createdAt: { gte: periodStart } },
      }),
      prisma.referral.count({
        where: {
          createdAt: { gte: periodStart },
          qualificationMet: true,
        },
      }),
      prisma.referralReward.count({
        where: { createdAt: { gte: periodStart } },
      }),
      prisma.referralReward.aggregate({
        where: { createdAt: { gte: periodStart } },
        _sum: { amount: true },
      }),
      prisma.referral.groupBy({
        by: ['referrerId'],
        where: { createdAt: { gte: periodStart } },
        _count: true,
      }),
    ]);

    const conversionRate = totalReferrals > 0
      ? ((qualifiedReferrals / totalReferrals) * 100).toFixed(2)
      : '0.00';

    return {
      totalReferrals,
      qualifiedReferrals,
      conversionRate: `${conversionRate}%`,
      totalRewards,
      totalRewardValue: Number(totalRewardValue._sum.amount || 0),
      activeUsers: activeUsers.length,
      period,
    };
  }

  /**
   * Get user referral activity
   */
  async getUserReferralActivity(userId: string): Promise<any> {
    const [referrals, rewards, clicks] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: { referred: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralReward.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referralClick.count({
        where: { referrerId: userId },
      }),
    ]);

    const totalEarnings = rewards.reduce((sum, r) => sum + Number(r.amount), 0);
    const qualifiedCount = referrals.filter(r => r.qualificationMet).length;

    return {
      referrals: {
        total: referrals.length,
        qualified: qualifiedCount,
        pending: referrals.length - qualifiedCount,
        list: referrals,
      },
      rewards: {
        total: rewards.length,
        totalValue: totalEarnings,
        list: rewards,
      },
      clicks: {
        total: clicks,
      },
      conversionRate: clicks > 0 ? ((referrals.length / clicks) * 100).toFixed(2) : '0.00',
    };
  }

  /**
   * Get top referrers
   */
  async getTopReferrers(params: {
    limit: number;
    period: string;
  }): Promise<any[]> {
    const periodStart = this.getPeriodStartDate(params.period);

    const topReferrers = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: {
        createdAt: { gte: periodStart },
        qualificationMet: true,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: params.limit,
    });

    // Get user details and earnings
    const enrichedData = await Promise.all(
      topReferrers.map(async (item) => {
        const [user, rewards] = await Promise.all([
          prisma.user.findUnique({
            where: { id: item.referrerId },
            select: { id: true, name: true, email: true, role: true },
          }),
          prisma.referralReward.aggregate({
            where: {
              userId: item.referrerId,
              createdAt: { gte: periodStart },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          user,
          referralCount: item._count.id,
          totalEarnings: Number(rewards._sum.amount || 0),
        };
      })
    );

    return enrichedData;
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(params: {
    page: number;
    limit: number;
  }): Promise<any> {
    const where = {
      status: 'PENDING',
      paymentType: 'AGENT_COMMISSION',
    };

    const [payouts, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payouts,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Manually distribute rewards
   */
  async manuallyDistributeRewards(data: {
    referralId: string;
    adminId: string;
  }): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { id: data.referralId },
    });

    if (!referral) {
      throw new Error('Referral not found');
    }

    await rewardDistributionService.processReferralQualification({
      referralId: data.referralId,
      referredUserId: referral.referredId,
    });

    // Log action
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: 'PROPERTY_APPROVED',
        targetType: 'Referral',
        targetId: data.referralId,
        description: 'Manually triggered reward distribution',
      },
    });
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(params: {
    page: number;
    limit: number;
  }): Promise<any> {
    // Detect suspicious patterns:
    // 1. Multiple referrals from same IP
    // 2. Rapid referral creation
    // 3. Same device fingerprints

    const suspiciousClicks = await prisma.$queryRaw`
      SELECT 
        "referrerId",
        "ipAddress",
        COUNT(*) as click_count
      FROM "ReferralClick"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY "referrerId", "ipAddress"
      HAVING COUNT(*) > 5
      ORDER BY click_count DESC
      LIMIT ${params.limit}
      OFFSET ${(params.page - 1) * params.limit}
    `;

    return {
      data: suspiciousClicks,
      page: params.page,
      limit: params.limit,
    };
  }

  /**
   * Ban user from referral program
   */
  async banUserFromReferralProgram(data: {
    userId: string;
    adminId: string;
    reason: string;
  }): Promise<void> {
    // Deactivate all user's referrals
    await prisma.referral.updateMany({
      where: { referrerId: data.userId },
      data: { isActive: false },
    });

    // Log action
    await prisma.adminAction.create({
      data: {
        adminId: data.adminId,
        action: 'AGENT_SUSPENDED',
        targetType: 'User',
        targetId: data.userId,
        description: `Banned from referral program: ${data.reason}`,
      },
    });
  }

  /**
   * Export referral data
   */
  async exportReferralData(params: {
    format: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const where: any = {};
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: { select: { name: true, email: true, role: true } },
        referred: { select: { name: true, email: true, role: true } },
      },
    });

    if (params.format === 'csv') {
      return this.convertToCSV(referrals);
    }

    return JSON.stringify(referrals, null, 2);
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(params: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const where: any = {};
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [clicks, signups, qualified, rewarded] = await Promise.all([
      prisma.referralClick.count({ where }),
      prisma.referral.count({ where }),
      prisma.referral.count({ where: { ...where, qualificationMet: true } }),
      prisma.referralReward.count({ where: { ...where, isPaidOut: true } }),
    ]);

    return {
      stages: [
        { name: 'Clicks', count: clicks, percentage: 100 },
        { name: 'Sign-ups', count: signups, percentage: clicks > 0 ? (signups / clicks) * 100 : 0 },
        { name: 'Qualified', count: qualified, percentage: signups > 0 ? (qualified / signups) * 100 : 0 },
        { name: 'Rewarded', count: rewarded, percentage: qualified > 0 ? (rewarded / qualified) * 100 : 0 },
      ],
    };
  }

  /**
   * Get referral trends
   */
  async getReferralTrends(params: {
    period: string;
    groupBy: string;
  }): Promise<any> {
    // Implementation would depend on the groupBy period (day, week, month)
    // This is a placeholder
    return {
      labels: [],
      datasets: {
        referrals: [],
        qualified: [],
        rewards: [],
      },
    };
  }

  /**
   * Get reward distribution stats
   */
  async getRewardDistributionStats(): Promise<any> {
    const stats = await prisma.referralReward.groupBy({
      by: ['rewardType'],
      _count: { id: true },
      _sum: { amount: true },
    });

    return stats.map(stat => ({
      type: stat.rewardType,
      count: stat._count.id,
      totalValue: Number(stat._sum.amount || 0),
    }));
  }

  /**
   * Get ROI analysis
   */
  async getROIAnalysis(period: string): Promise<any> {
    const periodStart = this.getPeriodStartDate(period);

    const [totalRewardsPaid, totalRevenue] = await Promise.all([
      prisma.referralReward.aggregate({
        where: { createdAt: { gte: periodStart }, isPaidOut: true },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: periodStart }, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    const rewardCost = Number(totalRewardsPaid._sum.amount || 0);
    const revenue = Number(totalRevenue._sum.amount || 0);
    const roi = revenue > 0 ? ((revenue - rewardCost) / rewardCost) * 100 : 0;

    return {
      totalRewardsPaid: rewardCost,
      totalRevenue: revenue,
      roi: roi.toFixed(2),
      period,
    };
  }

  /**
   * Helper: Get period start date
   */
  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0); // All time
    }
  }

  /**
   * Helper: Convert to CSV
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  }

  // Placeholder methods for analytics
  async getGeographicDistribution(): Promise<any> { return {}; }
  async getChannelPerformance(): Promise<any> { return {}; }
  async getUserCohortAnalysis(type: string): Promise<any> { return {}; }
  async getLTVByReferralSource(): Promise<any> { return {}; }
  async getRedemptionPatterns(): Promise<any> { return {}; }
  async getReferralVelocity(userId?: string): Promise<any> { return {}; }
  async getPredictiveAnalytics(): Promise<any> { return {}; }
}

export const referralAdminService = new ReferralAdminService();