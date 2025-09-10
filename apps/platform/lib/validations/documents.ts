import { z } from 'zod';
import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

// Base document validation schema
export const baseDocumentSchema = z.object({
  id: z.string().cuid().optional(),
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  documentType: z.nativeEnum(DocumentType),
  documentSide: z.nativeEnum(DocumentSide).optional(),
  pageNumber: z.number().min(1).max(50).optional(),
  documentNumber: z.string().max(100).optional(),
  status: z.nativeEnum(DocumentStatus).default(DocumentStatus.PENDING),
  isRequired: z.boolean().default(true),
  expiresAt: z.date().optional(),
});

// File upload specific validation
export const documentFileSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 15 * 1024 * 1024, {
      message: 'File size must be less than 15MB'
    })
    .refine(file => [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.type), {
      message: 'File must be JPEG, PNG, WebP, PDF, DOC, or DOCX'
    }),
  fileName: z.string().max(255).optional(),
  altText: z.string().max(500).optional(),
});

// ID-only document validation (NIN, BVN, etc.)
export const idOnlyDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string()
    .min(1, 'Document number is required')
    .max(50, 'Document number is too long'),
  expiresAt: z.date().optional(),
}).refine(data => {
  // Specific validation rules for different document types
  switch (data.documentType) {
    case DocumentType.NIN:
      return /^\d{11}$/.test(data.documentNumber);
    case DocumentType.BVN:
      return /^\d{11}$/.test(data.documentNumber);
    case DocumentType.PASSPORT:
      return /^[A-Z]\d{8}$/.test(data.documentNumber);
    default:
      return data.documentNumber.length >= 3;
  }
}, {
  message: 'Invalid document number format for the selected document type',
  path: ['documentNumber']
});

// Identity document validation
export const identityDocumentSchema = baseDocumentSchema.extend({
  documentType: z.enum([
    DocumentType.NIN,
    DocumentType.BVN,
    DocumentType.PASSPORT,
    DocumentType.VOTERS_CARD,
    DocumentType.DRIVERS_LICENSE
  ]),
}).and(
  z.discriminatedUnion('documentType', [
    // NIN - ID only
    z.object({
      documentType: z.literal(DocumentType.NIN),
      documentNumber: z.string().regex(/^\d{11}$/, 'NIN must be 11 digits'),
    }),
    // BVN - ID only  
    z.object({
      documentType: z.literal(DocumentType.BVN),
      documentNumber: z.string().regex(/^\d{11}$/, 'BVN must be 11 digits'),
    }),
    // Passport - ID only or file upload
    z.object({
      documentType: z.literal(DocumentType.PASSPORT),
      documentNumber: z.string().regex(/^[A-Z]\d{8}$/, 'Invalid passport number format').optional(),
    }),
    // Other documents - file upload required
    z.object({
      documentType: z.enum([
        DocumentType.VOTERS_CARD,
        DocumentType.DRIVERS_LICENSE
      ]),
      documentSide: z.nativeEnum(DocumentSide),
    })
  ])
);

// Selfie document validation
export const selfieDocumentSchema = baseDocumentSchema.extend({
  documentType: z.literal(DocumentType.SELFIE),
  documentSide: z.literal(DocumentSide.SINGLE),
}).merge(documentFileSchema).refine(data => {
  return data.file.type.startsWith('image/');
}, {
  message: 'Selfie must be an image file'
});

// Property document validation
export const propertyDocumentSchema = baseDocumentSchema.extend({
  documentType: z.enum([
    DocumentType.OWNERSHIP_DOCUMENT,
    DocumentType.CONSENT_DOCUMENT,
    DocumentType.UNDERTAKING_DOCUMENT
  ]),
  propertyId: z.string().cuid({
    message: 'Property ID is required for property documents'
  }),
}).merge(documentFileSchema);

// Business document validation  
export const businessDocumentSchema = baseDocumentSchema.extend({
  documentType: z.enum([
    DocumentType.BUSINESS_REGISTRATION,
    DocumentType.TAX_CERTIFICATE
  ]),
}).merge(documentFileSchema);

// Utility document validation
export const utilityDocumentSchema = baseDocumentSchema.extend({
  documentType: z.enum([
    DocumentType.UTILITY_BILL,
    DocumentType.BANK_STATEMENT
  ]),
  expiresAt: z.date().refine(date => {
    // Utility bills should be recent (within last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return date >= threeMonthsAgo;
  }, {
    message: 'Utility bills must be from the last 3 months'
  }),
}).merge(documentFileSchema);

