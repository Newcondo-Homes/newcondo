// backend/property-service/src/services/propertyMarketingService.ts

import { PrismaClient } from '@prisma/client';
import { PropertyMarketingData } from '../types/propertyManagement';
import crypto from 'crypto';

const prisma = new PrismaClient();

type PromotionStatus = 'PUBLIC' | 'PERMISSION_BASED' | 'RESTRICTED' | 'REQUEST_BASED';

interface SubAgentPromotion {
  agentId: string;
  agentName: string;
  agentEmail: string;
  promotionLink: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  requestedAt: Date;
  approvedAt?: Date;
  sharesCount: number;
  viewsGenerated: number;
  conversions: number;
}

export class PropertyMarketingService {
  /**
   * Generate or retrieve shareable link for property
   */
  async getShareableLink(propertyId: string, userId: string): Promise<string> {
    // Verify access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
        shareableLink: true,
      },
    });

    if (!property || (property.ownerId !== userId && property.agentId !== userId)) {
      throw new Error('Unauthorized access to property');
    }

    // Generate shareable link if it doesn't exist
    if (!property.shareableLink) {
      const linkId = this.generateLinkId();
      const shareableLink = `${process.env.FRONTEND_URL}/properties/share/${linkId}`;

      await prisma.property.update({
        where: { id: propertyId },
        data: { shareableLink },
      });

      return shareableLink;
    }

    return property.shareableLink;
  }

  /**
   * Generate agent-specific promotion link
   */
  async generateAgentPromotionLink(propertyId: string, agentId: string): Promise<string> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Check if agent is authorized to promote
    const canPromote = await this.checkPromotionPermission(propertyId, agentId);
    if (!canPromote) {
      throw new Error('Agent not authorized to promote this property');
    }

    // Create or get promotion tracking record
    const trackingId = this.generateLinkId();
    const promotionLink = `${process.env.FRONTEND_URL}/properties/${propertyId}?ref=${trackingId}&agent=${agentId}`;

    // Store promotion tracking in EventLog
    await prisma.eventLog.create({
      data: {
        userId: agentId,
        type: 'AGENT_PROMOTION_LINK_CREATED',
        metadata: {
          propertyId,
          trackingId,
          promotionLink,
        },
      },
    });

    return promotionLink;
  }

  /**
   * Get property marketing data
   */
  async getPropertyMarketingData(propertyId: string, userId: string): Promise<PropertyMarketingData> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
        shareableLink: true,
      },
    });

    if (!property || (property.ownerId !== userId && property.agentId !== userId)) {
      throw new Error('Unauthorized access to property marketing data');
    }

    // Get or create shareable link
    const shareableLink = property.shareableLink || await this.getShareableLink(propertyId, userId);

    // Get promotion status
    const promotionStatus = await this.getPromotionStatus(propertyId);

    // Get share metrics
    const shareEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_SHARED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });

    const totalShares = shareEvents.length;

    // Group shares by platform
    const sharesByPlatform = this.groupSharesByPlatform(shareEvents);

    // Get sub-agent performance
    const subAgents = await this.getSubAgentPerformance(propertyId);

    return {
      shareableLink,
      promotionStatus,
      totalShares,
      sharesByPlatform,
      subAgents: subAgents.length > 0 ? subAgents : undefined,
    };
  }

  /**
   * Update property promotion settings
   */
  async updatePromotionSettings(
    propertyId: string,
    userId: string,
    settings: {
      promotionStatus: PromotionStatus;
      allowedAgents?: string[];
    }
  ): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerId: true,
        agentId: true,
      },
    });

    if (!property || (property.ownerId !== userId && property.agentId !== userId)) {
      throw new Error('Unauthorized access to property');
    }

    // Store promotion settings in a metadata table or JSON field
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'PROMOTION_SETTINGS_UPDATED',
        metadata: {
          propertyId,
          ...settings,
        },
      },
    });
  }

  /**
   * Request permission to promote property (for sub-agents)
   */
  async requestPromotionPermission(propertyId: string, agentId: string): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Check if request already exists
    const existingRequest = await prisma.eventLog.findFirst({
      where: {
        userId: agentId,
        type: 'PROMOTION_PERMISSION_REQUESTED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
    });

    if (existingRequest) {
      throw new Error('Promotion request already exists');
    }

    // Create promotion request
    await prisma.eventLog.create({
      data: {
        userId: agentId,
        type: 'PROMOTION_PERMISSION_REQUESTED',
        metadata: {
          propertyId,
          status: 'PENDING',
          requestedAt: new Date(),
        },
      },
    });

    // Create notification for property owner/listing agent
    await this.notifyPromotionRequest(propertyId, agentId, property.ownerId, property.agentId);
  }

  /**
   * Approve or reject promotion request
   */
  async handlePromotionRequest(
    propertyId: string,
    agentId: string,
    ownerId: string,
    action: 'APPROVE' | 'REJECT'
  ): Promise<void> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerId: true,
        agentId: true,
      },
    });

    if (!property || (property.ownerId !== ownerId && property.agentId !== ownerId)) {
      throw new Error('Unauthorized to handle promotion requests');
    }

    // Update the request
    await prisma.eventLog.create({
      data: {
        userId: ownerId,
        type: 'PROMOTION_REQUEST_HANDLED',
        metadata: {
          propertyId,
          agentId,
          action,
          handledAt: new Date(),
        },
      },
    });

    // Notify the requesting agent
    await this.notifyPromotionResponse(propertyId, agentId, action);
  }

  /**
   * Track property share event
   */
  async trackPropertyShare(
    propertyId: string,
    userId: string,
    platform: string,
    trackingId?: string
  ): Promise<void> {
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'PROPERTY_SHARED',
        metadata: {
          propertyId,
          platform,
          trackingId,
          sharedAt: new Date(),
        },
      },
    });

    // Increment share count
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        viewCount: {
          increment: 0, // We can add a shareCount field if needed
        },
      },
    });
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(
    propertyId: string,
    referralAgentId: string,
    rentalId: string
  ): Promise<void> {
    await prisma.eventLog.create({
      data: {
        userId: referralAgentId,
        type: 'REFERRAL_CONVERSION',
        metadata: {
          propertyId,
          rentalId,
          convertedAt: new Date(),
        },
      },
    });
  }

  /**
   * Get sub-agent performance metrics
   */
  private async getSubAgentPerformance(propertyId: string): Promise<any[]> {
    const promotionEvents = await prisma.eventLog.findMany({
      where: {
        type: 'AGENT_PROMOTION_LINK_CREATED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const subAgents = await Promise.all(
      promotionEvents.map(async (event) => {
        const agentId = event.userId!;
        const metadata = event.metadata as any;
        const trackingId = metadata.trackingId;

        // Get views generated by this agent
        const views = await prisma.eventLog.count({
          where: {
            type: 'PROPERTY_VIEWED',
            metadata: {
              path: ['trackingId'],
              equals: trackingId,
            },
          },
        });

        // Get conversions
        const conversions = await prisma.eventLog.count({
          where: {
            userId: agentId,
            type: 'REFERRAL_CONVERSION',
            metadata: {
              path: ['propertyId'],
              equals: propertyId,
            },
          },
        });

        // Get share count
        const sharesCount = await prisma.eventLog.count({
          where: {
            userId: agentId,
            type: 'PROPERTY_SHARED',
            metadata: {
              path: ['propertyId'],
              equals: propertyId,
            },
          },
        });

        return {
          id: agentId,
          name: event.user?.name || 'Unknown Agent',
          sharesCount,
          viewsGenerated: views,
          conversions,
        };
      })
    );

    return subAgents.filter(agent => agent.sharesCount > 0 || agent.viewsGenerated > 0);
  }

  /**
   * Get promotion status for a property
   */
  private async getPromotionStatus(propertyId: string): Promise<PromotionStatus> {
    const latestSetting = await prisma.eventLog.findFirst({
      where: {
        type: 'PROMOTION_SETTINGS_UPDATED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!latestSetting) {
      return 'PUBLIC'; // Default
    }

    const metadata = latestSetting.metadata as any;
    return metadata.promotionStatus || 'PUBLIC';
  }

  /**
   * Check if agent can promote property
   */
  private async checkPromotionPermission(propertyId: string, agentId: string): Promise<boolean> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) return false;

    // Listing agent can always promote
    if (property.agentId === agentId) return true;

    const promotionStatus = await this.getPromotionStatus(propertyId);

    // Public promotion - anyone can promote
    if (promotionStatus === 'PUBLIC') return true;

    // Restricted - no one can promote except listing agent
    if (promotionStatus === 'RESTRICTED') return false;

    // Permission-based or request-based - check if approved
    const approval = await prisma.eventLog.findFirst({
      where: {
        type: 'PROMOTION_REQUEST_HANDLED',
        metadata: {
          path: ['propertyId'],
          equals: propertyId,
          path: ['agentId'],
          equals: agentId,
          path: ['action'],
          equals: 'APPROVE',
        },
      },
    });

    return !!approval;
  }

  /**
   * Group shares by platform
   */
  private groupSharesByPlatform(shareEvents: any[]) {
    const grouped: { [platform: string]: number } = {};

    shareEvents.forEach(event => {
      const metadata = event.metadata as any;
      const platform = metadata.platform || 'Direct';
      grouped[platform] = (grouped[platform] || 0) + 1;
    });

    return Object.entries(grouped).map(([platform, count]) => ({
      platform,
      count,
    }));
  }

  /**
   * Generate unique link ID
   */
  private generateLinkId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Notify property owner of promotion request
   */
  private async notifyPromotionRequest(
    propertyId: string,
    agentId: string,
    ownerId: string,
    listingAgentId: string | null
  ): Promise<void> {
    // Implementation would send notification via notification service
    // For now, just log the event
    console.log(`Promotion request for property ${propertyId} from agent ${agentId}`);
  }

  /**
   * Notify agent of promotion response
   */
  private async notifyPromotionResponse(
    propertyId: string,
    agentId: string,
    action: 'APPROVE' | 'REJECT'
  ): Promise<void> {
    // Implementation would send notification via notification service
    console.log(`Promotion request ${action} for property ${propertyId} to agent ${agentId}`);
  }
}

export default new PropertyMarketingService();