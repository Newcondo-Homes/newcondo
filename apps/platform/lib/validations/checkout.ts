import { z } from "zod";

/**
 * Schema for initiating checkout process
 */
export const initiateCheckoutSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  userId: z.string().cuid("Invalid user ID"),
  paymentType: z.enum(["RENT", "DEPOSIT", "RENT_AND_DEPOSIT"]),
  startDate: z.string().datetime("Invalid start date").or(z.date()),
  endDate: z.string().datetime("Invalid end date").or(z.date()).optional(),
  
  // Contact information
  contactPhone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits"),
  contactEmail: z.string().email("Invalid email address"),
  
  // Additional rental details
  moveInDate: z.string().datetime().or(z.date()).optional(),
  specialRequests: z.string().max(500, "Special requests cannot exceed 500 characters").optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;

/**
 * Schema for completing checkout
 */
export const completeCheckoutSchema = z.object({
  checkoutSessionId: z.string().cuid("Invalid checkout session ID"),
  paymentReference: z.string().min(1, "Payment reference is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export type CompleteCheckoutInput = z.infer<typeof completeCheckoutSchema>;

/**
 * Schema for validating checkout session
 */
export const validateCheckoutSessionSchema = z.object({
  sessionId: z.string().cuid("Invalid session ID"),
  userId: z.string().cuid("Invalid user ID"),
});

export type ValidateCheckoutSessionInput = z.infer<typeof validateCheckoutSessionSchema>;

/**
 * Schema for checkout with lock acquisition
 */
export const checkoutWithLockSchema = initiateCheckoutSchema.extend({
  lockDurationMs: z.number()
    .int()
    .min(60000, "Lock duration must be at least 1 minute")
    .max(900000, "Lock duration cannot exceed 15 minutes")
    .default(300000),
});

export type CheckoutWithLockInput = z.infer<typeof checkoutWithLockSchema>;

/**
 * Schema for payment amount calculation
 */
export const calculatePaymentSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  paymentType: z.enum(["RENT", "DEPOSIT", "RENT_AND_DEPOSIT"]),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  promoCode: z.string().optional(),
});

export type CalculatePaymentInput = z.infer<typeof calculatePaymentSchema>;

/**
 * Schema for checkout cancellation
 */
export const cancelCheckoutSchema = z.object({
  checkoutSessionId: z.string().cuid("Invalid checkout session ID"),
  userId: z.string().cuid("Invalid user ID"),
  reason: z.enum([
    "USER_CANCELLED",
    "PAYMENT_FAILED",
    "PROPERTY_UNAVAILABLE",
    "SESSION_EXPIRED",
    "OTHER"
  ]),
  additionalNotes: z.string().max(500).optional(),
});

export type CancelCheckoutInput = z.infer<typeof cancelCheckoutSchema>;

/**
 * Schema for conflict detection during checkout
 */
export const detectConflictSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  excludeUserId: z.string().cuid().optional(), // Exclude current user's attempts
});

export type DetectConflictInput = z.infer<typeof detectConflictSchema>;