// apps/platform/lib/validations/shareableLink.ts
import { z } from "zod";

/**
 * Shareable link generation schema
 * For property owners to share marking access with someone they know
 */
export const createShareableLinkSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  
  markingJobId: z.string().cuid("Invalid marking job ID"),
  
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100, "Recipient name too long")
    .optional(),
  
  recipientPhone: z
    .string()
    .regex(/^(\+?234|0)?[7-9][0-1]\d{8}$/, "Invalid Nigerian phone number")
    .optional(),
  
  recipientEmail: z
    .string()
    .email("Invalid email address")
    .optional(),
  
  expiresInHours: z
    .number()
    .min(1, "Link must be valid for at least 1 hour")
    .max(168, "Link cannot be valid for more than 7 days (168 hours)")
    .default(72), // Default 3 days
  
  maxUses: z
    .number()
    .min(1, "Link must allow at least 1 use")
    .max(10, "Maximum 10 uses allowed")
    .default(1),
  
  requiresAuthentication: z
    .boolean()
    .default(false),
  
  allowedDevices: z
    .array(z.string())
    .max(3, "Maximum 3 devices allowed")
    .optional(),
  
  notes: z
    .string()
    .max(300, "Notes must not exceed 300 characters")
    .optional(),
  
  notifyVia: z
    .enum(["EMAIL", "SMS", "BOTH", "NONE"])
    .default("SMS"),
});

/**
 * Schema for accessing a shareable link
 */
export const accessShareableLinkSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid link token")
    .max(128, "Invalid link token"),
  
  deviceId: z
    .string()
    .optional(),
  
  accessCode: z
    .string()
    .length(6, "Access code must be 6 digits")
    .regex(/^\d{6}$/, "Access code must be numeric")
    .optional(), // Optional, required only if link has extra security
});

/**
 * Schema for validating shareable link usage
 */
export const validateShareableLinkSchema = z.object({
  token: z.string(),
  
  verificationData: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    deviceFingerprint: z.string().optional(),
    geolocation: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }).optional(),
});

/**
 * Schema for revoking a shareable link
 */
export const revokeShareableLinkSchema = z.object({
  linkId: z.string().cuid("Invalid link ID"),
  
  reason: z
    .enum([
      "EXPIRED",
      "OWNER_REVOKED",
      "SECURITY_CONCERN",
      "COMPLETED",
      "NO_LONGER_NEEDED",
      "OTHER",
    ]),
  
  reasonDetails: z
    .string()
    .max(200, "Reason details too long")
    .optional(),
});

/**
 * Schema for tracking link usage
 */
export const trackLinkUsageSchema = z.object({
  linkId: z.string().cuid("Invalid link ID"),
  
  action: z.enum([
    "VIEWED",
    "ACCESSED",
    "MARKING_STARTED",
    "MARKING_COMPLETED",
    "FAILED_ATTEMPT",
  ]),
  
  metadata: z.object({
    timestamp: z.coerce.date(),
    deviceInfo: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    completionData: z.any().optional(),
  }).optional(),
});

/**
 * Schema for bulk link generation
 */
export const bulkShareableLinkSchema = z.object({
  links: z
    .array(createShareableLinkSchema)
    .min(1, "At least one link required")
    .max(10, "Maximum 10 links can be generated at once"),
});

/**
 * Schema for updating shareable link settings
 */
export const updateShareableLinkSchema = z.object({
  linkId: z.string().cuid("Invalid link ID"),
  
  expiresAt: z.coerce.date().optional(),
  
  maxUses: z
    .number()
    .min(1)
    .max(10)
    .optional(),
  
  isActive: z.boolean().optional(),
  
  requiresAuthentication: z.boolean().optional(),
  
  notes: z
    .string()
    .max(300)
    .optional(),
});

/**
 * Schema for shareable link analytics
 */
export const linkAnalyticsSchema = z.object({
  linkId: z.string().cuid("Invalid link ID"),
  
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).optional(),
  
  metrics: z
    .array(z.enum([
      "VIEWS",
      "ACCESSES",
      "COMPLETIONS",
      "FAILED_ATTEMPTS",
      "UNIQUE_DEVICES",
    ]))
    .default(["VIEWS", "ACCESSES", "COMPLETIONS"]),
});

/**
 * Type exports
 */
export type CreateShareableLink = z.infer<typeof createShareableLinkSchema>;
export type AccessShareableLink = z.infer<typeof accessShareableLinkSchema>;
export type ValidateShareableLink = z.infer<typeof validateShareableLinkSchema>;
export type RevokeShareableLink = z.infer<typeof revokeShareableLinkSchema>;
export type TrackLinkUsage = z.infer<typeof trackLinkUsageSchema>;
export type BulkShareableLink = z.infer<typeof bulkShareableLinkSchema>;
export type UpdateShareableLink = z.infer<typeof updateShareableLinkSchema>;
export type LinkAnalytics = z.infer<typeof linkAnalyticsSchema>;

/**
 * Helper function to generate secure token
 */
export function generateSecureToken(length: number = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Helper function to generate access code
 */
export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper function to validate link expiration
 */
export function isLinkExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Helper function to check if link has remaining uses
 */
export function hasRemainingUses(currentUses: number, maxUses: number): boolean {
  return currentUses < maxUses;
}