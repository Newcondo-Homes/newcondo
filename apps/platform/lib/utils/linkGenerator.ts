/**
 * Link Generator Utility
 * Generates shareable and promotion links for properties
 */

import { nanoid } from 'nanoid';

export interface LinkMetadata {
  propertyId: string;
  unitId?: string;
  agentId?: string;
  linkType: 'shareable' | 'promotion' | 'referral';
  expiresAt?: Date;
  customSlug?: string;
}

export interface GeneratedLink {
  linkId: string;
  url: string;
  shortUrl: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
  metadata: LinkMetadata;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://newcondo.com';
const LINK_ID_LENGTH = 12;
const SHORT_SLUG_LENGTH = 8;

/**
 * Generate a unique link ID
 */
export function generateLinkId(): string {
  return nanoid(LINK_ID_LENGTH);
}

/**
 * Generate a short slug for custom URLs
 */
export function generateShortSlug(): string {
  return nanoid(SHORT_SLUG_LENGTH);
}

/**
 * Generate shareable link for property
 */
export function generateShareableLink(
  propertyId: string,
  options?: {
    unitId?: string;
    customSlug?: string;
    expiresIn?: number; // Days
    trackViews?: boolean;
  }
): GeneratedLink {
  const linkId = generateLinkId();
  const slug = options?.customSlug || generateShortSlug();
  
  const expiresAt = options?.expiresIn
    ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
    : undefined;
  
  const metadata: LinkMetadata = {
    propertyId,
    unitId: options?.unitId,
    linkType: 'shareable',
    expiresAt,
    customSlug: options?.customSlug,
  };
  
  // Build URL with tracking parameters
  const params = new URLSearchParams({
    lid: linkId,
    ...(options?.unitId && { unit: options.unitId }),
    ...(options?.trackViews && { track: '1' }),
  });
  
  const url = `${BASE_URL}/properties/${slug}?${params.toString()}`;
  const shortUrl = `${BASE_URL}/p/${slug}`;
  
  return {
    linkId,
    url,
    shortUrl,
    qrCodeUrl: generateQRCodeUrl(shortUrl),
    expiresAt,
    metadata,
  };
}

/**
 * Generate promotion link for sub-agents
 */
export function generatePromotionLink(
  propertyId: string,
  agentId: string,
  options?: {
    unitId?: string;
    expiresIn?: number; // Days
  }
): GeneratedLink {
  const linkId = generateLinkId();
  const slug = generateShortSlug();
  
  const expiresAt = options?.expiresIn
    ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default 90 days
  
  const metadata: LinkMetadata = {
    propertyId,
    unitId: options?.unitId,
    agentId,
    linkType: 'promotion',
    expiresAt,
  };
  
  // Build URL with agent tracking
  const params = new URLSearchParams({
    lid: linkId,
    ref: agentId,
    ...(options?.unitId && { unit: options.unitId }),
  });
  
  const url = `${BASE_URL}/properties/${slug}?${params.toString()}`;
  const shortUrl = `${BASE_URL}/p/${slug}/${agentId}`;
  
  return {
    linkId,
    url,
    shortUrl,
    qrCodeUrl: generateQRCodeUrl(shortUrl),
    expiresAt,
    metadata,
  };
}

/**
 * Generate referral link for user
 */
export function generateReferralLink(
  userId: string,
  referralCode: string
): GeneratedLink {
  const linkId = generateLinkId();
  
  const metadata: LinkMetadata = {
    propertyId: '', // Not property-specific
    agentId: userId,
    linkType: 'referral',
  };
  
  const url = `${BASE_URL}/register?ref=${referralCode}`;
  const shortUrl = `${BASE_URL}/r/${referralCode}`;
  
  return {
    linkId,
    url,
    shortUrl,
    qrCodeUrl: generateQRCodeUrl(shortUrl),
    metadata,
  };
}

/**
 * Generate property marking link (for remote marking)
 */
export function generateMarkingLink(
  markingJobId: string,
  propertyId: string,
  token: string
): GeneratedLink {
  const linkId = generateLinkId();
  
  const metadata: LinkMetadata = {
    propertyId,
    linkType: 'shareable', // Using shareable type for marking
  };
  
  const params = new URLSearchParams({
    job: markingJobId,
    token,
  });
  
  const url = `${BASE_URL}/marking/${markingJobId}?${params.toString()}`;
  const shortUrl = `${BASE_URL}/m/${markingJobId}`;
  
  return {
    linkId,
    url,
    shortUrl,
    qrCodeUrl: generateQRCodeUrl(shortUrl),
    metadata,
  };
}

/**
 * Generate QR code URL using a QR service
 */
function generateQRCodeUrl(url: string): string {
  // Using QR Server API (you can replace with your preferred service)
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
}

/**
 * Parse link from URL to extract metadata
 */
export function parseLinkFromUrl(url: string): {
  linkId?: string;
  agentId?: string;
  unitId?: string;
  trackViews?: boolean;
} | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      linkId: params.get('lid') || undefined,
      agentId: params.get('ref') || undefined,
      unitId: params.get('unit') || undefined,
      trackViews: params.get('track') === '1',
    };
  } catch {
    return null;
  }
}

/**
 * Generate social media share URLs
 */
export function generateSocialShareUrls(
  propertyUrl: string,
  propertyTitle: string,
  customMessage?: string
): Record<string, string> {
  const message = customMessage || `Check out this property: ${propertyTitle}`;
  const encodedUrl = encodeURIComponent(propertyUrl);
  const encodedMessage = encodeURIComponent(message);
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    email: `mailto:?subject=${encodeURIComponent(propertyTitle)}&body=${encodedMessage}%20${encodedUrl}`,
  };
}

/**
 * Validate custom slug
 */
export function validateCustomSlug(slug: string): {
  isValid: boolean;
  error?: string;
} {
  // Check length
  if (slug.length < 3 || slug.length > 50) {
    return {
      isValid: false,
      error: 'Slug must be between 3 and 50 characters',
    };
  }
  
  // Check format (lowercase letters, numbers, hyphens only)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return {
      isValid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }
  
  // Check for reserved words
  const reservedWords = [
    'admin',
    'api',
    'app',
    'auth',
    'dashboard',
    'login',
    'register',
    'properties',
    'payments',
    'profile',
    'settings',
  ];
  
  if (reservedWords.includes(slug)) {
    return {
      isValid: false,
      error: 'This slug is reserved and cannot be used',
    };
  }
  
  return { isValid: true };
}

/**
 * Check if link has expired
 */
export function isLinkExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/**
 * Get link expiry status
 */
export function getLinkExpiryStatus(expiresAt?: Date): {
  isExpired: boolean;
  daysRemaining?: number;
  hoursRemaining?: number;
  isExpiringSoon?: boolean;
} {
  if (!expiresAt) {
    return { isExpired: false };
  }
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const isExpired = now > expiry;
  
  if (isExpired) {
    return { isExpired: true };
  }
  
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const isExpiringSoon = daysRemaining <= 7;
  
  return {
    isExpired: false,
    daysRemaining,
    hoursRemaining,
    isExpiringSoon,
  };
}

/**
 * Format link for clipboard
 */
export function formatLinkForClipboard(link: GeneratedLink): string {
  return link.shortUrl;
}

/**
 * Generate link analytics URL
 */
export function generateLinkAnalyticsUrl(linkId: string): string {
  return `${BASE_URL}/dashboard/analytics/links/${linkId}`;
}