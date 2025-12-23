// backend/referral-service/src/controllers/analyticsController.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from '../utils/dateHelpers';

const prisma = new PrismaClient();

export class AnalyticsController {
  /**
   * Get referral analytics overview
   * GET /api/analytics/overview
   */
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;
      const startDate = addDays(new Date(), -days);

      // Get all referrals
      const referrals = await prisma.referral.findMany({
        where: {
          referrerId: userId,
          createdAt: { gte: startDate },
        },
        include: {
          rewards: {
            where: { userId },
          },
        },
      });

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.isActive).length;
      const qualifiedReferrals = referrals.filter(r => r.qualificationMet).length;
      
      const totalRewards = referrals.reduce((sum, r) => {
        return sum + r.rewards.reduce((rewardSum, reward) => {
          return rewardSum + Number(reward.amount);
        }, 0);
      }, 0);

      // Calculate average conversion time
      const qualifiedWithTime = referrals.filter(r => r.qualificationMet && r.qualifiedAt);
      const avgConversionTime = qualifiedWithTime.length > 0
        ? qualifiedWithTime.reduce((sum, r) => {
            const timeDiff = r.qualifiedAt!.getTime() - r.createdAt.getTime();
            return sum + timeDiff;
          }, 0) / qualifiedWithTime.length / (1000 * 60 * 60)
        : 0;

      res.json({
        success: true,
        data: {
          overview: {
            totalReferrals,
            activeReferrals,
            qualifiedReferrals,
            totalRewards,
            averageConversionTime: Math.round(avgConversionTime),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get referral trends
   * GET /api/analytics/trends
   */
  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const period = req.query.period as string || 'daily';
      const days = parseInt(req.query.days as string) || 30;
      
      const startDate = addDays(new Date(), -days);

      const referrals = await prisma.referral.findMany({
        where: {
          referrerId: userId,
          createdAt: { gte: startDate },
        },
      });

      // Group by period
      const trends: any = {
        daily: [],
        weekly: [],
        monthly: [],
      };

      if (period === 'daily') {
        const dailyMap: Record<string, { referrals: number; conversions: number }> = {};
        
        referrals.forEach(r => {
          const date = r.createdAt.toISOString().split('T')[0];
          if (!dailyMap[date]) {
            dailyMap[date] = { referrals: 0, conversions: 0 };
          }
          dailyMap[date].referrals++;
          if (r.qualificationMet) {
            dailyMap[date].conversions++;
          }
        });

        trends.daily = Object.entries(dailyMap).map(([date, data]) => ({
          date,
          ...data,
        }));
      }

      res.json({
        success: true,
        data: { trends },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get performance analytics
   * GET /api/analytics/performance
   */
  async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const referrals = await prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          rewards: {
            where: { userId, isPaidOut: true },
          },
        },
      });

      const totalReferrals = referrals.length;
      const qualifiedReferrals = referrals.filter(r => r.qualificationMet).length;
      const conversionRate = totalReferrals > 0 ? (qualifiedReferrals / totalReferrals) * 100 : 0;

      const totalEarnings = referrals.reduce((sum, r) => {
        return sum + r.rewards.reduce((rewardSum, reward) => {
          return rewardSum + Number(reward.amount);
        }, 0);
      }, 0);

      const averageRewardValue = qualifiedReferrals > 0 ? totalEarnings / qualifiedReferrals : 0;

      res.json({
        success: true,
        data: {
          performance: {
            conversionRate: Math.round(conversionRate * 100) / 100,
            averageRewardValue: Math.round(averageRewardValue),
            totalEarnings,
            topPerformers: [], // Can be enhanced
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get channel analytics
   * GET /api/analytics/channels
   */
  async getChannelAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });

      if (!user?.referralCode) {
        return res.json({
          success: true,
          data: { channels: {} },
        });
      }

      const clicks = await prisma.referralClick.findMany({
        where: { referralCode: user.referralCode },
      });

      const channels: Record<string, { clicks: number; conversions: number; rate: number }> = {};

      clicks.forEach(click => {
        const channel = this.extractChannel(click.referrerUrl);
        
        if (!channels[channel]) {
          channels[channel] = { clicks: 0, conversions: 0, rate: 0 };
        }
        
        channels[channel].clicks++;
        if (click.convertedToSignup) {
          channels[channel].conversions++;
        }
      });

      // Calculate rates
      Object.keys(channels).forEach(channel => {
        channels[channel].rate = channels[channel].clicks > 0
          ? (channels[channel].conversions / channels[channel].clicks) * 100
          : 0;
      });

      res.json({
        success: true,
        data: { channels },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get leaderboard (top referrers)
   * GET /api/analytics/leaderboard
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const topReferrers = await prisma.user.findMany({
        where: {
          referrals: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          referrals: {
            where: { qualificationMet: true },
            include: {
              rewards: {
                where: { isPaidOut: true },
              },
            },
          },
        },
        take: limit,
      });

      const leaderboard = topReferrers
        .map(user => ({
          userId: user.id,
          userName: user.name || 'Anonymous',
          referrals: user.referrals.length,
          earnings: user.referrals.reduce((sum, r) => {
            return sum + r.rewards.reduce((rewardSum, reward) => {
              return rewardSum + Number(reward.amount);
            }, 0);
          }, 0),
        }))
        .sort((a, b) => b.earnings - a.earnings);

      res.json({
        success: true,
        data: { leaderboard },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract channel from referrer URL
   */
  private extractChannel(referrerUrl?: string | null): string {
    if (!referrerUrl) return 'direct';

    const url = referrerUrl.toLowerCase();
    
    if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
    if (url.includes('twitter.com') || url.includes('t.co')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('whatsapp')) return 'whatsapp';
    if (url.includes('linkedin.com')) return 'linkedin';
    
    return 'other';
  }
}

export default new AnalyticsController();