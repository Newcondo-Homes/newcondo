"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredLocks = exports.releasePropertyLock = exports.acquirePropertyLock = void 0;
const propertyLock_1 = require("../utils/propertyLock");
const db_1 = require("@newcondo/db");
/**
 * Middleware to acquire property lock before processing payment
 */
const acquirePropertyLock = async (req, res, next) => {
    try {
        const { propertyId, unitId } = req.body;
        if (!propertyId) {
            return res.status(400).json({
                success: false,
                error: 'Property ID is required',
            });
        }
        // Check if property/unit is already locked
        const lockManager = propertyLock_1.PropertyLockManager.getInstance();
        const lockKey = unitId ? `unit:${unitId}` : `property:${propertyId}`;
        const isLocked = await lockManager.isLocked(lockKey);
        if (isLocked) {
            return res.status(409).json({
                success: false,
                error: 'Property is currently being processed by another user',
                code: 'PROPERTY_LOCKED',
            });
        }
        // Verify property/unit is available
        if (unitId) {
            const unit = await db_1.prisma.propertyUnit.findUnique({
                where: { id: unitId },
                select: {
                    isPaymentLocked: true,
                    paymentLockExpiry: true,
                    isAvailable: true,
                },
            });
            if (!unit) {
                return res.status(404).json({
                    success: false,
                    error: 'Unit not found',
                });
            }
            if (!unit.isAvailable) {
                return res.status(400).json({
                    success: false,
                    error: 'Unit is not available',
                });
            }
            // Check if lock has expired
            if (unit.isPaymentLocked &&
                unit.paymentLockExpiry &&
                new Date() < unit.paymentLockExpiry) {
                return res.status(409).json({
                    success: false,
                    error: 'Unit is locked for payment',
                    code: 'UNIT_PAYMENT_LOCKED',
                });
            }
        }
        else {
            const property = await db_1.prisma.property.findUnique({
                where: { id: propertyId },
                select: {
                    isPaymentLocked: true,
                    paymentLockExpiry: true,
                    isAvailable: true,
                    structure: true,
                },
            });
            if (!property) {
                return res.status(404).json({
                    success: false,
                    error: 'Property not found',
                });
            }
            // Single unit properties only
            if (property.structure !== 'SINGLE_UNIT') {
                return res.status(400).json({
                    success: false,
                    error: 'Please specify a unit for multi-family properties',
                });
            }
            if (!property.isAvailable) {
                return res.status(400).json({
                    success: false,
                    error: 'Property is not available',
                });
            }
            // Check if lock has expired
            if (property.isPaymentLocked &&
                property.paymentLockExpiry &&
                new Date() < property.paymentLockExpiry) {
                return res.status(409).json({
                    success: false,
                    error: 'Property is locked for payment',
                    code: 'PROPERTY_PAYMENT_LOCKED',
                });
            }
        }
        // Acquire lock
        const lockId = await lockManager.acquireLock(lockKey, req.user?.id || 'anonymous');
        if (!lockId) {
            return res.status(409).json({
                success: false,
                error: 'Failed to acquire property lock',
                code: 'LOCK_ACQUISITION_FAILED',
            });
        }
        // Attach lock info to request
        req.lockId = lockId;
        req.propertyId = propertyId;
        req.unitId = unitId;
        // Set lock in database
        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        if (unitId) {
            await db_1.prisma.propertyUnit.update({
                where: { id: unitId },
                data: {
                    isPaymentLocked: true,
                    paymentLockExpiry: lockExpiry,
                },
            });
        }
        else {
            await db_1.prisma.property.update({
                where: { id: propertyId },
                data: {
                    isPaymentLocked: true,
                    paymentLockExpiry: lockExpiry,
                },
            });
        }
        next();
    }
    catch (error) {
        console.error('Lock acquisition error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to acquire property lock',
        });
    }
};
exports.acquirePropertyLock = acquirePropertyLock;
/**
 * Middleware to release property lock after processing
 */
const releasePropertyLock = async (req, res, next) => {
    try {
        if (!req.lockId) {
            return next();
        }
        const lockManager = propertyLock_1.PropertyLockManager.getInstance();
        const lockKey = req.unitId
            ? `unit:${req.unitId}`
            : `property:${req.propertyId}`;
        await lockManager.releaseLock(lockKey, req.lockId);
        // Clear database lock
        if (req.unitId) {
            await db_1.prisma.propertyUnit.update({
                where: { id: req.unitId },
                data: {
                    isPaymentLocked: false,
                    paymentLockExpiry: null,
                },
            });
        }
        else if (req.propertyId) {
            await db_1.prisma.property.update({
                where: { id: req.propertyId },
                data: {
                    isPaymentLocked: false,
                    paymentLockExpiry: null,
                },
            });
        }
        next();
    }
    catch (error) {
        console.error('Lock release error:', error);
        next();
    }
};
exports.releasePropertyLock = releasePropertyLock;
/**
 * Cleanup expired locks periodically
 */
const cleanupExpiredLocks = async () => {
    try {
        const now = new Date();
        // Clean up expired property locks
        await db_1.prisma.property.updateMany({
            where: {
                isPaymentLocked: true,
                paymentLockExpiry: {
                    lt: now,
                },
            },
            data: {
                isPaymentLocked: false,
                paymentLockExpiry: null,
            },
        });
        // Clean up expired unit locks
        await db_1.prisma.propertyUnit.updateMany({
            where: {
                isPaymentLocked: true,
                paymentLockExpiry: {
                    lt: now,
                },
            },
            data: {
                isPaymentLocked: false,
                paymentLockExpiry: null,
            },
        });
        console.log('Expired locks cleaned up successfully');
    }
    catch (error) {
        console.error('Error cleaning up expired locks:', error);
    }
};
exports.cleanupExpiredLocks = cleanupExpiredLocks;
//# sourceMappingURL=locking.js.map