// backend/notification-service/src/controllers/referralNotificationController.ts

import { Request, Response } from 'express';
import { referralNotificationService } from '../services/referralNotificationService';

export class ReferralNotificationController {
  /**
   * Send referral invitation email
   */
  async sendReferralInvitation(req: Request, res: Response): Promise<void> {
    try {
      const {
        referrerName,
        referrerEmail,
        recipientEmail,
        recipientName,
        referralCode,
        referralLink,
        rewardAmount,
        rewardDescription,
      } = req.body;

      await referralNotificationService.sendReferralInvitation({
        referrerName,
        referrerEmail,
        recipientEmail,
        recipientName,
        referralCode,
        referralLink,
        rewardAmount,
        rewardDescription,
      });

      res.status(200).json({
        success: true,
        message: 'Referral invitation sent successfully',
      });
    } catch (error: any) {
      console.error('Send referral invitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send referral invitation',
        error: error.message,
      });
    }
  }

  /**
   * Notify referrer when someone signs up using their link
   */
  async notifyReferralSignup(req: Request, res: Response): Promise<void> {
    try {
      const {
        referrerId,
        referrerName,
        referrerEmail,
        referredName,
        referredRole,
        referralCode,
        totalReferrals,
        qualifiedReferrals,
        totalEarnings,
        qualificationSteps,
        nextMilestone,
      } = req.body;

      await referralNotificationService.notifyReferralSignup({
        referrerId,
        referrerName,
        referrerEmail,
        referredName,
        referredRole,
        referralCode,
        totalReferrals,
        qualifiedReferrals,
        totalEarnings,
        qualificationSteps,
        nextMilestone,
      });

      res.status(200).json({
        success: true,
        message: 'Referral signup notification sent successfully',
      });
    } catch (error: any) {
      console.error('Notify referral signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send referral signup notification',
        error: error.message,
      });
    }
  }

  /**
   * Notify referrer when referral qualifies
   */
  async notifyReferralQualified(req: Request, res: Response): Promise<void> {
    try {
      const {
        referrerId,
        referrerName,
        referrerEmail,
        referredName,
        referredRole,
        referralCode,
        referralType,
        rewardAmount,
        rewardType,
        rewardStatus,
        totalReferrals,
        qualifiedReferrals,
        totalEarnings,
        tierUpgrade,
        nextMilestone,
      } = req.body;

      await referralNotificationService.notifyReferralQualified({
        referrerId,
        referrerName,
        referrerEmail,
        referredName,
        referredRole,
        referralCode,
        referralType,
        rewardAmount,
        rewardType,
        rewardStatus,
        totalReferrals,
        qualifiedReferrals,
        totalEarnings,
        tierUpgrade,
        nextMilestone,
      });

      res.status(200).json({
        success: true,
        message: 'Referral qualified notification sent successfully',
      });
    } catch (error: any) {
      console.error('Notify referral qualified error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send referral qualified notification',
        error: error.message,
      });
    }
  }

  /**
   * Notify user when they earn a reward
   */
  async notifyRewardEarned(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        userName,
        userEmail,
        rewardId,
        rewardAmount,
        rewardType,
        rewardSource,
        previousBalance,
        newBalance,
        pendingBalance,
        expiryDate,
        milestone,
      } = req.body;

      await referralNotificationService.notifyRewardEarned({
        userId,
        userName,
        userEmail,
        rewardId,
        rewardAmount,
        rewardType,
        rewardSource,
        previousBalance,
        newBalance,
        pendingBalance,
        expiryDate,
        milestone,
      });

      res.status(200).json({
        success: true,
        message: 'Reward earned notification sent successfully',
      });
    } catch (error: any) {
      console.error('Notify reward earned error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reward earned notification',
        error: error.message,
      });
    }
  }

  /**
   * Notify user when they redeem a reward
   */
  async notifyRewardRedeemed(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        userName,
        userEmail,
        transactionId,
        redemptionAmount,
        redemptionMethod,
        previousBalance,
        remainingBalance,
        bankDetails,
        expectedArrival,
        status,
      } = req.body;

      await referralNotificationService.notifyRewardRedeemed({
        userId,
        userName,
        userEmail,
        transactionId,
        redemptionAmount,
        redemptionMethod,
        previousBalance,
        remainingBalance,
        bankDetails,
        expectedArrival,
        status,
      });

      res.status(200).json({
        success: true,
        message: 'Reward redeemed notification sent successfully',
      });
    } catch (error: any) {
      console.error('Notify reward redeemed error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reward redeemed notification',
        error: error.message,
      });
    }
  }

  /**
   * Send SMS notification for referral event
   */
  async sendReferralSMS(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, message, type } = req.body;

      await referralNotificationService.sendReferralSMS({
        phoneNumber,
        message,
        type,
      });

      res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
      });
    } catch (error: any) {
      console.error('Send referral SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error.message,
      });
    }
  }

  /**
   * Send push notification for referral event
   */
  async sendReferralPushNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, body, data } = req.body;

      await referralNotificationService.sendReferralPushNotification({
        userId,
        title,
        body,
        data,
      });

      res.status(200).json({
        success: true,
        message: 'Push notification sent successfully',
      });
    } catch (error: any) {
      console.error('Send push notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: error.message,
      });
    }
  }

  /**
   * Batch send referral notifications
   */
  async batchSendNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { notifications } = req.body;

      const results = await referralNotificationService.batchSendNotifications(
        notifications
      );

      res.status(200).json({
        success: true,
        message: 'Batch notifications processed',
        results,
      });
    } catch (error: any) {
      console.error('Batch send notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process batch notifications',
        error: error.message,
      });
    }
  }

  /**
   * Send reward expiry reminder
   */
  async sendRewardExpiryReminder(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        userName,
        userEmail,
        rewardAmount,
        expiryDate,
        daysUntilExpiry,
      } = req.body;

      await referralNotificationService.sendRewardExpiryReminder({
        userId,
        userName,
        userEmail,
        rewardAmount,
        expiryDate,
        daysUntilExpiry,
      });

      res.status(200).json({
        success: true,
        message: 'Expiry reminder sent successfully',
      });
    } catch (error: any) {
      console.error('Send expiry reminder error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send expiry reminder',
        error: error.message,
      });
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type } = req.query;

      const history = await referralNotificationService.getNotificationHistory({
        userId,
        page: Number(page),
        limit: Number(limit),
        type: type as string,
      });

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('Get notification history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification history',
        error: error.message,
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      await referralNotificationService.markNotificationAsRead(notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
      });
    }
  }
}

export const referralNotificationController = new ReferralNotificationController();