// backend/admin-service/src/services/verificationService.ts

import { PrismaClient, VerificationStatus, AdminActionType, DocumentType, DocumentStatus } from '@newcondo/db';
import { adminService } from './adminService';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface VerificationFilters {
  status?: VerificationStatus;
  role?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

interface VerificationDecision {
  userId: string;
  status: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  adminId: string;
  documentNotes?: string;
}

class VerificationService {
  /**
   * Get pending user verifications with pagination
   */
  async getPendingVerifications(adminId: string, filters: VerificationFilters = {}) {
    await adminService.verifyAdminAccess(adminId);

    const {
      status = 'PENDING',
      role,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20
    } = filters;

    const where: any = {
      verificationStatus: status
    };

    if (role) {
      where.role = role;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          documents: {
            where: {
              documentType: {
                in: [
                  DocumentType.NIN,
                  DocumentType.BVN,
                  DocumentType.PASSPORT,
                  DocumentType.VOTERS_CARD,
                  DocumentType.DRIVERS_LICENSE,
                  DocumentType.SELFIE
                ]
              }
            }
          },
          properties: {
            where: { status: { not: 'DRAFT' } },
            select: { id: true, title: true, status: true }
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
   * Get user verification details
   */
  async getUserVerificationDetails(adminId: string, userId: string) {
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
            createdAt: true
          }
        },
        rentals: {
          select: {
            id: true,
            property: {
              select: { title: true }
            },
            status: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Group documents by type
    const documentsByType = user.documents.reduce((acc, doc) => {
      if (!acc[doc.documentType]) {
        acc[doc.documentType] = [];
      }
      acc[doc.documentType].push(doc);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        verificationRejectionReason: user.verificationRejectionReason,
        verifiedAt: user.verifiedAt,
        verifiedBy: user.verifiedBy,
        createdAt: user.createdAt,
        // B2B fields
        isB2BCustomer: user.isB2BCustomer,
        companyName: user.companyName,
        businessRegNumber: user.businessRegNumber
      },
      documents: documentsByType,
      activitySummary: {
        totalProperties: user.properties.length,
        totalRentals: user.rentals.length,
        pendingProperties: user.properties.filter(p => p.adminApprovalStatus === 'PENDING').length
      }
    };
  }

  /**
   * Verify or reject user
   */
  async processVerification(decision: VerificationDecision) {
    const { userId, status, rejectionReason, adminId, documentNotes } = decision;

    // Verify admin access
    await adminService.verifyAdminAccess(adminId);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.verificationStatus !== 'PENDING') {
      throw new Error('User verification is not pending');
    }

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: status,
        verificationRejectionReason: status === 'REJECTED' ? rejectionReason : null,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: adminId
      }
    });

    // Update document statuses
    if (status === 'VERIFIED') {
      await prisma.document.updateMany({
        where: {
          userId,
          status: 'PENDING'
        },
        data: {
          status: DocumentStatus.APPROVED,
          verificationNotes: documentNotes
        }
      });
    } else {
      await prisma.document.updateMany({
        where: {
          userId,
          status: 'PENDING'
        },
        data: {
          status: DocumentStatus.REJECTED,
          verificationNotes: documentNotes || rejectionReason
        }
      });
    }

    // Log admin action
    await adminService.logAction(
      adminId,
      status === 'VERIFIED' ? AdminActionType.USER_VERIFIED : AdminActionType.USER_REJECTED,
      'User',
      userId,
      `User verification ${status.toLowerCase()}`,
      { rejectionReason, documentNotes }
    );

    // Send notification to user
    await notificationService.sendVerificationDecision({
      userId,
      email: user.email!,
      name: user.name || 'User',
      status,
      rejectionReason
    });

    return updatedUser;
  }

  /**
   * Bulk verify users
   */
  async bulkVerifyUsers(adminId: string, userIds: string[]) {
    await adminService.verifyAdminAccess(adminId);

    const results = await Promise.allSettled(
      userIds.map(userId =>
        this.processVerification({
          userId,
          status: 'VERIFIED',
          adminId
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: userIds.length,
      successful,
      failed,
      details: results
    };
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(adminId: string) {
    await adminService.verifyAdminAccess(adminId);

    const [pending, verified, rejected, avgVerificationTime] = await Promise.all([
      prisma.user.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.user.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.user.count({ where: { verificationStatus: 'REJECTED' } }),
      this.getAverageVerificationTime()
    ]);

    // Get pending by role
    const pendingByRole = await prisma.user.groupBy({
      by: ['role'],
      where: { verificationStatus: 'PENDING' },
      _count: true
    });

    return {
      counts: {
        pending,
        verified,
        rejected,
        total: pending + verified + rejected
      },
      pendingByRole: pendingByRole.map(p => ({
        role: p.role,
        count: p._count
      })),
      avgVerificationTime: avgVerificationTime || 0
    };
  }

  /**
   * Calculate average verification time
   */
  private async getAverageVerificationTime(): Promise<number | null> {
    const verifiedUsers = await prisma.user.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        verifiedAt: { not: null }
      },
      select: {
        createdAt: true,
        verifiedAt: true
      },
      take: 100,
      orderBy: { verifiedAt: 'desc' }
    });

    if (verifiedUsers.length === 0) return null;

    const totalTime = verifiedUsers.reduce((sum, user) => {
      const timeDiff = user.verifiedAt!.getTime() - user.createdAt.getTime();
      return sum + timeDiff;
    }, 0);

    // Return average in hours
    return totalTime / verifiedUsers.length / (1000 * 60 * 60);
  }

  /**
   * Re-request verification documents
   */
  async requestAdditionalDocuments(
    adminId: string,
    userId: string,
    documentTypes: DocumentType[],
    message: string
  ) {
    await adminService.verifyAdminAccess(adminId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Log action
    await adminService.logAction(
      adminId,
      AdminActionType.USER_REJECTED,
      'User',
      userId,
      'Additional documents requested',
      { documentTypes, message }
    );

    // Send notification
    await notificationService.sendDocumentRequest({
      userId,
      email: user.email!,
      name: user.name || 'User',
      documentTypes,
      message
    });

    return { success: true };
  }

  /**
   * Get verification history for a user
   */
  async getVerificationHistory(adminId: string, userId: string) {
    await adminService.verifyAdminAccess(adminId);

    const actions = await prisma.adminAction.findMany({
      where: {
        targetType: 'User',
        targetId: userId,
        action: {
          in: [AdminActionType.USER_VERIFIED, AdminActionType.USER_REJECTED]
        }
      },
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

    return actions;
  }
}

export const verificationService = new VerificationService();