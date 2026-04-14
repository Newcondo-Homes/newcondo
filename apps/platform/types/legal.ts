import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db'

export interface LegalDocument {
  id: string
  userId: string
  propertyId?: string
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  documentNumber?: string
  fileName?: string
  fileUrl?: string
  fileSizeBytes?: number
  mimeType?: string
  status: DocumentStatus
  verificationNotes?: string
  isRequired: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

export interface CreateLegalDocumentPayload {
  documentType: DocumentType;
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  file?: File;
  propertyId?: string;
  isRequired?: boolean;
  expiresAt?: Date;
}

export interface UpdateLegalDocumentPayload {
  documentSide?: DocumentSide;
  pageNumber?: number;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  verificationNotes?: string;
  isRequired?: boolean;
  expiresAt?: Date;
}

export interface LegalDocumentUpload {
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  documentNumber?: string
  file?: File
  propertyId?: string
  isRequired?: boolean
  expiresAt?: Date
}

export interface ConsentDocument {
  id: string
  propertyId: string
  ownerId: string
  agentId: string
  documentUrl: string
  status: DocumentStatus
  signedAt?: Date
  expiresAt?: Date
  createdAt: Date
}

export interface LegalUndertaking {
  id: string
  userId: string
  propertyId?: string
  undertakingType: UndertakingType
  documentUrl?: string
  isAccepted: boolean
  acceptedAt?: Date
  ipAddress?: string
  userAgent?: string
  digitalSignature?: string
  witnessSignature?: string
  createdAt: Date
}

export interface DigitalSignature {
  id: string
  userId: string
  documentId: string
  signatureData: string // Base64 signature image
  signatureMethod: SignatureMethod
  ipAddress: string
  userAgent: string
  timestamp: Date
  isValid: boolean
  witnessId?: string
  witnessSignature?: string
}

export interface LegalTemplate {
  id: string
  templateType: TemplateType
  title: string
  content: string
  version: string
  isActive: boolean
  requiresSignature: boolean
  expiryDays?: number
  applicableRoles: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceCheckResult {
  isCompliant: boolean
  missingDocuments: DocumentType[]
  expiredDocuments: LegalDocument[]
  pendingVerifications: LegalDocument[]
  requiredActions: ComplianceAction[]
  complianceScore: number
  lastChecked: Date
}

export interface OwnershipProof {
  id: string
  propertyId: string
  ownerId: string
  documentType: OwnershipDocumentType
  documentUrl: string
  verificationStatus: DocumentStatus
  verifiedBy?: string
  verifiedAt?: Date
  expiresAt?: Date
  createdAt: Date
}

export interface AgentPermission {
  id: string
  propertyId: string
  ownerId: string
  agentId: string
  permissionType: PermissionType
  permissions: AgentPermissionScope[]
  documentUrl?: string
  status: DocumentStatus
  grantedAt?: Date
  expiresAt?: Date
  revokedAt?: Date
  createdAt: Date
}

// Enums
export enum UndertakingType {
  PROPERTY_LISTING = 'PROPERTY_LISTING',
  AGENT_AGREEMENT = 'AGENT_AGREEMENT',
  RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
  TERMS_CONDITIONS = 'TERMS_CONDITIONS',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_PROCESSING = 'DATA_PROCESSING'
}

export enum SignatureMethod {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  ELECTRONIC_SIGNATURE = 'ELECTRONIC_SIGNATURE',
  CHECKBOX_ACCEPTANCE = 'CHECKBOX_ACCEPTANCE',
  SMS_VERIFICATION = 'SMS_VERIFICATION'
}

export enum TemplateType {
  CONSENT_DOCUMENT = 'CONSENT_DOCUMENT',
  OWNERSHIP_PROOF = 'OWNERSHIP_PROOF',
  AGENT_AGREEMENT = 'AGENT_AGREEMENT',
  RENTAL_AGREEMENT = 'RENTAL_AGREEMENT',
  UNDERTAKING = 'UNDERTAKING',
  TERMS_CONDITIONS = 'TERMS_CONDITIONS',
  PRIVACY_POLICY = 'PRIVACY_POLICY'
}

export enum OwnershipDocumentType {
  CERTIFICATE_OF_OCCUPANCY = 'CERTIFICATE_OF_OCCUPANCY',
  DEED_OF_ASSIGNMENT = 'DEED_OF_ASSIGNMENT',
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  SURVEY_PLAN = 'SURVEY_PLAN',
  BUILDING_PLAN_APPROVAL = 'BUILDING_PLAN_APPROVAL',
  TAX_CLEARANCE = 'TAX_CLEARANCE'
}

export enum PermissionType {
  LISTING_PERMISSION = 'LISTING_PERMISSION',
  RENTAL_PERMISSION = 'RENTAL_PERMISSION',
  MAINTENANCE_PERMISSION = 'MAINTENANCE_PERMISSION',
  FULL_MANAGEMENT = 'FULL_MANAGEMENT'
}

export enum AgentPermissionScope {
  LIST_PROPERTY = 'LIST_PROPERTY',
  SHOW_PROPERTY = 'SHOW_PROPERTY',
  NEGOTIATE_RENT = 'NEGOTIATE_RENT',
  COLLECT_RENT = 'COLLECT_RENT',
  SIGN_AGREEMENTS = 'SIGN_AGREEMENTS',
  HANDLE_MAINTENANCE = 'HANDLE_MAINTENANCE',
  MODIFY_LISTING = 'MODIFY_LISTING'
}

export enum ComplianceAction {
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  VERIFY_IDENTITY = 'VERIFY_IDENTITY',
  SIGN_UNDERTAKING = 'SIGN_UNDERTAKING',
  ACCEPT_TERMS = 'ACCEPT_TERMS',
  RENEW_DOCUMENT = 'RENEW_DOCUMENT',
  PROVIDE_CONSENT = 'PROVIDE_CONSENT'
}

// API Response Types
export interface LegalDocumentResponse {
  success: boolean
  data: LegalDocument
  message?: string
}

export interface LegalDocumentListResponse {
  success: boolean
  data: LegalDocument[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  message?: string
}

export interface ComplianceStatusResponse {
  success: boolean
  data: ComplianceCheckResult
  message?: string
}

export interface DigitalSignatureResponse {
  success: boolean
  data: DigitalSignature
  message?: string
}

export interface LegalTemplateResponse {
  success: boolean
  data: LegalTemplate
  message?: string
}

// Form Types
export interface LegalDocumentFormData {
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  documentNumber?: string
  file?: File
  propertyId?: string
  expiresAt?: string
}

export interface UndertakingFormData {
  undertakingType: UndertakingType
  propertyId?: string
  isAccepted: boolean
  digitalSignature?: string
  witnessId?: string
}

export interface ConsentFormData {
  propertyId: string
  agentId: string
  documentFile?: File
  expiresAt?: string
}

export interface DigitalSignatureFormData {
  documentId: string
  signatureData: string
  witnessId?: string
  witnessSignature?: string
}

// Filter and Search Types
export interface LegalDocumentFilter {
  documentType?: DocumentType
  status?: DocumentStatus
  propertyId?: string
  isRequired?: boolean
  expiresWithin?: number // days
  createdAfter?: Date
  createdBefore?: Date
}

export interface ComplianceFilter {
  userId?: string
  propertyId?: string
  role?: string
  complianceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'
  hasExpiredDocuments?: boolean
  hasPendingVerifications?: boolean
}

// Notification Types
export interface LegalNotification {
  id: string
  type: LegalNotificationType
  title: string
  message: string
  documentId?: string
  propertyId?: string
  expiresAt?: Date
  isRead: boolean
  createdAt: Date
}

export enum LegalNotificationType {
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  DOCUMENT_EXPIRED = 'DOCUMENT_EXPIRED',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
  COMPLIANCE_WARNING = 'COMPLIANCE_WARNING',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  SIGNATURE_REQUIRED = 'SIGNATURE_REQUIRED'
}