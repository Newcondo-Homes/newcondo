// backend/shared/src/constants/referralConstants.ts

export const REFERRAL_CODE_LENGTH = 8;
export const REFERRAL_CODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Referral link configuration
export const REFERRAL_LINK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://newcondo.com';

// Referral tracking
export const REFERRAL_COOKIE_NAME = 'nc_ref';
export const REFERRAL_COOKIE_EXPIRY_DAYS = 30;
export const REFERRAL_SESSION_KEY = 'referralCode';

// Click tracking
export const UNIQUE_CLICK_WINDOW_HOURS = 24;
export const CLICK_DEDUPLICATION_ENABLED = true;

// Qualification criteria
export const QUALIFICATION_RULES = {
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
} as const;

// Reward expiry
export const DEFAULT_REWARD_EXPIRY_DAYS = 365; // 1 year
export const REWARD_EXPIRY_WARNING_DAYS = 30; // Warn 30 days before expiry

// Reward limits
export const MIN_REDEMPTION_AMOUNT = 1000; // ₦1,000
export const MAX_DAILY_REDEMPTIONS = 5;
export const MAX_MONTHLY_REDEMPTIONS = 20;

// Commission rates
export const PLATFORM_COMMISSION_RATE = 0.2; // 20%
export const LISTING_AGENT_COMMISSION_RATE = 0.5; // 50% of platform commission
export const SUB_AGENT_COMMISSION_RATE = 0.5; // 50% of platform commission

// Referral limits
export const MAX_REFERRALS_PER_USER = 1000;
export const MAX_PENDING_REFERRALS = 100;

// Notification settings
export const NOTIFY_ON_CLICK = false;
export const NOTIFY_ON_SIGNUP = true;
export const NOTIFY_ON_QUALIFIED = true;
export const NOTIFY_ON_REWARD = true;

// Analytics
export const ANALYTICS_RETENTION_DAYS = 90;
export const LEADERBOARD_TOP_COUNT = 10;

// Rate limiting
export const REFERRAL_LINK_GENERATION_LIMIT_PER_DAY = 50;
export const REFERRAL_API_RATE_LIMIT = 100; // requests per minute

// Fraud detection
export const MAX_REFERRALS_FROM_SAME_IP = 3;
export const MAX_REFERRALS_SAME_DEVICE_FINGERPRINT = 5;
export const SUSPICIOUS_ACTIVITY_THRESHOLD = 10;

// Error messages
export const REFERRAL_ERROR_MESSAGES = {
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
  MINIMUM_REDEMPTION_NOT_MET: `Minimum redemption amount is ₦${MIN_REDEMPTION_AMOUNT}`,
  DAILY_REDEMPTION_LIMIT_EXCEEDED: 'Daily redemption limit exceeded',
  INVALID_BANK_DETAILS: 'Invalid bank account details',
  PAYOUT_FAILED: 'Payout processing failed',
} as const;

// Success messages
export const REFERRAL_SUCCESS_MESSAGES = {
  REFERRAL_CREATED: 'Referral successfully created',
  REWARD_EARNED: 'Congratulations! You\'ve earned a reward',
  REWARD_REDEEMED: 'Reward successfully redeemed',
  PAYOUT_INITIATED: 'Payout initiated successfully',
  REFERRAL_QUALIFIED: 'Your referral has qualified for rewards',
} as const;

// Email templates
export const REFERRAL_EMAIL_TEMPLATES = {
  REFERRAL_INVITATION: 'referral-invitation',
  REFERRAL_SIGNUP: 'referral-signup',
  REFERRAL_QUALIFIED: 'referral-qualified',
  REWARD_EARNED: 'reward-earned',
  REWARD_REDEEMED: 'reward-redeemed',
  REWARD_EXPIRING_SOON: 'reward-expiring-soon',
  PAYOUT_COMPLETED: 'payout-completed',
} as const;

// SMS templates
export const SMS_TEMPLATES = {
  REFERRAL_SIGNUP: 'Someone signed up using your referral link!',
  REFERRAL_QUALIFIED: 'Your referral qualified! You earned {amount}.',
  REWARD_EARNED: 'Congrats! You earned {amount} in rewards.',
  PAYOUT_COMPLETED: 'Your {amount} payout has been processed.',
} as const;

// Share channels
export const SHARE_CHANNELS = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  COPY: 'copy',
} as const;

// Property promotion types
export const PROMOTION_TYPES = {
  PUBLIC: 'PUBLIC',
  PERMISSION_BASED: 'PERMISSION_BASED',
  RESTRICTED: 'RESTRICTED',
  REQUEST_BASED: 'REQUEST_BASED',
} as const;

// Promotion request statuses
export const PROMOTION_REQUEST_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Agent referral commission split
export const AGENT_REFERRAL_COMMISSION = {
  WITH_SUB_AGENT: {
    LISTING_AGENT: 0.5, // 50% of 20% commission
    SUB_AGENT: 0.5, // 50% of 20% commission
    PLATFORM: 0.0, // 0%
  },
  WITHOUT_SUB_AGENT: {
    LISTING_AGENT: 0.5, // 50% of 20% commission
    PLATFORM: 0.5, // 50% of 20% commission
  },
} as const;

// Referral dashboard configuration
export const DASHBOARD_CONFIG = {
  RECENT_REFERRALS_LIMIT: 10,
  PENDING_REWARDS_LIMIT: 5,
  CHART_DATA_POINTS: 30,
  REFRESH_INTERVAL_MS: 300000, // 5 minutes
} as const;

// Cache TTL (Time To Live)
export const CACHE_TTL = {
  REFERRAL_STATS: 300, // 5 minutes
  REWARD_BALANCE: 60, // 1 minute
  LEADERBOARD: 600, // 10 minutes
  USER_REFERRALS: 180, // 3 minutes
} as const;

// API endpoints
export const API_ENDPOINTS = {
  GENERATE_LINK: '/api/referrals/generate-link',
  TRACK_CLICK: '/api/referrals/track-click',
  GET_STATS: '/api/referrals/stats',
  GET_REWARDS: '/api/referrals/rewards',
  REDEEM_REWARD: '/api/referrals/redeem',
  GET_LEADERBOARD: '/api/referrals/leaderboard',
  AGENT_REFERRAL: '/api/agent-referrals',
  PROMOTION_REQUEST: '/api/promotion-requests',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  REFERRAL_SYSTEM_ENABLED: true,
  AGENT_REFERRAL_ENABLED: true,
  REWARD_EXPIRY_ENABLED: true,
  LEADERBOARD_ENABLED: true,
  MILESTONE_REWARDS_ENABLED: true,
  FRAUD_DETECTION_ENABLED: true,
  AUTO_QUALIFICATION_ENABLED: true,
} as const;

// Webhook events
export const WEBHOOK_EVENTS = {
  REFERRAL_CREATED: 'referral.created',
  REFERRAL_QUALIFIED: 'referral.qualified',
  REWARD_EARNED: 'reward.earned',
  REWARD_REDEEMED: 'reward.redeemed',
  PAYOUT_COMPLETED: 'payout.completed',
  PROMOTION_REQUEST_CREATED: 'promotion_request.created',
  PROMOTION_REQUEST_APPROVED: 'promotion_request.approved',
} as const;