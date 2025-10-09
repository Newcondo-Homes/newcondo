// backend/marking-service/src/controllers/shareableLinkController.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Validation schemas
const generateLinkSchema = z.object({
  markingJobId: z.string().cuid(),
  expiresInHours: z.number().min(1).max(168).default(48), // Max 7 days
  maxUses: z.number().min(1).max(10).default(1),
  recipientName: z.string().min(2).max(100).optional(),
  recipientPhone: z.string().optional(),
});

const verifyLinkSchema = z.object({
  token: z.string(),
});

const markPropertySchema = z.object({
  token: z.string(),
  boundaryCoordinates: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
  })).min(3),
  completionImages: z.array(z.string().url()).min(1).max(20),
  completionNotes: z.string().max(1000).optional(),
  gpsCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

// In-memory store for shareable links (in production, use Redis)
interface ShareableLink {
  id: string;
  markingJobId: string;
  token: string;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  recipientName?: string;
  recipientPhone?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  usedAt?: Date[];
}

// Temporary in-memory store (replace with Redis in production)
const shareableLinkStore = new Map<string, ShareableLink>();

/**
 * Generate a shareable link for property marking
 * POST /api/marking/shareable-links/generate
 */
export const generateShareableLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate request body
    const validatedData = generateLinkSchema.parse(req.body);

    // TODO: Verify marking job exists and belongs to user
    // const markingJob = await prisma.propertyMarkingJob.findUnique({
    //   where: { id: validatedData.markingJobId },
    //   include: { property: true, requestingUser: true },
    // });

    // if (!markingJob || markingJob.requestedBy !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Marking job not found or unauthorized',
    //   });
    // }

    // Generate unique token
    const tokenPayload = {
      markingJobId: validatedData.markingJobId,
      purpose: 'property_marking',
      timestamp: Date.now(),
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: `${validatedData.expiresInHours}h` }
    );

    // Generate short code for easy sharing
    const shortCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create shareable link data
    const linkId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validatedData.expiresInHours);

    const shareableLink: ShareableLink = {
      id: linkId,
      markingJobId: validatedData.markingJobId,
      token,
      expiresAt,
      maxUses: validatedData.maxUses,
      usedCount: 0,
      recipientName: validatedData.recipientName,
      recipientPhone: validatedData.recipientPhone,
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
    };

    // Store link data
    shareableLinkStore.set(linkId, shareableLink);

    // Generate shareable URLs
    const baseUrl = process.env.PLATFORM_URL || 'https://newcondo.com';
    const fullUrl = `${baseUrl}/mark-property/${shortCode}?token=${token}`;
    const shortUrl = `${baseUrl}/m/${shortCode}`;

    // TODO: Save to database
    // await prisma.shareableMarkingLink.create({
    //   data: {
    //     id: linkId,
    //     markingJobId: validatedData.markingJobId,
    //     token,
    //     shortCode,
    //     expiresAt,
    //     maxUses: validatedData.maxUses,
    //     recipientName: validatedData.recipientName,
    //     recipientPhone: validatedData.recipientPhone,
    //     createdBy: userId,
    //   },
    // });

    // TODO: Send notification to recipient if phone provided
    // if (validatedData.recipientPhone) {
    //   await sendSMS({
    //     to: validatedData.recipientPhone,
    //     message: `You've been invited to mark a property. Use this link: ${shortUrl}`,
    //   });
    // }

    return res.status(201).json({
      success: true,
      message: 'Shareable link generated successfully',
      data: {
        linkId,
        token,
        shortCode,
        fullUrl,
        shortUrl,
        expiresAt,
        maxUses: validatedData.maxUses,
        recipientName: validatedData.recipientName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error generating shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate shareable link',
    });
  }
};

/**
 * Verify and retrieve marking job details from shareable link
 * POST /api/marking/shareable-links/verify
 */
export const verifyShareableLink = async (req: Request, res: Response) => {
  try {
    const validatedData = verifyLinkSchema.parse(req.body);

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(
        validatedData.token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Find shareable link
    const shareableLink = Array.from(shareableLinkStore.values()).find(
      link => link.token === validatedData.token
    );

    if (!shareableLink) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Check if link is active
    if (!shareableLink.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This link has been deactivated',
      });
    }

    // Check expiration
    if (new Date() > shareableLink.expiresAt) {
      return res.status(403).json({
        success: false,
        message: 'This link has expired',
      });
    }

    // Check usage limit
    if (shareableLink.usedCount >= shareableLink.maxUses) {
      return res.status(403).json({
        success: false,
        message: 'This link has reached its maximum usage limit',
      });
    }

    // TODO: Fetch marking job details from database
    // const markingJob = await prisma.propertyMarkingJob.findUnique({
    //   where: { id: shareableLink.markingJobId },
    //   include: {
    //     property: {
    //       include: { images: true },
    //     },
    //     requestingUser: {
    //       select: { name: true, phone: true },
    //     },
    //   },
    // });

    // Mock marking job data
    const markingJobData = {
      id: shareableLink.markingJobId,
      property: {
        id: 'prop_123',
        title: 'Sample Property',
        address: '123 Sample Street',
        city: 'Lagos',
        state: 'Lagos',
        images: [],
      },
      contactPersonName: shareableLink.recipientName || 'Contact Person',
      contactPersonPhone: shareableLink.recipientPhone || '+234',
      accessInstructions: 'Please call before arriving',
    };

    return res.status(200).json({
      success: true,
      message: 'Link verified successfully',
      data: {
        linkId: shareableLink.id,
        isValid: true,
        expiresAt: shareableLink.expiresAt,
        remainingUses: shareableLink.maxUses - shareableLink.usedCount,
        markingJob: markingJobData,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error verifying shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify link',
    });
  }
};

