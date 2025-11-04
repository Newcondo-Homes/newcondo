// backend/referral-service/src/services/subAgentService.ts

import { PrismaClient, PropertyPromotionType, PromotionRequestStatus } from '@prisma/client';
import { promotionLinkService } from './promotionLinkService';

const prisma = new PrismaClient();

interface PromotionRequestFilters {
  propertyId?: string;
  status?: PromotionRequestStatus;
  page: number;
  limit: number;
}

interface SubAgentPropertiesFilters {
  page: number;
  limit: number;
}

export class SubAgentService {
  /**
   * Request to promote a property (become sub-agent)
   */
  async requestPromotion(agentId: string, propertyId: string, message?: string) {
    // Check if property exists and get promotion settings
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        promotionSettings: true,
        owner: { select: { id: true } },
        agent: { select: { id: true } },
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found' };
    }

    // Check if user is trying to promote their own property
    if (property.ownerId === agentId || property.agentId === agentId) {
      return { success: false, message: 'You cannot promote your own property as a sub-agent' };
    }

    // Check promotion settings
    const settings = property.promotionSettings;
    if (!settings) {
      // Create default settings if not exists
      await prisma.propertyPromotionSettings.create({
        data: {
          propertyId,
          promotionType: PropertyPromotionType.RESTRICTED,
        },
      });
      return { success: false, message: 'This property does not allow promotion' };
    }

    if (settings.promotionType === PropertyPromotionType.RESTRICTED) {
      return { success: false, message: 'This property does not allow promotion' };
    }

    if (settings.promotionType === PropertyPromotionType.PUBLIC) {
      // Auto-approve for public properties
      return await this.autoApprovePromotion(agentId, propertyId, property.ownerId);
    }

