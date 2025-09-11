// backend/admin-service/src/services/legalDocumentService.ts

import { PrismaClient, DocumentType, DocumentStatus, User, Document } from '@newcondo/db';
import { ApiResponse, ApiError } from '../../../shared/src/types/api';
import { uploadToCloudinary } from '../../../shared/src/utils/upload';
import { logger } from '../../../shared/src/middleware/logger';

export interface LegalDocumentData {
  userId: string;
  propertyId?: string;
  documentType: DocumentType;
  documentNumber?: string;
  file?: Express.Multer.File;
  isRequired?: boolean;
  expiresAt?: Date;
}

export interface DocumentSearchFilters {
  documentType?: DocumentType;
  status?: DocumentStatus;
  userId?: string;
  propertyId?: string;
  isExpiringSoon?: boolean; // Within 30 days
  page?: number;
  limit?: number;
}

export interface DocumentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  expiringSoon: number; // Within 30 days
}

class LegalDocumentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Upload and create a new legal document
   */
  async uploadDocument(data: LegalDocumentData): Promise<ApiResponse<Document>> {
    try {
      const { userId, propertyId, documentType, documentNumber, file, isRequired = true, expiresAt } = data;

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // If propertyId provided, validate it exists and belongs to user
      if (propertyId) {
        const property = await this.prisma.property.findFirst({
          where: {
            id: propertyId,
            OR: [
              { ownerId: userId },
              { agentId: userId }
            ]
          }
        });

        if (!property) {
          throw new ApiError('Property not found or access denied', 404);
        }
      }

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSizeBytes: number | null = null;
      let mimeType: string | null = null;

      // Handle file upload if provided
      if (file) {
        const uploadResult = await uploadToCloudinary(file.buffer, {
          folder: `legal-documents/${userId}`,
          resource_type: 'auto'
        });

        fileUrl = uploadResult.secure_url;
        fileName = file.originalname;
        fileSizeBytes = file.size;
        mimeType = file.mimetype;
      }

      // Check if document already exists (prevent duplicates)
      const existingDocument = await this.prisma.document.findFirst({
        where: {
          userId,
          propertyId,
          documentType,
          status: {
            not: DocumentStatus.REJECTED
          }
        }
      });

      if (existingDocument) {
        throw new ApiError('Document of this type already exists', 409);
      }

      // Create document record
      const document = await this.prisma.document.create({
        data: {
          userId,
          propertyId,
          documentType,
          documentNumber,
          fileName,
          fileUrl,
          fileSizeBytes,
          mimeType,
          isRequired,
          expiresAt,
          status: DocumentStatus.PENDING
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
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

      logger.info('Legal document uploaded', {
        documentId: document.id,
        userId,
        documentType
      });

      return {
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      };
    } catch (error) {
      logger.error('Error uploading legal document', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to upload document', 500);
    }
  }

  /**
   * Get documents with filtering and pagination
   */
  async getDocuments(filters: DocumentSearchFilters): Promise<ApiResponse<{
    documents: Document[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }>> {
    try {
      const {
        documentType,
        status,
        userId,
        propertyId,
        isExpiringSoon,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (documentType) {
        where.documentType = documentType;
      }

      if (status) {
        where.status = status;
      }

      if (userId) {
        where.userId = userId;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (isExpiringSoon) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        where.expiresAt = {
          lte: thirtyDaysFromNow,
          gte: new Date()
        };
      }

      // Get total count
      const total = await this.prisma.document.count({ where });

      // Get documents
      const documents = await this.prisma.document.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      return {
        success: true,
        data: {
          documents,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      logger.error('Error fetching documents', error);
      throw new ApiError('Failed to fetch documents', 500);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<ApiResponse<Document>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
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
        }
      });

      if (!document) {
        throw new ApiError('Document not found', 404);
      }

      return {
        success: true,
        data: document
      };
    } catch (error) {
      logger.error('Error fetching document', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to fetch document', 500);
    }
  }

  /**
   * Update document status (approve/reject)
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    verificationNotes?: string,
    adminId?: string
  ): Promise<ApiResponse<Document>> {
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
          status,
          verificationNotes
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
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

      // Log admin action if adminId provided
      if (adminId) {
        await this.prisma.adminAction.create({
          data: {
            adminId,
            action: status === DocumentStatus.APPROVED ? 'PROPERTY_APPROVED' : 'PROPERTY_REJECTED',
            targetType: 'Document',
            targetId: documentId,
            description: `Document ${status.toLowerCase()}${verificationNotes ? `: ${verificationNotes}` : ''}`,
            metadata: {
              documentType: document.documentType,
              previousStatus: document.status
            }
          }
        });
      }

      logger.info('Document status updated', {
        documentId,
        status,
        adminId
      });

      return {
        success: true,
        data: updatedDocument,
        message: `Document ${status.toLowerCase()} successfully`
      };
    } catch (error) {
      logger.error('Error updating document status', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to update document status', 500);
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(): Promise<ApiResponse<DocumentStats>> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const [
        total,
        pending,
        approved,
        rejected,
        expired,
        expiringSoon
      ] = await Promise.all([
        this.prisma.document.count(),
        this.prisma.document.count({ where: { status: DocumentStatus.PENDING } }),
        this.prisma.document.count({ where: { status: DocumentStatus.APPROVED } }),
        this.prisma.document.count({ where: { status: DocumentStatus.REJECTED } }),
        this.prisma.document.count({ where: { status: DocumentStatus.EXPIRED } }),
        this.prisma.document.count({
          where: {
            expiresAt: {
              lte: thirtyDaysFromNow,
              gte: new Date()
            },
            status: DocumentStatus.APPROVED
          }
        })
      ]);

      const stats: DocumentStats = {
        total,
        pending,
        approved,
        rejected,
        expired,
        expiringSoon
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error fetching document stats', error);
      throw new ApiError('Failed to fetch document statistics', 500);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, adminId?: string): Promise<ApiResponse<void>> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new ApiError('Document not found', 404);
      }

      await this.prisma.document.delete({
        where: { id: documentId }
      });

      // Log admin action
      if (adminId) {
        await this.prisma.adminAction.create({
          data: {
            adminId,
            action: 'PROPERTY_REJECTED', // Using existing enum value
            targetType: 'Document',
            targetId: documentId,
            description: 'Document deleted',
            metadata: {
              documentType: document.documentType
            }
          }
        });
      }

      logger.info('Document deleted', { documentId, adminId });

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting document', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to delete document', 500);
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<ApiResponse<Document[]>> {
    try {
      const documents = await this.prisma.document.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        data: documents
      };
    } catch (error) {
      logger.error('Error fetching user documents', error);
      throw new ApiError('Failed to fetch user documents', 500);
    }
  }

  /**
   * Check document expiry and update status
   */
  async checkAndUpdateExpiredDocuments(): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      const now = new Date();

      const result = await this.prisma.document.updateMany({
        where: {
          expiresAt: {
            lt: now
          },
          status: DocumentStatus.APPROVED
        },
        data: {
          status: DocumentStatus.EXPIRED
        }
      });

      logger.info('Expired documents updated', { count: result.count });

      return {
        success: true,
        data: { updatedCount: result.count },
        message: `${result.count} documents marked as expired`
      };
    } catch (error) {
      logger.error('Error updating expired documents', error);
      throw new ApiError('Failed to update expired documents', 500);
    }
  }
}

export const legalDocumentService = new LegalDocumentService();