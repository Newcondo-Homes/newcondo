import { MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@newcondo/db';

export interface MarkingJobRequest {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  markingOption: MarkingOption;
  shareableLink?: string; // For "someone I know" option
}

export enum MarkingOption {
  SELF = 'SELF', // Mark it themselves
  NEWCONDO_ADMIN = 'NEWCONDO_ADMIN', // Assign to Newcondo admin
  SOMEONE_I_KNOW = 'SOMEONE_I_KNOW', // Send link to someone they know
  ASSIGN_TO_AGENTS = 'ASSIGN_TO_AGENTS', // Broadcast to agents in proximity
}

export interface MarkingJobResponse {
  id: string;
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: PaymentStatus;
  status: MarkingJobStatus;
  assignedAgentId?: string;
  assignedAt?: Date;
  completedAt?: Date;
  timeSlotExpiry?: Date;
  queuePosition?: number;
  maxCompletionTime?: Date;
  completionNotes?: string;
  completionImages: string[];
  boundaryData?: BoundaryData;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoundaryData {
  coordinates: GeoCoordinate[];
  center: GeoCoordinate;
  zoom: number;
  mapType: 'satellite' | 'roadmap';
  areaSquareMeters?: number;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface MarkingJobCompletion {
  markingJobId: string;
  boundaryData: BoundaryData;
  completionNotes: string;
  completionImages: string[]; // URLs to uploaded images
}

export interface MarkingJobConfirmation {
  markingJobId: string;
  isApproved: boolean;
  rejectionReason?: string;
  requestNewMarking?: boolean;
}

export interface AgentMarkingProfile {
  userId: string;
  name: string;
  phone: string;
  email: string;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  currentAssignments: number;
  averageCompletionTime: number; // in minutes
  distanceFromProperty?: number; // in kilometers
}

export interface MarkingJobBroadcast {
  markingJobId: string;
  propertyId: string;
  propertyAddress: string;
  propertyCoordinates: GeoCoordinate;
  markingFee: number;
  urgencyLevel: UrgencyLevel;
  preferredTime?: Date;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  expiresAt: Date;
}

export interface MarkingJobAcceptance {
  markingJobId: string;
  agentId: string;
  estimatedArrivalTime?: Date;
}

export interface MarkingJobQueue {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in minutes
  currentAssignment?: {
    agentId: string;
    agentName: string;
    timeSlotExpiry: Date;
  };
}

export interface MarkingPaymentBreakdown {
  totalFee: number;
  agentCommission: number;
  platformFee: number;
  currency: string;
}

export const MARKING_FEES_TYPE = {
  PROPERTY_OWNER_FEE: 20000, // 20,000 NGN
  NEWCONDO_ADMIN_FEE: 25000, // 25,000 NGN
  AGENT_COMMISSION_PERCENTAGE: 0.25, // 25% of property owner fee
  INITIAL_PAYMENT_PERCENTAGE: 0.05, // 5% upfront payment (1,000 NGN)
  CURRENCY: 'NGN',
} as const;

export interface MarkingJobFilters {
  status?: MarkingJobStatus[];
  urgencyLevel?: UrgencyLevel[];
  dateFrom?: Date;
  dateTo?: Date;
  propertyId?: string;
  requestedBy?: string;
  assignedAgentId?: string;
  paymentStatus?: PaymentStatus[];
}

export interface MarkingJobStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  cancelledJobs: number;
  averageCompletionTime: number;
  totalRevenue: number;
  agentCommissionsPaid: number;
}

export interface MarkingNotification {
  type: MarkingNotificationType;
  markingJobId: string;
  recipientId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
}

export enum MarkingNotificationType {
  JOB_CREATED = 'JOB_CREATED',
  JOB_BROADCAST = 'JOB_BROADCAST',
  JOB_ASSIGNED = 'JOB_ASSIGNED',
  JOB_ACCEPTED = 'JOB_ACCEPTED',
  TIME_SLOT_EXPIRING = 'TIME_SLOT_EXPIRING',
  TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
  JOB_COMPLETED = 'JOB_COMPLETED',
  JOB_CONFIRMED = 'JOB_CONFIRMED',
  JOB_REJECTED = 'JOB_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  COMMISSION_PAID = 'COMMISSION_PAID',
  QUEUE_POSITION_UPDATED = 'QUEUE_POSITION_UPDATED',
}

export interface ShareableLinkMetadata {
  markingJobId: string;
  propertyId: string;
  requestedBy: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  expiresAt: Date;
  usageLimit: number;
  timesUsed: number;
}

export interface MarkingJobTimeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isExpired: boolean;
  remainingMinutes: number;
}

export interface MarkingJobValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper type for marking job creation
export type CreateMarkingJobInput = Omit<
  MarkingJobRequest,
  'shareableLink'
> & {
  userId: string;
};

// Helper type for marking job update
export type UpdateMarkingJobInput = Partial<{
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string;
  preferredTime: Date;
  urgencyLevel: UrgencyLevel;
  status: MarkingJobStatus;
}>;

