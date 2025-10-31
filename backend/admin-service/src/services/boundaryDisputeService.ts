// backend/admin-service/src/services/boundaryDisputeService.ts

import { PrismaClient, DuplicateStatus, AdminActionType } from '@newcondo/db';
import { adminService } from './adminService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface DisputeFilters {
  status?: DuplicateStatus;
  state?: string;
  city?: string;
  page?: number;
  limit?: number;
}

interface DisputeResolution {
  disputeId: string;
  resolution: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE';
  adminId: string;
  notes: string;
  action?: 'REMOVE_DUPLICATE' | 'MERGE_PROPERTIES' | 'NO_ACTION';
}

class BoundaryDisputeService {
  /**
   * Get all boundary disputes/duplicates
   */
  async getDisputes(adminId: string, filters: DisputeFilters = {}) {
    await adminService.verifyAdminAccess(adminId);

    const {
      status = 'PENDING',
      state,
      city,
      page = 1,
      limit = 20
    } = filters;

    const where: any = {
      status
    };

    // Build complex where clause for location filtering
    if (state || city) {
      where.originalProperty = {};
      if (state) where.originalProperty.state = state;
      if (city) where.originalProperty.city = city;
    }

    const [disputes, total] = await Promise.all([
      prisma.propertyDuplicate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          originalProperty: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              },
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      }),
      prisma.propertyDuplicate.count({ where })
    ]);

    // Fetch duplicate property details separately
    const disputesWithDetails = await Promise.all(
      disputes.map(async (dispute) => {
        const duplicateProperty = await prisma.property.findUnique({
          where: { id: dispute.duplicatePropertyId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        });

        return {
          ...dispute,
          duplicateProperty
        };
      })
    );

    return {
      disputes: disputesWithDetails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed dispute information
   */
  async getDisputeDetails(adminId: string, disputeId: string) {
    await adminService.verifyAdminAccess(adminId);

    const dispute = await prisma.propertyDuplicate.findUnique({
      where: { id: disputeId },
      include: {
        originalProperty: {
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
            images: true,
            documents: true,
            markingJobs: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const duplicateProperty = await prisma.property.findUnique({
      where: { id: dispute.duplicatePropertyId },
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
        images: true,
        documents: true,
        markingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Compare boundary data
    const boundaryComparison = this.compareBoundaries(
      dispute.originalProperty,
      duplicateProperty
    );

    return {
      dispute,
      duplicateProperty,
      boundaryComparison,
      recommendation: this.generateRecommendation(boundaryComparison)
    };
  }

  /**
   * Compare boundaries between two properties
   */
  private compareBoundaries(property1: any, property2: any | null) {
    if (!property2) {
      return {
        overlapPercentage: 0,
        distanceMeters: null,
        similarity: 'NONE'
      };
    }

    // This is simplified - in production, use proper geospatial calculations
    const coords1 = property1.gpsCoordinates ? JSON.parse(property1.gpsCoordinates) : null;
    const coords2 = property2.gpsCoordinates ? JSON.parse(property2.gpsCoordinates) : null;

    if (!coords1 || !coords2) {
      return {
        overlapPercentage: 0,
        distanceMeters: null,
        similarity: 'UNKNOWN'
      };
    }

    // Calculate rough distance (Haversine formula would be better)
    const latDiff = Math.abs(coords1.lat - coords2.lat);
    const lngDiff = Math.abs(coords1.lng - coords2.lng);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Rough meters

    let similarity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
    let overlapPercentage = 0;

    if (distance < 10) {
      similarity = 'HIGH';
      overlapPercentage = 95;
    } else if (distance < 50) {
      similarity = 'MEDIUM';
      overlapPercentage = 50;
    } else if (distance < 100) {
      similarity = 'LOW';
      overlapPercentage = 10;
    }

    return {
      overlapPercentage,
      distanceMeters: Math.round(distance),
      similarity,
      coordinates: {
        property1: coords1,
        property2: coords2
      }
    };
  }

  /**
   * Generate recommendation based on comparison
   */
  private generateRecommendation(comparison: any): string {
    if (comparison.similarity === 'HIGH') {
      return 'High probability of duplicate - recommend removing newer listing';
    } else if (comparison.similarity === 'MEDIUM') {
      return 'Possible duplicate - review property details and images carefully';
    } else if (comparison.similarity === 'LOW') {
      return 'Low probability of duplicate - likely different properties';
    }
    return 'Unable to determine - insufficient data';
  }

  /**
   * Resolve boundary dispute
   */
  async resolveDispute(resolution: DisputeResolution) {
    const { disputeId, resolution: resolutionType, adminId, notes, action } = resolution;

    await adminService.verifyAdminAccess(adminId);

    const dispute = await prisma.propertyDuplicate.findUnique({
      where: { id: disputeId },
      include: {
        originalProperty: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Get duplicate property
    const duplicateProperty = await prisma.property.findUnique({
      where: { id: dispute.duplicatePropertyId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Update dispute status
    const updatedDispute = await prisma.propertyDuplicate.update({
      where: { id: disputeId },
      data: {
        status: resolutionType,
        resolution: notes,
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    });

    // Execute action if confirmed duplicate
    if (resolutionType === 'CONFIRMED_DUPLICATE' && action) {
      await this.executeDisputeAction(action, dispute.duplicatePropertyId, adminId);
    }

    // Log admin action
    await adminService.logAction(
      adminId,
      AdminActionType.BOUNDARY_DISPUTE_RESOLVED,
      'PropertyDuplicate',
      disputeId,
      `Dispute resolved: ${resolutionType}`,
      { notes, action }
    );

    // Send notifications to property owners
    if (dispute.originalProperty.owner.email) {
      await notificationService.sendDisputeResolution({
        userId: dispute.originalProperty.ownerId,
        email: dispute.originalProperty.owner.email,
        name: dispute.originalProperty.owner.name || 'User',
        propertyTitle: dispute.originalProperty.title,
        resolution: resolutionType,
        notes
      });
    }

    if (duplicateProperty?.owner.email) {
      await notificationService.sendDisputeResolution({
        userId: duplicateProperty.ownerId,
        email: duplicateProperty.owner.email,
        name: duplicateProperty.owner.name || 'User',
        propertyTitle: duplicateProperty.title,
        resolution: resolutionType,
        notes
      });
    }

    return updatedDispute;
  }

  /**
   * Execute dispute resolution action
   */
  private async executeDisputeAction(
    action: 'REMOVE_DUPLICATE' | 'MERGE_PROPERTIES' | 'NO_ACTION',
    duplicatePropertyId: string,
    adminId: string
  ) {
    switch (action) {
      case 'REMOVE_DUPLICATE':
        // Mark duplicate property as unavailable and rejected
        await prisma.property.update({
          where: { id: duplicatePropertyId },
          data: {
            status: 'UNAVAILABLE',
            adminApprovalStatus: 'REJECTED',
            rejectionReason: 'Duplicate property detected and removed',
            isAvailable: false
          }
        });
        break;

      case 'MERGE_PROPERTIES':
        // In production, implement proper merge logic
        // For now, just mark duplicate as merged
        await prisma.property.update({
          where: { id: duplicatePropertyId },
          data: {
            status: 'UNAVAILABLE',
            rejectionReason: 'Merged with original property'
          }
        });
        break;

      case 'NO_ACTION':
      default:
        // Do nothing
        break;
    }
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [pending, confirmed, notDuplicate, resolved] = await Promise.all([
      prisma.propertyDuplicate.count({ where: { status: 'PENDING' } }),
      prisma.propertyDuplicate.count({ where: { status: 'CONFIRMED_DUPLICATE' } }),
      prisma.propertyDuplicate.count({ where: { status: 'NOT_DUPLICATE' } }),
      prisma.propertyDuplicate.count({ where: { status: 'RESOLVED' } })
    ]);

    // Get pending by location
    const pendingByLocation = await prisma.propertyDuplicate.findMany({
      where: { status: 'PENDING' },
      include: {
        originalProperty: {
          select: {
            state: true,
            city: true
          }
        }
      }
    });

    const locationCounts = pendingByLocation.reduce((acc, dispute) => {
      const key = `${dispute.originalProperty.city}, ${dispute.originalProperty.state}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      counts: {
        pending,
        confirmed,
        notDuplicate,
        resolved,
        total: pending + confirmed + notDuplicate + resolved
      },
      pendingByLocation: Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }

  /**
   * Bulk resolve disputes
   */
  async bulkResolveDisputes(
    adminId: string,
    resolutions: Array<{
      disputeId: string;
      resolution: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE';
      notes?: string;
      action?: 'REMOVE_DUPLICATE' | 'MERGE_PROPERTIES' | 'NO_ACTION';
    }>
  ) {
    await adminService.verifyAdminAccess(adminId);

    const results = await Promise.allSettled(
      resolutions.map(res =>
        this.resolveDispute({
          disputeId: res.disputeId,
          resolution: res.resolution,
          adminId,
          notes: res.notes || '',
          action: res.action
        })
      )
    );

    return {
      total: resolutions.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  /**
   * Create manual dispute report
   */
  async createManualDispute(
    adminId: string,
    originalPropertyId: string,
    duplicatePropertyId: string,
    notes?: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    // Verify both properties exist
    const [original, duplicate] = await Promise.all([
      prisma.property.findUnique({ where: { id: originalPropertyId } }),
      prisma.property.findUnique({ where: { id: duplicatePropertyId } })
    ]);

    if (!original || !duplicate) {
      throw new Error('One or both properties not found');
    }

    // Check if dispute already exists
    const existing = await prisma.propertyDuplicate.findFirst({
      where: {
        OR: [
          { originalPropertyId, duplicatePropertyId },
          { originalPropertyId: duplicatePropertyId, duplicatePropertyId: originalPropertyId }
        ]
      }
    });

    if (existing) {
      throw new Error('Dispute already exists for these properties');
    }

    const dispute = await prisma.propertyDuplicate.create({
      data: {
        originalPropertyId,
        duplicatePropertyId,
        reportedBy: adminId,
        status: 'PENDING'
      }
    });

    // Log action
    await adminService.logAction(
      adminId,
      AdminActionType.BOUNDARY_DISPUTE_RESOLVED,
      'PropertyDuplicate',
      dispute.id,
      'Manual dispute created',
      { notes }
    );

    return dispute;
  }
}

export const boundaryDisputeService = new BoundaryDisputeService();