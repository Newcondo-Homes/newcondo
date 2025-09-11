// backend/admin-service/src/controllers/legalDocumentController.ts
import { Request, Response } from 'express';
import { PrismaClient, DocumentType, DocumentStatus } from '@newcondo/db';
import { standardResponse } from '../../../shared/src/utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createDocumentTemplateSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  templateContent: z.string().min(1, 'Template content is required'),
  requiredFields: z.array(z.string()).optional(),
  isRequired: z.boolean().default(true),
  category: z.enum(['IDENTITY', 'PROPERTY', 'BUSINESS', 'UTILITY', 'OTHER']).optional(),
});

const updateDocumentTemplateSchema = createDocumentTemplateSchema.partial();

const uploadDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  propertyId: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL'),
  fileSizeBytes: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  documentNumber: z.string().optional(),
});

export class LegalDocumentController {
  // Get all legal document templates
  static async getDocumentTemplates(req: Request, res: Response) {
    try {
      const { category, documentType, isRequired } = req.query;

      const where: any = {};
      if (category) where.category = category;
      if (documentType) where.documentType = documentType;
      if (isRequired !== undefined) where.isRequired = isRequired === 'true';

      const templates = await prisma.documentTemplate.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { documentType: 'asc' },
          { createdAt: 'desc' }
        ],
      });

      return res.json(standardResponse(true, 'Document templates retrieved', templates));
    } catch (error) {
      console.error('Error fetching document templates:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to fetch document templates', null, 'FETCH_TEMPLATES_ERROR')
      );
    }
  }

  // Create new document template
  static async createDocumentTemplate(req: Request, res: Response) {
    try {
      const validatedData = createDocumentTemplateSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json(
          standardResponse(false, 'Admin authentication required', null, 'UNAUTHORIZED')
        );
      }

      // Check if template already exists
      const existingTemplate = await prisma.documentTemplate.findFirst({
        where: {
          documentType: validatedData.documentType,
          title: validatedData.title,
        },
      });

      if (existingTemplate) {
        return res.status(409).json(
          standardResponse(false, 'Document template already exists', null, 'TEMPLATE_EXISTS')
        );
      }

      const template = await prisma.documentTemplate.create({
        data: {
          ...validatedData,
          createdBy: adminId,
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'DOCUMENT_TEMPLATE_CREATED',
          targetType: 'DocumentTemplate',
          targetId: template.id,
          description: `Created document template: ${template.title}`,
          metadata: { documentType: template.documentType },
        },
      });

      return res.status(201).json(standardResponse(true, 'Document template created', template));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          standardResponse(false, 'Validation error', error.errors, 'VALIDATION_ERROR')
        );
      }

      console.error('Error creating document template:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to create document template', null, 'CREATE_TEMPLATE_ERROR')
      );
    }
  }

  // Update document template
  static async updateDocumentTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateDocumentTemplateSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json(
          standardResponse(false, 'Admin authentication required', null, 'UNAUTHORIZED')
        );
      }

      const existingTemplate = await prisma.documentTemplate.findUnique({
        where: { id },
      });

      if (!existingTemplate) {
        return res.status(404).json(
          standardResponse(false, 'Document template not found', null, 'TEMPLATE_NOT_FOUND')
        );
      }

      const template = await prisma.documentTemplate.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'DOCUMENT_TEMPLATE_UPDATED',
          targetType: 'DocumentTemplate',
          targetId: template.id,
          description: `Updated document template: ${template.title}`,
          metadata: { changes: validatedData },
        },
      });

      return res.json(standardResponse(true, 'Document template updated', template));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          standardResponse(false, 'Validation error', error.errors, 'VALIDATION_ERROR')
        );
      }

      console.error('Error updating document template:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to update document template', null, 'UPDATE_TEMPLATE_ERROR')
      );
    }
  }

  // Delete document template
  static async deleteDocumentTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json(
          standardResponse(false, 'Admin authentication required', null, 'UNAUTHORIZED')
        );
      }

      const template = await prisma.documentTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json(
          standardResponse(false, 'Document template not found', null, 'TEMPLATE_NOT_FOUND')
        );
      }

      await prisma.documentTemplate.delete({
        where: { id },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'DOCUMENT_TEMPLATE_DELETED',
          targetType: 'DocumentTemplate',
          targetId: id,
          description: `Deleted document template: ${template.title}`,
          metadata: { documentType: template.documentType },
        },
      });

      return res.json(standardResponse(true, 'Document template deleted', null));
    } catch (error) {
      console.error('Error deleting document template:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to delete document template', null, 'DELETE_TEMPLATE_ERROR')
      );
    }
  }

  // Get user documents with filtering
  static async getUserDocuments(req: Request, res: Response) {
    try {
      const { userId, propertyId, documentType, status, page = '1', limit = '20' } = req.query;

      const where: any = {};
      if (userId) where.userId = userId as string;
      if (propertyId) where.propertyId = propertyId as string;
      if (documentType) where.documentType = documentType;
      if (status) where.status = status;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.document.count({ where }),
      ]);

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      };

      return res.json(
        standardResponse(true, 'User documents retrieved', {
          documents,
          pagination,
        })
      );
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to fetch user documents', null, 'FETCH_DOCUMENTS_ERROR')
      );
    }
  }

  // Upload document for user
  static async uploadUserDocument(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const validatedData = uploadDocumentSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json(
          standardResponse(false, 'Admin authentication required', null, 'UNAUTHORIZED')
        );
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json(
          standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
        );
      }

      // Check for existing document of same type
      const existingDocument = await prisma.document.findFirst({
        where: {
          userId,
          documentType: validatedData.documentType,
          propertyId: validatedData.propertyId || null,
        },
      });

      if (existingDocument) {
        return res.status(409).json(
          standardResponse(false, 'Document of this type already exists', null, 'DOCUMENT_EXISTS')
        );
      }

      const document = await prisma.document.create({
        data: {
          userId,
          ...validatedData,
          status: DocumentStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'DOCUMENT_UPLOADED',
          targetType: 'Document',
          targetId: document.id,
          description: `Uploaded document for user: ${user.email}`,
          metadata: { 
            documentType: document.documentType,
            userId: userId
          },
        },
      });

      return res.status(201).json(standardResponse(true, 'Document uploaded successfully', document));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(
          standardResponse(false, 'Validation error', error.errors, 'VALIDATION_ERROR')
        );
      }

      console.error('Error uploading user document:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to upload document', null, 'UPLOAD_DOCUMENT_ERROR')
      );
    }
  }

  // Get compliance status for user
  static async getUserComplianceStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json(
          standardResponse(false, 'User not found', null, 'USER_NOT_FOUND')
        );
      }

      // Get required document types based on user role
      const requiredDocuments = await this.getRequiredDocumentsForUser(user.role, user.userType);
      
      const complianceStatus = {
        userId: user.id,
        overallStatus: user.verificationStatus,
        requiredDocuments,
        submittedDocuments: user.documents,
        missingDocuments: requiredDocuments.filter(
          required => !user.documents.some(doc => doc.documentType === required.documentType)
        ),
        pendingDocuments: user.documents.filter(doc => doc.status === DocumentStatus.PENDING),
        approvedDocuments: user.documents.filter(doc => doc.status === DocumentStatus.APPROVED),
        rejectedDocuments: user.documents.filter(doc => doc.status === DocumentStatus.REJECTED),
        complianceScore: this.calculateComplianceScore(user.documents, requiredDocuments),
      };

      return res.json(standardResponse(true, 'User compliance status retrieved', complianceStatus));
    } catch (error) {
      console.error('Error fetching user compliance status:', error);
      return res.status(500).json(
        standardResponse(false, 'Failed to fetch compliance status', null, 'COMPLIANCE_STATUS_ERROR')
      );
    }
  }

  // Helper method to get required documents based on user role
  private static async getRequiredDocumentsForUser(role: any, userType: any) {
    const baseRequirements = [
      { documentType: DocumentType.NIN, isRequired: true },
      { documentType: DocumentType.SELFIE, isRequired: true },
    ];

    if (role === 'OWNER' || userType === 'LANDLORD') {
      baseRequirements.push(
        { documentType: DocumentType.OWNERSHIP_DOCUMENT, isRequired: true },
        { documentType: DocumentType.UNDERTAKING_DOCUMENT, isRequired: true }
      );
    }

    if (role === 'AGENT') {
      baseRequirements.push(
        { documentType: DocumentType.CONSENT_DOCUMENT, isRequired: true },
        { documentType: DocumentType.BUSINESS_REGISTRATION, isRequired: false }
      );
    }

    return baseRequirements;
  }

  // Helper method to calculate compliance score
  private static calculateComplianceScore(documents: any[], requiredDocuments: any[]) {
    if (requiredDocuments.length === 0) return 100;

    const approvedRequired = documents.filter(doc => 
      doc.status === DocumentStatus.APPROVED && 
      requiredDocuments.some(req => req.documentType === doc.documentType && req.isRequired)
    );

    return Math.round((approvedRequired.length / requiredDocuments.filter(req => req.isRequired).length) * 100);
  }
}