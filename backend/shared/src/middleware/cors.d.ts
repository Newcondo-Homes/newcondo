import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Standard CORS middleware.
 *
 * Usage in any service's app.ts:
 *   import { corsMiddleware } from '@newcondo/backend-shared/middleware/cors';
 *   app.use(corsMiddleware);
 */
export declare const corsMiddleware: RequestHandler;
/**
 * Explicit OPTIONS preflight handler.
 * Mount this BEFORE the main router so browsers get an immediate 204.
 *
 * Usage:
 *   app.options('*', preflightHandler);
 */
export declare const preflightHandler: RequestHandler;
/**
 * Convenience function for services that need to override CORS options at
 * mount-time (e.g. the combined-backend gateway).
 */
export declare function createCorsMiddleware(extraOrigins?: string[]): RequestHandler;
/**
 * CORS error handler — call this after your main error handler so CORS
 * rejections return a clean 403 instead of a generic 500.
 */
export declare function corsErrorHandler(err: Error, _req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=cors.d.ts.map