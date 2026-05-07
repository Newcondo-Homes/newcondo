/**
 * Marking service types for remote property boundary marking
 */

import { Coordinates, BoundaryPolygon, PropertyBoundaryData } from './boundary';

export type { Coordinates, BoundaryPolygon, PropertyBoundaryData };

// Add to marking.ts

export type MarkingConfirmationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED';

export interface BoundaryCoordinates {
  coordinates: Coordinates[];
  centerPoint: Coordinates;
  accuracyLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export interface MarkingImage {
  url: string;
  type: ImageType;
  description?: string;
  uploadedAt: string;
}

export type ImageType =
  | 'BOUNDARY' | 'EXTERIOR_FRONT' | 'EXTERIOR_BACK' | 'EXTERIOR_SIDE'
  | 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'BATHROOM'
  | 'COMPOUND' | 'STREET_VIEW' | 'OTHER';

export type PropertyCondition =
  | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNDER_CONSTRUCTION';

export interface UploadCompletionImagesRequest {
  images: Array<{
    file: File;
    type: ImageType;
    description?: string;
  }>;
  notes?: string;
}

export interface MarkingConfirmationResponse {
    success: boolean
    data: {
        jobId: string
        status: string
        confirmedAt?: string
        rejectedAt?: string
        paymentReleased?: boolean
        agentRating?: number
    }
    message?: string
}

export interface ConfirmationStatusResponse {
    success: boolean
    data: {
        jobId: string
        isConfirmed: boolean
        isRejected: boolean
        confirmationDeadline: string
        hoursRemaining: number
        daysRemaining: number
        isExpired: boolean
        canConfirm: boolean
        canReject: boolean
        canRequestRevision: boolean
    }
    message?: string
}

export interface CompletionImagesResponse {
  success: boolean;
  data: {
    images: CompletionImage[];
    totalUploaded: number;
  };
  message?: string;
}

export interface CompletionImage {
  id: string;
  url: string;
  type: ImageType;
  description?: string;
  uploadedAt: string;
}

export interface SubmitBoundaryDataRequest {
  boundaryCoordinates: Coordinates[];
  centerPoint: Coordinates;
  buildingArea?: number;
  buildingHeight?: number;
  numberOfFloors?: number;
  accuracyLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface BoundaryDataResponse {
  success: boolean;
  data: BoundaryData;
  message?: string;
}

export interface BoundaryData {
  coordinates: Coordinates[];
  centerPoint: Coordinates;
  buildingArea?: number;
  buildingHeight?: number;
  numberOfFloors?: number;
  accuracyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface CompleteMarkingJobRequest {
  completionNotes: string;
  boundaryMarked: boolean;
  imagesUploaded: boolean;
  propertyCondition: PropertyCondition;
  isOccupied: boolean;
  accessIssues?: string;
  observations?: string;
  completedAt: string;
}

export interface MarkingCompletionResponse {
  success: boolean;
  data: MarkingJob;
  message?: string;
  paymentInfo?: {
    partialPayment: number;
    remainingPayment: number;
    confirmationRequired: boolean;
    confirmationDeadline: string;
  };
}


export interface ConfirmMarkingRequest {
  rating: number;
  feedback?: string;
  aspectRatings?: {
    accuracy: number;
    timeliness: number;
    communication: number;
    professionalism: number;
  };
  boundaryAccurate: boolean;
  imagesQualityAcceptable: boolean;
  wouldRecommend?: boolean;
  additionalComments?: string;
}

export interface RejectMarkingRequest {
  primaryReason:
    | 'INCORRECT_PROPERTY'
    | 'POOR_BOUNDARY_MARKING'
    | 'INSUFFICIENT_IMAGES'
    | 'POOR_IMAGE_QUALITY'
    | 'WRONG_LOCATION'
    | 'INCOMPLETE_MARKING'
    | 'UNPROFESSIONAL_CONDUCT'
    | 'OTHER';
  detailedExplanation: string;
  issues: Array<{
    type: 'BOUNDARY' | 'IMAGES' | 'LOCATION' | 'COMMUNICATION' | 'ACCESS' | 'OTHER';
    description: string;
  }>;
  evidenceImages?: string[];
  requestReMarking?: boolean;
  requestRefund?: boolean;
}

export interface RequestRevisionRequest {
  revisionType:
    | 'BOUNDARY_ADJUSTMENT'
    | 'ADDITIONAL_IMAGES'
    | 'BETTER_IMAGE_QUALITY'
    | 'CORRECT_LOCATION'
    | 'COMPLETE_MISSING_AREAS'
    | 'OTHER';
  revisionRequests: Array<{
    area: 'BOUNDARY' | 'EXTERIOR' | 'INTERIOR' | 'COMPOUND' | 'STREET_VIEW' | 'OTHER';
    instruction: string;
  }>;
  revisionNotes: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  revisionDeadline?: string;
}

// Marking job statuses (matches Prisma enum)
export type MarkingJobStatus = 
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

// Urgency levels (matches Prisma enum)
export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ServiceArea {
  id: string;
  name: string;       // e.g. "Port Harcourt", "Lagos Island"
  state: string;      // e.g. "Rivers"
  lga?: string;       // Local Government Area
  radiusKm?: number;  // Optional radius override
}

export interface Job {
    id: string;
    property?: {
      title: string;
      address: string;
      city: string;
    };
    propertyId: string;
    address: string;
    city: string;
    state: string;
    markingFee: number | string;
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    contactPersonName: string;
    queuePosition?: number;
    distanceFromAgent?: number;
    preferredTime?: string;
    maxCompletionTime?: string;
    timeSlotExpiry?: string;
};

// Payment statuses (matches Prisma enum)
export type PaymentStatus = 
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'HELD'
  | 'RELEASED';

// Marking service options
export type MarkingServiceOption = 
  | 'ask_someone_known' // Ask someone you know
  | 'assign_agent'; // Assign to Newcondo agent

// Contact person information
export interface ContactPerson {
  name: string;
  phone: string;
  relationship: string; // e.g., "Friend", "Family", "Neighbor", "Tenant"
  isPropertyOwner: boolean;
  hasKeys: boolean;
  preferredContactTime?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  alternativeContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Property access information
export interface PropertyAccessInfo {
  hasSecurityGate: boolean;
  gateCode?: string;
  securityContactName?: string;
  securityContactPhone?: string;
  accessInstructions: string;
  landmarks: string[]; // Nearby landmarks for easier identification
  bestAccessTime?: {
    start: string;
    end: string;
    days: string[]; // ['monday', 'tuesday', etc.]
  };
  restrictedTimes?: Array<{
    start: string;
    end: string;
    reason: string;
  }>;
}

// Marking job creation data
export interface CreateMarkingJobData {
  propertyId: string;
  serviceOption: MarkingServiceOption;
  contactPerson: ContactPerson;
  accessInfo: PropertyAccessInfo;
  urgencyLevel: UrgencyLevel;
  preferredTime?: Date;
  specialInstructions?: string;
  ownerVerificationDocuments: string[]; // URLs to uploaded documents
}

// Complete marking job data
export interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string; // User ID
  assignedAgentId?: string;
  
