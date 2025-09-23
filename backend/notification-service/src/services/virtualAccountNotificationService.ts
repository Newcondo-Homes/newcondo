import { emailService } from './emailService';
import { smsService } from './smsService';
import { templateService } from './templateService';
import { PrismaClient } from '@newcondo/db';
import { logger } from '../../../shared/src/utils/logger';

interface VirtualAccountCreatedData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  propertyId?: string;
  propertyTitle?: string;
}

interface VirtualAccountFundedData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  currency: string;
  transactionReference?: string;
  balance: number;
  propertyTitle?: string;
}

interface VirtualAccountDebitedData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  currency: string;
  transactionReference?: string;
  balance: number;
  propertyTitle?: string;
  reason: string;
}

interface VirtualAccountStatementData {
  userId: string;
  userName: string;
  userEmail: string;
  accountNumber: string;
  accountName: string;
  statementPeriod: string;
  statementUrl?: string;
  propertyTitle?: string;
}

interface VirtualAccountSuspendedData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
  reason: string;
  suspendedUntil?: Date;
}

interface VirtualAccountReactivatedData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
}

interface LowBalanceAlertData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  threshold: number;
  propertyTitle?: string;
}

interface ReconciliationAlertData {
  userId: string;
  userName: string;
  userEmail: string;
  accountNumber: string;
  accountName: string;
  discrepancyAmount: number;
  currency: string;
  propertyTitle?: string;
}

class VirtualAccountNotificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Send notification when a virtual account is created
   */
  async notifyAccountCreated(data: VirtualAccountCreatedData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-created', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        bankCode: data.bankCode,
        propertyTitle: data.propertyTitle,
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: 'Virtual Account Created Successfully',
        html: emailTemplate,
        category: 'virtual-account',
      });

      // Send SMS if phone number is available
      if (data.userPhone) {
        const smsMessage = `Hi ${data.userName}, your virtual account ${data.accountNumber} has been created successfully for ${data.propertyTitle || 'your property'}. You can now receive payments directly to this account.`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account',
        });
      }

      logger.info('Virtual account creation notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
      });
    } catch (error) {
      logger.error('Failed to send virtual account creation notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notification when funds are credited to virtual account
   */
  async notifyAccountFunded(data: VirtualAccountFundedData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-funded', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        amount: data.amount.toLocaleString(),
        currency: data.currency,
        transactionReference: data.transactionReference,
        balance: data.balance.toLocaleString(),
        propertyTitle: data.propertyTitle,
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: `Account Credit Alert - ${data.currency} ${data.amount.toLocaleString()}`,
        html: emailTemplate,
        category: 'virtual-account-credit',
      });

      // Send SMS notification
      if (data.userPhone) {
        const smsMessage = `Credit Alert: ${data.currency} ${data.amount.toLocaleString()} credited to your virtual account ${data.accountNumber}. Balance: ${data.currency} ${data.balance.toLocaleString()}${data.transactionReference ? `. Ref: ${data.transactionReference}` : ''}`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account-credit',
        });
      }

      logger.info('Virtual account funded notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        amount: data.amount,
      });
    } catch (error) {
      logger.error('Failed to send virtual account funded notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notification when funds are debited from virtual account
   */
  async notifyAccountDebited(data: VirtualAccountDebitedData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-debited', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        amount: data.amount.toLocaleString(),
        currency: data.currency,
        transactionReference: data.transactionReference,
        balance: data.balance.toLocaleString(),
        reason: data.reason,
        propertyTitle: data.propertyTitle,
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: `Account Debit Alert - ${data.currency} ${data.amount.toLocaleString()}`,
        html: emailTemplate,
        category: 'virtual-account-debit',
      });

      // Send SMS notification
      if (data.userPhone) {
        const smsMessage = `Debit Alert: ${data.currency} ${data.amount.toLocaleString()} debited from your virtual account ${data.accountNumber} for ${data.reason}. Balance: ${data.currency} ${data.balance.toLocaleString()}${data.transactionReference ? `. Ref: ${data.transactionReference}` : ''}`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account-debit',
        });
      }

      logger.info('Virtual account debited notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        amount: data.amount,
      });
    } catch (error) {
      logger.error('Failed to send virtual account debited notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send virtual account statement notification
   */
  async notifyStatementGenerated(data: VirtualAccountStatementData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-statement', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        statementPeriod: data.statementPeriod,
        statementUrl: data.statementUrl,
        propertyTitle: data.propertyTitle,
      });

      // Send email notification with statement attachment/link
      await emailService.sendEmail({
        to: data.userEmail,
        subject: `Virtual Account Statement - ${data.statementPeriod}`,
        html: emailTemplate,
        category: 'virtual-account-statement',
        attachments: data.statementUrl ? [
          {
            filename: `statement-${data.accountNumber}-${data.statementPeriod}.pdf`,
            path: data.statementUrl,
          }
        ] : undefined,
      });

      logger.info('Virtual account statement notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        statementPeriod: data.statementPeriod,
      });
    } catch (error) {
      logger.error('Failed to send virtual account statement notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notification when virtual account is suspended
   */
  async notifyAccountSuspended(data: VirtualAccountSuspendedData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-suspended', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        reason: data.reason,
        suspendedUntil: data.suspendedUntil?.toLocaleDateString(),
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: 'Virtual Account Suspended - Action Required',
        html: emailTemplate,
        category: 'virtual-account-suspension',
      });

      // Send SMS notification
      if (data.userPhone) {
        const smsMessage = `IMPORTANT: Your virtual account ${data.accountNumber} has been suspended due to ${data.reason}. Please contact support immediately.`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account-suspension',
        });
      }

      logger.info('Virtual account suspension notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        reason: data.reason,
      });
    } catch (error) {
      logger.error('Failed to send virtual account suspension notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send notification when virtual account is reactivated
   */
  async notifyAccountReactivated(data: VirtualAccountReactivatedData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-reactivated', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: 'Virtual Account Reactivated',
        html: emailTemplate,
        category: 'virtual-account-reactivation',
      });

      // Send SMS notification
      if (data.userPhone) {
        const smsMessage = `Good news! Your virtual account ${data.accountNumber} has been reactivated and is now ready to receive payments.`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account-reactivation',
        });
      }

      logger.info('Virtual account reactivation notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
      });
    } catch (error) {
      logger.error('Failed to send virtual account reactivation notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send low balance alert notification
   */
  async notifyLowBalance(data: LowBalanceAlertData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-low-balance', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        balance: data.balance.toLocaleString(),
        currency: data.currency,
        threshold: data.threshold.toLocaleString(),
        propertyTitle: data.propertyTitle,
      });

      // Send email notification
      await emailService.sendEmail({
        to: data.userEmail,
        subject: `Low Balance Alert - ${data.accountName}`,
        html: emailTemplate,
        category: 'virtual-account-low-balance',
      });

      // Send SMS notification
      if (data.userPhone) {
        const smsMessage = `Low Balance Alert: Your virtual account ${data.accountNumber} balance is ${data.currency} ${data.balance.toLocaleString()}, which is below the threshold of ${data.currency} ${data.threshold.toLocaleString()}.`;
        
        await smsService.sendSMS({
          to: data.userPhone,
          message: smsMessage,
          category: 'virtual-account-low-balance',
        });
      }

      logger.info('Virtual account low balance notification sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        balance: data.balance,
        threshold: data.threshold,
      });
    } catch (error) {
      logger.error('Failed to send virtual account low balance notification', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send reconciliation discrepancy alert
   */
  async notifyReconciliationAlert(data: ReconciliationAlertData): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-reconciliation-alert', {
        userName: data.userName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        discrepancyAmount: Math.abs(data.discrepancyAmount).toLocaleString(),
        currency: data.currency,
        discrepancyType: data.discrepancyAmount > 0 ? 'excess' : 'shortfall',
        propertyTitle: data.propertyTitle,
      });

      // Send email notification (reconciliation alerts usually go to admins too)
      await emailService.sendEmail({
        to: data.userEmail,
        subject: `Account Reconciliation Alert - ${data.accountName}`,
        html: emailTemplate,
        category: 'virtual-account-reconciliation',
      });

      // Also notify platform admins
      await this.notifyAdminsReconciliationAlert(data);

      logger.info('Virtual account reconciliation alert sent', {
        userId: data.userId,
        accountNumber: data.accountNumber,
        discrepancyAmount: data.discrepancyAmount,
      });
    } catch (error) {
      logger.error('Failed to send virtual account reconciliation alert', {
        userId: data.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Notify admins about reconciliation discrepancies
   */
  private async notifyAdminsReconciliationAlert(data: ReconciliationAlertData): Promise<void> {
    try {
      // Get admin users
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
        },
        select: {
          email: true,
          name: true,
        },
      });

      const adminEmailTemplate = await templateService.getTemplate('admin-reconciliation-alert', {
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        userName: data.userName,
        discrepancyAmount: Math.abs(data.discrepancyAmount).toLocaleString(),
        currency: data.currency,
        discrepancyType: data.discrepancyAmount > 0 ? 'excess' : 'shortfall',
        propertyTitle: data.propertyTitle,
      });

      // Send to all admin users
      for (const admin of adminUsers) {
        await emailService.sendEmail({
          to: admin.email,
          subject: `[ADMIN] Virtual Account Reconciliation Alert - ${data.accountNumber}`,
          html: adminEmailTemplate,
          category: 'admin-reconciliation-alert',
        });
      }

      logger.info('Admin reconciliation alert sent', {
        accountNumber: data.accountNumber,
        adminCount: adminUsers.length,
      });
    } catch (error) {
      logger.error('Failed to send admin reconciliation alert', {
        accountNumber: data.accountNumber,
        error: error.message,
      });
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkVirtualAccountNotification(
    users: Array<{
      userId: string;
      email: string;
      phone?: string;
      name: string;
    }>,
    templateType: string,
    templateData: Record<string, any>,
    subject: string
  ): Promise<void> {
    try {
      const promises = users.map(async (user) => {
        const personalizedTemplateData = {
          ...templateData,
          userName: user.name,
        };

        const emailTemplate = await templateService.getTemplate(templateType, personalizedTemplateData);

        return emailService.sendEmail({
          to: user.email,
          subject: subject,
          html: emailTemplate,
          category: 'virtual-account-bulk',
        });
      });

      await Promise.allSettled(promises);

      logger.info('Bulk virtual account notification sent', {
        templateType,
        userCount: users.length,
      });
    } catch (error) {
      logger.error('Failed to send bulk virtual account notification', {
        templateType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send automated monthly account summary
   */
  async sendMonthlyAccountSummary(
    accountData: {
      userId: string;
      userName: string;
      userEmail: string;
      accountNumber: string;
      accountName: string;
      openingBalance: number;
      closingBalance: number;
      totalCredits: number;
      totalDebits: number;
      transactionCount: number;
      currency: string;
      month: string;
      year: string;
      propertyTitle?: string;
    }
  ): Promise<void> {
    try {
      const emailTemplate = await templateService.getTemplate('virtual-account-monthly-summary', {
        userName: accountData.userName,
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName,
        openingBalance: accountData.openingBalance.toLocaleString(),
        closingBalance: accountData.closingBalance.toLocaleString(),
        totalCredits: accountData.totalCredits.toLocaleString(),
        totalDebits: accountData.totalDebits.toLocaleString(),
        transactionCount: accountData.transactionCount,
        currency: accountData.currency,
        month: accountData.month,
        year: accountData.year,
        propertyTitle: accountData.propertyTitle,
      });

      await emailService.sendEmail({
        to: accountData.userEmail,
        subject: `Monthly Account Summary - ${accountData.month} ${accountData.year}`,
        html: emailTemplate,
        category: 'virtual-account-summary',
      });

      logger.info('Monthly account summary sent', {
        userId: accountData.userId,
        accountNumber: accountData.accountNumber,
        month: accountData.month,
        year: accountData.year,
      });
    } catch (error) {
      logger.error('Failed to send monthly account summary', {
        userId: accountData.userId,
        error: error.message,
      });
      throw error;
    }
  }
}

export const virtualAccountNotificationService = new VirtualAccountNotificationService();