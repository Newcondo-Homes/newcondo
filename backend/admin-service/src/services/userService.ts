// backend/admin-service/src/services/userService.ts

import { PrismaClient, Role, AdminActionType } from '@newcondo/db';
import { adminService } from './adminService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface UserFilters {
  role?: Role;
  verificationStatus?: string;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
  state?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role?: Role;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
  isAvailableForMarking?: boolean;
  agentServiceAreas?: string[];
}

class UserService {
  /**
   * Get all users with filters and pagination
   */
  async getUsers(adminId: string, filters: UserFilters = {}) {
    await adminService.verifyAdminAccess(adminId);

    const {
      role,
      verificationStatus,
      isPremium,
      isB2BCustomer,
      state,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = filters;

    const where: any = {};

    if (role) where.role = role;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (isPremium !== undefined) where.isPremium = isPremium;
    if (isB2BCustomer !== undefined) where.isB2BCustomer = isB2BCustomer;
    if (state) where.state = state;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          userType: true,
          verificationStatus: true,
          isPremium: true,
          isB2BCustomer: true,
          companyName: true,
          state: true,
          city: true,
          isAvailableForMarking: true,
          agentReliabilityScore: true,
          totalMarkingJobs: true,
          completedMarkingJobs: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              rentals: true,
              assignedMarkingJobs: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed user information
   */
  async getUserDetails(adminId: string, userId: string) {
    await adminService.verifyAdminAccess(adminId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
            adminApprovalStatus: true,
            price: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        agentListings: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        },
        rentals: {
          select: {
            id: true,
            property: {
              select: {
                title: true,
                address: true
              }
            },
            status: true,
            monthlyRent: true,
            startDate: true,
            endDate: true
          },
          orderBy: { createdAt: 'desc' }
        },
        virtualAccounts: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            balance: true,
            isActive: true
          }
        },
        assignedMarkingJobs: {
          select: {
            id: true,
            status: true,
            markingFee: true,
            createdAt: true,
            completedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        requestedMarkingJobs: {
          select: {
            id: true,
            status: true,
            markingFee: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentType: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        referrals: {
          select: {
            id: true,
            referralCode: true,
            reward: true,
            rewardPaid: true,
            createdAt: true
          }
        },
        referredBy: {
          select: {
            referrer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate user statistics
    const stats = {
      totalProperties: user.properties.length,
      activeProperties: user.properties.filter(p => p.status === 'PUBLISHED').length,
      totalRentals: user.rentals.length,
      activeRentals: user.rentals.filter(r => r.status === 'ACTIVE').length,
      totalMarkingJobs: user.totalMarkingJobs,
      completedMarkingJobs: user.completedMarkingJobs,
      completionRate: user.totalMarkingJobs > 0 
        ? (user.completedMarkingJobs / user.totalMarkingJobs) * 100 
        : 0,
      totalEarnings: user.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    };

    return { user, stats };
  }

  /**
   * Update user information
   */
  async updateUser(adminId: string, userId: string, data: UserUpdateData) {
    await adminService.verifyAdminAccess(adminId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    // Log action
    await adminService.logAction(
      adminId,
      AdminActionType.USER_VERIFIED,
      'User',
      userId,
      'User information updated',
      { updates: data }
    );

    return user;
  }

  /**
   * Suspend user account
   */
  async suspendUser(adminId: string, userId: string, reason: string) {
    await adminService.verifyAdminAccess(adminId);

    // Update user - set properties to unavailable, mark as suspended
    await prisma.$transaction([
      // Update user's properties to unavailable
      prisma.property.updateMany({
        where: { ownerId: userId },
        data: { isAvailable: false }
      }),
      // Remove agent from available marking pool
      prisma.user.update({
        where: { id: userId },
        data: {
          isAvailableForMarking: false
        }
      })
    ]);

    // Log action
    await adminService.logAction(
      adminId,
      AdminActionType.AGENT_SUSPENDED,
      'User',
      userId,
      `User suspended: ${reason}`,
      { reason }
    );

    // Get user for notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (user?.email) {
      await notificationService.sendAccountSuspension({
        userId,
        email: user.email,
        name: user.name || 'User',
        reason
      });
    }

    return { success: true };
  }

  /**
   * Reactivate suspended user
   */
  async reactivateUser(adminId: string, userId: string) {
    await adminService.verifyAdminAccess(adminId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, name: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Reactivate user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAvailableForMarking: user.role === Role.AGENT
      }
    });

    // Log action
    await adminService.logAction(
      adminId,
      AdminActionType.USER_VERIFIED,
      'User',
      userId,
      'User account reactivated'
    );

    if (user.email) {
      await notificationService.sendAccountReactivation({
        userId,
        email: user.email,
        name: user.name || 'User'
      });
    }

    return { success: true };
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteUser(adminId: string, userId: string, reason: string) {
    await adminService.verifyAdminAccess(adminId);

    // In a real app, implement soft delete
    // For now, we'll just suspend and log
    await this.suspendUser(adminId, userId, `Account deleted: ${reason}`);

    await adminService.logAction(
      adminId,
      AdminActionType.USER_REJECTED,
      'User',
      userId,
      `User account deleted: ${reason}`,
      { reason }
    );

    return { success: true };
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(adminId: string, userId: string, limit: number = 50) {
    await adminService.verifyAdminAccess(adminId);

    const logs = await prisma.eventLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    return logs;
  }

  /**
   * Get user statistics by role
   */
  async getUserStatsByRole(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const statsByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
      _avg: {
        agentReliabilityScore: true
      }
    });

    const verifiedByRole = await prisma.user.groupBy({
      by: ['role', 'verificationStatus'],
      _count: true
    });

    return {
      byRole: statsByRole.map(stat => ({
        role: stat.role,
        count: stat._count,
        avgReliabilityScore: stat._avg.agentReliabilityScore
      })),
      verificationStatus: verifiedByRole
    };
  }

  /**
   * Batch update user roles
   */
  async batchUpdateUserRoles(
    adminId: string,
    updates: Array<{ userId: string; role: Role }>
  ) {
    await adminService.verifyAdminAccess(adminId);

    const results = await Promise.allSettled(
      updates.map(({ userId, role }) =>
        prisma.user.update({
          where: { id: userId },
          data: { role }
        })
      )
    );

    // Log actions
    for (const update of updates) {
      await adminService.logAction(
        adminId,
        AdminActionType.USER_VERIFIED,
        'User',
        update.userId,
        `User role updated to ${update.role}`
      );
    }

    return {
      total: updates.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  /**
   * Search users
   */
  async searchUsers(adminId: string, query: string, limit: number = 20) {
    await adminService.verifyAdminAccess(adminId);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        verificationStatus: true,
        companyName: true
      }
    });

    return users;
  }
}

export const userService = new UserService();