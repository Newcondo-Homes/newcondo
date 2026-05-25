"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPropertyOwnership = exports.requireVirtualAccount = exports.canPerformMarking = exports.canRequestMarking = exports.authenticateMarking = void 0;
const jwt_1 = require("../utils/jwt");
const db_1 = require("@newcondo/db");
/**
 * Middleware to authenticate users for marking-related operations
 * Only property owners and agents can request marking jobs
 */
const authenticateMarking = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required',
            });
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                role: true,
                email: true,
                isPremium: true,
                isAvailableForMarking: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        req.user = {
            id: user.id,
            role: user.role,
            email: user.email,
        };
        next();
    }
    catch (error) {
        console.error('Marking authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};
exports.authenticateMarking = authenticateMarking;
/**
 * Middleware to verify user can request marking jobs
 * Only OWNER and AGENT roles can request marking
 */
const canRequestMarking = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const allowedRoles = ['OWNER', 'AGENT'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only property owners and agents can request marking jobs',
            });
        }
        next();
    }
    catch (error) {
        console.error('Request marking authorization error:', error);
        return res.status(403).json({
            success: false,
            message: 'Authorization failed',
        });
    }
};
exports.canRequestMarking = canRequestMarking;
/**
 * Middleware to verify user can perform marking jobs
 * Agents and premium renters with marking capability
 */
const canPerformMarking = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                role: true,
                isPremium: true,
                isAvailableForMarking: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Check if user can perform marking
        const canMark = (user.role === 'AGENT' && user.isAvailableForMarking) ||
            (user.role === 'RENTER' && user.isPremium && user.isAvailableForMarking);
        if (!canMark) {
            return res.status(403).json({
                success: false,
                message: 'You are not eligible to perform marking jobs. ' +
                    'Agents must be available for marking, and renters must have an active premium plan.',
            });
        }
        next();
    }
    catch (error) {
        console.error('Perform marking authorization error:', error);
        return res.status(403).json({
            success: false,
            message: 'Authorization failed',
        });
    }
};
exports.canPerformMarking = canPerformMarking;
/**
 * Middleware to verify virtual account exists for user
 * Required before creating marking jobs that involve payment
 */
const requireVirtualAccount = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const virtualAccount = await db_1.prisma.virtualAccount.findFirst({
            where: {
                userId: req.user.id,
                isActive: true,
            },
        });
        if (!virtualAccount) {
            return res.status(400).json({
                success: false,
                message: 'Virtual account required. Please complete account setup first.',
            });
        }
        next();
    }
    catch (error) {
        console.error('Virtual account check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify virtual account',
        });
    }
};
exports.requireVirtualAccount = requireVirtualAccount;
/**
 * Middleware to check if user owns the property
 */
const verifyPropertyOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const propertyId = req.params.propertyId || req.body.propertyId;
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                message: 'Property ID required',
            });
        }
        const property = await db_1.prisma.property.findUnique({
            where: { id: propertyId },
            select: {
                ownerId: true,
                agentId: true,
            },
        });
        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
            });
        }
        // Check if user is owner or assigned agent
        const isAuthorized = property.ownerId === req.user.id ||
            property.agentId === req.user.id;
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action on this property',
            });
        }
        next();
    }
    catch (error) {
        console.error('Property ownership verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify property ownership',
        });
    }
};
exports.verifyPropertyOwnership = verifyPropertyOwnership;
//# sourceMappingURL=markingAuth.js.map