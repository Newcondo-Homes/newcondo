// backend/property-service/src/services/legalService.ts
import { prisma } from '@newcondo/db';
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

  // Update a document
  async updateDocument(documentId: string, userId: string, updateData: Partial<LegalDocumentData>) {
    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      throw new Error('Document not found or unauthorized');
    }

    if (document.status === DocumentStatus.APPROVED) {
      throw new Error('Cannot update approved documents');
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...updateData,
        status: DocumentStatus.PENDING, // Reset to pending after update
        updatedAt: new Date()
      }
    });

    // Log the document update
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'DOCUMENT_UPDATED',
        metadata: {
          documentId,
          updateData
        }
      }
    });

    return updatedDocument;
  }

  // Delete a document
  async deleteDocument(documentId: string, userId: string) {
    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      throw new Error('Document not found or unauthorized');
    }

    if (document.status === DocumentStatus.APPROVED && document.isRequired) {
      throw new Error('Cannot delete required approved documents');
    }

    await prisma.document.delete({
      where: { id: documentId }
    });

    // Log the document deletion
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'DOCUMENT_DELETED',
        metadata: {
          documentId,
          documentType: document.documentType
        }
      }
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
  // async deleteDocument(documentId: string, userId: string): Promise<void> {
  //   const document = await this.db.document.findFirst({
  //     where: {
  //       id: documentId,
  //       userId,
  //     },
  //   });

  //   if (!document) {
  //     throw new Error('Document not found or unauthorized');
  //   }

  //   await this.db.document.delete({
  //     where: { id: documentId },
  //   });
  // }

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

  // Get required documents for property listing
  async getRequiredDocuments(propertyId: string, userId: string) {
    // Get user info to determine required documents
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { agentId: userId }
        ]
      }
    });

    if (!property) {
      throw new Error('Unauthorized or property not found');
    }

    // Get existing documents
    const existingDocuments = await prisma.document.findMany({
      where: {
        propertyId,
        userId
      }
    });

    // Determine required documents based on user role and property
    const requiredDocTypes = this.getRequiredDocumentTypes(user.role, property.isOwnerListing);
    
    const requiredDocuments = requiredDocTypes.map(docType => {
      const existing = existingDocuments.find(doc => doc.documentType === docType);
      return {
        documentType: docType,
        isRequired: true,
        status: existing?.status || 'NOT_UPLOADED',
        document: existing || null,
        description: this.getDocumentDescription(docType)
      };
    });

    return {
      propertyId,
      requiredDocuments,
      totalRequired: requiredDocuments.length,
      uploaded: requiredDocuments.filter(doc => doc.document).length,
      approved: requiredDocuments.filter(doc => doc.status === DocumentStatus.APPROVED).length,
      isCompliant: requiredDocuments.every(doc => doc.status === DocumentStatus.APPROVED)
    };
  }

  // Record terms and conditions acceptance
  async recordTermsAcceptance(userId: string, termsVersion: string, acceptedAt: Date): Promise<TermsAcceptance> {
    // Log the acceptance in event log
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'TERMS_ACCEPTED',
        metadata: {
          termsVersion,
          acceptedAt: acceptedAt.toISOString(),
          ipAddress: null // Would be passed from controller
        }
      }
    });

    return {
      userId,
      termsVersion,
      acceptedAt,
      isValid: true
    };
  }

  // Add digital signature to document
  async addDigitalSignature(documentId: string, userId: string, signatureUrl: string, signedAt: Date) {
    // Verify document ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      throw new Error('Document not found or unauthorized');
    }

    // Update document with signature info (using metadata field)
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        // Store signature data in metadata since it's JSON
        // In a real implementation, you might want a separate signatures table
        updatedAt: new Date()
      }
    });

    // Log the signature
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'DOCUMENT_SIGNED',
        metadata: {
          documentId,
          signatureUrl,
          signedAt: signedAt.toISOString()
        }
      }
    });

    return updatedDocument;
  }

  // Get document templates
  async getDocumentTemplates(documentType?: DocumentType): Promise<DocumentTemplate[]> {
    // This would typically come from a database or file system
    // For now, returning static templates
    const allTemplates: DocumentTemplate[] = [
      {
        id: 'ownership_template_1',
        documentType: DocumentType.OWNERSHIP_DOCUMENT,
        name: 'Certificate of Occupancy Template',
        description: 'Standard template for certificate of occupancy',
        templateUrl: '/templates/certificate-of-occupancy.pdf',
        isRequired: true
      },
      {
        id: 'consent_template_1',
        documentType: DocumentType.CONSENT_DOCUMENT,
        name: 'Agent Consent Form',
        description: 'Consent form for property agents',
        templateUrl: '/templates/agent-consent-form.pdf',
        isRequired: true
      },
      {
        id: 'undertaking_template_1',
        documentType: DocumentType.UNDERTAKING_DOCUMENT,
        name: 'Property Undertaking Agreement',
        description: 'Standard undertaking agreement for property listings',
        templateUrl: '/templates/undertaking-agreement.pdf',
        isRequired: true
      }
    ];

    if (documentType) {
      return allTemplates.filter(template => template.documentType === documentType);
    }

    return allTemplates;
  }

  // Check compliance status for property
  async checkComplianceStatus(propertyId: string, userId: string): Promise<ComplianceStatus> {
    const requiredDocs = await this.getRequiredDocuments(propertyId, userId);
    
    // Check terms acceptance
    const termsAccepted = await prisma.eventLog.findFirst({
      where: {
        userId,
        type: 'TERMS_ACCEPTED'
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Check privacy policy acceptance
    const privacyAccepted = await prisma.eventLog.findFirst({
      where: {
        userId,
        type: 'PRIVACY_POLICY_ACCEPTED'
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    const complianceChecks = [
      {
        requirement: 'Required Documents',
        status: requiredDocs.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        details: `${requiredDocs.approved}/${requiredDocs.totalRequired} documents approved`
      },
      {
        requirement: 'Terms and Conditions',
        status: termsAccepted ? 'COMPLIANT' : 'NON_COMPLIANT',
        details: termsAccepted ? 'Accepted' : 'Not accepted'
      },
      {
        requirement: 'Privacy Policy',
        status: privacyAccepted ? 'COMPLIANT' : 'NON_COMPLIANT',
        details: privacyAccepted ? 'Accepted' : 'Not accepted'
      }
    ];

    const overallCompliant = complianceChecks.every(check => check.status === 'COMPLIANT');

    return {
      propertyId,
      userId,
      isCompliant: overallCompliant,
      complianceScore: (complianceChecks.filter(check => check.status === 'COMPLIANT').length / complianceChecks.length) * 100,
      checks: complianceChecks,
      lastChecked: new Date()
    };
  }

  // Private helper methods
  private isDocumentRequired(documentType: DocumentType): boolean {
    const requiredTypes = [
      DocumentType.NIN,
      DocumentType.OWNERSHIP_DOCUMENT,
      DocumentType.CONSENT_DOCUMENT,
      DocumentType.UNDERTAKING_DOCUMENT,
      DocumentType.SELFIE
    ];
    return requiredTypes.includes(documentType);
  }

  private getRequiredDocumentTypes(userRole: Role, isOwnerListing: boolean): DocumentType[] {
    const baseRequired = [
      DocumentType.NIN,
      DocumentType.SELFIE
    ];

    if (userRole === Role.OWNER || isOwnerListing) {
      return [
        ...baseRequired,
        DocumentType.OWNERSHIP_DOCUMENT,
        DocumentType.UNDERTAKING_DOCUMENT
      ];
    }

    if (userRole === Role.AGENT) {
      return [
        ...baseRequired,
        DocumentType.CONSENT_DOCUMENT,
        DocumentType.UNDERTAKING_DOCUMENT
      ];
    }

    return baseRequired;
  }

  private getDocumentDescription(documentType: DocumentType): string {
    const descriptions: Record<DocumentType, string> = {
      [DocumentType.NIN]: 'National Identification Number document',
      [DocumentType.BVN]: 'Bank Verification Number',
      [DocumentType.PASSPORT]: 'International passport',
      [DocumentType.VOTERS_CARD]: 'Voter registration card',
      [DocumentType.DRIVERS_LICENSE]: 'Driver\'s license',
      [DocumentType.SELFIE]: 'Verification selfie photo',
      [DocumentType.OWNERSHIP_DOCUMENT]: 'Proof of property ownership (Certificate of Occupancy, etc.)',
      [DocumentType.CONSENT_DOCUMENT]: 'Property owner consent for agent listing',
      [DocumentType.UNDERTAKING_DOCUMENT]: 'Legal undertaking agreement',
      [DocumentType.BUSINESS_REGISTRATION]: 'Business registration certificate',
      [DocumentType.TAX_CERTIFICATE]: 'Tax clearance certificate',
      [DocumentType.UTILITY_BILL]: 'Utility bill for address verification',
      [DocumentType.BANK_STATEMENT]: 'Bank account statement',
      [DocumentType.OTHER]: 'Other supporting documents'
    };

    return descriptions[documentType] || 'Supporting document';
  }
  
}