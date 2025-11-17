// backend/admin-service/src/controllers/adminController.ts

import { Request, Response } from 'express';
import { PrismaClient, AdminActionType } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

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
  ) {
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


















// /**
//  * File: backend/admin-service/src/controllers/adminController.ts
//  * Admin controller with i18n support
//  */

// import { Request, Response } from 'express';
// import { adminService } from '../services/adminService';
// import { SupportedLocale } from '@newcondo/shared/types/i18n.types';
// import { formatCurrency, formatDate, formatNumber } from '@newcondo/shared/utils/formatting';

// /**
//  * Get platform analytics with localized formatting
//  */
// export const getPlatformAnalytics = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const { startDate, endDate } = req.query;

//     const analytics = await adminService.getPlatformAnalytics({
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined,
//     });

//     // Localize analytics data
//     const localizedAnalytics = {
//       ...analytics,
//       totalRevenue: formatCurrency(analytics.totalRevenue, 'NGN', locale),
//       averagePropertyPrice: formatCurrency(analytics.averagePropertyPrice, 'NGN', locale),
//       totalUsers: formatNumber(analytics.totalUsers, locale),
//       totalProperties: formatNumber(analytics.totalProperties, locale),
//       totalPayments: formatNumber(analytics.totalPayments, locale),
//       conversionRate: `${(analytics.conversionRate * 100).toFixed(2)}%`,
//       period: {
//         start: formatDate(analytics.period.start, locale),
//         end: formatDate(analytics.period.end, locale),
//       },
//     };

//     res.json({
//       success: true,
//       data: localizedAnalytics,
//       message: req.t ? req.t('admin.analytics.retrieved') : 'Analytics retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve analytics',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get user statistics with localized data
//  */
// export const getUserStatistics = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const statistics = await adminService.getUserStatistics();

//     const localizedStats = {
//       totalUsers: formatNumber(statistics.totalUsers, locale),
//       activeUsers: formatNumber(statistics.activeUsers, locale),
//       newUsersThisMonth: formatNumber(statistics.newUsersThisMonth, locale),
//       verifiedUsers: formatNumber(statistics.verifiedUsers, locale),
//       usersByRole: Object.entries(statistics.usersByRole).reduce(
//         (acc, [role, count]) => ({
//           ...acc,
//           [role]: formatNumber(count as number, locale),
//         }),
//         {}
//       ),
//       growthRate: `${(statistics.growthRate * 100).toFixed(2)}%`,
//     };

//     res.json({
//       success: true,
//       data: localizedStats,
//       message: req.t ? req.t('admin.statistics.retrieved') : 'Statistics retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve statistics',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get property statistics with localized data
//  */
// export const getPropertyStatistics = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const statistics = await adminService.getPropertyStatistics();

//     const localizedStats = {
//       totalProperties: formatNumber(statistics.totalProperties, locale),
//       publishedProperties: formatNumber(statistics.publishedProperties, locale),
//       rentedProperties: formatNumber(statistics.rentedProperties, locale),
//       pendingApproval: formatNumber(statistics.pendingApproval, locale),
//       averagePrice: formatCurrency(statistics.averagePrice, 'NGN', locale),
//       propertyTypes: Object.entries(statistics.propertyTypes).reduce(
//         (acc, [type, count]) => ({
//           ...acc,
//           [type]: formatNumber(count as number, locale),
//         }),
//         {}
//       ),
//       byLocation: statistics.byLocation.map((loc: any) => ({
//         city: loc.city,
//         count: formatNumber(loc.count, locale),
//         averagePrice: formatCurrency(loc.averagePrice, 'NGN', locale),
//       })),
//     };

//     res.json({
//       success: true,
//       data: localizedStats,
//       message: req.t
//         ? req.t('admin.propertyStats.retrieved')
//         : 'Property statistics retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve property statistics',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get payment statistics with localized data
//  */
// export const getPaymentStatistics = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const { startDate, endDate } = req.query;

//     const statistics = await adminService.getPaymentStatistics({
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined,
//     });

//     const localizedStats = {
//       totalPayments: formatNumber(statistics.totalPayments, locale),
//       successfulPayments: formatNumber(statistics.successfulPayments, locale),
//       failedPayments: formatNumber(statistics.failedPayments, locale),
//       totalVolume: formatCurrency(statistics.totalVolume, 'NGN', locale),
//       averageTransaction: formatCurrency(statistics.averageTransaction, 'NGN', locale),
//       platformFees: formatCurrency(statistics.platformFees, 'NGN', locale),
//       agentCommissions: formatCurrency(statistics.agentCommissions, 'NGN', locale),
//       successRate: `${(statistics.successRate * 100).toFixed(2)}%`,
//       paymentMethods: Object.entries(statistics.paymentMethods).reduce(
//         (acc, [method, data]: [string, any]) => ({
//           ...acc,
//           [method]: {
//             count: formatNumber(data.count, locale),
//             volume: formatCurrency(data.volume, 'NGN', locale),
//           },
//         }),
//         {}
//       ),
//     };

//     res.json({
//       success: true,
//       data: localizedStats,
//       message: req.t
//         ? req.t('admin.paymentStats.retrieved')
//         : 'Payment statistics retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve payment statistics',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get marking service statistics
//  */
// export const getMarkingStatistics = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const statistics = await adminService.getMarkingStatistics();

//     const localizedStats = {
//       totalJobs: formatNumber(statistics.totalJobs, locale),
//       completedJobs: formatNumber(statistics.completedJobs, locale),
//       pendingJobs: formatNumber(statistics.pendingJobs, locale),
//       cancelledJobs: formatNumber(statistics.cancelledJobs, locale),
//       totalRevenue: formatCurrency(statistics.totalRevenue, 'NGN', locale),
//       averageCompletionTime: `${statistics.averageCompletionTime} ${req.t ? req.t('common.hours') : 'hours'}`,
//       completionRate: `${(statistics.completionRate * 100).toFixed(2)}%`,
//       topAgents: statistics.topAgents.map((agent: any) => ({
//         name: agent.name,
//         completedJobs: formatNumber(agent.completedJobs, locale),
//         earnings: formatCurrency(agent.earnings, 'NGN', locale),
//         rating: agent.rating.toFixed(2),
//       })),
//     };

//     res.json({
//       success: true,
//       data: localizedStats,
//       message: req.t
//         ? req.t('admin.markingStats.retrieved')
//         : 'Marking statistics retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve marking statistics',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Export analytics report in localized format
//  */
// export const exportAnalyticsReport = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const { format, startDate, endDate, reportType } = req.query;

//     const report = await adminService.generateAnalyticsReport({
//       format: (format as 'pdf' | 'csv' | 'excel') || 'pdf',
//       startDate: startDate ? new Date(startDate as string) : undefined,
//       endDate: endDate ? new Date(endDate as string) : undefined,
//       reportType: (reportType as string) || 'comprehensive',
//       locale,
//     });

//     res.setHeader('Content-Type', report.mimeType);
//     res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
//     res.send(report.data);
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.report.generation') : 'Failed to generate report',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get system health status with localized messages
//  */
// export const getSystemHealth = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const health = await adminService.getSystemHealth();

//     const statusLabels: Record<string, Record<SupportedLocale, string>> = {
//       healthy: {
//         en: 'Healthy',
//         fr: 'Sain',
//         pcm: 'E dey okay',
//       },
//       degraded: {
//         en: 'Degraded',
//         fr: 'Dégradé',
//         pcm: 'E dey struggle small',
//       },
//       down: {
//         en: 'Down',
//         fr: 'Hors service',
//         pcm: 'E no dey work',
//       },
//     };

//     const localizedHealth = {
//       ...health,
//       status: statusLabels[health.status]?.[locale] || health.status,
//       services: health.services.map((service: any) => ({
//         ...service,
//         status: statusLabels[service.status]?.[locale] || service.status,
//         responseTime: `${service.responseTime}ms`,
//       })),
//     };

//     res.json({
//       success: true,
//       data: localizedHealth,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.health.check') : 'Health check failed',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get localized admin notifications
//  */
// export const getAdminNotifications = async (req: Request, res: Response) => {
//   try {
//     const locale = (req.locale || 'en') as SupportedLocale;
//     const { page = 1, limit = 20 } = req.query;

//     const notifications = await adminService.getAdminNotifications({
//       page: parseInt(page as string),
//       limit: parseInt(limit as string),
//       locale,
//     });

//     res.json({
//       success: true,
//       data: notifications,
//       message: req.t
//         ? req.t('admin.notifications.retrieved')
//         : 'Notifications retrieved successfully',
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: req.t ? req.t('errors.server.general') : 'Failed to retrieve notifications',
//       error: error.message,
//     });
//   }
// };

// /**
//  * Update platform locale settings
//  */
// export const updateLocaleSettings = async (req: Request, res: Response) => {
//   try {
//     const { supportedLocales, defaultLocale, enabledFeatures } = req.body;

//     const updated = await adminService.updateLocaleSettings({
//       supportedLocales,
//       defaultLocale,
//       enabledFeatures,
//     });

//     res.json({
//       success: true,
//       data: updated,
//       message: req.t
//         ? req.t('admin.settings.updated')
//         : 'Locale settings updated successfully',
//     });
//   } catch (error: any) {
//     res.status(400).json({
//       success: false,
//       message: req.t ? req.t('errors.settings.update') : 'Failed to update settings',
//       error: error.message,
//     });
//   }
// };