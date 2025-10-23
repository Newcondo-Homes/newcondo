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












// // backend/notification-service/src/controllers/markingNotificationController.ts

// import { Request, Response } from 'express';
// import { markingNotificationService } from '../services/markingNotificationService';
// import { agentBroadcastService } from '../services/agentBroadcastService';

// class MarkingNotificationController {
//   /**
//    * Send marking job assignment notification to agent
//    */
//   async sendAssignmentNotification(req: Request, res: Response) {
//     try {
//       const { agentId, markingJobId, propertyDetails, timeSlotExpiry } = req.body;

//       if (!agentId || !markingJobId || !propertyDetails) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendAssignmentNotification({
//         agentId,
//         markingJobId,
//         propertyDetails,
//         timeSlotExpiry,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Assignment notification sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending assignment notification:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send assignment notification',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send marking completion notification to property owner
//    */
//   async sendCompletionNotification(req: Request, res: Response) {
//     try {
//       const { ownerId, markingJobId, propertyDetails, agentDetails, completionData } = req.body;

//       if (!ownerId || !markingJobId || !propertyDetails) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendCompletionNotification({
//         ownerId,
//         markingJobId,
//         propertyDetails,
//         agentDetails,
//         completionData,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Completion notification sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending completion notification:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send completion notification',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send confirmation request notification to property owner
//    */
//   async sendConfirmationRequest(req: Request, res: Response) {
//     try {
//       const { ownerId, markingJobId, propertyDetails, confirmationDeadline } = req.body;

//       if (!ownerId || !markingJobId || !propertyDetails || !confirmationDeadline) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendConfirmationRequest({
//         ownerId,
//         markingJobId,
//         propertyDetails,
//         confirmationDeadline,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Confirmation request sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending confirmation request:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send confirmation request',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send payment release notification to agent
//    */
//   async sendPaymentReleaseNotification(req: Request, res: Response) {
//     try {
//       const { agentId, markingJobId, paymentAmount, propertyDetails } = req.body;

//       if (!agentId || !markingJobId || !paymentAmount) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendPaymentReleaseNotification({
//         agentId,
//         markingJobId,
//         paymentAmount,
//         propertyDetails,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Payment release notification sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending payment release notification:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send payment release notification',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send queue position update to agents
//    */
//   async sendQueuePositionUpdate(req: Request, res: Response) {
//     try {
//       const { agentId, markingJobId, queuePosition, estimatedWaitTime, propertyDetails } = req.body;

//       if (!agentId || !markingJobId || queuePosition === undefined) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendQueuePositionUpdate({
//         agentId,
//         markingJobId,
//         queuePosition,
//         estimatedWaitTime,
//         propertyDetails,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Queue position update sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending queue position update:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send queue position update',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send time expiry warning to agent
//    */
//   async sendTimeExpiryWarning(req: Request, res: Response) {
//     try {
//       const { agentId, markingJobId, timeRemaining, propertyDetails } = req.body;

//       if (!agentId || !markingJobId || !timeRemaining) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendTimeExpiryWarning({
//         agentId,
//         markingJobId,
//         timeRemaining,
//         propertyDetails,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Time expiry warning sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending time expiry warning:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send time expiry warning',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Broadcast new marking job to eligible agents
//    */
//   async broadcastMarkingJob(req: Request, res: Response) {
//     try {
//       const { markingJobId, propertyDetails, location, fee } = req.body;

//       if (!markingJobId || !propertyDetails || !location) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       const result = await agentBroadcastService.broadcastNewMarkingJob({
//         markingJobId,
//         propertyDetails,
//         location,
//         fee,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Marking job broadcast successfully',
//         data: result,
//       });
//     } catch (error) {
//       console.error('Error broadcasting marking job:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to broadcast marking job',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send job cancellation notification
//    */
//   async sendJobCancellationNotification(req: Request, res: Response) {
//     try {
//       const { recipientId, markingJobId, reason, propertyDetails } = req.body;

//       if (!recipientId || !markingJobId) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendJobCancellationNotification({
//         recipientId,
//         markingJobId,
//         reason,
//         propertyDetails,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Cancellation notification sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending cancellation notification:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send cancellation notification',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }

//   /**
//    * Send partial payment notification to agent (for timeout compensation)
//    */
//   async sendPartialPaymentNotification(req: Request, res: Response) {
//     try {
//       const { agentId, markingJobId, amount, reason, propertyDetails } = req.body;

//       if (!agentId || !markingJobId || !amount) {
//         return res.status(400).json({
//           success: false,
//           message: 'Missing required fields',
//         });
//       }

//       await markingNotificationService.sendPartialPaymentNotification({
//         agentId,
//         markingJobId,
//         amount,
//         reason,
//         propertyDetails,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Partial payment notification sent successfully',
//       });
//     } catch (error) {
//       console.error('Error sending partial payment notification:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send partial payment notification',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       });
//     }
//   }
// }

// export const markingNotificationController = new MarkingNotificationController();