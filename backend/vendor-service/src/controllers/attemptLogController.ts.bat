// backend/payment-service/src/controllers/attemptLogController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const getAttemptsSchema = z.object({
  propertyId: z.string().cuid().optional(),
  unitId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  status: z.enum(['LOCKED', 'SUCCESS', 'FAILED', 'TIMEOUT']).optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

const createAttemptSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  amount: z.number().positive(),
  status: z.enum(['LOCKED', 'SUCCESS', 'FAILED', 'TIMEOUT']),
  failureReason: z.string().optional(),
  lockAcquired: z.boolean(),
  lockDuration: z.number().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Log a payment attempt
 */
export const logPaymentAttempt = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const data = createAttemptSchema.parse(req.body);

    const attemptLog = await prisma.paymentAttemptLog.create({
      data: {
        ...data,
        userId,
        ipAddress: data.ipAddress || req.ip || req.socket.remoteAddress,
        userAgent: data.userAgent || req.headers['user-agent'],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Payment attempt logged successfully',
      data: attemptLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    console.error('Log payment attempt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log payment attempt',
    });
  }
};

/**
 * Get payment attempts with filtering and pagination
 */
export const getPaymentAttempts = async (req: Request, res: Response) => {
  try {
    const { propertyId, unitId, userId, status, page, limit, startDate, endDate } =
      getAttemptsSchema.parse(req.query);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [attempts, total] = await Promise.all([
      prisma.paymentAttemptLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          propertyId: true,
          unitId: true,
          amount: true,
          status: true,
          failureReason: true,
          lockAcquired: true,
          lockDuration: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.paymentAttemptLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        attempts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + attempts.length < total,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }

    console.error('Get payment attempts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment attempts',
    });
  }
};

/**
 * Get payment attempt by ID
 */
export const getPaymentAttemptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attempt = await prisma.paymentAttemptLog.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        propertyId: true,
        unitId: true,
        amount: true,
        status: true,
        failureReason: true,
        lockAcquired: true,
        lockDuration: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Payment attempt not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    console.error('Get payment attempt by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment attempt',
    });
  }
};

/**
 * Get payment attempt statistics
 */
export const getPaymentAttemptStats = async (req: Request, res: Response) => {
  try {
    const { propertyId, unitId, userId, startDate, endDate } = getAttemptsSchema.parse(req.query);

    // Build where clause
    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalAttempts, statusCounts, avgLockDuration, lockAcquisitionRate] = await Promise.all([
      prisma.paymentAttemptLog.count({ where }),
      prisma.paymentAttemptLog.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.paymentAttemptLog.aggregate({
        where: { ...where, lockAcquired: true },
        _avg: { lockDuration: true },
      }),
      prisma.paymentAttemptLog.aggregate({
        where,
        _count: {
          _all: true,
        },
      }),
    ]);

    // Calculate lock acquisition rate
    const locksAcquired = await prisma.paymentAttemptLog.count({
      where: { ...where, lockAcquired: true },
    });
    const acquisitionRate = totalAttempts > 0 ? (locksAcquired / totalAttempts) * 100 : 0;

    // Format status counts
    const statusBreakdown = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get failed attempt reasons
    const failureReasons = await prisma.paymentAttemptLog.groupBy({
      by: ['failureReason'],
      where: { ...where, status: 'FAILED', failureReason: { not: null } },
      _count: true,
      orderBy: { _count: { failureReason: 'desc' } },
      take: 5,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        statusBreakdown,
        avgLockDurationMs: avgLockDuration._avg.lockDuration || 0,
        lockAcquisitionRate: acquisitionRate,
        topFailureReasons: failureReasons.map((r) => ({
          reason: r.failureReason,
          count: r._count,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }

    console.error('Get payment attempt stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment attempt statistics',
    });
  }
};

/**
 * Get user's payment attempt history
 */
export const getUserPaymentAttempts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { page, limit, status, startDate, endDate } = getAttemptsSchema.parse(req.query);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [attempts, total] = await Promise.all([
      prisma.paymentAttemptLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          propertyId: true,
          unitId: true,
          amount: true,
          status: true,
          failureReason: true,
          lockAcquired: true,
          createdAt: true,
        },
      }),
      prisma.paymentAttemptLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        attempts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + attempts.length < total,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }

    console.error('Get user payment attempts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get payment attempts',
    });
  }
};

/**
 * Delete old payment attempt logs (Admin only - for cleanup)
 */
export const cleanupOldAttempts = async (req: Request, res: Response) => {
  try {
    const { daysOld = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(daysOld));

    const deleted = await prisma.paymentAttemptLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${deleted.count} old payment attempt logs`,
      data: {
        deletedCount: deleted.count,
        cutoffDate,
      },
    });
  } catch (error) {
    console.error('Cleanup old attempts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cleanup old attempt logs',
    });
  }
};

/**
 * Get suspicious payment patterns (Admin - fraud detection)
 */
export const getSuspiciousPatterns = async (req: Request, res: Response) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find users with multiple failed attempts in last hour
    const suspiciousUsers = await prisma.paymentAttemptLog.groupBy({
      by: ['userId'],
      where: {
        status: 'FAILED',
        createdAt: { gte: oneHourAgo },
      },
      _count: true,
      having: {
        userId: {
          _count: { gt: 5 }, // More than 5 failed attempts
        },
      },
    });

    // Find properties with multiple lock conflicts
    const suspiciousProperties = await prisma.paymentAttemptLog.groupBy({
      by: ['propertyId'],
      where: {
        status: 'LOCKED',
        lockAcquired: false,
        createdAt: { gte: oneHourAgo },
      },
      _count: true,
      having: {
        propertyId: {
          _count: { gt: 10 }, // More than 10 lock conflicts
        },
      },
    });

    // Find IPs with multiple attempts
    const suspiciousIPs = await prisma.paymentAttemptLog.groupBy({
      by: ['ipAddress'],
      where: {
        createdAt: { gte: oneHourAgo },
        ipAddress: { not: null },
      },
      _count: true,
      having: {
        ipAddress: {
          _count: { gt: 20 }, // More than 20 attempts from same IP
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        suspiciousUsers: suspiciousUsers.map((u) => ({
          userId: u.userId,
          failedAttempts: u._count,
        })),
        suspiciousProperties: suspiciousProperties.map((p) => ({
          propertyId: p.propertyId,
          lockConflicts: p._count,
        })),
        suspiciousIPs: suspiciousIPs.map((ip) => ({
          ipAddress: ip.ipAddress,
          totalAttempts: ip._count,
        })),
      },
    });
  } catch (error) {
    console.error('Get suspicious patterns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get suspicious patterns',
    });
  }
};