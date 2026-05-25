import { Request, Response, NextFunction } from 'express';
import { Role } from '@newcondo/db';
export interface MarkingAuthRequest extends Request {
    user?: {
        id: string;
        role: Role;
        email: string;
    };
}
/**
 * Middleware to authenticate users for marking-related operations
 * Only property owners and agents can request marking jobs
 */
export declare const authenticateMarking: (req: MarkingAuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to verify user can request marking jobs
 * Only OWNER and AGENT roles can request marking
 */
export declare const canRequestMarking: (req: MarkingAuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to verify user can perform marking jobs
 * Agents and premium renters with marking capability
 */
export declare const canPerformMarking: (req: MarkingAuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to verify virtual account exists for user
 * Required before creating marking jobs that involve payment
 */
export declare const requireVirtualAccount: (req: MarkingAuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user owns the property
 */
export declare const verifyPropertyOwnership: (req: MarkingAuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=markingAuth.d.ts.map