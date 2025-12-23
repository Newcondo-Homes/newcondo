// backend/referral-service/src/config/referralRules.ts

import { Role } from '@newcondo/db';

// Referral eligibility rules
export const REFERRAL_ELIGIBILITY = {
  // Only paying users can refer
  REFERRER_MUST_BE_PAID_USER: true,
  
  // Minimum account age to refer (in days)
  MIN_ACCOUNT_AGE_DAYS: 0,
  
  // User must be verified to refer
  REFERRER_MUST_BE_VERIFIED: false,
  
  // Self-referral prevention
  PREVENT_SELF_REFERRAL: true,
  
  // Duplicate referral prevention
  PREVENT_DUPLICATE_REFERRALS: true,
};

// Role-based referral capabilities
export const ROLE_REFERRAL_CAPABILITIES = {
  [Role.OWNER]: {
    canRefer: true,
    mustHaveActiveSubscription: true,
    canReferRoles: [Role.OWNER, Role.AGENT, Role.RENTER],
  },
  [Role.AGENT]: {
    canRefer: true,
    mustHaveCompletedTransaction: true,
    canReferRoles: [Role.OWNER, Role.AGENT, Role.RENTER],
  },
  [Role.RENTER]: {
    canRefer: true,
    mustHaveCompletedPayment: true,
    canReferRoles: [Role.RENTER],
  },
  [Role.ADMIN]: {
    canRefer: false,
    mustHaveActiveSubscription: false,
    canReferRoles: [],
  },
};

// Referral tracking settings
export const TRACKING_SETTINGS = {
  // Cookie/session duration for tracking (in days)
  TRACKING_COOKIE_DURATION_DAYS: 30,
  
  // Attribution window (in days)
  ATTRIBUTION_WINDOW_DAYS: 30,
  
  // Track unique clicks based on IP + User Agent
  UNIQUE_CLICK_TRACKING: true,
  
  // Maximum clicks to track per referral code
  MAX_CLICKS_PER_CODE: 10000,
};

// Fraud prevention rules
export const FRAUD_PREVENTION = {
  // Maximum referrals per day per user
  MAX_REFERRALS_PER_DAY: 10,
  
  // Maximum referrals per month per user
  MAX_REFERRALS_PER_MONTH: 50,
  
  // Minimum time between referrals (in minutes)
  MIN_TIME_BETWEEN_REFERRALS_MINUTES: 5,
  
  // Flag suspicious patterns
  FLAG_SUSPICIOUS_PATTERNS: true,
  
  // Suspicious pattern thresholds
  SUSPICIOUS_PATTERNS: {
    SAME_IP_REFERRALS: 3,
    RAPID_REFERRALS: 5, // within an hour
    SAME_DEVICE_REFERRALS: 3,
  },
};

// Reward qualification rules
export const QUALIFICATION_RULES = {
  // Grace period for qualification (in days)
  QUALIFICATION_GRACE_PERIOD_DAYS: 90,
  
  // Auto-expire unqualified referrals (in days)
  AUTO_EXPIRE_UNQUALIFIED_DAYS: 90,
  
  // Require email verification for rewards
  REQUIRE_EMAIL_VERIFICATION: true,
  
  // Require phone verification for rewards
  REQUIRE_PHONE_VERIFICATION: false,
};

// Referral link sharing settings
export const SHARING_SETTINGS = {
  // Supported sharing channels
  SUPPORTED_CHANNELS: [
    'whatsapp',
    'facebook',
    'twitter',
    'instagram',
    'email',
    'sms',
    'copy_link',
  ],
  
  // Pre-written share messages
  SHARE_MESSAGES: {
    whatsapp: 'Join NewCondo and get amazing property services! Use my referral link: {link}',
    facebook: 'I\'m loving NewCondo for property management! Join with my link and we both get rewards: {link}',
    twitter: 'Managing properties made easy with @NewCondo! Join with my referral link: {link}',
    email: 'Hi! I wanted to share NewCondo with you - it\'s a great platform for property management. Use my referral link to get started: {link}',
    sms: 'Check out NewCondo for property services! Join with my link: {link}',
  },
  
  // OG meta tags for social sharing
  SOCIAL_META: {
    title: 'Join NewCondo - Property Management Made Easy',
    description: 'Get rewarded when you join NewCondo! Discover quality properties and seamless management.',
    image: '/images/referral-og-image.jpg',
  },
};

// Milestone bonuses (optional future feature)
export const MILESTONE_BONUSES = {
  ENABLED: false,
  MILESTONES: [
    { referrals: 5, bonus: 5000, description: 'First 5 referrals bonus' },
    { referrals: 10, bonus: 15000, description: '10 referrals milestone' },
    { referrals: 25, bonus: 50000, description: '25 referrals milestone' },
    { referrals: 50, bonus: 150000, description: '50 referrals champion' },
  ],
};

// Leaderboard settings (optional future feature)
export const LEADERBOARD_SETTINGS = {
  ENABLED: false,
  UPDATE_FREQUENCY_HOURS: 24,
  TOP_REFERRERS_COUNT: 10,
  MONTHLY_RESET: true,
};

// Notification preferences
export const NOTIFICATION_PREFERENCES = {
  NOTIFY_ON_REFERRAL_SIGNUP: true,
  NOTIFY_ON_REFERRAL_QUALIFICATION: true,
  NOTIFY_ON_REWARD_EARNED: true,
  NOTIFY_ON_REWARD_PAYOUT: true,
  NOTIFY_ON_MILESTONE: true,
  
  CHANNELS: {
    EMAIL: true,
    SMS: false,
    IN_APP: true,
    PUSH: false,
  },
};