  // Job details
  contactPerson: ContactPerson;
  accessInfo: PropertyAccessInfo;
  urgencyLevel: UrgencyLevel;
  preferredTime?: Date;
  specialInstructions?: string;
  
  // Pricing
  markingFee: number;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  
  // Status tracking
  status: MarkingJobStatus;
  queuePosition?: number;
  assignedAt?: Date;
  completedAt?: Date;
  timeSlotExpiry?: Date; // 3-hour time slot limit
  maxCompletionTime?: Date; // Max 3 days from request
  
  // Completion data
  completionNotes?: string;
  completionImages: string[]; // URLs to completion photos
  boundaryData?: PropertyBoundaryData;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Agent information for marking jobs
export interface MarkingAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  
  // Agent capabilities
  serviceAreas: string[]; // Cities/areas where agent operates
  reliabilityScore?: number; // 0.00 to 5.00 rating
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  completionRate: number;
  averageRating?: number;
  
  // Availability
  isAvailableForMarking: boolean;
  currentCapacity: number; // Number of active jobs
  maxCapacity: number; // Maximum concurrent jobs
  estimatedResponseTime: number; // in minutes
  
  // Working hours
  workingHours: Array<{
    day: string;
    start: string;
    end: string;
  }>;
  
  // Location info
  currentLocation?: Coordinates;
  lastLocationUpdate?: Date;
}

// Agent assignment criteria
export interface AgentAssignmentCriteria {
  preferredAgentId?: string;
  maxDistance: number; // in kilometers
  minReliabilityScore: number;
  minCompletionRate: number;
  availabilityRequired: boolean;
  urgencyLevel: UrgencyLevel;
}

// Marking job queue item
export interface QueueItem {
  jobId: string;
  position: number;
  estimatedWaitTime: number; // in minutes
  urgencyLevel: UrgencyLevel;
  createdAt: Date;
  isExpedited: boolean;
}

// Queue management
export interface QueueStatus {
  totalJobs: number;
  activeAgents: number;
  averageWaitTime: number; // in minutes
  urgentJobs: number;
  completionRate: number; // percentage
  lastUpdated: Date;
}

// Marking fee calculation
export interface MarkingFeeStructure {
  baseRate: number;
  urgencyMultipliers: Record<UrgencyLevel, number>;
  distanceRate: number; // per kilometer
  timeSlotPremium: number; // for specific time slots
  accessDifficultyMultiplier: number; // for difficult access
}

export interface MarkingFeeCalculation {
  baseAmount: number;
  urgencyFee: number;
  distanceFee: number;
  timeSlotFee: number;
  accessFee: number;
  totalAmount: number;
  breakdown: Array<{
    description: string;
    amount: number;
  }>;
}

// Job completion verification
export interface CompletionVerification {
  boundaryAccuracy: number; // 0-100 percentage
  imageQuality: number; // 0-100 percentage
  completenessScore: number; // 0-100 percentage
  verificationNotes: string;
  requiresReview: boolean;
  verifiedBy?: string; // Admin user ID
  verifiedAt?: Date;
}

// Job progress tracking
export interface JobProgress {
  jobId: string;
  currentStep: 
    | 'payment_pending'
    | 'queued'
    | 'agent_assigned'
    | 'agent_traveling'
    | 'on_site'
    | 'marking_in_progress'
    | 'uploading_results'
    | 'completed';
  
  stepProgress: number; // 0-100 percentage for current step
  overallProgress: number; // 0-100 overall completion
  estimatedTimeRemaining: number; // in minutes
  lastUpdate: Date;
  
  // Step-specific data
  stepData?: {
    agentLocation?: Coordinates;
    distanceToProperty?: number;
    arrivalTime?: Date;
    markingStartTime?: Date;
    imagesUploaded?: number;
    totalImagesRequired?: number;
  };
}

// Marking job notifications
export interface MarkingJobNotification {
  id: string;
  jobId: string;
  userId: string;
  type: 
    | 'job_created'
    | 'payment_confirmed'
    | 'agent_assigned'
    | 'agent_traveling'
    | 'agent_arrived'
    | 'marking_started'
    | 'marking_completed'
    | 'job_cancelled'
    | 'job_expired';
  
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Agent performance metrics
export interface AgentPerformanceMetrics {
  agentId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Job statistics
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  
  // Performance metrics
  completionRate: number;
  averageCompletionTime: number; // in hours
  onTimeRate: number; // percentage of jobs completed within timeframe
  customerSatisfactionScore: number; // 0-5 rating
  
  // Quality metrics
  averageBoundaryAccuracy: number;
  rejectRate: number; // percentage of jobs requiring rework
  
  // Efficiency metrics
  averageResponseTime: number; // time to accept job in minutes
  averageTravelTime: number; // time to reach property in minutes
}

// Dispute resolution
export interface MarkingDispute {
  id: string;
  jobId: string;
  disputeType: 
    | 'boundary_accuracy'
    | 'incomplete_work'
    | 'property_damage'
    | 'access_issues'
    | 'payment_dispute';
  
