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





// // backend/marking-service/src/types/completion.ts

// export enum CompletionStatus {
//   PENDING_SUBMISSION = 'PENDING_SUBMISSION',
//   SUBMITTED = 'SUBMITTED',
//   UNDER_REVIEW = 'UNDER_REVIEW',
//   APPROVED = 'APPROVED',
//   REJECTED = 'REJECTED',
//   REQUIRES_REVISION = 'REQUIRES_REVISION'
// }

// export enum RoomType {
//   LIVING_ROOM = 'LIVING_ROOM',
//   KITCHEN = 'KITCHEN',
//   BEDROOM = 'BEDROOM',
//   BATHROOM = 'BATHROOM',
//   DINING_ROOM = 'DINING_ROOM',
//   BALCONY = 'BALCONY',
//   GARAGE = 'GARAGE',
//   COMPOUND = 'COMPOUND',
//   EXTERIOR = 'EXTERIOR',
//   OTHER = 'OTHER'
// }

// export interface CompletionImage {
//   id: string;
//   url: string;
//   roomType: RoomType;
//   description?: string;
//   timestamp: Date;
//   location?: {
//     lat: number;
//     lng: number;
//   };
//   metadata?: {
//     fileSize: number;
//     dimensions: {
//       width: number;
//       height: number;
//     };
//     format: string;
//   };
// }

// export interface BoundaryMarkingData {
//   coordinates: {
//     lat: number;
//     lng: number;
//   }[];
//   centerPoint: {
//     lat: number;
//     lng: number;
//   };
//   boundingBox: {
//     north: number;
//     south: number;
//     east: number;
//     west: number;
//   };
//   area: number; // Square meters
//   perimeter: number; // Meters
//   markedAt: Date;
//   markedBy: string;
//   accuracy?: number; // GPS accuracy in meters
//   mapZoomLevel?: number;
// }

// export interface PropertyVerificationData {
//   hasMatchingAddress: boolean;
//   hasMatchingImages: boolean;
//   hasAccessibleEntrance: boolean;
//   hasVisibleStreetNumber: boolean;
//   isOccupied: boolean;
//   occupancyType?: 'OWNER' | 'TENANT' | 'VACANT';
//   condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
//   notes?: string;
// }

// export interface CompletionSubmission {
//   id: string;
//   markingJobId: string;
//   assignmentId: string;
//   agentId: string;
  
//   // Boundary Data
//   boundaryData: BoundaryMarkingData;
  
//   // Images
//   images: CompletionImage[];
//   requiredRooms: RoomType[]; // Minimum required: EXTERIOR, LIVING_ROOM, KITCHEN, BATHROOM
//   submittedRoomTypes: RoomType[];
  
//   // Verification
//   verificationData: PropertyVerificationData;
  
//   // Agent Notes
//   completionNotes: string;
//   challenges?: string; // Any issues encountered
//   recommendations?: string;
  
//   // Time Tracking
//   startedAt: Date;
//   completedAt: Date;
//   timeSpentMinutes: number;
  
//   // Location Verification
//   submissionLocation: {
//     lat: number;
//     lng: number;
//   };
//   distanceFromPropertyMeters: number;
  
//   // Status
//   status: CompletionStatus;
  
