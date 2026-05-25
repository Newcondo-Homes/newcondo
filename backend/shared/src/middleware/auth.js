"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireAgent = exports.requirePropertyOwner = exports.requireAdmin = exports.validateRequest = exports.requireAccountVerification = exports.requireEmailVerification = exports.requireVerification = exports.requireRole = exports.authenticateOptional = exports.authMiddleware = exports.authenticateToken = void 0;
const express_validator_1 = require("express-validator");
// import { validationResult, FieldValidationError, AlternativeValidationError, GroupedAlternativeValidationError, UnknownValidationError } from "express-validator";
const jwt = __importStar(require("jsonwebtoken"));
const db_1 = require("@newcondo/db");
const response_1 = require("../utils/response");
/**
 * Authentication middleware - verifies JWT token and adds user to request
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;
        if (!token) {
            (0, response_1.sendUnauthorized)(res, "Access token required");
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Verify user still exists and is active
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                verificationStatus: true,
            },
        });
        if (!user) {
            (0, response_1.sendUnauthorized)(res, "Access token required");
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            (0, response_1.sendUnauthorized)(res, "Invalid access token");
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            (0, response_1.sendUnauthorized)(res, "Invalid access token");
            return;
        }
        console.error("Auth middleware error:", error);
        (0, response_1.sendResponse)(res, 500, "Authentication error", null);
        return;
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Main authentication middleware - verifies JWT token and adds user to request
 * This is the primary auth middleware that should be used in most cases
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;
        if (!token) {
            (0, response_1.sendUnauthorized)(res, "Access token required");
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Verify user still exists and is active
        const user = await db_1.prisma.user.findUnique({
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
            (0, response_1.sendUnauthorized)(res, "Invalid or inactive user");
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
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            (0, response_1.sendUnauthorized)(res, "Token expired");
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            (0, response_1.sendUnauthorized)(res, "Invalid access token");
            return;
        }
        console.error("Auth middleware error:", error);
        (0, response_1.sendResponse)(res, 500, "Authentication error", null);
        return;
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Optional authentication middleware - adds user if token is valid, but doesn't require it
 */
const authenticateOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
            }
            catch (error) {
                // Token is invalid, but we don't throw error for optional auth
                console.warn("Invalid token in optional auth:", error);
            }
        }
        next();
    }
    catch (error) {
        console.error("Optional auth middleware error:", error);
        next(); // Continue even if there's an error
    }
};
exports.authenticateOptional = authenticateOptional;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendUnauthorized)(res, "Authentication required");
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, response_1.sendForbidden)(res, "Insufficient permissions");
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireVerification = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendUnauthorized)(res, "Authentication required");
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
exports.requireVerification = requireVerification;
/**
 * Email verification requirement middleware
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendUnauthorized)(res, "Authentication required");
        return;
    }
    if (!req.user.emailVerified) {
        (0, response_1.sendForbidden)(res, "Email verification required");
        return;
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
/**
 * Account verification requirement middleware
 */
const requireAccountVerification = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendUnauthorized)(res, "Authentication required");
        return;
    }
    if (req.user.verificationStatus !== "VERIFIED") {
        (0, response_1.sendForbidden)(res, "Account verification required");
        return;
    }
    next();
};
exports.requireAccountVerification = requireAccountVerification;
/**
 * Account verification requirement middleware
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array(),
        });
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * Admin role requirement middleware
 */
exports.requireAdmin = (0, exports.requireRole)(['ADMIN', 'ADMIN']);
/**
 * Property owner/manager role requirement middleware
 */
exports.requirePropertyOwner = (0, exports.requireRole)([
    'OWNER',
    'AGENT',
    'ADMIN',
    'ADMIN',
]);
/**
 * Agent role requirement middleware
 */
exports.requireAgent = (0, exports.requireRole)(['AGENT', 'ADMIN', 'ADMIN']);
/**
 * Multiple roles requirement middleware
 */
const requireAnyRole = (...roles) => (0, exports.requireRole)(roles);
exports.requireAnyRole = requireAnyRole;
//# sourceMappingURL=auth.js.map