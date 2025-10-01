import { PrismaClient, PropertyStatus, UnitStatus, PropertyStructure } from '@newcondo/db';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface AvailabilityCheck {
  isAvailable: boolean;
  reason?: string;
  availableFrom?: Date;
  isLocked?: boolean;
  lockExpiresAt?: Date;
}

interface AvailabilityUpdate {
  success: boolean;
  message: string;
}

export class AvailabilityService {
  private static AVAILABILITY_CACHE_PREFIX = 'availability:';
  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Check if a property or unit is available
   */
  static async checkAvailability(
    propertyId: string,
    unitId?: string
  ): Promise<AvailabilityCheck> {
    try {
      // Check cache first
      const cacheKey = `${this.AVAILABILITY_CACHE_PREFIX}${unitId || propertyId}`;
      const cachedAvailability = await redis.get(cacheKey);
      
      if (cachedAvailability) {
        return JSON.parse(cachedAvailability);
      }

      let availabilityCheck: AvailabilityCheck;

      if (unitId) {
        // Check unit availability
        const unit = await prisma.propertyUnit.findUnique({
          where: { id: unitId },
          include: {
            property: {
              select: {
                status: true,
                adminApprovalStatus: true
              }
            }
          }
        });

        if (!unit) {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Unit not found'
          };
        } else if (unit.property.status !== 'PUBLISHED' || unit.property.adminApprovalStatus !== 'APPROVED') {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Property is not published or approved'
          };
        } else if (unit.status !== 'AVAILABLE') {
          availabilityCheck = {
            isAvailable: false,
            reason: `Unit is ${unit.status.toLowerCase()}`
          };
        } else if (!unit.isAvailable) {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Unit is marked as unavailable',
            availableFrom: unit.availableFrom || undefined
          };
        } else if (unit.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Unit is temporarily locked for payment',
            isLocked: true,
            lockExpiresAt: unit.paymentLockExpiry
          };
        } else {
          availabilityCheck = {
            isAvailable: true
          };
        }
      } else {
        // Check property availability
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: {
            units: {
              where: {
                status: 'AVAILABLE',
                isAvailable: true
              }
            }
          }
        });

        if (!property) {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Property not found'
          };
        } else if (property.status !== 'PUBLISHED') {
          availabilityCheck = {
            isAvailable: false,
            reason: `Property is ${property.status.toLowerCase()}`
          };
        } else if (property.adminApprovalStatus !== 'APPROVED') {
          availabilityCheck = {
            isAvailable: false,
            reason: 'Property is not approved by admin'
          };
        } else if (property.structure === 'MULTI_FAMILY') {
          // For multi-family, check if any units are available
          if (property.units.length === 0) {
            availabilityCheck = {
              isAvailable: false,
              reason: 'No units available in this property'
            };
          } else {
            availabilityCheck = {
              isAvailable: true
            };
          }
        } else {
          // For single unit properties
          if (!property.isAvailable) {
            availabilityCheck = {
              isAvailable: false,
              reason: 'Property is marked as unavailable',
              availableFrom: property.availableFrom || undefined
            };
          } else if (property.isPaymentLocked && property.paymentLockExpiry && property.paymentLockExpiry > new Date()) {
            availabilityCheck = {
              isAvailable: false,
              reason: 'Property is temporarily locked for payment',
              isLocked: true,
              lockExpiresAt: property.paymentLockExpiry
            };
          } else {
            availabilityCheck = {
              isAvailable: true
            };
          }
        }
      }

      // Cache the result
      await redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(availabilityCheck)
      );

      return availabilityCheck;
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        isAvailable: false,
        reason: 'Error checking availability'
      };
    }
  }

  /**
   * Get available units for a multi-family property
   */
  static async getAvailableUnits(propertyId: string) {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          units: {
            where: {
              status: 'AVAILABLE',
              isAvailable: true,
              OR: [
                { isPaymentLocked: false },
                {
                  AND: [
                    { isPaymentLocked: true },
                    { paymentLockExpiry: { lte: new Date() } }
                  ]
                }
              ]
            },
            orderBy: [
              { floor: 'asc' },
              { unitNumber: 'asc' }
            ]
          }
        }
      });

      if (!property) {
        return { success: false, units: [], message: 'Property not found' };
      }

      if (property.structure !== 'MULTI_FAMILY') {
        return { success: false, units: [], message: 'Property is not a multi-family building' };
      }

      return {
        success: true,
        units: property.units,
        message: `Found ${property.units.length} available units`
      };
    } catch (error) {
      console.error('Error getting available units:', error);
      return { success: false, units: [], message: 'Error fetching available units' };
    }
  }

  /**
   * Mark property/unit as unavailable after successful payment
   */
  static async markAsUnavailable(
    propertyId: string,
    unitId?: string
  ): Promise<AvailabilityUpdate> {
    try {
      if (unitId) {
        // Mark unit as unavailable
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            status: 'OCCUPIED',
            isAvailable: false,
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });

        // Update property's available units count
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: {
            units: {
              where: {
                status: 'AVAILABLE',
                isAvailable: true
              }
            }
          }
        });

        if (property) {
          await prisma.property.update({
            where: { id: propertyId },
            data: {
              availableUnits: property.units.length
            }
          });
        }

        // Invalidate cache
        await this.invalidateCache(propertyId, unitId);

        return {
          success: true,
          message: 'Unit marked as unavailable'
        };
      } else {
        // Mark property as unavailable
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            status: 'RENTED',
            isAvailable: false,
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });

        // Invalidate cache
        await this.invalidateCache(propertyId);

        return {
          success: true,
          message: 'Property marked as unavailable'
        };
      }
    } catch (error) {
      console.error('Error marking as unavailable:', error);
      return {
        success: false,
        message: 'Error updating availability status'
      };
    }
  }

  /**
   * Mark property/unit as available again
   */
  static async markAsAvailable(
    propertyId: string,
    unitId?: string,
    availableFrom?: Date
  ): Promise<AvailabilityUpdate> {
    try {
      if (unitId) {
        await prisma.propertyUnit.update({
          where: { id: unitId },
          data: {
            status: 'AVAILABLE',
            isAvailable: true,
            availableFrom: availableFrom || new Date(),
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });

        // Update property's available units count
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: {
            units: {
              where: {
                status: 'AVAILABLE',
                isAvailable: true
              }
            }
          }
        });

        if (property) {
          await prisma.property.update({
            where: { id: propertyId },
            data: {
              availableUnits: property.units.length
            }
          });
        }

        // Invalidate cache
        await this.invalidateCache(propertyId, unitId);

        return {
          success: true,
          message: 'Unit marked as available'
        };
      } else {
        await prisma.property.update({
          where: { id: propertyId },
          data: {
            status: 'PUBLISHED',
            isAvailable: true,
            availableFrom: availableFrom || new Date(),
            isPaymentLocked: false,
            paymentLockExpiry: null
          }
        });

        // Invalidate cache
        await this.invalidateCache(propertyId);

        return {
          success: true,
          message: 'Property marked as available'
        };
      }
    } catch (error) {
      console.error('Error marking as available:', error);
      return {
        success: false,
        message: 'Error updating availability status'
      };
    }
  }

  /**
   * Get real-time availability stats for a property
   */
  static async getAvailabilityStats(propertyId: string) {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          units: {
            select: {
              status: true,
              isAvailable: true,
              isPaymentLocked: true
            }
          }
        }
      });

      if (!property) {
        return null;
      }

      if (property.structure === 'SINGLE_UNIT') {
        return {
          propertyId,
          structure: 'SINGLE_UNIT',
          isAvailable: property.isAvailable,
          status: property.status,
          isLocked: property.isPaymentLocked,
          lockExpiresAt: property.paymentLockExpiry
        };
      } else {
        const totalUnits = property.units.length;
        const availableUnits = property.units.filter(u => u.status === 'AVAILABLE' && u.isAvailable).length;
        const occupiedUnits = property.units.filter(u => u.status === 'OCCUPIED').length;
        const lockedUnits = property.units.filter(u => u.isPaymentLocked).length;

        return {
          propertyId,
          structure: 'MULTI_FAMILY',
          totalUnits,
          availableUnits,
          occupiedUnits,
          lockedUnits,
          occupancyRate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(2) : 0
        };
      }
    } catch (error) {
      console.error('Error getting availability stats:', error);
      return null;
    }
  }

  /**
   * Invalidate availability cache
   */
  private static async invalidateCache(propertyId: string, unitId?: string): Promise<void> {
    try {
      const cacheKeys = [`${this.AVAILABILITY_CACHE_PREFIX}${propertyId}`];
      
      if (unitId) {
        cacheKeys.push(`${this.AVAILABILITY_CACHE_PREFIX}${unitId}`);
      }

      await Promise.all(cacheKeys.map(key => redis.del(key)));
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Bulk check availability for multiple properties
   */
  static async bulkCheckAvailability(propertyIds: string[]) {
    try {
      const results = await Promise.all(
        propertyIds.map(async (id) => ({
          propertyId: id,
          availability: await this.checkAvailability(id)
        }))
      );

      return results;
    } catch (error) {
      console.error('Error bulk checking availability:', error);
      return [];
    }
  }
}