import { RewardType } from '../types/referral';
export interface RewardTierDefinition {
    tier: string;
    name: string;
    minReferrals: number;
    maxReferrals?: number;
    benefits: string[];
    bonusMultiplier: number;
    badgeColor: string;
    icon: string;
}
export interface RewardTypeConfig {
    type: RewardType;
    displayName: string;
    description: string;
    icon: string;
    canBeStacked: boolean;
    canBeTransferred: boolean;
    defaultExpiryDays: number;
}
export interface ReferralTypeRewardConfig {
    referralType: string;
    referrerAmount: number;
    referredAmount: number;
    rewardType: RewardType;
    description: string;
    qualificationCriteria: string[];
}
export declare const USER_REWARD_TIERS: RewardTierDefinition[];
export declare const REWARD_TYPE_CONFIGS: RewardTypeConfig[];
export declare const REFERRAL_TYPE_REWARDS: ReferralTypeRewardConfig[];
export interface MilestoneReward {
    milestone: number;
    rewardAmount: number;
    rewardType: RewardType;
    name: string;
    description: string;
    badge: string;
}
export declare const MILESTONE_REWARDS: MilestoneReward[];
export interface BonusMultiplierPeriod {
    name: string;
    startDate: Date;
    endDate: Date;
    multiplier: number;
    description: string;
}
export declare const getUserTier: (referralCount: number) => RewardTierDefinition;
export declare const getNextTier: (currentTier: string) => RewardTierDefinition | null;
export declare const calculateRewardWithBonus: (baseAmount: number, tierMultiplier: number) => number;
export declare const getMilestoneReward: (referralCount: number) => MilestoneReward | null;
export declare const getNextMilestone: (currentCount: number) => MilestoneReward | null;
export declare const getRewardTypeConfig: (rewardType: RewardType) => RewardTypeConfig | undefined;
export declare const getReferralTypeReward: (referralType: string) => ReferralTypeRewardConfig | undefined;
//# sourceMappingURL=rewardTiers.d.ts.map