import { Request, Response, NextFunction } from 'express';

/**
 * Simple request logging middleware.
 * Logs incoming request details to the console.
 */
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime(); // High-resolution time for precise timing

  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = (end[0] * 1000 + end[1] / 1000000).toFixed(2); // Convert to milliseconds

    console.info(`[REQUEST] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

export const requestLogger = null