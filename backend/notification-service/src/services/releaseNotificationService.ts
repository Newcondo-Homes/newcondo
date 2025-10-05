import { db } from '@newcondo/db';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';

interface PaymentReleaseData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'NEWCONDO';
  propertyTitle: string;
  unitNumber?: string;
  commission?: {
    totalCommission: number;
    agentShare: number;
    platformShare: number;
    subAgentShare?: number;
  };
  virtualAccountNumber: string;
  releasedAt: Date;
}

interface BulkReleaseData {
  rentalId: string;
  propertyTitle: string;
  unitNumber?: string;
  totalAmount: number;
  releases: PaymentReleaseData[];
}

class ReleaseNotificationService {
  /**
   * Send notification when payment is released to a single recipient
   */
  async notifyPaymentRelease(data: PaymentReleaseData): Promise<void> {
    try {
      const user = await db.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true
        }
      });

      if (!user) {
        throw new Error(`User not found: ${data.userId}`);
      }

      const formattedAmount = this.formatCurrency(data.amount, data.currency);
      const notificationData = {
        userName: user.name || 'User',
        amount: formattedAmount,
        recipientType: data.recipientType,
        propertyTitle: data.propertyTitle,
        unitNumber: data.unitNumber,
        virtualAccountNumber: data.virtualAccountNumber,
        releasedAt: data.releasedAt.toLocaleString(),
        commission: data.commission
      };

      // Send email notification
      if (user.email) {
        await this.sendEmailNotification(user.email, notificationData);
      }

      // Send SMS notification
      if (user.phone) {
        await this.sendSMSNotification(user.phone, notificationData);
      }

      // Send push notification (if user has device tokens)
      await this.sendPushNotification(user.id, notificationData);

      console.log(`Payment release notification sent to user ${user.id}`);
    } catch (error) {
      console.error('Error sending payment release notification:', error);
      throw error;
    }
  }

  /**
   * Send notifications for bulk payment releases (all parties involved in a rental)
   */
  async notifyBulkRelease(data: BulkReleaseData): Promise<void> {
    try {
      const notificationPromises = data.releases.map(release =>
        this.notifyPaymentRelease(release)
      );

      await Promise.allSettled(notificationPromises);

      console.log(`Bulk release notifications sent for rental ${data.rentalId}`);
    } catch (error) {
      console.error('Error sending bulk release notifications:', error);
      throw error;
    }
  }

  /**
   * Notify property owner about payment release
   */
  async notifyOwnerRelease(
    ownerId: string,
    amount: number,
    propertyTitle: string,
    unitNumber?: string
  ): Promise<void> {
    const releaseData: Partial<PaymentReleaseData> = {
      userId: ownerId,
      amount,
      recipientType: 'OWNER',
      propertyTitle,
      unitNumber,
      currency: 'NGN',
      releasedAt: new Date()
    };

    await this.notifyPaymentRelease(releaseData as PaymentReleaseData);
  }

  /**
   * Notify listing agent about commission release
   */
  async notifyListingAgentRelease(
    agentId: string,
    commission: number,
    totalCommission: number,
    propertyTitle: string,
    unitNumber?: string
  ): Promise<void> {
    const releaseData: Partial<PaymentReleaseData> = {
      userId: agentId,
      amount: commission,
      recipientType: 'LISTING_AGENT',
      propertyTitle,
      unitNumber,
      currency: 'NGN',
      commission: {
        totalCommission,
        agentShare: commission,
        platformShare: totalCommission - commission
      },
      releasedAt: new Date()
    };

    await this.notifyPaymentRelease(releaseData as PaymentReleaseData);
  }

  /**
   * Notify sub-agent about commission release
   */
  async notifySubAgentRelease(
    subAgentId: string,
    commission: number,
    totalCommission: number,
    propertyTitle: string,
    unitNumber?: string
  ): Promise<void> {
    const releaseData: Partial<PaymentReleaseData> = {
      userId: subAgentId,
      amount: commission,
      recipientType: 'SUB_AGENT',
      propertyTitle,
      unitNumber,
      currency: 'NGN',
      commission: {
        totalCommission,
        agentShare: commission,
        platformShare: totalCommission - commission,
        subAgentShare: commission
      },
      releasedAt: new Date()
    };

    await this.notifyPaymentRelease(releaseData as PaymentReleaseData);
  }

  /**
   * Notify Newcondo (admin) about platform fee release
   */
  async notifyPlatformFeeRelease(
    amount: number,
    propertyTitle: string,
    rentalId: string
  ): Promise<void> {
    try {
      // Get admin users
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      });

      const notificationData = {
        amount: this.formatCurrency(amount, 'NGN'),
        propertyTitle,
        rentalId,
        releasedAt: new Date().toLocaleString()
      };

      // Send notifications to all admins
      const notificationPromises = admins.map(async admin => {
        if (admin.email) {
          await this.sendAdminEmailNotification(admin.email, notificationData);
        }
      });

      await Promise.allSettled(notificationPromises);

      console.log(`Platform fee release notification sent for rental ${rentalId}`);
    } catch (error) {
      console.error('Error sending platform fee release notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification for payment release
   */
  private async sendEmailNotification(
    email: string,
    data: any
  ): Promise<void> {
    const subject = 'Payment Released - Funds Available for Withdrawal';
    
    let emailBody = `
      <h2>Payment Released</h2>
      <p>Dear ${data.userName},</p>
      <p>Great news! Your payment has been released and is now available for withdrawal.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
        <h3>Release Details:</h3>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Property:</strong> ${data.propertyTitle}</p>
        ${data.unitNumber ? `<p><strong>Unit:</strong> ${data.unitNumber}</p>` : ''}
        ${data.virtualAccountNumber ? `<p><strong>Virtual Account:</strong> ${data.virtualAccountNumber}</p>` : ''}
        <p><strong>Released At:</strong> ${data.releasedAt}</p>
      </div>
    `;

    // Add commission details if applicable
    if (data.commission) {
      emailBody += `
        <div style="background-color: #e8f5e9; padding: 15px; margin: 20px 0;">
          <h3>Commission Breakdown:</h3>
          <p><strong>Total Commission:</strong> ${this.formatCurrency(data.commission.totalCommission, 'NGN')}</p>
          <p><strong>Your Share:</strong> ${this.formatCurrency(data.commission.agentShare, 'NGN')}</p>
          ${data.commission.subAgentShare ? `<p><strong>Sub-Agent Share:</strong> ${this.formatCurrency(data.commission.subAgentShare, 'NGN')}</p>` : ''}
        </div>
      `;
    }

    emailBody += `
      <p>The confirmation period has passed successfully, and the funds are now available in your virtual account.</p>
      <p>You can withdraw these funds to your registered bank account from your dashboard.</p>
      
      <div style="margin-top: 30px;">
        <a href="${process.env.PLATFORM_URL}/dashboard/payments" 
           style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Payment Details
        </a>
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        If you have any questions, please contact our support team.
      </p>
    `;

    await emailService.sendEmail({
      to: email,
      subject,
      html: emailBody
    });
  }

  /**
   * Send SMS notification for payment release
   */
  private async sendSMSNotification(phone: string, data: any): Promise<void> {
    let message = `Payment Released: ${data.amount} for ${data.propertyTitle}`;
    
    if (data.unitNumber) {
      message += ` (${data.unitNumber})`;
    }
    
    message += ` is now available for withdrawal. Log in to your dashboard to withdraw funds.`;

    await smsService.sendSMS({
      to: phone,
      message
    });
  }

  /**
   * Send push notification for payment release
   */
  private async sendPushNotification(userId: string, data: any): Promise<void> {
    const title = 'Payment Released';
    let body = `${data.amount} for ${data.propertyTitle}`;
    
    if (data.unitNumber) {
      body += ` (${data.unitNumber})`;
    }
    
    body += ' is now available for withdrawal.';

    await pushService.sendPushNotification({
      userId,
      title,
      body,
      data: {
        type: 'PAYMENT_RELEASED',
        recipientType: data.recipientType,
        amount: data.amount
      }
    });
  }

  /**
   * Send email notification to admin for platform fee release
   */
  private async sendAdminEmailNotification(
    email: string,
    data: any
  ): Promise<void> {
    const subject = 'Platform Fee Released';
    
    const emailBody = `
      <h2>Platform Fee Released</h2>
      <p>A platform fee has been released to Newcondo's virtual account.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
        <h3>Release Details:</h3>
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Property:</strong> ${data.propertyTitle}</p>
        <p><strong>Rental ID:</strong> ${data.rentalId}</p>
        <p><strong>Released At:</strong> ${data.releasedAt}</p>
      </div>
      
      <p>The confirmation period has passed, and the platform fee has been credited to the Newcondo virtual account.</p>
      
      <div style="margin-top: 30px;">
        <a href="${process.env.ADMIN_URL}/dashboard/payments" 
           style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Admin Dashboard
        </a>
      </div>
    `;

    await emailService.sendEmail({
      to: email,
      subject,
      html: emailBody
    });
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

export const releaseNotificationService = new ReleaseNotificationService();