import { Request, Response } from 'express';
import { queueNotificationService } from '../services/queueNotificationService';
import { agentAlertService } from '../services/agentAlertService';

export class QueueNotificationController {
  /**
   * Send new job alert to available agents
   */
  async sendNewJobAlert(req: Request, res: Response): Promise<void> {
    try {
      const {
        markingJobId,
        propertyId,
        location,
        fee,
        urgencyLevel,
        agentIds,
      } = req.body;

      const result = await agentAlertService.notifyAvailableAgents({
        markingJobId,
        propertyId,
        location,
        fee,
        urgencyLevel,
        agentIds,
      });

      res.status(200).json({
        success: true,
        message: 'Job alerts sent successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error sending new job alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send queue position update notification
   */
  async sendQueuePositionUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, markingJobId, queuePosition, estimatedTime } = req.body;

      await queueNotificationService.notifyQueuePositionUpdate({
        agentId,
        markingJobId,
        queuePosition,
        estimatedTime,
      });

      res.status(200).json({
        success: true,
        message: 'Queue position update sent successfully',
      });
    } catch (error) {
      console.error('Error sending queue position update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send queue position update',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send time slot expiry warning
   */
  async sendTimeSlotExpiryWarning(req: Request, res: Response): Promise<void> {
    try {
      const { agentId, markingJobId, remainingMinutes } = req.body;

      await queueNotificationService.notifyTimeSlotExpiry({
        agentId,
        markingJobId,
        remainingMinutes,
      });

      res.status(200).json({
        success: true,
        message: 'Time slot expiry warning sent successfully',
      });
    } catch (error) {
      console.error('Error sending time slot expiry warning:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send time slot expiry warning',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send job assignment confirmation
   */
  async sendJobAssignmentConfirmation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const {
        agentId,
        markingJobId,
        propertyAddress,
        contactPerson,
        timeSlotExpiry,
      } = req.body;

      await queueNotificationService.notifyJobAssignment({
        agentId,
        markingJobId,
        propertyAddress,
        contactPerson,
        timeSlotExpiry,
      });

      res.status(200).json({
        success: true,
        message: 'Job assignment confirmation sent successfully',
      });
    } catch (error) {
      console.error('Error sending job assignment confirmation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job assignment confirmation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Notify property owner when job is claimed
   */
  async sendJobClaimNotification(req: Request, res: Response): Promise<void> {
    try {
      const { ownerId, markingJobId, agentName, estimatedCompletion } =
        req.body;

      await queueNotificationService.notifyOwnerJobClaimed({
        ownerId,
        markingJobId,
        agentName,
        estimatedCompletion,
      });

      res.status(200).json({
        success: true,
        message: 'Job claim notification sent to owner successfully',
      });
    } catch (error) {
      console.error('Error sending job claim notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send job claim notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send compensation notification for time expired
   */
  async sendTimeExpiredCompensation(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { agentId, markingJobId, compensationAmount, reason } = req.body;

      await queueNotificationService.notifyCompensation({
        agentId,
        markingJobId,
        compensationAmount,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Compensation notification sent successfully',
      });
    } catch (error) {
      console.error('Error sending compensation notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send compensation notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send bulk notifications to multiple agents
   */
  async sendBulkNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { notifications } = req.body;

      const results = await Promise.allSettled(
        notifications.map((notification: any) =>
          queueNotificationService.sendNotification(notification)
        )
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      res.status(200).json({
        success: true,
        message: 'Bulk notifications processed',
        data: {
          total: notifications.length,
          successful,
          failed,
        },
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send queue released notification when job is completed
   */
  async sendQueueReleasedNotification(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { agentIds, markingJobId, reason } = req.body;

      await queueNotificationService.notifyQueueReleased({
        agentIds,
        markingJobId,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Queue released notifications sent successfully',
      });
    } catch (error) {
      console.error('Error sending queue released notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send queue released notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const queueNotificationController = new QueueNotificationController();