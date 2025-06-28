import { Request, Response, NextFunction } from "express";
import { config } from "../config/environment";

interface LogData {
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: string;
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!config.ENABLE_REQUEST_LOGGING) {
    return next();
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Capture original res.end
  const originalEnd = res.end;

  res.end = function (chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;

    const logData: LogData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress || "unknown",
      userId: (req as any).user?.id,
      timestamp,
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      console.error("🔴 Server Error:", logData);
    } else if (res.statusCode >= 400) {
      console.warn("🟡 Client Error:", logData);
    } else if (config.LOG_LEVEL === "debug") {
      console.log("🟢 Request:", logData);
    }

    // Call original res.end
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
