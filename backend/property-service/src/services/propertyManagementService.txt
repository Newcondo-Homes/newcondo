// backend/property-service/src/services/propertyManagementService.ts

import { PrismaClient, PropertyStatus, PropertyStructure } from '@prisma/client';
import {
  PropertyWithDetails,
  PropertyUpdateInput,
  PropertyUnitUpdateInput,
  PropertyManagementFilters,
  PropertyManagementDashboard,
  UnitManagementData,
  BoundaryUpdateInput,
  PropertyOwnershipVerification,
  MarkingServiceHistory
} from '../types/propertyManagement';

const prisma = new PrismaClient();

export class PropertyManagementService {
  /**
   * Verify user ownership or agency of a property
   */
  async verifyPropertyAccess(
    userId: string,
    propertyId: string
  ): Promise<PropertyOwnershipVerification> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        ownerId: true,
        agentId: true,
      },
    });

    if (!property) {
      return {
        isOwner: false,
        isAgent: false,
        hasAccess: false,
        role: null,
      };
    }

    const isOwner = property.ownerId === userId;
    const isAgent = property.agentId === userId;

    return {
      isOwner,
      isAgent,
      hasAccess: isOwner || isAgent,
      role: isOwner ? 'OWNER' : isAgent ? 'AGENT' : null,
    };
  }

  /**
   * Get all properties for a user (owner or agent)
   */
  async getUserProperties(
    userId: string,
    filters: PropertyManagementFilters
  ): Promise<{ properties: PropertyWithDetails[]; total: number; pages: number }> {
    const {
      status,
      isAvailable,
      propertyType,
      city,
      state,
      structure,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filters;

    const where: any = {
      OR: [
        { ownerId: userId },
        { agentId: userId },
      ],
    };

    if (status) where.status = status;
    if (typeof isAvailable === 'boolean') where.isAvailable = isAvailable;
    if (propertyType) where.propertyType = propertyType;
    if (city) where.city = city;
    if (state) where.state = state;
    if (structure) where.structure = structure;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          units: {
            include: {
              images: true,
            },
          },
          images: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              rentals: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: properties as any,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single property details
   */
  async getPropertyDetails(propertyId: string): Promise<PropertyWithDetails | null> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: {
          include: {
            images: true,
            rentals: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                renter: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            rentals: true,
          },
        },
      },
    });

    return property as any;
  }

  /**
   * Update property information
   */
  async updateProperty(
    propertyId: string,
    userId: string,
    data: PropertyUpdateInput
  ): Promise<PropertyWithDetails> {
    // Verify access
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized: You do not have access to this property');
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        units: {
          include: {
            images: true,
          },
        },
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            rentals: true,
          },
        },
      },
    });

    return updated as any;
  }

  /**
   * Update property boundary information
   */
  async updatePropertyBoundary(
    propertyId: string,
    userId: string,
    data: BoundaryUpdateInput
  ): Promise<void> {
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized: You do not have access to this property');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        boundaryCoordinates: data.boundaryCoordinates,
        boundaryImages: data.boundaryImages,
        boundaryMarkedBy: userId,
        boundaryMarkedAt: new Date(),
        boundaryVerified: true,
      },
    });
  }

  /**
   * Get property management dashboard
   */
  async getManagementDashboard(userId: string): Promise<PropertyManagementDashboard> {
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { agentId: userId },
        ],
      },
      include: {
        rentals: {
          where: {
            status: 'ACTIVE',
          },
        },
        payments: {
          where: {
            status: 'SUCCESS',
          },
        },
      },
    });

    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.isAvailable).length;
    const rentedProperties = properties.filter(p => p.status === 'RENTED').length;
    const draftProperties = properties.filter(p => p.status === 'DRAFT').length;
    const pendingApproval = properties.filter(
      p => p.adminApprovalStatus === 'PENDING'
    ).length;

    const totalViews = properties.reduce((sum, p) => sum + p.viewCount, 0);
    
    // Calculate total earnings from payments
    const totalEarnings = properties.reduce((sum, p) => {
      return sum + p.rentals.reduce((rentalSum: number, rental: any) => {
        return rentalSum + rental.monthlyRent.toNumber();
      }, 0);
    }, 0);

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId);

    return {
      totalProperties,
      activeProperties,
      rentedProperties,
      draftProperties,
      pendingApproval,
      totalViews,
      totalEarnings,
      recentActivity,
    };
  }

  /**
   * Get unit management data for multi-family properties
   */
  async getUnitManagement(propertyId: string, userId: string): Promise<UnitManagementData> {
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized: You do not have access to this property');
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        totalUnits: true,
        availableUnits: true,
        structure: true,
      },
    });

    if (!property || property.structure !== 'MULTI_FAMILY') {
      throw new Error('Property is not a multi-family building');
    }

    const units = await prisma.propertyUnit.findMany({
      where: { propertyId },
      include: {
        images: true,
        rentals: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            renter: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
    });

    const occupiedUnits = units.filter(u => !u.isAvailable).length;

    return {
      propertyId: property.id,
      totalUnits: property.totalUnits || 0,
      availableUnits: property.availableUnits || 0,
      occupiedUnits,
      units: units.map(unit => ({
        ...unit,
        currentRental: unit.rentals[0] || null,
      })),
    };
  }

  /**
   * Update a specific unit
   */
  async updatePropertyUnit(
    unitId: string,
    propertyId: string,
    userId: string,
    data: PropertyUnitUpdateInput
  ): Promise<void> {
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized: You do not have access to this property');
    }

    await prisma.propertyUnit.update({
      where: {
        id: unitId,
        propertyId: propertyId,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Update property's available units count
    const availableCount = await prisma.propertyUnit.count({
      where: {
        propertyId,
        isAvailable: true,
      },
    });

    await prisma.property.update({
      where: { id: propertyId },
      data: { availableUnits: availableCount },
    });
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess || !access.isOwner) {
      throw new Error('Unauthorized: Only property owners can delete properties');
    }

    // Check for active rentals
    const activeRentals = await prisma.rental.count({
      where: {
        propertyId,
        status: 'ACTIVE',
      },
    });

    if (activeRentals > 0) {
      throw new Error('Cannot delete property with active rentals');
    }

    await prisma.property.delete({
      where: { id: propertyId },
    });
  }

  /**
   * Get marking service history for a property
   */
  async getMarkingServiceHistory(propertyId: string, userId: string): Promise<MarkingServiceHistory> {
    const access = await this.verifyPropertyAccess(userId, propertyId);
    if (!access.hasAccess) {
      throw new Error('Unauthorized: You do not have access to this property');
    }

    const markingJobs = await prisma.propertyMarkingJob.findMany({
      where: { propertyId },
      include: {
        assignedAgent: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      propertyId,
      markingJobs: markingJobs.map(job => ({
        id: job.id,
        status: job.status,
        requestedAt: job.createdAt,
        completedAt: job.completedAt || undefined,
        assignedAgent: job.assignedAgent || undefined,
        markingFee: job.markingFee.toNumber(),
        completionImages: job.completionImages,
        completionNotes: job.completionNotes || undefined,
      })),
    };
  }

  /**
   * Get recent activity for dashboard
   */
  private async getRecentActivity(userId: string, limit = 10) {
    const events = await prisma.eventLog.findMany({
      where: {
        userId,
        type: {
          in: [
            'PROPERTY_VIEWED',
            'PROPERTY_RENTED',
            'PAYMENT_RECEIVED',
            'PROPERTY_UPDATED',
            'PROPERTY_APPROVED',
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return events.map(event => ({
      type: event.type,
      description: this.formatEventDescription(event),
      timestamp: event.timestamp,
    }));
  }

  /**
   * Format event description
   */
  private formatEventDescription(event: any): string {
    const metadata = event.metadata as any;
    
    switch (event.type) {
      case 'PROPERTY_VIEWED':
        return `Your property was viewed ${metadata?.count || 1} time(s)`;
      case 'PROPERTY_RENTED':
        return `Property rented successfully`;
      case 'PAYMENT_RECEIVED':
        return `Payment of ₦${metadata?.amount || 0} received`;
      case 'PROPERTY_UPDATED':
        return `Property information updated`;
      case 'PROPERTY_APPROVED':
        return `Property approved by admin`;
      default:
        return 'Activity recorded';
    }
  }
}

export default new PropertyManagementService();