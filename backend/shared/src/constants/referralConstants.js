"use strict";
// backend/shared/src/constants/referralConstants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBHOOK_EVENTS = exports.FEATURE_FLAGS = exports.API_ENDPOINTS = exports.CACHE_TTL = exports.DASHBOARD_CONFIG = exports.AGENT_REFERRAL_COMMISSION = exports.PROMOTION_REQUEST_STATUSES = exports.PROMOTION_TYPES = exports.SHARE_CHANNELS = exports.SMS_TEMPLATES = exports.REFERRAL_EMAIL_TEMPLATES = exports.REFERRAL_SUCCESS_MESSAGES = exports.REFERRAL_ERROR_MESSAGES = exports.SUSPICIOUS_ACTIVITY_THRESHOLD = exports.MAX_REFERRALS_SAME_DEVICE_FINGERPRINT = exports.MAX_REFERRALS_FROM_SAME_IP = exports.REFERRAL_API_RATE_LIMIT = exports.REFERRAL_LINK_GENERATION_LIMIT_PER_DAY = exports.LEADERBOARD_TOP_COUNT = exports.ANALYTICS_RETENTION_DAYS = exports.NOTIFY_ON_REWARD = exports.NOTIFY_ON_QUALIFIED = exports.NOTIFY_ON_SIGNUP = exports.NOTIFY_ON_CLICK = exports.MAX_PENDING_REFERRALS = exports.MAX_REFERRALS_PER_USER = exports.SUB_AGENT_COMMISSION_RATE = exports.LISTING_AGENT_COMMISSION_RATE = exports.PLATFORM_COMMISSION_RATE = exports.MAX_MONTHLY_REDEMPTIONS = exports.MAX_DAILY_REDEMPTIONS = exports.MIN_REDEMPTION_AMOUNT = exports.REWARD_EXPIRY_WARNING_DAYS = exports.DEFAULT_REWARD_EXPIRY_DAYS = exports.QUALIFICATION_RULES = exports.CLICK_DEDUPLICATION_ENABLED = exports.UNIQUE_CLICK_WINDOW_HOURS = exports.REFERRAL_SESSION_KEY = exports.REFERRAL_COOKIE_EXPIRY_DAYS = exports.REFERRAL_COOKIE_NAME = exports.REFERRAL_LINK_BASE_URL = exports.REFERRAL_CODE_CHARSET = exports.REFERRAL_CODE_LENGTH = void 0;
exports.REFERRAL_CODE_LENGTH = 8;
exports.REFERRAL_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Referral link configuration
exports.REFERRAL_LINK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://newcondo.com';
// Referral tracking
exports.REFERRAL_COOKIE_NAME = 'nc_ref';
exports.REFERRAL_COOKIE_EXPIRY_DAYS = 30;
exports.REFERRAL_SESSION_KEY = 'referralCode';
// Click tracking
exports.UNIQUE_CLICK_WINDOW_HOURS = 24;
exports.CLICK_DEDUPLICATION_ENABLED = true;
// Qualification criteria
exports.QUALIFICATION_RULES = {
    OWNER: {
        requiresPayment: false,
        requiresSubscription: true,
        requiresVerification: false,
        minimumDays: 0,
    },
    AGENT: {
        requiresPayment: false,
        requiresSubscription: false,
        requiresVerification: true,
        minimumDays: 0,
    },
    RENTER: {
        requiresPayment: true,
        requiresSubscription: false,
        requiresVerification: false,
        minimumDays: 0,
    },
};
// Reward expiry
exports.DEFAULT_REWARD_EXPIRY_DAYS = 365; // 1 year
exports.REWARD_EXPIRY_WARNING_DAYS = 30; // Warn 30 days before expiry
// Reward limits
exports.MIN_REDEMPTION_AMOUNT = 1000; // ₦1,000
exports.MAX_DAILY_REDEMPTIONS = 5;
exports.MAX_MONTHLY_REDEMPTIONS = 20;
// Commission rates
exports.PLATFORM_COMMISSION_RATE = 0.2; // 20%
exports.LISTING_AGENT_COMMISSION_RATE = 0.5; // 50% of platform commission
exports.SUB_AGENT_COMMISSION_RATE = 0.5; // 50% of platform commission
// Referral limits
exports.MAX_REFERRALS_PER_USER = 1000;
exports.MAX_PENDING_REFERRALS = 100;
// Notification settings
exports.NOTIFY_ON_CLICK = false;
exports.NOTIFY_ON_SIGNUP = true;
exports.NOTIFY_ON_QUALIFIED = true;
exports.NOTIFY_ON_REWARD = true;
// Analytics
exports.ANALYTICS_RETENTION_DAYS = 90;
exports.LEADERBOARD_TOP_COUNT = 10;
// Rate limiting
exports.REFERRAL_LINK_GENERATION_LIMIT_PER_DAY = 50;
exports.REFERRAL_API_RATE_LIMIT = 100; // requests per minute
// Fraud detection
exports.MAX_REFERRALS_FROM_SAME_IP = 3;
exports.MAX_REFERRALS_SAME_DEVICE_FINGERPRINT = 5;
exports.SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
// Error messages
exports.REFERRAL_ERROR_MESSAGES = {
    INVALID_REFERRAL_CODE: 'Invalid referral code',
    REFERRAL_CODE_NOT_FOUND: 'Referral code not found',
    REFERRAL_CODE_EXPIRED: 'Referral code has expired',
    SELF_REFERRAL_NOT_ALLOWED: 'You cannot refer yourself',
    ALREADY_REFERRED: 'User has already been referred',
    REFERRAL_LIMIT_EXCEEDED: 'Referral limit exceeded',
    REWARD_NOT_FOUND: 'Reward not found',
    REWARD_ALREADY_REDEEMED: 'Reward has already been redeemed',
    REWARD_EXPIRED: 'Reward has expired',
    INSUFFICIENT_BALANCE: 'Insufficient reward balance',
    MINIMUM_REDEMPTION_NOT_MET: `Minimum redemption amount is ₦${exports.MIN_REDEMPTION_AMOUNT}`,
    DAILY_REDEMPTION_LIMIT_EXCEEDED: 'Daily redemption limit exceeded',
    INVALID_BANK_DETAILS: 'Invalid bank account details',
    PAYOUT_FAILED: 'Payout processing failed',
};
// Success messages
exports.REFERRAL_SUCCESS_MESSAGES = {
    REFERRAL_CREATED: 'Referral successfully created',
    REWARD_EARNED: 'Congratulations! You\'ve earned a reward',
    REWARD_REDEEMED: 'Reward successfully redeemed',
    PAYOUT_INITIATED: 'Payout initiated successfully',
    REFERRAL_QUALIFIED: 'Your referral has qualified for rewards',
};
// Email templates
exports.REFERRAL_EMAIL_TEMPLATES = {
    REFERRAL_INVITATION: 'referral-invitation',
    REFERRAL_SIGNUP: 'referral-signup',
    REFERRAL_QUALIFIED: 'referral-qualified',
    REWARD_EARNED: 'reward-earned',
    REWARD_REDEEMED: 'reward-redeemed',
    REWARD_EXPIRING_SOON: 'reward-expiring-soon',
    PAYOUT_COMPLETED: 'payout-completed',
};
// SMS templates
exports.SMS_TEMPLATES = {
    REFERRAL_SIGNUP: 'Someone signed up using your referral link!',
    REFERRAL_QUALIFIED: 'Your referral qualified! You earned {amount}.',
    REWARD_EARNED: 'Congrats! You earned {amount} in rewards.',
    PAYOUT_COMPLETED: 'Your {amount} payout has been processed.',
};
// Share channels
exports.SHARE_CHANNELS = {
    WHATSAPP: 'whatsapp',
    EMAIL: 'email',
    SMS: 'sms',
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    COPY: 'copy',
};
// Property promotion types
exports.PROMOTION_TYPES = {
    PUBLIC: 'PUBLIC',
    PERMISSION_BASED: 'PERMISSION_BASED',
    RESTRICTED: 'RESTRICTED',
    REQUEST_BASED: 'REQUEST_BASED',
};
// Promotion request statuses
exports.PROMOTION_REQUEST_STATUSES = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
// Agent referral commission split
exports.AGENT_REFERRAL_COMMISSION = {
    WITH_SUB_AGENT: {
        LISTING_AGENT: 0.5, // 50% of 20% commission
        SUB_AGENT: 0.5, // 50% of 20% commission
        PLATFORM: 0.0, // 0%
    },
    WITHOUT_SUB_AGENT: {
        LISTING_AGENT: 0.5, // 50% of 20% commission
        PLATFORM: 0.5, // 50% of 20% commission
    },
};
// Referral dashboard configuration
exports.DASHBOARD_CONFIG = {
    RECENT_REFERRALS_LIMIT: 10,
    PENDING_REWARDS_LIMIT: 5,
    CHART_DATA_POINTS: 30,
    REFRESH_INTERVAL_MS: 300000, // 5 minutes
};
// Cache TTL (Time To Live)
exports.CACHE_TTL = {
    REFERRAL_STATS: 300, // 5 minutes
    REWARD_BALANCE: 60, // 1 minute
    LEADERBOARD: 600, // 10 minutes
    USER_REFERRALS: 180, // 3 minutes
};
// API endpoints
exports.API_ENDPOINTS = {
    GENERATE_LINK: '/api/referrals/generate-link',
    TRACK_CLICK: '/api/referrals/track-click',
    GET_STATS: '/api/referrals/stats',
    GET_REWARDS: '/api/referrals/rewards',
    REDEEM_REWARD: '/api/referrals/redeem',
    GET_LEADERBOARD: '/api/referrals/leaderboard',
    AGENT_REFERRAL: '/api/agent-referrals',
    PROMOTION_REQUEST: '/api/promotion-requests',
};
// Feature flags
exports.FEATURE_FLAGS = {
    REFERRAL_SYSTEM_ENABLED: true,
    AGENT_REFERRAL_ENABLED: true,
    REWARD_EXPIRY_ENABLED: true,
    LEADERBOARD_ENABLED: true,
    MILESTONE_REWARDS_ENABLED: true,
    FRAUD_DETECTION_ENABLED: true,
    AUTO_QUALIFICATION_ENABLED: true,
};
// Webhook events
exports.WEBHOOK_EVENTS = {
    REFERRAL_CREATED: 'referral.created',
    REFERRAL_QUALIFIED: 'referral.qualified',
    REWARD_EARNED: 'reward.earned',
    REWARD_REDEEMED: 'reward.redeemed',
    PAYOUT_COMPLETED: 'payout.completed',
    PROMOTION_REQUEST_CREATED: 'promotion_request.created',
    PROMOTION_REQUEST_APPROVED: 'promotion_request.approved',
};
//# sourceMappingURL=referralConstants.js.map