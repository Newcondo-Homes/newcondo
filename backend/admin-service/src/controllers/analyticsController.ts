// backend/admin-service/src/controllers/analyticsController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { successResponse, errorResponse } from '@newcondo/backend-shared/';

const prisma = new PrismaClient();

export class AnalyticsController {
  // Get platform overview analytics
  async getPlatformOverview(req: Request, res: Response) {
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
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        totalUsers,
        totalProperties,
        totalPayments,
        totalRevenue,
        activeRentals,
        completedMarkingJobs,
        newUsersInPeriod,
        newPropertiesInPeriod,
        paymentsInPeriod
      ] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.payment.count(),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'SUCCESS' }
        }),
        prisma.rental.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.propertyMarkingJob.count({
          where: { status: 'COMPLETED' }
        }),
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
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'SUCCESS'
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        overview: {
          totals: {
            users: totalUsers,
            properties: totalProperties,
            payments: totalPayments,
            revenue: totalRevenue._sum.amount || 0,
            activeRentals,
            completedMarkingJobs
          },
          periodData: {
            newUsers: newUsersInPeriod,
            newProperties: newPropertiesInPeriod,
            payments: paymentsInPeriod._count,
            revenue: paymentsInPeriod._sum.amount || 0
          }
        }
      }, 'Platform overview retrieved successfully');
    } catch (error) {
      console.error('Get platform overview error:', error);
      return errorResponse(res, 'Failed to retrieve platform overview', 500);
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d', groupBy = 'day' } = req.query;

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
        totalRevenue,
        revenueByType,
        platformFees,
        agentCommissions,
        successfulPayments
      ] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.groupBy({
          by: ['paymentType'],
          _sum: { amount: true },
          _count: true,
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.aggregate({
          _sum: { platformFee: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.aggregate({
          _sum: { agentCommission: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.findMany({
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            amount: true,
            createdAt: true,
            paymentType: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          byType: revenueByType,
          platformFees: platformFees._sum.platformFee || 0,
          agentCommissions: agentCommissions._sum.agentCommission || 0,
          timeline: successfulPayments
        }
      }, 'Revenue analytics retrieved successfully');
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      return errorResponse(res, 'Failed to retrieve revenue analytics', 500);
    }
  }

  // Get property analytics
  async getPropertyAnalytics(req: Request, res: Response) {
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
        propertyByStatus,
        propertyByType,
        propertyByState,
        averagePrice,
        listingTrend,
        occupancyRate
      ] = await Promise.all([
        prisma.property.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.property.groupBy({
          by: ['propertyType'],
          _count: { propertyType: true }
        }),
        prisma.property.groupBy({
          by: ['state'],
          _count: { state: true },
          orderBy: {
            _count: {
              state: 'desc'
            }
          },
          take: 10
        }),
        prisma.property.aggregate({
          _avg: { price: true },
          where: {
            price: { not: null }
          }
        }),
        prisma.property.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true,
            status: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }),
        // Calculate occupancy rate
        prisma.property.count({
          where: {
            status: 'RENTED'
          }
        }).then(rented => 
          prisma.property.count().then(total => ({
            rented,
            total,
            rate: total > 0 ? (rented / total) * 100 : 0
          }))
        )
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        properties: {
          byStatus: propertyByStatus,
          byType: propertyByType,
          byState: propertyByState,
          averagePrice: averagePrice._avg.price || 0,
          listingTrend,
          occupancyRate
        }
      }, 'Property analytics retrieved successfully');
    } catch (error) {
      console.error('Get property analytics error:', error);
      return errorResponse(res, 'Failed to retrieve property analytics', 500);
    }
  }

  // Get user analytics
  async getUserAnalytics(req: Request, res: Response) {
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
        usersByRole,
        usersByVerificationStatus,
        userGrowth,
        premiumUsers,
        activeAgents,
        userRetention
      ] = await Promise.all([
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        prisma.user.groupBy({
          by: ['verificationStatus'],
          _count: { verificationStatus: true }
        }),
        prisma.user.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true,
            role: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }),
        prisma.user.count({
          where: { isPremium: true }
        }),
        prisma.user.count({
          where: { isAvailableForMarking: true }
        }),
        // Calculate retention: users who created account and have activity
        prisma.user.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            OR: [
              { properties: { some: {} } },
              { rentals: { some: {} } },
              { payments: { some: {} } }
            ]
          }
        }).then(activeUsers =>
          prisma.user.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }).then(totalNewUsers => ({
            activeUsers,
            totalNewUsers,
            rate: totalNewUsers > 0 ? (activeUsers / totalNewUsers) * 100 : 0
          }))
        )
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        users: {
          byRole: usersByRole,
          byVerificationStatus: usersByVerificationStatus,
          growth: userGrowth,
          premiumUsers,
          activeAgents,
          retention: userRetention
        }
      }, 'User analytics retrieved successfully');
    } catch (error) {
      console.error('Get user analytics error:', error);
      return errorResponse(res, 'Failed to retrieve user analytics', 500);
    }
  }

  // Get marking job analytics
  async getMarkingJobAnalytics(req: Request, res: Response) {
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
        jobsByStatus,
        completionRate,
        averageCompletionTime,
        topAgents
      ] = await Promise.all([
        prisma.propertyMarkingJob.groupBy({
          by: ['status'],
          _count: { status: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.propertyMarkingJob.count({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }).then(completed =>
          prisma.propertyMarkingJob.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }).then(total => ({
            completed,
            total,
            rate: total > 0 ? (completed / total) * 100 : 0
          }))
        ),
        // Calculate average completion time
        prisma.propertyMarkingJob.findMany({
          where: {
            status: 'COMPLETED',
            completedAt: { not: null },
            assignedAt: { not: null },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            assignedAt: true,
            completedAt: true
          }
        }).then(jobs => {
          if (jobs.length === 0) return 0;
          const totalTime = jobs.reduce((sum, job) => {
            const time = job.completedAt!.getTime() - job.assignedAt!.getTime();
            return sum + time;
          }, 0);
          return totalTime / jobs.length / (1000 * 60 * 60); // Convert to hours
        }),
        // Get top performing agents
        prisma.user.findMany({
          where: {
            completedMarkingJobs: { gt: 0 }
          },
          select: {
            id: true,
            name: true,
            email: true,
            completedMarkingJobs: true,
            agentReliabilityScore: true
          },
          orderBy: {
            completedMarkingJobs: 'desc'
          },
          take: 10
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        markingJobs: {
          byStatus: jobsByStatus,
          completionRate,
          averageCompletionTime,
          topAgents
        }
      }, 'Marking job analytics retrieved successfully');
    } catch (error) {
      console.error('Get marking job analytics error:', error);
      return errorResponse(res, 'Failed to retrieve marking job analytics', 500);
    }
  }

  // Export analytics report
  async exportAnalyticsReport(req: Request, res: Response) {
    try {
      const { period = '30d', format = 'json' } = req.query;

      // Get all analytics data
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

      const report = {
        generatedAt: new Date(),
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalUsers: await prisma.user.count(),
          totalProperties: await prisma.property.count(),
          totalRevenue: await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: 'SUCCESS' }
          }),
          activeRentals: await prisma.rental.count({
            where: { status: 'ACTIVE' }
          })
        }
      };

      if (format === 'csv') {
        // TODO: Convert to CSV format
        return res.status(200).send('CSV export not yet implemented');
      }

      return successResponse(res, report, 'Analytics report generated successfully');
    } catch (error) {
      console.error('Export analytics report error:', error);
      return errorResponse(res, 'Failed to export analytics report', 500);
    }
  }
}

