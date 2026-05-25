"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShareableLink = generateShareableLink;
exports.generatePromotionLink = generatePromotionLink;
exports.generateMarkingLink = generateMarkingLink;
exports.generateViewingLink = generateViewingLink;
exports.parseReferralLink = parseReferralLink;
exports.generateQRCodeData = generateQRCodeData;
exports.generateDeepLink = generateDeepLink;
exports.generateVerificationLink = generateVerificationLink;
exports.generatePasswordResetLink = generatePasswordResetLink;
exports.shortenUrl = shortenUrl;
exports.generateTrackableLink = generateTrackableLink;
exports.validateShareableToken = validateShareableToken;
exports.generateSocialShareLinks = generateSocialShareLinks;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a unique shareable link for property
 */
function generateShareableLink(propertyId, baseUrl) {
    const uniqueId = crypto_1.default.randomBytes(8).toString('hex');
    return `${baseUrl}/properties/${propertyId}?share=${uniqueId}`;
}
/**
 * Generate a unique promotion link for agent
 */
function generatePromotionLink(propertyId, agentId, baseUrl) {
    // Create a unique identifier combining property and agent
    const linkId = crypto_1.default
        .createHash('sha256')
        .update(`${propertyId}-${agentId}-${Date.now()}`)
        .digest('hex')
        .substring(0, 12);
    return `${baseUrl}/properties/${propertyId}?ref=${linkId}&agent=${agentId}`;
}
/**
 * Generate marking service shareable link
 */
function generateMarkingLink(propertyId, markingJobId, baseUrl) {
    const token = crypto_1.default
        .createHash('sha256')
        .update(`${propertyId}-${markingJobId}-${Date.now()}`)
        .digest('hex')
        .substring(0, 16);
    return `${baseUrl}/marking/${markingJobId}?token=${token}`;
}
/**
 * Generate property viewing link
 */
function generateViewingLink(propertyId, baseUrl) {
    return `${baseUrl}/properties/${propertyId}`;
}
/**
 * Parse referral information from link
 */
function parseReferralLink(url) {
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
    }
    catch (error) {
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
function generateQRCodeData(propertyId, baseUrl) {
    const url = generateViewingLink(propertyId, baseUrl);
    // In production, this would generate actual QR code
    // For now, return the URL that can be used with a QR code library
    return url;
}
/**
 * Generate deep link for mobile app
 */
function generateDeepLink(propertyId, params) {
    const baseDeepLink = 'newcondo://property';
    const queryParams = new URLSearchParams({ id: propertyId, ...params });
    return `${baseDeepLink}?${queryParams.toString()}`;
}
/**
 * Generate email verification link
 */
function generateVerificationLink(userId, token, baseUrl) {
    return `${baseUrl}/verify-email?userId=${userId}&token=${token}`;
}
/**
 * Generate password reset link
 */
function generatePasswordResetLink(userId, token, baseUrl) {
    return `${baseUrl}/reset-password?userId=${userId}&token=${token}`;
}
/**
 * Shorten URL (placeholder for URL shortening service integration)
 */
async function shortenUrl(longUrl) {
    // In production, integrate with a URL shortening service like Bitly
    // For now, return the original URL
    return longUrl;
}
/**
 * Track link click
 */
function generateTrackableLink(originalUrl, trackingParams) {
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
function validateShareableToken(token) {
    // Basic validation - check if token is valid hex string
    return /^[a-f0-9]+$/i.test(token) && token.length >= 12;
}
/**
 * Generate social media share links
 */
function generateSocialShareLinks(propertyId, baseUrl) {
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
//# sourceMappingURL=linkGenerator.js.map