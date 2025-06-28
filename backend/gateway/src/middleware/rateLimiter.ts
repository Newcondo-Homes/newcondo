// backend/gateway/src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitInfo {
  totalHits: number;
  totalTime: number;
  resetTime: Date;
}

class RateLimiter {
  private redis: Redis;
  private defaultOptions: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => req.ip,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    message: 'Too many requests, please try again later.'
  };

  constructor(redisInstance: Redis) {
    this.redis = redisInstance;
  }

  create(options: Partial<RateLimitOptions> = {}) {
    const opts = { ...this.defaultOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `rate_limit:${opts.keyGenerator!(req)}`;
        const now = Date.now();
        const windowStart = now - opts.windowMs;

        // Remove old entries and count current requests
        await this.redis.zremrangebyscore(key, 0, windowStart);
        const currentRequests = await this.redis.zcard(key);

        if (currentRequests >= opts.maxRequests) {
          const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
          const resetTime = oldestRequest.length > 0 
            ? new Date(parseInt(oldestRequest[1]) + opts.windowMs)
            : new Date(now + opts.windowMs);

          res.status(429).json({
            error: 'Too Many Requests',
            message: opts.message,
            retryAfter: Math.ceil((resetTime.getTime() - now) / 1000)
          });

          logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            currentRequests,
            maxRequests: opts.maxRequests
          });

          return;
        }

        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis.expire(key, Math.ceil(opts.windowMs / 1000));

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', opts.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - currentRequests - 1));
        res.setHeader('X-RateLimit-Reset', new Date(now + opts.windowMs).toISOString());

        next();
      } catch (error) {
        logger.error('Rate limiter error:', error);
        // Continue on rate limiter failure
        next();
      }
    };
  }

  // Specific rate limiters for different endpoints
  authLimiter() {
    return this.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 login attempts per 15 minutes
      keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || req.body?.phone || 'unknown'}`,
      message: 'Too many authentication attempts, please try again later.'
    });
  }

  apiLimiter() {
    return this.create({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      message: 'API rate limit exceeded, please try again later.'
    });
  }

  uploadLimiter() {
    return this.create({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 uploads per hour
      keyGenerator: (req) => `upload:${req.user?.id || req.ip}`,
      message: 'Upload rate limit exceeded, please try again later.'
    });
  }

  searchLimiter() {
    return this.create({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 searches per minute
      keyGenerator: (req) => `search:${req.user?.id || req.ip}`,
      message: 'Search rate limit exceeded, please try again later.'
    });
  }
}

const rateLimiter = new RateLimiter(redis);

export { rateLimiter, RateLimitOptions, RateLimitInfo };