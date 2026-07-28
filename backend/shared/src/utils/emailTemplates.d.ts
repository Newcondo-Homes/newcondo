export interface EmailContent {
    subject: string;
    html: string;
}
export declare const EmailTemplates: {
    readonly otp: (p: {
        code: string;
        purpose?: string;
        expiresMinutes?: number;
    }) => EmailContent;
    readonly passwordReset: (p: {
        name?: string;
        resetUrl: string;
    }) => EmailContent;
    readonly welcome: (p: {
        name: string;
        role: "OWNER" | "AGENT" | "RENTER";
    }) => EmailContent;
    readonly verificationSubmitted: (p: {
        name: string;
    }) => EmailContent;
    readonly verificationApproved: (p: {
        name: string;
    }) => EmailContent;
    readonly verificationRejected: (p: {
        name: string;
        reason: string;
    }) => EmailContent;
    readonly rentPaidOwner: (p: {
        ownerName: string;
        amount: number;
        net: number;
        property: string;
        renterName: string;
        escrowEndsAt: string;
    }) => EmailContent;
    readonly rentReceiptRenter: (p: {
        renterName: string;
        amount: number;
        property: string;
        unit: string;
        reference: string;
    }) => EmailContent;
    readonly escrowReleased: (p: {
        ownerName: string;
        amount: number;
        property: string;
    }) => EmailContent;
    readonly commissionReceived: (p: {
        agentName: string;
        amount: number;
        property: string;
        kind: "LISTING" | "SUB_AGENT" | "MARKING";
    }) => EmailContent;
    readonly withdrawalInitiated: (p: {
        name: string;
        amount: number;
        bank: string;
        reference: string;
    }) => EmailContent;
    readonly withdrawalSettled: (p: {
        name: string;
        amount: number;
        bank: string;
    }) => EmailContent;
    readonly paymentFailed: (p: {
        name: string;
        what: string;
        reason?: string;
    }) => EmailContent;
    readonly subscriptionActive: (p: {
        name: string;
        plan: string;
        price: number;
        renewsOn: string;
    }) => EmailContent;
    readonly subscriptionCancelled: (p: {
        name: string;
        plan: string;
        activeUntil: string;
    }) => EmailContent;
    readonly subscriptionPaymentFailed: (p: {
        name: string;
        plan: string;
        retryOn: string;
    }) => EmailContent;
    readonly markingCompleted: (p: {
        ownerName: string;
        property: string;
        markerName: string;
        confirmBy: string;
    }) => EmailContent;
    readonly markingJobNearby: (p: {
        agentName: string;
        property: string;
        area: string;
        payout: number;
    }) => EmailContent;
    readonly markingSlotActive: (p: {
        agentName: string;
        property: string;
        slotHours: number;
    }) => EmailContent;
    readonly tenantJoined: (p: {
        listerName: string;
        tenantName: string;
        property: string;
        unit?: string;
    }) => EmailContent;
    readonly agentInvite: (p: {
        agentName?: string;
        ownerName: string;
        inviteUrl: string;
    }) => EmailContent;
    readonly agentInviteAccepted: (p: {
        ownerName: string;
        agentName: string;
    }) => EmailContent;
    readonly subAgentRequest: (p: {
        listerName: string;
        subAgentName: string;
        property: string;
    }) => EmailContent;
    readonly promotionApproved: (p: {
        subAgentName: string;
        property: string;
        splitPct: number;
        promoUrl: string;
    }) => EmailContent;
    readonly promotionDeclined: (p: {
        subAgentName: string;
        property: string;
        reason?: string;
    }) => EmailContent;
};
export type EmailTemplateName = keyof typeof EmailTemplates;
//# sourceMappingURL=emailTemplates.d.ts.map