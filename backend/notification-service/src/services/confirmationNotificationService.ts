import { prisma } from '@newcondo/db';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';

interface BulkReminderResult {
  sent: number;
  failed: number;
  results: Array<{
    rentalId: string;
    success: boolean;
    error?: string;
  }>;
}

export class ConfirmationNotificationService {
  /**
   * Send confirmation reminder to a renter
   */
  async sendConfirmationReminder(
    rentalId: string,
    renterId: string,
    propertyTitle: string,
    confirmationDeadline: Date,
    amount: number
  ): Promise<void> {
    try {
      // Fetch renter details
      const renter = await prisma.user.findUnique({
        where: { id: renterId },
        select: {
          email: true,
          phone: true,
          name: true,
        },
      });

      if (!renter) {
        throw new Error(`Renter not found: ${renterId}`);
      }

      const hoursRemaining = Math.floor(
        (confirmationDeadline.getTime() - Date.now()) / (1000 * 60 * 60)
      );

      // Prepare notification content
      const subject = 'Property Confirmation Reminder - Action Required';
      const emailContent = this.generateConfirmationReminderEmail(
        renter.name || 'Valued Customer',
        propertyTitle,
        confirmationDeadline,
        hoursRemaining,
        amount,
        rentalId
      );

      const smsContent = this.generateConfirmationReminderSMS(
        propertyTitle,
        hoursRemaining
      );

      // Send notifications via multiple channels
      const notifications = [];

      if (renter.email) {
        notifications.push(
          emailService.sendEmail({
            to: renter.email,
            subject,
            html: emailContent,
          })
        );
      }

      if (renter.phone) {
        notifications.push(
          smsService.sendSMS({
            to: renter.phone,
            message: smsContent,
          })
        );
      }

      // Send push notification
      notifications.push(
        pushService.sendPushNotification({
          userId: renterId,
          title: 'Property Confirmation Reminder',
          body: `Please confirm your rental for ${propertyTitle}. ${hoursRemaining} hours remaining.`,
          data: {
            type: 'CONFIRMATION_REMINDER',
            rentalId,
          },
        })
      );

      await Promise.allSettled(notifications);

      console.log(`Confirmation reminder sent for rental: ${rentalId}`);
    } catch (error) {
      console.error('Error sending confirmation reminder:', error);
      throw error;
    }
  }

  /**
   * Send bulk confirmation reminders to renters approaching deadline
   */
  async sendBulkConfirmationReminders(
    hoursBeforeDeadline: number = 24
  ): Promise<BulkReminderResult> {
    const result: BulkReminderResult = {
      sent: 0,
      failed: 0,
      results: [],
    };

    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() + hoursBeforeDeadline);

