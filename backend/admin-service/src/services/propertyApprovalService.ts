// backend/admin-service/src/services/propertyApprovalService.ts

import { PrismaClient, AdminApprovalStatus, PropertyStatus, AdminActionType } from '@newcondo/db';
import { adminService } from './adminService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface PropertyFilters {
  status?: AdminApprovalStatus;
  propertyType?: string;
  state?: string;
  city?: string;
  boundaryVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface PropertyApprovalDecision {
  propertyId: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  adminId: string;
  notes?: string;
}

class PropertyApprovalService {
  /**
   * Get properties pending approval
   */
  async getPendingProperties(adminId: string, filters: PropertyFilters = {}) {
    await adminService.verifyAdminAccess(adminId);

    const {
      status = 'PENDING',
      propertyType,
      state,
      city,
      boundaryVerified,
      search,
      page = 1,
      limit = 20
    } = filters;

    const where: any = {
      adminApprovalStatus: status
    };

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (state) {
      where.state = state;
    }

    if (city) {
      where.city = city;
    }

    if (boundaryVerified !== undefined) {
      where.boundaryVerified = boundaryVerified;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              verificationStatus: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          images: {
            orderBy: { order: 'asc' }
          },
          documents: {
            where: {
              documentType: {
                in: ['OWNERSHIP_DOCUMENT', 'CONSENT_DOCUMENT', 'UNDERTAKING_DOCUMENT']
              }
            }
          },
          markingJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.property.count({ where })
    ]);

    return {
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed property information for review
   */
  async getPropertyDetails(adminId: string, propertyId: string) {
    await adminService.verifyAdminAccess(adminId);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verificationStatus: true,
            role: true,
            companyName: true,
            isB2BCustomer: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verificationStatus: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        },
        documents: true,
        markingJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedAgent: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        duplicateReports: {
          include: {
            originalProperty: {
              select: {
                id: true,
                title: true,
                owner: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        units: {
          include: {
            images: true
          }
        }
      }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Check for potential duplicates based on coordinates
    let potentialDuplicates = [];
    if (property.boundaryCoordinates) {
      potentialDuplicates = await this.findPotentialDuplicates(property);
    }

    return {
      property,
      potentialDuplicates,
      verificationChecklist: this.generateVerificationChecklist(property)
    };
  }

  /**
   * Find potential duplicate properties
   */
  private async findPotentialDuplicates(property: any) {
    if (!property.gpsCoordinates) return [];

    // Find properties near this location (within ~100 meters)
    // This is a simplified check - in production, use PostGIS or similar
    const nearbyProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        city: property.city,
        state: property.state,
        boundaryVerified: true,
        NOT: {
          gpsCoordinates: null
        }
      },
      select: {
        id: true,
        title: true,
        address: true,
        gpsCoordinates: true,
        owner: {
          select: { name: true, email: true }
        }
      },
      take: 10
    });

    return nearbyProperties;
  }

  /**
   * Generate verification checklist
   */
  private generateVerificationChecklist(property: any) {
    return {
      ownerVerified: property.owner.verificationStatus === 'VERIFIED',
      hasImages: property.images.length > 0,
      hasBoundary: property.boundaryVerified,
      hasOwnershipDocs: property.documents.some((d: any) => 
        d.documentType === 'OWNERSHIP_DOCUMENT' && d.status === 'APPROVED'
      ),
      hasConsentDocs: property.isOwnerListing || property.documents.some((d: any) => 
        d.documentType === 'CONSENT_DOCUMENT' && d.status === 'APPROVED'
      ),
      hasValidPrice: property.structure === 'SINGLE_UNIT' 
        ? property.price && property.price > 0 
        : property.units && property.units.length > 0,
      hasCompleteAddress: !!(property.address && property.city && property.state),
      markingCompleted: property.markingJobs.some((j: any) => j.status === 'COMPLETED')
    };
  }

