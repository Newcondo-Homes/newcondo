import { PrismaClient, Prisma } from '@newcondo/db';

const prisma = new PrismaClient();

interface LogPaymentAttemptParams {
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  status: 'LOCKED' | 'SUCCESS' | FAILED' | 'TIMEOUT';
  failureReason?: string;
  lockAcquired: boolean;
  lockDuration?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface AttemptAnalytics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageLockDuration: number;
  successRate: number;
}

export class AttemptLogService {
  /**
   * Log a payment attempt for auditing and analytics
   */
  async logAttempt(params: LogPaymentAttemptParams): Promise<void> {
    try {
      await prisma.paymentAttemptLog.create({
        data: {
          userId: params.userId,
          propertyId: params.propertyId,
          unitId: params.unitId,
          amount: new Prisma.Decimal(params.amount),
          status: params.status,
          failureReason: params.failureReason,
          lockAcquired: params.lockAcquired,
          lockDuration: params.lockDuration,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log payment attempt:', error);
      // Don't throw - logging failures shouldn't block payment flow
    }
  }

  /**
   * Get payment attempts for a specific property
   */
  async getPropertyAttempts(
    propertyId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ) {
    const { limit = 50, offset = 0, status } = options || {};

    return prisma.paymentAttemptLog.findMany({
      where: {
        propertyId,
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get payment attempts for a specific user
   */
  async getUserAttempts(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ) {
    const { limit = 50, offset = 0, status } = options || {};

    return prisma.paymentAttemptLog.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get analytics for payment attempts on a property
   */
  async getPropertyAttemptAnalytics(
    propertyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AttemptAnalytics> {
    const where: Prisma.PaymentAttemptLogWhereInput = {
      propertyId,
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [totalAttempts, successfulAttempts, failedAttempts, avgLockDuration] =
      await Promise.all([
        prisma.paymentAttemptLog.count({ where }),
        prisma.paymentAttemptLog.count({
          where: { ...where, status: 'SUCCESS' },
        }),
        prisma.paymentAttemptLog.count({
          where: { ...where, status: 'FAILED' },
        }),
        prisma.paymentAttemptLog.aggregate({
          where: {
            ...where,
            lockDuration: { not: null },
          },
          _avg: {
            lockDuration: true,
          },
        }),
      ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      averageLockDuration: avgLockDuration._avg.lockDuration || 0,
      successRate:
        totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
    };
  }

  /**
   * Check if user has recent failed attempts (potential fraud detection)
   */
  async hasRecentFailedAttempts(
    userId: string,
    thresholdMinutes: number = 30,
    maxFailures: number = 3
  ): Promise<boolean> {
    const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const failedCount = await prisma.paymentAttemptLog.count({
      where: {
        userId,
        status: 'FAILED',
        createdAt: {
          gte: thresholdDate,
        },
      },
    });

    return failedCount >= maxFailures;
  }

  /**
   * Get concurrent payment attempts for a property (potential double booking attempts)
   */
  async getConcurrentAttempts(
    propertyId: string,
    timeWindowSeconds: number = 60
  ) {
    const thresholdDate = new Date(Date.now() - timeWindowSeconds * 1000);

    return prisma.paymentAttemptLog.findMany({
      where: {
        propertyId,
        status: 'LOCKED',
        createdAt: {
          gte: thresholdDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Clean up old attempt logs (run periodically)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.paymentAttemptLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Get system-wide attempt statistics
   */
  async getSystemStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.PaymentAttemptLogWhereInput = {
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      timeoutAttempts,
      uniqueUsers,
      uniqueProperties,
    ] = await Promise.all([
      prisma.paymentAttemptLog.count({ where }),
      prisma.paymentAttemptLog.count({
        where: { ...where, status: 'SUCCESS' },
      }),
      prisma.paymentAttemptLog.count({
        where: { ...where, status: 'FAILED' },
      }),
      prisma.paymentAttemptLog.count({
        where: { ...where, status: 'TIMEOUT' },
      }),
      prisma.paymentAttemptLog.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.paymentAttemptLog.findMany({
        where,
        select: { propertyId: true },
        distinct: ['propertyId'],
      }),
    ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      timeoutAttempts,
      uniqueUsers: uniqueUsers.length,
      uniqueProperties: uniqueProperties.length,
      successRate:
        totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0,
    };
  }
}

export const attemptLogService = new AttemptLogService();