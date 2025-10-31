/**
 * Admin Dashboard - Dispute Types
 * Location: apps/admin/src/types/dispute.ts
 */

export enum DisputeType {
  BOUNDARY_OVERLAP = "BOUNDARY_OVERLAP",
  DUPLICATE_LISTING = "DUPLICATE_LISTING",
  OWNERSHIP_CONFLICT = "OWNERSHIP_CONFLICT",
  INCORRECT_BOUNDARY = "INCORRECT_BOUNDARY",
  FRAUDULENT_LISTING = "FRAUDULENT_LISTING",
  OTHER = "OTHER",
}

export enum DisputeStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
}

export enum DisputePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum DuplicateStatus {
  PENDING = "PENDING",
  CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE",
  NOT_DUPLICATE = "NOT_DUPLICATE",
  RESOLVED = "RESOLVED",
}

export interface BoundaryDispute {
  id: string;
  type: DisputeType;
  status: DisputeStatus;
  priority: DisputePriority;
  
  // Properties involved
  propertyId: string;
  propertyTitle: string;
  conflictingPropertyId: string | null;
  conflictingPropertyTitle: string | null;
  
  // Reporters
  reportedBy: string;
  reporterName: string | null;
  reporterEmail: string;
  
  // Details
  description: string;
  evidence: string[]; // URLs to evidence files/images
  boundaryData: any | null;
  
  // Resolution
  resolution: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  
  // Admin actions taken
  actionsTaken: DisputeAction[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyDuplicate {
  id: string;
  originalPropertyId: string;
  originalPropertyTitle: string;
  duplicatePropertyId: string;
  duplicatePropertyTitle: string;
  
  // Reporter
  reportedBy: string | null;
  reporterName: string | null;
  
  // Status
  status: DuplicateStatus;
  
  // Resolution
  resolution: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  
  // Evidence
  similarityScore: number | null; // 0-100%
  matchingFingerprints: boolean;
  overlappingBoundaries: boolean;
  sameAddress: boolean;
  
  createdAt: Date;
}

export interface DisputeAction {
  id: string;
  disputeId: string;
  action: string;
  description: string;
  performedBy: string;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface DisputeResolution {
  disputeId: string;
  action: "resolve" | "reject" | "escalate";
  resolution: string;
  notes?: string;
  actionsTaken: {
    removeProperty?: boolean;
    suspendUser?: boolean;
    adjustBoundary?: boolean;
    mergeProperties?: boolean;
    notifyUsers?: boolean;
  };
  resolvedBy: string;
}

export interface DuplicateResolution {
  duplicateId: string;
  action: "confirm_duplicate" | "not_duplicate" | "merge";
  resolution: string;
  notes?: string;
  propertyToKeep?: string; // For merge action
  propertyToRemove?: string; // For merge action
  resolvedBy: string;
}

export interface DisputeFilters {
  search?: string;
  type?: DisputeType;
  status?: DisputeStatus;
  priority?: DisputePriority;
  reportedBy?: string;
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  resolvedBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DuplicateFilters {
  search?: string;
  status?: DuplicateStatus;
  originalPropertyId?: string;
  duplicatePropertyId?: string;
  reportedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DisputeStats {
  totalDisputes: number;
  pendingDisputes: number;
  underReview: number;
  resolved: number;
  rejected: number;
  escalated: number;
  averageResolutionTime: number; // hours
  todayCreated: number;
  thisWeekCreated: number;
}

export interface DuplicateStats {
  totalDuplicates: number;
  pendingReview: number;
  confirmedDuplicates: number;
  notDuplicates: number;
  resolved: number;
  averageResolutionTime: number; // hours
}

export interface DisputeTimeline {
  id: string;
  disputeId: string;
  event: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface BoundaryComparison {
  property1: {
    id: string;
    title: string;
    boundaryCoordinates: any;
    images: string[];
  };
  property2: {
    id: string;
    title: string;
    boundaryCoordinates: any;
    images: string[];
  };
  overlap: {
    hasOverlap: boolean;
    overlapPercentage: number;
    overlapArea: any;
  };
  distance: number; // meters
  sameAddress: boolean;
}