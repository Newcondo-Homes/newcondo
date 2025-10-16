import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Rate limiter specifically for queue operations to prevent abuse
 * Implements sliding window counter algorithm with Redis
 */

interface QueueRateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Custom error message
}

const defaultOptions: Required<QueueRateLimitOptions> = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 queue operations per hour per user
  keyPrefix: 'queue_rl',
  skipSuccessfulRequests: false,
  message: 'Too many queue operations. Please try again later.',
};

/**
 * Creates a rate limiter middleware for queue operations
 */
export const createQueueRateLimiter = (options: QueueRateLimitOptions = {}) => {
  const opts = { ...defaultOptions, ...options };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.id || (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for queue operations',
        });
      }

      // Create Redis key for this user
      const key = `${opts.keyPrefix}:${userId}`;
      const now = Date.now();
      const windowStart = now - opts.windowMs;

      // Use Redis sorted set for sliding window
      // Score is timestamp, member is unique request ID
      const requestId = `${now}:${Math.random()}`;

      // Remove old entries outside the window
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      const currentCount = await redisClient.zcard(key);

      // Check if limit exceeded
      if (currentCount >= opts.maxRequests) {
        // Get oldest request timestamp to calculate retry-after
        const oldestRequests = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldestRequests.length > 1 ? parseInt(oldestRequests[1]) : now;
        const retryAfter = Math.ceil((oldestTimestamp + opts.windowMs - now) / 1000);

        return res.status(429).json({
          success: false,
          message: opts.message,
          retryAfter: Math.max(retryAfter, 1),
          limit: opts.maxRequests,
          windowMs: opts.windowMs,
        });
      }

      // Add current request to the window
      await redisClient.zadd(key, now, requestId);

      // Set expiry on the key (cleanup)
      await redisClient.expire(key, Math.ceil(opts.windowMs / 1000));

      // Add rate limit info to response headers
      res.setHeader('X-RateLimit-Limit', opts.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (opts.maxRequests - currentCount - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + opts.windowMs).toISOString());

      // Store reference to remove this request if skipSuccessfulRequests is true
      if (opts.skipSuccessfulRequests) {
        (res as any).__rateLimitKey = key;
        (res as any).__rateLimitRequestId = requestId;
        
        // Hook into response finish event
        res.on('finish', async () => {
          // Remove request from count if response was successful (2xx status)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              await redisClient.zrem(key, requestId);
            } catch (error) {
              console.error('Error removing successful request from rate limit:', error);
            }
          }
        });
      }

      next();
    } catch (error) {
      console.error('Queue rate limiter error:', error);
      // On Redis error, allow request but log the error
      next();
    }
  };
};

/**
 * Preset configurations for different queue operations
 */
export const queueRateLimiters = {
  // For joining marking job queues
  joinQueue: createQueueRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // Can join 20 queues per hour
    keyPrefix: 'queue_join',
    message: 'You have joined too many queues recently. Please wait before joining more.',
  }),

  // For creating marking jobs
  createJob: createQueueRateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 5, // Max 5 marking jobs per day
    keyPrefix: 'queue_create',
    message: 'You have reached the daily limit for creating marking jobs. Please try again tomorrow.',
  }),

  // For cancelling marking jobs
  cancelJob: createQueueRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // Max 10 cancellations per hour
    keyPrefix: 'queue_cancel',
    skipSuccessfulRequests: true,
    message: 'Too many cancellation attempts. Please try again later.',
  }),

  // For completing marking jobs
  completeJob: createQueueRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 15, // Max 15 completions per hour (agents working fast)
    keyPrefix: 'queue_complete',
    skipSuccessfulRequests: true,
    message: 'Too many completion attempts. Please contact support if you need assistance.',
  }),
};

/**
 * Utility function to manually reset rate limit for a user
 * (for admin use or special cases)
 */
export const resetQueueRateLimit = async (
  userId: string,
  keyPrefix: string = 'queue_rl'
): Promise<boolean> => {
  try {
    const key = `${keyPrefix}:${userId}`;
    const result = await redisClient.del(key);
    return result > 0;
  } catch (error) {
    console.error('Error resetting queue rate limit:', error);
    return false;
  }
};

/**
 * Utility function to get current rate limit status for a user
 */
export const getQueueRateLimitStatus = async (
  userId: string,
  keyPrefix: string = 'queue_rl',
  windowMs: number = 60 * 60 * 1000
): Promise<{
  currentCount: number;
  windowStart: Date;
  windowEnd: Date;
}> => {
  try {
    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await redisClient.zremrangebyscore(key, 0, windowStart);

    // Get current count
    const currentCount = await redisClient.zcard(key);

    return {
      currentCount,
      windowStart: new Date(windowStart),
      windowEnd: new Date(now),
    };
  } catch (error) {
    console.error('Error getting queue rate limit status:', error);
    return {
      currentCount: 0,
      windowStart: new Date(),
      windowEnd: new Date(),
    };
  }
};