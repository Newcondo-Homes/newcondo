export declare const REFERRAL_CODE_LENGTH = 8;
export declare const REFERRAL_CODE_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export declare const REFERRAL_LINK_BASE_URL: string;
export declare const REFERRAL_COOKIE_NAME = "nc_ref";
export declare const REFERRAL_COOKIE_EXPIRY_DAYS = 30;
export declare const REFERRAL_SESSION_KEY = "referralCode";
export declare const UNIQUE_CLICK_WINDOW_HOURS = 24;
export declare const CLICK_DEDUPLICATION_ENABLED = true;
export declare const QUALIFICATION_RULES: {
    readonly OWNER: {
        readonly requiresPayment: false;
        readonly requiresSubscription: true;
        readonly requiresVerification: false;
        readonly minimumDays: 0;
    };
    readonly AGENT: {
        readonly requiresPayment: false;
        readonly requiresSubscription: false;
        readonly requiresVerification: true;
        readonly minimumDays: 0;
    };
    readonly RENTER: {
        readonly requiresPayment: true;
        readonly requiresSubscription: false;
        readonly requiresVerification: false;
        readonly minimumDays: 0;
    };
};
export declare const DEFAULT_REWARD_EXPIRY_DAYS = 365;
export declare const REWARD_EXPIRY_WARNING_DAYS = 30;
export declare const MIN_REDEMPTION_AMOUNT = 1000;
export declare const MAX_DAILY_REDEMPTIONS = 5;
export declare const MAX_MONTHLY_REDEMPTIONS = 20;
export declare const PLATFORM_COMMISSION_RATE = 0.2;
export declare const LISTING_AGENT_COMMISSION_RATE = 0.5;
export declare const SUB_AGENT_COMMISSION_RATE = 0.5;
export declare const MAX_REFERRALS_PER_USER = 1000;
export declare const MAX_PENDING_REFERRALS = 100;
export declare const NOTIFY_ON_CLICK = false;
export declare const NOTIFY_ON_SIGNUP = true;
export declare const NOTIFY_ON_QUALIFIED = true;
export declare const NOTIFY_ON_REWARD = true;
export declare const ANALYTICS_RETENTION_DAYS = 90;
export declare const LEADERBOARD_TOP_COUNT = 10;
export declare const REFERRAL_LINK_GENERATION_LIMIT_PER_DAY = 50;
export declare const REFERRAL_API_RATE_LIMIT = 100;
export declare const MAX_REFERRALS_FROM_SAME_IP = 3;
export declare const MAX_REFERRALS_SAME_DEVICE_FINGERPRINT = 5;
export declare const SUSPICIOUS_ACTIVITY_THRESHOLD = 10;
export declare const REFERRAL_ERROR_MESSAGES: {
    readonly INVALID_REFERRAL_CODE: "Invalid referral code";
    readonly REFERRAL_CODE_NOT_FOUND: "Referral code not found";
    readonly REFERRAL_CODE_EXPIRED: "Referral code has expired";
    readonly SELF_REFERRAL_NOT_ALLOWED: "You cannot refer yourself";
    readonly ALREADY_REFERRED: "User has already been referred";
    readonly REFERRAL_LIMIT_EXCEEDED: "Referral limit exceeded";
    readonly REWARD_NOT_FOUND: "Reward not found";
    readonly REWARD_ALREADY_REDEEMED: "Reward has already been redeemed";
    readonly REWARD_EXPIRED: "Reward has expired";
    readonly INSUFFICIENT_BALANCE: "Insufficient reward balance";
    readonly MINIMUM_REDEMPTION_NOT_MET: "Minimum redemption amount is ₦1000";
    readonly DAILY_REDEMPTION_LIMIT_EXCEEDED: "Daily redemption limit exceeded";
    readonly INVALID_BANK_DETAILS: "Invalid bank account details";
    readonly PAYOUT_FAILED: "Payout processing failed";
};
export declare const REFERRAL_SUCCESS_MESSAGES: {
    readonly REFERRAL_CREATED: "Referral successfully created";
    readonly REWARD_EARNED: "Congratulations! You've earned a reward";
    readonly REWARD_REDEEMED: "Reward successfully redeemed";
    readonly PAYOUT_INITIATED: "Payout initiated successfully";
    readonly REFERRAL_QUALIFIED: "Your referral has qualified for rewards";
};
export declare const REFERRAL_EMAIL_TEMPLATES: {
    readonly REFERRAL_INVITATION: "referral-invitation";
    readonly REFERRAL_SIGNUP: "referral-signup";
    readonly REFERRAL_QUALIFIED: "referral-qualified";
    readonly REWARD_EARNED: "reward-earned";
    readonly REWARD_REDEEMED: "reward-redeemed";
    readonly REWARD_EXPIRING_SOON: "reward-expiring-soon";
    readonly PAYOUT_COMPLETED: "payout-completed";
};
export declare const SMS_TEMPLATES: {
    readonly REFERRAL_SIGNUP: "Someone signed up using your referral link!";
    readonly REFERRAL_QUALIFIED: "Your referral qualified! You earned {amount}.";
    readonly REWARD_EARNED: "Congrats! You earned {amount} in rewards.";
    readonly PAYOUT_COMPLETED: "Your {amount} payout has been processed.";
};
export declare const SHARE_CHANNELS: {
    readonly WHATSAPP: "whatsapp";
    readonly EMAIL: "email";
    readonly SMS: "sms";
    readonly FACEBOOK: "facebook";
    readonly TWITTER: "twitter";
    readonly COPY: "copy";
};
export declare const PROMOTION_TYPES: {
    readonly PUBLIC: "PUBLIC";
    readonly PERMISSION_BASED: "PERMISSION_BASED";
    readonly RESTRICTED: "RESTRICTED";
    readonly REQUEST_BASED: "REQUEST_BASED";
};
export declare const PROMOTION_REQUEST_STATUSES: {
    readonly PENDING: "PENDING";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
};
export declare const AGENT_REFERRAL_COMMISSION: {
    readonly WITH_SUB_AGENT: {
        readonly LISTING_AGENT: 0.5;
        readonly SUB_AGENT: 0.5;
        readonly PLATFORM: 0;
    };
    readonly WITHOUT_SUB_AGENT: {
        readonly LISTING_AGENT: 0.5;
        readonly PLATFORM: 0.5;
    };
};
export declare const DASHBOARD_CONFIG: {
    readonly RECENT_REFERRALS_LIMIT: 10;
    readonly PENDING_REWARDS_LIMIT: 5;
    readonly CHART_DATA_POINTS: 30;
    readonly REFRESH_INTERVAL_MS: 300000;
};
export declare const CACHE_TTL: {
    readonly REFERRAL_STATS: 300;
    readonly REWARD_BALANCE: 60;
    readonly LEADERBOARD: 600;
    readonly USER_REFERRALS: 180;
};
export declare const API_ENDPOINTS: {
    readonly GENERATE_LINK: "/api/referrals/generate-link";
    readonly TRACK_CLICK: "/api/referrals/track-click";
    readonly GET_STATS: "/api/referrals/stats";
    readonly GET_REWARDS: "/api/referrals/rewards";
    readonly REDEEM_REWARD: "/api/referrals/redeem";
    readonly GET_LEADERBOARD: "/api/referrals/leaderboard";
    readonly AGENT_REFERRAL: "/api/agent-referrals";
    readonly PROMOTION_REQUEST: "/api/promotion-requests";
};
export declare const FEATURE_FLAGS: {
    readonly REFERRAL_SYSTEM_ENABLED: true;
    readonly AGENT_REFERRAL_ENABLED: true;
    readonly REWARD_EXPIRY_ENABLED: true;
    readonly LEADERBOARD_ENABLED: true;
    readonly MILESTONE_REWARDS_ENABLED: true;
    readonly FRAUD_DETECTION_ENABLED: true;
    readonly AUTO_QUALIFICATION_ENABLED: true;
};
export declare const WEBHOOK_EVENTS: {
    readonly REFERRAL_CREATED: "referral.created";
    readonly REFERRAL_QUALIFIED: "referral.qualified";
    readonly REWARD_EARNED: "reward.earned";
    readonly REWARD_REDEEMED: "reward.redeemed";
    readonly PAYOUT_COMPLETED: "payout.completed";
    readonly PROMOTION_REQUEST_CREATED: "promotion_request.created";
    readonly PROMOTION_REQUEST_APPROVED: "promotion_request.approved";
};
//# sourceMappingURL=referralConstants.d.ts.map