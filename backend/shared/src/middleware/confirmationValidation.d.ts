import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Validation schemas for payment confirmation requests
 */
export declare const confirmPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
        confirmed: z.ZodBoolean;
        verificationNotes: z.ZodOptional<z.ZodString>;
        propertyConditionMatches: z.ZodOptional<z.ZodBoolean>;
        issuesFound: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        paymentId: string;
        confirmed: boolean;
        verificationNotes?: string | undefined;
        propertyConditionMatches?: boolean | undefined;
        issuesFound?: string[] | undefined;
    }, {
        paymentId: string;
        confirmed: boolean;
        verificationNotes?: string | undefined;
        propertyConditionMatches?: boolean | undefined;
        issuesFound?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        paymentId: string;
        confirmed: boolean;
        verificationNotes?: string | undefined;
        propertyConditionMatches?: boolean | undefined;
        issuesFound?: string[] | undefined;
    };
}, {
    body: {
        paymentId: string;
        confirmed: boolean;
        verificationNotes?: string | undefined;
        propertyConditionMatches?: boolean | undefined;
        issuesFound?: string[] | undefined;
    };
}>;
export declare const refundRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
        reason: z.ZodEnum<["PROPERTY_NOT_AS_DESCRIBED", "PROPERTY_UNAVAILABLE", "FRAUD_SUSPECTED", "OWNER_CANCELLED", "DUPLICATE_BOOKING", "OTHER"]>;
        description: z.ZodString;
        evidence: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        paymentId: string;
        reason: "OTHER" | "PROPERTY_NOT_AS_DESCRIBED" | "PROPERTY_UNAVAILABLE" | "FRAUD_SUSPECTED" | "OWNER_CANCELLED" | "DUPLICATE_BOOKING";
        evidence?: string[] | undefined;
    }, {
        description: string;
        paymentId: string;
        reason: "OTHER" | "PROPERTY_NOT_AS_DESCRIBED" | "PROPERTY_UNAVAILABLE" | "FRAUD_SUSPECTED" | "OWNER_CANCELLED" | "DUPLICATE_BOOKING";
        evidence?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        description: string;
        paymentId: string;
        reason: "OTHER" | "PROPERTY_NOT_AS_DESCRIBED" | "PROPERTY_UNAVAILABLE" | "FRAUD_SUSPECTED" | "OWNER_CANCELLED" | "DUPLICATE_BOOKING";
        evidence?: string[] | undefined;
    };
}, {
    body: {
        description: string;
        paymentId: string;
        reason: "OTHER" | "PROPERTY_NOT_AS_DESCRIBED" | "PROPERTY_UNAVAILABLE" | "FRAUD_SUSPECTED" | "OWNER_CANCELLED" | "DUPLICATE_BOOKING";
        evidence?: string[] | undefined;
    };
}>;
export declare const checkConfirmationStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        paymentId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        paymentId: string;
    }, {
        paymentId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        paymentId: string;
    };
}, {
    params: {
        paymentId: string;
    };
}>;
export declare const manualReleaseSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
        reason: z.ZodString;
        overrideConfirmationPeriod: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        paymentId: string;
        reason: string;
        overrideConfirmationPeriod?: boolean | undefined;
    }, {
        paymentId: string;
        reason: string;
        overrideConfirmationPeriod?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        paymentId: string;
        reason: string;
        overrideConfirmationPeriod?: boolean | undefined;
    };
}, {
    body: {
        paymentId: string;
        reason: string;
        overrideConfirmationPeriod?: boolean | undefined;
    };
}>;
export declare const propertyVerificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
        verificationImages: z.ZodArray<z.ZodString, "many">;
        verificationNotes: z.ZodOptional<z.ZodString>;
        propertyAccessible: z.ZodBoolean;
        matchesListing: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        paymentId: string;
        verificationImages: string[];
        propertyAccessible: boolean;
        matchesListing: boolean;
        verificationNotes?: string | undefined;
    }, {
        paymentId: string;
        verificationImages: string[];
        propertyAccessible: boolean;
        matchesListing: boolean;
        verificationNotes?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        paymentId: string;
        verificationImages: string[];
        propertyAccessible: boolean;
        matchesListing: boolean;
        verificationNotes?: string | undefined;
    };
}, {
    body: {
        paymentId: string;
        verificationImages: string[];
        propertyAccessible: boolean;
        matchesListing: boolean;
        verificationNotes?: string | undefined;
    };
}>;
/**
 * Middleware to validate confirmation requests
 */
export declare const validateConfirmation: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if confirmation period is still active
 */
export declare const checkConfirmationPeriod: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to ensure user is authorized to confirm payment
 */
export declare const ensurePaymentOwnership: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=confirmationValidation.d.ts.map