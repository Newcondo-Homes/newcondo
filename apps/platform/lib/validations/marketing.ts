import { z } from 'zod';

export const promotionSettingsSchema = z.object({
  propertyId: z.string().cuid(),
  promotionType: z.enum(['PUBLIC', 'PERMISSION_BASED', 'RESTRICTED', 'REQUEST_BASED']),
  allowSubAgentPromotion: z.boolean().default(true),
  autoApproveRequests: z.boolean().default(false),
});

export const generateShareableLinkSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  expiresIn: z.number().int().positive().max(365).default(30), // Days
  trackViews: z.boolean().default(true),
  customSlug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export const generatePromotionLinkSchema = z.object({
  propertyId: z.string().cuid(),
  unitId: z.string().cuid().optional(),
  agentId: z.string().cuid(), // Sub-agent requesting promotion
  expiresIn: z.number().int().positive().max(365).default(90), // Days
});

export const promotionRequestSchema = z.object({
  propertyId: z.string().cuid(),
  message: z.string().min(20).max(500).optional(), // Optional message to property owner
});

export const approvePromotionRequestSchema = z.object({
  requestId: z.string().cuid(),
  approved: z.boolean(),
  expiresIn: z.number().int().positive().max(365).default(90).optional(), // Days, if approved
  rejectionReason: z.string().max(500).optional(), // If rejected
});

export const trackLinkClickSchema = z.object({
  linkId: z.string(),
  source: z.enum(['SOCIAL_MEDIA', 'EMAIL', 'DIRECT', 'OTHER']).optional(),
  metadata: z.record(z.any()).optional(), // Additional tracking data
});

export const marketingAnalyticsSchema = z.object({
  propertyId: z.string().cuid(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  metrics: z.array(
    z.enum([
      'VIEWS',
      'CLICKS',
      'CONVERSIONS',
      'AGENT_REFERRALS',
      'REVENUE_BY_SOURCE',
    ])
  ).default(['VIEWS', 'CLICKS', 'CONVERSIONS']),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const updateMarketingMaterialsSchema = z.object({
  propertyId: z.string().cuid(),
  highlightText: z.string().max(200).optional(), // Featured text for marketing
  tagline: z.string().max(100).optional(),
  marketingImages: z.array(z.string().url()).max(10).optional(),
  virtualTourUrl: z.string().url().optional(),
});

export const socialShareSchema = z.object({
  propertyId: z.string().cuid(),
  platform: z.enum(['FACEBOOK', 'TWITTER', 'WHATSAPP', 'INSTAGRAM', 'LINKEDIN']),
  customMessage: z.string().max(500).optional(),
});

export type PromotionSettings = z.infer<typeof promotionSettingsSchema>;
export type GenerateShareableLink = z.infer<typeof generateShareableLinkSchema>;
export type GeneratePromotionLink = z.infer<typeof generatePromotionLinkSchema>;
export type PromotionRequest = z.infer<typeof promotionRequestSchema>;
export type ApprovePromotionRequest = z.infer<typeof approvePromotionRequestSchema>;
export type TrackLinkClick = z.infer<typeof trackLinkClickSchema>;
export type MarketingAnalytics = z.infer<typeof marketingAnalyticsSchema>;
export type UpdateMarketingMaterials = z.infer<typeof updateMarketingMaterialsSchema>;
export type SocialShare = z.infer<typeof socialShareSchema>;