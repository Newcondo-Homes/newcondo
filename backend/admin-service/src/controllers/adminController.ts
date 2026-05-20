// backend/admin-service/src/controllers/adminController.ts
import { prisma } from '@newcondo/db'
import { Request, Response } from 'express';
import {  AdminActionType, AdminAction } from '@newcondo/db';
import { successResponse, errorResponse } from '@newcondo/backend-shared/';

export class AdminController {
  // Get admin dashboard overview
  async getDashboardOverview(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      // Get various statistics
      const [
        totalUsers,
        pendingVerifications,
        pendingPropertyApprovals,
        activeListings,
        totalPayments,
        openTickets,
        pendingMarkingJobs,
        boundaryDisputes
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { verificationStatus: 'PENDING' }
        }),
        prisma.property.count({
          where: { adminApprovalStatus: 'PENDING' }
        }),
        prisma.property.count({
          where: { status: 'PUBLISHED' }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'SUCCESS' }
        }),
        prisma.supportTicket.count({
          where: { status: 'OPEN' }
        }),
        prisma.propertyMarkingJob.count({
          where: { status: 'QUEUED' }
        }),
        prisma.propertyDuplicate.count({
          where: { status: 'PENDING' }
        })
      ]);

      // Get recent admin actions
      const recentActions = await prisma.adminAction.findMany({
        where: { adminId },
        take: 10,
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

      const overview = {
        statistics: {
          users: {
            total: totalUsers,
            pendingVerification: pendingVerifications
          },
          properties: {
            pendingApproval: pendingPropertyApprovals,
            active: activeListings
          },
          payments: {
            totalAmount: totalPayments._sum.amount || 0
          },
          support: {
            openTickets
          },
          markingJobs: {
            pending: pendingMarkingJobs
          },
          disputes: {
            boundaryDisputes
          }
        },
        recentActions
      };

      return successResponse(res, overview, 'Dashboard overview retrieved successfully');
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      return errorResponse(res, 'Failed to retrieve dashboard overview', 500);
    }
  }

  // Get admin profile
  async getAdminProfile(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!admin) {
        return errorResponse(res, 'Admin not found', 404);
      }

      // Get admin action statistics
      const actionStats = await prisma.adminAction.groupBy({
        by: ['action'],
        where: { adminId },
        _count: { action: true }
      });

      return successResponse(res, {
        profile: admin,
        actionStatistics: actionStats
      }, 'Admin profile retrieved successfully');
    } catch (error) {
      console.error('Get admin profile error:', error);
      return errorResponse(res, 'Failed to retrieve admin profile', 500);
    }
  }

  // Log admin action
  async logAdminAction(
    adminId: string,
    action: AdminActionType,
    targetType: string,
    targetId: string,
    description?: string,
    metadata?: any
  ): Promise<AdminAction> { // 2. Add explicit return type here
    try {
      return await prisma.adminAction.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          description,
          metadata: metadata || {}
        }
      });
    } catch (error) {
      console.error('Log admin action error:', error);
      throw error;
    }
  }

  // Get admin action logs
  async getAdminActionLogs(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        action,
        targetType,
        adminId,
        startDate,
        endDate
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (action) {
        where.action = action;
      }

      if (targetType) {
        where.targetType = targetType;
      }

      if (adminId) {
        where.adminId = adminId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [actions, total] = await Promise.all([
        prisma.adminAction.findMany({
          where,
          skip,
          take: Number(limit),
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
        }),
        prisma.adminAction.count({ where })
      ]);

      return successResponse(res, {
        actions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Admin action logs retrieved successfully');
    } catch (error) {
      console.error('Get admin action logs error:', error);
      return errorResponse(res, 'Failed to retrieve admin action logs', 500);
    }
  }

  // Get system statistics
  async getSystemStatistics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range based on period
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
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        newUsers,
        newProperties,
        newPayments,
        verificationRate,
        approvalRate
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.property.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'SUCCESS'
          }
        }),
        // Verification rate
        prisma.user.groupBy({
          by: ['verificationStatus'],
          _count: { verificationStatus: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        // Approval rate
        prisma.property.groupBy({
          by: ['adminApprovalStatus'],
          _count: { adminApprovalStatus: true },
          where: {
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
          newUsers,
          newProperties,
          newPayments,
          verificationRate,
          approvalRate
        }
      }, 'System statistics retrieved successfully');
    } catch (error) {
      console.error('Get system statistics error:', error);
      return errorResponse(res, 'Failed to retrieve system statistics', 500);
    }
  }
}

export const adminController = new AdminController();


