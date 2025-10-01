import { PrismaClient, PropertyStatus, PropertyStructure } from '@newcondo/db';

const prisma = new PrismaClient();

interface DelistResult {
  success: boolean;
  propertyId: string;
  unitId?: string;
  previousStatus: string;
  message: string;
}

export class AutoDelistService {
  /**
   * Auto-delist property or unit after successful payment
   */
  async delistAfterPayment(
    propertyId: string,
    unitId?: string
  ): Promise<DelistResult> {
    try {
      // Check property structure
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          structure: true,
          status: true,
          availableUnits: true,
        },
      });

      if (!property) {
        return {
          success: false,
          propertyId,
          unitId,
          previousStatus: 'UNKNOWN',
          message: 'Property not found',
        };
      }

      // Handle multi-family properties
      if (property.structure === PropertyStructure.MULTI_FAMILY && unitId) {
        return await this.delistUnit(propertyId, unitId, property);
      }

      // Handle single unit properties
      return await this.delistSingleProperty(propertyId, property.status);
    } catch (error) {
      console.error('Auto-delist error:', error);
      return {
        success: false,
        propertyId,
        unitId,
        previousStatus: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delist a single unit property
   */
  private async delistSingleProperty(
    propertyId: string,
    currentStatus: PropertyStatus
  ): Promise<DelistResult> {
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.RENTED,
        isAvailable: false,
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    return {
      success: true,
      propertyId,
      previousStatus: currentStatus,
      message: 'Property successfully delisted',
    };
  }

  /**
   * Delist a specific unit in a multi-family property
   */
  private async delistUnit(
    propertyId: string,
    unitId: string,
    property: {
      status: PropertyStatus;
      availableUnits: number | null;
    }
  ): Promise<DelistResult> {
    const unit = await prisma.propertyUnit.findUnique({
      where: { id: unitId },
      select: { status: true },
    });

    if (!unit) {
      return {
        success: false,
        propertyId,
        unitId,
        previousStatus: 'UNKNOWN',
        message: 'Unit not found',
      };
    }

    // Update unit and property in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the unit
      await tx.propertyUnit.update({
        where: { id: unitId },
        data: {
          status: 'OCCUPIED',
          isAvailable: false,
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });

      // Decrease available units count
      const currentAvailable = property.availableUnits || 0;
      const newAvailableCount = Math.max(0, currentAvailable - 1);

      await tx.property.update({
        where: { id: propertyId },
        data: {
          availableUnits: newAvailableCount,
          // If no units available, mark entire property as unavailable
          ...(newAvailableCount === 0 && {
            isAvailable: false,
            status: PropertyStatus.RENTED,
          }),
        },
      });
    });

    return {
      success: true,
      propertyId,
      unitId,
      previousStatus: unit.status,
      message: 'Unit successfully delisted',
    };
  }

  /**
   * Restore property/unit availability (for payment failures or cancellations)
   */
  async restoreAvailability(
    propertyId: string,
    unitId?: string
  ): Promise<DelistResult> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          structure: true,
          status: true,
          availableUnits: true,
          totalUnits: true,
        },
      });

      if (!property) {
        return {
          success: false,
          propertyId,
          unitId,
          previousStatus: 'UNKNOWN',
          message: 'Property not found',
        };
      }

      // Handle multi-family properties
      if (property.structure === PropertyStructure.MULTI_FAMILY && unitId) {
        return await this.restoreUnit(propertyId, unitId, property);
      }

      // Handle single unit properties
      return await this.restoreSingleProperty(propertyId, property.status);
    } catch (error) {
      console.error('Restore availability error:', error);
      return {
        success: false,
        propertyId,
        unitId,
        previousStatus: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore availability for a single unit property
   */
  private async restoreSingleProperty(
    propertyId: string,
    currentStatus: PropertyStatus
  ): Promise<DelistResult> {
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.PUBLISHED,
        isAvailable: true,
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    return {
      success: true,
      propertyId,
      previousStatus: currentStatus,
      message: 'Property availability restored',
    };
  }

  /**
   * Restore availability for a specific unit
   */
  private async restoreUnit(
    propertyId: string,
    unitId: string,
    property: {
      status: PropertyStatus;
      availableUnits: number | null;
      totalUnits: number | null;
    }
  ): Promise<DelistResult> {
    const unit = await prisma.propertyUnit.findUnique({
      where: { id: unitId },
      select: { status: true },
    });

    if (!unit) {
      return {
        success: false,
        propertyId,
        unitId,
        previousStatus: 'UNKNOWN',
        message: 'Unit not found',
      };
    }

    await prisma.$transaction(async (tx) => {
      // Restore unit availability
      await tx.propertyUnit.update({
        where: { id: unitId },
        data: {
          status: 'AVAILABLE',
          isAvailable: true,
          isPaymentLocked: false,
          paymentLockExpiry: null,
        },
      });

      // Increase available units count
      const currentAvailable = property.availableUnits || 0;
      const totalUnits = property.totalUnits || 0;
      const newAvailableCount = Math.min(totalUnits, currentAvailable + 1);

      await tx.property.update({
        where: { id: propertyId },
        data: {
          availableUnits: newAvailableCount,
          isAvailable: true,
          status: PropertyStatus.PUBLISHED,
        },
      });
    });

    return {
      success: true,
      propertyId,
      unitId,
      previousStatus: unit.status,
      message: 'Unit availability restored',
    };
  }

  /**
   * Check if property/unit should be delisted
   */
  async shouldDelist(propertyId: string, unitId?: string): Promise<boolean> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        structure: true,
        isAvailable: true,
      },
    });

    if (!property || !property.isAvailable) {
      return false;
    }

    // For multi-family, check specific unit
    if (property.structure === PropertyStructure.MULTI_FAMILY && unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: unitId },
        select: { isAvailable: true },
      });

      return unit?.isAvailable ?? false;
    }

    // For single unit, check property availability
    return property.isAvailable;
  }
}

export const autoDelistService = new AutoDelistService();