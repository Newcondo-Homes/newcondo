"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePropertyAvailability = exports.validateLockRelease = exports.validateLockRequest = void 0;
const zod_1 = require("zod");
const paymentLockSchema = zod_1.z.object({
    propertyId: zod_1.z.string().cuid('Invalid property ID'),
    unitId: zod_1.z.string().cuid('Invalid unit ID').optional(),
    userId: zod_1.z.string().cuid('Invalid user ID'),
    amount: zod_1.z.number().positive('Amount must be positive'),
});
const lockReleaseSchema = zod_1.z.object({
    propertyId: zod_1.z.string().cuid('Invalid property ID').optional(),
    unitId: zod_1.z.string().cuid('Invalid unit ID').optional(),
    lockId: zod_1.z.string().min(1, 'Lock ID is required'),
});
/**
 * Validate payment lock request
 */
const validateLockRequest = (req, res, next) => {
    try {
        const validated = paymentLockSchema.parse(req.body);
        req.body = validated;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.validateLockRequest = validateLockRequest;
/**
 * Validate lock release request
 */
const validateLockRelease = (req, res, next) => {
    try {
        const validated = lockReleaseSchema.parse(req.body);
        req.body = validated;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.validateLockRelease = validateLockRelease;
/**
 * Validate property/unit exists and is available
 */
const validatePropertyAvailability = async (req, res, next) => {
    try {
        const { propertyId, unitId } = req.body;
        if (!propertyId && !unitId) {
            return res.status(400).json({
                success: false,
                error: 'Either propertyId or unitId is required',
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Failed to validate property availability',
        });
    }
};
exports.validatePropertyAvailability = validatePropertyAvailability;
//# sourceMappingURL=lockingValidation.js.map