// backend/referral-service/src/utils/linkBuilder.ts

import { REFERRAL_LINK_CONFIG, SHARING_SETTINGS } from '../config/referralRules';

export interface ReferralLinkOptions {
  referralCode: string;
  channel?: string;
  campaign?: string;
  medium?: string;
}

/**
 * Build a shareable referral link with tracking parameters
 */
export function buildReferralLink(options: ReferralLinkOptions): string {
  const { referralCode, channel, campaign, medium } = options;
  const { BASE_URL } = REFERRAL_LINK_CONFIG;
  
  const url = new URL(`${BASE_URL}/register`);
  
  // Add referral code as query parameter
  url.searchParams.set('ref', referralCode);
  
  // Add UTM parameters for tracking
  if (channel) {
    url.searchParams.set('utm_source', 'referral');
    url.searchParams.set('utm_medium', channel);
  }
  
  if (campaign) {
    url.searchParams.set('utm_campaign', campaign);
  }
  
  if (medium) {
    url.searchParams.set('utm_content', medium);
  }
  
  return url.toString();
}

/**
 * Build WhatsApp share link
 */
export function buildWhatsAppShareLink(referralCode: string): string {
  const link = buildReferralLink({ referralCode, channel: 'whatsapp' });
  const message = SHARING_SETTINGS.SHARE_MESSAGES.whatsapp.replace('{link}', link);
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Build Facebook share link
 */
export function buildFacebookShareLink(referralCode: string): string {
  const link = buildReferralLink({ referralCode, channel: 'facebook' });
  
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
}

/**
 * Build Twitter share link
 */
export function buildTwitterShareLink(referralCode: string): string {
  const link = buildReferralLink({ referralCode, channel: 'twitter' });
  const message = SHARING_SETTINGS.SHARE_MESSAGES.twitter.replace('{link}', link);
  
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
}

/**
 * Build email share link
 */
export function buildEmailShareLink(referralCode: string): string {
  const link = buildReferralLink({ referralCode, channel: 'email' });
  const subject = 'Join NewCondo with my referral link';
  const body = SHARING_SETTINGS.SHARE_MESSAGES.email.replace('{link}', link);
  
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Build SMS share text
 */
export function buildSMSShareText(referralCode: string): string {
  const link = buildReferralLink({ referralCode, channel: 'sms' });
  return SHARING_SETTINGS.SHARE_MESSAGES.sms.replace('{link}', link);
}

/**
 * Build all share links for a referral code
 */
export function buildAllShareLinks(referralCode: string) {
  return {
    direct: buildReferralLink({ referralCode }),
    whatsapp: buildWhatsAppShareLink(referralCode),
    facebook: buildFacebookShareLink(referralCode),
    twitter: buildTwitterShareLink(referralCode),
    email: buildEmailShareLink(referralCode),
    sms: buildSMSShareText(referralCode),
  };
}

/**
 * Extract referral code from URL
 */
export function extractReferralCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch (error) {
    return null;
  }
}

/**
 * Validate referral link format
 */
export function isValidReferralLink(link: string): boolean {
  try {
    const url = new URL(link);
    const { BASE_URL } = REFERRAL_LINK_CONFIG;
    
    // Check if link is from our domain
    if (!link.startsWith(BASE_URL)) {
      return false;
    }
    
    // Check if it has a referral code
    const refCode = url.searchParams.get('ref');
    return refCode !== null && refCode.length > 0;
  } catch (error) {
    return false;
  }
}