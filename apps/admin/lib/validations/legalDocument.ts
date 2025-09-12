import { z } from 'zod';
import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

// Base document validation schema
export const baseLegalDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentSide: z.nativeEnum(DocumentSide).optional(),
  pageNumber: z.number().min(1).optional(),
  documentNumber: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileSizeBytes: z.number().positive().optional(),
  mimeType: z.string().optional(),
  isRequired: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

// Document type specific validations
export const ninDocumentSchema = z.object({
  documentType: z.literal(DocumentType.NIN),
  documentNumber: z.string()
    .length(11, 'NIN must be exactly 11 digits')
    .regex(/^\d{11}$/, 'NIN must contain only numbers'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const bvnDocumentSchema = z.object({
  documentType: z.literal(DocumentType.BVN),
  documentNumber: z.string()
    .length(11, 'BVN must be exactly 11 digits')
    .regex(/^\d{11}$/, 'BVN must contain only numbers'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const passportDocumentSchema = z.object({
  documentType: z.literal(DocumentType.PASSPORT),
  documentNumber: z.string()
    .min(8, 'Passport number must be at least 8 characters')
    .max(9, 'Passport number must not exceed 9 characters')
    .regex(/^[A-Z]\d{8}$/, 'Passport number must start with a letter followed by 8 digits'),
  expiresAt: z.string().datetime('Passport must have an expiration date'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const votersCardDocumentSchema = z.object({
  documentType: z.literal(DocumentType.VOTERS_CARD),
  fileUrl: z.string().url('Voter\'s card must be uploaded as an image'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png)$/, 'Only JPEG and PNG images are allowed'),
  documentSide: z.enum([DocumentSide.FRONT, DocumentSide.BACK]),
});

export const driversLicenseDocumentSchema = z.object({
  documentType: z.literal(DocumentType.DRIVERS_LICENSE),
  fileUrl: z.string().url('Driver\'s license must be uploaded as an image'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png)$/, 'Only JPEG and PNG images are allowed'),
  documentSide: z.enum([DocumentSide.FRONT, DocumentSide.BACK]),
  expiresAt: z.string().datetime('Driver\'s license must have an expiration date'),
});

export const selfieDocumentSchema = z.object({
  documentType: z.literal(DocumentType.SELFIE),
  fileUrl: z.string().url('Selfie must be uploaded'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png)$/, 'Only JPEG and PNG images are allowed'),
  fileSizeBytes: z.number()
    .max(5 * 1024 * 1024, 'Selfie must be less than 5MB')
    .min(10 * 1024, 'Selfie must be at least 10KB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const ownershipDocumentSchema = z.object({
  documentType: z.literal(DocumentType.OWNERSHIP_DOCUMENT),
  fileUrl: z.string().url('Ownership document must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const consentDocumentSchema = z.object({
  documentType: z.literal(DocumentType.CONSENT_DOCUMENT),
  fileUrl: z.string().url('Consent document must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
  isRequired: z.literal(true), // Consent documents are always required
});

export const undertakingDocumentSchema = z.object({
  documentType: z.literal(DocumentType.UNDERTAKING_DOCUMENT),
  fileUrl: z.string().url('Undertaking document must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
  isRequired: z.literal(true), // Undertaking documents are always required
});

export const businessRegistrationSchema = z.object({
  documentType: z.literal(DocumentType.BUSINESS_REGISTRATION),
  fileUrl: z.string().url('Business registration document must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentNumber: z.string().optional(), // CAC registration number
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const taxCertificateSchema = z.object({
  documentType: z.literal(DocumentType.TAX_CERTIFICATE),
  fileUrl: z.string().url('Tax certificate must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  expiresAt: z.string().datetime('Tax certificate must have an expiration date'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const utilityBillSchema = z.object({
  documentType: z.literal(DocumentType.UTILITY_BILL),
  fileUrl: z.string().url('Utility bill must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const bankStatementSchema = z.object({
  documentType: z.literal(DocumentType.BANK_STATEMENT),
  fileUrl: z.string().url('Bank statement must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  pageNumber: z.number().min(1).optional(),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

export const otherDocumentSchema = z.object({
  documentType: z.literal(DocumentType.OTHER),
  fileUrl: z.string().url('Document must be uploaded'),
  mimeType: z.string().regex(/^(image\/(jpeg|jpg|png)|application\/pdf)$/, 'Only JPEG, PNG, and PDF files are allowed'),
  fileSizeBytes: z.number()
    .max(10 * 1024 * 1024, 'Document must be less than 10MB'),
  documentSide: z.literal(DocumentSide.SINGLE).optional(),
});

// Union schema for all document types
export const legalDocumentSchema = z.discriminatedUnion('documentType', [
  ninDocumentSchema,
  bvnDocumentSchema,
  passportDocumentSchema,
  votersCardDocumentSchema,
  driversLicenseDocumentSchema,
  selfieDocumentSchema,
  ownershipDocumentSchema,
  consentDocumentSchema,
  undertakingDocumentSchema,
  businessRegistrationSchema,
  taxCertificateSchema,
  utilityBillSchema,
  bankStatementSchema,
  otherDocumentSchema,
]);

// Create document schema
export const createLegalDocumentSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
}).and(legalDocumentSchema);

// Update document schema
export const updateLegalDocumentSchema = z.object({
  status: z.nativeEnum(DocumentStatus).optional(),
  verificationNotes: z.string().optional(),
  isRequired: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
}).partial();

// Bulk document upload schema
export const bulkDocumentUploadSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  documents: z.array(legalDocumentSchema).min(1, 'At least one document is required'),
});

// Document search/filter schema
export const documentFilterSchema = z.object({
  userId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  isRequired: z.boolean().optional(),
  isExpiring: z.boolean().optional(), // Documents expiring within 30 days
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'expiresAt', 'documentType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Digital signature validation
export const digitalSignatureSchema = z.object({
  documentId: z.string().cuid(),
  signatureData: z.string().min(1, 'Signature data is required'),
  signerName: z.string().min(2, 'Signer name must be at least 2 characters'),
  signerEmail: z.string().email('Invalid email address'),
  signerPhone: z.string()
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format')
    .optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Consent must be given to proceed with digital signature' }),
  }),
});

// Legal compliance check schema
export const complianceCheckSchema = z.object({
  documentId: z.string().cuid(),
  checkType: z.enum(['AUTOMATIC', 'MANUAL', 'THIRD_PARTY']),
  checkedBy: z.string().cuid().optional(), // Admin ID for manual checks
  complianceRules: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Terms and conditions acceptance schema
export const termsAcceptanceSchema = z.object({
  userId: z.string().cuid(),
  termsVersion: z.string().min(1, 'Terms version is required'),
  acceptanceType: z.enum(['SIGNUP', 'UPDATE', 'RENEWAL']),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Terms and conditions must be accepted' }),
  }),
});

// Privacy policy acceptance schema
export const privacyPolicyAcceptanceSchema = z.object({
  userId: z.string().cuid(),
  policyVersion: z.string().min(1, 'Policy version is required'),
  acceptanceType: z.enum(['SIGNUP', 'UPDATE', 'RENEWAL']),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Privacy policy must be accepted' }),
  }),
});

// Legal document template schema
export const legalDocumentTemplateSchema = z.object({
  templateName: z.string().min(2, 'Template name must be at least 2 characters'),
  templateType: z.enum(['TERMS_CONDITIONS', 'PRIVACY_POLICY', 'CONSENT_FORM', 'UNDERTAKING', 'AGREEMENT']),
  content: z.string().min(100, 'Template content must be at least 100 characters'),
  variables: z.array(z.string()).optional(), // Template variables like {{userName}}, {{propertyAddress}}
  version: z.string().min(1, 'Version is required'),
  isActive: z.boolean().default(true),
  requiredSignatures: z.number().min(1).default(1),
  expirationDays: z.number().positive().optional(),
});

// Export types for TypeScript inference
export type LegalDocumentInput = z.infer<typeof legalDocumentSchema>;
export type CreateLegalDocumentInput = z.infer<typeof createLegalDocumentSchema>;
export type UpdateLegalDocumentInput = z.infer<typeof updateLegalDocumentSchema>;
export type BulkDocumentUploadInput = z.infer<typeof bulkDocumentUploadSchema>;
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;
export type DigitalSignatureInput = z.infer<typeof digitalSignatureSchema>;
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;
export type TermsAcceptanceInput = z.infer<typeof termsAcceptanceSchema>;
export type PrivacyPolicyAcceptanceInput = z.infer<typeof privacyPolicyAcceptanceSchema>;
export type LegalDocumentTemplateInput = z.infer<typeof legalDocumentTemplateSchema>;

// Validation helper functions
export const validateDocumentType = (documentType: DocumentType): boolean => {
  return Object.values(DocumentType).includes(documentType);
};

export const validateFileSize = (sizeInBytes: number, documentType: DocumentType): boolean => {
  const maxSizes: Record<DocumentType, number> = {
    [DocumentType.NIN]: 0, // ID-only, no file
    [DocumentType.BVN]: 0, // ID-only, no file
    [DocumentType.PASSPORT]: 5 * 1024 * 1024, // 5MB
    [DocumentType.VOTERS_CARD]: 5 * 1024 * 1024, // 5MB
    [DocumentType.DRIVERS_LICENSE]: 5 * 1024 * 1024, // 5MB
    [DocumentType.SELFIE]: 5 * 1024 * 1024, // 5MB
    [DocumentType.OWNERSHIP_DOCUMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentType.CONSENT_DOCUMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentType.UNDERTAKING_DOCUMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentType.BUSINESS_REGISTRATION]: 10 * 1024 * 1024, // 10MB
    [DocumentType.TAX_CERTIFICATE]: 10 * 1024 * 1024, // 10MB
    [DocumentType.UTILITY_BILL]: 10 * 1024 * 1024, // 10MB
    [DocumentType.BANK_STATEMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentType.OTHER]: 10 * 1024 * 1024, // 10MB
    [DocumentType.TERMS_CONDITIONS]: 10 * 1024 * 1024, // 10MB
    [DocumentType.PRIVACY_POLICY]: 10 * 1024 * 1024, // 10MB
    [DocumentType.RENTAL_AGREEMENT]: 10 * 1024 * 1024, // 10MB
    [DocumentType.TENANT_APPLICATION]: 10 * 1024 * 1024, // 10MB
    [DocumentType.AGENT_PERMISSION]: 10 * 1024 * 1024, // 10MB
  };

  const maxSize = maxSizes[documentType];
  return maxSize !== undefined && sizeInBytes <= maxSize;
};