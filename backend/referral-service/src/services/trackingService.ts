// backend/referral-service/src/services/trackingService.ts

import { PrismaClient } from '@newcondo/db';
import { 
  ClickAnalytics, 
  CreateClickDTO,
  ConversionDTO,
  ReferralPerformanceMetrics,
  FraudDetectionResult 
} from '../types';
import { startOfDay, endOfDay, addDays } from '../utils/dateHelpers';
import { FRAUD_PREVENTION, TRACKING_SETTINGS } from '../config/referralRules';

const prisma = new PrismaClient();

export class TrackingService {
  /**
   * Track a referral click
   */
  async trackClick(data: CreateClickDTO): Promise<void> {
    const { 
      referralCode, 
      ipAddress, 
      userAgent, 
      referrerUrl, 
      landingPage,
      sessionId,
      country,
      city 
    } = data;

    // Check if this is a unique click (by IP + UserAgent)
    const isUnique = await this.isUniqueClick(referralCode, ipAddress, userAgent);

    // Create click record
    await prisma.referralClick.create({
      data: {
        referralCode,
        ipAddress,
        userAgent,
        referrerUrl,
        landingPage,
        sessionId,
        country,
        city,
        referrerId: null, // Will be linked later
      },
    });

    // Update referral click count
    const updateData: any = {
      clickCount: { increment: 1 },
    };

    if (isUnique) {
      updateData.uniqueClicks = { increment: 1 };
    }

    await prisma.agentReferral.updateMany({
      where: { referralCode },
      data: updateData,
    });
  }

  /**
   * Check if click is unique (based on IP + UserAgent combination)
   */
  private async isUniqueClick(
    referralCode: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    if (!TRACKING_SETTINGS.UNIQUE_CLICK_TRACKING || !ipAddress) {
      return false;
    }

    const existingClick = await prisma.referralClick.findFirst({
      where: {
        referralCode,
        ipAddress,
        userAgent,
        createdAt: {
          gte: addDays(new Date(), -TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS),
        },
      },
    });

    return !existingClick;
  }

