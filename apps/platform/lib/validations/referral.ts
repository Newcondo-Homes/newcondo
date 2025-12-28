// apps/platform/lib/validations/referral.ts

import { z } from 'zod';

export const inviteViaEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  message: z.string().optional(),
});

export const inviteViaSMSSchema = z.object({
  phone: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number'),
  message: z.string().optional(),
});

export const inviteViaWhatsAppSchema = z.object({
  phone: z.string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Please enter a valid Nigerian phone number')
    .optional(),
  message: z.string().optional(),
});

export const bulkInviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  message: z.string().optional(),
});

export const referralCodeSchema = z.object({
  code: z.string()
    .min(6, 'Referral code must be at least 6 characters')
    .max(20, 'Referral code must not exceed 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Referral code must contain only uppercase letters and numbers'),
});

export const referralStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const referralListQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'QUALIFIED', 'REWARDED', 'EXPIRED', 'CANCELLED']).optional(),
  sortBy: z.enum(['createdAt', 'qualifiedAt', 'reward', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const shareReferralSchema = z.object({
  channel: z.enum(['whatsapp', 'email', 'sms', 'facebook', 'twitter', 'linkedin', 'copy']),
  recipient: z.string().optional(),
  customMessage: z.string().max(500).optional(),
});

export type InviteViaEmailInput = z.infer<typeof inviteViaEmailSchema>;
export type InviteViaSMSInput = z.infer<typeof inviteViaSMSSchema>;
export type InviteViaWhatsAppInput = z.infer<typeof inviteViaWhatsAppSchema>;
export type BulkInviteInput = z.infer<typeof bulkInviteSchema>;
export type ReferralCodeInput = z.infer<typeof referralCodeSchema>;
export type ReferralStatsQuery = z.infer<typeof referralStatsQuerySchema>;
export type ReferralListQuery = z.infer<typeof referralListQuerySchema>;
export type ShareReferralInput = z.infer<typeof shareReferralSchema>;