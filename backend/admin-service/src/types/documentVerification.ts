// backend/admin-service/src/types/documentVerification.ts

import { DocumentType, DocumentStatus, DocumentSide } from '@newcondo/db';

export interface DocumentVerificationRequest {
  documentId: string;
  action: 'approve' | 'reject';
  verificationNotes?: string;
  adminId: string;
}

export interface BulkDocumentVerificationRequest {
  documentIds: string[];
  action: 'approve' | 'reject';
  verificationNotes?: string;
  adminId: string;
}

export interface DocumentVerificationQuery {
  status?: DocumentStatus;
  documentType?: DocumentType;
  userId?: string;
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'documentType';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentVerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
  byType: Record<DocumentType, {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }>;
  averageProcessingTime: number; // in hours
  oldestPendingDocument?: {
    id: string;
    createdAt: Date;
    daysPending: number;
  };
}

export interface DocumentWithUserInfo {
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
  user: {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    verificationStatus: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface DocumentVerificationActivity {
  id: string;
  documentId: string;
  adminId: string;
  action: 'approved' | 'rejected' | 'requested_reupload';
  previousStatus: DocumentStatus;
  newStatus: DocumentStatus;
  notes?: string;
  timestamp: Date;
  admin: {
    id: string;
    name?: string;
    email: string;
  };
  document: {
    documentType: DocumentType;
    fileName?: string;
    user: {
      name?: string;
      email: string;
    };
  };
}

export interface ComplianceReport {
  userId: string;
  userEmail: string;
  userName?: string;
  userType: string;
  verificationStatus: string;
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  missingRequiredDocuments: string[]; // Document types that are required but missing
  complianceScore: number; // Percentage of required documents approved
  lastDocumentUpdate: Date;
  properties?: {
    id: string;
    title: string;
    documentsStatus: 'compliant' | 'pending' | 'incomplete';
  }[];
}

export interface DocumentTemplate {
  id: string;
  documentType: DocumentType;
  name: string;
  description: string;
  templateUrl?: string;
  isRequired: boolean;
  applicableUserTypes: string[];
  expirationMonths?: number; // How many months until document expires
  requirements: string[]; // List of requirements for this document
  examples: string[]; // URLs to example documents
}

export interface LegalComplianceSettings {
  requiredDocuments: {
    userType: string;
    documentTypes: DocumentType[];
  }[];
  verificationTimeframes: {
    standard: number; // days
    priority: number; // days
    urgent: number; // days
  };
  autoReminderSchedule: {
    firstReminder: number; // days after upload
    secondReminder: number;
    finalReminder: number;
  };
  documentExpirationWarning: number; // days before expiration to warn
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
}