// backend/shared/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
// import { validationResult, FieldValidationError, AlternativeValidationError, GroupedAlternativeValidationError, UnknownValidationError } from "express-validator";
import * as jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { prisma, Role } from "@newcondo/db";
import {
  sendResponse,
  sendUnauthorized,
  sendForbidden,
} from "../utils/response";

// JWT payload interface
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
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      sendUnauthorized(res, "Access token required");
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET! as StringValue
    ) as any;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, "Access token required");
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Invalid access token");
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, "Invalid access token");
      return;
    }

    console.error("Auth middleware error:", error);
    sendResponse(res, 500, "Authentication error", null);
    return;
  }
};

/**
 * Main authentication middleware - verifies JWT token and adds user to request
 * This is the primary auth middleware that should be used in most cases
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      sendUnauthorized(res, "Access token required");
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET! as StringValue
    ) as JWTPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, "Invalid or inactive user");
      return;
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
      verificationStatus: user.verificationStatus || undefined,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, "Token expired");
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, "Invalid access token");
      return;
    }

    console.error("Auth middleware error:", error);
    sendResponse(res, 500, "Authentication error", null);
    return;
  }
};

/**
 * Optional authentication middleware - adds user if token is valid, but doesn't require it
 */
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET! as StringValue
        ) as JWTPayload;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name,
          emailVerified: decoded.emailVerified,
          phoneVerified: decoded.phoneVerified,
          verificationStatus: decoded.verificationStatus,
          iat: decoded.iat,
          exp: decoded.exp,
        };
      } catch (error) {
        // Token is invalid, but we don't throw error for optional auth
        console.warn("Invalid token in optional auth:", error);
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue even if there's an error
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res, "Authentication required");
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, "Insufficient permissions");
      return;
    }

    next();
  };
};

export const requireVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    sendUnauthorized(res, "Authentication required");
    return;
  }

  if (req.user.verificationStatus !== "VERIFIED") {
    return res.status(403).json({
      success: false,
      message: "Account verification required",
    });
  }

  next();
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendUnauthorized(res, "Authentication required");
    return;
  }

  if (!req.user.emailVerified) {
    sendForbidden(res, "Email verification required");
    return;
  }

  next();
};

/**
 * Account verification requirement middleware
 */
export const requireAccountVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendUnauthorized(res, "Authentication required");
    return;
  }

  if (req.user.verificationStatus !== "VERIFIED") {
    sendForbidden(res, "Account verification required");
    return;
  }

  next();
};

/**
 * Account verification requirement middleware
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Admin role requirement middleware
 */
export const requireAdmin = requireRole([Role.ADMIN, Role.ADMIN]);

/**
 * Property owner/manager role requirement middleware
 */
export const requirePropertyOwner = requireRole([
  Role.OWNER,
  Role.AGENT,
  Role.ADMIN,
  Role.ADMIN,
]);

/**
 * Agent role requirement middleware
 */
export const requireAgent = requireRole([Role.AGENT, Role.ADMIN, Role.ADMIN]);

/**
 * Multiple roles requirement middleware
 */
export const requireAnyRole = (...roles: Role[]) => requireRole(roles);
