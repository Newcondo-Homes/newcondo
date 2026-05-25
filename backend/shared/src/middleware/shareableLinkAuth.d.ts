import { Request, Response, NextFunction } from 'express';
export interface ShareableLinkRequest extends Request {
    markingData?: {
        propertyId: string;
        jobId: string;
        expiresAt: Date;
        markerEmail?: string;
    };
}
/**
 * Middleware to authenticate and validate shareable marking links
 * Used when someone marks a property via a shared link
 */
export declare const authenticateShareableLink: (req: ShareableLinkRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to verify marking job is still pending for shareable link
 */
export declare const verifyJobPending: (req: ShareableLinkRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Rate limiting for shareable link usage to prevent abuse
 */
export declare const rateLimitShareableLinks: (req: ShareableLinkRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shareableLinkAuth.d.ts.map