// backend/referral-service/src/middleware/rateLimiting.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { FRAUD_PREVENTION } from '../config/referralRules';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch(console.error);

/**
 * General API rate limiter
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient,
    prefix: 'rl:general:',
  }),
});

/**
 * Rate limiter for referral creation
 */
export const referralCreationRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: FRAUD_PREVENTION.MAX_REFERRALS_PER_DAY,
  message: {
    success: false,
    error: {
      code: 'REFERRAL_LIMIT_EXCEEDED',
      message: `You can only create ${FRAUD_PREVENTION.MAX_REFERRALS_PER_DAY} referrals per day`,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient,
    prefix: 'rl:referral:',
  }),
});

/**
 * Rate limiter for click tracking
 */
export const clickTrackingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 clicks per minute per IP
  message: {
    success: false,
    error: {
      code: 'CLICK_TRACKING_LIMIT_EXCEEDED',
      message: 'Too many click tracking requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient,
    prefix: 'rl:click:',
  }),
});

/**
 * Rate limiter for reward redemption
 */
export const rewardRedemptionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 redemptions per hour
  message: {
    success: false,
    error: {
      code: 'REDEMPTION_LIMIT_EXCEEDED',
      message: 'Too many redemption requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient,
    prefix: 'rl:redemption:',
  }),
});

/**
 * Custom rate limiter for rapid referrals
 */
export const rapidReferralCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const key = `rapid:referral:${userId}`;
    const limit = FRAUD_PREVENTION.MIN_TIME_BETWEEN_REFERRALS_MINUTES;

    // Check last referral time in Redis
    const lastReferralTime = await redisClient.get(key);

    if (lastReferralTime) {
      const timeSinceLastReferral = Date.now() - parseInt(lastReferralTime);
      const minutesSinceLastReferral = timeSinceLastReferral / (1000 * 60);

      if (minutesSinceLastReferral < limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RAPID_REFERRAL_DETECTED',
            message: `Please wait ${Math.ceil(limit - minutesSinceLastReferral)} more minutes before creating another referral`,
          },
        });
      }
    }

    // Set new referral time
    await redisClient.setEx(key, 60 * limit, Date.now().toString());

    next();
  } catch (error) {
    // Don't block request if Redis fails
    console.error('Rapid referral check error:', error);
    next();
  }
};

/**
 * Rate limiter for analytics endpoints
 */
export const analyticsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Max 20 requests per 5 minutes
  message: {
    success: false,
    error: {
      code: 'ANALYTICS_LIMIT_EXCEEDED',
      message: 'Too many analytics requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  store: new RedisStore({
    // @ts-expect-error - Redis client type mismatch
    client: redisClient,
    prefix: 'rl:analytics:',
  }),
});

/**
 * Export Redis client for use in other modules
 */
export { redisClient };