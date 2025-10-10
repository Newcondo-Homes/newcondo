import { 
  PropertyMarkingJob, 
  MarkingJobStatus, 
  UrgencyLevel, 
  PaymentStatus 
} from '@newcondo/db';

// Property Marking Request Types
export interface CreateMarkingJobRequest {
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  markingMethod: MarkingMethod;
  assignedAgentId?: string; // For direct assignment
  shareableLink?: string; // For "someone you know" method
}

export enum MarkingMethod {
  SELF = 'SELF', // Mark by themselves
  NEWCONDO_ADMIN = 'NEWCONDO_ADMIN', // Assign to Newcondo admin
  SOMEONE_KNOWN = 'SOMEONE_KNOWN', // Send shareable link to someone
  AGENT_POOL = 'AGENT_POOL' // Broadcast to available agents
}

// Marking Job Response Types
export interface MarkingJobResponse {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: PaymentStatus;
  status: MarkingJobStatus;
  assignedAt?: Date;
  completedAt?: Date;
  timeSlotExpiry?: Date;
  queuePosition?: number;
  maxCompletionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Agent Assignment Types
export interface AgentAssignmentRequest {
  markingJobId: string;
  agentId: string;
  timeSlot: TimeSlot;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in hours
}

// Queue Management Types
export interface MarkingJobQueue {
  jobId: string;
  propertyId: string;
  queuePosition: number;
  estimatedWaitTime: number; // in minutes
  agentsInQueue: AgentQueueInfo[];
}

export interface AgentQueueInfo {
  agentId: string;
  agentName: string;
  queuePosition: number;
  timeSlotStart: Date;
  timeSlotEnd: Date;
  status: AgentQueueStatus;
}

export enum AgentQueueStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Marking Completion Types
export interface CompleteMarkingJobRequest {
  markingJobId: string;
  agentId: string;
  completionNotes?: string;
  completionImages: string[];
  boundaryData: BoundaryData;
}

export interface BoundaryData {
  coordinates: Coordinate[];
  center: Coordinate;
  area: number; // in square meters
  fingerprint: string;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

// Marking Confirmation Types
export interface ConfirmMarkingRequest {
  markingJobId: string;
  propertyOwnerId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

export interface MarkingConfirmationResponse {
  markingJobId: string;
  confirmed: boolean;
  paymentReleased: boolean;
  agentCompensation?: number;
  confirmationDeadline: Date;
}

// Payment Types for Marking Service
export interface MarkingPaymentBreakdown {
  totalFee: number;
  agentCompensation: number; // 25% for agents, 0% for Newcondo admin
  platformFee: number; // 75% for agent jobs, 100% for admin jobs
  initialPayment: number; // Small payment upon completion (~1000 NGN)
  remainingPayment: number; // Released after confirmation
}

export const MARKING_FEES = {
  AGENT_POOL: 20000, // 20,000 NGN for agent marking
  NEWCONDO_ADMIN: 25000, // 25,000 NGN for Newcondo admin marking
  SOMEONE_KNOWN: 0, // Free for someone you know
  SELF: 0 // Free for self-marking
} as const;

export const AGENT_COMPENSATION_PERCENTAGE = 0.25; // 25%
export const INITIAL_PAYMENT_AMOUNT = 1000; // 1,000 NGN
export const MARKING_CONFIRMATION_WINDOW = 2 * 24 * 60 * 60 * 1000; // 2 days in ms
export const TIME_SLOT_DURATION = 3; // 3 hours

// Notification Types
export interface MarkingJobNotification {
  jobId: string;
  propertyId: string;
  propertyAddress: string;
  contactPerson: string;
  contactPhone: string;
  preferredTime?: Date;
  markingFee: number;
  agentCompensation: number;
  distance?: number; // Distance from agent's location in km
}

// Shareable Link Types
export interface ShareableMarkingLink {
  token: string;
  markingJobId: string;
  expiresAt: Date;
  used: boolean;
}

// Marking Job Statistics
export interface MarkingJobStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  averageCompletionTime: number; // in hours
  averageConfirmationTime: number; // in hours
  successRate: number; // percentage
}

// Error Types
export class MarkingJobError extends Error {
  constructor(
    message: string,
    public code: MarkingJobErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'MarkingJobError';
  }
}

export enum MarkingJobErrorCode {
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PROPERTY_NOT_FOUND = 'PROPERTY_NOT_FOUND',
  PROPERTY_ALREADY_MARKED = 'PROPERTY_ALREADY_MARKED',
  AGENT_UNAVAILABLE = 'AGENT_UNAVAILABLE',
  TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
  QUEUE_FULL = 'QUEUE_FULL',
  INVALID_BOUNDARY_DATA = 'INVALID_BOUNDARY_DATA',
  CONFIRMATION_EXPIRED = 'CONFIRMATION_EXPIRED',
  ALREADY_CONFIRMED = 'ALREADY_CONFIRMED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE'
}

// Proximity Search Types
export interface ProximitySearchParams {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
  maxResults?: number;
}

export interface NearbyAgent {
  agentId: string;
  agentName: string;
  distance: number; // in km
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  isAvailable: boolean;
}

// Hierarchical Address Types (Nigerian Geography)
export interface HierarchicalAddress {
  state: string;
  lga: string; // Local Government Area
  city?: string;
  location: string; // Lowest level location
  streetAddress?: string;
}

// Validation Types
export interface MarkingJobValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}