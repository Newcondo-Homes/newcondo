// backend/property-service/src/services/conflictDetectionService.ts

import { PrismaClient, PropertyStatus, RentalStatus } from '@newcondo/db';
import {
  ConflictDetectionResult,
  ConflictType,
  ConflictSeverity,
  ConflictDetails,
} from '../types/locking';

const prisma = new PrismaClient();

export class ConflictDetectionService {
  /**
   * Check for booking conflicts before allowing a payment or rental
   */
  async checkBookingConflict(
    propertyId: string,
    unitId: string | null,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConflictDetectionResult> {
    try {
      // Run all conflict checks in parallel
      const [
        lockConflict,
        rentalConflict,
        propertyStatusConflict,
        unitStatusConflict,
      ] = await Promise.all([
        this.checkExistingLock(propertyId, unitId, userId),
        this.checkOverlappingRental(propertyId, unitId, startDate, endDate),
        this.checkPropertyAvailability(propertyId),
        unitId ? this.checkUnitAvailability(unitId) : Promise.resolve(null),
      ]);

      // Priority order: Lock > Rental > Unit Status > Property Status
      if (lockConflict.hasConflict) return lockConflict;
      if (rentalConflict.hasConflict) return rentalConflict;
      if (unitStatusConflict?.hasConflict) return unitStatusConflict;
      if (propertyStatusConflict.hasConflict) return propertyStatusConflict;

      return { hasConflict: false };
    } catch (error) {
      console.error('Error in checkBookingConflict:', error);
      throw new Error('Failed to check booking conflicts');
    }
  }

  /**
   * Check if property/unit currently has an active payment lock
   */
  private async checkExistingLock(
    propertyId: string,
    unitId: string | null,
    userId: string
  ): Promise<ConflictDetectionResult> {
    const now = new Date();

    // Check property-level lock
    const propertyLock = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        isPaymentLocked: true,
        paymentLockExpiry: true,
      },
    });

    if (
      propertyLock?.isPaymentLocked &&
      propertyLock.paymentLockExpiry &&
      propertyLock.paymentLockExpiry > now
    ) {
      return {
        hasConflict: true,
        conflictType: ConflictType.EXISTING_LOCK,
        conflictDetails: {
          conflictingEntityId: propertyId,
          conflictStart: now,
          conflictEnd: propertyLock.paymentLockExpiry,
          description: 'Property is currently locked for another payment',
          severity: ConflictSeverity.HIGH,
        },
        recommendations: [
          'Wait for the current payment lock to expire',
          `Lock expires at ${propertyLock.paymentLockExpiry.toISOString()}`,
        ],
      };
    }

    // Check unit-level lock if unit is specified
    if (unitId) {
      const unitLock = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
        select: {
          isPaymentLocked: true,
          paymentLockExpiry: true,
        },
      });

      if (
        unitLock?.isPaymentLocked &&
        unitLock.paymentLockExpiry &&
        unitLock.paymentLockExpiry > now
      ) {
        return {
          hasConflict: true,
          conflictType: ConflictType.EXISTING_LOCK,
          conflictDetails: {
            conflictingEntityId: unitId,
            conflictStart: now,
            conflictEnd: unitLock.paymentLockExpiry,
            description: 'Unit is currently locked for another payment',
            severity: ConflictSeverity.HIGH,
          },
          recommendations: [
            'Wait for the current payment lock to expire',
            `Lock expires at ${unitLock.paymentLockExpiry.toISOString()}`,
          ],
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Check for overlapping active rentals
   */
  private async checkOverlappingRental(
    propertyId: string,
    unitId: string | null,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConflictDetectionResult> {
    const activeRentals = await prisma.rental.findMany({
      where: {
        propertyId,
        ...(unitId && { unitId }),
        status: {
          in: [RentalStatus.ACTIVE, RentalStatus.PENDING_CONFIRMATION],
        },
        ...(startDate &&
          endDate && {
            OR: [
              // New rental starts during existing rental
              {
                startDate: { lte: startDate },
                endDate: { gte: startDate },
              },
              // New rental ends during existing rental
              {
                startDate: { lte: endDate },
                endDate: { gte: endDate },
              },
              // New rental completely encompasses existing rental
              {
                startDate: { gte: startDate },
                endDate: { lte: endDate },
              },
            ],
          }),
      },
      select: {
        id: true,
        renterId: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (activeRentals.length > 0) {
      const rental = activeRentals[0];
      return {
        hasConflict: true,
        conflictType: ConflictType.OVERLAPPING_RENTAL,
        conflictDetails: {
          conflictingEntityId: rental.id,
          conflictingUserId: rental.renterId,
          conflictStart: rental.startDate,
          conflictEnd: rental.endDate || undefined,
          description: `Property/Unit has an active rental (Status: ${rental.status})`,
          severity: ConflictSeverity.CRITICAL,
        },
        recommendations: [
          'This property/unit is already rented',
          'Please choose a different property or unit',
        ],
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check property availability status
   */
  private async checkPropertyAvailability(
    propertyId: string
  ): Promise<ConflictDetectionResult> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        isAvailable: true,
        status: true,
        structure: true,
        availableUnits: true,
      },
    });

    if (!property) {
      return {
        hasConflict: true,
        conflictType: ConflictType.DOUBLE_BOOKING,
        conflictDetails: {
          conflictingEntityId: propertyId,
          description: 'Property not found',
          severity: ConflictSeverity.CRITICAL,
        },
        recommendations: ['Property may have been removed'],
      };
    }

    // For multi-family properties, check available units
    if (property.structure === 'MULTI_FAMILY') {
      if (!property.availableUnits || property.availableUnits <= 0) {
        return {
          hasConflict: true,
          conflictType: ConflictType.DOUBLE_BOOKING,
          conflictDetails: {
            conflictingEntityId: propertyId,
            description: 'No available units in this property',
            severity: ConflictSeverity.HIGH,
          },
          recommendations: ['All units are currently occupied or unavailable'],
        };
      }
    }

    if (!property.isAvailable || property.status !== PropertyStatus.PUBLISHED) {
      return {
        hasConflict: true,
        conflictType: ConflictType.DOUBLE_BOOKING,
        conflictDetails: {
          conflictingEntityId: propertyId,
          description: `Property is not available (Status: ${property.status})`,
          severity: ConflictSeverity.HIGH,
        },
        recommendations: ['Property is no longer available for rent'],
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check unit availability status
   */
  private async checkUnitAvailability(
    unitId: string
  ): Promise<ConflictDetectionResult> {
    const unit = await prisma.propertyUnit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        isAvailable: true,
        status: true,
        propertyId: true,
      },
    });

    if (!unit) {
      return {
        hasConflict: true,
        conflictType: ConflictType.DOUBLE_BOOKING,
        conflictDetails: {
          conflictingEntityId: unitId,
          description: 'Unit not found',
          severity: ConflictSeverity.CRITICAL,
        },
        recommendations: ['Unit may have been removed'],
      };
    }

    if (!unit.isAvailable || unit.status !== 'AVAILABLE') {
      return {
        hasConflict: true,
        conflictType: ConflictType.DOUBLE_BOOKING,
        conflictDetails: {
          conflictingEntityId: unitId,
          description: `Unit is not available (Status: ${unit.status})`,
          severity: ConflictSeverity.HIGH,
        },
        recommendations: ['This unit is no longer available for rent'],
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check for multiple simultaneous payment attempts
   */
  async checkConcurrentPaymentAttempts(
    propertyId: string,
    unitId: string | null,
    userId: string
  ): Promise<ConflictDetectionResult> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentAttempts = await prisma.paymentAttemptLog.findMany({
      where: {
        propertyId,
        ...(unitId && { unitId }),
        userId: { not: userId },
        status: 'LOCKED',
        createdAt: { gte: fiveMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (recentAttempts.length >= 3) {
      return {
        hasConflict: true,
        conflictType: ConflictType.DOUBLE_BOOKING,
        conflictDetails: {
          conflictingEntityId: propertyId,
          description: 'Multiple concurrent payment attempts detected',
          severity: ConflictSeverity.MEDIUM,
        },
        recommendations: [
          'High demand for this property',
          'Please try again in a few minutes',
        ],
      };
    }

    return { hasConflict: false };
  }

  /**
   * Log payment attempt for conflict analysis
   */
  async logPaymentAttempt(
    userId: string,
    propertyId: string,
    unitId: string | null,
    amount: number,
    status: string,
    lockAcquired: boolean,
    metadata?: {
      failureReason?: string;
      lockDuration?: number;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await prisma.paymentAttemptLog.create({
        data: {
          userId,
          propertyId,
          unitId,
          amount,
          status,
          lockAcquired,
          failureReason: metadata?.failureReason,
          lockDuration: metadata?.lockDuration,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    } catch (error) {
      console.error('Error logging payment attempt:', error);
      // Don't throw - logging shouldn't break the payment flow
    }
  }

  /**
   * Get conflict statistics for a property
   */
  async getPropertyConflictStats(propertyId: string): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    conflictRate: number;
    lastConflict?: Date;
  }> {
    const stats = await prisma.paymentAttemptLog.groupBy({
      by: ['status'],
      where: { propertyId },
      _count: { id: true },
    });

    const totalAttempts = stats.reduce((sum, s) => sum + s._count.id, 0);
    const successfulAttempts =
      stats.find((s) => s.status === 'SUCCESS')?._count.id || 0;
    const failedAttempts = totalAttempts - successfulAttempts;

    const lastConflictLog = await prisma.paymentAttemptLog.findFirst({
      where: {
        propertyId,
        status: 'FAILED',
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      conflictRate: totalAttempts > 0 ? failedAttempts / totalAttempts : 0,
      lastConflict: lastConflictLog?.createdAt,
    };
  }

  /**
   * Cleanup old payment attempt logs (keep last 30 days)
   */
  async cleanupOldLogs(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.paymentAttemptLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    return result.count;
  }
}

export const conflictDetectionService = new ConflictDetectionService();