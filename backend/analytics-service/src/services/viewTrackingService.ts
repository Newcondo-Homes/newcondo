import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ViewTrackingService {
  /**
   * Track a property view
   */
  async trackView(
    propertyId: string,
    userId: string | null,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      agentId?: string; // If viewed via agent referral link
    }
  ): Promise<void> {
    try {
      // Create event log
      await prisma.eventLog.create({
        data: {
          userId: userId || undefined,
          type: metadata.agentId ? 'PROPERTY_VIEWED_VIA_REFERRAL' : 'PROPERTY_VIEWED',
          metadata: {
            propertyId,
            agentId: metadata.agentId,
            referrer: metadata.referrer,
          },
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      // Increment view count on property
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't throw error - view tracking should be non-blocking
    }
  }

  /**
   * Get unique view count for a property
   */
  async getUniqueViewCount(propertyId: string): Promise<number> {
    const events = await prisma.eventLog.findMany({
      where: {
        type: {
          in: ['PROPERTY_VIEWED', 'PROPERTY_VIEWED_VIA_REFERRAL'],
        },
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
        userId: {
          not: null,
        },
      },
      select: {
        userId: true,
      },
    });

    const uniqueUsers = new Set(events.map((e) => e.userId).filter(Boolean));
    return uniqueUsers.size;
  }

  /**
   * Get last view time for a property
   */
  async getLastViewTime(propertyId: string): Promise<Date | null> {
    const lastEvent = await prisma.eventLog.findFirst({
      where: {
        type: {
          in: ['PROPERTY_VIEWED', 'PROPERTY_VIEWED_VIA_REFERRAL'],
        },
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return lastEvent?.timestamp || null;
  }

  /**
   * Get referral views count
   */
  async getReferralViews(propertyId: string): Promise<number> {
    const count = await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_VIEWED_VIA_REFERRAL',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });

    return count;
  }

  /**
   * Get views by time period
   */
  async getViewsByPeriod(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const count = await prisma.eventLog.count({
      where: {
        type: {
          in: ['PROPERTY_VIEWED', 'PROPERTY_VIEWED_VIA_REFERRAL'],
        },
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return count;
  }
}