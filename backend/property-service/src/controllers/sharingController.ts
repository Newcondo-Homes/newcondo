// backend/property-service/src/controllers/sharingController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate a shareable link for a property
 */
export const generateShareableLink = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id; // From auth middleware

    // Verify property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: { id: true, name: true }
        },
        agent: {
          select: { id: true, name: true }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user is owner or agent
    const hasPermission = property.ownerId === userId || property.agentId === userId;
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate a shareable link for this property'
      });
    }

    // Check if property already has a shareable link
    if (property.shareableLink) {
      return res.status(200).json({
        success: true,
        data: {
          shareableLink: property.shareableLink,
          fullUrl: `${process.env.PLATFORM_URL}/properties/shared/${property.shareableLink}`,
          propertyId: property.id,
          createdAt: property.updatedAt
        }
      });
    }

    // Generate unique shareable link
    const uniqueCode = crypto.randomBytes(8).toString('hex');
    
    // Update property with shareable link
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        shareableLink: uniqueCode
      }
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'SHAREABLE_LINK_GENERATED',
        metadata: {
          propertyId,
          shareableLink: uniqueCode
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Shareable link generated successfully',
      data: {
        shareableLink: uniqueCode,
        fullUrl: `${process.env.PLATFORM_URL}/properties/shared/${uniqueCode}`,
        propertyId: property.id
      }
    });
  } catch (error) {
    console.error('Error generating shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate shareable link',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get property by shareable link
 */
export const getPropertyByShareableLink = async (req: Request, res: Response) => {
  try {
    const { shareableLink } = req.params;

    const property = await prisma.property.findUnique({
      where: { shareableLink },
      include: {
        images: {
          orderBy: { order: 'asc' }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            verificationStatus: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            verificationStatus: true,
            agentReliabilityScore: true
          }
        },
        units: {
          where: {
            isAvailable: true,
            status: 'AVAILABLE'
          },
          include: {
            images: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { unitNumber: 'asc' }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or link is invalid'
      });
    }

    // Check if property is available
    if (property.status !== 'PUBLISHED' || property.adminApprovalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'This property is not currently available for viewing'
      });
    }

    // Increment view count
    await prisma.property.update({
      where: { id: property.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    // Log view event
    await prisma.eventLog.create({
      data: {
        type: 'PROPERTY_VIEWED_VIA_LINK',
        metadata: {
          propertyId: property.id,
          shareableLink,
          timestamp: new Date()
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Error fetching property by shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Revoke/delete shareable link
 */
export const revokeShareableLink = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;

    // Verify property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
        shareableLink: true
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check permission
    const hasPermission = property.ownerId === userId || property.agentId === userId;
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to revoke this shareable link'
      });
    }

    if (!property.shareableLink) {
      return res.status(400).json({
        success: false,
        message: 'This property does not have a shareable link'
      });
    }

    // Remove shareable link
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        shareableLink: null
      }
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'SHAREABLE_LINK_REVOKED',
        metadata: {
          propertyId,
          revokedLink: property.shareableLink
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Shareable link revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke shareable link',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get sharing analytics for a property
 */
export const getSharingAnalytics = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;

    // Verify property exists and user has permission
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        agentId: true,
        shareableLink: true,
        viewCount: true,
        favoriteCount: true
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check permission
    const hasPermission = property.ownerId === userId || property.agentId === userId;
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics for this property'
      });
    }

    // Get view events from shareable link
    const viewEvents = await prisma.eventLog.findMany({
      where: {
        type: 'PROPERTY_VIEWED_VIA_LINK',
        metadata: {
          path: ['propertyId'],
          equals: propertyId
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });

    // Calculate analytics
    const totalViews = viewEvents.length;
    const uniqueIPs = new Set(viewEvents.map(e => e.ipAddress).filter(Boolean)).size;
    
    // Views by date
    const viewsByDate: Record<string, number> = {};
    viewEvents.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        shareableLink: property.shareableLink,
        totalViews: property.viewCount,
        viewsViaLink: totalViews,
        uniqueVisitors: uniqueIPs,
        favoriteCount: property.favoriteCount,
        viewsByDate,
        recentViews: viewEvents.slice(0, 10).map(e => ({
          timestamp: e.timestamp,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching sharing analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sharing analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};