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
exports.rateLimitShareableLinks = exports.verifyJobPending = exports.authenticateShareableLink = void 0;
const linkEncryption_1 = require("../utils/linkEncryption");
const redis_1 = require("../config/redis");
/**
 * Middleware to authenticate and validate shareable marking links
 * Used when someone marks a property via a shared link
 */
const authenticateShareableLink = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing shareable link token',
            });
        }
        // Decrypt and validate the token
        const markingData = (0, linkEncryption_1.decryptShareableLink)(token);
        if (!markingData || !markingData.isValid) {
            return res.status(401).json({
                success: false,
                message: markingData?.isExpired
                    ? 'This shareable link has expired'
                    : 'Invalid or corrupted shareable link',
            });
        }
        req.markingData = {
            propertyId: markingData.propertyId,
            jobId: markingData.markingJobId, // mapped markingJobId to jobId
            expiresAt: markingData.expiresAt,
            markerEmail: markingData.requestedBy, // fallback mapping if applicable
        };
        next();
    }
    catch (error) {
        console.error('Shareable link authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Failed to authenticate shareable link',
        });
    }
};
exports.authenticateShareableLink = authenticateShareableLink;
/**
 * Middleware to verify marking job is still pending for shareable link
 */
const verifyJobPending = async (req, res, next) => {
    try {
        if (!req.markingData) {
            return res.status(400).json({
                success: false,
                message: 'Marking data not found',
            });
        }
        const { prisma } = await Promise.resolve().then(() => __importStar(require('@newcondo/db')));
        const markingJob = await prisma.propertyMarkingJob.findUnique({
            where: { id: req.markingData.jobId },
            select: {
                status: true,
                completedAt: true,
            },
        });
        if (!markingJob) {
            return res.status(404).json({
                success: false,
                message: 'Marking job not found',
            });
        }
        if (markingJob.completedAt) {
            return res.status(400).json({
                success: false,
                message: 'This marking job has already been completed',
            });
        }
        if (markingJob.status !== 'QUEUED' && markingJob.status !== 'ASSIGNED') {
            return res.status(400).json({
                success: false,
                message: `Cannot complete marking. Job status: ${markingJob.status}`,
            });
        }
        next();
    }
    catch (error) {
        console.error('Job verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify marking job status',
        });
    }
};
exports.verifyJobPending = verifyJobPending;
/**
 * Rate limiting for shareable link usage to prevent abuse
 */
const rateLimitShareableLinks = async (req, res, next) => {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token required',
            });
        }
        // TODO: Implement Redis-based rate limiting
        // For now, we'll track in-memory (replace with Redis in production)
        const rateLimitKey = `shareable_link:${ip}:${token}`;
        const limit = 10; // Max 10 requests
        const windowInSeconds = 3600; // Per 1 hour window
        // Increment current hit rate count
        const currentHits = await redis_1.RedisHelper.increment(rateLimitKey, 1);
        if (currentHits !== null) {
            // Set key expiry on the first record hit
            if (currentHits === 1) {
                const { redis } = await Promise.resolve().then(() => __importStar(require('../config/redis')));
                await redis.expire(rateLimitKey, windowInSeconds);
            }
            if (currentHits > limit) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests on this link. Please try again in an hour.',
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Don't block on rate limit errors
    }
};
exports.rateLimitShareableLinks = rateLimitShareableLinks;
//# sourceMappingURL=shareableLinkAuth.js.map