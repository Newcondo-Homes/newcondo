import crypto from 'crypto';

/**
 * Generate a unique shareable link for property
 */
export function generateShareableLink(propertyId: string, baseUrl: string): string {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  return `${baseUrl}/properties/${propertyId}?share=${uniqueId}`;
}

/**
 * Generate a unique promotion link for agent
 */
export function generatePromotionLink(
  propertyId: string,
  agentId: string,
  baseUrl: string
): string {
  // Create a unique identifier combining property and agent
  const linkId = crypto
    .createHash('sha256')
    .update(`${propertyId}-${agentId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 12);

  return `${baseUrl}/properties/${propertyId}?ref=${linkId}&agent=${agentId}`;
}

/**
 * Generate marking service shareable link
 */
export function generateMarkingLink(
  propertyId: string,
  markingJobId: string,
  baseUrl: string
): string {
  const token = crypto
    .createHash('sha256')
    .update(`${propertyId}-${markingJobId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);

  return `${baseUrl}/marking/${markingJobId}?token=${token}`;
}

/**
 * Generate property viewing link
 */
export function generateViewingLink(propertyId: string, baseUrl: string): string {
  return `${baseUrl}/properties/${propertyId}`;
}

/**
 * Parse referral information from link
 */
export function parseReferralLink(url: string): {
  propertyId: string | null;
  agentId: string | null;
  referralCode: string | null;
} {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const propertyId = pathParts[pathParts.indexOf('properties') + 1] || null;
    const agentId = urlObj.searchParams.get('agent');
    const referralCode = urlObj.searchParams.get('ref');

    return {
      propertyId,
      agentId,
      referralCode,
    };
  } catch (error) {
    return {
      propertyId: null,
      agentId: null,
      referralCode: null,
    };
  }
}

/**
 * Generate QR code data URL for property
 */
export function generateQRCodeData(propertyId: string, baseUrl: string): string {
  const url = generateViewingLink(propertyId, baseUrl);
  // In production, this would generate actual QR code
  // For now, return the URL that can be used with a QR code library
  return url;
}

/**
 * Generate deep link for mobile app
 */
export function generateDeepLink(
  propertyId: string,
  params?: { [key: string]: string }
): string {
  const baseDeepLink = 'newcondo://property';
  const queryParams = new URLSearchParams({ id: propertyId, ...params });
  return `${baseDeepLink}?${queryParams.toString()}`;
}

/**
 * Generate email verification link
 */
export function generateVerificationLink(
  userId: string,
  token: string,
  baseUrl: string
): string {
  return `${baseUrl}/verify-email?userId=${userId}&token=${token}`;
}

/**
 * Generate password reset link
 */
export function generatePasswordResetLink(
  userId: string,
  token: string,
  baseUrl: string
): string {
  return `${baseUrl}/reset-password?userId=${userId}&token=${token}`;
}

/**
 * Shorten URL (placeholder for URL shortening service integration)
 */
export async function shortenUrl(longUrl: string): Promise<string> {
  // In production, integrate with a URL shortening service like Bitly
  // For now, return the original URL
  return longUrl;
}

/**
 * Track link click
 */
export function generateTrackableLink(
  originalUrl: string,
  trackingParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    agentId?: string;
  }
): string {
  const url = new URL(originalUrl);
  
  if (trackingParams.source) {
    url.searchParams.set('utm_source', trackingParams.source);
  }
  if (trackingParams.medium) {
    url.searchParams.set('utm_medium', trackingParams.medium);
  }
  if (trackingParams.campaign) {
    url.searchParams.set('utm_campaign', trackingParams.campaign);
  }
  if (trackingParams.agentId) {
    url.searchParams.set('agent_id', trackingParams.agentId);
  }

  return url.toString();
}

/**
 * Validate shareable link token
 */
export function validateShareableToken(token: string): boolean {
  // Basic validation - check if token is valid hex string
  return /^[a-f0-9]+$/i.test(token) && token.length >= 12;
}

/**
 * Generate social media share links
 */
export function generateSocialShareLinks(propertyId: string, baseUrl: string): {
  facebook: string;
  twitter: string;
  whatsapp: string;
  telegram: string;
  linkedin: string;
} {
  const propertyUrl = encodeURIComponent(generateViewingLink(propertyId, baseUrl));
  const shareText = encodeURIComponent('Check out this property on Newcondo!');

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${propertyUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${propertyUrl}&text=${shareText}`,
    whatsapp: `https://wa.me/?text=${shareText}%20${propertyUrl}`,
    telegram: `https://t.me/share/url?url=${propertyUrl}&text=${shareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${propertyUrl}`,
  };
}