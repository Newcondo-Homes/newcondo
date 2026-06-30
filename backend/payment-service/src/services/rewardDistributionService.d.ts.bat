interface ProcessReferralQualificationData {
    referralId: string;
    referredUserId: string;
}
interface DistributeCommissionData {
    rentalId: string;
    propertyId: string;
    rentAmount: number;
    hasSubAgent: boolean;
    listingAgentId?: string;
    subAgentId?: string;
    ownerId: string;
}
declare class RewardDistributionService {
    /**
     * Process referral qualification and distribute rewards
     */
    processReferralQualification(data: ProcessReferralQualificationData): Promise<void>;
    /**
     * Create reward records for referrer and referred
     */
    private createRewardRecords;
    /**
     * Check and award milestone rewards
     */
    private checkAndAwardMilestones;
    /**
     * Distribute commission from rental payment
     */
    distributeCommission(data: DistributeCommissionData): Promise<void>;
    /**
     * Get or create virtual account for user
     */
    private getOrCreateVirtualAccount;
    /**
     * Get platform virtual account
     */
    private getPlatformVirtualAccount;
    /**
     * Get user's total referral count
     */
    private getUserReferralCount;
    /**
     * Send qualification notifications
     */
    private sendQualificationNotifications;
    /**
     * Get user referral stats
     */
    private getUserReferralStats;
    /**
     * Process agent referral commission
     */
    processAgentReferralCommission(data: {
        agentReferralId: string;
        paymentId: string;
        rentAmount: number;
    }): Promise<void>;
}
export declare const rewardDistributionService: RewardDistributionService;
export {};
//# sourceMappingURL=rewardDistributionService.d.ts.map