      // Find rentals needing confirmation reminders
      const pendingRentals = await prisma.rental.findMany({
        where: {
          status: 'PENDING_CONFIRMATION',
          isConfirmed: false,
          confirmationDeadline: {
            lte: cutoffTime,
            gt: new Date(), // Not yet expired
          },
        },
        include: {
          property: {
            select: {
              title: true,
            },
          },
          unit: {
            select: {
              unitNumber: true,
            },
          },
          renter: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
            },
          },
          payments: {
            where: {
              status: 'HELD',
            },
            select: {
              amount: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      console.log(`Found ${pendingRentals.length} rentals needing reminders`);

      // Send reminders in batches
      for (const rental of pendingRentals) {
        try {
          const propertyTitle = rental.unit
            ? `${rental.property.title} - Unit ${rental.unit.unitNumber}`
            : rental.property.title;

          const amount = rental.payments[0]?.amount || rental.monthlyRent;

          await this.sendConfirmationReminder(
            rental.id,
            rental.renter.id,
            propertyTitle,
            rental.confirmationDeadline!,
            Number(amount)
          );

          result.sent++;
          result.results.push({
            rentalId: rental.id,
            success: true,
          });
        } catch (error) {
          result.failed++;
          result.results.push({
            rentalId: rental.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(
        `Bulk reminders completed: ${result.sent} sent, ${result.failed} failed`
      );
      return result;
    } catch (error) {
      console.error('Error in bulk confirmation reminders:', error);
      throw error;
    }
  }

  /**
   * Send deadline expiry warning (final warning before auto-refund)
   */
  async sendDeadlineExpiryWarning(
    rentalId: string,
    renterId: string,
    propertyTitle: string,
    hoursRemaining: number
  ): Promise<void> {
    try {
      const renter = await prisma.user.findUnique({
        where: { id: renterId },
        select: {
          email: true,
          phone: true,
          name: true,
        },
      });

      if (!renter) {
        throw new Error(`Renter not found: ${renterId}`);
      }

      const subject = '⚠️ URGENT: Property Confirmation Deadline Expiring Soon';
      const emailContent = this.generateDeadlineExpiryWarningEmail(
        renter.name || 'Valued Customer',
        propertyTitle,
        hoursRemaining,
        rentalId
      );

      const smsContent = `URGENT: Your confirmation deadline for ${propertyTitle} expires in ${hoursRemaining} hours. Confirm now to avoid automatic refund. Visit your dashboard.`;

      // Send urgent notifications
      const notifications = [];

      if (renter.email) {
        notifications.push(
          emailService.sendEmail({
            to: renter.email,
            subject,
            html: emailContent,
            priority: 'high',
          })
        );
      }

      if (renter.phone) {
        notifications.push(
          smsService.sendSMS({
            to: renter.phone,
            message: smsContent,
          })
        );
      }

      notifications.push(
        pushService.sendPushNotification({
          userId: renterId,
          title: 'URGENT: Confirmation Deadline Expiring',
          body: `${hoursRemaining} hours left to confirm ${propertyTitle}`,
          data: {
            type: 'DEADLINE_EXPIRY_WARNING',
            rentalId,
            priority: 'urgent',
          },
        })
      );

      await Promise.allSettled(notifications);

      console.log(`Deadline expiry warning sent for rental: ${rentalId}`);
    } catch (error) {
      console.error('Error sending deadline expiry warning:', error);
      throw error;
    }
  }

  /**
   * Send confirmation received notification (success message)
   */
  async sendConfirmationReceivedNotification(
    rentalId: string,
    renterId: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      const renter = await prisma.user.findUnique({
        where: { id: renterId },
        select: {
          email: true,
          phone: true,
          name: true,
        },
      });

      if (!renter) {
        throw new Error(`Renter not found: ${renterId}`);
      }

      const subject = '✅ Property Confirmation Received';
      const emailContent = this.generateConfirmationReceivedEmail(
        renter.name || 'Valued Customer',
        propertyTitle,
        rentalId
      );

      const smsContent = `Your confirmation for ${propertyTitle} has been received. Payment will be released to property owner shortly.`;

      const notifications = [];

      if (renter.email) {
        notifications.push(
          emailService.sendEmail({
            to: renter.email,
            subject,
            html: emailContent,
          })
        );
      }

      if (renter.phone) {
        notifications.push(
          smsService.sendSMS({
            to: renter.phone,
            message: smsContent,
          })
        );
      }

      notifications.push(
        pushService.sendPushNotification({
          userId: renterId,
          title: 'Confirmation Received',
          body: `Thank you for confirming ${propertyTitle}`,
          data: {
            type: 'CONFIRMATION_RECEIVED',
            rentalId,
          },
        })
      );

      await Promise.allSettled(notifications);

      console.log(`Confirmation received notification sent for rental: ${rentalId}`);
    } catch (error) {
      console.error('Error sending confirmation received notification:', error);
      throw error;
    }
  }

  /**
   * Generate confirmation reminder email HTML
   */
  private generateConfirmationReminderEmail(
    renterName: string,
    propertyTitle: string,
    deadline: Date,
    hoursRemaining: number,
    amount: number,
    rentalId: string
  ): string {
    const formattedDeadline = deadline.toLocaleString('en-NG', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .alert-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Property Confirmation Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${renterName},</p>
              
              <p>This is a reminder to confirm your property rental payment.</p>
              
              <div class="alert-box">
                <strong>⏰ Time Remaining: ${hoursRemaining} hours</strong>
              </div>
              
              <div class="info-row">
                <span class="label">Property:</span> ${propertyTitle}
              </div>
              <div class="info-row">
                <span class="label">Amount Paid:</span> ₦${amount.toLocaleString()}
              </div>
              <div class="info-row">
                <span class="label">Confirmation Deadline:</span> ${formattedDeadline}
              </div>
              
              <p><strong>What you need to do:</strong></p>
              <ol>
                <li>Visit the property to verify it matches the listing</li>
                <li>Check that all amenities and features are as described</li>
                <li>Confirm the property is available for move-in</li>
                <li>Submit your confirmation through your dashboard</li>
              </ol>
              
              <p><strong>Important:</strong> If you don't confirm within 24 hours, your payment will be automatically refunded (minus service charges).</p>
              
              <div style="text-align: center;">
                <a href="${process.env.PLATFORM_URL}/dashboard/payments/confirm/${rentalId}" class="button">
                  Confirm Property Now
                </a>
              </div>
              
              <p>If you need to request a refund, please do so before the deadline expires.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} NewCondo. All rights reserved.</p>
              <p>If you have any questions, contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate confirmation reminder SMS
   */
  private generateConfirmationReminderSMS(
    propertyTitle: string,
    hoursRemaining: number
  ): string {
    return `NewCondo Reminder: You have ${hoursRemaining} hours to confirm your rental for "${propertyTitle}". Visit your dashboard to confirm or request refund.`;
  }

  /**
   * Generate deadline expiry warning email
   */
  private generateDeadlineExpiryWarningEmail(
    renterName: string,
    propertyTitle: string,
    hoursRemaining: number,
    rentalId: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .urgent-box { background-color: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ URGENT: Confirmation Deadline Expiring</h1>
            </div>
            <div class="content">
              <p>Hello ${renterName},</p>
              
              <div class="urgent-box">
                <h2 style="margin-top: 0; color: #DC2626;">⏰ ${hoursRemaining} HOURS REMAINING</h2>
                <p><strong>Your confirmation deadline for "${propertyTitle}" is about to expire!</strong></p>
              </div>
              
              <p><strong>What happens if you don't confirm:</strong></p>
              <ul>
                <li>Your payment will be automatically refunded</li>
                <li>Service charges will be deducted from the refund</li>
                <li>The property will become available to other renters</li>
                <li>You will need to make a new booking if you still want the property</li>
              </ul>
              
              <p><strong>Action Required Now:</strong></p>
              <ol>
                <li>Visit the property immediately if you haven't already</li>
                <li>Verify all details match the listing</li>
                <li>Submit your confirmation through your dashboard</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="${process.env.PLATFORM_URL}/dashboard/payments/confirm/${rentalId}" class="button">
                  CONFIRM NOW
                </a>
              </div>
              
              <p style="color: #DC2626;"><strong>This is your final warning. Act now to avoid automatic refund!</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} NewCondo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate confirmation received email
   */
  private generateConfirmationReceivedEmail(
    renterName: string,
    propertyTitle: string,
    rentalId: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Confirmation Received</h1>
            </div>
            <div class="content">
              <p>Hello ${renterName},</p>
              
              <div class="success-box">
                <h3 style="margin-top: 0;">Thank you for confirming your rental!</h3>
                <p><strong>Property:</strong> ${propertyTitle}</p>
              </div>
              
              <p>Your confirmation has been successfully recorded. Here's what happens next:</p>
              
              <ol>
                <li><strong>Payment Release:</strong> Your payment will be released to the property owner/agent within 24 hours</li>
                <li><strong>Commission Distribution:</strong> Platform fees and commissions will be automatically distributed</li>
                <li><strong>Rental Agreement:</strong> Your rental period is now officially active</li>
                <li><strong>Support:</strong> Our team is available if you need any assistance</li>
              </ol>
              
              <p>You can view your rental details anytime in your dashboard.</p>
              
              <p><strong>Need Help?</strong></p>
              <p>Contact us anytime if you have questions or concerns about your rental.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} NewCondo. All rights reserved.</p>
              <p>Thank you for choosing NewCondo!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const confirmationNotificationService = new ConfirmationNotificationService();