import { PrismaClient } from '@newcondo/db';
import { customAlphabet } from 'nanoid';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Custom nanoid alphabet without ambiguous characters
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

interface ShareLinkResult {
  success: boolean;
  shareableLink?: string;
  fullUrl?: string;
  message?: string;
}

interface ShareLinkStats {
  propertyId: string;
  shareableLink: string;
  viewCount: number;
  favoriteCount: number;
  lastViewed?: Date;
  createdAt: Date;
}

export class SharingService {
  private static SHARE_LINK_PREFIX = 'share:';
  private static BASE_URL = process.env.FRONTEND_URL || 'https://newcondo.com';

  /**
   * Generate a shareable link for a property
   */
  static async generateShareLink(
    propertyId: string,
    unitId?: string
  ): Promise<ShareLinkResult> {
    try {
      // Check if property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          shareableLink: true,
          status: true,
          adminApprovalStatus: true
        }
      });

      if (!property) {
        return {
          success: false,
          message: 'Property not found'
        };
      }

      // Only generate share links for published properties
      if (property.status !== 'PUBLISHED' || property.adminApprovalStatus !== 'APPROVED') {
        return {
          success: false,
          message: 'Can only generate share links for published and approved properties'
        };
      }

      // If share link already exists, return it
      if (property.shareableLink) {
        const fullUrl = unitId
          ? `${this.BASE_URL}/properties/share/${property.shareableLink}?unit=${unitId}`
          : `${this.BASE_URL}/properties/share/${property.shareableLink}`;

        return {
          success: true,
          shareableLink: property.shareableLink,
          fullUrl,
          message: 'Existing share link retrieved'
        };
      }

      // Generate new unique share code
      let shareCode: string | undefined;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        shareCode = nanoid();
        
        // Check if code is already in use
        const existing = await prisma.property.findUnique({
          where: { shareableLink: shareCode }
        });

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique || !shareCode) {
        return {
          success: false,
          message: 'Failed to generate unique share link'
        };
      }

      // Update property with share link
      await prisma.property.update({
        where: { id: propertyId },
        data: { shareableLink: shareCode }
      });

      // Cache the share link mapping
      await redis.setex(
        `${this.SHARE_LINK_PREFIX}${shareCode}`,
        86400 * 30, // 30 days
        JSON.stringify({ propertyId, unitId: unitId || null }) // Store unitId as null if undefined
      );

      const fullUrl = unitId
        ? `${this.BASE_URL}/properties/share/${shareCode}?unit=${unitId}`
        : `${this.BASE_URL}/properties/share/${shareCode}`;

      return {
        success: true,
        shareableLink: shareCode,
        fullUrl,
        message: 'Share link generated successfully'
      };
    } catch (error) {
      console.error('Error generating share link:', error);
      return {
        success: false,
        message: 'Error generating share link'
      };
    }
  }

  /**
   * Resolve a share link to property details
   */
  static async resolveShareLink(shareCode: string): Promise<{ success: boolean; propertyId?: string; unitId?: string | null; message?: string }> {
    try {
      // Check cache first
      const cached = await redis.get(`${this.SHARE_LINK_PREFIX}${shareCode}`);
      
      if (cached) {
        const { propertyId, unitId } = JSON.parse(cached);
        
        // Increment view count
        await this.incrementViewCount(propertyId);

        return {
          success: true,
          propertyId,
          unitId: unitId || null
        };
      }

      // Fallback to database
      const property = await prisma.property.findUnique({
        where: { shareableLink: shareCode },
        select: {
            id: true,
            status: true,
            adminApprovalStatus: true
        }
      });

      if (!property || property.status !== 'PUBLISHED' || property.adminApprovalStatus !== 'APPROVED') {
        return {
            success: false,
            message: 'Invalid or unavailable share link'
        };
      }

      // Property found, cache it and increment count
      await redis.setex(
        `${this.SHARE_LINK_PREFIX}${shareCode}`,
        86400 * 30, // 30 days
        JSON.stringify({ propertyId: property.id, unitId: null })
      );
      
      await this.incrementViewCount(property.id);

      // Return property ID (unitId is null for the main property link)
      return {
        success: true,
        propertyId: property.id,
        unitId: null
      };

    } catch (error) {
      console.error('Error resolving share link:', error);
      return {
        success: false,
        message: 'Error resolving share link'
      };
    }
  }

  /**
   * Helper to increment the view count for a property
   */
  private static async incrementViewCount(propertyId: string): Promise<void> {
    try {
      // Use a single atomic operation to increment viewCount and update updatedAt (if needed)
      // We only care about incrementing viewCount for this service.
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          viewCount: {
            increment: 1,
          },
          // We don't update `updatedAt` on view count for performance/relevance reasons
        },
      });
      // Optionally, we could log this event to EventLog model, but for now, simple increment is sufficient.
    } catch (error) {
      // Non-critical error, just log it
      console.error(`Failed to increment view count for property ${propertyId}:`, error);
    }
  }

  /**
   * Retrieve statistics for a given share link/property
   */
  static async getShareLinkStats(propertyId: string): Promise<ShareLinkStats | null> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          shareableLink: true,
          viewCount: true,
          favoriteCount: true, // Assuming this is tracked via a separate mechanism (e.g., a Favorite model or User field)
          createdAt: true,
          // Note: `lastViewed` is not in the schema, so we omit it or assume it's calculated from EventLog if needed later.
        }
      });

      if (!property || !property.shareableLink) {
        return null;
      }

      return {
        propertyId: property.id,
        shareableLink: property.shareableLink,
        viewCount: property.viewCount,
        favoriteCount: property.favoriteCount,
        createdAt: property.createdAt,
        // lastViewed: undefined // Omitted as it's not directly in the Property model
      };
    } catch (error) {
      console.error('Error getting share link stats:', error);
      return null;
    }
  }
}