import { Request, Response, NextFunction } from 'express';
export interface LockRequest extends Request {
    lockId?: string;
    propertyId?: string;
    unitId?: string;
}
/**
 * Middleware to acquire property lock before processing payment
 */
export declare const acquirePropertyLock: (req: LockRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to release property lock after processing
 */
export declare const releasePropertyLock: (req: LockRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Cleanup expired locks periodically
 */
export declare const cleanupExpiredLocks: () => Promise<void>;
//# sourceMappingURL=locking.d.ts.map