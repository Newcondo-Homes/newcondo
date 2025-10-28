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