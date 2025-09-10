import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db'

// Base document interface
export interface BaseDocument {
  id: string
  userId: string
  propertyId?: string
  documentType: DocumentType
  status: DocumentStatus
  createdAt: Date
  updatedAt: Date
}

// Document upload and file management
export interface DocumentFile {
  id: string
  fileName: string
  fileUrl: string
  fileSizeBytes: number
  mimeType: string
  uploadedAt: Date
}

export interface DocumentUpload {
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  file: File
  propertyId?: string
  documentNumber?: string
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface DocumentUploadProgress {
  documentId: string
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface DocumentUploadResponse {
  success: boolean
  data: {
    documentId: string
    fileUrl: string
    uploadUrl?: string // For direct uploads
  }
  message?: string
}

// Identity documents
export interface IdentityDocument extends BaseDocument {
  documentSide?: DocumentSide
  documentNumber?: string
  fileName?: string
  fileUrl?: string
  fileSizeBytes?: number
  mimeType?: string
  verificationNotes?: string
  isRequired: boolean
  expiresAt?: Date
}

export interface SelfieDocument extends BaseDocument {
  fileUrl: string
  fileName: string
  fileSizeBytes: number
  mimeType: string
  verificationNotes?: string
  faceMatchScore?: number
  isLivenessDetected?: boolean
}

// Property documents
export interface PropertyDocument extends BaseDocument {
  fileName: string
  fileUrl: string
  fileSizeBytes: number
  mimeType: string
  verificationNotes?: string
  isRequired: boolean
  expiresAt?: Date
  verifiedBy?: string
  verifiedAt?: Date
}

export interface OwnershipDocument extends PropertyDocument {
  ownershipType: OwnershipDocumentType
  registrationNumber?: string
  issuedDate?: Date
  expiryDate?: Date
}

export interface ConsentDocument extends PropertyDocument {
  agentId: string
  ownerId: string
  permissionScope: string[]
  signedDate?: Date
  witnessName?: string
  witnessSignature?: string
}

// Business documents
export interface BusinessDocument extends BaseDocument {
  businessName: string
  registrationNumber: string
  fileName: string
  fileUrl: string
  fileSizeBytes: number
  mimeType: string
  issuedDate?: Date
  expiryDate?: Date
  verificationNotes?: string
}

// Document verification
export interface DocumentVerification {
  id: string
  documentId: string
  verifiedBy: string
  verificationStatus: DocumentVerificationStatus
  verificationNotes?: string
  verificationScore?: number
  autoVerification?: boolean
  verifiedAt: Date
  rejectionReason?: string
}

export interface DocumentVerificationRequest {
  documentId: string
  verificationNotes?: string
  additionalInfo?: Record<string, any>
}

export interface DocumentVerificationResponse {
  success: boolean
  data: DocumentVerification
  message?: string
}

// Document validation and checks
export interface DocumentValidationResult {
  isValid: boolean
  errors: DocumentValidationError[]
  warnings: DocumentValidationWarning[]
  requirements: DocumentRequirement[]
  score: number
}

export interface DocumentValidationError {
  field: string
  message: string
  code: string
}

export interface DocumentValidationWarning {
  field: string
  message: string
  code: string
}

export interface DocumentRequirement {
  type: DocumentType
  isRequired: boolean
  description: string
  acceptedFormats: string[]
  maxSizeBytes: number
  expiryRequired: boolean
}

// Document categories and organization
export interface DocumentCategory {
  id: string
  name: string
  description: string
  documentTypes: DocumentType[]
  isRequired: boolean
  order: number
  icon?: string
}

export interface DocumentCollection {
  categoryId: string
  categoryName: string
  documents: IdentityDocument[]
  completionPercentage: number
  missingDocuments: DocumentType[]
  expiredDocuments: IdentityDocument[]
}

// Document templates and forms
export interface DocumentTemplate {
  id: string
  templateType: DocumentTemplateType
  name: string
  description: string
  fields: DocumentTemplateField[]
  isActive: boolean
  version: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentTemplateField {
  id: string
  name: string
  label: string
  type: FieldType
  isRequired: boolean
  validation?: FieldValidation
  options?: string[]
  placeholder?: string
  helpText?: string
}

export interface FieldValidation {
  pattern?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  customValidation?: string
}

// Document search and filtering
export interface DocumentSearchFilter {
  documentType?: DocumentType[]
  status?: DocumentStatus[]
  propertyId?: string
  userId?: string
  isRequired?: boolean
  hasExpiry?: boolean
  expiringWithin?: number // days
  createdAfter?: Date
  createdBefore?: Date
  verificationStatus?: DocumentVerificationStatus[]
  search?: string
}

export interface DocumentSearchResult {
  documents: IdentityDocument[]
  totalCount: number
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
  filters: DocumentSearchFilter
}

// Document analytics and insights
export interface DocumentAnalytics {
  totalDocuments: number
  documentsByType: Record<DocumentType, number>
  documentsByStatus: Record<DocumentStatus, number>
  verificationRate: number
  averageProcessingTime: number
  expiringDocuments: number
  overdueDocuments: number
  uploadTrends: DocumentUploadTrend[]
}

export interface DocumentUploadTrend {
  date: string
  uploads: number
  verifications: number
  rejections: number
}

// Document sharing and permissions
export interface DocumentShare {
  id: string
  documentId: string
  sharedBy: string
  sharedWith: string
  shareType: ShareType
  permissions: SharePermission[]
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
}

export interface DocumentAccess {
  userId: string
  documentId: string
  accessType: AccessType
  grantedAt: Date
  grantedBy: string
  expiresAt?: Date
}

// Enums
export enum DocumentVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REQUIRES_RESUBMISSION = 'REQUIRES_RESUBMISSION'
}

export enum OwnershipDocumentType {
  CERTIFICATE_OF_OCCUPANCY = 'CERTIFICATE_OF_OCCUPANCY',
  DEED_OF_ASSIGNMENT = 'DEED_OF_ASSIGNMENT',
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  SURVEY_PLAN = 'SURVEY_PLAN',
  BUILDING_PLAN_APPROVAL = 'BUILDING_PLAN_APPROVAL',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY'
}

export enum DocumentTemplateType {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  PROPERTY_OWNERSHIP = 'PROPERTY_OWNERSHIP',
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  AGENT_CONSENT = 'AGENT_CONSENT',
  RENTAL_AGREEMENT = 'RENTAL_AGREEMENT'
}

export enum FieldType {
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA',
  FILE = 'FILE',
  SIGNATURE = 'SIGNATURE'
}

export enum ShareType {
  VIEW_ONLY = 'VIEW_ONLY',
  DOWNLOAD = 'DOWNLOAD',
  VERIFY = 'VERIFY',
  TEMPORARY_ACCESS = 'TEMPORARY_ACCESS'
}

export enum SharePermission {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  SHARE = 'SHARE',
  VERIFY = 'VERIFY',
  COMMENT = 'COMMENT'
}

export enum AccessType {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
  VERIFIER = 'VERIFIER',
  TEMPORARY = 'TEMPORARY'
}

// Form types
export interface DocumentFormData {
  documentType: DocumentType
  documentSide?: DocumentSide
  pageNumber?: number
  documentNumber?: string
  file?: File
  propertyId?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface BulkDocumentUpload {
  documents: DocumentFormData[]
  propertyId?: string
  notes?: string
}

export interface DocumentUpdateData {
  documentNumber?: string
  expiresAt?: Date
  metadata?: Record<string, any>
  notes?: string
}

// API response types
export interface DocumentResponse {
  success: boolean
  data: IdentityDocument
  message?: string
}

export interface DocumentListResponse {
  success: boolean
  data: IdentityDocument[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  message?: string
}

export interface DocumentCategoriesResponse {
  success: boolean
  data: DocumentCategory[]
  message?: string
}

export interface DocumentAnalyticsResponse {
  success: boolean
  data: DocumentAnalytics
  message?: string
}

// Error types
export interface DocumentError {
  code: string
  message: string
  field?: string
  documentId?: string
}

export interface DocumentUploadError {
  fileName: string
  error: DocumentError
  retryable: boolean
}