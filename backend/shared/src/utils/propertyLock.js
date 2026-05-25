"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyLockManager = void 0;
const ioredis_1 = require("ioredis");
const uuid_1 = require("uuid");
const lockDurations_1 = require("../constants/lockDurations");
/**
 * Property Lock Manager using Redis for distributed locking
 */
class PropertyLockManager {
    constructor() {
        this.lockPrefix = 'lock:';
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
    }
    static getInstance() {
        if (!PropertyLockManager.instance) {
            PropertyLockManager.instance = new PropertyLockManager();
        }
        return PropertyLockManager.instance;
    }
    /**
     * Acquire a lock for a property or unit
     */
    async acquireLock(resourceKey, userId, ttl = lockDurations_1.LOCK_DURATIONS.PAYMENT_LOCK) {
        const lockId = (0, uuid_1.v4)();
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const now = Date.now();
        const lockInfo = {
            lockId,
            userId,
            acquiredAt: now,
            expiresAt: now + ttl,
        };
        // Use SET NX (set if not exists) with expiration
        const result = await this.redis.set(lockKey, JSON.stringify(lockInfo), 'PX', ttl, 'NX');
        return result === 'OK' ? lockId : null;
    }
    /**
     * Release a lock
     */
    async releaseLock(resourceKey, lockId) {
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const lockData = await this.redis.get(lockKey);
        if (!lockData) {
            return false;
        }
        const lockInfo = JSON.parse(lockData);
        // Only allow the lock owner to release it
        if (lockInfo.lockId !== lockId) {
            return false;
        }
        await this.redis.del(lockKey);
        return true;
    }
    /**
     * Check if a resource is locked
     */
    async isLocked(resourceKey) {
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const exists = await this.redis.exists(lockKey);
        return exists === 1;
    }
    /**
     * Get lock information
     */
    async getLockInfo(resourceKey) {
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const lockData = await this.redis.get(lockKey);
        if (!lockData) {
            return null;
        }
        return JSON.parse(lockData);
    }
    /**
     * Extend lock duration
     */
    async extendLock(resourceKey, lockId, additionalTtl) {
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const lockData = await this.redis.get(lockKey);
        if (!lockData) {
            return false;
        }
        const lockInfo = JSON.parse(lockData);
        // Verify lock ownership
        if (lockInfo.lockId !== lockId) {
            return false;
        }
        // Extend expiration
        lockInfo.expiresAt += additionalTtl;
        await this.redis.set(lockKey, JSON.stringify(lockInfo), 'PX', lockInfo.expiresAt - Date.now());
        return true;
    }
    /**
     * Force release a lock (admin function)
     */
    async forceReleaseLock(resourceKey) {
        const lockKey = `${this.lockPrefix}${resourceKey}`;
        const result = await this.redis.del(lockKey);
        return result === 1;
    }
    /**
     * Cleanup expired locks
     */
    async cleanupExpiredLocks() {
        const pattern = `${this.lockPrefix}*`;
        const keys = await this.redis.keys(pattern);
        let cleanedCount = 0;
        for (const key of keys) {
            const lockData = await this.redis.get(key);
            if (!lockData)
                continue;
            const lockInfo = JSON.parse(lockData);
            if (Date.now() > lockInfo.expiresAt) {
                await this.redis.del(key);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    /**
     * Get all active locks (admin function)
     */
    async getAllActiveLocks() {
        const pattern = `${this.lockPrefix}*`;
        const keys = await this.redis.keys(pattern);
        const locks = new Map();
        for (const key of keys) {
            const lockData = await this.redis.get(key);
            if (!lockData)
                continue;
            const resourceKey = key.replace(this.lockPrefix, '');
            locks.set(resourceKey, JSON.parse(lockData));
        }
        return locks;
    }
}
exports.PropertyLockManager = PropertyLockManager;
//# sourceMappingURL=propertyLock.js.map