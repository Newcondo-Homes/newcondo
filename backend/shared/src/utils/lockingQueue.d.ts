export interface QueueItem {
    id: string;
    userId: string;
    propertyId: string;
    unitId?: string;
    amount: number;
    timestamp: number;
    priority: number;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Payment Queue Manager for handling concurrent payment attempts
 */
export declare class PaymentQueueManager {
    private static instance;
    private redis;
    private readonly queuePrefix;
    private constructor();
    static getInstance(): PaymentQueueManager;
    /**
     * Add payment attempt to queue
     */
    enqueue(item: Omit<QueueItem, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Get next item from queue
     */
    dequeue(propertyId: string, unitId?: string): Promise<QueueItem | null>;
    /**
     * Get queue position for a user
     */
    getQueuePosition(userId: string, propertyId: string, unitId?: string): Promise<number | null>;
    /**
     * Get queue size
     */
    getQueueSize(propertyId: string, unitId?: string): Promise<number>;
    /**
     * Remove user from queue
     */
    removeFromQueue(userId: string, propertyId: string, unitId?: string): Promise<boolean>;
    /**
     * Clear queue for a property/unit
     */
    clearQueue(propertyId: string, unitId?: string): Promise<void>;
    /**
     * Get all queued items for a property/unit
     */
    getQueuedItems(propertyId: string, unitId?: string): Promise<QueueItem[]>;
    /**
     * Process stale queue items (timeout after 10 minutes)
     */
    processStaleItems(): Promise<number>;
    /**
     * Helper: Get queue key
     */
    private getQueueKey;
    /**
     * Log payment attempt to database
     */
    private logPaymentAttempt;
}
//# sourceMappingURL=lockingQueue.d.ts.map