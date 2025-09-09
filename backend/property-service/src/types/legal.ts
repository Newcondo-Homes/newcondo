// backend/property-service/src/types/legal.ts

export interface LegalDocument {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: DocumentStatus;
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  // Identity Documents
  NIN = 'NIN',
  BVN = 'BVN', 
  PASSPORT = 'PASSPORT',
  VOTERS_CARD = 'VOTERS_CARD',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  
  // Selfie
  SELFIE = 'SELFIE',
  
  // Property Documents
  OWNERSHIP_DOCUMENT = 'OWNERSHIP_DOCUMENT',
  CONSENT_DOCUMENT = 'CONSENT_DOCUMENT',
  UNDERTAKING_DOCUMENT = 'UNDERTAKING_DOCUMENT',
  
  // Business Documents
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  TAX_CERTIFICATE = 'TAX_CERTIFICATE',
  
  // Utility Documents
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT',
  
  OTHER = 'OTHER'
}

export enum DocumentSide {
  FRONT = 'FRONT',
  BACK = 'BACK',
  SINGLE = 'SINGLE'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface LegalComplianceCheck {
  userId: string;
  propertyId?: string;
  hasOwnershipProof: boolean;
  hasConsentDocument: boolean;
  hasUndertaking: boolean;
  hasTermsAcceptance: boolean;
  hasPrivacyAcceptance: boolean;
  identityVerified: boolean;
  missingDocuments: DocumentType[];
  complianceScore: number; // 0-100
  isCompliant: boolean;
}

export interface DocumentUploadRequest {
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  propertyId?: string;
  isRequired?: boolean;
}

export interface DocumentVerificationRequest {
  documentId: string;
  status: DocumentStatus;
  verificationNotes?: string;
  adminId: string;
}

export interface LegalTemplate {
  id: string;
  name: string;
  type: 'TERMS' | 'PRIVACY' | 'CONSENT' | 'UNDERTAKING';
  content: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalSignature {
  id: string;
  userId: string;
  documentId: string;
  signatureData: string; // Base64 encoded signature
  ipAddress: string;
  userAgent: string;
  signedAt: Date;
  isValid: boolean;
}

export interface ComplianceReport {
  totalUsers: number;
  compliantUsers: number;
  pendingDocuments: number;
  expiredDocuments: number;
  rejectedDocuments: number;
  complianceRate: number;
  documentTypeStats: Record<DocumentType, number>;
}

export interface DocumentValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: DocumentValidationError[];
  warnings?: string[];
}

// API Response Types
export interface DocumentListResponse {
  documents: LegalDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface ComplianceCheckResponse {
  compliance: LegalComplianceCheck;
  nextSteps: string[];
  urgentActions: string[];
}

export interface TemplateResponse {
  template: LegalTemplate;
  acceptanceRequired: boolean;
  previouslyAccepted: boolean;
}

// Request/Response interfaces for API endpoints
export interface CreateDocumentRequest {
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  propertyId?: string;
  isRequired?: boolean;
}

export interface UpdateDocumentRequest {
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  expiresAt?: Date;
}

export interface BulkDocumentUploadRequest {
  documents: CreateDocumentRequest[];
  propertyId?: string;
}

export interface DocumentSearchQuery {
  userId?: string;
  propertyId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  isRequired?: boolean;
  expiringBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

export const DOCUMENT_MIME_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp'
} as const;

export const DOCUMENT_MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  PDF: 10 * 1024 * 1024,  // 10MB
} as const;

export const REQUIRED_DOCUMENTS_BY_USER_TYPE = {
  OWNER: [DocumentType.NIN, DocumentType.SELFIE, DocumentType.OWNERSHIP_DOCUMENT],
  AGENT: [DocumentType.NIN, DocumentType.SELFIE, DocumentType.CONSENT_DOCUMENT, DocumentType.UNDERTAKING_DOCUMENT],
  PROPERTY_MANAGER: [DocumentType.NIN, DocumentType.SELFIE, DocumentType.BUSINESS_REGISTRATION, DocumentType.TAX_CERTIFICATE],
  RENTER: [DocumentType.NIN, DocumentType.SELFIE]
} as const;