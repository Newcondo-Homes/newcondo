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






// apps/platform/lib/utils/shareHelpers.ts

import { SHARE_MESSAGES, SHARE_CHANNEL_CONFIG, formatShareMessage } from '../constants/shareMessages';
import { REFERRAL_CONFIG } from '../constants/referralConfig';

export interface ShareData {
  code: string;
  link: string;
  referrerName: string;
  referrerRole: string;
  referredAmount: number;
  referrerAmount: number;
  rewardType: string;
}

/**
 * Get appropriate share message based on channel and user role
 */
type ChannelWithRoles = {
  default: string | { subject: string; template: string };
  owner?: string | { subject: string; template: string };
  agent?: string | { subject: string; template: string };
  renter?: string | { subject: string; template: string };
  maxLength?: number;
};

export function getShareMessage(
  channel: keyof typeof SHARE_MESSAGES,
  data: ShareData,
  customMessage?: string
): string | { subject: string; template: string } {
  if (customMessage && channel !== 'email') {
    return formatShareMessage(customMessage, data);
  }

  const channelMessages = SHARE_MESSAGES[channel] as ChannelWithRoles;
  
  if (channel === 'email') {
    const roleKey = data.referrerRole.toLowerCase() as 'owner' | 'agent' | 'renter';
    const emailConfig = channelMessages[roleKey] || channelMessages.default;
    
    const config = emailConfig as { subject: string; template: string}
    return {
      subject: config.subject,
      template: formatShareMessage(config.template, data)
    };
  }

  // For other channels, pick role-specific message if available
  const roleKey = data.referrerRole.toLowerCase();
  const message = (channelMessages as any)[roleKey] || (channelMessages as any).default;
  
  return formatShareMessage(message, data);
}

/**
 * Build share URL for specific channel
 */
export function buildShareUrl(
  channel: string,
  referralLink: string,
  message?: string,
  subject?: string
): string {
  const channelConfig = SHARE_CHANNEL_CONFIG.find(c => c.id === channel);
  
  if (!channelConfig) {
    return referralLink;
  }

  return channelConfig.shareUrl(referralLink, message || '', subject);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Share via Web Share API (mobile)
 */
export async function shareViaNative(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Share failed:', err);
    }
    return false;
  }
}

/**
 * Open share dialog for specific channel
 */
export function openShareDialog(
  channel: string,
  url: string,
  message?: string,
  subject?: string
): void {
  const shareUrl = buildShareUrl(channel, url, message, subject);
  
  // For copy, just return the URL
  if (channel === 'copy') {
    copyToClipboard(url);
    return;
  }

  // For email and SMS, use location.href
  if (channel === 'email' || channel === 'sms') {
    window.location.href = shareUrl;
    return;
  }

  // For social media, open in new window
  const width = 600;
  const height = 400;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    shareUrl,
    '_blank',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  );
}

/**
 * Get available share channels
 */
export function getAvailableChannels(): typeof SHARE_CHANNEL_CONFIG {
  return SHARE_CHANNEL_CONFIG.filter(channel => channel.isAvailable);
}

/**
 * Format phone number for WhatsApp
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 234
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  
  // If doesn't start with 234, add it
  if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate QR code data URL for referral link
 */
export async function generateQRCode(text: string): Promise<string> {
  // In production, use a QR code library like 'qrcode'
  // For now, return a placeholder
  // import QRCode from 'qrcode';
  // return await QRCode.toDataURL(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

/**
 * Track share event (for analytics)
 */
export function trackShare(channel: string, referralCode: string): void {
  // Implement analytics tracking here
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share', {
      method: channel,
      content_type: 'referral',
      item_id: referralCode,
    });
  }
}

/**
 * Validate share message length for channel
 */
export function validateMessageLength(channel: string, message: string): {
  isValid: boolean;
  maxLength: number;
  currentLength: number;
} {
  const channelConfig = SHARE_MESSAGES[channel as keyof typeof SHARE_MESSAGES];
  const maxLength = (channelConfig as any)?.maxLength || 1000;
  
  return {
    isValid: message.length <= maxLength,
    maxLength,
    currentLength: message.length,
  };
}