"use strict";
// backend/shared/src/constants/rewardTiers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferralTypeReward = exports.getRewardTypeConfig = exports.getNextMilestone = exports.getMilestoneReward = exports.calculateRewardWithBonus = exports.getNextTier = exports.getUserTier = exports.MILESTONE_REWARDS = exports.REFERRAL_TYPE_REWARDS = exports.REWARD_TYPE_CONFIGS = exports.USER_REWARD_TIERS = void 0;
const referral_1 = require("../types/referral");
// User tier progression system
exports.USER_REWARD_TIERS = [
    {
        tier: 'BRONZE',
        name: 'Bronze Member',
        minReferrals: 0,
        maxReferrals: 4,
        benefits: [
            'Basic referral rewards',
            'Access to referral dashboard',
            'Email support',
        ],
        bonusMultiplier: 1.0,
        badgeColor: '#CD7F32',
        icon: '🥉',
    },
    {
        tier: 'SILVER',
        name: 'Silver Member',
        minReferrals: 5,
        maxReferrals: 14,
        benefits: [
            'All Bronze benefits',
            '10% bonus on all rewards',
            'Priority email support',
            'Early access to new features',
        ],
        bonusMultiplier: 1.1,
        badgeColor: '#C0C0C0',
        icon: '🥈',
    },
    {
        tier: 'GOLD',
        name: 'Gold Member',
        minReferrals: 15,
        maxReferrals: 49,
        benefits: [
            'All Silver benefits',
            '25% bonus on all rewards',
            'Dedicated account manager',
            'Monthly bonus rewards',
            'Featured on leaderboard',
        ],
        bonusMultiplier: 1.25,
        badgeColor: '#FFD700',
        icon: '🥇',
    },
    {
        tier: 'PLATINUM',
        name: 'Platinum Member',
        minReferrals: 50,
        maxReferrals: 99,
        benefits: [
            'All Gold benefits',
            '50% bonus on all rewards',
            '24/7 priority support',
            'Quarterly bonus rewards',
            'VIP event invitations',
            'Custom referral link',
        ],
        bonusMultiplier: 1.5,
        badgeColor: '#E5E4E2',
        icon: '💎',
    },
    {
        tier: 'DIAMOND',
        name: 'Diamond Member',
        minReferrals: 100,
        benefits: [
            'All Platinum benefits',
            '100% bonus on all rewards (2x)',
            'Personal success coach',
            'Lifetime rewards',
            'Brand ambassador status',
            'Revenue sharing opportunities',
        ],
        bonusMultiplier: 2.0,
        badgeColor: '#B9F2FF',
        icon: '💠',
    },
];
// Reward type configurations
exports.REWARD_TYPE_CONFIGS = [
    {
        type: referral_1.RewardType.SERVICE_CREDIT,
        displayName: 'Service Credit',
        description: 'Credit towards NewCondo services',
        icon: '💳',
        canBeStacked: true,
        canBeTransferred: false,
        defaultExpiryDays: 365,
    },
    {
        type: referral_1.RewardType.SUBSCRIPTION_DISCOUNT,
        displayName: 'Subscription Discount',
        description: 'Discount on subscription fees',
        icon: '🎟️',
        canBeStacked: false,
        canBeTransferred: false,
        defaultExpiryDays: 90,
    },
    {
        type: referral_1.RewardType.RENT_CREDIT,
        displayName: 'Rent Credit',
        description: 'Credit towards rent payments',
        icon: '🏠',
        canBeStacked: true,
        canBeTransferred: false,
        defaultExpiryDays: 180,
    },
    {
        type: referral_1.RewardType.COMMISSION_CREDIT,
        displayName: 'Commission Credit',
        description: 'Credit towards commission fees',
        icon: '💼',
        canBeStacked: true,
        canBeTransferred: false,
        defaultExpiryDays: 365,
    },
    {
        type: referral_1.RewardType.MAINTENANCE_VOUCHER,
        displayName: 'Maintenance Voucher',
        description: 'Free property maintenance services',
        icon: '🔧',
        canBeStacked: true,
        canBeTransferred: true,
        defaultExpiryDays: 180,
    },
    {
        type: referral_1.RewardType.CASH_REWARD,
        displayName: 'Cash Reward',
        description: 'Direct cash payout to bank account',
        icon: '💰',
        canBeStacked: true,
        canBeTransferred: false,
        defaultExpiryDays: 365,
    },
];
// Referral type reward configurations
exports.REFERRAL_TYPE_REWARDS = [
    {
        referralType: 'OWNER_TO_OWNER',
        referrerAmount: 10000,
        referredAmount: 10000,
        rewardType: referral_1.RewardType.SERVICE_CREDIT,
        description: '₦10,000 service credit for each party',
        qualificationCriteria: [
            'New owner subscribes to paid plan',
            'Subscription active for 30 days',
        ],
    },
    {
        referralType: 'OWNER_TO_AGENT',
        referrerAmount: 5000,
        referredAmount: 5000,
        rewardType: referral_1.RewardType.SERVICE_CREDIT,
        description: '₦5,000 service credit for each party',
        qualificationCriteria: [
            'Agent completes verification',
            'Agent lists first property',
        ],
    },
    {
        referralType: 'OWNER_TO_RENTER',
        referrerAmount: 2000,
        referredAmount: 2000,
        rewardType: referral_1.RewardType.RENT_CREDIT,
        description: '₦2,000 credit for each party',
        qualificationCriteria: [
            'Renter completes first rent payment',
            'Payment confirmed by owner',
        ],
    },
    {
        referralType: 'AGENT_TO_OWNER',
        referrerAmount: 7000,
        referredAmount: 3000,
        rewardType: referral_1.RewardType.COMMISSION_CREDIT,
        description: '₦7,000 for agent, ₦3,000 for owner',
        qualificationCriteria: [
            'Owner subscribes to paid plan',
            'Owner lists first property',
        ],
    },
    {
        referralType: 'AGENT_TO_AGENT',
        referrerAmount: 3000,
        referredAmount: 3000,
        rewardType: referral_1.RewardType.COMMISSION_CREDIT,
        description: '₦3,000 commission credit for each party',
        qualificationCriteria: [
            'New agent completes verification',
            'New agent closes first deal',
        ],
    },
    {
        referralType: 'AGENT_TO_RENTER',
        referrerAmount: 5000,
        referredAmount: 5000,
        rewardType: referral_1.RewardType.SERVICE_CREDIT,
        description: '₦5,000 credit for each party',
        qualificationCriteria: [
            'Renter completes first payment',
            'Payment through agent referral link',
        ],
    },
    {
        referralType: 'RENTER_TO_RENTER',
        referrerAmount: 1000,
        referredAmount: 2000,
        rewardType: referral_1.RewardType.RENT_CREDIT,
        description: '₦1,000 for referrer, ₦2,000 for new renter',
        qualificationCriteria: [
            'New renter completes first payment',
            'Payment confirmed successfully',
        ],
    },
];
exports.MILESTONE_REWARDS = [
    {
        milestone: 5,
        rewardAmount: 5000,
        rewardType: referral_1.RewardType.SERVICE_CREDIT,
        name: 'First Five',
        description: 'Bonus for your first 5 referrals',
        badge: '⭐',
    },
    {
        milestone: 10,
        rewardAmount: 10000,
        rewardType: referral_1.RewardType.SERVICE_CREDIT,
        name: 'Perfect Ten',
        description: 'Congratulations on 10 referrals!',
        badge: '🌟',
    },
    {
        milestone: 25,
        rewardAmount: 25000,
        rewardType: referral_1.RewardType.CASH_REWARD,
        name: 'Quarter Century',
        description: 'Amazing! 25 successful referrals',
        badge: '🏆',
    },
    {
        milestone: 50,
        rewardAmount: 50000,
        rewardType: referral_1.RewardType.CASH_REWARD,
        name: 'Half Century',
        description: 'Outstanding achievement!',
        badge: '🎖️',
    },
    {
        milestone: 100,
        rewardAmount: 100000,
        rewardType: referral_1.RewardType.CASH_REWARD,
        name: 'Century Club',
        description: 'Welcome to the elite Century Club!',
        badge: '👑',
    },
    {
        milestone: 250,
        rewardAmount: 250000,
        rewardType: referral_1.RewardType.CASH_REWARD,
        name: 'Super Ambassador',
        description: 'You are a true NewCondo champion!',
        badge: '💫',
    },
    {
        milestone: 500,
        rewardAmount: 500000,
        rewardType: referral_1.RewardType.CASH_REWARD,
        name: 'Legend Status',
        description: 'Legendary performance!',
        badge: '🔥',
    },
];
// Helper function to get user tier based on referral count
const getUserTier = (referralCount) => {
    for (let i = exports.USER_REWARD_TIERS.length - 1; i >= 0; i--) {
        const tier = exports.USER_REWARD_TIERS[i];
        if (referralCount >= tier.minReferrals) {
            return tier;
        }
    }
    return exports.USER_REWARD_TIERS[0]; // Default to Bronze
};
exports.getUserTier = getUserTier;
// Helper function to get next tier
const getNextTier = (currentTier) => {
    const currentIndex = exports.USER_REWARD_TIERS.findIndex((t) => t.tier === currentTier);
    if (currentIndex === -1 || currentIndex === exports.USER_REWARD_TIERS.length - 1) {
        return null;
    }
    return exports.USER_REWARD_TIERS[currentIndex + 1];
};
exports.getNextTier = getNextTier;
// Helper function to calculate reward with tier bonus
const calculateRewardWithBonus = (baseAmount, tierMultiplier) => {
    return Math.round(baseAmount * tierMultiplier);
};
exports.calculateRewardWithBonus = calculateRewardWithBonus;
// Helper function to get milestone reward for count
const getMilestoneReward = (referralCount) => {
    return (exports.MILESTONE_REWARDS.find((m) => m.milestone === referralCount) || null);
};
exports.getMilestoneReward = getMilestoneReward;
// Helper function to get next milestone
const getNextMilestone = (currentCount) => {
    return (exports.MILESTONE_REWARDS.find((m) => m.milestone > currentCount) || null);
};
exports.getNextMilestone = getNextMilestone;
// Helper function to get reward type configuration
const getRewardTypeConfig = (rewardType) => {
    return exports.REWARD_TYPE_CONFIGS.find((c) => c.type === rewardType);
};
exports.getRewardTypeConfig = getRewardTypeConfig;
// Helper function to get referral type reward configuration
const getReferralTypeReward = (referralType) => {
    return exports.REFERRAL_TYPE_REWARDS.find((r) => r.referralType === referralType);
};
exports.getReferralTypeReward = getReferralTypeReward;
//# sourceMappingURL=rewardTiers.js.map