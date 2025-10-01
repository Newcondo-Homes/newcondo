import { Redis } from 'ioredis';
import { prisma } from '@newcondo/db';
import { LOCK_DURATIONS } from '../constants/lockDurations';

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
export class PaymentQueueManager {
  private static instance: PaymentQueueManager;
  private redis: Redis;
  private readonly queuePrefix = 'queue:';

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  public static getInstance(): PaymentQueueManager {
    if (!PaymentQueueManager.instance) {
      PaymentQueueManager.instance = new PaymentQueueManager();
    }
    return PaymentQueueManager.instance;
  }

  /**
   * Add payment attempt to queue
   */
  async enqueue(item: Omit<QueueItem, 'id' | 'timestamp'>): Promise<string> {
    const queueKey = this.getQueueKey(item.propertyId, item.unitId);
    const queueItem: QueueItem = {
      ...item,
      id: `${item.userId}_${Date.now()}`,
      timestamp: Date.now(),
    };

    // Add to sorted set with timestamp as score
    await this.redis.zadd(
      queueKey,
      queueItem.timestamp,
      JSON.stringify(queueItem)
    );

    // Log the attempt
    await this.logPaymentAttempt(queueItem, 'QUEUED');

    return queueItem.id;
  }

  /**
   * Get next item from queue
   */
  async dequeue(propertyId: string, unitId?: string): Promise<QueueItem | null> {
    const queueKey = this.getQueueKey(propertyId, unitId);

    // Get item with lowest score (earliest timestamp)
    const items = await this.redis.zrange(queueKey, 0, 0);

    if (items.length === 0) {
      return null;
    }

    const queueItem: QueueItem = JSON.parse(items[0]);

    // Remove from queue
    await this.redis.zrem(queueKey, items[0]);

    return queueItem;
  }

  /**
   * Get queue position for a user
   */
  async getQueuePosition(
    userId: string,
    propertyId: string,
    unitId?: string
  ): Promise<number | null> {
    const queueKey = this.getQueueKey(propertyId, unitId);
    const items = await this.redis.zrange(queueKey, 0, -1);

    for (let i = 0; i < items.length; i++) {
      const item: QueueItem = JSON.parse(items[i]);
      if (item.userId === userId) {
        return i + 1;
      }
    }

    return null;
  }

  /**
   * Get queue size
   */
  async getQueueSize(propertyId: string, unitId?: string): Promise<number> {
    const queueKey = this.getQueueKey(propertyId, unitId);
    return await this.redis.zcard(queueKey);
  }

  /**
   * Remove user from queue
   */
  async removeFromQueue(
    userId: string,
    propertyId: string,
    unitId?: string
  ): Promise<boolean> {
    const queueKey = this.getQueueKey(propertyId, unitId);
    const items = await this.redis.zrange(queueKey, 0, -1);

    for (const item of items) {
      const queueItem: QueueItem = JSON.parse(item);
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
  async clearQueue(propertyId: string, unitId?: string): Promise<void> {
    const queueKey = this.getQueueKey(propertyId, unitId);
    await this.redis.del(queueKey);
  }

  /**
   * Get all queued items for a property/unit
   */
  async getQueuedItems(propertyId: string, unitId?: string): Promise<QueueItem[]> {
    const queueKey = this.getQueueKey(propertyId, unitId);
    const items = await this.redis.zrange(queueKey, 0, -1);

    return items.map((item) => JSON.parse(item));
  }

  /**
   * Process stale queue items (timeout after 10 minutes)
   */
  async processStaleItems(): Promise<number> {
    const pattern = `${this.queuePrefix}*`;
    const keys = await this.redis.keys(pattern);
    let processedCount = 0;

    const staleThreshold = Date.now() - LOCK_DURATIONS.QUEUE_TIMEOUT;

    for (const key of keys) {
      const staleItems = await this.redis.zrangebyscore(
        key,
        0,
        staleThreshold
      );

      if (staleItems.length > 0) {
        // Remove stale items
        await this.redis.zremrangebyscore(key, 0, staleThreshold);

        // Log as failed attempts
        for (const item of staleItems) {
          const queueItem: QueueItem = JSON.parse(item);
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
  private getQueueKey(propertyId: string, unitId?: string): string {
    return unitId
      ? `${this.queuePrefix}unit:${unitId}`
      : `${this.queuePrefix}property:${propertyId}`;
  }

  /**
   * Log payment attempt to database
   */
  private async logPaymentAttempt(
    item: QueueItem,
    status: string,
    failureReason?: string
  ): Promise<void> {
    try {
      await prisma.paymentAttemptLog.create({
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
    } catch (error) {
      console.error('Failed to log payment attempt:', error);
    }
  }
}