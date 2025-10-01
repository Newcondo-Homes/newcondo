import { PrismaClient, Property, PropertyUnit, Rental } from '@prisma/client';

const prisma = new PrismaClient();

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'PAYMENT_LOCKED' | 'ALREADY_RENTED' | 'UNIT_UNAVAILABLE' | 'OVERLAPPING_RENTAL';
  conflictDetails?: string;
  conflictingRentalId?: string;
  lockedUntil?: Date;
}

export interface RentalPeriod {
  startDate: Date;
  endDate: Date;
}

export class ConflictService {
  /**
   * Check for any booking conflicts for a property
   */
  async checkPropertyConflict(
    propertyId: string,
    userId: string
  ): Promise<ConflictCheckResult> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        isPaymentLocked: true,
        paymentLockExpiry: true,
        isAvailable: true,
        status: true,
        structure: true,
      },
    });

    if (!property) {
      return {
        hasConflict: true,
        conflictType: 'ALREADY_RENTED',
        conflictDetails: 'Property not found',
      };
    }

    // Check if property is payment locked
    if (property.isPaymentLocked && property.paymentLockExpiry) {
      const now = new Date();
      if (property.paymentLockExpiry > now) {
        return {
          hasConflict: true,
          conflictType: 'PAYMENT_LOCKED',
          conflictDetails: 'Property is currently locked by another payment attempt',
          lockedUntil: property.paymentLockExpiry,
        };
      }
    }

    // Check if property is available
    if (!property.isAvailable) {
      return {
        hasConflict: true,
        conflictType: 'ALREADY_RENTED',
        conflictDetails: 'Property is no longer available',
      };
    }

    // Check if property is published
    if (property.status !== 'PUBLISHED') {
      return {
        hasConflict: true,
        conflictType: 'ALREADY_RENTED',
        conflictDetails: `Property is ${property.status.toLowerCase()}`,
      };
    }

    // For single units, check active rentals
    if (property.structure === 'SINGLE_UNIT') {
      const activeRental = await prisma.rental.findFirst({
        where: {
          propertyId,
          status: { in: ['ACTIVE', 'PENDING_CONFIRMATION'] },
        },
        select: { id: true, status: true },
      });

      if (activeRental) {
        return {
          hasConflict: true,
          conflictType: 'ALREADY_RENTED',
          conflictDetails: `Property has an ${activeRental.status.toLowerCase()} rental`,
          conflictingRentalId: activeRental.id,
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Check for conflicts on a specific unit
   */
  async checkUnitConflict(
    unitId: string,
    userId: string
  ): Promise<ConflictCheckResult> {
    const unit = await prisma.propertyUnit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        isPaymentLocked: true,
        paymentLockExpiry: true,
        isAvailable: true,
        status: true,
        propertyId: true,
        property: {
          select: {
            status: true,
            adminApprovalStatus: true,
          },
        },
      },
    });

    if (!unit) {
      return {
        hasConflict: true,
        conflictType: 'UNIT_UNAVAILABLE',
        conflictDetails: 'Unit not found',
      };
    }

    // Check parent property status
    if (unit.property.status !== 'PUBLISHED') {
      return {
        hasConflict: true,
        conflictType: 'UNIT_UNAVAILABLE',
        conflictDetails: `Property is ${unit.property.status.toLowerCase()}`,
      };
    }

    if (unit.property.adminApprovalStatus !== 'APPROVED') {
      return {
        hasConflict: true,
        conflictType: 'UNIT_UNAVAILABLE',
        conflictDetails: 'Property is not approved',
      };
    }

    // Check if unit is payment locked
    if (unit.isPaymentLocked && unit.paymentLockExpiry) {
      const now = new Date();
      if (unit.paymentLockExpiry > now) {
        return {
          hasConflict: true,
          conflictType: 'PAYMENT_LOCKED',
          conflictDetails: 'Unit is currently locked by another payment attempt',
          lockedUntil: unit.paymentLockExpiry,
        };
      }
    }

    // Check unit availability
    if (!unit.isAvailable || unit.status !== 'AVAILABLE') {
      return {
        hasConflict: true,
        conflictType: 'UNIT_UNAVAILABLE',
        conflictDetails: `Unit is ${unit.status.toLowerCase()}`,
      };
    }

    // Check for active rentals on this unit
    const activeRental = await prisma.rental.findFirst({
      where: {
        unitId,
        status: { in: ['ACTIVE', 'PENDING_CONFIRMATION'] },
      },
      select: { id: true, status: true },
    });

    if (activeRental) {
      return {
        hasConflict: true,
        conflictType: 'ALREADY_RENTED',
        conflictDetails: `Unit has an ${activeRental.status.toLowerCase()} rental`,
        conflictingRentalId: activeRental.id,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Check for overlapping rental periods
   */
  async checkRentalPeriodConflict(
    propertyId: string,
    unitId: string | null,
    rentalPeriod: RentalPeriod
  ): Promise<ConflictCheckResult> {
    const { startDate, endDate } = rentalPeriod;

    const overlappingRentals = await prisma.rental.findMany({
      where: {
        propertyId,
        ...(unitId && { unitId }),
        status: { in: ['ACTIVE', 'PENDING_CONFIRMATION'] },
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
          // New rental encompasses existing rental
          {
            startDate: { gte: startDate },
            endDate: { lte: endDate },
          },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (overlappingRentals.length > 0) {
      const conflictingRental = overlappingRentals[0];
      return {
        hasConflict: true,
        conflictType: 'OVERLAPPING_RENTAL',
        conflictDetails: `Rental period conflicts with existing rental from ${conflictingRental.startDate.toISOString()} to ${conflictingRental.endDate?.toISOString() || 'ongoing'}`,
        conflictingRentalId: conflictingRental.id,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Comprehensive conflict check before payment
   */
  async performPrePaymentCheck(
    propertyId: string,
    unitId: string | null,
    userId: string,
    rentalPeriod?: RentalPeriod
  ): Promise<ConflictCheckResult> {
    // Check unit-specific conflicts if unitId provided
    if (unitId) {
      const unitConflict = await this.checkUnitConflict(unitId, userId);
      if (unitConflict.hasConflict) {
        return unitConflict;
      }
    } else {
      // Check property-level conflicts for single units
      const propertyConflict = await this.checkPropertyConflict(propertyId, userId);
      if (propertyConflict.hasConflict) {
        return propertyConflict;
      }
    }

    // Check rental period conflicts if provided
    if (rentalPeriod) {
      const periodConflict = await this.checkRentalPeriodConflict(
        propertyId,
        unitId,
        rentalPeriod
      );
      if (periodConflict.hasConflict) {
        return periodConflict;
      }
    }

    return { hasConflict: false };
  }

  /**
   * Log payment attempt for tracking
   */
  async logPaymentAttempt(
    userId: string,
    propertyId: string,
    unitId: string | null,
    amount: number,
    status: string,
    lockAcquired: boolean,
    failureReason?: string,
    lockDuration?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.paymentAttemptLog.create({
      data: {
        userId,
        propertyId,
        unitId,
        amount,
        status,
        lockAcquired,
        failureReason,
        lockDuration,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get conflict statistics for monitoring
   */
  async getConflictStats(propertyId: string) {
    const logs = await prisma.paymentAttemptLog.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalAttempts = logs.length;
    const failedAttempts = logs.filter((log) => log.status === 'FAILED').length;
    const lockedAttempts = logs.filter((log) => log.status === 'LOCKED').length;
    const successfulAttempts = logs.filter((log) => log.status === 'SUCCESS').length;

    return {
      totalAttempts,
      failedAttempts,
      lockedAttempts,
      successfulAttempts,
      conflictRate: totalAttempts > 0 ? (lockedAttempts / totalAttempts) * 100 : 0,
    };
  }
}

export const conflictService = new ConflictService();