// backend/marking-service/src/services/shareableLinkService.ts

import { PrismaClient } from '@newcondo/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface ShareableLinkData {
  markingJobId: string;
  propertyId: string;
  requestedBy: string;
  expiresAt: Date;
}

interface LinkValidationResult {
  isValid: boolean;
  data?: ShareableLinkData;
  error?: string;
}

export class ShareableLinkService {
  private prisma: PrismaClient;
  private readonly JWT_SECRET: string;
  private readonly LINK_EXPIRY_HOURS = 72; // 3 days

  constructor() {
    this.prisma = new PrismaClient();
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Generate a shareable link for property marking
   */
  async generateShareableLink(
    markingJobId: string,
    propertyId: string,
    requestedBy: string
  ): Promise<string> {
    // Verify marking job exists
    const markingJob = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: { property: true },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    if (markingJob.requestedBy !== requestedBy) {
      throw new Error('Unauthorized to generate link for this marking job');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry (3 days from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.LINK_EXPIRY_HOURS);

    // Create JWT with embedded data
    const linkData: ShareableLinkData = {
      markingJobId,
      propertyId,
      requestedBy,
      expiresAt,
    };

    const jwtToken = jwt.sign(linkData, this.JWT_SECRET, {
      expiresIn: `${this.LINK_EXPIRY_HOURS}h`,
    });

    // Construct shareable URL
    const baseUrl = process.env.FRONTEND_URL || 'https://newcondo.com';
    const shareableLink = `${baseUrl}/mark-property/${token}?t=${jwtToken}`;

    // Store link reference in database
    await this.prisma.propertyMarkingJob.update({
      where: { id: markingJobId },
      data: {
        status: 'QUEUED',
        maxCompletionTime: expiresAt,
      },
    });

    // Log event
    await this.prisma.eventLog.create({
      data: {
        userId: requestedBy,
        type: 'SHAREABLE_LINK_GENERATED',
        metadata: {
          markingJobId,
          propertyId,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return shareableLink;
  }

  /**
   * Validate shareable link
   */
  async validateShareableLink(token: string): Promise<LinkValidationResult> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.JWT_SECRET) as ShareableLinkData;

      // Check if link has expired
      const now = new Date();
      const expiresAt = new Date(decoded.expiresAt);

      if (now > expiresAt) {
        return {
          isValid: false,
          error: 'Link has expired',
        };
      }

      // Verify marking job still exists and is valid
      const markingJob = await this.prisma.propertyMarkingJob.findUnique({
        where: { id: decoded.markingJobId },
        include: {
          property: true,
          requestingUser: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      if (!markingJob) {
        return {
          isValid: false,
          error: 'Marking job not found',
        };
      }

      // Check if job is still in valid status
      if (!['QUEUED', 'ASSIGNED'].includes(markingJob.status)) {
        return {
          isValid: false,
          error: `Marking job is ${markingJob.status.toLowerCase()}`,
        };
      }

      return {
        isValid: true,
        data: {
          ...decoded,
          expiresAt: expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Link has expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: 'Invalid link',
        };
      }

      return {
        isValid: false,
        error: 'Link validation failed',
      };
    }
  }

  /**
   * Get marking job details from link
   */
  async getMarkingJobFromLink(token: string) {
    const validation = await this.validateShareableLink(token);

    if (!validation.isValid || !validation.data) {
      throw new Error(validation.error || 'Invalid link');
    }

    const markingJob = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: validation.data.markingJobId },
      include: {
        property: {
          include: {
            images: true,
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    return {
      markingJob,
      linkData: validation.data,
    };
  }

  /**
   * Revoke/invalidate a shareable link
   */
  async revokeShareableLink(markingJobId: string, userId: string): Promise<void> {
    const markingJob = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    if (markingJob.requestedBy !== userId) {
      throw new Error('Unauthorized to revoke this link');
    }

    // Update job status to prevent link usage
    await this.prisma.propertyMarkingJob.update({
      where: { id: markingJobId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Log event
    await this.prisma.eventLog.create({
      data: {
        userId,
        type: 'SHAREABLE_LINK_REVOKED',
        metadata: {
          markingJobId,
        },
      },
    });
  }

  /**
   * Check if link has been used
   */
  async isLinkUsed(markingJobId: string): Promise<boolean> {
    const markingJob = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      select: { status: true, completedAt: true },
    });

    if (!markingJob) {
      return false;
    }

    return markingJob.status === 'COMPLETED' && markingJob.completedAt !== null;
  }

  /**
   * Generate short code for easy sharing
   */
  generateShortCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let shortCode = '';
    
    for (let i = 0; i < 8; i++) {
      shortCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return shortCode;
  }

  /**
   * Track link access
   */
  async trackLinkAccess(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const validation = await this.validateShareableLink(token);

      if (validation.isValid && validation.data) {
        await this.prisma.eventLog.create({
          data: {
            type: 'SHAREABLE_LINK_ACCESSED',
            metadata: {
              markingJobId: validation.data.markingJobId,
              propertyId: validation.data.propertyId,
            },
            ipAddress,
            userAgent,
          },
        });
      }
    } catch (error) {
      // Silently fail - tracking shouldn't break functionality
      console.error('Failed to track link access:', error);
    }
  }

  /**
   * Get link usage statistics
   */
  async getLinkStatistics(markingJobId: string) {
    const accessLogs = await this.prisma.eventLog.findMany({
      where: {
        type: 'SHAREABLE_LINK_ACCESSED',
        metadata: {
          path: ['markingJobId'],
          equals: markingJobId,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const markingJob = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      select: {
        createdAt: true,
        completedAt: true,
        status: true,
      },
    });

    return {
      totalAccess: accessLogs.length,
      uniqueIps: [...new Set(accessLogs.map(log => log.ipAddress).filter(Boolean))].length,
      firstAccess: accessLogs[accessLogs.length - 1]?.timestamp,
      lastAccess: accessLogs[0]?.timestamp,
      isUsed: markingJob?.status === 'COMPLETED',
      completedAt: markingJob?.completedAt,
    };
  }
}