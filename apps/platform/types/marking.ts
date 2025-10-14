/**
 * Marking service types for remote property boundary marking
 */

import { Coordinates, BoundaryPolygon, PropertyBoundaryData } from './boundary';

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
//  * Marking option types for property owners
//  */
// export enum MarkingOption {
//   SELF_MARK = "SELF_MARK", // Mark the property themselves
//   NEWCONDO_AGENT = "NEWCONDO_AGENT", // Assign to Newcondo admin
//   SEND_LINK = "SEND_LINK", // Send link to someone they know
//   ASSIGN_TO_AGENTS = "ASSIGN_TO_AGENTS", // Assign to platform agents/renters
// }

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
//  * Marking job creation request
//  */
// export interface CreateMarkingJobRequest {
//   propertyId: string;
//   markingOption: MarkingOption;
//   contactPerson: ContactPerson;
//   accessInstructions?: string;
//   preferredTime?: string;
//   urgencyLevel: UrgencyLevel;
//   propertyImages?: string[]; // Images provided by owner for identification
// }

// /**
//  * Marking confirmation request
//  */
// export interface MarkingConfirmationRequest {
//   markingJobId: string;
//   confirmed: boolean;
//   reason?: string; // Required if rejected
//   feedback?: string;
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