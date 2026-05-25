import { Request, Response, NextFunction } from "express";
import { Role } from "@newcondo/db";
export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    name?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    verificationStatus?: string;
    iat?: number;
    exp?: number;
}
/**
 * Authentication middleware - verifies JWT token and adds user to request
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Main authentication middleware - verifies JWT token and adds user to request
 * This is the primary auth middleware that should be used in most cases
 */
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware - adds user if token is valid, but doesn't require it
 */
export declare const authenticateOptional: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVerification: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Email verification requirement middleware
 */
export declare const requireEmailVerification: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Account verification requirement middleware
 */
export declare const requireAccountVerification: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Account verification requirement middleware
 */
export declare const validateRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Admin role requirement middleware
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Property owner/manager role requirement middleware
 */
export declare const requirePropertyOwner: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Agent role requirement middleware
 */
export declare const requireAgent: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Multiple roles requirement middleware
 */
export declare const requireAnyRole: (...roles: Role[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map