/**
 * Property sharing link generation and management utilities
 */

/**
 * Base URL for share links (should be set via env variable)
 */
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://newcondo.com';
};

/**
 * Generate a shareable link for a property
 */
export function generatePropertyShareLink(
  propertyId: string,
  unitId?: string,
  referralCode?: string
): string {
  const baseUrl = getBaseUrl();
  const path = unitId 
    ? `/properties/${propertyId}/units/${unitId}`
    : `/properties/${propertyId}`;
  
  const params = new URLSearchParams();
  if (referralCode) {
    params.set('ref', referralCode);
  }
  params.set('shared', 'true');
  
  const queryString = params.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generate a short shareable link (for SMS/social media)
 */
export function generateShortShareLink(
  propertyId: string,
  unitId?: string
): string {
  const baseUrl = getBaseUrl();
  const shortCode = unitId ? `${propertyId.slice(-8)}-${unitId.slice(-4)}` : propertyId.slice(-8);
  return `${baseUrl}/p/${shortCode}`;
}

/**
 * Parse share link parameters
 */
export interface ShareLinkParams {
  propertyId?: string;
  unitId?: string;
  referralCode?: string;
  isShared: boolean;
}

export function parseShareLink(url: string): ShareLinkParams {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    return {
      propertyId: pathParts[1],
      unitId: pathParts[3],
      referralCode: params.get('ref') || undefined,
      isShared: params.get('shared') === 'true',
    };
  } catch {
    return { isShared: false };
  }
}

/**
 * Generate social media share URLs
 */
export interface SocialShareUrls {
  whatsapp: string;
  facebook: string;
  twitter: string;
  telegram: string;
  email: string;
  sms: string;
}

export function generateSocialShareUrls(
  propertyTitle: string,
  shareLink: string,
  price?: string
): SocialShareUrls {
  const message = price 
    ? `Check out this property: ${propertyTitle} - ${price}\n${shareLink}`
    : `Check out this property: ${propertyTitle}\n${shareLink}`;
  
  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(shareLink);
  const encodedTitle = encodeURIComponent(propertyTitle);
  
  return {
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedLink}`,
    telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedMessage}`,
    sms: `sms:?body=${encodedMessage}`,
  };
}

/**
 * Copy link to clipboard
 */
export async function copyShareLinkToClipboard(link: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
}

/**
 * Track share link analytics
 */
export interface ShareAnalytics {
  propertyId: string;
  unitId?: string;
  platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram' | 'email' | 'sms' | 'copy' | 'other';
  userId?: string;
  referralCode?: string;
  timestamp: Date;
}

export function createShareAnalytics(
  propertyId: string,
  platform: ShareAnalytics['platform'],
  unitId?: string,
  userId?: string,
  referralCode?: string
): ShareAnalytics {
  return {
    propertyId,
    unitId,
    platform,
    userId,
    referralCode,
    timestamp: new Date(),
  };
}

/**
 * Generate QR code URL for property share link
 */
export function generateQRCodeUrl(shareLink: string, size: number = 300): string {
  const encodedLink = encodeURIComponent(shareLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedLink}`;
}

/**
 * Validate share link format
 */
export function isValidShareLink(link: string): boolean {
  try {
    const url = new URL(link);
    const baseUrl = getBaseUrl();
    return url.origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Extract property info from share link
 */
export interface ShareLinkInfo {
  propertyId: string;
  unitId?: string;
  isValid: boolean;
}

export function extractPropertyInfoFromLink(link: string): ShareLinkInfo {
  const params = parseShareLink(link);
  return {
    propertyId: params.propertyId || '',
    unitId: params.unitId,
    isValid: isValidShareLink(link) && !!params.propertyId,
  };
}

/**
 * Generate share link with UTM parameters for tracking
 */
export function generateShareLinkWithUTM(
  propertyId: string,
  source: string,
  medium: string,
  campaign: string,
  unitId?: string
): string {
  const baseLink = generatePropertyShareLink(propertyId, unitId);
  const url = new URL(baseLink);
  
  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', campaign);
  
  return url.toString();
}