// backend/admin-service/src/services/complianceService.ts

import { PrismaClient, DocumentType, DocumentStatus, AdminActionType } from '@newcondo/db';
import { Logger } from '../../shared/src/middleware/logger';
import { sendEmail } from '../../shared/src/utils/email';
import { uploadFile, deleteFile } from '../../shared/src/utils/upload';

const prisma = new PrismaClient();
const logger = Logger.getInstance();

export interface ComplianceDocument {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: DocumentType;
  fileName?: string;
  fileUrl?: string;
  documentNumber?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVerificationRequest {
  documentId: string;
  status: DocumentStatus;
  verificationNotes?: string;
  adminId: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  templateUrl: string;
  version: string;
  isActive: boolean;
  description?: string;
}

export interface DigitalSignatureRequest {
  documentId: string;
  userId: string;
  propertyId?: string;
  signerName: string;
  signerEmail: string;
  documentContent: string;
  requiresWitness?: boolean;
}

export interface ComplianceAudit {
  userId: string;
  propertyId?: string;
  requiredDocuments: DocumentType[];
  submittedDocuments: DocumentType[];
  missingDocuments: DocumentType[];
  expiredDocuments: ComplianceDocument[];
  complianceScore: number;
  lastUpdated: Date;
}

class ComplianceService {
  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string, propertyId?: string): Promise<ComplianceDocument[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          userId,
          ...(propertyId && { propertyId })
        },
        orderBy: [
          { isRequired: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return documents.map(this.mapDocumentToResponse);
    } catch (error) {
      logger.error('Error fetching user documents:', error);
      throw new Error('Failed to fetch user documents');
    }
  }

  /**
   * Get documents pending verification
   */
  async getPendingDocuments(limit: number = 50, offset: number = 0): Promise<{
    documents: ComplianceDocument[];
    total: number;
  }> {
    try {
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: {
            status: DocumentStatus.PENDING
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            },
            property: {
              select: {
                title: true,
                address: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset
        }),
        prisma.document.count({
          where: {
            status: DocumentStatus.PENDING
          }
        })
      ]);

