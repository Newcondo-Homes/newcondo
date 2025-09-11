import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

// Document upload validation schema
const documentUploadSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentSide: z.nativeEnum(DocumentSide).optional(),
  pageNumber: z.number().min(1).optional(),
  documentNumber: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileSizeBytes: z.number().positive().optional(),
  mimeType: z.string().optional(),
  isRequired: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
});

// Document verification schema
const documentVerificationSchema = z.object({
  documentId: z.string().cuid(),
  status: z.nativeEnum(DocumentStatus),
  verificationNotes: z.string().optional(),
});

// Bulk document verification schema
const bulkDocumentVerificationSchema = z.object({
  documents: z.array(z.object({
    documentId: z.string().cuid(),
    status: z.nativeEnum(DocumentStatus),
    verificationNotes: z.string().optional(),
  })).min(1).max(50), // Limit bulk operations
});

// Legal document template schema
const legalDocumentTemplateSchema = z.object({
  templateName: z.string().min(1).max(100),
  templateType: z.enum(['CONSENT', 'OWNERSHIP', 'UNDERTAKING', 'TERMS', 'PRIVACY']),
  content: z.string().min(10),
  requiredFields: z.array(z.string()).optional(),
  version: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Document requirement schema for property types
const documentRequirementSchema = z.object({
  propertyType: z.string(),
  userType: z.string(),
  requiredDocuments: z.array(z.object({
    documentType: z.nativeEnum(DocumentType),
    isRequired: z.boolean(),
    allowedMimeTypes: z.array(z.string()).optional(),
    maxFileSizeBytes: z.number().positive().optional(),
    description: z.string().optional(),
  })),
});

// File validation helpers
const ALLOWED_DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFileMetadata = (req: Request, res: Response, next: NextFunction) => {
  const { fileSizeBytes, mimeType, fileName } = req.body;

  if (fileSizeBytes && fileSizeBytes > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds maximum limit of 10MB',
    });
  }

  if (mimeType && !ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Allowed types: JPEG, PNG, PDF, WebP',
    });
  }

  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file extension',
      });
    }
  }

  next();
};

// Document type specific validation
const validateDocumentTypeRequirements = (req: Request, res: Response, next: NextFunction) => {
  const { documentType, documentNumber, fileUrl, documentSide } = req.body;

  // ID-only documents that require documentNumber
  const idOnlyDocuments = [DocumentType.NIN, DocumentType.BVN];
  
  // Documents that require file upload
  const fileRequiredDocuments = [
    DocumentType.SELFIE,
    DocumentType.OWNERSHIP_DOCUMENT,
    DocumentType.CONSENT_DOCUMENT,
    DocumentType.UNDERTAKING_DOCUMENT,
    DocumentType.UTILITY_BILL,
    DocumentType.BANK_STATEMENT,
  ];

  // Documents that have front/back sides
  const twoSidedDocuments = [
    DocumentType.VOTERS_CARD,
    DocumentType.DRIVERS_LICENSE,
  ];

  if (idOnlyDocuments.includes(documentType)) {
    if (!documentNumber) {
      return res.status(400).json({
        success: false,
        error: `Document number is required for ${documentType}`,
      });
    }

    // Validate NIN format (11 digits)
    if (documentType === DocumentType.NIN && !/^\d{11}$/.test(documentNumber)) {
      return res.status(400).json({
        success: false,
        error: 'NIN must be exactly 11 digits',
      });
    }

    // Validate BVN format (11 digits)
    if (documentType === DocumentType.BVN && !/^\d{11}$/.test(documentNumber)) {
      return res.status(400).json({
        success: false,
        error: 'BVN must be exactly 11 digits',
      });
    }
  }

  if (fileRequiredDocuments.includes(documentType) && !fileUrl) {
    return res.status(400).json({
      success: false,
      error: `File upload is required for ${documentType}`,
    });
  }

  if (twoSidedDocuments.includes(documentType) && !documentSide) {
    return res.status(400).json({
      success: false,
      error: `Document side (FRONT/BACK) is required for ${documentType}`,
    });
  }

  // Passport can be ID-only or file upload, but needs one
  if (documentType === DocumentType.PASSPORT && !documentNumber && !fileUrl) {
    return res.status(400).json({
      success: false,
      error: 'Passport requires either document number or file upload',
    });
  }

  next();
};

// Validation middleware functions
export const validateDocumentUpload = [
  validateFileMetadata,
  validateDocumentTypeRequirements,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      documentUploadSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  },
];

export const validateDocumentVerification = (req: Request, res: Response, next: NextFunction) => {
  try {
    documentVerificationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateBulkDocumentVerification = (req: Request, res: Response, next: NextFunction) => {
  try {
    bulkDocumentVerificationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateLegalDocumentTemplate = (req: Request, res: Response, next: NextFunction) => {
  try {
    legalDocumentTemplateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

export const validateDocumentRequirement = (req: Request, res: Response, next: NextFunction) => {
  try {
    documentRequirementSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};

// Document completeness validation for user verification
export const validateUserDocumentCompleteness = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
    });
  }

  // This would typically check against required documents for the user type
  // Implementation would depend on your business logic
  next();
};

// Property document validation
export const validatePropertyDocuments = async (req: Request, res: Response, next: NextFunction) => {
  const { propertyId } = req.params;
  
  if (!propertyId) {
    return res.status(400).json({
      success: false,
      error: 'Property ID is required',
    });
  }

  // Validate that required property documents are present and approved
  next();
};

// Document status transition validation
export const validateDocumentStatusTransition = (req: Request, res: Response, next: NextFunction) => {
  const { currentStatus } = req.body;
  const { status: newStatus } = req.body;

  // Define valid status transitions
  const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    [DocumentStatus.PENDING]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED],
    [DocumentStatus.APPROVED]: [DocumentStatus.EXPIRED, DocumentStatus.REJECTED],
    [DocumentStatus.REJECTED]: [DocumentStatus.PENDING], // Allow resubmission
    [DocumentStatus.EXPIRED]: [DocumentStatus.PENDING], // Allow renewal
  };

  if (currentStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
    });
  }

  next();
};

export default {
  validateDocumentUpload,
  validateDocumentVerification,
  validateBulkDocumentVerification,
  validateLegalDocumentTemplate,
  validateDocumentRequirement,
  validateUserDocumentCompleteness,
  validatePropertyDocuments,
  validateDocumentStatusTransition,
};