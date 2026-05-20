import { Request, Response, NextFunction } from 'express';
import { decryptShareableLink, validateShareableLink } from '../utils/linkEncryption';
import { RedisHelper } from '../config/redis';

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

    if (!markingData || !markingData.isValid) {
      return res.status(401).json({
        success: false,
        message: markingData?.isExpired
          ? 'This shareable link has expired'
          : 'Invalid or corrupted shareable link',
      });
    }

    req.markingData = {
      propertyId: markingData.propertyId,
      jobId: markingData.markingJobId, // mapped markingJobId to jobId
      expiresAt: markingData.expiresAt,
      markerEmail: markingData.requestedBy, // fallback mapping if applicable
    };

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
export const rateLimitShareableLinks = async (
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
    const limit = 10; // Max 10 requests
    const windowInSeconds = 3600; // Per 1 hour window

    // Increment current hit rate count
    const currentHits = await RedisHelper.increment(rateLimitKey, 1);


    if (currentHits !== null) {
      // Set key expiry on the first record hit
      if (currentHits === 1) {
        const { redis } = await import('../config/redis');
        await redis.expire(rateLimitKey, windowInSeconds);
      }

      if (currentHits > limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests on this link. Please try again in an hour.',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Don't block on rate limit errors
  }
};