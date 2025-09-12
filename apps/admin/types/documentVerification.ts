// apps/admin/src/types/documentVerification.ts

import { DocumentStatus, DocumentType } from '@newcondo/db'

export interface DocumentVerificationItem {
  id: string
  userId: string
  propertyId?: string
  documentType: DocumentType
  documentNumber?: string
  fileName?: string
  fileUrl?: string
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
    phone?: string
    role: string
    verificationStatus: string
  }
  property?: {
    id: string
    title: string
    address: string
    status: string
  }
  verificationHistory: DocumentVerificationHistory[]
}

export interface DocumentVerificationHistory {
  id: string
  documentId: string
  adminId: string
  action: VerificationAction
  previousStatus: DocumentStatus
  newStatus: DocumentStatus
  notes?: string
  timestamp: Date
  admin: {
    id: string
    name?: string
    email: string
  }
}

export interface DocumentVerificationQueue {
  pending: DocumentVerificationItem[]
  inReview: DocumentVerificationItem[]
  requiresAttention: DocumentVerificationItem[]
  total: number
  averageProcessingTime: number
}

export interface DocumentVerificationStats {
  totalProcessed: number
  pendingCount: number
  approvedToday: number
  rejectedToday: number
  averageProcessingTime: number
  processingTimeByType: Record<DocumentType, number>
  verificationRates: {
    daily: VerificationRateData[]
    weekly: VerificationRateData[]
    monthly: VerificationRateData[]
  }
  adminPerformance: AdminPerformanceMetrics[]
}

export interface VerificationRateData {
  period: string
  approved: number
  rejected: number
  pending: number
  total: number
  rate: number
}

export interface AdminPerformanceMetrics {
  adminId: string
  adminName: string
  totalProcessed: number
  averageTime: number
  approvalRate: number
  accuracy: number
}

export interface DocumentVerificationFilters {
  status?: DocumentStatus[]
  documentType?: DocumentType[]
  assignedTo?: string[]
  priority?: VerificationPriority[]
  dateRange?: {
    from: Date
    to: Date
  }
  userRole?: string[]
  requiresUrgentAttention?: boolean
  hasProperty?: boolean
}

export interface DocumentVerificationBulkAction {
  action: 'approve' | 'reject' | 'assign' | 'prioritize'
  documentIds: string[]
  assignTo?: string
  priority?: VerificationPriority
  reason?: string
  notes?: string
}

export interface VerificationWorkflow {
  id: string
  name: string
  documentTypes: DocumentType[]
  steps: VerificationStep[]
  autoApprovalRules?: AutoApprovalRule[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VerificationStep {
  id: string
  name: string
  description: string
  order: number
  isRequired: boolean
  estimatedTime: number // in minutes
  assigneeRole?: string
  checkpoints: VerificationCheckpoint[]
}

export interface VerificationCheckpoint {
  id: string
  name: string
  description: string
  type: 'manual' | 'automatic'
  criteria: CheckpointCriteria[]
  isBlocking: boolean
}

export interface CheckpointCriteria {
  field: string
  operator: 'equals' | 'contains' | 'regex' | 'exists' | 'not_exists'
  value: any
  message: string
}

export interface AutoApprovalRule {
  id: string
  name: string
  conditions: AutoApprovalCondition[]
  action: 'approve' | 'flag' | 'reject'
  confidence: number // 0-100
  isActive: boolean
}

export interface AutoApprovalCondition {
  field: string
  operator: string
  value: any
  weight: number
}

export interface DocumentVerificationAssignment {
  documentId: string
  adminId: string
  assignedAt: Date
  dueDate: Date
  priority: VerificationPriority
  notes?: string
}

export interface VerificationQualityMetrics {
  accuracy: number
  consistency: number
  speed: number
  thoroughness: number
  overallScore: number
  improvements: string[]
}

export type VerificationAction = 
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED'
  | 'ARCHIVED'
  | 'FLAGGED'

export type VerificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type DocumentVerificationTab = 'pending' | 'in-review' | 'completed' | 'flagged'