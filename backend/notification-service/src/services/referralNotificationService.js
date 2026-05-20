"use strict";
// backend/notification-service/src/services/referralNotificationService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralNotificationService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
const pushService_1 = require("./pushService");
class ReferralNotificationService {
    constructor() {
        this.templatesCache = new Map();
    }
    /**
     * Load and compile email template
     */
    async loadTemplate(templateName) {
        if (this.templatesCache.has(templateName)) {
            return this.templatesCache.get(templateName);
        }
        const templatePath = path_1.default.join(__dirname, '../templates', `${templateName}.html`);
        const templateContent = await promises_1.default.readFile(templatePath, 'utf-8');
        const compiledTemplate = handlebars_1.default.compile(templateContent);
        this.templatesCache.set(templateName, compiledTemplate);
        return compiledTemplate;
    }
    /**
     * Get common template data
     */
    getCommonData() {
        return {
            currentYear: new Date().getFullYear(),
            supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
            dashboardLink: `${process.env.APP_URL}/dashboard`,
            unsubscribeLink: `${process.env.APP_URL}/unsubscribe`,
        };
    }
    /**
     * Send referral invitation email
     */
    async sendReferralInvitation(data) {
        const template = await this.loadTemplate('referral-invitation');
        const html = template({
            ...data,
            ...this.getCommonData(),
            joinedDate: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
        });
        await emailService_1.emailService.sendEmail({
            to: data.recipientEmail,
            subject: `${data.referrerName} invited you to join NewCondo!`,
            html,
        });
    }
    /**
     * Notify referrer about signup
     */
    async notifyReferralSignup(data) {
        const template = await this.loadTemplate('referral-signup');
        const html = template({
            ...data,
            ...this.getCommonData(),
            joinedDate: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
            }),
            shareLink: `${process.env.APP_URL}/referrals/share`,
            qualificationStep1Title: data.qualificationSteps.step1Title,
            qualificationStep1Description: data.qualificationSteps.step1Description,
            qualificationStep2Title: data.qualificationSteps.step2Title,
            qualificationStep2Description: data.qualificationSteps.step2Description,
            nextMilestoneReferrals: data.nextMilestone?.referrals,
            nextMilestoneBadge: data.nextMilestone?.badge,
            nextMilestoneName: data.nextMilestone?.name,
            nextMilestoneReward: data.nextMilestone?.reward,
        });
        await emailService_1.emailService.sendEmail({
            to: data.referrerEmail,
            subject: '🎉 Someone joined using your referral link!',
            html,
        });
        // Send SMS notification
        await this.sendReferralSMS({
            phoneNumber: '', // Get from user profile
            message: `Someone signed up using your referral link! View details: ${process.env.APP_URL}/referrals`,
            type: 'SIGNUP',
        });
    }
    /**
     * Notify referrer about qualified referral
     */
    async notifyReferralQualified(data) {
        const template = await this.loadTemplate('referral-qualified');
        const html = template({
            ...data,
            ...this.getCommonData(),
            qualifiedDate: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
            isPending: data.rewardStatus === 'PENDING',
            redeemLink: `${process.env.APP_URL}/referrals/redeem`,
            shareLink: `${process.env.APP_URL}/referrals/share`,
            nextMilestoneCount: data.nextMilestone?.count,
            currentTier: 'Silver', // Get from user profile
            conversionRate: ((data.qualifiedReferrals / data.totalReferrals) * 100).toFixed(1),
            pendingReferrals: data.totalReferrals - data.qualifiedReferrals,
        });
        await emailService_1.emailService.sendEmail({
            to: data.referrerEmail,
            subject: '🎊 Your referral qualified! Reward earned',
            html,
        });
        // Send SMS notification
        await this.sendReferralSMS({
            phoneNumber: '', // Get from user profile
            message: `Your referral qualified! You earned ₦${data.rewardAmount}. View: ${process.env.APP_URL}/referrals`,
            type: 'QUALIFIED',
        });
    }
    /**
     * Notify user about earned reward
     */
    async notifyRewardEarned(data) {
        const template = await this.loadTemplate('reward-earned');
        const html = template({
            ...data,
            ...this.getCommonData(),
            earnedDate: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
            redeemLink: `${process.env.APP_URL}/referrals/redeem`,
            shareLink: `${process.env.APP_URL}/referrals/share`,
            minWithdrawal: '1,000',
        });
        await emailService_1.emailService.sendEmail({
            to: data.userEmail,
            subject: '🎁 You earned a reward on NewCondo!',
            html,
        });
    }
    /**
     * Notify user about redeemed reward
     */
    async notifyRewardRedeemed(data) {
        const template = await this.loadTemplate('reward-redeemed');
        const isBankTransfer = data.redemptionMethod === 'BANK_TRANSFER';
        const html = template({
            ...data,
            ...this.getCommonData(),
            redemptionDate: new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
            processedDate: new Date().toLocaleString('en-US'),
            processingTime: isBankTransfer ? '2-3 business days' : 'Instant',
            isBankTransfer,
            isCredit: data.redemptionMethod === 'CREDIT',
            bankTransferMessage: isBankTransfer
                ? `Your payout of ₦${data.redemptionAmount} is being processed and will arrive in your bank account within ${data.expectedArrival || '2-3 business days'}.`
                : '',
            transactionHistoryLink: `${process.env.APP_URL}/referrals/transactions`,
            shareLink: `${process.env.APP_URL}/referrals/share`,
        });
        await emailService_1.emailService.sendEmail({
            to: data.userEmail,
            subject: '✅ Your reward has been redeemed',
            html,
        });
    }
    /**
     * Send referral SMS
     */
    async sendReferralSMS(data) {
        if (!data.phoneNumber)
            return;
        try {
            await smsService_1.smsService.sendSMS({
                to: data.phoneNumber,
                message: data.message,
            });
        }
        catch (error) {
            console.error('Failed to send referral SMS:', error);
        }
    }
    /**
     * Send referral push notification
     */
    async sendReferralPushNotification(data) {
        try {
            await pushService_1.pushService.sendPushNotification({
                userId: data.userId,
                title: data.title,
                body: data.body,
                data: data.data,
            });
        }
        catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }
    /**
     * Batch send notifications
     */
    async batchSendNotifications(notifications) {
        const results = [];
        for (const notification of notifications) {
            try {
                switch (notification.type) {
                    case 'INVITATION':
                        await this.sendReferralInvitation(notification.data);
                        break;
                    case 'SIGNUP':
                        await this.notifyReferralSignup(notification.data);
                        break;
                    case 'QUALIFIED':
                        await this.notifyReferralQualified(notification.data);
                        break;
                    case 'REWARD_EARNED':
                        await this.notifyRewardEarned(notification.data);
                        break;
                    case 'REWARD_REDEEMED':
                        await this.notifyRewardRedeemed(notification.data);
                        break;
                    default:
                        throw new Error(`Unknown notification type: ${notification.type}`);
                }
                results.push({ success: true });
            }
            catch (error) {
                results.push({ success: false, error: error.message });
            }
        }
        return results;
    }
    /**
     * Send reward expiry reminder
     */
    async sendRewardExpiryReminder(data) {
        const html = `
      <p>Hi ${data.userName},</p>
      <p>This is a reminder that you have ₦${data.rewardAmount} in rewards that will expire in ${data.daysUntilExpiry} days (${data.expiryDate}).</p>
      <p>Make sure to use or redeem your rewards before they expire!</p>
      <a href="${process.env.APP_URL}/referrals/redeem">Redeem Now</a>
    `;
        await emailService_1.emailService.sendEmail({
            to: data.userEmail,
            subject: `⏰ Reminder: ₦${data.rewardAmount} in rewards expiring soon`,
            html,
        });
    }
    /**
     * Get notification history (placeholder - implement with database)
     */
    async getNotificationHistory(params) {
        // Implement with database query
        return {
            data: [],
            total: 0,
            page: params.page,
            limit: params.limit,
        };
    }
    /**
     * Mark notification as read (placeholder - implement with database)
     */
    async markNotificationAsRead(notificationId) {
        // Implement with database update
    }
}
exports.referralNotificationService = new ReferralNotificationService();
//# sourceMappingURL=referralNotificationService.js.map