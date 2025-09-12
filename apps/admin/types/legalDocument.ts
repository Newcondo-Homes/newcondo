// apps/admin/src/types/legalDocument.ts

import { DocumentType, DocumentStatus } from '@newcondo/db'

export interface LegalDocument {
  id: string
  userId: string
  propertyId?: string
  documentType: DocumentType
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
  user: {
    id: string
    name?: string
    email: string
    role: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
}

export interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  description: string
  content: string // HTML template content
  isActive: boolean
  version: string
  requiresSignature: boolean
  fields: TemplateField[]
  createdAt: Date
  updatedAt: Date
}

export interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'date' | 'signature' | 'checkbox' | 'select'
  required: boolean
  placeholder?: string
  options?: string[] // For select fields
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface DocumentBulkAction {
  action: 'approve' | 'reject' | 'archive' | 'delete'
  documentIds: string[]
  reason?: string
  notes?: string
}

export interface DocumentFilter {
  status?: DocumentStatus[]
  documentType?: DocumentType[]
  userId?: string
  propertyId?: string
  dateRange?: {
    from: Date
    to: Date
  }
  isExpiring?: boolean
  requiresAction?: boolean
}

export interface DocumentSearchParams {
  query?: string
  filters: DocumentFilter
  sortBy: 'createdAt' | 'updatedAt' | 'expiresAt' | 'status'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export interface DocumentVerificationAction {
  documentId: string
  action: 'approve' | 'reject'
  notes?: string
  adminId: string
}

export interface ComplianceMetrics {
  totalDocuments: number
  pendingVerification: number
  approvedDocuments: number
  rejectedDocuments: number
  expiredDocuments: number
  complianceRate: number
  averageProcessingTime: number
  documentsByType: Record<DocumentType, number>
  documentsByStatus: Record<DocumentStatus, number>
  trendsData: {
    date: string
    total: number
    approved: number
    rejected: number
    pending: number
  }[]
}

export interface DigitalSignatureRequest {
  documentId: string
  signerEmail: string
  signerName: string
  templateId?: string
  fields: Record<string, any>
  expiresAt: Date
}

export interface DigitalSignature {
  id: string
  documentId: string
  signerEmail: string
  signerName: string
  signedAt: Date
  ipAddress: string
  signatureData: string // Base64 signature image
  isValid: boolean
  metadata: Record<string, any>
}

export interface LegalDocumentStats {
  byType: Record<DocumentType, {
    total: number
    pending: number
    approved: number
    rejected: number
    expired: number
  }>
  byMonth: {
    month: string
    uploads: number
    approvals: number
    rejections: number
  }[]
  complianceScore: number
  processingTimes: {
    average: number
    median: number
    fastest: number
    slowest: number
  }
}

export type DocumentViewMode = 'list' | 'grid' | 'detailed'
export type DocumentSortField = 'createdAt' | 'updatedAt' | 'status' | 'type' | 'expiresAt'