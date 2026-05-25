"use strict";
// backend/shared/src/utils/referralTracking.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralSummary = exports.formatNaira = exports.canRedeemReward = exports.referralCalculateConversionRate = exports.generateReferralMessage = exports.shouldTrackClick = exports.referralCalculateAgentCommission = exports.checkReferralQualification = exports.determineReferralType = exports.calculateReferralReward = exports.createDeviceFingerprint = exports.isValidReferralCode = exports.extractReferralCode = exports.generateAgentReferralLink = exports.generateReferralLink = exports.generateReferralCode = void 0;
const nanoid_1 = require("nanoid");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a unique referral code
 * Format: 6-8 uppercase alphanumeric characters
 */
const generateReferralCode = (length = 8) => {
    const nanoid = (0, nanoid_1.customAlphabet)('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length);
    return nanoid();
};
exports.generateReferralCode = generateReferralCode;
/**
 * Generate a secure referral link
 */
const generateReferralLink = (baseUrl, referralCode, type = 'user') => {
    const path = type === 'agent' ? 'property' : 'register';
    return `${baseUrl}/${path}?ref=${referralCode}`;
};
exports.generateReferralLink = generateReferralLink;
/**
 * Generate agent referral link for specific property
 */
const generateAgentReferralLink = (baseUrl, propertyId, referralCode) => {
    return `${baseUrl}/properties/${propertyId}?ref=${referralCode}`;
};
exports.generateAgentReferralLink = generateAgentReferralLink;
/**
 * Extract referral code from various sources
 */
const extractReferralCode = (query, cookies, headers) => {
    // Priority: Query params > Cookies > Headers
    if (query?.ref)
        return query.ref;
    if (cookies?.referralCode)
        return cookies.referralCode;
    if (headers?.['x-referral-code'])
        return headers['x-referral-code'];
    return null;
};
exports.extractReferralCode = extractReferralCode;
/**
 * Validate referral code format
 */
const isValidReferralCode = (code) => {
    // 6-8 uppercase alphanumeric characters
    return /^[A-Z0-9]{6,8}$/.test(code);
};
exports.isValidReferralCode = isValidReferralCode;
/**
 * Create referral tracking fingerprint
 * Used to detect duplicate clicks from same device
 */
const createDeviceFingerprint = (ipAddress, userAgent) => {
    const data = `${ipAddress}|${userAgent}`;
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.createDeviceFingerprint = createDeviceFingerprint;
/**
 * Calculate referral reward based on type
 */
const calculateReferralReward = (referralType, transactionAmount) => {
    const rewards = {
        OWNER_TO_OWNER: { referrer: 10000, referred: 10000 }, // ₦10,000 each
        OWNER_TO_AGENT: { referrer: 5000, referred: 5000 }, // ₦5,000 each
        OWNER_TO_RENTER: { referrer: 2000, referred: 2000 }, // ₦2,000 each
        AGENT_TO_OWNER: { referrer: 7000, referred: 3000 }, // Agent ₦7k, Owner ₦3k
        AGENT_TO_AGENT: { referrer: 3000, referred: 3000 }, // ₦3,000 each
        AGENT_TO_RENTER: { referrer: 5000, referred: 5000 }, // ₦5,000 each
        RENTER_TO_RENTER: { referrer: 1000, referred: 2000 }, // Referrer ₦1k, New renter ₦2k
    };
    const defaultReward = { referrer: 1000, referred: 1000 };
    const reward = rewards[referralType] || defaultReward;
    return {
        referrerReward: reward.referrer,
        referredReward: reward.referred,
    };
};
exports.calculateReferralReward = calculateReferralReward;
/**
 * Determine referral type based on roles
 */
const determineReferralType = (referrerRole, referredRole) => {
    return `${referrerRole}_TO_${referredRole}`;
};
exports.determineReferralType = determineReferralType;
/**
 * Check if referral qualifies for reward
 * Based on business rules (e.g., first payment made, subscription active)
 */
const checkReferralQualification = (referredUser) => {
    // Renters must have completed at least one payment
    if (referredUser.role === 'RENTER') {
        if (!referredUser.hasCompletedPayment) {
            return {
                qualified: false,
                reason: 'Renter must complete first payment',
            };
        }
    }
    // Owners must have active subscription
    if (referredUser.role === 'OWNER') {
        if (!referredUser.isPremium) {
            return {
                qualified: false,
                reason: 'Owner must have active subscription',
            };
        }
    }
    // Agents must be verified
    if (referredUser.role === 'AGENT') {
        if (referredUser.verificationStatus !== 'VERIFIED') {
            return {
                qualified: false,
                reason: 'Agent must be verified',
            };
        }
    }
    return { qualified: true };
};
exports.checkReferralQualification = checkReferralQualification;
/**
 * Calculate commission split for agent referrals
 */
const referralCalculateAgentCommission = (rentAmount, hasSubAgent) => {
    const platformCommissionRate = 0.2; // 20% platform fee
    const platformFee = rentAmount * platformCommissionRate;
    if (hasSubAgent) {
        // Split 50/50 between listing agent and sub-agent
        const listingAgentCommission = platformFee * 0.5;
        const subAgentCommission = platformFee * 0.5;
        return {
            platformFee: 0, // All commission goes to agents
            listingAgentCommission,
            subAgentCommission,
            ownerAmount: rentAmount - listingAgentCommission - subAgentCommission,
        };
    }
    else {
        // Listing agent gets 50% of the 20% commission
        const listingAgentCommission = platformFee * 0.5;
        const platformRetained = platformFee * 0.5;
        return {
            platformFee: platformRetained,
            listingAgentCommission,
            subAgentCommission: 0,
            ownerAmount: rentAmount - platformFee,
        };
    }
};
exports.referralCalculateAgentCommission = referralCalculateAgentCommission;
/**
 * Track referral click with deduplication
 */
const shouldTrackClick = (fingerprint, existingFingerprints, timeWindow = 24 * 60 * 60 * 1000 // 24 hours
) => {
    // Simple deduplication - in production, use Redis with TTL
    return !existingFingerprints.includes(fingerprint);
};
exports.shouldTrackClick = shouldTrackClick;
/**
 * Generate shareable referral message templates
 */
const generateReferralMessage = (referrerName, referralLink, type = 'whatsapp') => {
    const messages = {
        whatsapp: `Hi! 👋 I'm using NewCondo to manage my property and it's amazing! Join using my link and we both get rewards: ${referralLink}`,
        email: `Hello,\n\nI wanted to share NewCondo with you - it's a great platform for property management in Nigeria. When you sign up using my referral link, we both get exclusive rewards!\n\nJoin here: ${referralLink}\n\nBest regards,\n${referrerName}`,
        sms: `Hi! Join NewCondo using my link and get rewards: ${referralLink} - ${referrerName}`,
    };
    return messages[type];
};
exports.generateReferralMessage = generateReferralMessage;
/**
 * Calculate referral conversion rate
 */
const referralCalculateConversionRate = (clicks, conversions) => {
    if (clicks === 0)
        return 0;
    return (conversions / clicks) * 100;
};
exports.referralCalculateConversionRate = referralCalculateConversionRate;
/**
 * Validate reward redemption eligibility
 */
const canRedeemReward = (reward) => {
    if (reward.isRedeemed) {
        return { canRedeem: false, reason: 'Reward already redeemed' };
    }
    if (reward.isPaidOut) {
        return { canRedeem: false, reason: 'Reward already paid out' };
    }
    if (reward.status !== 'APPROVED') {
        return { canRedeem: false, reason: 'Reward not approved yet' };
    }
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
        return { canRedeem: false, reason: 'Reward has expired' };
    }
    return { canRedeem: true };
};
exports.canRedeemReward = canRedeemReward;
/**
 * Format currency for Nigerian Naira
 */
const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(amount);
};
exports.formatNaira = formatNaira;
/**
 * Generate referral analytics summary
 */
const generateReferralSummary = (data) => {
    const conversionRate = (0, exports.referralCalculateConversionRate)(data.totalClicks, data.qualifiedReferrals);
    const qualificationRate = data.totalReferrals > 0
        ? (data.qualifiedReferrals / data.totalReferrals) * 100
        : 0;
    const averageReward = data.qualifiedReferrals > 0
        ? data.totalRewards / data.qualifiedReferrals
        : 0;
    return {
        conversionRate,
        qualificationRate,
        averageReward,
        summary: `${data.totalReferrals} referrals, ${data.qualifiedReferrals} qualified (${qualificationRate.toFixed(1)}%), ${(0, exports.formatNaira)(data.totalRewards)} earned`,
    };
};
exports.generateReferralSummary = generateReferralSummary;
//# sourceMappingURL=referralTracking.js.map