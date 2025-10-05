import { Request, Response } from 'express';
import { confirmationNotificationService } from '../services/confirmationNotificationService';
import { z } from 'zod';

// Validation schemas
const sendConfirmationReminderSchema = z.object({
  rentalId: z.string().cuid(),
  renterId: z.string().cuid(),
  propertyTitle: z.string(),
  confirmationDeadline: z.string().datetime(),
  amount: z.number().positive(),
});

const sendBulkRemindersSchema = z.object({
  hoursBeforeDeadline: z.number().positive().optional(),
});

export class ConfirmationNotificationController {
  /**
   * Send confirmation reminder to a single renter
   */
  async sendConfirmationReminder(req: Request, res: Response) {
    try {
      const validatedData = sendConfirmationReminderSchema.parse(req.body);

      await confirmationNotificationService.sendConfirmationReminder(
        validatedData.rentalId,
        validatedData.renterId,
        validatedData.propertyTitle,
        new Date(validatedData.confirmationDeadline),
        validatedData.amount
      );

      return res.status(200).json({
        success: true,
        message: 'Confirmation reminder sent successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Error sending confirmation reminder:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation reminder',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send bulk confirmation reminders to renters approaching deadline
   */
  async sendBulkConfirmationReminders(req: Request, res: Response) {
    try {
      const validatedData = sendBulkRemindersSchema.parse(req.body);

      const result = await confirmationNotificationService.sendBulkConfirmationReminders(
        validatedData.hoursBeforeDeadline
      );

      return res.status(200).json({
        success: true,
        message: 'Bulk confirmation reminders sent',
        data: {
          totalSent: result.sent,
          totalFailed: result.failed,
          details: result.results,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      console.error('Error sending bulk confirmation reminders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send bulk confirmation reminders',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send confirmation deadline expiry warning
   */
  async sendDeadlineExpiryWarning(req: Request, res: Response) {
    try {
      const { rentalId, renterId, propertyTitle, hoursRemaining } = req.body;

      if (!rentalId || !renterId || !propertyTitle || hoursRemaining === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      await confirmationNotificationService.sendDeadlineExpiryWarning(
        rentalId,
        renterId,
        propertyTitle,
        hoursRemaining
      );

      return res.status(200).json({
        success: true,
        message: 'Deadline expiry warning sent successfully',
      });
    } catch (error) {
      console.error('Error sending deadline expiry warning:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send deadline expiry warning',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send confirmation received notification
   */
  async sendConfirmationReceived(req: Request, res: Response) {
    try {
      const { rentalId, renterId, propertyTitle } = req.body;

      if (!rentalId || !renterId || !propertyTitle) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      await confirmationNotificationService.sendConfirmationReceivedNotification(
        rentalId,
        renterId,
        propertyTitle
      );

      return res.status(200).json({
        success: true,
        message: 'Confirmation received notification sent successfully',
      });
    } catch (error) {
      console.error('Error sending confirmation received notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send confirmation received notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const confirmationNotificationController = new ConfirmationNotificationController();