//   // Metadata
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface OwnerConfirmation {
//   id: string;
//   markingJobId: string;
//   completionSubmissionId: string;
//   ownerId: string;
  
//   // Confirmation Details
//   isConfirmed: boolean;
//   confirmedAt?: Date;
//   confirmationDeadline: Date;
  
//   // Rejection Details
//   isRejected: boolean;
//   rejectedAt?: Date;
//   rejectionReason?: string;
//   rejectionCategory?: 'WRONG_PROPERTY' | 'POOR_IMAGES' | 'INCORRECT_BOUNDARY' | 'MISSING_ROOMS' | 'OTHER';
  
//   // Revision Request
//   requiresRevision: boolean;
//   revisionNotes?: string;
//   revisionDeadline?: Date;
  
//   // Feedback
//   qualityRating?: number; // 1-5
//   feedback?: string;
  
//   // Attempts
//   attemptNumber: number;
//   maxAttempts: number; // After x rejections, marking job is cancelled
  
//   // Metadata
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface CompletionPayment {
//   id: string;
//   markingJobId: string;
//   completionSubmissionId: string;
//   agentId: string;
  
//   // Payment Breakdown
//   totalFee: number; // 20,000 NGN
//   initialPayment: number; // 1,000 NGN on submission
//   remainingPayment: number; // Released after confirmation
//   platformFee: number; // 75% of total
//   agentCompensation: number; // 25% of total
  
//   // Payment Status
//   initialPaid: boolean;
//   initialPaidAt?: Date;
//   remainingPaid: boolean;
//   remainingPaidAt?: Date;
  
//   // Virtual Account
//   virtualAccountId: string;
  
//   // Metadata
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface CompletionValidation {
//   isValid: boolean;
//   errors: CompletionValidationError[];
//   warnings: CompletionValidationWarning[];
// }

// export interface CompletionValidationError {
//   field: string;
//   message: string;
//   severity: 'ERROR';
// }

// export interface CompletionValidationWarning {
//   field: string;
//   message: string;
//   severity: 'WARNING';
// }

// export interface CompletionQualityCheck {
//   imageQuality: {
//     passed: boolean;
//     minImages: number;
//     submittedImages: number;
//     missingRoomTypes: RoomType[];
//   };
//   boundaryQuality: {
//     passed: boolean;
//     isWithinPropertyBounds: boolean;
//     areaReasonable: boolean;
//     coordinatesValid: boolean;
//   };
//   locationAccuracy: {
//     passed: boolean;
//     distanceFromProperty: number;
//     maxAllowedDistance: number;
//   };
//   overallScore: number; // 0-100
//   recommendations: string[];
// }

// export interface CreateCompletionSubmissionDTO {
//   markingJobId: string;
//   assignmentId: string;
//   agentId: string;
//   boundaryData: Omit<BoundaryMarkingData, 'markedAt' | 'markedBy'>;
//   images: Omit<CompletionImage, 'id' | 'timestamp'>[];
//   verificationData: PropertyVerificationData;
//   completionNotes: string;
//   challenges?: string;
//   recommendations?: string;
//   startedAt: Date;
//   submissionLocation: {
//     lat: number;
//     lng: number;
//   };
// }

// export interface UpdateCompletionSubmissionDTO {
//   status?: CompletionStatus;
//   images?: Omit<CompletionImage, 'id' | 'timestamp'>[];
//   boundaryData?: Partial<BoundaryMarkingData>;
//   completionNotes?: string;
// }

// export interface CreateOwnerConfirmationDTO {
//   markingJobId: string;
//   completionSubmissionId: string;
//   ownerId: string;
//   isConfirmed: boolean;
//   isRejected: boolean;
//   rejectionReason?: string;
//   rejectionCategory?: OwnerConfirmation['rejectionCategory'];
//   requiresRevision: boolean;
//   revisionNotes?: string;
//   qualityRating?: number;
//   feedback?: string;
// }

// export interface CompletionFilters {
//   markingJobId?: string;
//   agentId?: string;
//   status?: CompletionStatus[];
//   dateFrom?: Date;
//   dateTo?: Date;
//   minQualityScore?: number;
// }

// export interface CompletionAnalytics {
//   totalSubmissions: number;
//   approvedSubmissions: number;
//   rejectedSubmissions: number;
//   averageCompletionTime: number; // Minutes
//   averageQualityScore: number;
//   averageImagesPerSubmission: number;
//   byStatus: Record<CompletionStatus, number>;
//   topPerformingAgents: {
//     agentId: string;
//     completedJobs: number;
//     approvalRate: number;
//     averageQuality: number;
//   }[];
// }










// // backend/marking-service/src/types/completion.ts

// export interface CompletionData {
//   jobId: string;
//   agentId: string;
//   completionNotes?: string;
//   completionImages: string[];
//   boundaryData: BoundaryCoordinates;
//   completedAt: Date;
// }

// export interface BoundaryCoordinates {
//   coordinates: Array<{ lat: number; lng: number }>;
//   center: { lat: number; lng: number };
//   area?: number; // Square meters
//   perimeter?: number; // Meters
// }

// export interface CompletionValidation {
//   hasImages: boolean;
//   hasBoundary: boolean;
//   hasNotes: boolean;
//   imageCount: number;
//   minimumImagesMet: boolean;
//   boundaryValid: boolean;
// }

// export interface CompletionUpload {
//   images: Express.Multer.File[];
//   notes: string;
//   boundaryData: string; // JSON string
// }

// export interface CompletionSubmission {
//   jobId: string;
//   agentId: string;
//   notes?: string;
//   imageUrls: string[];
//   boundaryCoordinates: BoundaryCoordinates;
// }

// export interface CompletionStatus {
//   jobId: string;
//   status: 'pending' | 'submitted' | 'confirmed' | 'rejected';
//   submittedAt?: Date;
//   confirmedAt?: Date;
//   rejectedAt?: Date;
//   rejectionReason?: string;
//   partialPaymentReleased: boolean;
//   fullPaymentReleased: boolean;
// }

// export interface CompletionPhotoRequirements {
//   minimum: number;
//   maximum: number;
//   requiredAngles: string[];
//   acceptedFormats: string[];
//   maxSizePerImage: number; // bytes
// }

// export const COMPLETION_PHOTO_REQUIREMENTS: CompletionPhotoRequirements = {
//   minimum: 4,
//   maximum: 20,
//   requiredAngles: ['front', 'back', 'left', 'right', 'interior'],
//   acceptedFormats: ['image/jpeg', 'image/png', 'image/jpg'],
//   maxSizePerImage: 5 * 1024 * 1024, // 5MB
// };

// export interface CompletionQualityCheck {
//   imageQuality: boolean;
//   boundaryAccuracy: boolean;
//   notesClarity: boolean;
//   timestamp: boolean;
//   gpsAccuracy: boolean;
//   overallScore: number; // 0-100
// }