      return {
        documents: documents.map(doc => ({
          ...this.mapDocumentToResponse(doc),
          user: doc.user,
          property: doc.property
        })),
        total
      };
    } catch (error) {
      logger.error('Error fetching pending documents:', error);
      throw new Error('Failed to fetch pending documents');
    }
  }

  /**
   * Verify a document
   */
  async verifyDocument(request: DocumentVerificationRequest): Promise<ComplianceDocument> {
    try {
      const document = await prisma.document.update({
        where: { id: request.documentId },
        data: {
          status: request.status,
          verificationNotes: request.verificationNotes,
          updatedAt: new Date()
        },
        include: {
          user: true,
          property: true
        }
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId: request.adminId,
          action: request.status === DocumentStatus.APPROVED 
            ? AdminActionType.USER_VERIFIED 
            : AdminActionType.USER_REJECTED,
          targetType: 'Document',
          targetId: request.documentId,
          description: `Document ${request.status.toLowerCase()}: ${document.documentType}`,
          metadata: {
            verificationNotes: request.verificationNotes,
            documentType: document.documentType,
            userId: document.userId,
            propertyId: document.propertyId
          }
        }
      });

      // Send notification to user
      await this.sendVerificationNotification(document, request.status);

      return this.mapDocumentToResponse(document);
    } catch (error) {
      logger.error('Error verifying document:', error);
      throw new Error('Failed to verify document');
    }
  }

  /**
   * Get compliance audit for user
   */
  async getComplianceAudit(userId: string, propertyId?: string): Promise<ComplianceAudit> {
    try {
      const requiredDocuments = this.getRequiredDocuments(propertyId ? 'PROPERTY_OWNER' : 'USER');
      
      const submittedDocuments = await prisma.document.findMany({
        where: {
          userId,
          ...(propertyId && { propertyId })
        }
      });

      const submittedTypes = submittedDocuments.map(doc => doc.documentType);
      const missingDocuments = requiredDocuments.filter(type => !submittedTypes.includes(type));
      
      const expiredDocuments = submittedDocuments.filter(doc => 
        doc.expiresAt && doc.expiresAt < new Date()
      );

      const complianceScore = this.calculateComplianceScore(
        requiredDocuments.length,
        submittedDocuments.filter(doc => doc.status === DocumentStatus.APPROVED).length,
        expiredDocuments.length
      );

      return {
        userId,
        propertyId,
        requiredDocuments,
        submittedDocuments: submittedTypes,
        missingDocuments,
        expiredDocuments: expiredDocuments.map(this.mapDocumentToResponse),
        complianceScore,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error generating compliance audit:', error);
      throw new Error('Failed to generate compliance audit');
    }
  }

  /**
   * Create document template
   */
  async createDocumentTemplate(template: Omit<DocumentTemplate, 'id'>): Promise<DocumentTemplate> {
    try {
      // For now, store in a mock way since we don't have a DocumentTemplate model
      // In a real implementation, you'd create a proper DocumentTemplate model
      const templateId = `template_${Date.now()}`;
      
      logger.info('Document template created:', {
        templateId,
        name: template.name,
        documentType: template.documentType
      });

      return {
        id: templateId,
        ...template,
      };
    } catch (error) {
      logger.error('Error creating document template:', error);
      throw new Error('Failed to create document template');
    }
  }

  /**
   * Generate legal document from template
   */
  async generateLegalDocument(
    templateId: string, 
    data: Record<string, any>
  ): Promise<{ documentUrl: string; fileName: string }> {
    try {
      // Mock implementation - in reality you'd use a PDF generation library
      // like puppeteer, jsPDF, or integrate with a service like DocuSign
      
      const fileName = `legal_document_${Date.now()}.pdf`;
      const documentContent = this.generateDocumentContent(data);
      
      // Upload generated document
      const documentUrl = await uploadFile(
        Buffer.from(documentContent),
        fileName,
        'application/pdf'
      );

      return {
        documentUrl,
        fileName
      };
    } catch (error) {
      logger.error('Error generating legal document:', error);
      throw new Error('Failed to generate legal document');
    }
  }

  /**
   * Create digital signature request
   */
  async createDigitalSignatureRequest(
    request: DigitalSignatureRequest
  ): Promise<{ signatureUrl: string; requestId: string }> {
    try {
      // Mock implementation - in reality you'd integrate with DocuSign, HelloSign, etc.
      const requestId = `signature_${Date.now()}`;
      const signatureUrl = `https://signatures.newcondo.com/sign/${requestId}`;

      logger.info('Digital signature request created:', {
        requestId,
        documentId: request.documentId,
        signerEmail: request.signerEmail
      });

      // Send signature request email
      await sendEmail(
        request.signerEmail,
        'Document Signature Required - NewCondo',
        'signature-request',
        {
          signerName: request.signerName,
          signatureUrl,
          documentType: 'Legal Document'
        }
      );

      return {
        signatureUrl,
        requestId
      };
    } catch (error) {
      logger.error('Error creating digital signature request:', error);
      throw new Error('Failed to create digital signature request');
    }
  }

  /**
   * Validate document compliance
   */
  async validateDocumentCompliance(userId: string, propertyId?: string): Promise<{
    isCompliant: boolean;
    missingDocuments: DocumentType[];
    expiredDocuments: string[];
    errors: string[];
  }> {
    try {
      const audit = await this.getComplianceAudit(userId, propertyId);
      
      const errors: string[] = [];
      
      if (audit.missingDocuments.length > 0) {
        errors.push(`Missing required documents: ${audit.missingDocuments.join(', ')}`);
      }
      
      if (audit.expiredDocuments.length > 0) {
        errors.push(`Expired documents: ${audit.expiredDocuments.map(doc => doc.documentType).join(', ')}`);
      }

      const isCompliant = audit.complianceScore >= 90 && errors.length === 0;

      return {
        isCompliant,
        missingDocuments: audit.missingDocuments,
        expiredDocuments: audit.expiredDocuments.map(doc => doc.id),
        errors
      };
    } catch (error) {
      logger.error('Error validating document compliance:', error);
      throw new Error('Failed to validate document compliance');
    }
  }

  /**
   * Get document statistics for admin dashboard
   */
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    pendingVerification: number;
    approvedDocuments: number;
    rejectedDocuments: number;
    expiredDocuments: number;
    documentsByType: Record<string, number>;
  }> {
    try {
      const [
        totalDocuments,
        pendingVerification,
        approvedDocuments,
        rejectedDocuments,
        expiredDocuments,
        documentsByType
      ] = await Promise.all([
        prisma.document.count(),
        prisma.document.count({ where: { status: DocumentStatus.PENDING } }),
        prisma.document.count({ where: { status: DocumentStatus.APPROVED } }),
        prisma.document.count({ where: { status: DocumentStatus.REJECTED } }),
        prisma.document.count({ 
          where: { 
            expiresAt: { lt: new Date() },
            status: DocumentStatus.APPROVED
          } 
        }),
        prisma.document.groupBy({
          by: ['documentType'],
          _count: { documentType: true }
        })
      ]);

      const documentTypeStats = documentsByType.reduce((acc, item) => {
        acc[item.documentType] = item._count.documentType;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDocuments,
        pendingVerification,
        approvedDocuments,
        rejectedDocuments,
        expiredDocuments,
        documentsByType: documentTypeStats
      };
    } catch (error) {
      logger.error('Error fetching document statistics:', error);
      throw new Error('Failed to fetch document statistics');
    }
  }

  // Private helper methods
  private mapDocumentToResponse(document: any): ComplianceDocument {
    return {
      id: document.id,
      userId: document.userId,
      propertyId: document.propertyId,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      documentNumber: document.documentNumber,
      status: document.status,
      verificationNotes: document.verificationNotes,
      isRequired: document.isRequired,
      expiresAt: document.expiresAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  private getRequiredDocuments(userType: 'USER' | 'PROPERTY_OWNER'): DocumentType[] {
    const baseDocuments = [
      DocumentType.NIN,
      DocumentType.SELFIE
    ];

    const propertyOwnerDocuments = [
      DocumentType.OWNERSHIP_DOCUMENT,
      DocumentType.UNDERTAKING_DOCUMENT
    ];

    return userType === 'PROPERTY_OWNER' 
      ? [...baseDocuments, ...propertyOwnerDocuments]
      : baseDocuments;
  }

  private calculateComplianceScore(
    requiredCount: number, 
    approvedCount: number, 
    expiredCount: number
  ): number {
    if (requiredCount === 0) return 100;
    
    const baseScore = (approvedCount / requiredCount) * 100;
    const expiredPenalty = (expiredCount / requiredCount) * 10;
    
    return Math.max(0, Math.min(100, baseScore - expiredPenalty));
  }

  private async sendVerificationNotification(document: any, status: DocumentStatus): Promise<void> {
    try {
      const subject = status === DocumentStatus.APPROVED 
        ? 'Document Approved - NewCondo'
        : 'Document Rejected - NewCondo';

      const template = status === DocumentStatus.APPROVED 
        ? 'document-approved'
        : 'document-rejected';

      await sendEmail(
        document.user.email,
        subject,
        template,
        {
          userName: document.user.name,
          documentType: document.documentType,
          verificationNotes: document.verificationNotes,
          propertyTitle: document.property?.title
        }
      );
    } catch (error) {
      logger.error('Error sending verification notification:', error);
      // Don't throw error - notification failure shouldn't block verification
    }
  }

  private generateDocumentContent(data: Record<string, any>): string {
    // Mock PDF content generation
    // In reality, you'd use a proper PDF generation library
    return `Legal Document Generated on ${new Date().toISOString()}\n\nDocument Data: ${JSON.stringify(data, null, 2)}`;
  }
}

export default new ComplianceService();