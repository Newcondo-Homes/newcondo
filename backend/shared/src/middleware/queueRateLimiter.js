"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueRateLimitStatus = exports.resetQueueRateLimit = exports.queueRateLimiters = exports.createQueueRateLimiter = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const defaultOptions = {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 queue operations per hour per user
    keyPrefix: 'queue_rl',
    skipSuccessfulRequests: false,
    message: 'Too many queue operations. Please try again later.',
};
/**
 * Creates a rate limiter middleware for queue operations
 */
const createQueueRateLimiter = (options = {}) => {
    const opts = { ...defaultOptions, ...options };
    return async (req, res, next) => {
        try {
            // Get user ID from authenticated request
            const userId = req.user?.id || req.userId;
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
            await redis_1.default.zremrangebyscore(key, 0, windowStart);
            // Count current requests in window
            const currentCount = await redis_1.default.zcard(key);
            // Check if limit exceeded
            if (currentCount >= opts.maxRequests) {
                // Get oldest request timestamp to calculate retry-after
                const oldestRequests = await redis_1.default.zrange(key, 0, 0, 'WITHSCORES');
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
            await redis_1.default.zadd(key, now, requestId);
            // Set expiry on the key (cleanup)
            await redis_1.default.expire(key, Math.ceil(opts.windowMs / 1000));
            // Add rate limit info to response headers
            res.setHeader('X-RateLimit-Limit', opts.maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', (opts.maxRequests - currentCount - 1).toString());
            res.setHeader('X-RateLimit-Reset', new Date(now + opts.windowMs).toISOString());
            // Store reference to remove this request if skipSuccessfulRequests is true
            if (opts.skipSuccessfulRequests) {
                res.__rateLimitKey = key;
                res.__rateLimitRequestId = requestId;
                // Hook into response finish event
                res.on('finish', async () => {
                    // Remove request from count if response was successful (2xx status)
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            await redis_1.default.zrem(key, requestId);
                        }
                        catch (error) {
                            console.error('Error removing successful request from rate limit:', error);
                        }
                    }
                });
            }
            next();
        }
        catch (error) {
            console.error('Queue rate limiter error:', error);
            // On Redis error, allow request but log the error
            next();
        }
    };
};
exports.createQueueRateLimiter = createQueueRateLimiter;
/**
 * Preset configurations for different queue operations
 */
exports.queueRateLimiters = {
    // For joining marking job queues
    joinQueue: (0, exports.createQueueRateLimiter)({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20, // Can join 20 queues per hour
        keyPrefix: 'queue_join',
        message: 'You have joined too many queues recently. Please wait before joining more.',
    }),
    // For creating marking jobs
    createJob: (0, exports.createQueueRateLimiter)({
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        maxRequests: 5, // Max 5 marking jobs per day
        keyPrefix: 'queue_create',
        message: 'You have reached the daily limit for creating marking jobs. Please try again tomorrow.',
    }),
    // For cancelling marking jobs
    cancelJob: (0, exports.createQueueRateLimiter)({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10, // Max 10 cancellations per hour
        keyPrefix: 'queue_cancel',
        skipSuccessfulRequests: true,
        message: 'Too many cancellation attempts. Please try again later.',
    }),
    // For completing marking jobs
    completeJob: (0, exports.createQueueRateLimiter)({
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
const resetQueueRateLimit = async (userId, keyPrefix = 'queue_rl') => {
    try {
        const key = `${keyPrefix}:${userId}`;
        const result = await redis_1.default.del(key);
        return result > 0;
    }
    catch (error) {
        console.error('Error resetting queue rate limit:', error);
        return false;
    }
};
exports.resetQueueRateLimit = resetQueueRateLimit;
/**
 * Utility function to get current rate limit status for a user
 */
const getQueueRateLimitStatus = async (userId, keyPrefix = 'queue_rl', windowMs = 60 * 60 * 1000) => {
    try {
        const key = `${keyPrefix}:${userId}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        // Remove old entries
        await redis_1.default.zremrangebyscore(key, 0, windowStart);
        // Get current count
        const currentCount = await redis_1.default.zcard(key);
        return {
            currentCount,
            windowStart: new Date(windowStart),
            windowEnd: new Date(now),
        };
    }
    catch (error) {
        console.error('Error getting queue rate limit status:', error);
        return {
            currentCount: 0,
            windowStart: new Date(),
            windowEnd: new Date(),
        };
    }
};
exports.getQueueRateLimitStatus = getQueueRateLimitStatus;
//# sourceMappingURL=queueRateLimiter.js.map