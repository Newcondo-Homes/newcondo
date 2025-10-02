import { z } from "zod";

/**
 * Schema for acquiring a payment lock on a property
 */
export const acquireLockSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  userId: z.string().cuid("Invalid user ID"),
  amount: z.number().positive("Amount must be positive"),
  lockDurationMs: z.number()
    .int()
    .min(60000, "Lock duration must be at least 1 minute")
    .max(900000, "Lock duration cannot exceed 15 minutes")
    .default(300000), // 5 minutes default
});

export type AcquireLockInput = z.infer<typeof acquireLockSchema>;

/**
 * Schema for releasing a payment lock
 */
export const releaseLockSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  userId: z.string().cuid("Invalid user ID"),
  reason: z.enum([
    "PAYMENT_COMPLETED",
    "PAYMENT_FAILED",
    "USER_CANCELLED",
    "TIMEOUT",
    "MANUAL_RELEASE"
  ]).default("USER_CANCELLED"),
});

export type ReleaseLockInput = z.infer<typeof releaseLockSchema>;

/**
 * Schema for checking lock status
 */
export const checkLockSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
});

export type CheckLockInput = z.infer<typeof checkLockSchema>;

/**
 * Schema for extending a payment lock
 */
export const extendLockSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  userId: z.string().cuid("Invalid user ID"),
  additionalTimeMs: z.number()
    .int()
    .min(30000, "Extension must be at least 30 seconds")
    .max(300000, "Extension cannot exceed 5 minutes"),
});

export type ExtendLockInput = z.infer<typeof extendLockSchema>;

/**
 * Schema for payment attempt logging
 */
export const logPaymentAttemptSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  propertyId: z.string().cuid("Invalid property ID"),
  unitId: z.string().cuid("Invalid unit ID").optional(),
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(["LOCKED", "SUCCESS", "FAILED", "TIMEOUT"]),
  failureReason: z.string().optional(),
  lockAcquired: z.boolean(),
  lockDuration: z.number().int().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

export type LogPaymentAttemptInput = z.infer<typeof logPaymentAttemptSchema>;

/**
 * Schema for bulk lock cleanup (admin use)
 */
export const cleanupLocksSchema = z.object({
  expiredOnly: z.boolean().default(true),
  propertyIds: z.array(z.string().cuid()).optional(),
  olderThanMs: z.number().int().positive().optional(),
});

export type CleanupLocksInput = z.infer<typeof cleanupLocksSchema>;