    // Check if request already exists
    const existingRequest = await prisma.promotionRequest.findUnique({
      where: {
        agentId_propertyId: {
          agentId,
          propertyId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === PromotionRequestStatus.PENDING) {
        return { success: false, message: 'You already have a pending request for this property' };
      }
      if (existingRequest.status === PromotionRequestStatus.APPROVED) {
        return { success: false, message: 'You are already approved to promote this property' };
      }
    }

    // Create promotion request
    const request = await prisma.promotionRequest.create({
      data: {
        agentId,
        propertyId,
        ownerId: property.agentId || property.ownerId, // Request goes to listing agent or owner
        message,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            images: {
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    // TODO: Send notification to property owner/listing agent

    return {
      success: true,
      message: 'Promotion request sent successfully',
      data: {
        requestId: request.id,
        status: request.status,
        property: request.property,
        createdAt: request.createdAt.toISOString(),
      },
    };
  }

  /**
   * Auto-approve promotion for public properties
   */
  private async autoApprovePromotion(agentId: string, propertyId: string, ownerId: string) {
    // Create approved request
    const request = await prisma.promotionRequest.create({
      data: {
        agentId,
        propertyId,
        ownerId,
        status: PromotionRequestStatus.APPROVED,
        respondedAt: new Date(),
      },
    });

    // Create referral link
    const referralCode = promotionLinkService.generateReferralCode();
    const referralLink = promotionLinkService.generateReferralLink(referralCode, propertyId);

    await prisma.agentReferral.create({
      data: {
        agentId,
        propertyId,
        referralCode,
        referralLink,
      },
    });

    return {
      success: true,
      message: 'You are now approved to promote this property',
      data: {
        requestId: request.id,
        referralCode,
        referralLink,
      },
    };
  }

  /**
   * Get promotion requests for property owner/listing agent
   */
  async getPromotionRequests(userId: string, filters: PromotionRequestFilters) {
    const { propertyId, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = { ownerId: userId };
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.promotionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              agentReliabilityScore: true,
              completedMarkingJobs: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      }),
      prisma.promotionRequest.count({ where }),
    ]);

    return {
      requests: requests.map(request => ({
        id: request.id,
        agent: {
          id: request.agent.id,
          name: request.agent.name,
          email: request.agent.email,
          phone: request.agent.phone,
          reliabilityScore: request.agent.agentReliabilityScore?.toString(),
          completedJobs: request.agent.completedMarkingJobs,
        },
        property: {
          id: request.property.id,
          title: request.property.title,
          address: `${request.property.address}, ${request.property.city}, ${request.property.state}`,
          image: request.property.images[0]?.url || null,
        },
        message: request.message,
        status: request.status,
        rejectionReason: request.rejectionReason,
        respondedAt: request.respondedAt?.toISOString(),
        createdAt: request.createdAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Handle promotion request (approve/reject)
   */
  async handlePromotionRequest(
    requestId: string,
    userId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ) {
    // Find request and verify ownership
    const request = await prisma.promotionRequest.findFirst({
      where: {
        id: requestId,
        ownerId: userId,
        status: PromotionRequestStatus.PENDING,
      },
    });

    if (!request) {
      return { success: false, message: 'Request not found or already processed' };
    }

    if (action === 'approve') {
      // Create referral link for sub-agent
      const referralCode = promotionLinkService.generateReferralCode();
      const referralLink = promotionLinkService.generateReferralLink(referralCode, request.propertyId);

      // Update request status
      await prisma.promotionRequest.update({
        where: { id: requestId },
        data: {
          status: PromotionRequestStatus.APPROVED,
          respondedAt: new Date(),
          respondedBy: userId,
        },
      });

      // Create agent referral
      const referral = await prisma.agentReferral.create({
        data: {
          agentId: request.agentId,
          propertyId: request.propertyId,
          referralCode,
          referralLink,
        },
      });

      // TODO: Send notification to agent

      return {
        success: true,
        message: 'Promotion request approved successfully',
        data: {
          requestId: request.id,
          referralCode,
          referralLink,
          agentId: request.agentId,
        },
      };
    } else {
      // Reject request
      await prisma.promotionRequest.update({
        where: { id: requestId },
        data: {
          status: PromotionRequestStatus.REJECTED,
          rejectionReason,
          respondedAt: new Date(),
          respondedBy: userId,
        },
      });

      // TODO: Send notification to agent

      return {
        success: true,
        message: 'Promotion request rejected',
        data: { requestId: request.id },
      };
    }
  }

  /**
   * Get sub-agents for a property
   */
  async getPropertySubAgents(propertyId: string, userId: string) {
    // Verify user has access to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
    });

    if (!property) return null;

    // Get approved sub-agents
    const subAgents = await prisma.agentReferral.findMany({
      where: { propertyId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
          },
        },
      },
    });

    return subAgents.map(referral => ({
      id: referral.id,
      agent: {
        id: referral.agent.id,
        name: referral.agent.name,
        email: referral.agent.email,
        phone: referral.agent.phone,
        reliabilityScore: referral.agent.agentReliabilityScore?.toString(),
        completedJobs: referral.agent.completedMarkingJobs,
      },
      metrics: {
        clicks: referral.clicks,
        uniqueClicks: referral.uniqueClicks,
        conversions: referral.conversions,
        conversionRate: referral.clicks > 0 ? ((referral.conversions / referral.clicks) * 100).toFixed(2) : '0',
        totalEarnings: referral.totalEarnings.toString(),
      },
      referralCode: referral.referralCode,
      referralLink: referral.referralLink,
      isActive: referral.isActive,
      createdAt: referral.createdAt.toISOString(),
    }));
  }

  /**
   * Remove sub-agent from property
   */
  async removeSubAgent(propertyId: string, subAgentId: string, userId: string) {
    // Verify user has access to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found or access denied' };
    }

    // Find and deactivate the referral
    const referral = await prisma.agentReferral.findUnique({
      where: {
        agentId_propertyId: {
          agentId: subAgentId,
          propertyId,
        },
      },
    });

    if (!referral) {
      return { success: false, message: 'Sub-agent not found' };
    }

    // Deactivate referral
    await prisma.agentReferral.update({
      where: { id: referral.id },
      data: { isActive: false },
    });

    // Update promotion request status
    await prisma.promotionRequest.updateMany({
      where: {
        agentId: subAgentId,
        propertyId,
        status: PromotionRequestStatus.APPROVED,
      },
      data: {
        status: PromotionRequestStatus.REJECTED,
        rejectionReason: 'Removed by property owner/agent',
        respondedAt: new Date(),
        respondedBy: userId,
      },
    });

    // TODO: Send notification to sub-agent

    return {
      success: true,
      message: 'Sub-agent removed successfully',
    };
  }

  /**
   * Get properties where user is sub-agent
   */
  async getSubAgentProperties(userId: string, filters: SubAgentPropertiesFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      prisma.agentReferral.findMany({
        where: {
          agentId: userId,
          isActive: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              description: true,
              address: true,
              city: true,
              state: true,
              price: true,
              propertyType: true,
              bedrooms: true,
              bathrooms: true,
              status: true,
              isAvailable: true,
              images: {
                select: {
                  id: true,
                  url: true,
                  altText: true,
                  isPrimary: true,
                },
                orderBy: { order: 'asc' },
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
              agent: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      prisma.agentReferral.count({
        where: {
          agentId: userId,
          isActive: true,
        },
      }),
    ]);

    return {
      properties: referrals.map(referral => ({
        referralId: referral.id,
        property: {
          id: referral.property.id,
          title: referral.property.title,
          description: referral.property.description,
          address: `${referral.property.address}, ${referral.property.city}, ${referral.property.state}`,
          price: referral.property.price?.toString(),
          propertyType: referral.property.propertyType,
          bedrooms: referral.property.bedrooms,
          bathrooms: referral.property.bathrooms,
          status: referral.property.status,
          isAvailable: referral.property.isAvailable,
          images: referral.property.images,
          listingAgent: referral.property.agent || referral.property.owner,
        },
        referralCode: referral.referralCode,
        referralLink: referral.referralLink,
        metrics: {
          clicks: referral.clicks,
          uniqueClicks: referral.uniqueClicks,
          conversions: referral.conversions,
          conversionRate: referral.clicks > 0 ? ((referral.conversions / referral.clicks) * 100).toFixed(2) : '0',
          totalEarnings: referral.totalEarnings.toString(),
        },
        createdAt: referral.createdAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Update property promotion settings
   */
  async updatePromotionSettings(propertyId: string, userId: string, promotionType: string) {
    // Verify user has access to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ ownerId: userId }, { agentId: userId }],
      },
      include: {
        promotionSettings: true,
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found or access denied' };
    }

    // Update or create promotion settings
    const settings = await prisma.propertyPromotionSettings.upsert({
      where: { propertyId },
      update: {
        promotionType: promotionType as PropertyPromotionType,
      },
      create: {
        propertyId,
        promotionType: promotionType as PropertyPromotionType,
      },
    });

    // If changing to RESTRICTED, deactivate all sub-agent referrals
    if (promotionType === PropertyPromotionType.RESTRICTED) {
      await prisma.agentReferral.updateMany({
        where: { propertyId },
        data: { isActive: false },
      });
    }

    return {
      success: true,
      message: 'Promotion settings updated successfully',
      data: {
        propertyId,
        promotionType: settings.promotionType,
      },
    };
  }
}

export const subAgentService = new SubAgentService();