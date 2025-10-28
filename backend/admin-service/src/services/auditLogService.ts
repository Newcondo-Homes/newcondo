import { PrismaClient, AdminActionType, Prisma } from '@newcondo/db';
import { AppError } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

interface AuditLogFilters {
  adminId?: string;
  action?: AdminActionType;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface AuditLogStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByAdmin: Array<{
    adminId: string;
    adminName: string;
    actionCount: number;
  }>;
  recentActivity: number;
}

export class AuditLogService {
  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.AdminActionWhereInput = {
      ...(filters.adminId && { adminId: filters.adminId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.targetType && { targetType: filters.targetType }),
      ...(filters.targetId && { targetId: filters.targetId }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAction.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(logId: string) {
    const log = await prisma.adminAction.findUnique({
      where: { id: logId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError('Audit log not found', 404);
    }

    // Get related entity details based on targetType
    let targetDetails = null;
    try {
      switch (log.targetType) {
        case 'User':
          targetDetails = await prisma.user.findUnique({
            where: { id: log.targetId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              verificationStatus: true,
            },
          });
          break;
        case 'Property':
          targetDetails = await prisma.property.findUnique({
            where: { id: log.targetId },
            select: {
              id: true,
              title: true,
              address: true,
              status: true,
              adminApprovalStatus: true,
            },
          });
          break;
        case 'Payment':
          targetDetails = await prisma.payment.findUnique({
            where: { id: log.targetId },
            select: {
              id: true,
              amount: true,
              status: true,
              paymentType: true,
            },
          });
          break;
        case 'PropertyDuplicate':
          targetDetails = await prisma.propertyDuplicate.findUnique({
            where: { id: log.targetId },
            select: {
              id: true,
              status: true,
              originalPropertyId: true,
              duplicatePropertyId: true,
            },
          });
          break;
      }
    } catch (error) {
      // Target might have been deleted
      targetDetails = null;
    }

    return {
      ...log,
      targetDetails,
    };
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(startDate?: Date, endDate?: Date): Promise<AuditLogStats> {
    const where: Prisma.AdminActionWhereInput = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [totalActions, actionsByType, actionsByAdmin, recentActivity] = await Promise.all([
      prisma.adminAction.count({ where }),
      prisma.adminAction.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.adminAction.groupBy({
        by: ['adminId'],
        where,
        _count: true,
      }),
      prisma.adminAction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Enrich admin data
    const enrichedActionsByAdmin = await Promise.all(
      actionsByAdmin.map(async (item) => {
        const admin = await prisma.user.findUnique({
          where: { id: item.adminId },
          select: {
            id: true,
            name: true,
          },
        });

        return {
          adminId: item.adminId,
          adminName: admin?.name || 'Unknown',
          actionCount: item._count,
        };
      })
    );

    return {
      totalActions,
      actionsByType: actionsByType.reduce(
        (acc, item) => {
          acc[item.action] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      actionsByAdmin: enrichedActionsByAdmin.sort((a, b) => b.actionCount - a.actionCount),
      recentActivity,
    };
  }

  /**
   * Get activity timeline for a specific entity
   */
  async getEntityTimeline(targetType: string, targetId: string) {
    const logs = await prisma.adminAction.findMany({
      where: {
        targetType,
        targetId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      timestamp: log.createdAt,
      admin: log.admin,
      description: log.description,
      metadata: log.metadata,
    }));
  }

  /**
   * Get admin activity summary
   */
  async getAdminActivitySummary(adminId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalActions, actionsByType, recentActions, activityByDay] = await Promise.all([
      prisma.adminAction.count({
        where: {
          adminId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.adminAction.groupBy({
        by: ['action'],
        where: {
          adminId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      prisma.adminAction.findMany({
        where: {
          adminId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::INTEGER as count
        FROM "AdminAction"
        WHERE "adminId" = ${adminId}
          AND "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,
    ]);

    return {
      totalActions,
      actionsByType: actionsByType.reduce(
        (acc, item) => {
          acc[item.action] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentActions,
      activityByDay,
    };
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(
    adminId: string,
    action: AdminActionType,
    targetType: string,
    targetId: string,
    description?: string,
    metadata?: Record<string, any>
  ) {
    return prisma.adminAction.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        description,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Export audit logs to CSV format
   */
  async exportAuditLogs(filters: AuditLogFilters = {}) {
    const where: Prisma.AdminActionWhereInput = {
      ...(filters.adminId && { adminId: filters.adminId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.targetType && { targetType: filters.targetType }),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    const logs = await prisma.adminAction.findMany({
      where,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format for CSV
    const csvData = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      admin: log.admin.name,
      adminEmail: log.admin.email,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      description: log.description || '',
      metadata: JSON.stringify(log.metadata),
    }));

    return csvData;
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(searchTerm: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Search in description and metadata
    const logs = await prisma.$queryRaw<Array<any>>`
      SELECT a.*, 
             json_build_object(
               'id', u.id,
               'name', u.name,
               'email', u.email,
               'role', u.role
             ) as admin
      FROM "AdminAction" a
      JOIN "User" u ON a."adminId" = u.id
      WHERE 
        a.description ILIKE ${`%${searchTerm}%`}
        OR a."targetId" ILIKE ${`%${searchTerm}%`}
        OR a.metadata::text ILIKE ${`%${searchTerm}%`}
      ORDER BY a."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const total = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "AdminAction" a
      WHERE 
        a.description ILIKE ${`%${searchTerm}%`}
        OR a."targetId" ILIKE ${`%${searchTerm}%`}
        OR a.metadata::text ILIKE ${`%${searchTerm}%`}
    `;

    return {
      logs,
      pagination: {
        total: Number(total[0].count),
        page,
        limit,
        totalPages: Math.ceil(Number(total[0].count) / limit),
      },
    };
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(startDate: Date, endDate: Date) {
    const sensitiveActions = [
      AdminActionType.USER_VERIFIED,
      AdminActionType.USER_REJECTED,
      AdminActionType.PROPERTY_REJECTED,
      AdminActionType.PAYMENT_REFUNDED,
    ];

    const [totalSensitiveActions, actionBreakdown, adminBreakdown] = await Promise.all([
      prisma.adminAction.count({
        where: {
          action: { in: sensitiveActions },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.adminAction.groupBy({
        by: ['action'],
        where: {
          action: { in: sensitiveActions },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
      prisma.adminAction.groupBy({
        by: ['adminId'],
        where: {
          action: { in: sensitiveActions },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),
    ]);

    // Enrich admin data
    const enrichedAdminBreakdown = await Promise.all(
      adminBreakdown.map(async (item) => {
        const admin = await prisma.user.findUnique({
          where: { id: item.adminId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          admin,
          actionCount: item._count,
        };
      })
    );

    return {
      period: { startDate, endDate },
      totalSensitiveActions,
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      adminBreakdown: enrichedAdminBreakdown,
    };
  }
}

export const auditLogService = new AuditLogService();