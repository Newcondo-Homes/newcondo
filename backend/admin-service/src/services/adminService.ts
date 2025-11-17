// backend/admin-service/src/services/adminService.ts

import { PrismaClient, Role, AdminActionType } from '@newcondo/db';
import { auditLogService } from './auditLogService';

const prisma = new PrismaClient();

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  pendingVerifications: number;
  pendingPropertyApprovals: number;
  activeSupportTickets: number;
  pendingMarkingJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface AdminDashboardData {
  stats: AdminStats;
  recentActivities: any[];
  systemHealth: {
    services: string[];
    status: 'healthy' | 'degraded' | 'down';
  };
}

class AdminService {
  /**
   * Get comprehensive admin dashboard data
   */
  async getDashboardData(adminId: string): Promise<AdminDashboardData> {
    try {
      // Verify admin permissions
      await this.verifyAdminAccess(adminId);

      // Get all stats in parallel
      const [
        totalUsers,
        totalProperties,
        pendingVerifications,
        pendingPropertyApprovals,
        activeSupportTickets,
        pendingMarkingJobs,
        revenueData,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.user.count({
          where: { verificationStatus: 'PENDING' }
        }),
        prisma.property.count({
          where: { adminApprovalStatus: 'PENDING' }
        }),
        prisma.supportTicket.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        }),
        prisma.propertyMarkingJob.count({
          where: { status: { in: ['QUEUED', 'ASSIGNED'] } }
        }),
        this.getRevenueStats(),
      ]);

      // Get recent admin activities
      const recentActivities = await prisma.adminAction.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      const stats: AdminStats = {
        totalUsers,
        totalProperties,
        pendingVerifications,
        pendingPropertyApprovals,
        activeSupportTickets,
        pendingMarkingJobs,
        totalRevenue: revenueData.total,
        monthlyRevenue: revenueData.monthly,
      };

      return {
        stats,
        recentActivities,
        systemHealth: {
          services: ['database', 'payment', 'notification'],
          status: 'healthy'
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch admin dashboard data');
    }
  }

  /**
   * Get revenue statistics
   */
  private async getRevenueStats(): Promise<{ total: number; monthly: number }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, monthlyRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: firstDayOfMonth }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      total: Number(totalRevenue._sum.amount || 0),
      monthly: Number(monthlyRevenue._sum.amount || 0)
    };
  }

  /**
   * Verify admin access
   */
  async verifyAdminAccess(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }
  }

  /**
   * Get system analytics overview
   */
  async getSystemAnalytics(adminId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    await this.verifyAdminAccess(adminId);

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    const [
      newUsers,
      newProperties,
      completedPayments,
      completedMarkingJobs,
      activeRentals
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.property.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.payment.count({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        }
      }),
      prisma.rental.count({
        where: { status: 'ACTIVE' }
      })
    ]);

    return {
      timeRange,
      startDate,
      endDate: new Date(),
      metrics: {
        newUsers,
        newProperties,
        completedPayments,
        completedMarkingJobs,
        activeRentals
      }
    };
  }

  /**
   * Log admin action
   */
  async logAction(
    adminId: string,
    action: AdminActionType,
    targetType: string,
    targetId: string,
    description?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.adminAction.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          description,
          metadata: metadata || {}
        }
      });

      // Also log to audit service
      await auditLogService.log({
        userId: adminId,
        action: `ADMIN_${action}`,
        resource: targetType,
        resourceId: targetId,
        details: { description, metadata },
        ipAddress: undefined,
        userAgent: undefined
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get admin activity logs
   */
  async getAdminLogs(
    adminId: string,
    filters?: {
      action?: AdminActionType;
      targetType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    await this.verifyAdminAccess(adminId);

    const where: any = {};

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.adminAction.findMany({
      where,
      take: filters?.limit || 100,
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
  }

  /**
   * Get platform health metrics
   */
  async getPlatformHealth(adminId: string) {
    await this.verifyAdminAccess(adminId);

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      recentErrors,
      failedPayments,
      pendingVerifications,
      expiredMarkingJobs
    ] = await Promise.all([
      prisma.eventLog.count({
        where: {
          type: 'ERROR',
          timestamp: { gte: oneHourAgo }
        }
      }),
      prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: oneHourAgo }
        }
      }),
      prisma.user.count({
        where: {
          verificationStatus: 'PENDING',
          createdAt: { lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: 'EXPIRED'
        }
      })
    ]);

    return {
      status: recentErrors > 10 ? 'degraded' : 'healthy',
      metrics: {
        recentErrors,
        failedPayments,
        pendingVerifications,
        expiredMarkingJobs
      },
      timestamp: now
    };
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowth(adminId: string, days: number = 30) {
    await this.verifyAdminAccess(adminId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.groupBy({
      by: ['role'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    return {
      period: `Last ${days} days`,
      breakdown: users.map(u => ({
        role: u.role,
        count: u._count
      })),
      total: users.reduce((sum, u) => sum + u._count, 0)
    };
  }
}

export const adminService = new AdminService();










// /**
//  * File: backend/admin-service/src/services/adminService.ts
//  * Admin service with i18n support methods
//  */

// import { db } from '@newcondo/db';
// import {
//   SupportedLocale,
//   LocaleConfig,
//   CurrencyConfig,
//   I18nConfig,
// } from '@newcondo/shared/types/i18n.types';

// class AdminService {
//   /**
//    * Get platform analytics
//    */
//   async getPlatformAnalytics(params: { startDate?: Date; endDate?: Date }) {
//     const { startDate, endDate } = params;

//     const whereClause: any = {};
//     if (startDate || endDate) {
//       whereClause.createdAt = {};
//       if (startDate) whereClause.createdAt.gte = startDate;
//       if (endDate) whereClause.createdAt.lte = endDate;
//     }

//     const [
//       totalUsers,
//       totalProperties,
//       totalPayments,
//       paymentAggregates,
//       propertyAggregates,
//     ] = await Promise.all([
//       db.user.count({ where: whereClause }),
//       db.property.count({ where: whereClause }),
//       db.payment.count({ where: whereClause }),
//       db.payment.aggregate({
//         where: { ...whereClause, status: 'SUCCESS' },
//         _sum: { amount: true },
//         _avg: { amount: true },
//       }),
//       db.property.aggregate({
//         where: whereClause,
//         _avg: { price: true },
//       }),
//     ]);

//     const rentals = await db.rental.count({
//       where: { ...whereClause, status: 'ACTIVE' },
//     });

//     return {
//       totalRevenue: Number(paymentAggregates._sum.amount || 0),
//       averagePropertyPrice: Number(propertyAggregates._avg.price || 0),
//       totalUsers,
//       totalProperties,
//       totalPayments,
//       totalRentals: rentals,
//       conversionRate: totalProperties > 0 ? rentals / totalProperties : 0,
//       period: {
//         start: startDate || new Date(0),
//         end: endDate || new Date(),
//       },
//     };
//   }

//   /**
//    * Get user statistics
//    */
//   async getUserStatistics() {
//     const now = new Date();
//     const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

//     const [
//       totalUsers,
//       activeUsers,
//       newUsersThisMonth,
//       newUsersLastMonth,
//       verifiedUsers,
//       usersByRole,
//     ] = await Promise.all([
//       db.user.count(),
//       db.user.count({
//         where: {
//           sessions: {
//             some: {
//               expires: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
//             },
//           },
//         },
//       }),
//       db.user.count({
//         where: { createdAt: { gte: firstDayOfMonth } },
//       }),
//       db.user.count({
//         where: {
//           createdAt: {
//             gte: lastMonth,
//             lt: firstDayOfMonth,
//           },
//         },
//       }),
//       db.user.count({
//         where: { verificationStatus: 'VERIFIED' },
//       }),
//       db.user.groupBy({
//         by: ['role'],
//         _count: true,
//       }),
//     ]);

//     const roleStats = usersByRole.reduce(
//       (acc, { role, _count }) => ({
//         ...acc,
//         [role]: _count,
//       }),
//       {} as Record<string, number>
//     );

//     const growthRate =
//       newUsersLastMonth > 0
//         ? (newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth
//         : 0;

//     return {
//       totalUsers,
//       activeUsers,
//       newUsersThisMonth,
//       verifiedUsers,
//       usersByRole: roleStats,
//       growthRate,
//     };
//   }

//   /**
//    * Get property statistics
//    */
//   async getPropertyStatistics() {
//     const [totalProperties, byStatus, byType, byLocation, priceAggregate] =
//       await Promise.all([
//         db.property.count(),
//         db.property.groupBy({
//           by: ['status'],
//           _count: true,
//         }),
//         db.property.groupBy({
//           by: ['propertyType'],
//           _count: true,
//         }),
//         db.property.groupBy({
//           by: ['city', 'state'],
//           _count: true,
//           _avg: { price: true },
//         }),
//         db.property.aggregate({
//           _avg: { price: true },
//         }),
//       ]);

//     const statusStats = byStatus.reduce(
//       (acc, { status, _count }) => ({
//         ...acc,
//         [status]: _count,
//       }),
//       {} as Record<string, number>
//     );

//     const typeStats = byType.reduce(
//       (acc, { propertyType, _count }) => ({
//         ...acc,
//         [propertyType]: _count,
//       }),
//       {} as Record<string, number>
//     );

//     return {
//       totalProperties,
//       publishedProperties: statusStats.PUBLISHED || 0,
//       rentedProperties: statusStats.RENTED || 0,
//       pendingApproval: statusStats.PENDING || 0,
//       averagePrice: Number(priceAggregate._avg.price || 0),
//       propertyTypes: typeStats,
//       byLocation: byLocation.map((loc) => ({
//         city: loc.city,
//         state: loc.state,
//         count: loc._count,
//         averagePrice: Number(loc._avg.price || 0),
//       })),
//     };
//   }

//   /**
//    * Get payment statistics
//    */
//   async getPaymentStatistics(params: { startDate?: Date; endDate?: Date }) {
//     const { startDate, endDate } = params;

//     const whereClause: any = {};
//     if (startDate || endDate) {
//       whereClause.createdAt = {};
//       if (startDate) whereClause.createdAt.gte = startDate;
//       if (endDate) whereClause.createdAt.lte = endDate;
//     }

//     const [totalPayments, successfulPayments, failedPayments, aggregates, byMethod] =
//       await Promise.all([
//         db.payment.count({ where: whereClause }),
//         db.payment.count({ where: { ...whereClause, status: 'SUCCESS' } }),
//         db.payment.count({ where: { ...whereClause, status: 'FAILED' } }),
//         db.payment.aggregate({
//           where: { ...whereClause, status: 'SUCCESS' },
//           _sum: { amount: true, platformFee: true, agentCommission: true },
//           _avg: { amount: true },
//         }),
//         db.payment.groupBy({
//           by: ['paymentMethod'],
//           where: { ...whereClause, status: 'SUCCESS' },
//           _count: true,
//           _sum: { amount: true },
//         }),
//       ]);

//     const methodStats = byMethod.reduce(
//       (acc, { paymentMethod, _count, _sum }) => ({
//         ...acc,
//         [paymentMethod || 'unknown']: {
//           count: _count,
//           volume: Number(_sum.amount || 0),
//         },
//       }),
//       {} as Record<string, { count: number; volume: number }>
//     );

//     return {
//       totalPayments,
//       successfulPayments,
//       failedPayments,
//       totalVolume: Number(aggregates._sum.amount || 0),
//       averageTransaction: Number(aggregates._avg.amount || 0),
//       platformFees: Number(aggregates._sum.platformFee || 0),
//       agentCommissions: Number(aggregates._sum.agentCommission || 0),
//       successRate: totalPayments > 0 ? successfulPayments / totalPayments : 0,
//       paymentMethods: methodStats,
//     };
//   }

//   /**
//    * Get marking service statistics
//    */
//   async getMarkingStatistics() {
//     const [totalJobs, byStatus, aggregates, topAgents] = await Promise.all([
//       db.propertyMarkingJob.count(),
//       db.propertyMarkingJob.groupBy({
//         by: ['status'],
//         _count: true,
//       }),
//       db.propertyMarkingJob.aggregate({
//         where: { status: 'COMPLETED' },
//         _sum: { markingFee: true },
//       }),
//       db.propertyMarkingJob.groupBy({
//         by: ['assignedAgentId'],
//         where: { status: 'COMPLETED' },
//         _count: true,
//         orderBy: { _count: { assignedAgentId: 'desc' } },
//         take: 10,
//       }),
//     ]);

//     const statusStats = byStatus.reduce(
//       (acc, { status, _count }) => ({
//         ...acc,
//         [status]: _count,
//       }),
//       {} as Record<string, number>
//     );

//     // Get agent details
//     const agentIds = topAgents
//       .map((a) => a.assignedAgentId)
//       .filter((id): id is string => id !== null);
    
//     const agents = await db.user.findMany({
//       where: { id: { in: agentIds } },
//       select: {
//         id: true,
//         name: true,
//         agentReliabilityScore: true,
//       },
//     });

//     const agentMap = new Map(agents.map((a) => [a.id, a]));

//     const topAgentsWithDetails = topAgents
//       .filter((a) => a.assignedAgentId)
//       .map((a) => {
//         const agent = agentMap.get(a.assignedAgentId!);
//         return {
//           name: agent?.name || 'Unknown',
//           completedJobs: a._count,
//           earnings: (Number(aggregates._sum.markingFee) / topAgents.length) * 0.25,
//           rating: Number(agent?.agentReliabilityScore || 0),
//         };
//       });

//     return {
//       totalJobs,
//       completedJobs: statusStats.COMPLETED || 0,
//       pendingJobs: statusStats.QUEUED || 0,
//       cancelledJobs: statusStats.CANCELLED || 0,
//       totalRevenue: Number(aggregates._sum.markingFee || 0),
//       averageCompletionTime: 12, // This would be calculated from actual data
//       completionRate: totalJobs > 0 ? (statusStats.COMPLETED || 0) / totalJobs : 0,
//       topAgents: topAgentsWithDetails,
//     };
//   }

//   /**
//    * Generate analytics report
//    */
//   async generateAnalyticsReport(params: {
//     format: 'pdf' | 'csv' | 'excel';
//     startDate?: Date;
//     endDate?: Date;
//     reportType: string;
//     locale: SupportedLocale;
//   }) {
//     const { format, startDate, endDate, reportType, locale } = params;

//     // Get all required data
//     const [analytics, userStats, propertyStats, paymentStats, markingStats] =
//       await Promise.all([
//         this.getPlatformAnalytics({ startDate, endDate }),
//         this.getUserStatistics(),
//         this.getPropertyStatistics(),
//         this.getPaymentStatistics({ startDate, endDate }),
//         this.getMarkingStatistics(),
//       ]);

//     const reportData = {
//       analytics,
//       userStats,
//       propertyStats,
//       paymentStats,
//       markingStats,
//       generatedAt: new Date(),
//       locale,
//     };

//     // Generate report based on format
//     // This is a placeholder - actual implementation would use libraries like
//     // pdfkit for PDF, csv-writer for CSV, exceljs for Excel
//     const filename = `newcondo-analytics-${Date.now()}.${format}`;
//     const mimeTypes = {
//       pdf: 'application/pdf',
//       csv: 'text/csv',
//       excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     };

//     return {
//       filename,
//       mimeType: mimeTypes[format],
//       data: JSON.stringify(reportData), // Replace with actual report generation
//     };
//   }

//   /**
//    * Get system health
//    */
//   async getSystemHealth() {
//     const services = [
//       { name: 'Database', status: 'healthy', responseTime: 45 },
//       { name: 'Payment Gateway', status: 'healthy', responseTime: 120 },
//       { name: 'File Storage', status: 'healthy', responseTime: 80 },
//       { name: 'Email Service', status: 'healthy', responseTime: 200 },
//       { name: 'SMS Service', status: 'healthy', responseTime: 150 },
//     ];

//     const overallStatus = services.every((s) => s.status === 'healthy')
//       ? 'healthy'
//       : services.some((s) => s.status === 'down')
//       ? 'down'
//       : 'degraded';

//     return {
//       status: overallStatus,
//       services,
//       timestamp: new Date(),
//     };
//   }

//   /**
//    * Get admin notifications
//    */
//   async getAdminNotifications(params: {
//     page: number;
//     limit: number;
//     locale: SupportedLocale;
//   }) {
//     const { page, limit, locale } = params;
//     const skip = (page - 1) * limit;

//     // This would fetch actual notifications from database
//     // For now, returning placeholder structure
//     return {
//       notifications: [],
//       pagination: {
//         page,
//         limit,
//         total: 0,
//         pages: 0,
//       },
//       locale,
//     };
//   }

//   /**
//    * Update locale settings
//    */
//   async updateLocaleSettings(settings: {
//     supportedLocales?: SupportedLocale[];
//     defaultLocale?: SupportedLocale;
//     enabledFeatures?: string[];
//   }) {
//     // In a real implementation, this would update settings in database
//     // or configuration service
//     return {
//       ...settings,
//       updatedAt: new Date(),
//     };
//   }

//   /**
//    * Get current i18n configuration
//    */
//   async getI18nConfig(): Promise<I18nConfig> {
//     const locales: LocaleConfig[] = [
//       {
//         code: 'en',
//         name: 'English',
//         nativeName: 'English',
//         direction: 'ltr',
//         dateFormat: 'DD/MM/YYYY',
//         timeFormat: '12h',
//         isDefault: true,
//         isEnabled: true,
//       },
//       {
//         code: 'fr',
//         name: 'French',
//         nativeName: 'Français',
//         direction: 'ltr',
//         dateFormat: 'DD/MM/YYYY',
//         timeFormat: '24h',
//         isDefault: false,
//         isEnabled: true,
//       },
//       {
//         code: 'pcm',
//         name: 'Nigerian Pidgin',
//         nativeName: 'Naija Pidgin',
//         direction: 'ltr',
//         dateFormat: 'DD/MM/YYYY',
//         timeFormat: '12h',
//         isDefault: false,
//         isEnabled: true,
//       },
//     ];

//     const currencies: CurrencyConfig[] = [
//       {
//         code: 'NGN',
//         symbol: '₦',
//         name: 'Nigerian Naira',
//         decimals: 2,
//         locale: 'en-NG',
//       },
//       {
//         code: 'USD',
//         symbol: '$',
//         name: 'US Dollar',
//         decimals: 2,
//         locale: 'en-US',
//       },
//     ];

//     return {
//       supportedLocales: locales,
//       defaultLocale: 'en',
//       fallbackLocale: 'en',
//       supportedCurrencies: currencies,
//       defaultCurrency: 'NGN',
//       namespaces: [
//         'common',
//         'auth',
//         'properties',
//         'payments',
//         'marking',
//         'admin',
//         'notifications',
//         'errors',
//         'validation',
//       ],
//       cacheEnabled: true,
//       cacheTTL: 3600000, // 1 hour
//     };
//   }
// }

// export const adminService = new AdminService();