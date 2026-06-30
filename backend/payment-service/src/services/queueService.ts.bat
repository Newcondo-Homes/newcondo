import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentQueueItem,
  QueueStatus,
  QueuePriority,
  QueueAddRequest,
  QueueProcessResult,
  QueueStats,
  QueueConfiguration,
  DEFAULT_QUEUE_CONFIG
} from '../types/queue';
import { LockingPaymentService } from './lockingPaymentService';

const prisma = new PrismaClient();

export class QueueService {
  private redis: Redis;
  private lockingService: LockingPaymentService;
  private readonly QUEUE_PREFIX = 'payment:queue:';
  private readonly QUEUE_STATS_KEY = 'payment:queue:stats';
  private config: QueueConfiguration;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(redisClient: Redis, lockingService: LockingPaymentService, config?: Partial<QueueConfiguration>) {
    this.redis = redisClient;
    this.lockingService = lockingService;
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
    this.startCleanupJob();
  }

  /**
   * Add item to payment queue
   */
  async addToQueue(request: QueueAddRequest): Promise<PaymentQueueItem | null> {
    try {
      const stats = await this.getQueueStats();
      
      // Check if queue is full
      if (stats.currentQueueSize >= this.config.maxQueueSize) {
        console.warn('Queue is full', { currentSize: stats.currentQueueSize, maxSize: this.config.maxQueueSize });
        return null;
      }

      const queueItem: PaymentQueueItem = {
        id: uuidv4(),
        userId: request.userId,
        propertyId: request.propertyId,
        unitId: request.unitId,
        amount: request.amount,
        position: stats.currentQueueSize + 1,
        status: QueueStatus.PENDING,
        priority: request.priority || QueuePriority.NORMAL,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.maxWaitTime),
        lockAttempts: 0,
        maxLockAttempts: this.config.maxLockAttempts,
        metadata: request.metadata
      };

      // Store in Redis sorted set (sorted by priority and timestamp)
      const score = this.calculateScore(queueItem.priority, queueItem.createdAt);
      const queueKey = this.getQueueKey(request.propertyId, request.unitId);
      
      await this.redis.zadd(
        queueKey,
        score,
        JSON.stringify(queueItem)
      );

      // Update stats
      await this.incrementQueueStat('totalItems');
      await this.incrementQueueStat('pendingItems');

      console.log('Added item to queue', {
        queueItemId: queueItem.id,
        propertyId: request.propertyId,
        unitId: request.unitId,
        position: queueItem.position
      });

      return queueItem;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return null;
    }
  }

  /**
   * Process next item in queue
   */
  async processNextInQueue(propertyId: string, unitId?: string): Promise<QueueProcessResult | null> {
    const queueKey = this.getQueueKey(propertyId, unitId);

    try {
      // Get highest priority item (lowest score)
      const items = await this.redis.zrange(queueKey, 0, 0);
      
      if (items.length === 0) {
        return null;
      }

      const queueItem: PaymentQueueItem = JSON.parse(items[0]);

      // Check if item has expired
      if (new Date() > queueItem.expiresAt) {
        await this.removeFromQueue(queueItem.id, propertyId, unitId);
        await this.updateQueueItemStatus(queueItem.id, QueueStatus.EXPIRED);
        return await this.processNextInQueue(propertyId, unitId); // Try next item
      }

      // Check if max attempts reached
      if (queueItem.lockAttempts >= queueItem.maxLockAttempts) {
        await this.removeFromQueue(queueItem.id, propertyId, unitId);
        await this.updateQueueItemStatus(queueItem.id, QueueStatus.FAILED);
        return {
          queueItemId: queueItem.id,
          success: false,
          lockAcquired: false,
          reason: 'Max lock attempts reached'
        };
      }

      // Update status to processing
      queueItem.status = QueueStatus.PROCESSING;
      queueItem.lockAttempts++;
      await this.updateQueueItem(queueKey, queueItem);

      // Try to acquire lock
      const lockResult = await this.lockingService.acquireLock({
        propertyId: queueItem.propertyId,
        unitId: queueItem.unitId,
        userId: queueItem.userId,
        amount: queueItem.amount,
        lockDuration: this.config.lockTimeout
      });

      if (lockResult.success) {
        // Lock acquired, remove from queue
        await this.removeFromQueue(queueItem.id, propertyId, unitId);
        await this.updateQueueItemStatus(queueItem.id, QueueStatus.LOCKED);
        
        await this.decrementQueueStat('pendingItems');
        await this.incrementQueueStat('completedItems');

        return {
          queueItemId: queueItem.id,
          success: true,
          lockAcquired: true,
          lockId: lockResult.lockId
        };
      } else {
        // Lock not acquired, keep in queue with updated attempt count
        await this.updateQueueItem(queueKey, { ...queueItem, status: QueueStatus.PENDING });

        const nextAttemptAt = new Date(Date.now() + this.config.retryDelay);

        return {
          queueItemId: queueItem.id,
          success: false,
          lockAcquired: false,
          reason: lockResult.reason,
          nextAttemptAt
        };
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      return null;
    }
  }

  /**
   * Get user's position in queue
   */
  async getUserPosition(userId: string, propertyId: string, unitId?: string): Promise<number | null> {
    const queueKey = this.getQueueKey(propertyId, unitId);

    try {
      const items = await this.redis.zrange(queueKey, 0, -1);
      
      for (let i = 0; i < items.length; i++) {
        const queueItem: PaymentQueueItem = JSON.parse(items[i]);
        if (queueItem.userId === userId) {
          return i + 1; // Position is 1-indexed
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user position:', error);
      return null;
    }
  }

  /**
   * Remove item from queue
   */
  async removeFromQueue(queueItemId: string, propertyId: string, unitId?: string): Promise<boolean> {
    const queueKey = this.getQueueKey(propertyId, unitId);

    try {
      const items = await this.redis.zrange(queueKey, 0, -1);
      
      for (const item of items) {
        const queueItem: PaymentQueueItem = JSON.parse(item);
        if (queueItem.id === queueItemId) {
          await this.redis.zrem(queueKey, item);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error removing from queue:', error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const stats = await this.redis.hgetall(this.QUEUE_STATS_KEY);
      const keys = await this.redis.keys(`${this.QUEUE_PREFIX}*`);
      let currentSize = 0;

      for (const key of keys) {
        const count = await this.redis.zcard(key);
        currentSize += count;
      }

      return {
        totalItems: parseInt(stats.totalItems || '0'),
        pendingItems: parseInt(stats.pendingItems || '0'),
        processingItems: parseInt(stats.processingItems || '0'),
        completedItems: parseInt(stats.completedItems || '0'),
        failedItems: parseInt(stats.failedItems || '0'),
        averageWaitTime: parseFloat(stats.averageWaitTime || '0'),
        maxQueueSize: this.config.maxQueueSize,
        currentQueueSize: currentSize
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        totalItems: 0,
        pendingItems: 0,
        processingItems: 0,
        completedItems: 0,
        failedItems: 0,
        averageWaitTime: 0,
        maxQueueSize: this.config.maxQueueSize,
        currentQueueSize: 0
      };
    }
  }

  /**
   * Clean up expired queue items
   */
  async cleanupExpiredItems(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.QUEUE_PREFIX}*`);
      let cleaned = 0;
      const now = new Date();

      for (const key of keys) {
        const items = await this.redis.zrange(key, 0, -1);
        
        for (const item of items) {
          const queueItem: PaymentQueueItem = JSON.parse(item);
          if (queueItem.expiresAt < now) {
            await this.redis.zrem(key, item);
            await this.updateQueueItemStatus(queueItem.id, QueueStatus.EXPIRED);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        await this.redis.hincrby(this.QUEUE_STATS_KEY, 'failedItems', cleaned);
        await this.redis.hincrby(this.QUEUE_STATS_KEY, 'pendingItems', -cleaned);
      }

      return cleaned;
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      return 0;
    }
  }

  /**
   * Start automatic cleanup job
   */
  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(async () => {
      const cleaned = await this.cleanupExpiredItems();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired queue items`);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup job
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Private helper methods

  private getQueueKey(propertyId: string, unitId?: string): string {
    return `${this.QUEUE_PREFIX}${propertyId}${unitId ? `:${unitId}` : ''}`;
  }

  private calculateScore(priority: QueuePriority, createdAt: Date): number {
    // Lower score = higher priority
    // Priority weight (0-3) * 1000000 + timestamp
    return (3 - priority) * 1000000 + createdAt.getTime();
  }

  private async updateQueueItem(queueKey: string, queueItem: PaymentQueueItem): Promise<void> {
    try {
      // Remove old version
      const items = await this.redis.zrange(queueKey, 0, -1);
      for (const item of items) {
        const oldItem: PaymentQueueItem = JSON.parse(item);
        if (oldItem.id === queueItem.id) {
          await this.redis.zrem(queueKey, item);
          break;
        }
      }

      // Add updated version
      const score = this.calculateScore(queueItem.priority, queueItem.createdAt);
      await this.redis.zadd(queueKey, score, JSON.stringify(queueItem));
    } catch (error) {
      console.error('Error updating queue item:', error);
    }
  }

  private async updateQueueItemStatus(queueItemId: string, status: QueueStatus): Promise<void> {
    // This would typically update a database record if you're persisting queue items
    console.log('Queue item status updated', { queueItemId, status });
  }

  private async incrementQueueStat(stat: string): Promise<void> {
    try {
      await this.redis.hincrby(this.QUEUE_STATS_KEY, stat, 1);
    } catch (error) {
      console.error('Error incrementing queue stat:', error);
    }
  }

  private async decrementQueueStat(stat: string): Promise<void> {
    try {
      await this.redis.hincrby(this.QUEUE_STATS_KEY, stat, -1);
    } catch (error) {
      console.error('Error decrementing queue stat:', error);
    }
  }
}