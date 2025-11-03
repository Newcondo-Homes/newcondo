// backend/marking-service/src/types/markingHistory.ts

import { MarkingJobStatus, PaymentStatus, UrgencyLevel } from '@prisma/client';

export interface MarkingHistoryItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string | null;
  status: MarkingJobStatus;
  markingFee: string;
  paymentStatus: PaymentStatus;
  contactPerson: {
    name: string;
    phone: string;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    reliabilityScore: string | null;
  } | null;
  requestedBy?: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  assignedAt: string | null;
  completedAt: string | null;
  timeSlotExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkingHistoryResponse {
  jobs: MarkingHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface MarkingJobDetails {
  id: string;
  property: {
    id: string;
    title: string;
    description: string;
    address: string;
    city: string;
    state: string;
    gpsCoordinates: any;
    boundaryCoordinates: any;
    boundaryVerified: boolean;
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }>;
  };
  requestedBy: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    reliabilityScore: string | null;
    completedJobs: number;
    totalJobs: number;
  } | null;
  contactPerson: {
    name: string;
    phone: string;
  };
  accessInstructions: string | null;
  preferredTime: string | null;
  urgencyLevel: UrgencyLevel;
  markingFee: string;
  paymentStatus: PaymentStatus;
  status: MarkingJobStatus;
  queuePosition: number | null;
  assignedAt: string | null;
  completedAt: string | null;
  timeSlotExpiry: string | null;
  maxCompletionTime: string | null;
  completionNotes: string | null;
  completionImages: string[];
  boundaryData: any;
  createdAt: string;
  updatedAt: string;
}

export interface MarkingStatistics {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  cancelledJobs: number;
  completionRate: number;
  totalFees?: string;
  totalEarnings?: string;
  avgCompletionTimeHours: number;
}

export interface ActiveMarkingJob {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    gpsCoordinates: any;
    image: string | null;
  };
  contactPerson: {
    name: string;
    phone: string;
  };
  requestingUser: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  accessInstructions: string | null;
  preferredTime: string | null;
  urgencyLevel: UrgencyLevel;
  status: MarkingJobStatus;
  timeSlotExpiry: string | null;
  maxCompletionTime: string | null;
  assignedAt: string | null;
}

export interface MarkingJobTimelineEvent {
  event: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'cancelled';
}

export interface CompletedMarkingJob {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string | null;
  requestedBy: string | null;
  markingFee: string;
  agentEarning: string;
  completedAt: string | null;
  completionImages: string[];
  completionNotes: string | null;
}

export interface CompletedMarkingJobsResponse {
  jobs: CompletedMarkingJob[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}