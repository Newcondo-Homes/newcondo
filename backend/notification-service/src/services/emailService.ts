// backend/notification-service/src/services/emailService.ts

import { templateRenderer } from '../utils/templateRenderer';
import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  locale: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter (using Resend, SendGrid, or SMTP)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(params: {
    email: string;
    userName: string;
    otpCode: string;
    verificationUrl: string;
    locale: string;
  }) {
    const { email, userName, otpCode, verificationUrl, locale } = params;

    const subjects = {
      en: 'Verify Your Email - Newcondo',
      fr: 'Vérifiez votre email - Newcondo',
      pcm: 'Verify Your Email - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('verification', locale, {
      userName,
      otpCode,
      verificationUrl,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(params: {
    email: string;
    userName: string;
    amount: string;
    propertyTitle: string;
    propertyAddress: string;
    paymentDate: string;
    transactionId: string;
    locale: string;
  }) {
    const { email, userName, amount, propertyTitle, propertyAddress, paymentDate, transactionId, locale } = params;

    const subjects = {
      en: 'Payment Confirmation - Newcondo',
      fr: 'Confirmation de paiement - Newcondo',
      pcm: 'Payment Confirm - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('payment-confirmation', locale, {
      userName,
      amount,
      propertyTitle,
      propertyAddress,
      paymentDate,
      transactionId,
      confirmUrl: `${process.env.WEBSITE_URL}/payments/${transactionId}`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send marking assignment notification
   */
  async sendMarkingAssignment(params: {
    email: string;
    agentName: string;
    propertyAddress: string;
    contactPerson: string;
    contactPhone: string;
    deadline: string;
    jobId: string;
    locale: string;
  }) {
    const { email, agentName, propertyAddress, contactPerson, contactPhone, deadline, jobId, locale } = params;

    const subjects = {
      en: 'New Marking Job Assignment - Newcondo',
      fr: 'Nouvelle mission de marquage - Newcondo',
      pcm: 'New Marking Job - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('marking-assignment', locale, {
      agentName,
      propertyAddress,
      contactPerson,
      contactPhone,
      deadline,
      jobUrl: `${process.env.WEBSITE_URL}/marking-jobs/${jobId}`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send property approval notification
   */
  async sendPropertyApproved(params: {
    email: string;
    ownerName: string;
    propertyTitle: string;
    propertyId: string;
    approvalDate: string;
    locale: string;
  }) {
    const { email, ownerName, propertyTitle, propertyId, approvalDate, locale } = params;

    const subjects = {
      en: 'Property Approved - Newcondo',
      fr: 'Propriété approuvée - Newcondo',
      pcm: 'Property Don Approve - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('property-approved', locale, {
      ownerName,
      propertyTitle,
      approvalDate,
      propertyUrl: `${process.env.WEBSITE_URL}/properties/${propertyId}`,
      dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send property rejection notification
   */
  async sendPropertyRejected(params: {
    email: string;
    ownerName: string;
    propertyTitle: string;
    rejectionReason: string;
    locale: string;
  }) {
    const { email, ownerName, propertyTitle, rejectionReason, locale } = params;

    const subjects = {
      en: 'Property Listing Update - Newcondo',
      fr: 'Mise à jour de la propriété - Newcondo',
      pcm: 'Property Update - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('property-rejected', locale, {
      ownerName,
      propertyTitle,
      rejectionReason,
      dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send rental confirmation reminder
   */
  async sendRentalConfirmationReminder(params: {
    email: string;
    renterName: string;
    propertyTitle: string;
    confirmationDeadline: string;
    rentalId: string;
    locale: string;
  }) {
    const { email, renterName, propertyTitle, confirmationDeadline, rentalId, locale } = params;

    const subjects = {
      en: 'Confirm Your Rental - Newcondo',
      fr: 'Confirmez votre location - Newcondo',
      pcm: 'Confirm Your Rent - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('rental-confirmation-reminder', locale, {
      renterName,
      propertyTitle,
      confirmationDeadline,
      confirmUrl: `${process.env.WEBSITE_URL}/rentals/${rentalId}/confirm`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send funds released notification (to owner/agent)
   */
  async sendFundsReleased(params: {
    email: string;
    recipientName: string;
    amount: string;
    propertyTitle: string;
    locale: string;
  }) {
    const { email, recipientName, amount, propertyTitle, locale } = params;

    const subjects = {
      en: 'Funds Released - Newcondo',
      fr: 'Fonds libérés - Newcondo',
      pcm: 'Money Don Release - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('funds-released', locale, {
      recipientName,
      amount,
      propertyTitle,
      dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(params: {
    email: string;
    userName: string;
    resetToken: string;
    locale: string;
  }) {
    const { email, userName, resetToken, locale } = params;

    const subjects = {
      en: 'Reset Your Password - Newcondo',
      fr: 'Réinitialisez votre mot de passe - Newcondo',
      pcm: 'Reset Your Password - Newcondo'
    };

    const html = await templateRenderer.renderEmailTemplate('password-reset', locale, {
      userName,
      resetUrl: `${process.env.WEBSITE_URL}/reset-password?token=${resetToken}`,
      websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
    });

    return this.sendEmail({
      to: email,
      subject: subjects[locale as keyof typeof subjects] || subjects.en,
      html,
      locale
    });
  }

  /**
   * Core email sending method
   */
  private async sendEmail(params: EmailParams) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Newcondo <noreply@newcondo.com>',
        to: params.to,
        subject: params.subject,
        html: params.html
      });

      console.log(`Email sent to ${params.to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailParams[]) {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );

    return {
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      total: results.length
    };
  }
}

export const emailService = new EmailService();