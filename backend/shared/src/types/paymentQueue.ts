export interface PaymentQueueItem {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  priority: number;
  timestamp: number;
  status: PaymentQueueStatus;
  metadata?: PaymentQueueMetadata;
}

export enum PaymentQueueStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

export interface PaymentQueueMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // milliseconds
}

export interface QueueStats {
  totalQueued: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  averageWaitTime: number;
  peakQueueSize: number;
}

export interface EnqueueResult {
  success: boolean;
  queueId?: string;
  position?: number;
  estimatedWaitTime?: number;
  error?: string;
}

export interface DequeueResult {
  success: boolean;
  item?: PaymentQueueItem;
  error?: string;
}

export interface QueueProcessingResult {
  processed: number;
  successful: number;
  failed: number; // Added the missing 'failed' field
  errors: string[]; // Added 'errors' for detailed failure reasons
}