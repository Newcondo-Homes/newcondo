interface EmailParams {
    to: string;
    subject: string;
    html: string;
    locale: string;
}
export declare class EmailService {
    private transporter;
    constructor();
    /**
     * Send email verification
     */
    sendVerificationEmail(params: {
        email: string;
        userName: string;
        otpCode: string;
        verificationUrl: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send payment confirmation email
     */
    sendPaymentConfirmation(params: {
        email: string;
        userName: string;
        amount: string;
        propertyTitle: string;
        propertyAddress: string;
        paymentDate: string;
        transactionId: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send marking assignment notification
     */
    sendMarkingAssignment(params: {
        email: string;
        agentName: string;
        propertyAddress: string;
        contactPerson: string;
        contactPhone: string;
        deadline: string;
        jobId: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send property approval notification
     */
    sendPropertyApproved(params: {
        email: string;
        ownerName: string;
        propertyTitle: string;
        propertyId: string;
        approvalDate: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send property rejection notification
     */
    sendPropertyRejected(params: {
        email: string;
        ownerName: string;
        propertyTitle: string;
        rejectionReason: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send rental confirmation reminder
     */
    sendRentalConfirmationReminder(params: {
        email: string;
        renterName: string;
        propertyTitle: string;
        confirmationDeadline: string;
        rentalId: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send funds released notification (to owner/agent)
     */
    sendFundsReleased(params: {
        email: string;
        recipientName: string;
        amount: string;
        propertyTitle: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send password reset email
     */
    sendPasswordReset(params: {
        email: string;
        userName: string;
        resetToken: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Core email sending method
     */
    private sendEmail;
    /**
     * Send bulk emails
     */
    sendBulkEmails(emails: EmailParams[]): Promise<{
        sent: number;
        failed: number;
        total: number;
    }>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map