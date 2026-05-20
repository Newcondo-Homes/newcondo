// backend/admin-service/src/controllers/verificationController.ts

import { Request, Response } from 'express';
import { PrismaClient, DocumentStatus } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class VerificationController {
  // Get pending verifications
  async getPendingVerifications(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        userType,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        verificationStatus: 'PENDING'
      };

      if (userType) {
        where.userType = userType;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: order },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            verificationStatus: true,
            createdAt: true,
            documents: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      return successResponse(res, {
        verifications: users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Pending verifications retrieved successfully');
    } catch (error) {
      console.error('Get pending verifications error:', error);
      return errorResponse(res, 'Failed to retrieve pending verifications', 500);
    }
  }

  // Get verification details
  async getVerificationDetails(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      return successResponse(res, user, 'Verification details retrieved successfully');
    } catch (error) {
      console.error('Get verification details error:', error);
      return errorResponse(res, 'Failed to retrieve verification details', 500);
    }
  }

  // Verify user documents
  async verifyUser(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { userId } = req.params;
      const { documentIds, notes } = req.body;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          documents: {
            where: {
              id: { in: documentIds }
            }
          }
        }
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.verificationStatus !== 'PENDING') {
        return errorResponse(res, 'User verification is not pending', 400);
      }

      // Update user and documents
      const [updatedUser] = await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: {
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        }),
        prisma.document.updateMany({
          where: {
            id: { in: documentIds }
          },
          data: {
            status: 'APPROVED',
            verificationNotes: notes
          }
        })
      ]);

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'USER_VERIFIED',
        'User',
        userId,
        `Verified user: ${user.name || user.email}`,
        { documentIds, notes }
      );

      // TODO: Send notification to user

      return successResponse(res, updatedUser, 'User verified successfully');
    } catch (error) {
      console.error('Verify user error:', error);
      return errorResponse(res, 'Failed to verify user', 500);
    }
  }

  // Reject user verification
  async rejectUser(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { userId } = req.params;
      const { reason, documentIds } = req.body;

      if (!reason) {
        return errorResponse(res, 'Rejection reason is required', 400);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      if (user.verificationStatus !== 'PENDING') {
        return errorResponse(res, 'User verification is not pending', 400);
      }

      // Update user and documents
      const [updatedUser] = await Promise.all([
        prisma.user.update({
          where: { id: userId },
          data: {
            verificationStatus: 'REJECTED',
            verificationRejectionReason: reason,
            verifiedBy: adminId
          }
        }),
        prisma.document.updateMany({
          where: {
            id: { in: documentIds }
          },
          data: {
            status: 'REJECTED',
            verificationNotes: reason
          }
        })
      ]);

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'USER_REJECTED',
        'User',
        userId,
        `Rejected user: ${user.name || user.email}`,
        { reason, documentIds }
      );

      // TODO: Send notification to user

      return successResponse(res, updatedUser, 'User verification rejected');
    } catch (error) {
      console.error('Reject user error:', error);
      return errorResponse(res, 'Failed to reject user verification', 500);
    }
  }

  // Verify individual document
  async verifyDocument(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { documentId } = req.params;
      const { status, notes } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return errorResponse(res, 'Invalid status. Must be APPROVED or REJECTED', 400);
      }

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!document) {
        return errorResponse(res, 'Document not found', 404);
      }

      // Update document
      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          status: status as DocumentStatus,
          verificationNotes: notes
        }
      });

      // Check if all user documents are verified
      const userDocuments = await prisma.document.findMany({
        where: {
          userId: document.userId,
          isRequired: true
        }
      });

      const allApproved = userDocuments.every(doc => 
        doc.id === documentId ? status === 'APPROVED' : doc.status === 'APPROVED'
      );

      // Update user verification status if all documents are approved
      if (allApproved) {
        await prisma.user.update({
          where: { id: document.userId },
          data: {
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedBy: adminId
          }
        });
      }

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        status === 'APPROVED' ? 'USER_VERIFIED' : 'USER_REJECTED',
        'Document',
        documentId,
        `${status} document for user: ${document.user.name || document.user.email}`,
        { documentType: document.documentType, notes }
      );

      return successResponse(res, updatedDocument, `Document ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Verify document error:', error);
      return errorResponse(res, 'Failed to verify document', 500);
    }
  }

  // Get verification statistics
  async getVerificationStatistics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range
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
        documentTypeBreakdown,
        verificationTrend
      ] = await Promise.all([
        prisma.user.groupBy({
          by: ['verificationStatus'],
          _count: { verificationStatus: true }
        }),
        prisma.document.groupBy({
          by: ['documentType', 'status'],
          _count: { documentType: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.user.findMany({
          where: {
            verifiedAt: {
              gte: startDate,
              lte: endDate
            },
            verificationStatus: 'VERIFIED'
          },
          select: {
            verifiedAt: true
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          statusBreakdown,
          documentTypeBreakdown,
          verificationTrend
        }
      }, 'Verification statistics retrieved successfully');
    } catch (error) {
      console.error('Get verification statistics error:', error);
      return errorResponse(res, 'Failed to retrieve verification statistics', 500);
    }
  }
}

export const verificationController = new VerificationController();