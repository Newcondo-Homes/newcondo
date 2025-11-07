import { PrismaClient, Role, VerificationStatus } from '@newcondo/db';

const prisma = new PrismaClient();

interface GetUsersParams {
  page: number;
  limit: number;
  role?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  registeredAfter?: Date;
  registeredBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
}

interface UserActivityParams {
  userId: string;
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
}

interface UpdateUserStatusParams {
  userId: string;
  status: string;
  reason: string;
  adminId: string;
}

interface UserStatsParams {
  startDate?: Date;
  endDate?: Date;
}

interface InactiveUsersParams {
  days: number;
  page: number;
  limit: number;
}

interface BulkOperationParams {
  userIds: string[];
  operation: string;
  data: any;
  adminId: string;
}

interface CohortAnalysisParams {
  startDate?: Date;
  endDate?: Date;
  groupBy: 'week' | 'month';
}

class UserManagementService {
  /**
   * Get all users with advanced filtering
   */
  async getUsers(params: GetUsersParams) {
    const {
      page,
      limit,
      role,
      verificationStatus,
      isPremium,
      search,
      sortBy,
      sortOrder,
      registeredAfter,
      registeredBefore,
      lastActiveAfter,
      lastActiveBefore,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role as Role;
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus as VerificationStatus;
    }

    if (isPremium !== undefined) {
      where.isPremium = isPremium;
    }

    if (registeredAfter || registeredBefore) {
      where.createdAt = {};
      if (registeredAfter) where.createdAt.gte = registeredAfter;
      if (registeredBefore) where.createdAt.lte = registeredBefore;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle last active filtering
    if (lastActiveAfter || lastActiveBefore) {
      // Get users with event logs in the specified range
      const eventWhere: any = {};
      if (lastActiveAfter || lastActiveBefore) {
        eventWhere.timestamp = {};
        if (lastActiveAfter) eventWhere.timestamp.gte = lastActiveAfter;
        if (lastActiveBefore) eventWhere.timestamp.lte = lastActiveBefore;
      }

      const activeUserIds = await prisma.eventLog.findMany({
        where: eventWhere,
        select: { userId: true },
        distinct: ['userId'],
      });

      where.id = { in: activeUserIds.map((u) => u.userId!).filter(Boolean) };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          properties: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          virtualAccounts: {
            select: {
              id: true,
              balance: true,
            },
          },
          _count: {
            select: {
              properties: true,
              agentListings: true,
              rentals: true,
              payments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get last activity for each user
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const lastActivity = await prisma.eventLog.findFirst({
          where: { userId: user.id },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true, type: true },
        });

        return {
          ...user,
          lastActivity,
        };
      })
    );

    return {
      users: usersWithActivity,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user detailed profile
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          include: {
            _count: {
              select: {
                rentals: true,
              },
            },
          },
        },
        agentListings: true,
        rentals: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        virtualAccounts: true,
        documents: true,
        assignedMarkingJobs: {
          where: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        },
        requestedMarkingJobs: true,
      },
    });

    if (!user) {
      return null;
    }

    // Get activity summary
    const activitySummary = await this.getUserActivitySummary(userId);

    // Get earnings (for agents/owners)
    const earnings = await this.getUserEarnings(userId);

    return {
      ...user,
      activitySummary,
      earnings,
    };
  }

  /**
   * Get user activity history
   */
  async getUserActivity(params: UserActivityParams) {
    const { userId, page, limit, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [activities, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.eventLog.count({ where }),
    ]);

    // Group activities by type
    const activityTypes = await prisma.eventLog.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });

    return {
      activities,
      activityTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user status (suspend/activate)
   */
  async updateUserStatus(params: UpdateUserStatusParams) {
    const { userId, status, reason, adminId } = params;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Add status field to User model if needed
        updatedAt: new Date(),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
        targetType: 'User',
        targetId: userId,
        description: reason,
        metadata: {
          previousStatus: 'active',
          newStatus: status,
        },
      },
    });

    // TODO: Send notification to user

    return updatedUser;
  }

  /**
   * Get user statistics
   */
  async getUserStats(params: UserStatsParams) {
    const { startDate, endDate } = params;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalUsers,
      usersByRole,
      verifiedUsers,
      premiumUsers,
      averagePropertiesPerOwner,
      averageListingsPerAgent,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      }),
      prisma.user.count({
        where: { ...where, verificationStatus: 'VERIFIED' },
      }),
      prisma.user.count({
        where: { ...where, isPremium: true },
      }),
      this.getAveragePropertiesPerOwner(where),
      this.getAverageListingsPerAgent(where),
    ]);

    return {
      totalUsers,
      usersByRole,
      verifiedUsers,
      premiumUsers,
      verificationRate: (verifiedUsers / totalUsers) * 100,
      premiumRate: (premiumUsers / totalUsers) * 100,
      averagePropertiesPerOwner,
      averageListingsPerAgent,
    };
  }

  /**
   * Get inactive users
   */
  async getInactiveUsers(params: InactiveUsersParams) {
    const { days, page, limit } = params;
    const skip = (page - 1) * limit;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get users who haven't had any activity since cutoff date
    const activeUserIds = await prisma.eventLog.findMany({
      where: {
        timestamp: { gte: cutoffDate },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeIds = activeUserIds.map((u) => u.userId).filter(Boolean);

    const [inactiveUsers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { notIn: activeIds as string[] },
          createdAt: { lte: cutoffDate },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              properties: true,
              rentals: true,
              payments: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          id: { notIn: activeIds as string[] },
          createdAt: { lte: cutoffDate },
        },
      }),
    ]);

    // Get last activity for each inactive user
    const usersWithLastActivity = await Promise.all(
      inactiveUsers.map(async (user) => {
        const lastActivity = await prisma.eventLog.findFirst({
          where: { userId: user.id },
          orderBy: { timestamp: 'desc' },
        });

        return {
          ...user,
          lastActivity,
          inactiveDays: lastActivity
            ? Math.floor((Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        };
      })
    );

    return {
      users: usersWithLastActivity,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Bulk user operations
   */
  async bulkUserOperation(params: BulkOperationParams) {
    const { userIds, operation, data, adminId } = params;

    let result;

    switch (operation) {
      case 'verify':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedBy: adminId,
          },
        });
        break;

      case 'suspend':
        // Implement suspension logic
        result = { count: userIds.length };
        break;

      case 'activate':
        // Implement activation logic
        result = { count: userIds.length };
        break;

      case 'delete':
        result = await prisma.userresult = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
        break;

      case 'grantPremium':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            isPremium: true,
            premiumExpiresAt: data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
        break;

      case 'revokePremium':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            isPremium: false,
            premiumExpiresAt: null,
          },
        });
        break;

      default:
        throw new Error('Invalid bulk operation');
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'BULK_USER_OPERATION',
        targetType: 'User',
        targetId: userIds.join(','),
        description: `Bulk operation: ${operation}`,
        metadata: {
          operation,
          userCount: userIds.length,
          data,
        },
      },
    });

    return {
      success: true,
      affectedUsers: result.count || userIds.length,
      operation,
    };
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(params: CohortAnalysisParams) {
    const { startDate, endDate, groupBy } = params;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get all users in the date range
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Group users by cohort (week/month of registration)
    const cohorts: { [key: string]: string[] } = {};

    users.forEach((user) => {
      const cohortKey = this.getCohortKey(user.createdAt, groupBy);
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = [];
      }
      cohorts[cohortKey].push(user.id);
    });

    // Calculate retention for each cohort
    const cohortAnalysis = await Promise.all(
      Object.entries(cohorts).map(async ([cohortKey, userIds]) => {
        const retention = await this.calculateCohortRetention(userIds, cohortKey, groupBy);
        return {
          cohort: cohortKey,
          size: userIds.length,
          retention,
        };
      })
    );

    return cohortAnalysis.sort((a, b) => a.cohort.localeCompare(b.cohort));
  }

  // Helper methods
  private async getUserActivitySummary(userId: string) {
    const [totalEvents, eventsByType, recentActivity] = await Promise.all([
      prisma.eventLog.count({ where: { userId } }),
      prisma.eventLog.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
      prisma.eventLog.findFirst({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      totalEvents,
      eventsByType,
      lastActivity: recentActivity?.timestamp,
      lastActivityType: recentActivity?.type,
    };
  }

  private async getUserEarnings(userId: string) {
    // Get total earnings from properties owned
    const ownerEarnings = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        rental: {
          property: {
            ownerId: userId,
          },
        },
      },
      _sum: {
        ownerAmount: true,
      },
    });

    // Get total commission earnings (if agent)
    const agentEarnings = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        rental: {
          property: {
            agentId: userId,
          },
        },
      },
      _sum: {
        agentCommission: true,
      },
    });

    // Get marking job earnings
    const markingEarnings = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        paymentType: 'PROPERTY_MARKING',
        markingJobId: {
          in: (
            await prisma.propertyMarkingJob.findMany({
              where: { assignedAgentId: userId },
              select: { id: true },
            })
          ).map((job) => job.id),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      ownerEarnings: ownerEarnings._sum.ownerAmount || 0,
      agentCommissions: agentEarnings._sum.agentCommission || 0,
      markingEarnings: Number(markingEarnings._sum.amount || 0) * 0.25, // Agent gets 25%
      totalEarnings:
        Number(ownerEarnings._sum.ownerAmount || 0) +
        Number(agentEarnings._sum.agentCommission || 0) +
        Number(markingEarnings._sum.amount || 0) * 0.25,
    };
  }

  private async getAveragePropertiesPerOwner(where: any) {
    const owners = await prisma.user.findMany({
      where: { ...where, role: 'OWNER' },
      include: {
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (owners.length === 0) return 0;

    const totalProperties = owners.reduce((sum, owner) => sum + owner._count.properties, 0);
    return totalProperties / owners.length;
  }

  private async getAverageListingsPerAgent(where: any) {
    const agents = await prisma.user.findMany({
      where: { ...where, role: 'AGENT' },
      include: {
        _count: {
          select: {
            agentListings: true,
          },
        },
      },
    });

    if (agents.length === 0) return 0;

    const totalListings = agents.reduce((sum, agent) => sum + agent._count.agentListings, 0);
    return totalListings / agents.length;
  }

  private getCohortKey(date: Date, groupBy: 'week' | 'month'): string {
    if (groupBy === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Week-based cohort
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    }
  }

  private async calculateCohortRetention(
    userIds: string[],
    cohortKey: string,
    groupBy: 'week' | 'month'
  ) {
    const cohortDate = groupBy === 'month' 
      ? new Date(cohortKey + '-01')
      : new Date(cohortKey);

    // Calculate retention for subsequent periods (up to 12 periods)
    const retentionPeriods = 12;
    const retention: { [key: number]: number } = {};

    for (let i = 0; i <= retentionPeriods; i++) {
      const periodStart = new Date(cohortDate);
      const periodEnd = new Date(cohortDate);

      if (groupBy === 'month') {
        periodStart.setMonth(periodStart.getMonth() + i);
        periodEnd.setMonth(periodEnd.getMonth() + i + 1);
      } else {
        periodStart.setDate(periodStart.getDate() + i * 7);
        periodEnd.setDate(periodEnd.getDate() + (i + 1) * 7);
      }

      // Count active users in this period
      const activeUsers = await prisma.eventLog.findMany({
        where: {
          userId: { in: userIds },
          timestamp: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      retention[i] = (activeUsers.length / userIds.length) * 100;
    }

    return retention;
  }
}

export const userManagementService = new UserManagementService();