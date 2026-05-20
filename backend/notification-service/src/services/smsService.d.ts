interface SMSParams {
    to: string;
    message: string;
    locale: string;
}
export declare class SMSService {
    private apiKey;
    private senderId;
    private baseUrl;
    constructor();
    /**
     * Send verification OTP
     */
    sendVerificationOTP(params: {
        phoneNumber: string;
        otpCode: string;
        userName: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send payment confirmation
     */
    sendPaymentConfirmation(params: {
        phoneNumber: string;
        amount: string;
        propertyTitle: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send marking job assignment notification
     */
    sendMarkingJobNotification(params: {
        phoneNumber: string;
        agentName: string;
        propertyAddress: string;
        deadline: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send property approval notification
     */
    sendPropertyApprovalSMS(params: {
        phoneNumber: string;
        ownerName: string;
        propertyTitle: string;
        approved: boolean;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send rental confirmation reminder
     */
    sendRentalConfirmationReminder(params: {
        phoneNumber: string;
        renterName: string;
        hoursRemaining: number;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send funds released notification
     */
    sendFundsReleasedSMS(params: {
        phoneNumber: string;
        recipientName: string;
        amount: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send marking job completion notification
     */
    sendMarkingCompletionSMS(params: {
        phoneNumber: string;
        ownerName: string;
        propertyAddress: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Send password reset SMS
     */
    sendPasswordResetSMS(params: {
        phoneNumber: string;
        resetCode: string;
        locale: string;
    }): Promise<{
        success: boolean;
        messageId: any;
    }>;
    /**
     * Core SMS sending method
     */
    private sendSMS;
    /**
     * Send bulk SMS
     */
    sendBulkSMS(messages: SMSParams[]): Promise<{
        sent: number;
        failed: number;
        total: number;
    }>;
    /**
     * Check SMS balance
     */
    checkBalance(): Promise<{
        balance: any;
        currency: any;
    }>;
}
export declare const smsService: SMSService;
export {};
//# sourceMappingURL=smsService.d.ts.map