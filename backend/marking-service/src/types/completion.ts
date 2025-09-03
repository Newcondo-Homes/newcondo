export interface JobCompletion {
  jobId: string;
  agentId: string;
  completedAt: Date;
  completionData: CompletionData;
  qualityScore?: number; // 1-10 rating
  clientFeedback?: ClientFeedback;
  agentNotes?: string;
}

export interface CompletionData {
  boundaryCoordinates: BoundaryCoordinates;
  completionImages: CompletionImage[];
  propertyMeasurements?: PropertyMeasurements;
  accessNotes: string;
  timeSpent: number; // in minutes
  challengesFaced?: string[];
  additionalFindings?: string;
}

export interface BoundaryCoordinates {
  type: 'Polygon';
  coordinates: number[][][]; // GeoJSON Polygon format
  metadata: {
    accuracy: number; // GPS accuracy in meters
    measurementMethod: 'GPS' | 'VISUAL' | 'HYBRID';
    totalArea?: number; // in square meters
    perimeter?: number; // in meters
    centroid: {
      lat: number;
      lng: number;
    };
  };
}

export interface CompletionImage {
  url: string;
  type: 'BOUNDARY_CORNER' | 'PROPERTY_FRONT' | 'PROPERTY_SIDE' | 'PROPERTY_BACK' | 'REFERENCE_LANDMARK' | 'OVERVIEW';
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  metadata?: {
    fileSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    gpsAccuracy?: number;
  };
}

export interface PropertyMeasurements {
  frontage?: number; // in meters
  depth?: number; // in meters
  totalArea: number; // in square meters
  buildingFootprint?: number; // built area
  setbacks?: {
    front: number;
    back: number;
    left: number;
    right: number;
  };
  accessPoints: {
    main: 'STREET' | 'ALLEY' | 'SHARED_DRIVEWAY' | 'FOOTPATH';
    secondary?: string;
  };
}

export interface ClientFeedback {
  rating: number; // 1-5 stars
  comment?: string;
  satisfaction: 'VERY_SATISFIED' | 'SATISFIED' | 'NEUTRAL' | 'DISSATISFIED' | 'VERY_DISSATISFIED';
  wouldRecommendAgent: boolean;
  completionTime: 'FASTER_THAN_EXPECTED' | 'AS_EXPECTED' | 'SLOWER_THAN_EXPECTED';
  communicationRating: number; // 1-5
  professionalismRating: number; // 1-5
  accuracyRating: number; // 1-5
  submittedAt: Date;
}

export interface CompletionValidation {
  isValid: boolean;
  validationChecks: ValidationCheck[];
  requiresReview: boolean;
  autoApproved: boolean;
  validatedAt: Date;
  validatedBy?: string; // admin ID if manual review
}

export interface ValidationCheck {
  checkType: 'BOUNDARY_AREA' | 'IMAGE_QUALITY' | 'GPS_ACCURACY' | 'COMPLETENESS' | 'DUPLICATE_CHECK';
  passed: boolean;
  details: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface CompletionStatistics {
  jobId: string;
  totalDuration: number; // from assignment to completion in hours
  workingDuration: number; // actual time spent working in minutes
  travelTime?: number; // time to reach property in minutes
  delayReasons?: string[];
  efficiency: {
    timeVsEstimate: number; // percentage
    qualityScore: number;
    clientSatisfaction: number;
  };
}

export interface CompletionReport {
  summary: {
    jobId: string;
    propertyId: string;
    agentId: string;
    completedAt: Date;
    status: 'COMPLETED' | 'COMPLETED_WITH_ISSUES' | 'REQUIRES_REWORK';
  };
  qualityAssessment: {
    overallScore: number;
    boundaryAccuracy: number;
    imageQuality: number;
    completeness: number;
    timeliness: number;
  };
  recommendations?: string[];
  nextActions?: {
    action: string;
    assignedTo: string;
    dueDate: Date;
  }[];
}

export interface ReworkRequest {
  jobId: string;
  requestedBy: string; // admin or client ID
  reason: string;
  specificIssues: {
    type: 'BOUNDARY_INACCURATE' | 'POOR_IMAGE_QUALITY' | 'MISSING_INFORMATION' | 'ACCESS_ISSUES';
    description: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  }[];
  deadline: Date;
  additionalInstructions?: string;
}

export interface CompletionMetrics {
  period: {
    start: Date;
    end: Date;
  };
  totalCompletions: number;
  averageCompletionTime: number;
  averageQualityScore: number;
  averageClientSatisfaction: number;
  completionsByAgent: {
    agentId: string;
    count: number;
    averageScore: number;
    averageTime: number;
  }[];
  issueFrequency: {
    [key: string]: number;
  };
  reworkRate: number; // percentage of jobs requiring rework
}