// Document update validation
export const documentUpdateSchema = z.object({
  documentId: z.string().cuid(),
  documentNumber: z.string().max(100).optional(),
  expiresAt: z.date().optional(),
  verificationNotes: z.string().max(1000).optional(),
  isRequired: z.boolean().optional(),
});

// Document deletion validation
export const documentDeleteSchema = z.object({
  documentId: z.string().cuid(),
  reason: z.string().max(500).optional(),
  confirmDelete: z.boolean().refine(val => val === true, {
    message: 'You must confirm document deletion'
  }),
});

// Document batch operations
export const batchDocumentOperationSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1).max(50),
  operation: z.enum(['DELETE', 'APPROVE', 'REJECT', 'MARK_EXPIRED']),
  notes: z.string().max(1000).optional(),
  reason: z.string().max(500).optional(),
});

// Document metadata validation
export const documentMetadataSchema = z.object({
  documentId: z.string().cuid(),
  metadata: z.object({
    uploadedBy: z.string().cuid(),
    originalFileName: z.string().max(255),
    fileHash: z.string().optional(),
    ocrText: z.string().optional(), // Extracted text from OCR
    aiAnalysis: z.object({
      confidence: z.number().min(0).max(1),
      extractedData: z.record(z.any()),
      flags: z.array(z.string()),
    }).optional(),
    verificationHistory: z.array(z.object({
      action: z.string(),
      performedBy: z.string().cuid(),
      timestamp: z.date(),
      notes: z.string().optional(),
    })).optional(),
  }),
});

// Document requirement validation based on user type and action
export const documentRequirementSchema = z.object({
  userId: z.string().cuid(),
  userType: z.enum(['LANDLORD', 'PROPERTY_MANAGER', 'AGENT', 'RENTER']),
  action: z.enum([
    'USER_VERIFICATION',
    'PROPERTY_LISTING',
    'RENTAL_APPLICATION',
    'AGENT_REGISTRATION'
  ]),
  propertyId: z.string().cuid().optional(),
});

// Document verification status check
export const documentStatusCheckSchema = z.object({
  userId: z.string().cuid(),
  documentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  includeOptional: z.boolean().default(false),
  propertyId: z.string().cuid().optional(),
});

// Document expiry reminder validation
export const documentExpiryReminderSchema = z.object({
  userId: z.string().cuid(),
  daysBefore: z.number().min(1).max(365).default(30),
  documentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  includeExpired: z.boolean().default(false),
});

// Combined document submission (multiple docs at once)
export const documentSubmissionSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  documents: z.array(
    z.discriminatedUnion('hasFile', [
      // Documents with file upload
      z.object({
        hasFile: z.literal(true),
        documentType: z.nativeEnum(DocumentType),
        documentSide: z.nativeEnum(DocumentSide).optional(),
        pageNumber: z.number().optional(),
        file: z.instanceof(File),
        documentNumber: z.string().optional(),
        expiresAt: z.date().optional(),
      }),
      // Documents with ID only
      z.object({
        hasFile: z.literal(false),
        documentType: z.nativeEnum(DocumentType),
        documentNumber: z.string().min(1),
        expiresAt: z.date().optional(),
      }),
    ])
  ).min(1).max(20),
  submissionNotes: z.string().max(1000).optional(),
});

// Type exports
export type BaseDocument = z.infer<typeof baseDocumentSchema>;
export type DocumentFile = z.infer<typeof documentFileSchema>;
export type IdOnlyDocument = z.infer<typeof idOnlyDocumentSchema>;
export type IdentityDocument = z.infer<typeof identityDocumentSchema>;
export type SelfieDocument = z.infer<typeof selfieDocumentSchema>;
export type PropertyDocument = z.infer<typeof propertyDocumentSchema>;
export type BusinessDocument = z.infer<typeof businessDocumentSchema>;
export type UtilityDocument = z.infer<typeof utilityDocumentSchema>;
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;
export type DocumentDelete = z.infer<typeof documentDeleteSchema>;
export type BatchDocumentOperation = z.infer<typeof batchDocumentOperationSchema>;
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type DocumentRequirement = z.infer<typeof documentRequirementSchema>;
export type DocumentStatusCheck = z.infer<typeof documentStatusCheckSchema>;
export type DocumentExpiryReminder = z.infer<typeof documentExpiryReminderSchema>;
export type DocumentSubmission = z.infer<typeof documentSubmissionSchema>;