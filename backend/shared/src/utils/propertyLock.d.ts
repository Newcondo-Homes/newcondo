export interface LockInfo {
    lockId: string;
    userId: string;
    acquiredAt: number;
    expiresAt: number;
}
/**
 * Property Lock Manager using Redis for distributed locking
 */
export declare class PropertyLockManager {
    private static instance;
    private redis;
    private readonly lockPrefix;
    private constructor();
    static getInstance(): PropertyLockManager;
    /**
     * Acquire a lock for a property or unit
     */
    acquireLock(resourceKey: string, userId: string, ttl?: number): Promise<string | null>;
    /**
     * Release a lock
     */
    releaseLock(resourceKey: string, lockId: string): Promise<boolean>;
    /**
     * Check if a resource is locked
     */
    isLocked(resourceKey: string): Promise<boolean>;
    /**
     * Get lock information
     */
    getLockInfo(resourceKey: string): Promise<LockInfo | null>;
    /**
     * Extend lock duration
     */
    extendLock(resourceKey: string, lockId: string, additionalTtl: number): Promise<boolean>;
    /**
     * Force release a lock (admin function)
     */
    forceReleaseLock(resourceKey: string): Promise<boolean>;
    /**
     * Cleanup expired locks
     */
    cleanupExpiredLocks(): Promise<number>;
    /**
     * Get all active locks (admin function)
     */
    getAllActiveLocks(): Promise<Map<string, LockInfo>>;
}
//# sourceMappingURL=propertyLock.d.ts.map