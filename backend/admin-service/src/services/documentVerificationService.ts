// backend/admin-service/src/services/documentVerificationService.ts

import { PrismaClient, DocumentType, DocumentStatus, Document, User, VerificationStatus } from '@newcondo/db';
import { ApiResponse, ApiError } from '../../../shared/src/types/api';
import { logger } from '../../../shared/src/middleware/logger';
import { sendEmail } from '../../../shared/src/utils/email';
import { sendSMS } from '../../../shared/src/utils/sms';

export interface VerificationRequest {
  documentId: string;
  adminId: string;
  status: DocumentStatus.APPROVED | DocumentStatus.REJECTED;
  notes?: string;
  requiresFollowUp?: boolean;
  followUpDeadline?: Date;
}

export interface BulkVerificationRequest {
  documentIds: string[];
  adminId: string;
  status: DocumentStatus.APPROVED | DocumentStatus.REJECTED;
  notes?: string;
}

export interface VerificationQueue {
  pending: Document[];
  inReview: Document[];
  requiresFollowUp: Document[];
  total: number;
}

export interface VerificationMetrics {
  totalProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  avgProcessingTime: number; // in hours
  pendingCount: number;
  verificationsByType: Record<DocumentType, {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
}

export interface AdminPerformanceMetrics {
  adminId: string;
  adminName: string;
  totalVerifications: number;
  approvedCount: number;
  rejectedCount: number;
  avgProcessingTime: number;
  accuracyScore?: number; // Based on appeals/reversals
}

class DocumentVerificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get documents in verification queue
   */
  async getVerificationQueue(adminId?: string): Promise<ApiResponse<VerificationQueue>> {
    try {
      const baseQuery = {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc' as const
        }
      };

      const [pending, requiresFollowUp] = await Promise.all([
        this.prisma.document.findMany({
          where: {
            status: DocumentStatus.PENDING
          },
          ...baseQuery
        }),
        this.prisma.document.findMany({
          where: {
            status: DocumentStatus.REJECTED,
            verificationNotes: {
              contains: 'FOLLOW_UP_REQUIRED'
            }
          },
          ...baseQuery
        })
      ]);

      const queue: VerificationQueue = {
        pending,
        inReview: [], // Could be implemented with a separate status
        requiresFollowUp,
        total: pending.length + requiresFollowUp.length
      };

      return {
        success: true,
        data: queue
      };
    } catch (error) {
      logger.error('Error fetching verification queue', error);
      throw new ApiError('Failed to fetch verification queue', 500);
    }
  }

  /**
   * Verify a single document
   */
  async verifyDocument(request: VerificationRequest): Promise<ApiResponse<Document>> {
    try {
      const { documentId, adminId, status, notes, requiresFollowUp, followUpDeadline } = request;

      // Get document with user details
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          user: true,
          property: {
            select: {
              id: true,
              title: true,
              address: true
            }
          }
        }
      });

      if (!document) {
        throw new ApiError('Document not found', 404);
      }

      if (document.status !== DocumentStatus.PENDING) {
        throw new ApiError('Document has already been processed', 400);
      }

      // Prepare verification notes
      let verificationNotes = notes || '';
      if (requiresFollowUp) {
        verificationNotes += ' [FOLLOW_UP_REQUIRED]';
      }

      // Update document status
      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status,
          verificationNotes
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          property: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      // Log admin action
      await this.prisma.adminAction.create({
        data: {
          adminId,
          action: status === DocumentStatus.APPROVED ? 'USER_VERIFIED' : 'USER_REJECTED',
          targetType: 'Document',
          targetId: documentId,
          description: `Document verification: ${status}`,
          metadata: {
            documentType: document.documentType,
            userId: document.userId,
            propertyId: document.propertyId,
            notes: verificationNotes,
            requiresFollowUp
          }
        }
      });

      // Check if user verification status should be updated
      await this.updateUserVerificationStatus(document.userId);

      // Send notification to user
      await this.sendVerificationNotification(document.user, updatedDocument, status);

      logger.info('Document verified', {
        documentId,
        status,
        adminId,
        userId: document.userId
      });

      return {
        success: true,
        data: updatedDocument,
        message: `Document ${status.toLowerCase()} successfully`
      };
    } catch (error) {
      logger.error('Error verifying document', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to verify document', 500);
    }
  }

  /**
   * Bulk verify documents
   */
  async bulkVerifyDocuments(request: BulkVerificationRequest): Promise<ApiResponse<{
    processed: number;
    failed: number;
    results: Array<{ documentId: string; success: boolean; error?: string }>
  }>> {
    try {
      const { documentIds, adminId, status, notes } = request;
      const results: Array<{ documentId: string; success: boolean; error?: string }> = [];
      let processed = 0;
      let failed = 0;

      for (const documentId of documentIds) {
        try {
          await this.verifyDocument({
            documentId,
            adminId,
            status,
            notes
          });
          
          results.push({ documentId, success: true });
          processed++;
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : 'Unknown error';
          results.push({ documentId, success: false, error: errorMessage });
          failed++;
          
          logger.error('Failed to verify document in bulk operation', {
            documentId,
            error: errorMessage
          });
        }
      }

      return {
        success: true,
        data: {
          processed,
          failed,
          results
        },
        message: `Bulk verification completed. ${processed} processed, ${failed} failed.`
      };
    } catch (error) {
      logger.error('Error in bulk document verification', error);
      throw new ApiError('Failed to perform bulk verification', 500);
    }
  }

  /**
   * Get verification metrics
   */
  async getVerificationMetrics(
    startDate?: Date,
    endDate?: Date,
    adminId?: string
  ): Promise<ApiResponse<VerificationMetrics>> {
    try {
      const whereClause: any = {};
      
      if (startDate || endDate) {
        whereClause.updatedAt = {};
        if (startDate) whereClause.updatedAt.gte = startDate;
        if (endDate) whereClause.updatedAt.lte = endDate;
      }

      // Get basic counts
      const [totalProcessed, approvedCount, rejectedCount, pendingCount] = await Promise.all([
        this.prisma.document.count({
          where: {
            ...whereClause,
            status: {
              in: [DocumentStatus.APPROVED, DocumentStatus.REJECTED]
            }
          }
        }),
        this.prisma.document.count({
          where: {
            ...whereClause,
            status: DocumentStatus.APPROVED
          }
        }),
        this.prisma.document.count({
          where: {
            ...whereClause,
            status: DocumentStatus.REJECTED
          }
        }),
        this.prisma.document.count({
          where: {
            status: DocumentStatus.PENDING
          }
        })
      ]);

      // Get verification breakdown by document type
      const documentTypes = Object.values(DocumentType);
      const verificationsByType: Record<DocumentType, any> = {} as any;

      for (const docType of documentTypes) {
        const [total, approved, rejected, pending] = await Promise.all([
          this.prisma.document.count({
            where: {
              ...whereClause,
              documentType: docType,
              status: { in: [DocumentStatus.APPROVED, DocumentStatus.REJECTED, DocumentStatus.PENDING] }
            }
          }),
          this.prisma.document.count({
            where: {
              ...whereClause,
              documentType: docType,
              status: DocumentStatus.APPROVED
            }
          }),
          this.prisma.document.count({
            where: {
              ...whereClause,
              documentType: docType,
              status: DocumentStatus.REJECTED
            }
          }),
          this.prisma.document.count({
            where: {
              documentType: docType,
              status: DocumentStatus.PENDING
            }
          })
        ]);

        verificationsByType[docType] = {
          total,
          approved,
          rejected,
          pending
        };
      }

      // Calculate average processing time (simplified - would need more complex query in production)
      const avgProcessingTime = 24; // placeholder - would calculate from createdAt to updatedAt

      const metrics: VerificationMetrics = {
        totalProcessed,
        approvedCount,
        rejectedCount,
        avgProcessingTime,
        pendingCount,
        verificationsByType
      };

      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      logger.error('Error fetching verification metrics', error);
      throw new ApiError('Failed to fetch verification metrics', 500);
    }
  }

  /**
   * Get admin performance metrics
   */
  async getAdminPerformanceMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiResponse<AdminPerformanceMetrics[]>> {
    try {
      const whereClause: any = {
        targetType: 'Document',
        action: {
          in: ['USER_VERIFIED', 'USER_REJECTED']
        }
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      const adminActions = await this.prisma.adminAction.findMany({
        where: whereClause,
        include: {
          admin: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Group by admin and calculate metrics
      const adminMetricsMap = new Map<string, AdminPerformanceMetrics>();

      for (const action of adminActions) {
        const adminId = action.adminId;
        const adminName = action.admin.name || 'Unknown';

        if (!adminMetricsMap.has(adminId)) {
          adminMetricsMap.set(adminId, {
            adminId,
            adminName,
            totalVerifications: 0,
            approvedCount: 0,
            rejectedCount: 0,
            avgProcessingTime: 0
          });
        }

        const metrics = adminMetricsMap.get(adminId)!;
        metrics.totalVerifications++;

        if (action.action === 'USER_VERIFIED') {
          metrics.approvedCount++;
        } else {
          metrics.rejectedCount++;
        }
      }

      const performanceMetrics = Array.from(adminMetricsMap.values());

      return {
        success: true,
        data: performanceMetrics
      };
    } catch (error) {
      logger.error('Error fetching admin performance metrics', error);
      throw new ApiError('Failed to fetch admin performance metrics', 500);
    }
  }

  /**
   * Update user verification status based on document approvals
   */
  private async updateUserVerificationStatus(userId: string): Promise<void> {
    try {
      // Get user's required documents
      const userDocuments = await this.prisma.document.findMany({
        where: {
          userId,
          isRequired: true
        }
      });

      // Check if all required documents are approved
      const requiredDocTypes = [DocumentType.NIN, DocumentType.SELFIE]; // Basic requirements
      const approvedDocs = userDocuments.filter(doc =>
        doc.status === DocumentStatus.APPROVED &&
        requiredDocTypes.includes(doc.documentType)
      );

      // Update user verification status
      if (approvedDocs.length >= requiredDocTypes.length) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date()
          }
        });
      }
    } catch (error) {
      logger.error('Error updating user verification status', error);
      // Don't throw - this is a secondary operation
    }
  }

  /**
   * Send verification notification to user
   */
  private async sendVerificationNotification(
    user: User,
    document: Document,
    status: DocumentStatus
  ): Promise<void> {
    try {
      const isApproved = status === DocumentStatus.APPROVED;
      const subject = isApproved
        ? 'Document Approved - NewCondo'
        : 'Document Verification Required - NewCondo';

      const emailContent = `
        Dear ${user.name || 'User'},

        Your ${document.documentType.replace('_', ' ').toLowerCase()} document has been ${status.toLowerCase()}.

        ${isApproved
          ? 'Your document has been successfully verified and approved.'
          : `Your document requires attention. ${document.verificationNotes || 'Please review and resubmit if necessary.'}`
        }

        ${!isApproved ? 'Please log in to your account to view details and take any required action.' : ''}

        Best regards,
        The NewCondo Team
      `;

      // Send email notification
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject,
          html: emailContent
        });
      }

      // Send SMS for critical rejections
      if (!isApproved && user.phone) {
        const smsMessage = `NewCondo: Your ${document.documentType.replace('_', ' ').toLowerCase()} document needs attention. Please check your email for details.`;
        
        await sendSMS({
          to: user.phone,
          message: smsMessage
        });
      }
    } catch (error) {
      logger.error('Error sending verification notification', {
        userId: user.id,
        documentId: document.id,
        error
      });
      // Don't throw - notification failure shouldn't fail the main operation
    }
  }

  /**
   * Get document verification history
   */
  async getDocumentVerificationHistory(documentId: string): Promise<ApiResponse<any[]>> {
    try {
      const history = await this.prisma.adminAction.findMany({
        where: {
          targetType: 'Document',
          targetId: documentId
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return {
        success: true,
        data: history
      };
    } catch (error) {
      logger.error('Error fetching document verification history', error);
      throw new ApiError('Failed to fetch verification history', 500);
    }
  }

  /**
   * Flag a document for follow-up review
   */
  async flagForFollowUp(documentId: string, adminId: string, notes?: string, followUpDeadline?: Date): Promise<ApiResponse<Document>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new ApiError('Document not found', 404);
      }

      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.REJECTED, // Or a new `FOLLOW_UP` status if available
          verificationNotes: `[FOLLOW_UP_REQUIRED] ${notes || ''}`,
          followUpDeadline,
          updatedAt: new Date(),
        },
      });

      await this.prisma.adminAction.create({
        data: {
          adminId,
          action: 'FOLLOW_UP_FLAGGED',
          targetType: 'Document',
          targetId: documentId,
          description: 'Document flagged for follow-up',
          metadata: {
            notes,
            followUpDeadline
          }
        }
      });

      logger.info('Document flagged for follow-up', { documentId, adminId });

      return {
        success: true,
        data: updatedDocument,
        message: 'Document flagged for follow-up successfully'
      };
    } catch (error) {
      logger.error('Error flagging document for follow-up', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to flag document for follow-up', 500);
    }
  }
}

export const documentVerificationService = new DocumentVerificationService();