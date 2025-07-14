// backend/property-service/src/services/legalService.ts
import { PrismaClient, DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';
import { PropertyDocument, LegalDocumentValidation, DocumentUploadData } from '../types/boundary';

export class LegalService {
  private db: PrismaClient;

  constructor() {
    this.db = new PrismaClient();
  }

  /**
   * Upload legal document for property
   */
  async uploadDocument(data: DocumentUploadData): Promise<PropertyDocument> {
    const { userId, propertyId, documentType, fileUrl, fileName, fileSizeBytes, mimeType, documentSide, documentNumber } = data;

    // Validate document type requirements
    const validation = this.validateDocumentType(documentType, { fileUrl, documentNumber });
    if (!validation.isValid) {
      throw new Error(`Invalid document: ${validation.errors.join(', ')}`);
    }

    // Check if document already exists
    const existingDocument = await this.db.document.findFirst({
      where: {
        userId,
        propertyId,
        documentType,
        documentSide: documentSide || 'SINGLE',
      },
    });

    if (existingDocument) {
      // Update existing document
      return await this.db.document.update({
        where: { id: existingDocument.id },
        data: {
          fileName,
          fileUrl,
          fileSizeBytes,
          mimeType,
          documentNumber,
          status: 'PENDING',
          verificationNotes: null,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new document
      return await this.db.document.create({
        data: {
          userId,
          propertyId,
          documentType,
          documentSide: documentSide || 'SINGLE',
          fileName,
          fileUrl,
          fileSizeBytes,
          mimeType,
          documentNumber,
          status: 'PENDING',
          isRequired: this.isDocumentRequired(documentType),
        },
      });
    }
  }

  /**
   * Get all documents for a property
   */
  async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
    return await this.db.document.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user documents for a property
   */
  async getUserDocuments(userId: string, propertyId?: string): Promise<PropertyDocument[]> {
    const where: any = { userId };
    if (propertyId) {
      where.propertyId = propertyId;
    }

    return await this.db.document.findMany({
      where,
      include: {
        property: propertyId ? undefined : {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update document status (admin only)
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    verificationNotes?: string
  ): Promise<PropertyDocument> {
    return await this.db.document.update({
      where: { id: documentId },
      data: {
        status,
        verificationNotes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.db.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new Error('Document not found or unauthorized');
    }

    await this.db.document.delete({
      where: { id: documentId },
    });
  }

  /**
   * Check if user has all required documents for property
   */
  async checkRequiredDocuments(userId: string, propertyId: string): Promise<{
    hasAllRequired: boolean;
    missingDocuments: DocumentType[];
    pendingDocuments: DocumentType[];
  }> {
    const userDocuments = await this.db.document.findMany({
      where: {
        userId,
        propertyId,
        isRequired: true,
      },
    });

    const requiredDocuments = this.getRequiredDocuments();
    const submittedDocuments = userDocuments.map(doc => doc.documentType);
    const pendingDocuments = userDocuments
      .filter(doc => doc.status === 'PENDING')
      .map(doc => doc.documentType);

    const missingDocuments = requiredDocuments.filter(
      docType => !submittedDocuments.includes(docType)
    );

    return {
      hasAllRequired: missingDocuments.length === 0,
      missingDocuments,
      pendingDocuments,
    };
  }

  /**
   * Get document verification statistics
   */
  async getDocumentStats(propertyId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  }> {
    const where: any = {};
    if (propertyId) {
      where.propertyId = propertyId;
    }

    const [total, pending, approved, rejected, expired] = await Promise.all([
      this.db.document.count({ where }),
      this.db.document.count({ where: { ...where, status: 'PENDING' } }),
      this.db.document.count({ where: { ...where, status: 'APPROVED' } }),
      this.db.document.count({ where: { ...where, status: 'REJECTED' } }),
      this.db.document.count({ where: { ...where, status: 'EXPIRED' } }),
    ]);

    return { total, pending, approved, rejected, expired };
  }

  /**
   * Validate document type requirements
   */
  private validateDocumentType(documentType: DocumentType, data: { fileUrl?: string; documentNumber?: string }): LegalDocumentValidation {
    const errors: string[] = [];

    // Documents that require file upload
    const fileRequiredTypes: DocumentType[] = [
      'SELFIE',
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE',
      'UTILITY_BILL',
      'BANK_STATEMENT',
      'VOTERS_CARD',
      'DRIVERS_LICENSE',
      'OTHER',
    ];

    // Documents that can be ID-only
    const idOnlyTypes: DocumentType[] = [
      'NIN',
      'BVN',
      'PASSPORT',
    ];

    if (fileRequiredTypes.includes(documentType)) {
      if (!data.fileUrl) {
        errors.push(`${documentType} requires file upload`);
      }
    } else if (idOnlyTypes.includes(documentType)) {
      if (!data.fileUrl && !data.documentNumber) {
        errors.push(`${documentType} requires either file upload or document number`);
      }
    }

    // Validate document number format for specific types
    if (data.documentNumber) {
      const numberValidation = this.validateDocumentNumber(documentType, data.documentNumber);
      if (!numberValidation.isValid) {
        errors.push(...numberValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate document number format
   */
  private validateDocumentNumber(documentType: DocumentType, documentNumber: string): LegalDocumentValidation {
    const errors: string[] = [];

    switch (documentType) {
      case 'NIN':
        if (!/^\d{11}$/.test(documentNumber)) {
          errors.push('NIN must be 11 digits');
        }
        break;
      case 'BVN':
        if (!/^\d{11}$/.test(documentNumber)) {
          errors.push('BVN must be 11 digits');
        }
        break;
      case 'PASSPORT':
        if (!/^[A-Z]\d{8}$/.test(documentNumber)) {
          errors.push('Passport number must be 1 letter followed by 8 digits');
        }
        break;
      default:
        // No specific validation for other document types
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if document type is required
   */
  private isDocumentRequired(documentType: DocumentType): boolean {
    const requiredDocuments = this.getRequiredDocuments();
    return requiredDocuments.includes(documentType);
  }

  /**
   * Get list of required documents for property listing
   */
  private getRequiredDocuments(): DocumentType[] {
    return [
      'NIN', // National ID
      'SELFIE', // Selfie for verification
      'OWNERSHIP_DOCUMENT', // Proof of ownership
    ];
  }

  /**
   * Get document expiration date based on type
   */
  private getDocumentExpirationDate(documentType: DocumentType): Date | null {
    const now = new Date();
    
    switch (documentType) {
      case 'PASSPORT':
        // Passports typically expire after 5 years
        return new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
      case 'DRIVERS_LICENSE':
        // Driver's licenses typically expire after 3 years
        return new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
      case 'UTILITY_BILL':
        // Utility bills should be recent (3 months)
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'BANK_STATEMENT':
        // Bank statements should be recent (3 months)
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      default:
        return null; // No expiration for other document types
    }
  }
}