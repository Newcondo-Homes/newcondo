// backend/shared/src/types/legalDocuments.ts

import { DocumentType, DocumentStatus, DocumentSide, Role } from '@newcondo/db';

// Document Template Types
export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  category: DocumentCategory;
  version: string;
  content: string; // HTML template content
  variables: TemplateVariable[];
  isActive: boolean;
  requiredForRoles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'TEXT' | 'DATE' | 'NUMBER' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'BOOLEAN';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export enum DocumentCategory {
  IDENTITY = 'IDENTITY',
  PROPERTY = 'PROPERTY',
  LEGAL = 'LEGAL',
  BUSINESS = 'BUSINESS',
  CONSENT = 'CONSENT',
  UNDERTAKING = 'UNDERTAKING',
  COMPLIANCE = 'COMPLIANCE'
}

// Document Processing Types
export interface DocumentSubmission {
  id: string;
  userId: string;
  propertyId?: string;
  documentType: DocumentType;
  submissionData: DocumentSubmissionData;
  status: SubmissionStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSubmissionData {
  templateId?: string;
  templateVariables?: Record<string, any>;
  fileUrl?: string;
  fileName?: string;
  documentNumber?: string;
  metadata?: DocumentMetadata;
  signatures?: DocumentSignature[];
}

export interface DocumentMetadata {
  fileSize?: number;
  mimeType?: string;
  pageCount?: number;
  extractedText?: string;
  ocrConfidence?: number;
  checksums?: {
    md5: string;
    sha256: string;
  };
}

export interface DocumentSignature {
  signatureId: string;
  signerUserId: string;
  signerName: string;
  signerRole: Role;
  signedAt: Date;
  signatureImageBase64?: string;
  signatureHash?: string;
  ipAddress?: string;
}

export interface DocumentVerificationRequest {
  documentId: string;
  adminId: string;
  status: DocumentStatus;
  rejectionReason?: string;
  notes?: string;
}

// Admin-specific types for review queue
export interface DocumentReviewQueueItem {
  id: string;
  documentType: DocumentType;
  submittedBy: {
    userId: string;
    name: string;
    email: string;
  };
  submittedForProperty?: {
    propertyId: string;
    title: string;
  };
  submittedAt: Date;
  status: DocumentStatus;
}

export interface DocumentReviewMetrics {
  totalPending: number;
  pendingByType: Record<DocumentType, number>;
  averageReviewTime: number; // in hours
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  VERIFICATION_IN_PROGRESS = 'VERIFICATION_IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}