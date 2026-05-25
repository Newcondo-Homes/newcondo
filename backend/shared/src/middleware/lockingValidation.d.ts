import { Request, Response, NextFunction } from 'express';
/**
 * Validate payment lock request
 */
export declare const validateLockRequest: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validate lock release request
 */
export declare const validateLockRelease: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Validate property/unit exists and is available
 */
export declare const validatePropertyAvailability: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=lockingValidation.d.ts.map