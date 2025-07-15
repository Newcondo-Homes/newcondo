// backend/marking-service/src/types/markingJob.ts

import { UrgencyLevel, MarkingJobStatus, PaymentStatus } from '@newcondo/db';

export interface CreateMarkingJobData {
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel: UrgencyLevel;
  requestedBy: string;
}

export interface UpdateMarkingJobData {
  contactPersonName?: string;
  contactPersonPhone?: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: UrgencyLevel;
  status?: MarkingJobStatus;
}

export interface MarkingJobFilters {
  status?: MarkingJobStatus;
  urgencyLevel?: UrgencyLevel;
  assignedAgentId?: string;
  requestedBy?: string;
  city?: string;
  paymentStatus?: PaymentStatus;
}

export interface JobCompletionData {
  completionNotes?: string;
  completionImages: string[];
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    area: number;
    perimeter: number;
  };
}

export interface AgentAssignmentData {
  agentId: string;
  timeSlotStart: Date;
  timeSlotEnd: Date;
  estimatedCompletionTime: Date;
}