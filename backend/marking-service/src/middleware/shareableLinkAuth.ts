// backend/marking-service/src/middleware/shareableLinkAuth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

const SHAREABLE_LINK_SECRET = process.env.SHAREABLE_LINK_SECRET || 'your-shareable-link-secret';
const LINK_EXPIRATION_DAYS = 7; // Links expire after 7 days

interface ShareableLinkPayload {
  propertyId: string;
  markingJobId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  type: 'marking'; // For future extensibility
  exp?: number;
}

interface ShareableLinkRequest extends Request {
  markingJob?: {
    id: string;
    propertyId: string;
    requestedBy: string;
    contactPersonName: string;
    contactPersonPhone: string;
    status: string;
  };
  linkPayload?: ShareableLinkPayload;
}

/**
 * Validates shareable link token for property marking
 */
export const validateShareableLink = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string || req.headers['x-marking-token'] as string;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Shareable link token is required'
      });
      return;
    }

    // Verify JWT token
    let decoded: ShareableLinkPayload;
    try {
      decoded = jwt.verify(token, SHAREABLE_LINK_SECRET) as ShareableLinkPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Shareable link has expired',
          code: 'LINK_EXPIRED'
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        error: 'Invalid shareable link token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Validate token type
    if (decoded.type !== 'marking') {
      res.status(400).json({
        success: false,
        error: 'Invalid link type'
      });
      return;
    }

    // Fetch marking job to validate
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: decoded.markingJobId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            gpsCoordinates: true
          }
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!markingJob) {
      res.status(404).json({
        success: false,
        error: 'Marking job not found',
        code: 'JOB_NOT_FOUND'
      });
      return;
    }

    // Validate job belongs to the token
    if (markingJob.propertyId !== decoded.propertyId) {
      res.status(403).json({
        success: false,
        error: 'Token does not match marking job',
        code: 'TOKEN_MISMATCH'
      });
      return;
    }

    // Check if job is still in valid state for marking
    if (markingJob.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Marking job already completed',
        code: 'JOB_COMPLETED'
      });
      return;
    }

    if (markingJob.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: 'Marking job has been cancelled',
        code: 'JOB_CANCELLED'
      });
      return;
    }

    if (markingJob.status === 'EXPIRED') {
      res.status(400).json({
        success: false,
        error: 'Marking job has expired',
        code: 'JOB_EXPIRED'
      });
      return;
    }

    // Check if job has an assigned agent already
    if (markingJob.assignedAgentId && markingJob.status === 'ASSIGNED') {
      res.status(400).json({
        success: false,
        error: 'Marking job already assigned to an agent',
        code: 'JOB_ASSIGNED',
        data: {
          assignedAt: markingJob.assignedAt
        }
      });
      return;
    }

    // Attach marking job data to request
    req.markingJob = {
      id: markingJob.id,
      propertyId: markingJob.propertyId,
      requestedBy: markingJob.requestedBy,
      contactPersonName: markingJob.contactPersonName,
      contactPersonPhone: markingJob.contactPersonPhone,
      status: markingJob.status
    };

    req.linkPayload = decoded;

    next();
  } catch (error) {
    console.error('Shareable link validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate shareable link'
    });
  }
};

/**
 * Generates a shareable link token for property marking
 */
export const generateShareableLink = (
  markingJobId: string,
  propertyId: string,
  requestedBy: string,
  contactPersonName: string,
  contactPersonPhone: string
): string => {
  const payload: ShareableLinkPayload = {
    propertyId,
    markingJobId,
    requestedBy,
    contactPersonName,
    contactPersonPhone,
    type: 'marking'
  };

  const token = jwt.sign(payload, SHAREABLE_LINK_SECRET, {
    expiresIn: `${LINK_EXPIRATION_DAYS}d`
  });

  return token;
};

/**
 * Validates that shareable link marking hasn't already been completed
 */
export const preventDuplicateMarking = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const markingJob = req.markingJob;

    if (!markingJob) {
      res.status(400).json({
        success: false,
        error: 'Marking job data not found in request'
      });
      return;
    }

    // Check if property already has boundary marked
    const property = await prisma.property.findUnique({
      where: { id: markingJob.propertyId },
      select: {
        boundaryVerified: true,
        boundaryMarkedBy: true,
        boundaryMarkedAt: true
      }
    });

    if (property?.boundaryVerified) {
      res.status(400).json({
        success: false,
        error: 'Property boundary already verified',
        code: 'BOUNDARY_VERIFIED',
        data: {
          markedBy: property.boundaryMarkedBy,
          markedAt: property.boundaryMarkedAt
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Duplicate marking prevention error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check marking status'
    });
  }
};

/**
 * Optional: Rate limiting for shareable link usage
 */
export const shareableLinkRateLimit = async (
  req: ShareableLinkRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string || req.headers['x-marking-token'] as string;
    
    if (!token) {
      next();
      return;
    }

    // Get client IP for rate limiting
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Simple in-memory rate limiting (in production, use Redis)
    const rateLimitKey = `shareable_link:${token}:${clientIp}`;
    
    // This is a placeholder - implement actual rate limiting with Redis
    // For now, just pass through
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    next(); // Don't block on rate limit errors
  }
};

/**
 * Extracts marking job ID from shareable link token
 */
export const extractMarkingJobFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, SHAREABLE_LINK_SECRET) as ShareableLinkPayload;
    return decoded.markingJobId;
  } catch (error) {
    return null;
  }
};

/**
 * Validates shareable link expiration
 */
export const isShareableLinkExpired = (token: string): boolean => {
  try {
    jwt.verify(token, SHAREABLE_LINK_SECRET);
    return false;
  } catch (error: any) {
    return error.name === 'TokenExpiredError';
  }
};