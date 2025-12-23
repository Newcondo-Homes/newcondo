// backend/referral-service/src/services/attributionService.ts

import { PrismaClient } from '@newcondo/db';
import { AttributionData } from '../types';
import { TRACKING_SETTINGS } from '../config/referralRules';
import { getDaysDifference } from '../utils/dateHelpers';

const prisma = new PrismaClient();

export class AttributionService {
  /**
   * Attribute a conversion to a referral click
   */
  async attributeConversion(
    userId: string,
    sessionId?: string,
    ipAddress?: string
  ): Promise<AttributionData | null> {
    // Try to find click by session ID first
    let click = sessionId
      ? await prisma.referralClick.findFirst({
          where: { sessionId, convertedUserId: null },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    // If no session match, try IP address within attribution window
    if (!click && ipAddress) {
      const attributionWindowDate = new Date();
      attributionWindowDate.setDate(
        attributionWindowDate.getDate() - TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS
      );

      click = await prisma.referralClick.findFirst({
        where: {
          ipAddress,
          convertedUserId: null,
          createdAt: { gte: attributionWindowDate },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!click) {
      return null;
    }

    // Check if within attribution window
    const daysSinceClick = getDaysDifference(click.createdAt, new Date());
    const isWithinWindow = daysSinceClick <= TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS;

    // Update click with conversion
    if (isWithinWindow) {
      await prisma.referralClick.update({
        where: { id: click.id },
        data: {
          convertedToSignup: true,
          convertedUserId: userId,
          convertedAt: new Date(),
        },
      });
    }

    return {
      referralCode: click.referralCode,
      clickId: click.id,
      clickedAt: click.createdAt,
      convertedAt: new Date(),
      attributionWindow: TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS,
      isWithinWindow,
    };
  }

  /**
   * Get attribution data for a user
   */
  async getUserAttribution(userId: string): Promise<AttributionData | null> {
    const click = await prisma.referralClick.findFirst({
      where: { convertedUserId: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!click) {
      return null;
    }

    const daysSinceClick = getDaysDifference(click.createdAt, click.convertedAt || new Date());
    const isWithinWindow = daysSinceClick <= TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS;

    return {
      referralCode: click.referralCode,
      clickId: click.id,
      clickedAt: click.createdAt,
      convertedAt: click.convertedAt || undefined,
      attributionWindow: TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS,
      isWithinWindow,
    };
  }

  /**
   * Attribute a payment conversion to an agent referral
   */
  async attributePaymentConversion(
    paymentId: string,
    userId: string
  ): Promise<void> {
    // Get user's attributed referral click
    const attribution = await this.getUserAttribution(userId);

    if (!attribution || !attribution.isWithinWindow) {
      return;
    }

    // Find agent referral by code
    const agentReferral = await prisma.agentReferral.findFirst({
      where: { referralCode: attribution.referralCode },
    });

    if (!agentReferral) {
      return;
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return;
    }

    // Calculate commission (sub-agent gets 50% of 50% of 20%)
    const rentAmount = Number(payment.amount);
    const platformCommission = rentAmount * 0.2;
    const subAgentCommission = platformCommission * 0.5 * 0.5; // 5% of rent

    // Create agent referral conversion
    await prisma.agentReferralConversion.create({
      data: {
        referralId: agentReferral.id,
        paymentId,
        amount: rentAmount,
        commission: subAgentCommission,
        isPaid: false,
      },
    });

    // Update agent referral earnings
    await prisma.agentReferral.update({
      where: { id: agentReferral.id },
      data: {
        totalEarnings: {
          increment: subAgentCommission,
        },
      },
    });
  }

  /**
   * Get multi-touch attribution (if user clicked multiple referral links)
   */
  async getMultiTouchAttribution(userId: string): Promise<AttributionData[]> {
    const clicks = await prisma.referralClick.findMany({
      where: {
        OR: [
          { convertedUserId: userId },
          { sessionId: { not: null } }, // Add session-based matching if needed
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return clicks.map(click => {
      const daysSinceClick = getDaysDifference(click.createdAt, click.convertedAt || new Date());
      const isWithinWindow = daysSinceClick <= TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS;

      return {
        referralCode: click.referralCode,
        clickId: click.id,
        clickedAt: click.createdAt,
        convertedAt: click.convertedAt || undefined,
        attributionWindow: TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS,
        isWithinWindow,
      };
    });
  }

  /**
   * Clean up old unattributed clicks
   */
  async cleanupOldClicks(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - TRACKING_SETTINGS.ATTRIBUTION_WINDOW_DAYS - 7
    );

    const result = await prisma.referralClick.deleteMany({
      where: {
        convertedUserId: null,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}

export default new AttributionService();