  /**
   * Approve or reject property
   */
  async processPropertyApproval(decision: PropertyApprovalDecision) {
    const { propertyId, status, rejectionReason, adminId, notes } = decision;

    // Verify admin access
    await adminService.verifyAdminAccess(adminId);

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    if (property.adminApprovalStatus !== 'PENDING') {
      throw new Error('Property approval is not pending');
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        adminApprovalStatus: status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedBy: adminId,
        status: status === 'APPROVED' ? PropertyStatus.PUBLISHED : property.status
      }
    });

    // If approved, create virtual account for property
    if (status === 'APPROVED') {
      await this.createPropertyVirtualAccount(propertyId, property.ownerId);
    }

    // Log admin action
    await adminService.logAction(
      adminId,
      status === 'APPROVED' ? AdminActionType.PROPERTY_APPROVED : AdminActionType.PROPERTY_REJECTED,
      'Property',
      propertyId,
      `Property ${status.toLowerCase()}`,
      { rejectionReason, notes }
    );

    // Send notification to owner
    await notificationService.sendPropertyApprovalDecision({
      userId: property.ownerId,
      email: property.owner.email!,
      name: property.owner.name || 'User',
      propertyTitle: property.title,
      status,
      rejectionReason
    });

    return updatedProperty;
  }

  /**
   * Create virtual account for property
   */
  private async createPropertyVirtualAccount(propertyId: string, ownerId: string) {
    try {
      // Check if virtual account already exists
      const existing = await prisma.virtualAccount.findUnique({
        where: { propertyId }
      });

      if (existing) return;

      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true, email: true }
      });

      if (!owner) return;

      // Generate unique account number (simplified - use actual payment provider in production)
      const accountNumber = `30${Date.now().toString().slice(-8)}`;
      const accountName = `${owner.name || 'User'}-${propertyId.slice(-6)}`.toUpperCase();

      await prisma.virtualAccount.create({
        data: {
          accountNumber,
          accountName,
          bankCode: '000', // Placeholder
          userId: ownerId,
          propertyId,
          currency: 'NGN',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error creating virtual account:', error);
      // Don't throw - property approval should succeed even if VA creation fails
    }
  }

  /**
   * Bulk approve properties
   */
  async bulkApproveProperties(adminId: string, propertyIds: string[]) {
    await adminService.verifyAdminAccess(adminId);

    const results = await Promise.allSettled(
      propertyIds.map(propertyId =>
        this.processPropertyApproval({
          propertyId,
          status: 'APPROVED',
          adminId
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: propertyIds.length,
      successful,
      failed,
      details: results
    };
  }

  /**
   * Get property approval statistics
   */
  async getApprovalStats(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [pending, approved, rejected, avgApprovalTime] = await Promise.all([
      prisma.property.count({ where: { adminApprovalStatus: 'PENDING' } }),
      prisma.property.count({ where: { adminApprovalStatus: 'APPROVED' } }),
      prisma.property.count({ where: { adminApprovalStatus: 'REJECTED' } }),
      this.getAverageApprovalTime()
    ]);

    // Get pending by property type
    const pendingByType = await prisma.property.groupBy({
      by: ['propertyType'],
      where: { adminApprovalStatus: 'PENDING' },
      _count: true
    });

    // Get pending by state
    const pendingByState = await prisma.property.groupBy({
      by: ['state'],
      where: { adminApprovalStatus: 'PENDING' },
      _count: true,
      orderBy: { _count: { _all: 'desc' } },
      take: 10
    });

    return {
      counts: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      },
      pendingByType: pendingByType.map(p => ({
        type: p.propertyType,
        count: p._count
      })),
      pendingByState: pendingByState.map(p => ({
        state: p.state,
        count: p._count
      })),
      avgApprovalTime: avgApprovalTime || 0
    };
  }

  /**
   * Calculate average approval time
   */
  private async getAverageApprovalTime(): Promise<number | null> {
    const approvedProperties = await prisma.property.findMany({
      where: {
        adminApprovalStatus: 'APPROVED',
        approvedAt: { not: null }
      },
      select: {
        createdAt: true,
        approvedAt: true
      },
      take: 100,
      orderBy: { approvedAt: 'desc' }
    });

    if (approvedProperties.length === 0) return null;

    const totalTime = approvedProperties.reduce((sum, property) => {
      const timeDiff = property.approvedAt!.getTime() - property.createdAt.getTime();
      return sum + timeDiff;
    }, 0);

    // Return average in hours
    return totalTime / approvedProperties.length / (1000 * 60 * 60);
  }

  /**
   * Flag property for review
   */
  async flagPropertyForReview(
    adminId: string,
    propertyId: string,
    reason: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ) {
    await adminService.verifyAdminAccess(adminId);

    // Log the flag
    await adminService.logAction(
      adminId,
      AdminActionType.PROPERTY_REJECTED,
      'Property',
      propertyId,
      `Property flagged for review: ${reason}`,
      { priority }
    );

    // Update property status if needed
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        adminApprovalStatus: 'PENDING'
      }
    });

    return { success: true };
  }

  /**
   * Get properties by approval status with filters
   */
  async getPropertiesByStatus(
    adminId: string,
    status: AdminApprovalStatus,
    filters: Omit<PropertyFilters, 'status'> = {}
  ) {
    return this.getPendingProperties(adminId, { ...filters, status });
  }

  /**
   * Get property approval history
   */
  async getPropertyApprovalHistory(adminId: string, propertyId: string) {
    await adminService.verifyAdminAccess(adminId);

    const actions = await prisma.adminAction.findMany({
      where: {
        targetType: 'Property',
        targetId: propertyId,
        action: {
          in: [AdminActionType.PROPERTY_APPROVED, AdminActionType.PROPERTY_REJECTED]
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return actions;
  }

  /**
   * Batch update property statuses
   */
  async batchUpdateProperties(
    adminId: string,
    updates: Array<{
      propertyId: string;
      status: AdminApprovalStatus;
      rejectionReason?: string;
    }>
  ) {
    await adminService.verifyAdminAccess(adminId);

    const results = await Promise.allSettled(
      updates.map(update =>
        this.processPropertyApproval({
          propertyId: update.propertyId,
          status: update.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          rejectionReason: update.rejectionReason,
          adminId
        })
      )
    );

    return {
      total: updates.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }
}

export const propertyApprovalService = new PropertyApprovalService();