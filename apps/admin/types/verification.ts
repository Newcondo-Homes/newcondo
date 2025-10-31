/**
 * Admin Dashboard - Verification Types
 * Location: apps/admin/src/types/verification.ts
 */

export enum DocumentType {
  // Identity Documents
  NIN = "NIN",
  BVN = "BVN",
  PASSPORT = "PASSPORT",
  VOTERS_CARD = "VOTERS_CARD",
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  
  // Selfie
  SELFIE = "SELFIE",
  
  // Property Documents
  OWNERSHIP_DOCUMENT = "OWNERSHIP_DOCUMENT",
  CONSENT_DOCUMENT = "CONSENT_DOCUMENT",
  UNDERTAKING_DOCUMENT = "UNDERTAKING_DOCUMENT",
  
  // Business Documents
  BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION",
  TAX_CERTIFICATE = "TAX_CERTIFICATE",
  
  // Utility Documents
  UTILITY_BILL = "UTILITY_BILL",
  BANK_STATEMENT = "BANK_STATEMENT",
  
  OTHER = "OTHER",
}

export enum DocumentSide {
  FRONT = "FRONT",
  BACK = "BACK",
  SINGLE = "SINGLE",
}

export enum DocumentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface Document {
  id: string;
  userId: string;
  propertyId: string | null;
  
  // Classification
  documentType: DocumentType;
  documentSide: DocumentSide | null;
  pageNumber: number | null;
  
  // Document ID/Number
  documentNumber: string | null;
  
  // File Details
  fileName: string | null;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  
  // Status & Verification
  status: DocumentStatus;
  verificationNotes: string | null;
  
  // Metadata
  isRequired: boolean;
  expiresAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  userType: string | null;
  
  // Verification Status
  verificationStatus: string;
  submittedAt: Date;
  
  // Documents
  documents: Document[];
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  
  // Previous Rejections
  previousRejections: number;
  lastRejectionReason: string | null;
}

export interface VerificationAction {
  userId: string;
  action: "approve" | "reject";
  documentIds?: string[]; // Specific documents to approve/reject
  reason?: string;
  notes?: string;
  verifiedBy: string;
}

export interface DocumentReview {
  documentId: string;
  action: "approve" | "reject";
  reason?: string;
  notes?: string;
}

export interface BulkVerificationAction {
  userIds: string[];
  action: "approve" | "reject";
  reason?: string;
  notes?: string;
}

export interface VerificationFilters {
  search?: string;
  status?: DocumentStatus;
  documentType?: DocumentType;
  userRole?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface VerificationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageProcessingTime: number; // hours
  todayProcessed: number;
  thisWeekProcessed: number;
  thisMonthProcessed: number;
}

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  documentType: DocumentType;
  documentNumber: string | null;
  expiryDate: Date | null;
  isExpired: boolean;
}

export interface VerificationTimeline {
  id: string;
  userId: string;
  action: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface VerificationQueueItem {
  userId: string;
  userName: string | null;
  userEmail: string;
  submittedAt: Date;
  documentCount: number;
  priority: "low" | "normal" | "high" | "urgent";
  estimatedReviewTime: number; // minutes
}