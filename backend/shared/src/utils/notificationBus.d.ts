export type NotificationKind = "marking" | "payment" | "wallet" | "verify" | "tenant" | "service" | "referral";
export interface NotificationBusPayload {
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    /** dashboard route the notification deep-links to, e.g. "/payments" */
    to: string;
    /** optional entity refs for dedupe/threading */
    entityType?: string;
    entityId?: string;
}
/** Persist + broadcast. Call this from ANY service — never write SSE/email logic inline. */
export declare function publishNotification(p: NotificationBusPayload): Promise<(NotificationBusPayload & {
    id: string;
    createdAt: Date;
    readAt: Date | null;
}) | null>;
/**
 * Subscribe to one user's channel (used by the SSE endpoint).
 * Returns an unsubscribe fn — MUST be called on connection close or
 * dangling Redis connections accumulate.
 */
export declare function subscribeToUser(userId: string, onMessage: (json: string) => void): () => void;
//# sourceMappingURL=notificationBus.d.ts.map