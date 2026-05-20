"use strict";
// backend/notification-service/src/services/emailService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const templateRenderer_1 = require("../utils/templateRenderer");
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        // Initialize email transporter (using Resend, SendGrid, or SMTP)
        this.transporter = nodemailer_1.default.createTransport({
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
    async sendVerificationEmail(params) {
        const { email, userName, otpCode, verificationUrl, locale } = params;
        const subjects = {
            en: 'Verify Your Email - Newcondo',
            fr: 'Vérifiez votre email - Newcondo',
            pcm: 'Verify Your Email - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('verification', locale, {
            userName,
            otpCode,
            verificationUrl,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send payment confirmation email
     */
    async sendPaymentConfirmation(params) {
        const { email, userName, amount, propertyTitle, propertyAddress, paymentDate, transactionId, locale } = params;
        const subjects = {
            en: 'Payment Confirmation - Newcondo',
            fr: 'Confirmation de paiement - Newcondo',
            pcm: 'Payment Confirm - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('payment-confirmation', locale, {
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
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send marking assignment notification
     */
    async sendMarkingAssignment(params) {
        const { email, agentName, propertyAddress, contactPerson, contactPhone, deadline, jobId, locale } = params;
        const subjects = {
            en: 'New Marking Job Assignment - Newcondo',
            fr: 'Nouvelle mission de marquage - Newcondo',
            pcm: 'New Marking Job - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('marking-assignment', locale, {
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
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send property approval notification
     */
    async sendPropertyApproved(params) {
        const { email, ownerName, propertyTitle, propertyId, approvalDate, locale } = params;
        const subjects = {
            en: 'Property Approved - Newcondo',
            fr: 'Propriété approuvée - Newcondo',
            pcm: 'Property Don Approve - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('property-approved', locale, {
            ownerName,
            propertyTitle,
            approvalDate,
            propertyUrl: `${process.env.WEBSITE_URL}/properties/${propertyId}`,
            dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send property rejection notification
     */
    async sendPropertyRejected(params) {
        const { email, ownerName, propertyTitle, rejectionReason, locale } = params;
        const subjects = {
            en: 'Property Listing Update - Newcondo',
            fr: 'Mise à jour de la propriété - Newcondo',
            pcm: 'Property Update - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('property-rejected', locale, {
            ownerName,
            propertyTitle,
            rejectionReason,
            dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send rental confirmation reminder
     */
    async sendRentalConfirmationReminder(params) {
        const { email, renterName, propertyTitle, confirmationDeadline, rentalId, locale } = params;
        const subjects = {
            en: 'Confirm Your Rental - Newcondo',
            fr: 'Confirmez votre location - Newcondo',
            pcm: 'Confirm Your Rent - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('rental-confirmation-reminder', locale, {
            renterName,
            propertyTitle,
            confirmationDeadline,
            confirmUrl: `${process.env.WEBSITE_URL}/rentals/${rentalId}/confirm`,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send funds released notification (to owner/agent)
     */
    async sendFundsReleased(params) {
        const { email, recipientName, amount, propertyTitle, locale } = params;
        const subjects = {
            en: 'Funds Released - Newcondo',
            fr: 'Fonds libérés - Newcondo',
            pcm: 'Money Don Release - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('funds-released', locale, {
            recipientName,
            amount,
            propertyTitle,
            dashboardUrl: `${process.env.WEBSITE_URL}/dashboard`,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Send password reset email
     */
    async sendPasswordReset(params) {
        const { email, userName, resetToken, locale } = params;
        const subjects = {
            en: 'Reset Your Password - Newcondo',
            fr: 'Réinitialisez votre mot de passe - Newcondo',
            pcm: 'Reset Your Password - Newcondo'
        };
        const html = await templateRenderer_1.templateRenderer.renderEmailTemplate('password-reset', locale, {
            userName,
            resetUrl: `${process.env.WEBSITE_URL}/reset-password?token=${resetToken}`,
            websiteUrl: process.env.WEBSITE_URL || 'https://newcondo.com'
        });
        return this.sendEmail({
            to: email,
            subject: subjects[locale] || subjects.en,
            html,
            locale
        });
    }
    /**
     * Core email sending method
     */
    async sendEmail(params) {
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
        }
        catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    /**
     * Send bulk emails
     */
    async sendBulkEmails(emails) {
        const results = await Promise.allSettled(emails.map(email => this.sendEmail(email)));
        return {
            sent: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            total: results.length
        };
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map