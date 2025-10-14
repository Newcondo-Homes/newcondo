// apps/platform/lib/validations/contactPerson.ts
import { z } from "zod";

// Nigerian phone number regex (supports multiple formats)
const nigerianPhoneRegex = /^(\+?234|0)?[7-9][0-1]\d{8}$/;

/**
 * Contact person validation schema
 * Used for property marking service - provides access to property
 */
export const contactPersonSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Invalid Nigerian phone number")
    .transform((val) => {
      // Normalize phone number to +234 format
      let normalized = val.replace(/\s+/g, "");
      if (normalized.startsWith("0")) {
        normalized = "+234" + normalized.substring(1);
      } else if (normalized.startsWith("234")) {
        normalized = "+" + normalized;
      } else if (!normalized.startsWith("+")) {
        normalized = "+234" + normalized;
      }
      return normalized;
    }),
  
  relationship: z
    .string()
    .min(2, "Relationship must be specified")
    .max(50, "Relationship description too long")
    .optional(),
  
  alternativePhone: z
    .string()
    .regex(nigerianPhoneRegex, "Invalid Nigerian phone number")
    .transform((val) => {
      let normalized = val.replace(/\s+/g, "");
      if (normalized.startsWith("0")) {
        normalized = "+234" + normalized.substring(1);
      } else if (normalized.startsWith("234")) {
        normalized = "+" + normalized;
      } else if (!normalized.startsWith("+")) {
        normalized = "+234" + normalized;
      }
      return normalized;
    })
    .optional(),
  
  email: z
    .string()
    .email("Invalid email address")
    .optional(),
  
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
  
  isAvailableForContact: z
    .boolean()
    .default(true),
  
  preferredContactTime: z
    .enum(["MORNING", "AFTERNOON", "EVENING", "ANYTIME"])
    .default("ANYTIME"),
  
  languagePreference: z
    .enum(["ENGLISH", "YORUBA", "IGBO", "HAUSA", "PIDGIN", "OTHER"])
    .default("ENGLISH")
    .optional(),
});

/**
 * Schema for updating contact person
 */
export const updateContactPersonSchema = contactPersonSchema.partial();

/**
 * Schema for bulk contact person creation (for multiple properties)
 */
export const bulkContactPersonSchema = z.object({
  contacts: z
    .array(contactPersonSchema)
    .min(1, "At least one contact person is required")
    .max(5, "Maximum 5 contact persons allowed"),
});

/**
 * Schema for validating contact person availability
 */
export const contactPersonAvailabilitySchema = z.object({
  contactPersonId: z.string().cuid("Invalid contact person ID"),
  availabilityWindow: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    timeSlots: z.array(
      z.object({
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
      })
    ).optional(),
  }),
});

/**
 * Schema for contact person verification by marking agent
 */
export const verifyContactPersonSchema = z.object({
  contactPersonId: z.string().cuid("Invalid contact person ID"),
  verificationCode: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must be numeric"),
  agentNotes: z
    .string()
    .max(300, "Agent notes must not exceed 300 characters")
    .optional(),
});

/**
 * Type exports
 */
export type ContactPerson = z.infer<typeof contactPersonSchema>;
export type UpdateContactPerson = z.infer<typeof updateContactPersonSchema>;
export type BulkContactPerson = z.infer<typeof bulkContactPersonSchema>;
export type ContactPersonAvailability = z.infer<typeof contactPersonAvailabilitySchema>;
export type VerifyContactPerson = z.infer<typeof verifyContactPersonSchema>;

/**
 * Helper function to validate and format phone number
 */
export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) {
    return "+234" + cleaned.substring(1);
  } else if (cleaned.startsWith("234")) {
    return "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    return "+234" + cleaned;
  }
  return cleaned;
}

/**
 * Helper function to validate contact person data
 */
export function validateContactPerson(data: unknown) {
  return contactPersonSchema.safeParse(data);
}