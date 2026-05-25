import { Request, Response, NextFunction } from 'express';
/**
 * Rate limiter specifically for queue operations to prevent abuse
 * Implements sliding window counter algorithm with Redis
 */
interface QueueRateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyPrefix?: string;
    skipSuccessfulRequests?: boolean;
    message?: string;
}
/**
 * Creates a rate limiter middleware for queue operations
 */
export declare const createQueueRateLimiter: (options?: QueueRateLimitOptions) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Preset configurations for different queue operations
 */
export declare const queueRateLimiters: {
    joinQueue: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createJob: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    cancelJob: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    completeJob: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
/**
 * Utility function to manually reset rate limit for a user
 * (for admin use or special cases)
 */
export declare const resetQueueRateLimit: (userId: string, keyPrefix?: string) => Promise<boolean>;
/**
 * Utility function to get current rate limit status for a user
 */
export declare const getQueueRateLimitStatus: (userId: string, keyPrefix?: string, windowMs?: number) => Promise<{
    currentCount: number;
    windowStart: Date;
    windowEnd: Date;
}>;
export {};
//# sourceMappingURL=queueRateLimiter.d.ts.map