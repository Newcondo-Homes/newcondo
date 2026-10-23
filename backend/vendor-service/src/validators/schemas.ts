// backend/vendor-service/src/validators/schemas.ts
import { z } from "zod";
import { VENDORS, VENDOR_SERVICE_TYPES } from "@newcondo/backend-shared";

const service = z.enum(VENDOR_SERVICE_TYPES as [string, ...string[]]);
const phone = z.string().trim().regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a Nigerian mobile number");

export const registerSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  providerType: z.enum(Object.keys(VENDORS.providerTypes) as [string, ...string[]]),
  extraServices: z.array(service).max(2).optional(),
  contactName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone,
  password: z.string().min(8).max(128).regex(/[A-Za-z]/, "Use letters and numbers").regex(/\d/, "Use letters and numbers"),
  cacNumber: z.string().trim().max(20).optional(),
}).strict();

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  contactName: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
  capacityPerDay: z.number().int().min(1).max(30).optional(),
  extraServices: z.array(service).max(2).optional(),
}).strict();

export const areaSchema = z.object({
  state: z.string().trim().min(2).max(40), lga: z.string().trim().min(2).max(60), area: z.string().trim().min(2).max(80),
  lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(VENDORS.matching.maxRadiusKm),
}).strict();

export const bankSchema = z.object({
  bankCode: z.string().trim().min(3).max(10), bankName: z.string().trim().min(2).max(80),
  accountNumber: z.string().regex(/^\d{10}$/, "10-digit NUBAN"), currentPassword: z.string().min(1).max(128),
}).strict();

export const releaseModeSchema = z.object({ mode: z.enum(["INSTANT", "END_OF_DAY"]) }).strict();
export const verifySchema = z.object({ code: z.string().trim().min(6).max(80) }).strict();
export const photosPresignSchema = z.object({ files: z.array(z.object({ contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), size: z.number().int().positive().max(10 * 1024 * 1024) }).strict()).min(1).max(10) }).strict();
export const photosAttachSchema = z.object({ keys: z.array(z.string().min(10).max(300)).min(1).max(20) }).strict();
export const rescheduleSchema = z.object({ reason: z.string().trim().min(3).max(300) }).strict();
export const windowSchema = z.object({
  days: z.array(z.number().int().min(0).max(6)).min(1).max(6),
  startMinute: z.number().int().min(0).max(1440), endMinute: z.number().int().min(0).max(1440),
}).strict();