  /**
   * Track a conversion (successful signup/payment)
   */
  async trackConversion(data: ConversionDTO): Promise<void> {
    const { referralCode, convertedUserId, sessionId, ipAddress } = data;

    // Find the original click
    const click = await prisma.referralClick.findFirst({
      where: {
        referralCode,
        ...(sessionId ? { sessionId } : {}),
        ...(ipAddress ? { ipAddress } : {}),
        convertedUserId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (click) {
      // Update click with conversion data
      await prisma.referralClick.update({
        where: { id: click.id },
        data: {
          convertedToSignup: true,
          convertedUserId,
          convertedAt: new Date(),
        },
      });
    } else {
      // Create conversion record even if no click was tracked
      await prisma.referralClick.create({
        data: {
          referralCode,
          ipAddress,
          sessionId,
          convertedToSignup: true,
          convertedUserId,
          convertedAt: new Date(),
          referrerId: null,
        },
      });
    }
  }

  /**
   * Get click analytics for a referral code
   */
  async getClickAnalytics(referralCode: string, days: number = 30): Promise<ClickAnalytics> {
    const startDate = addDays(new Date(), -days);

    const clicks = await prisma.referralClick.findMany({
      where: {
        referralCode,
        createdAt: { gte: startDate },
      },
    });

    const totalClicks = clicks.length;
    const uniqueClicks = new Set(clicks.map(c => `${c.ipAddress}-${c.userAgent}`)).size;
    const conversions = clicks.filter(c => c.convertedToSignup).length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Group by channel (extracted from referrerUrl)
    const clicksByChannel: Record<string, number> = {};
    clicks.forEach(click => {
      const channel = this.extractChannel(click.referrerUrl);
      clicksByChannel[channel] = (clicksByChannel[channel] || 0) + 1;
    });

    // Group by country
    const clicksByCountry: Record<string, number> = {};
    clicks.forEach(click => {
      const country = click.country || 'Unknown';
      clicksByCountry[country] = (clicksByCountry[country] || 0) + 1;
    });

    // Group by date
    const clicksByDate: Array<{ date: string; clicks: number }> = [];
    const dateMap: Record<string, number> = {};
    
    clicks.forEach(click => {
      const date = click.createdAt.toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    Object.entries(dateMap).forEach(([date, count]) => {
      clicksByDate.push({ date, clicks: count });
    });

    clicksByDate.sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalClicks,
      uniqueClicks,
      conversionRate,
      clicksByChannel,
      clicksByCountry,
      clicksByDate,
      topReferrers: [], // Can be enhanced later
    };
  }

  /**
   * Get performance metrics for a referral
   */
  async getReferralPerformanceMetrics(
    referralCode: string,
    days: number = 30
  ): Promise<ReferralPerformanceMetrics> {
    const startDate = addDays(new Date(), -days);

    // Get agent referral data
    const agentReferral = await prisma.agentReferral.findFirst({
      where: { referralCode },
      include: {
        clicks: {
          where: { createdAt: { gte: startDate } },
        },
        conversions: {
          where: { createdAt: { gte: startDate } },
        },
      },
    });

    if (!agentReferral) {
      throw new Error('Referral not found');
    }

    const totalClicks = agentReferral.clicks.length;
    const uniqueClicks = agentReferral.uniqueClicks;
    const conversions = agentReferral.conversions.length;
    const conversionRate = totalClicks > 0 ? (conversions / totalClicks) * 100 : 0;

    // Calculate channel distribution
    const clicksByChannel: Record<string, number> = {};
    agentReferral.clicks.forEach(click => {
      const channel = this.extractChannel(click.referrerUrl);
      clicksByChannel[channel] = (clicksByChannel[channel] || 0) + 1;
    });

    // Calculate rewards
    const totalEarnings = Number(agentReferral.totalEarnings);
    const paidRewards = agentReferral.conversions
      .filter(c => c.isPaid)
      .reduce((sum, c) => sum + Number(c.commission), 0);
    const pendingRewards = totalEarnings - paidRewards;

    // Timeline data
    const timeline: Array<{ date: string; clicks: number; conversions: number }> = [];
    const dateMap: Record<string, { clicks: number; conversions: number }> = {};

    agentReferral.clicks.forEach(click => {
      const date = click.createdAt.toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { clicks: 0, conversions: 0 };
      }
      dateMap[date].clicks++;
    });

    agentReferral.conversions.forEach(conversion => {
      const date = conversion.createdAt.toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { clicks: 0, conversions: 0 };
      }
      dateMap[date].conversions++;
    });

    Object.entries(dateMap).forEach(([date, data]) => {
      timeline.push({ date, ...data });
    });

    timeline.sort((a, b) => a.date.localeCompare(b.date));

    return {
      referralCode,
      clicks: {
        total: totalClicks,
        unique: uniqueClicks,
        byChannel: clicksByChannel,
      },
      conversions: {
        total: conversions,
        rate: conversionRate,
        totalValue: totalEarnings,
      },
      rewards: {
        earned: totalEarnings,
        pending: pendingRewards,
        paid: paidRewards,
      },
      timeline,
    };
  }

  /**
   * Detect fraudulent activity
   */
  async detectFraud(userId: string, ipAddress?: string): Promise<FraudDetectionResult> {
    const flags: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];
    let riskScore = 0;

    // Check referrals in last 24 hours
    const oneDayAgo = addDays(new Date(), -1);
    const recentReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentReferrals > FRAUD_PREVENTION.MAX_REFERRALS_PER_DAY) {
      flags.push({
        type: 'EXCESSIVE_REFERRALS',
        severity: 'high',
        description: `${recentReferrals} referrals in 24 hours (limit: ${FRAUD_PREVENTION.MAX_REFERRALS_PER_DAY})`,
      });
      riskScore += 40;
    }

    // Check same IP referrals
    if (ipAddress) {
      const sameIpReferrals = await prisma.referralClick.count({
        where: {
          ipAddress,
          convertedToSignup: true,
          createdAt: { gte: addDays(new Date(), -7) },
        },
      });

      if (sameIpReferrals >= FRAUD_PREVENTION.SUSPICIOUS_PATTERNS.SAME_IP_REFERRALS) {
        flags.push({
          type: 'SAME_IP_REFERRALS',
          severity: 'medium',
          description: `${sameIpReferrals} conversions from same IP`,
        });
        riskScore += 25;
      }
    }

    // Check rapid referrals (within 1 hour)
    const oneHourAgo = addDays(new Date(), -1/24);
    const rapidReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (rapidReferrals >= FRAUD_PREVENTION.SUSPICIOUS_PATTERNS.RAPID_REFERRALS) {
      flags.push({
        type: 'RAPID_REFERRALS',
        severity: 'high',
        description: `${rapidReferrals} referrals within 1 hour`,
      });
      riskScore += 35;
    }

    const isSuspicious = riskScore >= 50;
    const recommendation = riskScore >= 75 ? 'block' : riskScore >= 50 ? 'review' : 'allow';

    return {
      isSuspicious,
      riskScore,
      flags,
      recommendation,
    };
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
    if (url.includes('google.com')) return 'google';
    
    return 'other';
  }
}

export default new TrackingService();