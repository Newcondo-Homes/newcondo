// backend/gateway/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/environment";
import { UserRole } from "../types/auth";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Authorization token required",
        code: "AUTH_TOKEN_REQUIRED",
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authorization token required",
        code: "AUTH_TOKEN_REQUIRED",
      });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Authentication error",
      code: "AUTH_ERROR",
    });
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  if (
    req.user.role !== UserRole.ADMIN &&
    req.user.role !== UserRole.SUPER_ADMIN
  ) {
    res.status(403).json({
      success: false,
      error: "Admin access required",
      code: "ADMIN_ACCESS_REQUIRED",
    });
    return;
  }

  next();
};

export const verifiedUserMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      error: "Account verification required",
      code: "VERIFICATION_REQUIRED",
    });
    return;
  }

  next();
};
