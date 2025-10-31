/**
 * Admin Dashboard - Duplicate Types
 * Location: apps/admin/src/types/duplicate.ts
 */

export enum DuplicateStatus {
  PENDING = "PENDING",
  CONFIRMED_DUPLICATE = "CONFIRMED_DUPLICATE",
  NOT_DUPLICATE = "NOT_DUPLICATE",
  RESOLVED = "RESOLVED",
}

export enum DuplicateDetectionMethod {
  BOUNDARY_OVERLAP = "BOUNDARY_OVERLAP",
  FINGERPRINT_MATCH = "FINGERPRINT_MATCH",
  ADDRESS_MATCH = "ADDRESS_MATCH",
  USER_REPORT = "USER_REPORT",
  AUTOMATED = "AUTOMATED",
}

export interface PropertyDuplicate {
  id: string;
  
  // Properties
  originalPropertyId: string;
  originalPropertyTitle: string;
  originalPropertyAddress: string;
  originalOwnerId: string;
  originalOwnerName: string | null;
  
  duplicatePropertyId: string;
  duplicatePropertyTitle: string;
  duplicatePropertyAddress: string;
  duplicateOwnerId: string;
  duplicateOwnerName: string | null;
  
  // Detection
  detectionMethod: DuplicateDetectionMethod;
  reportedBy: string | null;
  reporterName: string | null;
  
  // Status
  status: DuplicateStatus;
  
  // Evidence
  similarityScore: number | null; // 0-100%
  matchingFingerprints: boolean;
  overlappingBoundaries: boolean;
  sameAddress: boolean;
  
  // Boundary comparison
  boundaryOverlapPercentage: number | null;
  distanceBetweenProperties: number | null; // meters
  
  // Resolution
  resolution: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  resolutionAction: DuplicateResolutionAction | null;
  
  createdAt: Date;
}

export enum DuplicateResolutionAction {
  REMOVED_DUPLICATE = "REMOVED_DUPLICATE",
  MERGED_PROPERTIES = "MERGED_PROPERTIES",
  MARKED_NOT_DUPLICATE = "MARKED_NOT_DUPLICATE",
  SUSPENDED_USER = "SUSPENDED_USER",
  NO_ACTION = "NO_ACTION",
}

export interface DuplicateComparison {
  duplicateId: string;
  
  // Property 1 (Original)
  property1: {
    id: string;
    title: string;
    address: string;
    price: number | null;
    images: string[];
    boundaryCoordinates: any | null;
    buildingFingerprint: string | null;
    ownerId: string;
    ownerName: string | null;
    createdAt: Date;
  };
  
  // Property 2 (Duplicate)
  property2: {
    id: string;
    title: string;
    address: string;
    price: number | null;
    images: string[];
    boundaryCoordinates: any | null;
    buildingFingerprint: string | null;
    ownerId: string;
    ownerName: string | null;
    createdAt: Date;
  };
  
  // Comparison results
  comparison: {
    titleSimilarity: number; // 0-100%
    addressMatch: boolean;
    priceMatch: boolean;
    fingerprintMatch: boolean;
    boundaryOverlap: number | null; // percentage
    distanceBetween: number | null; // meters
    imageSimilarity: number | null; // 0-100%
    overallSimilarity: number; // 0-100%
  };
}

export interface DuplicateResolution {
  duplicateId: string;
  action: "confirm_duplicate" | "not_duplicate" | "merge";
  resolution: string;
  notes?: string;
  resolutionAction: DuplicateResolutionAction;
  
  // For merge action
  propertyToKeep?: string;
  propertyToRemove?: string;
  
  // For user actions
  suspendUser?: boolean;
  suspensionDuration?: number; // days
  suspensionReason?: string;
  
  resolvedBy: string; // Admin ID
}

export interface BulkDuplicateAction {
  duplicateIds: string[];
  action: "confirm_duplicate" | "not_duplicate" | "merge";
  reason?: string;
  notes?: string;
  resolvedBy: string; // Admin ID
}

export interface DuplicateFilters {
  search?: string;
  status?: DuplicateStatus;
  detectionMethod?: DuplicateDetectionMethod;
  originalPropertyId?: string;
  duplicatePropertyId?: string;
  reportedBy?: string;
  matchingFingerprints?: boolean;
  overlappingBoundaries?: boolean;
  sameAddress?: boolean;
  similarityScoreMin?: number;
  similarityScoreMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DuplicateStats {
  totalDuplicates: number;
  pendingReview: number;
  confirmedDuplicates: number;
  notDuplicates: number;
  resolved: number;
  averageResolutionTime: number; // hours
  duplicateRate: number; // percentage of total properties
  todayDetected: number;
  thisWeekDetected: number;
  thisMonthDetected: number;
  
  // By detection method
  byDetectionMethod: {
    method: DuplicateDetectionMethod;
    count: number;
  }[];
}

export interface DuplicateTimeline {
  id: string;
  duplicateId: string;
  event: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface DuplicateAlert {
  id: string;
  duplicateId: string;
  alertType: "high_similarity" | "same_owner" | "same_address" | "multiple_duplicates";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isResolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface DuplicatePreventionSettings {
  enableAutomaticDetection: boolean;
  minimumSimilarityScore: number; // 0-100
  enableFingerprintMatching: boolean;
  enableBoundaryOverlapDetection: boolean;
  boundaryOverlapThreshold: number; // percentage
  enableAddressMatching: boolean;
  notifyOwnersOnDuplicate: boolean;
  autoRejectHighConfidenceDuplicates: boolean;
}

export interface FingerprintAnalysis {
  propertyId: string;
  fingerprint: string | null;
  components: {
    gpsHash: string;
    addressHash: string;
    boundaryHash: string | null;
    imageHash: string | null;
  };
  matches: {
    propertyId: string;
    propertyTitle: string;
    matchScore: number; // 0-100%
    matchingComponents: string[];
  }[];
}