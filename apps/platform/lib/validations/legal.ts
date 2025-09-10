import { z } from 'zod';
import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

// Legal document upload validation
export const legalDocumentUploadSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentSide: z.nativeEnum(DocumentSide).optional(),
  pageNumber: z.number().min(1).max(20).optional(),
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    { message: 'File size must be less than 10MB' }
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
    { message: 'File must be JPEG, PNG, or PDF' }
  ),
  propertyId: z.string().cuid().optional(),
});

// Document ID-only validation (for documents like NIN, BVN)
export const documentIdSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string()
    .min(1, 'Document number is required')
    .max(50, 'Document number too long')
    .regex(/^[A-Za-z0-9\-\s]+$/, 'Invalid document number format'),
  expiresAt: z.date().optional(),
});

// Consent document validation
export const consentDocumentSchema = z.object({
  propertyId: z.string().cuid(),
  ownerConsent: z.boolean().refine(val => val === true, {
    message: 'Owner consent is required'
  }),
  consentDocumentFile: z.instanceof(File).optional(),
  witnessName: z.string().min(2, 'Witness name required').optional(),
  witnessContact: z.string().min(10, 'Valid witness contact required').optional(),
  consentDate: z.date(),
});

// Legal undertaking validation
export const legalUndertakingSchema = z.object({
  propertyId: z.string().cuid().optional(),
  hasReadTerms: z.boolean().refine(val => val === true, {
    message: 'You must read and accept the terms and conditions'
  }),
  acceptsTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  acceptsPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: 'You must accept the privacy policy'
  }),
  acceptsDataProcessing: z.boolean().refine(val => val === true, {
    message: 'You must consent to data processing'
  }),
  undertakingDocument: z.instanceof(File).optional(),
  digitalSignature: z.string().min(1, 'Digital signature is required'),
  signedAt: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Agent permission document validation
export const agentPermissionSchema = z.object({
  propertyId: z.string().cuid(),
  agentId: z.string().cuid(),
  permissionType: z.enum(['LISTING', 'RENTAL_NEGOTIATION', 'FULL_MANAGEMENT']),
  permissionDocument: z.instanceof(File),
  validFrom: z.date(),
  validUntil: z.date(),
  canCollectRent: z.boolean().default(false),
  canSignContracts: z.boolean().default(false),
  commissionPercentage: z.number().min(0).max(50).optional(),
  ownerSignature: z.string().min(1, 'Owner digital signature required'),
  agentSignature: z.string().min(1, 'Agent digital signature required'),
  witnessName: z.string().min(2).optional(),
  witnessSignature: z.string().optional(),
});

// Document verification by admin
export const documentVerificationSchema = z.object({
  documentId: z.string().cuid(),
  status: z.nativeEnum(DocumentStatus),
  verificationNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional().refine(
    (reason, ctx) => {
      if (ctx.parent.status === DocumentStatus.REJECTED && !reason) {
        return false;
      }
      return true;
    },
    { message: 'Rejection reason is required when rejecting a document' }
  ),
  requiresResubmission: z.boolean().default(false),
  adminId: z.string().cuid(),
  verifiedAt: z.date().optional(),
});

// Compliance check validation
export const complianceCheckSchema = z.object({
  userId: z.string().cuid(),
  propertyId: z.string().cuid().optional(),
  requiredDocuments: z.array(z.nativeEnum(DocumentType)),
  checkType: z.enum(['USER_VERIFICATION', 'PROPERTY_LISTING', 'RENTAL_AGREEMENT']),
  strictMode: z.boolean().default(true), // Requires all documents to be approved
});

// Digital signature validation
export const digitalSignatureSchema = z.object({
  documentId: z.string().cuid(),
  signatureData: z.string().min(1, 'Signature data is required'),
  signatureType: z.enum(['CANVAS', 'TYPED', 'IMAGE']),
  signerName: z.string().min(2, 'Signer name is required'),
  signerRole: z.enum(['OWNER', 'AGENT', 'RENTER', 'WITNESS', 'ADMIN']),
  timestamp: z.date(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

// Document template validation
export const documentTemplateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  templateType: z.enum(['CONSENT', 'UNDERTAKING', 'PERMISSION', 'RENTAL_AGREEMENT']),
  content: z.string().min(50, 'Template content is required'),
  variables: z.array(z.string()).default([]), // e.g., ['OWNER_NAME', 'PROPERTY_ADDRESS']
  isActive: z.boolean().default(true),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format'),
  createdBy: z.string().cuid(),
  approvedBy: z.string().cuid().optional(),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
});

// Bulk document upload validation
export const bulkDocumentUploadSchema = z.object({
  documents: z.array(legalDocumentUploadSchema).min(1).max(20),
  propertyId: z.string().cuid().optional(),
  uploadReason: z.string().max(500).optional(),
});

// Document search/filter validation
export const documentSearchSchema = z.object({
  userId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'documentType', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for use in components
export type LegalDocumentUpload = z.infer<typeof legalDocumentUploadSchema>;
export type DocumentIdInput = z.infer<typeof documentIdSchema>;
export type ConsentDocument = z.infer<typeof consentDocumentSchema>;
export type LegalUndertaking = z.infer<typeof legalUndertakingSchema>;
export type AgentPermission = z.infer<typeof agentPermissionSchema>;
export type DocumentVerification = z.infer<typeof documentVerificationSchema>;
export type ComplianceCheck = z.infer<typeof complianceCheckSchema>;
export type DigitalSignature = z.infer<typeof digitalSignatureSchema>;
export type DocumentTemplate = z.infer<typeof documentTemplateSchema>;
export type BulkDocumentUpload = z.infer<typeof bulkDocumentUploadSchema>;
export type DocumentSearch = z.infer<typeof documentSearchSchema>;