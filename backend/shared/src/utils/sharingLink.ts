import { nanoid } from 'nanoid';
import { prisma } from '@newcondo/db';

export interface SharingLinkOptions {
  propertyId: string;
  unitId?: string;
  expiresIn?: number; // milliseconds
  trackClicks?: boolean;
}

export interface SharingLinkResult {
  shareableLink: string;
  fullUrl: string;
  expiresAt?: Date;
}

/**
 * Generate shareable link for property/unit
 */
export const generateSharingLink = async (
  options: SharingLinkOptions
): Promise<SharingLinkResult> => {
  const { propertyId, unitId, expiresIn, trackClicks = true } = options;

  // Generate unique link identifier
  const linkId = nanoid(10);

  // Construct shareable link
  const baseUrl = process.env.FRONTEND_URL || 'https://newcondo.com';
  const shareableLink = unitId
    ? `${linkId}?unit=${unitId}`
    : linkId;

  const fullUrl = `${baseUrl}/properties/shared/${shareableLink}`;

  // Calculate expiration
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : undefined;

  // Update property with shareable link
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      shareableLink: linkId,
    },
  });

  return {
    shareableLink: linkId,
    fullUrl,
    expiresAt,
  };
};

/**
 * Validate sharing link
 */
export const validateSharingLink = async (
  linkId: string
): Promise<{ valid: boolean; propertyId?: string; unitId?: string }> => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        shareableLink: linkId,
      },
      select: {
        id: true,
        status: true,
        adminApprovalStatus: true,
      },
    });

    if (!property) {
      return { valid: false };
    }

    // Check if property is published and approved
    const valid =
      property.status === 'PUBLISHED' &&
      property.adminApprovalStatus === 'APPROVED';

    return {
      valid,
      propertyId: property.id,
    };
  } catch (error) {
    console.error('Error validating sharing link:', error);
    return { valid: false };
  }
};

/**
 * Track sharing link click
 */
export const trackSharingLinkClick = async (
  linkId: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  }
): Promise<void> => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        shareableLink: linkId,
      },
    });

    if (!property) {
      return;
    }

    // Increment view count
    await prisma.property.update({
      where: { id: property.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        type: 'PROPERTY_SHARED_LINK_CLICKED',
        metadata: {
          propertyId: property.id,
          linkId,
          ...metadata,
        },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });
  } catch (error) {
    console.error('Error tracking sharing link click:', error);
  }
};

/**
 * Revoke sharing link
 */
export const revokeSharingLink = async (propertyId: string): Promise<boolean> => {
  try {
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        shareableLink: null,
      },
    });

    return true;
  } catch (error) {
    console.error('Error revoking sharing link:', error);
    return false;
  }
};

/**
 * Get sharing link analytics
 */
export const getSharingLinkAnalytics = async (linkId: string) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        shareableLink: linkId,
      },
      select: {
        id: true,
        viewCount: true,
        createdAt: true,
      },
    });

    if (!property) {
      return null;
    }

    // Get click events
    const clicks = await prisma.eventLog.count({
      where: {
        type: 'PROPERTY_SHARED_LINK_CLICKED',
        metadata: {
          path: ['linkId'],
          equals: linkId,
        },
      },
    });

    return {
      propertyId: property.id,
      totalViews: property.viewCount,
      sharedLinkClicks: clicks,
      createdAt: property.createdAt,
    };
  } catch (error) {
    console.error('Error getting sharing link analytics:', error);
    return null;
  }
};