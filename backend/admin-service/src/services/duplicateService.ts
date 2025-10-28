import { PrismaClient, DuplicateStatus, AdminActionType, Prisma } from '@newcondo/db';
import { AppError } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

interface DuplicateFilters {
  status?: DuplicateStatus;
  reportedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export class DuplicateService {
  /**
   * Get all duplicate reports with filters
   */
  async getDuplicateReports(
    filters: DuplicateFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyDuplicateWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.reportedBy && { reportedBy: filters.reportedBy }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    const [duplicates, total] = await Promise.all([
      prisma.propertyDuplicate.findMany({
        where,
        include: {
          originalProperty: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.propertyDuplicate.count({ where }),
    ]);

    // Fetch duplicate property details separately
    const enrichedDuplicates = await Promise.all(
      duplicates.map(async (dup) => {
        const duplicateProperty = await prisma.property.findUnique({
          where: { id: dup.duplicatePropertyId },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        });

        return {
          ...dup,
          duplicateProperty,
        };
      })
    );

    return {
      duplicates: enrichedDuplicates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get duplicate report details
   */
  async getDuplicateById(duplicateId: string) {
    const duplicate = await prisma.propertyDuplicate.findUnique({
      where: { id: duplicateId },
      include: {
        originalProperty: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
              },
            },
            images: true,
          },
        },
      },
    });

    if (!duplicate) {
      throw new AppError('Duplicate report not found', 404);
    }

    const duplicateProperty = await prisma.property.findUnique({
      where: { id: duplicate.duplicatePropertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        images: true,
      },
    });

    return {
      ...duplicate,
      duplicateProperty,
    };
  }

  /**
   * Confirm duplicate and take action
   */
  async confirmDuplicate(
    duplicateId: string,
    adminId: string,
    resolution: string,
    actionType: 'REMOVE_DUPLICATE' | 'REMOVE_ORIGINAL' | 'MERGE_PROPERTIES'
  ) {
    const duplicate = await prisma.propertyDuplicate.findUnique({
      where: { id: duplicateId },
      include: {
        originalProperty: true,
      },
    });

    if (!duplicate) {
      throw new AppError('Duplicate report not found', 404);
    }

    if (duplicate.status !== DuplicateStatus.PENDING) {
      throw new AppError('Duplicate report already resolved', 400);
    }

    const duplicateProperty = await prisma.property.findUnique({
      where: { id: duplicate.duplicatePropertyId },
    });

    if (!duplicateProperty) {
      throw new AppError('Duplicate property not found', 404);
    }

    // Perform action based on type
    let propertyIdToRemove: string | null = null;

    switch (actionType) {
      case 'REMOVE_DUPLICATE':
        // Remove the duplicate listing
        propertyIdToRemove = duplicate.duplicatePropertyId;
        await prisma.property.update({
          where: { id: duplicate.duplicatePropertyId },
          data: {
            status: 'UNAVAILABLE',
            adminApprovalStatus: 'REJECTED',
            rejectionReason: `Confirmed as duplicate of property ${duplicate.originalPropertyId}`,
          },
        });
        break;

      case 'REMOVE_ORIGINAL':
        // Remove the original listing (if newer one is better)
        propertyIdToRemove = duplicate.originalPropertyId;
        await prisma.property.update({
          where: { id: duplicate.originalPropertyId },
          data: {
            status: 'UNAVAILABLE',
            adminApprovalStatus: 'REJECTED',
            rejectionReason: `Confirmed as duplicate, replaced by property ${duplicate.duplicatePropertyId}`,
          },
        });
        break;

      case 'MERGE_PROPERTIES':
        // This would require more complex logic - for now just mark as resolved
        // In a real implementation, you'd merge the property data
        break;
    }

    // Update duplicate report
    const updatedDuplicate = await prisma.propertyDuplicate.update({
      where: { id: duplicateId },
      data: {
        status: DuplicateStatus.CONFIRMED_DUPLICATE,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.DUPLICATE_RESOLVED,
        targetType: 'PropertyDuplicate',
        targetId: duplicateId,
        description: `Confirmed duplicate and performed action: ${actionType}`,
        metadata: {
          originalPropertyId: duplicate.originalPropertyId,
          duplicatePropertyId: duplicate.duplicatePropertyId,
          actionType,
          propertyIdRemoved: propertyIdToRemove,
        },
      },
    });

    return updatedDuplicate;
  }

  /**
   * Mark as not duplicate
   */
  async markAsNotDuplicate(duplicateId: string, adminId: string, resolution: string) {
    const duplicate = await prisma.propertyDuplicate.findUnique({
      where: { id: duplicateId },
    });

    if (!duplicate) {
      throw new AppError('Duplicate report not found', 404);
    }

    if (duplicate.status !== DuplicateStatus.PENDING) {
      throw new AppError('Duplicate report already resolved', 400);
    }

    const updatedDuplicate = await prisma.propertyDuplicate.update({
      where: { id: duplicateId },
      data: {
        status: DuplicateStatus.NOT_DUPLICATE,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: AdminActionType.DUPLICATE_RESOLVED,
        targetType: 'PropertyDuplicate',
        targetId: duplicateId,
        description: 'Marked as not duplicate',
        metadata: {
          originalPropertyId: duplicate.originalPropertyId,
          duplicatePropertyId: duplicate.duplicatePropertyId,
          resolution,
        },
      },
    });

    return updatedDuplicate;
  }

  /**
   * Get duplicate statistics
   */
  async getDuplicateStats() {
    const [totalReports, statusCounts, recentReports] = await Promise.all([
      prisma.propertyDuplicate.count(),
      prisma.propertyDuplicate.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.propertyDuplicate.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    const statusMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<DuplicateStatus, number>
    );

    return {
      totalReports,
      pendingReports: statusMap.PENDING || 0,
      confirmedDuplicates: statusMap.CONFIRMED_DUPLICATE || 0,
      notDuplicates: statusMap.NOT_DUPLICATE || 0,
      resolvedReports: statusMap.RESOLVED || 0,
      recentReports,
    };
  }

  /**
   * Get properties with potential duplicates (not yet reported)
   */
  async detectPotentialDuplicates(limit: number = 50) {
    // Find properties with same buildingFingerprint
    const potentialDuplicates = await prisma.$queryRaw
      Array<{
        buildingFingerprint: string;
        count: number;
        propertyIds: string[];
      }>
    >`
      SELECT 
        "buildingFingerprint",
        COUNT(*)::INTEGER as count,
        ARRAY_AGG("id") as "propertyIds"
      FROM "Property"
      WHERE "buildingFingerprint" IS NOT NULL
        AND "status" != 'UNAVAILABLE'
      GROUP BY "buildingFingerprint"
      HAVING COUNT(*) > 1
      LIMIT ${limit}
    `;

    // Enrich with property details
    const enriched = await Promise.all(
      potentialDuplicates.map(async (item) => {
        const properties = await prisma.property.findMany({
          where: {
            id: { in: item.propertyIds },
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        return {
          buildingFingerprint: item.buildingFingerprint,
          count: item.count,
          properties,
        };
      })
    );

    return enriched;
  }

  /**
   * Bulk resolve duplicates
   */
  async bulkResolveDuplicates(
    duplicateIds: string[],
    adminId: string,
    resolution: string,
    action: DuplicateStatus
  ) {
    if (duplicateIds.length === 0) {
      throw new AppError('No duplicate IDs provided', 400);
    }

    // Verify all duplicates exist and are pending
    const duplicates = await prisma.propertyDuplicate.findMany({
      where: {
        id: { in: duplicateIds },
        status: DuplicateStatus.PENDING,
      },
    });

    if (duplicates.length !== duplicateIds.length) {
      throw new AppError('Some duplicate reports not found or already resolved', 400);
    }

    // Update all duplicates
    const updated = await prisma.propertyDuplicate.updateMany({
      where: { id: { in: duplicateIds } },
      data: {
        status: action
        ,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // Log admin action for each duplicate
    await Promise.all(
      duplicates.map((duplicate) =>
        prisma.adminAction.create({
          data: {
            adminId,
            action: AdminActionType.DUPLICATE_RESOLVED,
            targetType: 'PropertyDuplicate',
            targetId: duplicate.id,
            description: `Bulk resolved duplicate report`,
            metadata: {
              originalPropertyId: duplicate.originalPropertyId,
              duplicatePropertyId: duplicate.duplicatePropertyId,
              bulkAction: true,
              resolution,
            },
          },
        })
      )
    );

    return {
      resolvedCount: updated.count,
      duplicateIds,
    };
  }
}

export const duplicateService = new DuplicateService();