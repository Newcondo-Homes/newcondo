// backend/gateway/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { config } from "../config/environment";

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("🔴 Gateway Error:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const statusCode = error.statusCode || 500;
  const errorCode = error.code || "INTERNAL_SERVER_ERROR";

  const errorResponse = {
    success: false,
    error: error.message || "Internal server error",
    code: errorCode,
    ...(config.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(statusCode).json(errorResponse);
};
