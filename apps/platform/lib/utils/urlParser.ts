// apps/platform/lib/utils/urlParser.ts

/**
 * Parse referral code from URL parameters
 */
export function parseReferralCodeFromUrl(
  url: string = window.location.href
): string | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Check various parameter names
    return (
      params.get("ref") ||
      params.get("referral") ||
      params.get("referralCode") ||
      params.get("referral_code") ||
      null
    );
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

/**
 * Parse referral source from URL parameters
 */
export function parseReferralSourceFromUrl(
  url: string = window.location.href
): string | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Check various parameter names
    return (
      params.get("source") ||
      params.get("utm_source") ||
      params.get("referral_source") ||
      null
    );
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

/**
 * Parse campaign information from URL
 */
export interface CampaignData {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export function parseCampaignFromUrl(
  url: string = window.location.href
): CampaignData | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const campaignData: CampaignData = {};

    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    const term = params.get("utm_term");
    const content = params.get("utm_content");

    if (source) campaignData.source = source;
    if (medium) campaignData.medium = medium;
    if (campaign) campaignData.campaign = campaign;
    if (term) campaignData.term = term;
    if (content) campaignData.content = content;

    return Object.keys(campaignData).length > 0 ? campaignData : null;
  } catch (error) {
    console.error("Error parsing campaign data:", error);
    return null;
  }
}

/**
 * Parse all referral-related data from URL
 */
export interface ReferralUrlData {
  referralCode: string | null;
  source: string | null;
  campaign: CampaignData | null;
  rawParams: Record<string, string>;
}

export function parseReferralDataFromUrl(
  url: string = window.location.href
): ReferralUrlData {
  const referralCode = parseReferralCodeFromUrl(url);
  const source = parseReferralSourceFromUrl(url);
  const campaign = parseCampaignFromUrl(url);

  // Get all params for debugging/analytics
  const rawParams: Record<string, string> = {};
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });
  } catch (error) {
    console.error("Error getting raw params:", error);
  }

  return {
    referralCode,
    source,
    campaign,
    rawParams,
  };
}

/**
 * Build a referral URL with the given code and optional parameters
 */
export function buildReferralUrl(
  baseUrl: string,
  referralCode: string,
  options?: {
    source?: string;
    campaign?: string;
    customParams?: Record<string, string>;
  }
): string {
  try {
    const url = new URL(baseUrl);

    // Add referral code
    url.searchParams.set("ref", referralCode);

    // Add source if provided
    if (options?.source) {
      url.searchParams.set("source", options.source);
      url.searchParams.set("utm_source", options.source);
    }

    // Add campaign if provided
    if (options?.campaign) {
      url.searchParams.set("utm_campaign", options.campaign);
    }

    // Add custom parameters
    if (options?.customParams) {
      Object.entries(options.customParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  } catch (error) {
    console.error("Error building referral URL:", error);
    return baseUrl;
  }
}

/**
 * Clean URL by removing specific parameters
 */
export function cleanUrl(
  url: string,
  paramsToRemove: string[] = ["ref", "referral", "source", "utm_source"]
): string {
  try {
    const urlObj = new URL(url);

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch (error) {
    console.error("Error cleaning URL:", error);
    return url;
  }
}

/**
 * Replace URL in browser without reload
 */
export function replaceUrlWithoutReload(newUrl: string): void {
  try {
    window.history.replaceState({}, document.title, newUrl);
  } catch (error) {
    console.error("Error replacing URL:", error);
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return null;
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build share URLs for various platforms
 */
export interface ShareUrls {
  whatsapp: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  email: string;
  sms: string;
}

export function buildShareUrls(
  referralUrl: string,
  message?: string
): ShareUrls {
  const encodedUrl = encodeURIComponent(referralUrl);
  const encodedMessage = message
    ? encodeURIComponent(message)
    : encodeURIComponent(
        `Join NewCondo and get ₦3,000 credit! Use my referral link: ${referralUrl}`
      );

  return {
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(
      "Join NewCondo with my referral"
    )}&body=${encodedMessage}`,
    sms: `sms:?body=${encodedMessage}`,
  };
}

/**
 * Generate short URL (mock - would need actual URL shortener service)
 */
export async function shortenUrl(longUrl: string): Promise<string> {
  // This is a placeholder - integrate with a URL shortening service like Bitly
  // For now, just return the original URL
  console.log("URL shortening not implemented, returning original URL");
  return longUrl;
}

/**
 * Parse agent referral link (for sub-agents promoting properties)
 */
export function parseAgentReferralLink(
  url: string
): {
  propertyId: string | null;
  agentCode: string | null;
} {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");

    // Expected format: /properties/{propertyId}?agent={agentCode}
    const propertyId = pathParts[pathParts.indexOf("properties") + 1] || null;
    const agentCode = urlObj.searchParams.get("agent");

    return {
      propertyId,
      agentCode,
    };
  } catch (error) {
    console.error("Error parsing agent referral link:", error);
    return {
      propertyId: null,
      agentCode: null,
    };
  }
}

/**
 * Build agent referral link for property promotion
 */
export function buildAgentReferralLink(
  propertyId: string,
  agentCode: string,
  baseUrl: string = window.location.origin
): string {
  return `${baseUrl}/properties/${propertyId}?agent=${agentCode}`;
}