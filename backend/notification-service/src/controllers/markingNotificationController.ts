import { Request, Response } from 'express';
import { MarkingNotificationService } from '../services/markingNotificationService';
import { ProximityNotificationService } from '../services/proximityNotificationService';
import { 
  MarkingJobCreatedPayload, 
  MarkingJobAssignedPayload,
  MarkingJobBroadcastPayload,
  MarkingJobCompletedPayload,
  MarkingVerificationReminderPayload,
  MarkingCompensationReleasedPayload,
  MarkingJobExpiredPayload,
  ShareableLinkInvitePayload
} from '../types/markingNotification';

export class MarkingNotificationController {
  private markingNotificationService: MarkingNotificationService;
  private proximityNotificationService: ProximityNotificationService;

  constructor() {
    this.markingNotificationService = new MarkingNotificationService();
    this.proximityNotificationService = new ProximityNotificationService();
  }

  /**
   * Send notification when a marking job is created
   */
  sendJobCreatedNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingJobCreatedPayload = req.body;

      await this.markingNotificationService.sendJobCreatedNotification(payload);

      res.status(200).json({
        success: true,
        message: 'Job created notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending job created notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job created notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send notification when a marking job is assigned to an agent
   */
  sendJobAssignedNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingJobAssignedPayload = req.body;

      await this.markingNotificationService.sendJobAssignedNotification(payload);

      res.status(200).json({
        success: true,
        message: 'Job assigned notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending job assigned notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job assigned notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Broadcast marking job to nearby agents
   */
  broadcastJobToAgents = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingJobBroadcastPayload = req.body;

      const result = await this.proximityNotificationService.broadcastJobToNearbyAgents(payload);

      res.status(200).json({
        success: true,
        message: 'Job broadcast sent successfully',
        data: {
          notifiedAgents: result.notifiedAgents,
          totalNotificationsSent: result.totalSent,
          failedNotifications: result.failed
        }
      });
    } catch (error) {
      console.error('Error broadcasting job to agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to broadcast job to agents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send notification when a marking job is completed
   */
  sendJobCompletedNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingJobCompletedPayload = req.body;

      await this.markingNotificationService.sendJobCompletedNotification(payload);

      res.status(200).json({
        success: true,
        message: 'Job completed notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending job completed notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job completed notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send verification reminder to property owner
   */
  sendVerificationReminder = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingVerificationReminderPayload = req.body;

      await this.markingNotificationService.sendVerificationReminder(payload);

      res.status(200).json({
        success: true,
        message: 'Verification reminder sent successfully'
      });
    } catch (error) {
      console.error('Error sending verification reminder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send notification when compensation is released to agent
   */
  sendCompensationReleasedNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingCompensationReleasedPayload = req.body;

      await this.markingNotificationService.sendCompensationReleasedNotification(payload);

      res.status(200).json({
        success: true,
        message: 'Compensation released notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending compensation released notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send compensation released notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send notification when a marking job expires
   */
  sendJobExpiredNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: MarkingJobExpiredPayload = req.body;

      await this.markingNotificationService.sendJobExpiredNotification(payload);

      res.status(200).json({
        success: true,
        message: 'Job expired notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending job expired notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job expired notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send shareable link invite to designated marker
   */
  sendShareableLinkInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: ShareableLinkInvitePayload = req.body;

      await this.markingNotificationService.sendShareableLinkInvite(payload);

      res.status(200).json({
        success: true,
        message: 'Shareable link invite sent successfully'
      });
    } catch (error) {
      console.error('Error sending shareable link invite:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send shareable link invite',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Send bulk notifications (for queue updates, etc.)
   */
  sendBulkNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notifications } = req.body;

      if (!Array.isArray(notifications)) {
        res.status(400).json({
          success: false,
          message: 'Notifications must be an array'
        });
        return;
      }

      const results = await Promise.allSettled(
        notifications.map(notification => 
          this.markingNotificationService.sendNotification(notification)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      res.status(200).json({
        success: true,
        message: 'Bulk notifications processed',
        data: {
          total: notifications.length,
          successful,
          failed
        }
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}