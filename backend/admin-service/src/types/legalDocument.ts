// backend/admin-service/src/types/legalDocument.ts

export interface LegalDocument {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: LegalDocumentType;
  title: string;
  description?: string;
  
  // File details
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  
  // Legal compliance
  isTemplate: boolean;
  templateVersion?: string;
  requiresSignature: boolean;
  hasDigitalSignature: boolean;
  signatureUrl?: string;
  
  // Verification
  status: LegalDocumentStatus;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Compliance tracking
  complianceChecks: ComplianceCheck[];
  legalUndertaking?: LegalUndertaking;
  
  // Metadata
  expiresAt?: Date;
  isRequired: boolean;
  displayOrder: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum LegalDocumentType {
  // Property ownership documents
  CERTIFICATE_OF_OCCUPANCY = 'CERTIFICATE_OF_OCCUPANCY',
  DEED_OF_ASSIGNMENT = 'DEED_OF_ASSIGNMENT',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  GOVERNORS_CONSENT = 'GOVERNORS_CONSENT',
  SURVEY_PLAN = 'SURVEY_PLAN',
  
  // Consent and permission documents
  OWNER_CONSENT_FORM = 'OWNER_CONSENT_FORM',
  AGENT_AUTHORIZATION = 'AGENT_AUTHORIZATION',
  PROPERTY_MANAGEMENT_AGREEMENT = 'PROPERTY_MANAGEMENT_AGREEMENT',
  LANDLORD_CONSENT = 'LANDLORD_CONSENT',
  
  // Legal undertakings
  LIABILITY_UNDERTAKING = 'LIABILITY_UNDERTAKING',
  ACCURACY_UNDERTAKING = 'ACCURACY_UNDERTAKING',
  COMPLIANCE_UNDERTAKING = 'COMPLIANCE_UNDERTAKING',
  INDEMNITY_AGREEMENT = 'INDEMNITY_AGREEMENT',
  
  // Terms and policies
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_PROCESSING_AGREEMENT = 'DATA_PROCESSING_AGREEMENT',
  USER_AGREEMENT = 'USER_AGREEMENT',
  
  // Business documents
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  TAX_IDENTIFICATION = 'TAX_IDENTIFICATION',
  
  // Other legal documents
  AFFIDAVIT = 'AFFIDAVIT',
  STATUTORY_DECLARATION = 'STATUTORY_DECLARATION',
  OTHER = 'OTHER'
}

export enum LegalDocumentStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REQUIRES_SIGNATURE = 'REQUIRES_SIGNATURE',
  SIGNED = 'SIGNED'
}

export interface ComplianceCheck {
  id: string;
  checkType: ComplianceCheckType;
  status: ComplianceStatus;
  description: string;
  performedBy?: string;
  performedAt: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export enum ComplianceCheckType {
  DOCUMENT_AUTHENTICITY = 'DOCUMENT_AUTHENTICITY',
  LEGAL_VALIDITY = 'LEGAL_VALIDITY',
  SIGNATURE_VERIFICATION = 'SIGNATURE_VERIFICATION',
  CONTENT_REVIEW = 'CONTENT_REVIEW',
  FORMAT_COMPLIANCE = 'FORMAT_COMPLIANCE',
  EXPIRY_CHECK = 'EXPIRY_CHECK',
  OWNERSHIP_VERIFICATION = 'OWNERSHIP_VERIFICATION',
  CONSENT_VALIDATION = 'CONSENT_VALIDATION',
  UNDERTAKING_REVIEW = 'UNDERTAKING_REVIEW'
}

export enum ComplianceStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
  PENDING = 'PENDING'
}

export interface LegalUndertaking {
  id: string;
  type: UndertakingType;
  content: string;
  isAccepted: boolean;
  acceptedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  witnessName?: string;
  witnessContact?: string;
  digitalSignatureRequired: boolean;
}

export enum UndertakingType {
  LIABILITY = 'LIABILITY',
  ACCURACY = 'ACCURACY',
  COMPLIANCE = 'COMPLIANCE',
  INDEMNITY = 'INDEMNITY',
  OWNERSHIP_CONFIRMATION = 'OWNERSHIP_CONFIRMATION',
  AGENT_AUTHORIZATION = 'AGENT_AUTHORIZATION'
}

// Request/Response DTOs
export interface CreateLegalDocumentRequest {
  userId: string;
  propertyId?: string;
  documentType: LegalDocumentType;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  requiresSignature: boolean;
  isRequired?: boolean;
  expiresAt?: Date;
}

export interface UpdateLegalDocumentRequest {
  title?: string;
  description?: string;
  status?: LegalDocumentStatus;
  verificationNotes?: string;
  requiresSignature?: boolean;
  expiresAt?: Date;
}

export interface LegalDocumentFilter {
  userId?: string;
  propertyId?: string;
  documentType?: LegalDocumentType;
  status?: LegalDocumentStatus;
  isRequired?: boolean;
  requiresSignature?: boolean;
  hasExpired?: boolean;
  verifiedBy?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface LegalDocumentResponse extends LegalDocument {
  user: {
    id: string;
    name: string;
    email: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
}

export interface ComplianceReport {
  documentId: string;
  overallStatus: ComplianceStatus;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  pendingChecks: number;
  checks: ComplianceCheck[];
  lastUpdated: Date;
}

export interface LegalDocumentTemplate {
  id: string;
  documentType: LegalDocumentType;
  title: string;
  content: string;
  variables: TemplateVariable[];
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'number' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: string;
}