export const analyticsController = new AnalyticsController();










// import { Request, Response } from 'express';
// import { analyticsService } from '../services/analyticsService';
// import { sendSuccess, sendError } from '../../../shared/src/utils/response';

// export class AnalyticsController {
//   /**
//    * Get comprehensive analytics dashboard data
//    */
//   async getDashboardAnalytics(req: Request, res: Response) {
//     try {
//       const { timeframe = '30d', startDate, endDate } = req.query;

//       const analytics = await analyticsService.getDashboardAnalytics({
//         timeframe: timeframe as string,
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       return sendSuccess(res, analytics, 'Dashboard analytics retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching dashboard analytics:', error);
//       return sendError(res, 'Failed to fetch dashboard analytics', 500);
//     }
//   }

//   /**
//    * Get platform overview statistics
//    */
//   async getPlatformOverview(req: Request, res: Response) {
//     try {
//       const overview = await analyticsService.getPlatformOverview();

//       return sendSuccess(res, overview, 'Platform overview retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching platform overview:', error);
//       return sendError(res, 'Failed to fetch platform overview', 500);
//     }
//   }

//   /**
//    * Get growth metrics over time
//    */
//   async getGrowthMetrics(req: Request, res: Response) {
//     try {
//       const { period = 'daily', startDate, endDate } = req.query;

//       const metrics = await analyticsService.getGrowthMetrics({
//         period: period as 'daily' | 'weekly' | 'monthly',
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       return sendSuccess(res, metrics, 'Growth metrics retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching growth metrics:', error);
//       return sendError(res, 'Failed to fetch growth metrics', 500);
//     }
//   }

//   /**
//    * Get conversion funnel analytics
//    */
//   async getConversionFunnel(req: Request, res: Response) {
//     try {
//       const { startDate, endDate } = req.query;

//       const funnel = await analyticsService.getConversionFunnel({
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       return sendSuccess(res, funnel, 'Conversion funnel retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching conversion funnel:', error);
//       return sendError(res, 'Failed to fetch conversion funnel', 500);
//     }
//   }

//   /**
//    * Get user engagement metrics
//    */
//   async getUserEngagement(req: Request, res: Response) {
//     try {
//       const { timeframe = '30d' } = req.query;

//       const engagement = await analyticsService.getUserEngagement(timeframe as string);

//       return sendSuccess(res, engagement, 'User engagement retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching user engagement:', error);
//       return sendError(res, 'Failed to fetch user engagement', 500);
//     }
//   }

//   /**
//    * Export analytics report
//    */
//   async exportReport(req: Request, res: Response) {
//     try {
//       const { reportType, format = 'csv', startDate, endDate } = req.query;

//       const report = await analyticsService.exportAnalyticsReport({
//         reportType: reportType as string,
//         format: format as 'csv' | 'pdf' | 'excel',
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       res.setHeader('Content-Type', report.mimeType);
//       res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
//       return res.send(report.data);
//     } catch (error) {
//       console.error('Error exporting report:', error);
//       return sendError(res, 'Failed to export report', 500);
//     }
//   }
// }

// export const analyticsController = new AnalyticsController();