interface ReferralInvitationData {
    referrerName: string;
    referrerEmail: string;
    recipientEmail: string;
    recipientName?: string;
    referralCode: string;
    referralLink: string;
    rewardAmount: number;
    rewardDescription: string;
}
interface ReferralSignupData {
    referrerId: string;
    referrerName: string;
    referrerEmail: string;
    referredName: string;
    referredRole: string;
    referralCode: string;
    totalReferrals: number;
    qualifiedReferrals: number;
    totalEarnings: number;
    qualificationSteps: {
        step1Title: string;
        step1Description: string;
        step2Title: string;
        step2Description: string;
    };
    nextMilestone?: {
        referrals: number;
        badge: string;
        name: string;
        reward: number;
    };
}
interface ReferralQualifiedData {
    referrerId: string;
    referrerName: string;
    referrerEmail: string;
    referredName: string;
    referredRole: string;
    referralCode: string;
    referralType: string;
    rewardAmount: number;
    rewardType: string;
    rewardStatus: string;
    totalReferrals: number;
    qualifiedReferrals: number;
    totalEarnings: number;
    tierUpgrade?: {
        newTierBadge: string;
        newTierName: string;
        bonusMultiplier: number;
    };
    nextMilestone?: {
        count: number;
        name: string;
        reward: number;
    };
}
interface RewardEarnedData {
    userId: string;
    userName: string;
    userEmail: string;
    rewardId: string;
    rewardAmount: number;
    rewardType: string;
    rewardSource: string;
    previousBalance: number;
    newBalance: number;
    pendingBalance?: number;
    expiryDate?: string;
    milestone?: {
        name: string;
        description: string;
    };
}
interface RewardRedeemedData {
    userId: string;
    userName: string;
    userEmail: string;
    transactionId: string;
    redemptionAmount: number;
    redemptionMethod: string;
    previousBalance: number;
    remainingBalance: number;
    bankDetails?: string;
    expectedArrival?: string;
    status: string;
}
declare class ReferralNotificationService {
    private templatesCache;
    /**
     * Load and compile email template
     */
    private loadTemplate;
    /**
     * Get common template data
     */
    private getCommonData;
    /**
     * Send referral invitation email
     */
    sendReferralInvitation(data: ReferralInvitationData): Promise<void>;
    /**
     * Notify referrer about signup
     */
    notifyReferralSignup(data: ReferralSignupData): Promise<void>;
    /**
     * Notify referrer about qualified referral
     */
    notifyReferralQualified(data: ReferralQualifiedData): Promise<void>;
    /**
     * Notify user about earned reward
     */
    notifyRewardEarned(data: RewardEarnedData): Promise<void>;
    /**
     * Notify user about redeemed reward
     */
    notifyRewardRedeemed(data: RewardRedeemedData): Promise<void>;
    /**
     * Send referral SMS
     */
    sendReferralSMS(data: {
        phoneNumber: string;
        message: string;
        type: string;
    }): Promise<void>;
    /**
     * Send referral push notification
     */
    sendReferralPushNotification(data: {
        userId: string;
        title: string;
        body: string;
        data?: Record<string, any>;
    }): Promise<void>;
    /**
     * Batch send notifications
     */
    batchSendNotifications(notifications: Array<{
        type: string;
        data: any;
    }>): Promise<Array<{
        success: boolean;
        error?: string;
    }>>;
    /**
     * Send reward expiry reminder
     */
    sendRewardExpiryReminder(data: {
        userId: string;
        userName: string;
        userEmail: string;
        rewardAmount: number;
        expiryDate: string;
        daysUntilExpiry: number;
    }): Promise<void>;
    /**
     * Get notification history (placeholder - implement with database)
     */
    getNotificationHistory(params: {
        userId: string;
        page: number;
        limit: number;
        type?: string;
    }): Promise<any>;
    /**
     * Mark notification as read (placeholder - implement with database)
     */
    markNotificationAsRead(notificationId: string): Promise<void>;
}
export declare const referralNotificationService: ReferralNotificationService;
export {};
//# sourceMappingURL=referralNotificationService.d.ts.map