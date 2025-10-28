// backend/admin-service/src/types/duplicate.ts

export interface DuplicatePropertyReport {
  id: string;
  
  // Original Property
  originalPropertyId: string;
  originalPropertyTitle: string;
  originalPropertyAddress: string;
  originalOwnerId: string;
  originalOwnerName: string;
  originalListedAt: Date;
  
  // Suspected Duplicate
  duplicatePropertyId: string;
  duplicatePropertyTitle: string;
  duplicatePropertyAddress: string;
  duplicateOwnerId: string;
  duplicateOwnerName: string;
  duplicateListedAt: Date;
  
  // Detection Details
  detectionMethod: DuplicateDetectionMethod;
  similarityScore: number; // 0-100
  matchingFactors: MatchingFactor[];
  
  // Boundary Comparison
  boundaryOverlap?: number; // percentage
  coordinateDistance?: number; // meters
  fingerprintMatch?: boolean;
  
  // Visual Comparison
  imageSimilarityScore?: number;
  visualMatches?: string[]; // matching image URLs
  
  // Status
  status: DuplicateStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Reporter Info
  reportedBy?: string;
  reportedByName?: string;
  autoDetected: boolean;
  
  // Resolution
  resolution?: DuplicateResolution;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: Date;
  
  // Evidence
  evidence: DuplicateEvidence[];
  
  // Timestamps
  detectedAt: Date;
  lastReviewedAt?: Date;
}

export enum DuplicateDetectionMethod {
  BOUNDARY_OVERLAP = 'BOUNDARY_OVERLAP',
  FINGERPRINT_MATCH = 'FINGERPRINT_MATCH',
  COORDINATE_PROXIMITY = 'COORDINATE_PROXIMITY',
  IMAGE_SIMILARITY = 'IMAGE_SIMILARITY',
  ADDRESS_MATCH = 'ADDRESS_MATCH',
  MANUAL_REPORT = 'MANUAL_REPORT',
  MULTIPLE_FACTORS = 'MULTIPLE_FACTORS',
}

export interface MatchingFactor {
  factor: string;
  matchPercentage: number;
  details: string;
}

export enum DuplicateStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CONFIRMED_DUPLICATE = 'CONFIRMED_DUPLICATE',
  NOT_DUPLICATE = 'NOT_DUPLICATE',
  RESOLVED = 'RESOLVED',
}

export enum DuplicateResolution {
  KEEP_ORIGINAL = 'KEEP_ORIGINAL',
  KEEP_DUPLICATE = 'KEEP_DUPLICATE',
  REMOVE_BOTH = 'REMOVE_BOTH',
  MERGE_LISTINGS = 'MERGE_LISTINGS',
  NOT_DUPLICATE = 'NOT_DUPLICATE',
}

export interface DuplicateEvidence {
  id: string;
  type: 'IMAGE' | 'BOUNDARY_DATA' | 'COORDINATES' | 'DOCUMENT' | 'OTHER';
  url?: string;
  data?: any;
  description: string;
  uploadedBy?: string;
  timestamp: Date;
}

export interface DuplicateReview {
  duplicateId: string;
  adminId: string;
  decision: DuplicateResolution;
  confidence: number; // 0-100
  reasoning: string;
  actionsToTake: DuplicateAction[];
}

export interface DuplicateAction {
  type: 'SUSPEND_PROPERTY' | 'DELETE_PROPERTY' | 'NOTIFY_OWNER' | 'MERGE_PROPERTIES' | 'UPDATE_BOUNDARY' | 'FLAG_USER';
  targetPropertyId?: string;
  targetUserId?: string;
  details: string;
}

export interface DuplicateStats {
  total: number;
  pending: number;
  underReview: number;
  confirmedDuplicates: number;
  notDuplicates: number;
  resolved: number;
  
  // By Detection Method
  byDetectionMethod: Record<DuplicateDetectionMethod, number>;
  
  // Today
  detectedToday: number;
  resolvedToday: number;
  
  // Performance
  averageReviewTime: number; // in hours
  averageSimilarityScore: number;
  autoDetectionAccuracy: number; // percentage
}

export interface BulkDuplicateAction {
  duplicateIds: string[];
  adminId: string;
  resolution: DuplicateResolution;
  reason?: string;
}

export interface DuplicateComparison {
  duplicateId: string;
  
  // Side-by-side comparison
  comparison: {
    title: { original: string; duplicate: string; similarity: number };
    description: { original: string; duplicate: string; similarity: number };
    price: { original: number; duplicate: number; difference: number };
    location: { original: string; duplicate: string; distance: number };
    coordinates: { original: any; duplicate: any; distance: number };
    images: { matching: string[]; unique: { original: string[]; duplicate: string[] } };
    features: { matching: string[]; different: string[] };
    boundary: { overlap: number; accuracy: number };
  };
  
  // Overall Assessment
  overallSimilarity: number;
  isDuplicate: boolean;
  confidence: number;
  recommendations: string[];
}

export interface DuplicateAlert {
  id: string;
  type: 'HIGH_SIMILARITY' | 'EXACT_MATCH' | 'BOUNDARY_CONFLICT' | 'SUSPICIOUS_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedProperties: string[];
  requiresImmediateAction: boolean;
  createdAt: Date;
}

export interface DuplicatePreventionMetrics {
  totalDetections: number;
  preventedDuplicates: number;
  falsePositives: number;
  accuracyRate: number; // percentage
  
  // System Performance
  averageDetectionTime: number; // milliseconds
  boundaryChecksPassed: number;
  boundaryChecksFailed: number;
  
  // Impact
  propertiesBlocked: number;
  usersNotified: number;
}