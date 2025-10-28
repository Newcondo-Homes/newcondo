// backend/admin-service/src/types/boundaryDispute.ts

export interface BoundaryDispute {
  id: string;
  
  // Properties involved
  originalPropertyId: string;
  originalPropertyTitle: string;
  originalOwnerId: string;
  originalOwnerName: string;
  
  disputingPropertyId?: string;
  disputingPropertyTitle?: string;
  disputingOwnerId?: string;
  disputingOwnerName?: string;
  
  // Dispute Details
  disputeType: DisputeType;
  description: string;
  evidence: DisputeEvidence[];
  
  // Boundary Data
  originalBoundary?: any; // GeoJSON
  disputingBoundary?: any; // GeoJSON
  overlapArea?: number; // in square meters
  overlapPercentage?: number;
  
  // Status
  status: DisputeStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Resolution
  resolution?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timestamps
  reportedAt: Date;
  lastUpdatedAt: Date;
}

export enum DisputeType {
  BOUNDARY_OVERLAP = 'BOUNDARY_OVERLAP',
  DUPLICATE_PROPERTY = 'DUPLICATE_PROPERTY',
  INCORRECT_BOUNDARY = 'INCORRECT_BOUNDARY',
  OWNERSHIP_CONFLICT = 'OWNERSHIP_CONFLICT',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
}

export enum DisputeStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REQUIRES_EVIDENCE = 'REQUIRES_EVIDENCE',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  ESCALATED = 'ESCALATED',
}

export interface DisputeEvidence {
  id: string;
  type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'COORDINATES' | 'OTHER';
  url?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface BoundaryDisputeResolution {
  disputeId: string;
  adminId: string;
  resolution: DisputeResolutionAction;
  notes: string;
  actionsTaken: DisputeAction[];
}

export enum DisputeResolutionAction {
  APPROVE_ORIGINAL = 'APPROVE_ORIGINAL',
  APPROVE_DISPUTING = 'APPROVE_DISPUTING',
  REJECT_BOTH = 'REJECT_BOTH',
  REQUIRE_REBOUNDARY = 'REQUIRE_REBOUNDARY',
  MERGE_PROPERTIES = 'MERGE_PROPERTIES',
  DISMISS = 'DISMISS',
}

export interface DisputeAction {
  type: 'SUSPEND_PROPERTY' | 'NOTIFY_USER' | 'REQUEST_DOCUMENTS' | 'UPDATE_BOUNDARY' | 'DELETE_PROPERTY';
  targetId: string;
  details: string;
}

export interface BoundaryDisputeStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  dismissed: number;
  averageResolutionTime: number; // in hours
  openOverSevenDays: number;
}

export interface BoundaryAnalysis {
  disputeId: string;
  overlapArea: number;
  overlapPercentage: number;
  boundaryAccuracy: number;
  similarityScore: number;
  recommendations: string[];
  visualComparison: {
    overlayImageUrl?: string;
    differences: string[];
  };
}

export interface DisputeEscalation {
  disputeId: string;
  escalatedBy: string;
  reason: string;
  priority: 'HIGH' | 'URGENT';
  requiredAction: string;
  escalatedAt: Date;
}

export interface DisputeNotification {
  disputeId: string;
  recipients: string[]; // User IDs
  type: 'DISPUTE_CREATED' | 'DISPUTE_UPDATED' | 'DISPUTE_RESOLVED' | 'ACTION_REQUIRED';
  message: string;
  sendEmail: boolean;
  sendSMS: boolean;
  sendInApp: boolean;
}