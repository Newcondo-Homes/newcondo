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