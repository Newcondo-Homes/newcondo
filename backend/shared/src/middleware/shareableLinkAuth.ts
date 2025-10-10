import { Request, Response, NextFunction } from 'express';
import { decryptShareableLink, validateShareableLink } from '../utils/linkEncryption';

export interface ShareableLinkRequest extends Request {
  markingData?: {
    propertyId: string;
    jobId: string;
    expiresAt: Date;
    markerEmail?: string;
  };
}

/**
 * Middleware to authenticate and validate shareable marking links
 * Used when someone marks a property via a shared link
 */
export const authenticateShareableLink = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing shareable link token',
      });
    }

    // Decrypt and validate the token
    const markingData = decryptShareableLink(token);

    if (!markingData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or corrupted shareable link',
      });
    }

    // Validate the link hasn't expired
    const isValid = validateShareableLink(markingData);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'This shareable link has expired',
      });
    }

    // Attach marking data to request
    req.markingData = markingData;

    next();
  } catch (error) {
    console.error('Shareable link authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Failed to authenticate shareable link',
    });
  }
};

/**
 * Middleware to verify marking job is still pending for shareable link
 */
export const verifyJobPending = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.markingData) {
      return res.status(400).json({
        success: false,
        message: 'Marking data not found',
      });
    }

    const { prisma } = await import('@newcondo/db');
    
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: req.markingData.jobId },
      select: {
        status: true,
        completedAt: true,
      },
    });

    if (!markingJob) {
      return res.status(404).json({
        success: false,
        message: 'Marking job not found',
      });
    }

    if (markingJob.completedAt) {
      return res.status(400).json({
        success: false,
        message: 'This marking job has already been completed',
      });
    }

    if (markingJob.status !== 'QUEUED' && markingJob.status !== 'ASSIGNED') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete marking. Job status: ${markingJob.status}`,
      });
    }

    next();
  } catch (error) {
    console.error('Job verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify marking job status',
    });
  }
};

/**
 * Rate limiting for shareable link usage to prevent abuse
 */
export const rateLimit ShareableLinks = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token required',
      });
    }

    // TODO: Implement Redis-based rate limiting
    // For now, we'll track in-memory (replace with Redis in production)
    const rateLimitKey = `shareable_link:${ip}:${token}`;
    
    // This is a placeholder - implement actual rate limiting with Redis
    // Example: Allow 10 requests per hour per IP per link
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Don't block on rate limit errors
  }
};