"use strict";
// backend/shared/src/middleware/confirmationValidation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePaymentOwnership = exports.checkConfirmationPeriod = exports.validateConfirmation = exports.propertyVerificationSchema = exports.manualReleaseSchema = exports.checkConfirmationStatusSchema = exports.refundRequestSchema = exports.confirmPaymentSchema = void 0;
const zod_1 = require("zod");
/**
 * Validation schemas for payment confirmation requests
 */
// Schema for confirming a payment
exports.confirmPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID format'),
        confirmed: zod_1.z.boolean({
            required_error: 'Confirmation status is required',
            invalid_type_error: 'Confirmation status must be a boolean'
        }),
        verificationNotes: zod_1.z.string().min(10, 'Verification notes must be at least 10 characters').optional(),
        propertyConditionMatches: zod_1.z.boolean().optional(),
        issuesFound: zod_1.z.array(zod_1.z.string()).optional()
    })
});
// Schema for requesting a refund
exports.refundRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID format'),
        reason: zod_1.z.enum([
            'PROPERTY_NOT_AS_DESCRIBED',
            'PROPERTY_UNAVAILABLE',
            'FRAUD_SUSPECTED',
            'OWNER_CANCELLED',
            'DUPLICATE_BOOKING',
            'OTHER'
        ], {
            required_error: 'Refund reason is required',
            invalid_type_error: 'Invalid refund reason'
        }),
        description: zod_1.z.string()
            .min(20, 'Refund description must be at least 20 characters')
            .max(1000, 'Refund description must not exceed 1000 characters'),
        evidence: zod_1.z.array(zod_1.z.string().url('Invalid evidence URL')).optional()
    })
});
// Schema for checking confirmation status
exports.checkConfirmationStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID format')
    })
});
// Schema for manual release (admin only)
exports.manualReleaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID format'),
        reason: zod_1.z.string().min(10, 'Release reason must be at least 10 characters'),
        overrideConfirmationPeriod: zod_1.z.boolean().optional()
    })
});
// Schema for property verification upload
exports.propertyVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID format'),
        verificationImages: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).min(1, 'At least one verification image is required'),
        verificationNotes: zod_1.z.string().max(500, 'Verification notes must not exceed 500 characters').optional(),
        propertyAccessible: zod_1.z.boolean({
            required_error: 'Property accessibility status is required'
        }),
        matchesListing: zod_1.z.boolean({
            required_error: 'Listing match status is required'
        })
    })
});
/**
 * Middleware to validate confirmation requests
 */
const validateConfirmation = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
exports.validateConfirmation = validateConfirmation;
/**
 * Middleware to check if confirmation period is still active
 */
const checkConfirmationPeriod = async (req, res, next) => {
    try {
        const { paymentId } = req.body;
        // This will be implemented with actual database check in the service
        // For now, we just pass through
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkConfirmationPeriod = checkConfirmationPeriod;
/**
 * Middleware to ensure user is authorized to confirm payment
 */
const ensurePaymentOwnership = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { paymentId } = req.body || req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'User authentication required'
            });
        }
        // Actual ownership check will be done in the service layer
        // This middleware just ensures user is authenticated
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.ensurePaymentOwnership = ensurePaymentOwnership;
//# sourceMappingURL=confirmationValidation.js.map