  raisedBy: string; // User ID
  description: string;
  evidence: string[]; // URLs to evidence files/images
  
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  resolution?: string;
  resolvedBy?: string; // Admin user ID
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Marking option types for property owners
 */
export enum MarkingOption {
  SELF_MARK = "SELF_MARK", // Mark the property themselves
  NEWCONDO_AGENT = "NEWCONDO_AGENT", // Assign to Newcondo admin
  SEND_LINK = "SEND_LINK", // Send link to someone they know
  ASSIGN_TO_AGENTS = "ASSIGN_TO_AGENTS", // Assign to platform agents/renters
}


export interface MarkingJobRequest {
  propertyId: string;
  markingType: MarkingType;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
}

export enum MarkingType {
  SELF_MARK = "SELF_MARK", // Owner marks themselves
  CONTACT_PERSON = "CONTACT_PERSON", // Send to known contact
  AGENT_QUEUE = "AGENT_QUEUE", // Broadcast to agent queue (25% comp)
  NEWCONDO_MARK = "NEWCONDO_MARK", // Newcondo marks (25,000 fee)
}

/**
 * Marking job creation request
 */
export interface CreateMarkingJobRequest {
  propertyId: string;
  markingOption: MarkingOption;
  contactPerson: ContactPerson;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: UrgencyLevel;
  propertyImages?: string[]; // Images provided by owner for identification
}

/**
 * Marking confirmation request
 */
export interface MarkingConfirmationRequest {
  markingJobId: string;
  confirmed: boolean;
  reason?: string; // Required if rejected
  feedback?: string;
}


// // apps/platform/types/marking.ts

// /**
//  * Marking method - how the property will be marked
//  */
// export enum MarkingMethod {
//   SELF_MARK = "SELF_MARK", // Property owner marks themselves
//   SEND_SOMEONE = "SEND_SOMEONE", // Property owner sends someone they know
//   ASSIGN_AGENT = "ASSIGN_AGENT", // Assign to Newcondo agents/renters
//   NEWCONDO_ADMIN = "NEWCONDO_ADMIN", // Newcondo admin marks (25,000 naira)
// }

// /**
//  * Marking status for the entire marking process
//  */
// export enum MarkingStatus {
//   NOT_STARTED = "NOT_STARTED",
//   INITIATED = "INITIATED",
//   PAYMENT_PENDING = "PAYMENT_PENDING",
//   PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
//   ASSIGNED = "ASSIGNED",
//   IN_PROGRESS = "IN_PROGRESS",
//   AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION",
//   CONFIRMED = "CONFIRMED",
//   REJECTED = "REJECTED",
//   COMPLETED = "COMPLETED",
//   CANCELLED = "CANCELLED",
//   EXPIRED = "EXPIRED",
// }

// /**
//  * Verification status for marked properties
//  */
// export enum MarkingVerificationStatus {
//   PENDING = "PENDING",
//   VERIFIED = "VERIFIED",
//   REJECTED = "REJECTED",
//   REQUIRES_REVISION = "REQUIRES_REVISION",
// }

// /**
//  * Time preference for marking appointment
//  */
// export enum MarkingTimePreference {
//   MORNING = "MORNING", // 8am - 12pm
//   AFTERNOON = "AFTERNOON", // 12pm - 4pm
//   EVENING = "EVENING", // 4pm - 7pm
//   ANYTIME = "ANYTIME",
// }

// /**
//  * Urgency level for marking jobs
//  */
// export enum MarkingUrgency {
//   LOW = "LOW",
//   NORMAL = "NORMAL",
//   HIGH = "HIGH",
//   URGENT = "URGENT",
// }

// /**
//  * Contact person relationship types
//  */
// export enum ContactRelationship {
//   FAMILY_MEMBER = "FAMILY_MEMBER",
//   FRIEND = "FRIEND",
//   TENANT = "TENANT",
//   CARETAKER = "CARETAKER",
//   NEIGHBOR = "NEIGHBOR",
//   PROPERTY_MANAGER = "PROPERTY_MANAGER",
//   BUSINESS_PARTNER = "BUSINESS_PARTNER",
//   OTHER = "OTHER",
// }

// /**
//  * Notification preferences for marking updates
//  */
// export enum MarkingNotificationChannel {
//   EMAIL = "EMAIL",
//   SMS = "SMS",
//   PUSH = "PUSH",
//   IN_APP = "IN_APP",
//   ALL = "ALL",
// }

// /**
//  * Property access type
//  */
// export enum PropertyAccessType {
//   KEY_AVAILABLE = "KEY_AVAILABLE",
//   CONTACT_PERSON = "CONTACT_PERSON",
//   TENANT_OCCUPIED = "TENANT_OCCUPIED",
//   VACANT = "VACANT",
//   OWNER_PRESENT = "OWNER_PRESENT",
// }

// /**
//  * Marking completion quality rating
//  */
// export enum MarkingQualityRating {
//   EXCELLENT = "EXCELLENT",
//   GOOD = "GOOD",
//   SATISFACTORY = "SATISFACTORY",
//   POOR = "POOR",
//   UNACCEPTABLE = "UNACCEPTABLE",
// }

// /**
//  * Reason for marking rejection
//  */
// export enum MarkingRejectionReason {
//   WRONG_PROPERTY = "WRONG_PROPERTY",
//   POOR_IMAGE_QUALITY = "POOR_IMAGE_QUALITY",
//   INCOMPLETE_BOUNDARY = "INCOMPLETE_BOUNDARY",
//   INACCURATE_LOCATION = "INACCURATE_LOCATION",
//   MISSING_KEY_FEATURES = "MISSING_KEY_FEATURES",
//   SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
//   OTHER = "OTHER",
// }

// /**
//  * Image type for marking documentation
//  */
// export enum MarkingImageType {
//   BUILDING_EXTERIOR = "BUILDING_EXTERIOR",
//   BUILDING_ENTRANCE = "BUILDING_ENTRANCE",
//   STREET_VIEW = "STREET_VIEW",
//   SATELLITE_BOUNDARY = "SATELLITE_BOUNDARY",
//   LANDMARK_NEARBY = "LANDMARK_NEARBY",
//   INTERIOR_LIVING_ROOM = "INTERIOR_LIVING_ROOM",
//   INTERIOR_BEDROOM = "INTERIOR_BEDROOM",
//   INTERIOR_KITCHEN = "INTERIOR_KITCHEN",
//   INTERIOR_BATHROOM = "INTERIOR_BATHROOM",
//   COMPOUND = "COMPOUND",
//   PARKING_AREA = "PARKING_AREA",
//   GATE = "GATE",
//   OTHER = "OTHER",
// }

// /**
//  * Marking compensation status
//  */
// export enum CompensationStatus {
//   NOT_APPLICABLE = "NOT_APPLICABLE",
//   PENDING = "PENDING",
//   PARTIAL_PAID = "PARTIAL_PAID", // Small percentage paid
//   FULLY_PAID = "FULLY_PAID",
//   WITHHELD = "WITHHELD",
//   REFUNDED = "REFUNDED",
// }

// /**
//  * GPS coordinate interface
//  */
// export interface GPSCoordinates {
//   latitude: number;
//   longitude: number;
//   accuracy?: number; // in meters
//   altitude?: number;
//   heading?: number;
//   speed?: number;
//   timestamp: Date;
// }

// /**
//  * Property boundary polygon
//  */
// export interface PropertyBoundary {
//   coordinates: GPSCoordinates[];
//   area?: number; // in square meters
//   perimeter?: number; // in meters
//   isValidated: boolean;
//   markedBy: string; // User ID
//   markedAt: Date;
//   fingerprint: string; // Unique identifier
// }

// /**
//  * Marking image metadata
//  */
// export interface MarkingImage {
//   id: string;
//   url: string;
//   type: MarkingImageType;
//   description?: string;
//   capturedAt: Date;
//   gpsLocation?: GPSCoordinates;
//   deviceInfo?: string;
//   fileSize: number;
//   mimeType: string;
//   order: number;
// }

// /**
//  * Marking session data
//  */
// export interface MarkingSession {
//   sessionId: string;
//   startedAt: Date;
//   completedAt?: Date;
//   duration?: number; // in seconds
//   deviceInfo: string;
//   appVersion: string;
//   gpsTrack?: GPSCoordinates[]; // Track agent's movement
// }

// /**
//  * Contact person for property access
//  */
// export interface ContactPerson {
//   id?: string;
//   name: string;
//   phone: string;
//   alternativePhone?: string;
//   email?: string;
//   relationship: ContactRelationship;
//   notes?: string;
//   isAvailableForContact: boolean;
//   preferredContactTime: MarkingTimePreference;
//   languagePreference: string;
//   verificationCode?: string; // For agent to verify contact
// }

// /**
//  * Property access information
//  */
// export interface PropertyAccessInfo {
//   accessType: PropertyAccessType;
//   contactPerson?: ContactPerson;
//   accessInstructions?: string;
//   securityInstructions?: string;
//   landmarks?: string[];
//   bestTimeToVisit?: MarkingTimePreference;
//   specialInstructions?: string;
//   hasSecurityGate: boolean;
//   requiresPermitOrPass: boolean;
//   parkingAvailable: boolean;
// }

// /**
//  * Marking fee breakdown
//  */
// export interface MarkingFeeBreakdown {
//   totalFee: number; // 20,000 or 25,000 for admin
//   agentCompensation: number; // 25% of 20,000 = 5,000
//   newcondoShare: number; // 75% of 20,000 = 15,000
//   currency: string;
//   paymentStatus: CompensationStatus;
//   partialPayment?: number; // Initial small payment (e.g., 1,000)
//   remainingPayment?: number; // Remaining after confirmation
// }

// /**
//  * Marking completion data
//  */
// export interface MarkingCompletionData {
//   completedAt: Date;
//   completedBy: string; // User ID
//   images: MarkingImage[];
//   boundary: PropertyBoundary;
//   session: MarkingSession;
//   notes?: string;
//   qualityRating?: MarkingQualityRating;
//   verificationStatus: MarkingVerificationStatus;
// }

// /**
//  * Marking confirmation data
//  */
// export interface MarkingConfirmationData {
//   confirmedAt?: Date;
//   confirmedBy?: string; // Property owner ID
//   isConfirmed: boolean;
//   confirmationDeadline: Date;
//   rejectionReason?: MarkingRejectionReason;
//   rejectionDetails?: string;
//   rating?: MarkingQualityRating;
//   feedback?: string;
// }

// /**
//  * Main marking data structure
//  */
// export interface MarkingData {
//   id: string;
//   propertyId: string;
//   requestedBy: string; // Property owner or agent ID
//   method: MarkingMethod;
//   status: MarkingStatus;
  
//   // Access information
//   accessInfo: PropertyAccessInfo;
  
//   // Fee information
//   feeBreakdown: MarkingFeeBreakdown;
  
//   // Assignment information (for ASSIGN_AGENT method)
//   assignedAgentId?: string;
//   assignedAt?: Date;
  
//   // Completion information
//   completionData?: MarkingCompletionData;
  
//   // Confirmation information
//   confirmationData: MarkingConfirmationData;
  
//   // Timestamps
//   createdAt: Date;
//   updatedAt: Date;
//   expiresAt?: Date;
  
//   // Metadata
//   urgency: MarkingUrgency;
//   notificationPreferences: MarkingNotificationChannel[];
// }

// /**
//  * Shareable link for "send someone" method
//  */
// export interface ShareableMarkingLink {
//   id: string;
//   token: string;
//   markingJobId: string;
//   propertyId: string;
//   createdBy: string; // Property owner ID
//   recipientName?: string;
//   recipientPhone?: string;
//   recipientEmail?: string;
//   expiresAt: Date;
//   maxUses: number;
//   currentUses: number;
//   isActive: boolean;
//   accessCode?: string; // Optional security code
//   requiresAuthentication: boolean;
//   usageHistory: LinkUsageRecord[];
//   createdAt: Date;
// }

// /**
//  * Link usage tracking
//  */
// export interface LinkUsageRecord {
//   accessedAt: Date;
//   deviceInfo?: string;
//   ipAddress?: string;
//   location?: GPSCoordinates;
//   action: "VIEWED" | "ACCESSED" | "MARKING_STARTED" | "MARKING_COMPLETED";
//   successful: boolean;
// }

// /**
//  * Marking notification types
//  */
// export interface MarkingNotification {
//   id: string;
//   type: MarkingNotificationType;
//   userId: string;
//   markingJobId: string;
//   title: string;
//   message: string;
//   data?: Record<string, any>;
//   channels: MarkingNotificationChannel[];
//   sentAt?: Date;
//   readAt?: Date;
//   isRead: boolean;
//   priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
// }

// export enum MarkingNotificationType {
//   JOB_CREATED = "JOB_CREATED",
//   PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
//   PAYMENT_SUCCESSFUL = "PAYMENT_SUCCESSFUL",
//   AGENT_ASSIGNED = "AGENT_ASSIGNED",
//   MARKING_STARTED = "MARKING_STARTED",
//   MARKING_COMPLETED = "MARKING_COMPLETED",
//   CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED",
//   CONFIRMATION_DEADLINE_APPROACHING = "CONFIRMATION_DEADLINE_APPROACHING",
//   MARKING_CONFIRMED = "MARKING_CONFIRMED",
//   MARKING_REJECTED = "MARKING_REJECTED",
//   COMPENSATION_PAID = "COMPENSATION_PAID",
//   JOB_EXPIRED = "JOB_EXPIRED",
//   LINK_SHARED = "LINK_SHARED",
//   LINK_ACCESSED = "LINK_ACCESSED",
// }





// // apps/platform/types/marking.ts
// // Core marking types for Property Marking Service

// import { MarkingJobStatus, UrgencyLevel } from "@newcondo/db";


// /**
//  * Marker types - who can mark properties
//  */
// export enum MarkerType {
//   PROPERTY_OWNER = "PROPERTY_OWNER",
//   LISTING_AGENT = "LISTING_AGENT",
//   PREMIUM_RENTER = "PREMIUM_RENTER",
//   NEWCONDO_ADMIN = "NEWCONDO_ADMIN",
//   EXTERNAL_MARKER = "EXTERNAL_MARKER", // Someone sent via link
// }

// /**
//  * Marking status for property confirmation
//  */
// export enum MarkingConfirmationStatus {
//   PENDING_CONFIRMATION = "PENDING_CONFIRMATION", // Waiting for owner to confirm
//   CONFIRMED = "CONFIRMED", // Owner confirmed the marking
//   REJECTED = "REJECTED", // Owner rejected the marking
//   EXPIRED = "EXPIRED", // Confirmation window expired
// }

// /**
//  * Contact person details for property access
//  */
// export interface ContactPerson {
//   name: string;
//   phone: string;
//   relationship?: string; // e.g., "Caretaker", "Neighbor", "Tenant"
//   alternativePhone?: string;
// }

// /**
//  * Property access information
//  */
// export interface PropertyAccessInfo {
//   contactPerson: ContactPerson;
//   accessInstructions?: string;
//   bestTimeToVisit?: string;
//   securityRequirements?: string;
//   parkingAvailability?: boolean;
//   additionalNotes?: string;
// }

// /**
//  * Boundary coordinates for property marking
//  */
// export interface BoundaryCoordinates {
//   type: "Polygon";
//   coordinates: [number, number][][]; // Array of [lng, lat] pairs
// }

// /**
//  * GPS coordinates
//  */
// export interface GPSCoordinates {
//   latitude: number;
//   longitude: number;
//   accuracy?: number; // Accuracy in meters
//   altitude?: number;
//   timestamp?: string;
// }

// /**
//  * Marking completion data
//  */
// export interface MarkingCompletionData {
//   boundaryCoordinates: BoundaryCoordinates;
//   gpsCoordinates: GPSCoordinates;
//   images: MarkingImage[];
//   notes?: string;
//   buildingFingerprint: string;
//   markedAt: string;
//   markerType: MarkerType;
// }

// /**
//  * Marking image data
//  */
// export interface MarkingImage {
//   url: string;
//   description: string;
//   type: MarkingImageType;
//   uploadedAt: string;
// }

// export enum MarkingImageType {
//   EXTERIOR_FRONT = "EXTERIOR_FRONT",
//   EXTERIOR_BACK = "EXTERIOR_BACK",
//   EXTERIOR_SIDE = "EXTERIOR_SIDE",
//   ENTRANCE = "ENTRANCE",
//   LIVING_ROOM = "LIVING_ROOM",
//   BEDROOM = "BEDROOM",
//   KITCHEN = "KITCHEN",
//   BATHROOM = "BATHROOM",
//   COMPOUND = "COMPOUND",
//   STREET_VIEW = "STREET_VIEW",
//   UNIQUE_FEATURES = "UNIQUE_FEATURES",
//   OTHER = "OTHER",
// }

// /**
//  * Marking link data for external markers
//  */
// export interface MarkingLinkData {
//   token: string;
//   propertyId: string;
//   expiresAt: string;
//   markingJobId: string;
//   contactPerson: ContactPerson;
//   propertyAddress: string;
//   instructions?: string;
// }



// /**
//  * Marking job summary for display
//  */
// export interface MarkingJobSummary {
//   id: string;
//   propertyId: string;
//   propertyTitle: string;
//   propertyAddress: string;
//   status: MarkingJobStatus;
//   assignedAgentId?: string;
//   assignedAgentName?: string;
//   markingFee: number;
//   paymentStatus: string;
//   requestedAt: string;
//   completedAt?: string;
//   confirmationStatus?: MarkingConfirmationStatus;
//   confirmationDeadline?: string;
// }

// /**
//  * Proximity criteria for agent assignment
//  */
// export interface ProximityCriteria {
//   propertyCoordinates: GPSCoordinates;
//   maxDistanceKm: number; // Maximum distance in kilometers
//   serviceAreas?: string[]; // Specific service areas to include
// }

// /**
//  * Agent eligibility for marking jobs
//  */
// export interface AgentEligibility {
//   userId: string;
//   isEligible: boolean;
//   reason?: string; // Why not eligible
//   distanceKm?: number;
//   reliabilityScore?: number;
//   completedJobs?: number;
// }

// /**
//  * Marking notification types
//  */
// export enum MarkingNotificationType {
//   JOB_CREATED = "JOB_CREATED",
//   JOB_ASSIGNED = "JOB_ASSIGNED",
//   JOB_AVAILABLE = "JOB_AVAILABLE", // Broadcast to eligible agents
//   JOB_COMPLETED = "JOB_COMPLETED",
//   CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED",
//   CONFIRMATION_REMINDER = "CONFIRMATION_REMINDER",
//   CONFIRMATION_EXPIRED = "CONFIRMATION_EXPIRED",
//   PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
//   PAYMENT_RELEASED = "PAYMENT_RELEASED",
//   QUEUE_POSITION_UPDATED = "QUEUE_POSITION_UPDATED",
//   TIME_SLOT_EXPIRING = "TIME_SLOT_EXPIRING",
//   JOB_CANCELLED = "JOB_CANCELLED",
// }

// /**
//  * Marking statistics
//  */
// export interface MarkingStatistics {
//   totalJobs: number;
//   completedJobs: number;
//   pendingJobs: number;
//   cancelledJobs: number;
//   averageCompletionTime: number; // In hours
//   successRate: number; // Percentage
//   averageConfirmationTime: number; // In hours
// }











// /**
//  * Marking Feature Type Definitions
//  * Defines all types related to property marking and boundary marking system
//  */

// export interface MarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
//   status: MarkingJobStatus;
//   markingType: MarkingType;
//   paymentStatus: PaymentStatus;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: UrgencyLevel;
//   markingFee: number;
//   agentCompensation: number;
//   platformFee: number;
//   queuePosition?: number;
//   timeSlotExpiry?: Date;
//   completionDeadline?: Date;
//   completionNotes?: string;
//   completionImages?: string[];
//   boundaryData?: BoundaryData;
//   createdAt: Date;
//   updatedAt: Date;
//   completedAt?: Date;
// }

// export interface MarkingJobRequest {
//   propertyId: string;
//   markingType: MarkingType;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel?: UrgencyLevel;
// }

// export interface PropertyBoundary {
//   propertyId: string;
//   coordinates: BoundaryCoordinates;
//   markedBy: string; // Agent ID
//   markedAt: Date;
//   verified: boolean;
//   verifiedBy?: string; // Owner/Property owner ID
//   verifiedAt?: Date;
//   images: string[]; // Boundary marking photos
//   fingerprint: string; // Unique identifier for duplicate detection
// }

// export interface BoundaryData {
//   type: "Polygon";
//   coordinates: [number, number][][];
//   center?: {
//     lat: number;
//     lng: number;
//   };
//   area?: number; // in square meters
//   accuracy?: string; // "HIGH" | "MEDIUM" | "LOW"
// }

// export interface BoundaryValidation {
//   isValid: boolean;
//   errors: ValidationError[];
//   warnings: ValidationWarning[];
//   suggestions?: string[];
// }

// export interface ValidationError {
//   type: string;
//   message: string;
//   severity: "ERROR" | "WARNING";
// }

// export interface ValidationWarning {
//   type: string;
//   message: string;
//   suggestion?: string;
// }

// export interface PropertyFingerprint {
//   propertyId: string;
//   gpsCoordinates: {
//     lat: number;
//     lng: number;
//   };
//   buildingFeatures: string[];
//   boundaryArea: number;
//   roofType?: string;
//   colorSignatures?: string[];
//   uniqueMarkers?: string[];
// }

// export interface DuplicateDetectionResult {
//   isDuplicate: boolean;
//   matchingProperties: DuplicateMatch[];
//   confidence: number; // 0-100
//   matchType: "EXACT" | "HIGH_PROBABILITY" | "MODERATE" | "LOW" | "NONE";
// }

// export interface DuplicateMatch {
//   propertyId: string;
//   title: string;
//   address: string;
//   matchConfidence: number; // 0-100
//   matchReasons: string[];
//   boundaryOverlap: number; // percentage
//   fingerprintSimilarity: number; // 0-100
//   owner?: {
//     id: string;
//     name: string;
//   };
// }

// export interface MarkingJobOption {
//   id: string;
//   type: MarkingSelectionType;
//   title: string;
//   description: string;
//   cost: number;
//   estimatedDuration: string;
//   requirements: string[];
// }

// export interface MarkingJobWithShareableLink {
//   jobId: string;
//   shareableLink: string;
//   expiresAt: Date;
//   markerEmail?: string;
//   markerPhone?: string;
// }

// export interface SharedMarkingSession {
//   sessionId: string;
//   jobId: string;
//   markerEmail: string;
//   markerName?: string;
//   token: string;
//   expiresAt: Date;
//   isActive: boolean;
//   startedAt?: Date;
//   completedAt?: Date;
//   boundaryData?: BoundaryData;
// }

// export interface MarkingConfirmation {
//   jobId: string;
//   confirmed: boolean;
//   confirmedBy: string;
//   confirmedAt: Date;
//   notes?: string;
//   issuesIdentified?: string[];
// }

// export interface MarkingJobHistory {
//   jobId: string;
//   propertyId: string;
//   previousMarkings: PreviousMarking[];
//   lastMarking?: PreviousMarking;
//   totalAttempts: number;
//   successCount: number;
//   failureCount: number;
// }

// export interface PreviousMarking {
//   attemptNumber: number;
//   markedBy: string; // Agent ID or "OWNER" or "CONTACT_PERSON"
//   markedAt: Date;
//   status: MarkingJobStatus;
//   boundaryData?: BoundaryData;
//   notes?: string;
//   images?: string[];
//   confirmationStatus?: "PENDING" | "CONFIRMED" | "REJECTED";
//   confirmationDeadline?: Date;
//   confirmationNotes?: string;
// }

// export interface MarkingJobPayment {
//   jobId: string;
//   paymentId: string;
//   amount: number;
//   currency: string;
//   status: PaymentStatus;
//   paymentMethod: string;
//   transactionId?: string;
//   flutterwaveRef?: string;
//   paidAt?: Date;
//   breakdown: {
//     totalFee: number;
//     agentCompensation: number; // 25% of 20,000 = 5,000
//     platformFee: number; // 75% of 20,000 = 15,000
//     taxes?: number;
//   };
// }

// export interface MarkingJobAnalytics {
//   totalJobsCreated: number;
//   jobsByStatus: Record<MarkingJobStatus, number>;
//   jobsByType: Record<MarkingType, number>;
//   averageCompletionTime: number; // in hours
//   completionRate: number; // percentage
//   failureRate: number; // percentage
//   averageAgentRating: number;
//   topPerformingAgents: string[];
//   commonIssues: string[];
// }

// export interface MarkingServiceConfig {
//   ownerMarkingFee: number; // 20,000 NGN
//   agentMarkingFee: number; // 25,000 NGN (for Newcondo to mark)
//   agentCompensationPercentage: number; // 25%
//   platformFeePercentage: number; // 75%
//   timeSlotDuration: number; // in minutes (180 for 3 hours)
//   confirmationDeadline: number; // in days (2-3 days)
//   maxConfirmationAttempts: number;
//   markingJobExpiration: number; // in days
//   shareableLinkExpiration: number; // in hours
// }

// export interface MarkingNotificationData {
//   jobId: string;
//   propertyId: string;
//   propertyAddress: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   markingFee: number;
//   agentCompensation: number;
//   urgencyLevel: UrgencyLevel;
//   queuePosition?: number;
//   timeSlotStart?: Date;
//   timeSlotEnd?: Date;
// }

// // Enums
// export enum MarkingJobStatus {
//   PENDING = "PENDING", // Initial state, awaiting owner decision
//   QUEUED = "QUEUED", // In agent queue
//   ASSIGNED = "ASSIGNED", // Assigned to specific agent
//   IN_PROGRESS = "IN_PROGRESS", // Agent is marking
//   COMPLETED = "COMPLETED", // Agent completed marking
//   CONFIRMED = "CONFIRMED", // Owner confirmed the marking
//   REJECTED = "REJECTED", // Owner rejected the marking
//   CANCELLED = "CANCELLED", // Job cancelled
//   EXPIRED = "EXPIRED", // Job expired without completion
// }

// export enum MarkingType {
//   SELF_MARK = "SELF_MARK", // Owner marks themselves
//   CONTACT_PERSON = "CONTACT_PERSON", // Send to known contact
//   AGENT_QUEUE = "AGENT_QUEUE", // Broadcast to agent queue (25% comp)
//   NEWCONDO_MARK = "NEWCONDO_MARK", // Newcondo marks (25,000 fee)
// }

// export enum MarkingSelectionType {
//   SELF_MARK = "SELF_MARK",
//   CONTACT_PERSON = "CONTACT_PERSON",
//   AGENT_ASSIGNMENT = "AGENT_ASSIGNMENT",
//   NEWCONDO_SERVICE = "NEWCONDO_SERVICE",
// }

// export enum PaymentStatus {
//   PENDING = "PENDING",
//   SUCCESS = "SUCCESS",
//   FAILED = "FAILED",
//   CANCELLED = "CANCELLED",
//   REFUNDED = "REFUNDED",
//   HELD = "HELD",
//   RELEASED = "RELEASED",
// }

// export enum UrgencyLevel {
//   LOW = "LOW",
//   NORMAL = "NORMAL",
//   HIGH = "HIGH",
//   URGENT = "URGENT",
// }

// export interface MarkingFormData {
//   propertyId: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   preferredTime?: Date;
//   urgencyLevel: UrgencyLevel;
//   images?: File[];
// }

// export interface MarkingDrawingState {
//   isDrawing: boolean;
//   coordinates: [number, number][];
//   polygon?: BoundaryData;
//   center?: { lat: number; lng: number };
//   area?: number;
//   isValid: boolean;
// }









// // apps/platform/types/marking.ts

// // Enums
// export type MarkingJobStatus =
//   | 'QUEUED'
//   | 'ASSIGNED'
//   | 'IN_PROGRESS'
//   | 'COMPLETED'
//   | 'CANCELLED'
//   | 'EXPIRED';

// export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD' | 'RELEASED';

// export type ImageType =
//   | 'BOUNDARY'
//   | 'EXTERIOR_FRONT'
//   | 'EXTERIOR_BACK'
//   | 'EXTERIOR_SIDE'
//   | 'LIVING_ROOM'
//   | 'BEDROOM'
//   | 'KITCHEN'
//   | 'BATHROOM'
//   | 'COMPOUND'
//   | 'STREET_VIEW'
//   | 'OTHER';

// export type PropertyCondition =
//   | 'EXCELLENT'
//   | 'GOOD'
//   | 'FAIR'
//   | 'POOR'
//   | 'UNDER_CONSTRUCTION';

// // Core Types
// export interface Coordinates {
//   lat: number;
//   lng: number;
// }

// export interface HierarchicalAddress {
//   state: string;
//   lga: string;
//   location: string;
//   streetAddress?: string;
//   landmark?: string;
// }

// export interface ServiceArea {
//   state: string;
//   lga: string;
//   locations: string[];
// }

// // Marking Job
// export interface MarkingJob {
//   id: string;
//   propertyId: string;
//   requestedBy: string;
//   assignedAgentId?: string;
  
//   // Job details
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   propertyAddress: HierarchicalAddress;
//   propertyImages?: string[];
//   preferredTime?: string;
//   urgencyLevel: UrgencyLevel;
  
//   // Pricing
//   markingFee: number;
//   paymentStatus: PaymentStatus;
  
//   // Status
//   status: MarkingJobStatus;
//   assignedAt?: string;
//   completedAt?: string;
//   timeSlotExpiry?: string;
  
//   // Completion data
//   completionNotes?: string;
//   completionImages?: CompletionImage[];
//   boundaryData?: BoundaryData;
  
//   // Queue
//   queuePosition?: number;
//   maxCompletionTime?: string;
  
//   // Relations
//   property?: PropertyBasic;
//   requestingUser?: UserBasic;
//   assignedAgent?: AgentBasic;
  
//   createdAt: string;
//   updatedAt: string;
// }

// export interface CompletionImage {
//   id: string;
//   url: string;
//   type: ImageType;
//   description?: string;
//   uploadedAt: string;
// }

// export interface BoundaryData {
//   coordinates: Coordinates[];
//   centerPoint: Coordinates;
//   buildingArea?: number;
//   buildingHeight?: number;
//   numberOfFloors?: number;
//   accuracyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
//   notes?: string;
// }

// export interface PropertyBasic {
//   id: string;
//   title: string;
//   address: string;
//   city: string;
//   state: string;
//   gpsCoordinates?: string;
//   images?: string[];
// }

// export interface UserBasic {
//   id: string;
//   name: string;
//   email: string;
//   phone?: string;
//   image?: string;
// }

// export interface AgentBasic extends UserBasic {
//   agentReliabilityScore?: number;
//   totalMarkingJobs: number;
//   completedMarkingJobs: number;
//   serviceAreas?: ServiceArea[];
// }

// // Request/Response Types
// export interface CreateMarkingJobRequest {
//   propertyId: string;
//   contactPersonName: string;
//   contactPersonPhone: string;
//   accessInstructions?: string;
//   propertyAddress: HierarchicalAddress;
//   propertyImages?: string[];
//   preferredTime?: string;
//   urgencyLevel?: UrgencyLevel;
//   notes?: string;
// }

// export interface UpdateMarkingJobRequest {
//   contactPersonName?: string;
//   contactPersonPhone?: string;
//   accessInstructions?: string;
//   propertyAddress?: HierarchicalAddress;
//   propertyImages?: string[];
//   preferredTime?: string;
//   urgencyLevel?: UrgencyLevel;
//   notes?: string;
// }

// export interface MarkingJobResponse {
//   success: boolean;
//   data: MarkingJob;
//   message?: string;
// }

// export interface MarkingJobListResponse {
//   success: boolean;
//   data: MarkingJob[];
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     pages: number;
//   };
//   message?: string;
// }

// export interface MarkingJobStatsResponse {
//   success: boolean;
//   data: {
//     total: number;
//     queued: number;
//     assigned: number;
//     inProgress: number;
//     completed: number;
//     cancelled: number;
//     expired: number;
//     totalSpent: number;
//     averageCompletionTime: number;
//   };
// }

// // Completion Types
// export interface UploadCompletionImagesRequest {
//   images: Array<{
//     file: File;
//     type: ImageType;
//     description?: string;
//   }>;
//   notes?: string;
// }

// export interface CompletionImagesResponse {
//   success: boolean;
//   data: {
//     images: CompletionImage[];
//     totalUploaded: number;
//   };
//   message?: string;
// }

// export interface SubmitBoundaryDataRequest {
//   boundaryCoordinates: Coordinates[];
//   centerPoint: Coordinates;
//   buildingArea?: number;
//   buildingHeight?: number;
//   numberOfFloors?: number;
//   accuracyLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
//   notes?: string;
// }

// export interface BoundaryDataResponse {
//   success: boolean;
//   data: BoundaryData;
//   message?: string;
// }

// export interface CompleteMarkingJobRequest {
//   completionNotes: string;
//   boundaryMarked: boolean;
//   imagesUploaded: boolean;
//   propertyCondition: PropertyCondition;
//   isOccupied: boolean;
//   accessIssues?: string;
//   observations?: string;
//   completedAt: string;
// }

// export interface MarkingCompletionResponse {
//   success: boolean;
//   data: MarkingJob;
//   message?: string;
//   paymentInfo?: {
//     partialPayment: number;
//     remainingPayment: number;
//     confirmationRequired: boolean;
//     confirmationDeadline: string;
//   };
// }

// // Confirmation Types
// export interface ConfirmMarkingRequest {
//   rating: number;
//   feedback?: string;
//   aspectRatings?: {
//     accuracy: number;
//     timeliness: number;
//     communication: number;
//     professionalism: number;
//   };
//   boundaryAccurate: boolean;
//   imagesQualityAcceptable: boolean;
//   wouldRecommend?: boolean;
//   additionalComments?: string;
// }

// export interface RejectMarkingRequest {
//   primaryReason:
//     | 'INCORRECT_PROPERTY'
//     | 'POOR_BOUNDARY_MARKING'
//     | 'INSUFFICIENT_IMAGES'
//     | 'POOR_IMAGE_QUALITY'
//     | 'WRONG_LOCATION'
//     | 'INCOMPLETE_MARKING'
//     | 'UNPROFESSIONAL_CONDUCT'
//     | 'OTHER';
//   detailedExplanation: string;
//   issues: Array<{
//     type: 'BOUNDARY' | 'IMAGES' | 'LOCATION' | 'COMMUNICATION' | 'ACCESS' | 'OTHER';
//     description: string;
//   }>;
//   evidenceImages?: string[];
//   requestReMarking?: boolean;
//   requestRefund?: boolean;
// }

// export interface RequestRevisionRequest {
//   revisionType:
//     | 'BOUNDARY_ADJUSTMENT'
//     | 'ADDITIONAL_IMAGES'
//     | 'BETTER_IMAGE_QUALITY'
//     | 'CORRECT_LOCATION'
//     | 'COMPLETE_MISSING_AREAS'
//     | 'OTHER';
//   revisionRequests: Array<{
//     area: 'BOUNDARY' | 'EXTERIOR' | 'INTERIOR' | 'COMPOUND' | 'STREET_VIEW' | 'OTHER';
//     instruction: string;
//   }>;
//   revisionNotes: string;
//   priority?: 'LOW' | 'NORMAL' | 'HIGH';
//   revisionDeadline?: string;
// }

// export interface MarkingConfirmationResponse {
//   success: boolean;
//   data: {
//     jobId: string;
//     status: string;
//     confirmedAt?: string;
//     rejectedAt?: string;
//     paymentReleased?: boolean;
//     agentRating?: number;
//   };
//   message?: string;
// }

// export interface ConfirmationStatusResponse {
//   success: boolean;
//   data: {
//     jobId: string;
//     isConfirmed: boolean;
//     isRejected: boolean;
//     confirmationDeadline: string;
//     hoursRemaining: number;
//     daysRemaining: number;
//     isExpired: boolean;
//     canConfirm: boolean;
//     canReject: boolean;
//     canRequestRevision: boolean;
//   };
//   message?: string;
// }