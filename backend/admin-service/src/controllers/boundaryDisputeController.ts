// backend/admin-service/src/controllers/boundaryDisputeController.ts

import { Request, Response } from 'express';
import { PrismaClient} from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class BoundaryDisputeController {
  // Get all boundary disputes
  async getAllDisputes(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      const [disputes, total] = await Promise.all([
        prisma.propertyDuplicate.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: order },
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
                  take: 1,
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }),
        prisma.propertyDuplicate.count({ where })
      ]);

      // For each dispute, fetch the duplicate property details
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
                take: 1,
                orderBy: { order: 'asc' }
              }
            }
          });

          return {
            ...dispute,
            duplicateProperty
          };
        })
      );

      return successResponse(res, {
        disputes: disputesWithDetails,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Boundary disputes retrieved successfully');
    } catch (error) {
      console.error('Get all disputes error:', error);
      return errorResponse(res, 'Failed to retrieve boundary disputes', 500);
    }
  }

  // Get dispute details
  async getDisputeDetails(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;

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
              agent: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              },
              images: true,
              documents: true
            }
          }
        }
      });

      if (!dispute) {
        return errorResponse(res, 'Dispute not found', 404);
      }

      // Fetch duplicate property
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
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          images: true,
          documents: true
        }
      });

      return successResponse(res, {
        ...dispute,
        duplicateProperty
      }, 'Dispute details retrieved successfully');
    } catch (error) {
      console.error('Get dispute details error:', error);
      return errorResponse(res, 'Failed to retrieve dispute details', 500);
    }
  }

  // Resolve dispute - confirm as duplicate
  async confirmDuplicate(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { resolution, keepPropertyId } = req.body;

      if (!keepPropertyId) {
        return errorResponse(res, 'Property to keep must be specified', 400);
      }

      const dispute = await prisma.propertyDuplicate.findUnique({
        where: { id: disputeId },
        include: {
          originalProperty: true
        }
      });

      if (!dispute) {
        return errorResponse(res, 'Dispute not found', 404);
      }

      if (dispute.status !== 'PENDING') {
        return errorResponse(res, 'Dispute already resolved', 400);
      }

      // Determine which property to remove
      const removePropertyId = keepPropertyId === dispute.originalPropertyId
        ? dispute.duplicatePropertyId
        : dispute.originalPropertyId;

      // Update dispute
      const updatedDispute = await prisma.propertyDuplicate.update({
        where: { id: disputeId },
        data: {
          status: 'CONFIRMED_DUPLICATE',
          resolution,
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });

      // Remove the duplicate property
      await prisma.property.update({
        where: { id: removePropertyId },
        data: {
          status: 'UNAVAILABLE',
          adminApprovalStatus: 'REJECTED',
          rejectionReason: 'Confirmed as duplicate listing',
          isAvailable: false
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyDuplicate',
        disputeId,
        `Confirmed duplicate: kept ${keepPropertyId}, removed ${removePropertyId}`,
        { resolution, keepPropertyId, removePropertyId }
      );

      // TODO: Send notifications to property owners

      return successResponse(res, updatedDispute, 'Dispute resolved - duplicate confirmed');
    } catch (error) {
      console.error('Confirm duplicate error:', error);
      return errorResponse(res, 'Failed to confirm duplicate', 500);
    }
  }

  // Resolve dispute - not a duplicate
  async rejectDuplicate(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { resolution } = req.body;

      const dispute = await prisma.propertyDuplicate.findUnique({
        where: { id: disputeId }
      });

      if (!dispute) {
        return errorResponse(res, 'Dispute not found', 404);
      }

      if (dispute.status !== 'PENDING') {
        return errorResponse(res, 'Dispute already resolved', 400);
      }

      // Update dispute
      const updatedDispute = await prisma.propertyDuplicate.update({
        where: { id: disputeId },
        data: {
          status: 'NOT_DUPLICATE',
          resolution,
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });

      // Both properties can remain active
      // Optionally, update boundary data to prevent future false positives

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyDuplicate',
        disputeId,
        'Confirmed properties are not duplicates',
        { resolution }
      );

      // TODO: Send notifications to property owners

      return successResponse(res, updatedDispute, 'Dispute resolved - not a duplicate');
    } catch (error) {
      console.error('Reject duplicate error:', error);
      return errorResponse(res, 'Failed to reject duplicate', 500);
    }
  }

  // Merge properties (advanced resolution)
  async mergeProperties(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { disputeId } = req.params;
      const { primaryPropertyId, mergeData } = req.body;

      if (!primaryPropertyId) {
        return errorResponse(res, 'Primary property must be specified', 400);
      }

      const dispute = await prisma.propertyDuplicate.findUnique({
        where: { id: disputeId }
      });

      if (!dispute) {
        return errorResponse(res, 'Dispute not found', 404);
      }

      if (dispute.status !== 'PENDING') {
        return errorResponse(res, 'Dispute already resolved', 400);
      }

      const secondaryPropertyId = primaryPropertyId === dispute.originalPropertyId
        ? dispute.duplicatePropertyId
        : dispute.originalPropertyId;

      // Get both properties
      const [primaryProperty, secondaryProperty] = await Promise.all([
        prisma.property.findUnique({
          where: { id: primaryPropertyId },
          include: { images: true }
        }),
        prisma.property.findUnique({
          where: { id: secondaryPropertyId },
          include: { images: true }
        })
      ]);

      if (!primaryProperty || !secondaryProperty) {
        return errorResponse(res, 'One or both properties not found', 404);
      }

      // Merge images from secondary to primary
      if (mergeData?.mergeImages && secondaryProperty.images.length > 0) {
        const maxOrder = primaryProperty.images.reduce(
          (max, img) => Math.max(max, img.order),
          0
        );

        await Promise.all(
          secondaryProperty.images.map((img, index) =>
            prisma.propertyImage.update({
              where: { id: img.id },
              data: {
                propertyId: primaryPropertyId,
                order: maxOrder + index + 1
              }
            })
          )
        );
      }

      // Update dispute
      const updatedDispute = await prisma.propertyDuplicate.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution: `Properties merged: ${primaryPropertyId} (primary) + ${secondaryPropertyId}`,
          resolvedBy: adminId,
          resolvedAt: new Date()
        }
      });

      // Deactivate secondary property
      await prisma.property.update({
        where: { id: secondaryPropertyId },
        data: {
          status: 'UNAVAILABLE',
          adminApprovalStatus: 'REJECTED',
          rejectionReason: 'Merged with another property listing',
          isAvailable: false
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyDuplicate',
        disputeId,
        `Merged properties: ${primaryPropertyId} (kept) + ${secondaryPropertyId} (merged)`,
        { primaryPropertyId, secondaryPropertyId, mergeData }
      );

      // TODO: Send notifications to both property owners

      return successResponse(res, {
        dispute: updatedDispute,
        primaryProperty: await prisma.property.findUnique({
          where: { id: primaryPropertyId },
          include: { images: true }
        })
      }, 'Properties merged successfully');
    } catch (error) {
      console.error('Merge properties error:', error);
      return errorResponse(res, 'Failed to merge properties', 500);
    }
  }

  // Get dispute statistics
  async getDisputeStatistics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        statusBreakdown,
        resolutionTrend,
        averageResolutionTime
      ] = await Promise.all([
        prisma.propertyDuplicate.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.propertyDuplicate.findMany({
          where: {
            resolvedAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            resolvedAt: true,
            status: true
          },
          orderBy: {
            resolvedAt: 'asc'
          }
        }),
        // Calculate average resolution time
        prisma.propertyDuplicate.findMany({
          where: {
            status: { not: 'PENDING' },
            resolvedAt: { not: null }
          },
          select: {
            createdAt: true,
            resolvedAt: true
          }
        }).then(disputes => {
          if (disputes.length === 0) return 0;
          const totalTime = disputes.reduce((sum, dispute) => {
            const time = dispute.resolvedAt!.getTime() - dispute.createdAt.getTime();
            return sum + time;
          }, 0);
          return totalTime / disputes.length / (1000 * 60 * 60); // Convert to hours
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          statusBreakdown,
          resolutionTrend,
          averageResolutionTime
        }
      }, 'Dispute statistics retrieved successfully');
    } catch (error) {
      console.error('Get dispute statistics error:', error);
      return errorResponse(res, 'Failed to retrieve dispute statistics', 500);
    }
  }
}

export const boundaryDisputeController = new BoundaryDisputeController();