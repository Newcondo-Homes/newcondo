// backend/admin-service/src/types/propertyApproval.ts

export interface PropertyApprovalRequest {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  
  // Property Details
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  propertyType: string;
  price?: number;
  totalUnits?: number;
  availableUnits?: number;
  
  // Location
  address: string;
  city: string;
  state: string;
  gpsCoordinates?: { lat: number; lng: number };
  
  // Boundary Information
  boundaryCoordinates?: any;
  boundaryVerified: boolean;
  boundaryImages: string[];
  buildingFingerprint?: string;
  
  // Owner/Agent Info
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  agentId?: string;
  agentName?: string;
  isOwnerListing: boolean;
  
  // Documents
  documents: PropertyDocument[];
  
  // Images
  images: PropertyImage[];
  
  // Status
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface PropertyDocument {
  id: string;
  documentType: 'OWNERSHIP_DOCUMENT' | 'CONSENT_DOCUMENT' | 'UNDERTAKING_DOCUMENT';
  fileUrl: string;
  fileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: Date;
}

export interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyApprovalAction {
  propertyId: string;
  adminId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
  notes?: string;
}

export interface BulkPropertyApprovalRequest {
  propertyIds: string[];
  adminId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface PropertyApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvedToday: number;
  pendingOverThreeDays: number;
  averageReviewTime: number; // in hours
}

export interface PropertyValidationCheck {
  propertyId: string;
  isValid: boolean;
  checks: {
    hasValidLocation: boolean;
    hasRequiredDocuments: boolean;
    hasImages: boolean;
    hasBoundary: boolean;
    noDuplicates: boolean;
    ownerVerified: boolean;
  };
  issues: string[];
  warnings: string[];
}

export interface PropertyApprovalHistory {
  id: string;
  propertyId: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED';
  performedBy?: string;
  details: string;
  timestamp: Date;
}

export interface PropertyFlags {
  propertyId: string;
  flags: {
    possibleDuplicate: boolean;
    missingDocuments: boolean;
    suspiciousLocation: boolean;
    unverifiedOwner: boolean;
    boundaryIssue: boolean;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}