// backend/analytics-service/src/services/referralAnalyticsService.ts

import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

interface TimelineParams extends DateRange {
  granularity: 'daily' | 'weekly' | 'monthly';
}

/**
 * Referral Analytics Service
 * Core analytics processing for referral system
 */
class ReferralAnalyticsService {
  /**
   * Get referral program overview
   */
  async getOverview(params: DateRange) {
    const { startDate, endDate } = this.getDateRange(params);

    const [
      totalReferrals,
      activeReferrals,
      qualifiedReferrals,
      totalRewards,
      paidRewards,
      pendingRewards,
      totalRevenue,
      conversionRate,
    ] = await Promise.all([
      // Total referrals created
      prisma.referral.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Active referrals
      prisma.referral.count({
        where: {
          isActive: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Qualified referrals
      prisma.referral.count({
        where: {
          qualificationMet: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total rewards value
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Paid rewards
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: {
          isPaidOut: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Pending rewards
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PENDING',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total revenue from referred users
      this.calculateReferralRevenue(startDate, endDate),
      // Conversion rate
      this.calculateConversionRate(startDate, endDate),
    ]);

    return {
      totalReferrals,
      activeReferrals,
      qualifiedReferrals,
      totalRewards: totalRewards._sum.amount || 0,
      paidRewards: paidRewards._sum.amount || 0,
      pendingRewards: pendingRewards._sum.amount || 0,
      totalRevenue,
      conversionRate,
      roi: this.calculateROI(totalRevenue, totalRewards._sum.amount || 0),
    };
  }

  /**
   * Get conversion funnel analytics
   */
  async getConversionFunnel(params: DateRange & { referralType?: string }) {
    const { startDate, endDate, referralType } = params;

    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (referralType) {
      whereClause.referralType = referralType;
    }

    const [clicks, signups, qualified, rewarded] = await Promise.all([
      // Total clicks
      prisma.referralClick.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Signups (referrals created)
      prisma.referral.count({ where: whereClause }),
      // Qualified referrals
      prisma.referral.count({
        where: { ...whereClause, qualificationMet: true },
      }),
      // Rewarded referrals
      prisma.referral.count({
        where: { ...whereClause, status: 'REWARDED' },
      }),
    ]);

    return {
      clicks,
      signups,
      qualified,
      rewarded,
      clickToSignup: clicks > 0 ? (signups / clicks) * 100 : 0,
      signupToQualified: signups > 0 ? (qualified / signups) * 100 : 0,
      qualifiedToRewarded: qualified > 0 ? (rewarded / qualified) * 100 : 0,
    };
  }

  /**
   * Get top referrers
   */
  async getTopReferrers(params: {
    metric: 'conversions' | 'revenue' | 'referrals';
    limit: number;
    period: string;
  }) {
    const { metric, limit, period } = params;
    const { startDate, endDate } = this.getPeriodRange(period);

    if (metric === 'referrals') {
      const topReferrers = await prisma.user.findMany({
        where: {
          referrals: {
            some: {
              createdAt: { gte: startDate, lte: endDate },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              referrals: {
                where: {
                  createdAt: { gte: startDate, lte: endDate },
                },
              },
            },
          },
        },
        orderBy: {
          referrals: { _count: 'desc' },
        },
        take: limit,
      });

      return topReferrers.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalReferrals: u._count.referrals,
      }));
    }

    if (metric === 'conversions') {
      const topReferrers = await prisma.user.findMany({
        where: {
          referrals: {
            some: {
              qualificationMet: true,
              createdAt: { gte: startDate, lte: endDate },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              referrals: {
                where: {
                  qualificationMet: true,
                  createdAt: { gte: startDate, lte: endDate },
                },
              },
            },
          },
        },
        orderBy: {
          referrals: { _count: 'desc' },
        },
        take: limit,
      });

      return topReferrers.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalConversions: u._count.referrals,
      }));
    }

    // Revenue metric - requires more complex calculation
    return this.getTopReferrersByRevenue(startDate, endDate, limit);
  }

  /**
   * Get referral type breakdown
   */
  async getReferralTypeBreakdown(params: DateRange) {
    const { startDate, endDate } = this.getDateRange(params);

    const breakdown = await prisma.referral.groupBy({
      by: ['referralType'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
      _sum: {
        referrerReward: true,
        referredReward: true,
      },
    });

    return breakdown.map((item) => ({
      type: item.referralType,
      count: item._count,
      totalRewards:
        (item._sum.referrerReward || 0) + (item._sum.referredReward || 0),
    }));
  }

  /**
   * Get reward distribution analytics
   */
  async getRewardDistribution(params: DateRange & { rewardType?: string }) {
    const { startDate, endDate, rewardType } = params;

    const whereClause: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (rewardType) {
      whereClause.rewardType = rewardType;
    }

    const distribution = await prisma.referralReward.groupBy({
      by: ['rewardType', 'status'],
      where: whereClause,
      _count: true,
      _sum: {
        amount: true,
      },
    });

    return distribution.map((item) => ({
      rewardType: item.rewardType,
      status: item.status,
      count: item._count,
      totalAmount: item._sum.amount || 0,
    }));
  }

  /**
   * Get referral timeline
   */
  async getReferralTimeline(params: TimelineParams) {
    const { startDate, endDate, granularity } = params;
    const range = this.getDateRange({ startDate, endDate });

    // Generate time buckets based on granularity
    const buckets = this.generateTimeBuckets(
      range.startDate,
      range.endDate,
      granularity
    );

    const referrals = await prisma.referral.findMany({
      where: {
        createdAt: { gte: range.startDate, lte: range.endDate },
      },
      select: {
        createdAt: true,
        qualificationMet: true,
        status: true,
      },
    });

    return buckets.map((bucket) => {
      const bucketReferrals = referrals.filter(
        (r) => r.createdAt >= bucket.start && r.createdAt < bucket.end
      );

      return {
        period: bucket.label,
        start: bucket.start,
        end: bucket.end,
        totalReferrals: bucketReferrals.length,
        qualifiedReferrals: bucketReferrals.filter((r) => r.qualificationMet)
          .length,
        rewardedReferrals: bucketReferrals.filter((r) => r.status === 'REWARDED')
          .length,
      };
    });
  }

  /**
   * Get performance by user role
   */
  async getPerformanceByRole(params: DateRange) {
    const { startDate, endDate } = this.getDateRange(params);

    const rolePerformance = await prisma.$queryRaw`
      SELECT 
        u.role,
        COUNT(DISTINCT r.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN r."qualificationMet" = true THEN r.id END) as qualified_referrals,
        SUM(COALESCE(r."referrerReward", 0) + COALESCE(r."referredReward", 0)) as total_rewards
      FROM "User" u
      LEFT JOIN "Referral" r ON u.id = r."referrerId"
      WHERE r."createdAt" >= ${startDate} AND r."createdAt" <= ${endDate}
      GROUP BY u.role
      ORDER BY total_referrals DESC
    `;

    return rolePerformance;
  }

  /**
   * Get ROI analysis
   */
  async getROIAnalysis(params: DateRange) {
    const { startDate, endDate } = this.getDateRange(params);

    const [totalRewardCost, totalRevenue, rewardsByType] = await Promise.all([
      // Total cost of rewards
      prisma.referralReward.aggregate({
        _sum: { amount: true },
        where: {
          isPaidOut: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total revenue from referred users
      this.calculateReferralRevenue(startDate, endDate),
      // Breakdown by reward type
      prisma.referralReward.groupBy({
        by: ['rewardType'],
        where: {
          isPaidOut: true,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const rewardCost = totalRewardCost._sum.amount || 0;
    const roi = this.calculateROI(totalRevenue, rewardCost);

    return {
      totalRewardCost: rewardCost,
      totalRevenue,
      netProfit: totalRevenue - rewardCost,
      roi,
      rewardsByType: rewardsByType.map((r) => ({
        type: r.rewardType,
        count: r._count,
        amount: r._sum.amount || 0,
      })),
    };
  }

  /**
   * Get viral coefficient (K-factor)
   */
  async getViralCoefficient(params: DateRange) {
    const { startDate, endDate } = this.getDateRange(params);

    // Calculate viral coefficient: K = i * c
    // i = average invites per user
    // c = conversion rate of invites

    const [totalUsers, totalReferrals, qualifiedReferrals] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.referral.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.referral.count({
        where: {
          qualificationMet: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const invitesPerUser = totalUsers > 0 ? totalReferrals / totalUsers : 0;
    const conversionRate =
      totalReferrals > 0 ? qualifiedReferrals / totalReferrals : 0;
    const kFactor = invitesPerUser * conversionRate;

    return {
      kFactor,
      invitesPerUser,
      conversionRate,
      totalUsers,
      totalReferrals,
      qualifiedReferrals,
      viralityStatus:
        kFactor > 1 ? 'Viral Growth' : kFactor > 0.5 ? 'Good' : 'Needs Improvement',
    };
  }

  /**
   * Export analytics report
   */
  async exportReport(params: DateRange & { format: 'csv' | 'pdf' | 'json' }) {
    const { startDate, endDate, format } = params;

    const [overview, funnel, topReferrers, breakdown] = await Promise.all([
      this.getOverview({ startDate, endDate }),
      this.getConversionFunnel({ startDate, endDate }),
      this.getTopReferrers({ metric: 'conversions', limit: 10, period: '30d' }),
      this.getReferralTypeBreakdown({ startDate, endDate }),
    ]);

    const reportData = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      overview,
      funnel,
      topReferrers,
      breakdown,
    };

    if (format === 'json') {
      return reportData;
    }

    // For CSV and PDF, implement formatting logic
    // This is a simplified version
    return {
      format,
      url: `/reports/referral-analytics-${Date.now()}.${format}`,
      data: reportData,
    };
  }

  // Helper methods

  private getDateRange(params: DateRange) {
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }

  private getPeriodRange(period: string) {
    const endDate = new Date();
    let startDate = new Date();

    if (period.endsWith('d')) {
      const days = parseInt(period);
      startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (period.endsWith('m')) {
      const months = parseInt(period);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - months);
    }

    return { startDate, endDate };
  }

  private async calculateReferralRevenue(startDate: Date, endDate: Date) {
    const revenue = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM "Payment" p
      INNER JOIN "User" u ON p."userId" = u.id
      INNER JOIN "Referral" r ON u.id = r."referredId"
      WHERE r."qualificationMet" = true
      AND p."createdAt" >= ${startDate}
      AND p."createdAt" <= ${endDate}
      AND p.status = 'SUCCESS'
    `;

    return revenue[0]?.total || 0;
  }

  private async calculateConversionRate(startDate: Date, endDate: Date) {
    const [clicks, qualified] = await Promise.all([
      prisma.referralClick.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.referral.count({
        where: {
          qualificationMet: true,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return clicks > 0 ? (qualified / clicks) * 100 : 0;
  }

  private calculateROI(revenue: number, cost: number) {
    return cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
  }

  private async getTopReferrersByRevenue(
    startDate: Date,
    endDate: Date,
    limit: number
  ) {
    const result = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(DISTINCT r.id) as referral_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM "User" u
      INNER JOIN "Referral" r ON u.id = r."referrerId"
      INNER JOIN "User" referred ON r."referredId" = referred.id
      LEFT JOIN "Payment" p ON referred.id = p."userId" AND p.status = 'SUCCESS'
      WHERE r."createdAt" >= ${startDate} 
      AND r."createdAt" <= ${endDate}
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

    return result;
  }

  private generateTimeBuckets(
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly'
  ) {
    const buckets: Array<{ start: Date; end: Date; label: string }> = [];
    let current = new Date(startDate);

    while (current < endDate) {
      const bucketStart = new Date(current);
      let bucketEnd: Date;
      let label: string;

      if (granularity === 'daily') {
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 1);
        label = bucketStart.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        bucketEnd = new Date(current);
        bucketEnd.setDate(bucketEnd.getDate() + 7);
        label = `Week of ${bucketStart.toISOString().split('T')[0]}`;
      } else {
        bucketEnd = new Date(current);
        bucketEnd.setMonth(bucketEnd.getMonth() + 1);
        label = `${bucketStart.getFullYear()}-${String(bucketStart.getMonth() + 1).padStart(2, '0')}`;
      }

      buckets.push({ start: bucketStart, end: bucketEnd, label });
      current = bucketEnd;
    }

    return buckets;
  }
}

export const referralAnalyticsService = new ReferralAnalyticsService();