// Mirrors schema enums exactly
export enum DisputeStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum DisputeReason {
  PROPERTY_NOT_AS_DESCRIBED = 'PROPERTY_NOT_AS_DESCRIBED',
  PROPERTY_NOT_AVAILABLE = 'PROPERTY_NOT_AVAILABLE',
  UNAUTHORIZED_CHARGES = 'UNAUTHORIZED_CHARGES',
  FRAUDULENT_LISTING = 'FRAUDULENT_LISTING',
  SAFETY_CONCERNS = 'SAFETY_CONCERNS',
  PRICING_DISCREPANCY = 'PRICING_DISCREPANCY',
  OTHER = 'OTHER',
}

export enum PreferredResolution {
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  PROPERTY_FIX = 'PROPERTY_FIX',
}

export enum DisputeResolutionOutcome {
  FULL_REFUND = 'FULL_REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  NO_REFUND = 'NO_REFUND',
  PROPERTY_FIX_REQUIRED = 'PROPERTY_FIX_REQUIRED',
  DISMISSED = 'DISMISSED',
}

// Mirrors Role enum from schema — only roles that can comment
export type DisputeAuthorRole = 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';

// ---- Nested types (mirror DisputeComment & DisputeEvidence models) ----

export interface DisputeComment {
  id: string;
  disputeId: string;
  authorId: string;
  authorRole: DisputeAuthorRole;
  comment: string;
  createdAt: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  uploadedBy: string;
  fileUrl: string;
  fileType?: string;   // optional — matches schema String?
  createdAt: string;
}

// ---- Request types ----

export interface DisputeRequest {
  rentalId: string;
  paymentId: string;
  reason: DisputeReason;
  description: string;
  preferredResolution: PreferredResolution;
}

// ---- Response types ----

// Mirrors Dispute model — base shape for create/cancel responses
export interface DisputeResponse {
  id: string;
  rentalId: string;
  paymentId: string;
  renterId: string;
  reason: DisputeReason;
  description: string;
  preferredResolution: PreferredResolution;
  status: DisputeStatus;
  // Resolution fields — optional, only populated after resolution
  resolutionOutcome?: DisputeResolutionOutcome;
  resolutionNotes?: string;
  refundAmount?: number;
  resolvedAt?: string;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

// Extended shape for getDispute and addComment — includes relations
export interface DisputeStatusResponse extends DisputeResponse {
  comments: DisputeComment[];
  evidence: DisputeEvidence[];
}

// Returned by acceptResolution
export interface DisputeResolutionResponse {
  id: string;
  resolutionOutcome: DisputeResolutionOutcome;
  resolutionNotes?: string;
  refundAmount?: number;
  resolvedAt: string;
  status: DisputeStatus;
}

// Returned by getMyDisputes
export interface DisputeListResponse {
  disputes: DisputeStatusResponse[];
  total: number;
  page: number;
  limit: number;
}