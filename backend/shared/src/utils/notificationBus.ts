// backend/shared/src/utils/notificationBus.ts
// ============================================================
// Real-time notification bus — Redis pub/sub + Postgres persistence.
// Shared because EVERY service emits notifications (marking, payments,
// property, referrals) and notification-service consumes them.
//
// publishNotification():
//   1. Persists the Notification row (badge counts / history survive restarts)
//   2. Publishes on `notif:user:{userId}` — notification-service's SSE
//      stream (and any future websocket) relays it to the browser instantly.
//
// TWO BUILD NOTES:
//  • The payload type is NotificationBusPayload, NOT NotificationPayload —
//    utils/notification.ts already exports that name, and two `export *`
//    barrels sharing it caused "TS2308: Module './notificationBus' has already
//    exported a member named 'NotificationPayload'".
//  • prisma.notification is accessed through a narrow cast until the
//    Notification model is migrated (see schema-additions.prisma). Remove the
//    cast right after `npx prisma migrate dev` — TODO(prisma).
//
// ioredis detail: a connection in subscriber mode can't issue normal commands,
// so subscribers use a dedicated duplicate() connection.
// ============================================================
import { redis } from "../config/redis";
import { prisma } from "@newcondo/db";

export type NotificationKind =
  | "marking" | "payment" | "wallet" | "verify" | "tenant" | "service" | "referral";

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

/* TODO(prisma): delete this shim once the Notification model exists in
   packages/db/prisma/schema.prisma (see newcondo-backend/schema-additions.prisma)
   and `prisma generate` has run — then use `prisma.notification` directly. */
type NotificationDelegate = {
  create(args: { data: NotificationBusPayload }): Promise<NotificationBusPayload & { id: string; createdAt: Date; readAt: Date | null }>;
};
const notificationModel = (prisma as unknown as { notification?: NotificationDelegate }).notification;

const channelFor = (userId: string) => `notif:user:${userId}`;

/** Persist + broadcast. Call this from ANY service — never write SSE/email logic inline. */
export async function publishNotification(p: NotificationBusPayload) {
  if (!notificationModel) {
    // Pre-migration safety valve: the business operation must still succeed.
    console.warn("[notificationBus] Notification model not migrated yet — skipping persist:", p.title);
    redis.publish(channelFor(p.userId), JSON.stringify({ ...p, id: "transient", createdAt: new Date(), readAt: null })).catch(() => {});
    return null;
  }
  const row = await notificationModel.create({ data: p });
  // fire-and-forget: a Redis outage must never fail the business operation
  redis.publish(channelFor(p.userId), JSON.stringify(row)).catch((e) => console.error("notificationBus publish failed:", e));
  return row;
}

/**
 * Subscribe to one user's channel (used by the SSE endpoint).
 * Returns an unsubscribe fn — MUST be called on connection close or
 * dangling Redis connections accumulate.
 */
export function subscribeToUser(userId: string, onMessage: (json: string) => void): () => void {
  const sub = redis.duplicate();
  const channel = channelFor(userId);
  sub.subscribe(channel).catch((e) => console.error("notificationBus subscribe failed:", e));
  sub.on("message", (ch: string, msg: string) => { if (ch === channel) onMessage(msg); });
  return () => { sub.unsubscribe(channel).finally(() => sub.disconnect()); };
}
