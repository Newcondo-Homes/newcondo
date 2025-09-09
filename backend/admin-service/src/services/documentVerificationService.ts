// backend/admin-service/src/services/documentVerificationService.ts

import { PrismaClient, User, Document, DocumentStatus as PrismaDocumentStatus, UserType } from '@newcondo/db';
import {
  DocumentStatus,
  DocumentType,
  DocumentVerificationFilters,
  DocumentComplianceStatus,
  VerificationStats,
  ComplianceReport,
  DocumentHistory,
  VerificationQueueSummary,
  AdminVerificationAction
} from '../types/documentVerification';
import { notificationService } from '@newcondo/notification-service'; // Assuming a shared notification service import

const prisma = new PrismaClient();

export class DocumentVerificationService {
  // Get pending documents for verification
  async getPendingDocuments(filters: DocumentVerificationFilters) {
    const {
      status = PrismaDocumentStatus.PENDING,
      documentType,
      userId,
      propertyId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      status,
      ...(documentType && { documentType }),
      ...(userId && { userId }),
      ...(propertyId && { propertyId })
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              userType: true,
              verificationStatus: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.document.count({ where: whereClause })
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get document details for verification
  async getDocumentDetails(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            userType: true,
            verificationStatus: true,
            dateOfBirth: true,
            address: true,
            city: true,
            state: true,
            country: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            address: true,
            city: true,
            state: true,
            country: true,
            propertyType: true,
            status: true
          }
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get related documents for context
    const relatedDocuments = await prisma.document.findMany({
      where: {
        userId: document.userId,
        id: { not: documentId }
      },
      select: {
        id: true,
        documentType: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      ...document,
      relatedDocuments
    };
  }

  // Verify (approve/reject) a document
  async verifyDocument(
    documentId: string,
    status: DocumentStatus,
    adminId: string,
    verificationNotes?: string,
    rejectionReason?: string
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { user: true, property: true }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.status !== PrismaDocumentStatus.PENDING) {
      throw new Error('Document has already been verified');
    }

    // Update document status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        verificationNotes,
        updatedAt: new Date()
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: status === PrismaDocumentStatus.APPROVED ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
        targetType: 'Document',
        targetId: documentId,
        description: `Document ${status.toLowerCase()}: ${document.documentType}`,
        metadata: {
          userId: document.userId,
          documentType: document.documentType,
          verificationNotes,
          rejectionReason
        }
      }
    });

    // Check if this affects user's overall verification status
    await this.updateUserVerificationStatus(document.userId);

    // Send notification to user
    await this.sendVerificationNotification(document, status, verificationNotes, rejectionReason);

