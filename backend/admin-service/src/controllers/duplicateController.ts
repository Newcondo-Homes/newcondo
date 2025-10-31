// backend/admin-service/src/controllers/duplicateController.ts

import { Request, Response } from 'express';
import { PrismaClient, DuplicateStatus } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class DuplicateController {
  // This controller handles duplicate property management
  // Note: boundaryDisputeController handles boundary disputes
  // This focuses on general duplicate detection and management

  // Get all duplicates (alias for boundary disputes for consistency)
  async getAllDuplicates(req: Request, res: Response) {
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

      const [duplicates, total] = await Promise.all([
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
                    email: true
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

      // Fetch duplicate property details for each
      const duplicatesWithDetails = await Promise.all(
        duplicates.map(async (duplicate) => {
          const duplicateProperty = await prisma.property.findUnique({
            where: { id: duplicate.duplicatePropertyId },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              images: {
                take: 1,
                orderBy: { order: 'asc' }
              }
            }
          });

          return {
            ...duplicate,
            duplicateProperty
          };
        })
      );

      return successResponse(res, {
        duplicates: duplicatesWithDetails,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Duplicates retrieved successfully');
    } catch (error) {
      console.error('Get all duplicates error:', error);
      return errorResponse(res, 'Failed to retrieve duplicates', 500);
    }
  }

  // Scan for potential duplicates
  async scanForDuplicates(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { propertyId, radius = 50 } = req.query; // radius in meters

      let propertiesToScan;

      if (propertyId) {
        // Scan specific property
        propertiesToScan = await prisma.property.findMany({
          where: { id: propertyId as string },
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
      } else {
        // Scan all published properties without verified boundaries
        propertiesToScan = await prisma.property.findMany({
          where: {
            status: 'PUBLISHED',
            boundaryVerified: false
          },
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
      }

      const potentialDuplicates = [];

      // Compare each property with others
      for (const property of propertiesToScan) {
        if (!property.gpsCoordinates) continue;

        const coords = JSON.parse(property.gpsCoordinates);

        // Find nearby properties with similar coordinates
        const nearbyProperties = await prisma.property.findMany({
          where: {
            id: { not: property.id },
            status: 'PUBLISHED',
            gpsCoordinates: { not: null }
          }
        });

        for (const nearby of nearbyProperties) {
          if (!nearby.gpsCoordinates) continue;

          const nearbyCoords = JSON.parse(nearby.gpsCoordinates);

          // Simple distance calculation (haversine formula would be more accurate)
          const distance = this.calculateDistance(
            coords.lat,
            coords.lng,
            nearbyCoords.lat,
            nearbyCoords.lng
          );

          if (distance < Number(radius)) {
            // Check if duplicate already reported
            const existingDuplicate = await prisma.propertyDuplicate.findFirst({
              where: {
                OR: [
                  {
                    originalPropertyId: property.id,
                    duplicatePropertyId: nearby.id
                  },
                  {
                    originalPropertyId: nearby.id,
                    duplicatePropertyId: property.id
                  }
                ]
              }
            });

            if (!existingDuplicate) {
              potentialDuplicates.push({
                property1: property,
                property2: nearby,
                distance: distance.toFixed(2)
              });
            }
          }
        }
      }

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'DUPLICATE_RESOLVED',
        'Property',
        propertyId as string || 'bulk',
        `Scanned for duplicates - found ${potentialDuplicates.length} potential matches`,
        { radius, count: potentialDuplicates.length }
      );

      return successResponse(res, {
        scanned: propertiesToScan.length,
        potentialDuplicates
      }, 'Duplicate scan completed successfully');
    } catch (error) {
      console.error('Scan for duplicates error:', error);
      return errorResponse(res, 'Failed to scan for duplicates', 500);
    }
  }

  // Calculate distance between two coordinates (simplified)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Report properties as duplicates
  async reportDuplicate(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { originalPropertyId, duplicatePropertyId, notes } = req.body;

      if (!originalPropertyId || !duplicatePropertyId) {
        return errorResponse(res, 'Both property IDs are required', 400);
      }

      if (originalPropertyId === duplicatePropertyId) {
        return errorResponse(res, 'Cannot mark property as duplicate of itself', 400);
      }

      // Check if both properties exist
      const [original, duplicate] = await Promise.all([
        prisma.property.findUnique({ where: { id: originalPropertyId } }),
        prisma.property.findUnique({ where: { id: duplicatePropertyId } })
      ]);

      if (!original || !duplicate) {
        return errorResponse(res, 'One or both properties not found', 404);
      }

      // Check if duplicate already reported
      const existing = await prisma.propertyDuplicate.findFirst({
        where: {
          OR: [
            {
              originalPropertyId,
              duplicatePropertyId
            },
            {
              originalPropertyId: duplicatePropertyId,
              duplicatePropertyId: originalPropertyId
            }
          ]
        }
      });

      if (existing) {
        return errorResponse(res, 'Duplicate already reported', 400);
      }

      // Create duplicate report
      const duplicateReport = await prisma.propertyDuplicate.create({
        data: {
          originalPropertyId,
          duplicatePropertyId,
          reportedBy: adminId,
          status: 'PENDING',
          resolution: notes
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'DUPLICATE_RESOLVED',
        'PropertyDuplicate',
        duplicateReport.id,
        `Reported properties as duplicates: ${original.title} & ${duplicate.title}`,
        { originalPropertyId, duplicatePropertyId }
      );

      return successResponse(res, duplicateReport, 'Duplicate reported successfully');
    } catch (error) {
      console.error('Report duplicate error:', error);
      return errorResponse(res, 'Failed to report duplicate', 500);
    }
  }

  // Get duplicate statistics
  async getDuplicateStatistics(req: Request, res: Response) {
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
        totalDuplicates,
        resolvedDuplicates,
        preventedListings
      ] = await Promise.all([
        prisma.propertyDuplicate.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.propertyDuplicate.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.propertyDuplicate.count({
          where: {
            status: { not: 'PENDING' },
            resolvedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        // Count properties rejected due to duplicates
        prisma.property.count({
          where: {
            adminApprovalStatus: 'REJECTED',
            rejectionReason: {
              contains: 'duplicate',
              mode: 'insensitive'
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          statusBreakdown,
          totalDuplicates,
          resolvedDuplicates,
          preventedListings
        }
      }, 'Duplicate statistics retrieved successfully');
    } catch (error) {
      console.error('Get duplicate statistics error:', error);
      return errorResponse(res, 'Failed to retrieve duplicate statistics', 500);
    }
  }
}

export const duplicateController = new DuplicateController();