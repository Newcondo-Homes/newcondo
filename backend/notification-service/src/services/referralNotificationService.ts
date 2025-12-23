// backend/notification-service/src/services/referralNotificationService.ts

import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';

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

class ReferralNotificationService {
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Load and compile email template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);
    
    this.templatesCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Get common template data
   */
  private getCommonData() {
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
  async sendReferralInvitation(data: ReferralInvitationData): Promise<void> {
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

    await emailService.sendEmail({
      to: data.recipientEmail,
      subject: `${data.referrerName} invited you to join NewCondo!`,
      html,
    });
  }

  /**
   * Notify referrer about signup
   */
  async notifyReferralSignup(data: ReferralSignupData): Promise<void> {
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

    await emailService.sendEmail({
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
  async notifyReferralQualified(data: ReferralQualifiedData): Promise<void> {
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

    await emailService.sendEmail({
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
  async notifyRewardEarned(data: RewardEarnedData): Promise<void> {
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

    await emailService.sendEmail({
      to: data.userEmail,
      subject: '🎁 You earned a reward on NewCondo!',
      html,
    });
  }

  /**
   * Notify user about redeemed reward
   */
  async notifyRewardRedeemed(data: RewardRedeemedData): Promise<void> {
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

    await emailService.sendEmail({
      to: data.userEmail,
      subject: '✅ Your reward has been redeemed',
      html,
    });
  }

  /**
   * Send referral SMS
   */
  async sendReferralSMS(data: {
    phoneNumber: string;
    message: string;
    type: string;
  }): Promise<void> {
    if (!data.phoneNumber) return;

    try {
      await smsService.sendSMS({
        to: data.phoneNumber,
        message: data.message,
      });
    } catch (error) {
      console.error('Failed to send referral SMS:', error);
    }
  }

  /**
   * Send referral push notification
   */
  async sendReferralPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    try {
      await pushService.sendPushNotification({
        userId: data.userId,
        title: data.title,
        body: data.body,
        data: data.data,
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Batch send notifications
   */
  async batchSendNotifications(
    notifications: Array<{
      type: string;
      data: any;
    }>
  ): Promise<Array<{ success: boolean; error?: string }>> {
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
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send reward expiry reminder
   */
  async sendRewardExpiryReminder(data: {
    userId: string;
    userName: string;
    userEmail: string;
    rewardAmount: number;
    expiryDate: string;
    daysUntilExpiry: number;
  }): Promise<void> {
    const html = `
      <p>Hi ${data.userName},</p>
      <p>This is a reminder that you have ₦${data.rewardAmount} in rewards that will expire in ${data.daysUntilExpiry} days (${data.expiryDate}).</p>
      <p>Make sure to use or redeem your rewards before they expire!</p>
      <a href="${process.env.APP_URL}/referrals/redeem">Redeem Now</a>
    `;

    await emailService.sendEmail({
      to: data.userEmail,
      subject: `⏰ Reminder: ₦${data.rewardAmount} in rewards expiring soon`,
      html,
    });
  }

  /**
   * Get notification history (placeholder - implement with database)
   */
  async getNotificationHistory(params: {
    userId: string;
    page: number;
    limit: number;
    type?: string;
  }): Promise<any> {
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
  async markNotificationAsRead(notificationId: string): Promise<void> {
    // Implement with database update
  }
}

export const referralNotificationService = new ReferralNotificationService();