    return updatedDocument;
  }

  // Bulk verify documents
  async bulkVerifyDocuments(
    documentIds: string[],
    status: DocumentStatus,
    adminId: string,
    verificationNotes?: string
  ) {
    // Get all documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        status: PrismaDocumentStatus.PENDING
      },
      include: { user: true }
    });

    if (documents.length === 0) {
      throw new Error('No eligible documents found for verification');
    }

    // Update documents
    const updatedDocuments = await prisma.$transaction(
      documents.map(doc => 
        prisma.document.update({
          where: { id: doc.id },
          data: {
            status,
            verificationNotes,
            updatedAt: new Date()
          }
        })
      )
    );

    // Log admin actions
    await prisma.$transaction(
      documents.map(doc =>
        prisma.adminAction.create({
          data: {
            adminId,
            action: status === PrismaDocumentStatus.APPROVED ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
            targetType: 'Document',
            targetId: doc.id,
            description: `Bulk ${status.toLowerCase()}: ${doc.documentType}`,
            metadata: {
              userId: doc.userId,
              documentType: doc.documentType,
              verificationNotes,
              isBulkAction: true
            }
          }
        })
      )
    );

    // Update user verification statuses
    const userIds = [...new Set(documents.map(doc => doc.userId))];
    await Promise.all(
      userIds.map(userId => this.updateUserVerificationStatus(userId))
    );

    // Send notifications
    await Promise.all(
      documents.map(doc => this.sendVerificationNotification(doc, status, verificationNotes))
    );

    return {
      updated: updatedDocuments.length,
      failed: documentIds.length - updatedDocuments.length,
      documents: updatedDocuments
    };
  }

  // Get verification statistics
  async getVerificationStats(filters: {
    startDate?: Date;
    endDate?: Date;
    documentType?: DocumentType;
  }): Promise<VerificationStats> {
    const { startDate, endDate, documentType } = filters;
    
    const whereClause: any = {
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
      ...(documentType && { documentType })
    };

    const [
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      expiredDocuments
    ] = await Promise.all([
      prisma.document.count({ where: whereClause }),
      prisma.document.count({ where: { ...whereClause, status: PrismaDocumentStatus.PENDING } }),
      prisma.document.count({ where: { ...whereClause, status: PrismaDocumentStatus.APPROVED } }),
      prisma.document.count({ where: { ...whereClause, status: PrismaDocumentStatus.REJECTED } }),
      prisma.document.count({ where: { ...whereClause, status: PrismaDocumentStatus.EXPIRED } })
    ]);

    // Get document type breakdown
    const documentTypeStats = await prisma.document.groupBy({
      by: ['documentType'],
      _count: true,
      where: whereClause
    });
    
    const stats: VerificationStats = {
      totalDocuments,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
      expiredDocuments,
      documentTypeBreakdown: documentTypeStats.reduce((acc, curr) => {
        acc[curr.documentType] = curr._count;
        return acc;
      }, {} as { [key in DocumentType]?: number })
    };

    return stats;
  }

  // Get verification queue summary
  async getVerificationQueueSummary(): Promise<VerificationQueueSummary> {
    const pendingDocuments = await prisma.document.count({
      where: { status: PrismaDocumentStatus.PENDING }
    });

    const pendingByDocumentType = await prisma.document.groupBy({
      by: ['documentType'],
      _count: true,
      where: { status: PrismaDocumentStatus.PENDING }
    });

    const pendingCountByType = pendingByDocumentType.reduce((acc, curr) => {
      acc[curr.documentType] = curr._count;
      return acc;
    }, {} as { [key in DocumentType]?: number });

    // Assuming a simple average time calculation from a log or audit trail.
    // This is a placeholder and would require more complex logic in a real app.
    const averageProcessingTime = await prisma.adminAction.aggregate({
        _avg: {
            createdAt: true
        },
        where: {
            action: {
                in: ['DOCUMENT_APPROVED', 'DOCUMENT_REJECTED'] as AdminVerificationAction[]
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
    });

    // In a real-world scenario, you'd calculate average time from a starting point
    // (document upload) to an ending point (verification action).
    const averageTimeInQueue = averageProcessingTime?._avg?.createdAt ? (new Date().getTime() - averageProcessingTime._avg.createdAt.getTime()) / 1000 : 0;

    return {
      pendingDocuments,
      pendingCountByType,
      averageTimeInQueue: averageTimeInQueue / 3600 // Convert to hours
    };
  }

  // Check and update a user's overall verification status
  private async updateUserVerificationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: true
      }
    });

    if (!user) return;

    // Define required documents based on user type
    const requiredDocumentTypes: DocumentType[] = [
      DocumentType.SELFIE,
    ];

    if (user.role === 'OWNER' || user.userType === UserType.LANDLORD) {
      requiredDocumentTypes.push(DocumentType.OWNERSHIP_DOCUMENT);
    }
    // Add other required documents based on business logic, e.g., agent-specific docs

    const hasAllRequired = requiredDocumentTypes.every(docType =>
      user.documents.some(d => d.documentType === docType && d.status === PrismaDocumentStatus.APPROVED)
    );

    // Update user's verification status
    if (hasAllRequired) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date()
        }
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: 'PENDING'
        }
      });
    }
  }

  // Send notification to user about document verification status
  private async sendVerificationNotification(
    document: Document & { user: User },
    status: DocumentStatus,
    verificationNotes?: string,
    rejectionReason?: string
  ) {
    if (status === PrismaDocumentStatus.APPROVED) {
      // Send approved notification
      await notificationService.sendEmail({
        to: document.user.email,
        subject: `Your ${document.documentType} Document Has Been Approved`,
        template: 'document-approved',
        context: {
          userName: document.user.name || 'User',
          documentType: document.documentType,
          notes: verificationNotes
        }
      });
    } else if (status === PrismaDocumentStatus.REJECTED) {
      // Send rejected notification
      await notificationService.sendEmail({
        to: document.user.email,
        subject: `Update on Your ${document.documentType} Document`,
        template: 'document-rejected',
        context: {
          userName: document.user.name || 'User',
          documentType: document.documentType,
          reason: rejectionReason,
          notes: verificationNotes
        }
      });
    }
  }

  // Get a report of user compliance
  async getComplianceReport(): Promise<ComplianceReport[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userType: true,
        verificationStatus: true,
        documents: {
          select: {
            documentType: true,
            status: true,
            isRequired: true,
          }
        }
      }
    });

    const complianceReports: ComplianceReport[] = users.map(user => {
      const requiredDocs = user.documents.filter(d => d.isRequired);
      const missingDocs = requiredDocs.filter(d => d.status !== PrismaDocumentStatus.APPROVED);
      const overallStatus: DocumentComplianceStatus = missingDocs.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT';

      return {
        userId: user.id,
        userName: user.name || user.email,
        userRole: user.role,
        userVerificationStatus: user.verificationStatus,
        overallComplianceStatus: overallStatus,
        requiredDocuments: requiredDocs.map(d => ({
          documentType: d.documentType,
          status: d.status,
        })),
        missingDocumentsCount: missingDocs.length,
      };
    });

    return complianceReports;
  }

  // Get a document history for a specific user
  async getDocumentHistory(userId: string): Promise<DocumentHistory[]> {
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        documentType: true,
        status: true,
        verificationNotes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(doc => ({
      documentId: doc.id,
      documentType: doc.documentType,
      status: doc.status,
      notes: doc.verificationNotes,
      uploadedAt: doc.createdAt,
      lastUpdatedAt: doc.updatedAt,
    }));
  }
}