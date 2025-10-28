// backend/admin-service/src/types/verification.ts

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userType: 'LANDLORD' | 'PROPERTY_MANAGER' | 'AGENT' | 'RENTER';
  
  // Documents
  documents: VerificationDocument[];
  
  // Status
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  documentSide?: 'FRONT' | 'BACK' | 'SINGLE';
  documentNumber?: string; // For ID-only documents
  fileUrl?: string;
  fileName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  uploadedAt: Date;
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
  
  OTHER = 'OTHER',
}

export interface VerificationApprovalRequest {
  userId: string;
  adminId: string;
  notes?: string;
}

export interface VerificationRejectionRequest {
  userId: string;
  adminId: string;
  reason: string;
  documentsToReject: string[]; // Document IDs
}

export interface BulkVerificationRequest {
  userIds: string[];
  adminId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  verifiedToday: number;
  pendingOverThreeDays: number;
  averageReviewTime: number; // in hours
}

export interface DocumentVerificationCheck {
  documentId: string;
  isValid: boolean;
  checks: {
    hasRequiredFields: boolean;
    isNotExpired: boolean;
    isReadable: boolean;
    matchesUserInfo: boolean;
  };
  issues: string[];
}

export interface VerificationHistory {
  id: string;
  userId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED';
  performedBy?: string;
  details: string;
  timestamp: Date;
}