/**
 * Submit property marking using shareable link
 * POST /api/marking/shareable-links/mark-property
 */
export const markPropertyViaLink = async (req: Request, res: Response) => {
  try {
    const validatedData = markPropertySchema.parse(req.body);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(
        validatedData.token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Find shareable link
    const shareableLink = Array.from(shareableLinkStore.values()).find(
      link => link.token === validatedData.token
    );

    if (!shareableLink || !shareableLink.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or inactive link',
      });
    }

    // Check if link has expired or reached max uses
    if (
      new Date() > shareableLink.expiresAt ||
      shareableLink.usedCount >= shareableLink.maxUses
    ) {
      return res.status(403).json({
        success: false,
        message: 'Link has expired or reached maximum uses',
      });
    }

    // TODO: Update marking job in database
    // await prisma.propertyMarkingJob.update({
    //   where: { id: shareableLink.markingJobId },
    //   data: {
    //     status: 'COMPLETED',
    //     completedAt: new Date(),
    //     completionNotes: validatedData.completionNotes,
    //     completionImages: validatedData.completionImages,
    //     boundaryData: validatedData.boundaryCoordinates,
    //   },
    // });

    // Update property boundary data
    // await prisma.property.update({
    //   where: { id: markingJob.propertyId },
    //   data: {
    //     boundaryCoordinates: validatedData.boundaryCoordinates,
    //     gpsCoordinates: JSON.stringify(validatedData.gpsCoordinates),
    //     boundaryVerified: true,
    //     boundaryMarkedAt: new Date(),
    //     boundaryImages: validatedData.completionImages,
    //   },
    // });

    // Increment usage count
    shareableLink.usedCount++;
    if (!shareableLink.usedAt) {
      shareableLink.usedAt = [];
    }
    shareableLink.usedAt.push(new Date());
    shareableLinkStore.set(shareableLink.id, shareableLink);

    // TODO: Send notification to property owner
    // await notificationService.send({
    //   userId: markingJob.requestedBy,
    //   type: 'MARKING_COMPLETED',
    //   title: 'Property Marking Completed',
    //   message: 'Your property has been successfully marked. Please verify the details.',
    // });

    return res.status(200).json({
      success: true,
      message: 'Property marked successfully',
      data: {
        markingJobId: shareableLink.markingJobId,
        completedAt: new Date(),
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error marking property via link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark property',
    });
  }
};

/**
 * Deactivate a shareable link
 * POST /api/marking/shareable-links/:linkId/deactivate
 */
export const deactivateShareableLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { linkId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const shareableLink = shareableLinkStore.get(linkId);

    if (!shareableLink) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Verify ownership
    if (shareableLink.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to deactivate this link',
      });
    }

    // Deactivate link
    shareableLink.isActive = false;
    shareableLinkStore.set(linkId, shareableLink);

    // TODO: Update in database
    // await prisma.shareableMarkingLink.update({
    //   where: { id: linkId },
    //   data: { isActive: false },
    // });

    return res.status(200).json({
      success: true,
      message: 'Link deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating shareable link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate link',
    });
  }
};

/**
 * Get shareable link usage statistics
 * GET /api/marking/shareable-links/:linkId/stats
 */
export const getShareableLinkStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { linkId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const shareableLink = shareableLinkStore.get(linkId);

    if (!shareableLink) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Verify ownership
    if (shareableLink.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this link',
      });
    }

    const stats = {
      linkId: shareableLink.id,
      createdAt: shareableLink.createdAt,
      expiresAt: shareableLink.expiresAt,
      isActive: shareableLink.isActive,
      maxUses: shareableLink.maxUses,
      usedCount: shareableLink.usedCount,
      remainingUses: shareableLink.maxUses - shareableLink.usedCount,
      usedAt: shareableLink.usedAt || [],
      recipientName: shareableLink.recipientName,
      recipientPhone: shareableLink.recipientPhone,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching shareable link stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch link statistics',
    });
  }
};