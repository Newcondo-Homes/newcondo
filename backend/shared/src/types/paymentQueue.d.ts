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
export declare enum PaymentQueueStatus {
    QUEUED = "QUEUED",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    TIMEOUT = "TIMEOUT",
    CANCELLED = "CANCELLED"
}
export interface PaymentQueueMetadata {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
}
export interface PaymentQueuePosition {
    position: number;
    totalInQueue: number;
    estimatedWaitTime: number;
}
export interface PaymentQueueStats {
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
    failed: number;
    errors: string[];
}
//# sourceMappingURL=paymentQueue.d.ts.map