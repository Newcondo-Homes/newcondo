"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentQueueManager = void 0;
const ioredis_1 = require("ioredis");
const db_1 = require("@newcondo/db");
const lockDurations_1 = require("../constants/lockDurations");
/**
 * Payment Queue Manager for handling concurrent payment attempts
 */
class PaymentQueueManager {
    constructor() {
        this.queuePrefix = 'queue:';
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
        });
    }
    static getInstance() {
        if (!PaymentQueueManager.instance) {
            PaymentQueueManager.instance = new PaymentQueueManager();
        }
        return PaymentQueueManager.instance;
    }
    /**
     * Add payment attempt to queue
     */
    async enqueue(item) {
        const queueKey = this.getQueueKey(item.propertyId, item.unitId);
        const queueItem = {
            ...item,
            id: `${item.userId}_${Date.now()}`,
            timestamp: Date.now(),
        };
        // Add to sorted set with timestamp as score
        await this.redis.zadd(queueKey, queueItem.timestamp, JSON.stringify(queueItem));
        // Log the attempt
        await this.logPaymentAttempt(queueItem, 'QUEUED');
        return queueItem.id;
    }
    /**
     * Get next item from queue
     */
    async dequeue(propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        // Get item with lowest score (earliest timestamp)
        const items = await this.redis.zrange(queueKey, 0, 0);
        if (items.length === 0) {
            return null;
        }
        const queueItem = JSON.parse(items[0]);
        // Remove from queue
        await this.redis.zrem(queueKey, items[0]);
        return queueItem;
    }
    /**
     * Get queue position for a user
     */
    async getQueuePosition(userId, propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        const items = await this.redis.zrange(queueKey, 0, -1);
        for (let i = 0; i < items.length; i++) {
            const item = JSON.parse(items[i]);
            if (item.userId === userId) {
                return i + 1;
            }
        }
        return null;
    }
    /**
     * Get queue size
     */
    async getQueueSize(propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        return await this.redis.zcard(queueKey);
    }
    /**
     * Remove user from queue
     */
    async removeFromQueue(userId, propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        const items = await this.redis.zrange(queueKey, 0, -1);
        for (const item of items) {
            const queueItem = JSON.parse(item);
            if (queueItem.userId === userId) {
                await this.redis.zrem(queueKey, item);
                return true;
            }
        }
        return false;
    }
    /**
     * Clear queue for a property/unit
     */
    async clearQueue(propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        await this.redis.del(queueKey);
    }
    /**
     * Get all queued items for a property/unit
     */
    async getQueuedItems(propertyId, unitId) {
        const queueKey = this.getQueueKey(propertyId, unitId);
        const items = await this.redis.zrange(queueKey, 0, -1);
        return items.map((item) => JSON.parse(item));
    }
    /**
     * Process stale queue items (timeout after 10 minutes)
     */
    async processStaleItems() {
        const pattern = `${this.queuePrefix}*`;
        const keys = await this.redis.keys(pattern);
        let processedCount = 0;
        const staleThreshold = Date.now() - lockDurations_1.LOCK_DURATIONS.QUEUE_TIMEOUT;
        for (const key of keys) {
            const staleItems = await this.redis.zrangebyscore(key, 0, staleThreshold);
            if (staleItems.length > 0) {
                // Remove stale items
                await this.redis.zremrangebyscore(key, 0, staleThreshold);
                // Log as failed attempts
                for (const item of staleItems) {
                    const queueItem = JSON.parse(item);
                    await this.logPaymentAttempt(queueItem, 'TIMEOUT');
                }
                processedCount += staleItems.length;
            }
        }
        return processedCount;
    }
    /**
     * Helper: Get queue key
     */
    getQueueKey(propertyId, unitId) {
        return unitId
            ? `${this.queuePrefix}unit:${unitId}`
            : `${this.queuePrefix}property:${propertyId}`;
    }
    /**
     * Log payment attempt to database
     */
    async logPaymentAttempt(item, status, failureReason) {
        try {
            await db_1.prisma.paymentAttemptLog.create({
                data: {
                    userId: item.userId,
                    propertyId: item.propertyId,
                    unitId: item.unitId,
                    amount: item.amount,
                    status,
                    failureReason,
                    lockAcquired: status === 'SUCCESS',
                    ipAddress: item.ipAddress,
                    userAgent: item.userAgent,
                },
            });
        }
        catch (error) {
            console.error('Failed to log payment attempt:', error);
        }
    }
}
exports.PaymentQueueManager = PaymentQueueManager;
//# sourceMappingURL=lockingQueue.js.map