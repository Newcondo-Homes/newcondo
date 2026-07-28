"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishNotification = publishNotification;
exports.subscribeToUser = subscribeToUser;
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
const redis_1 = require("../config/redis");
const db_1 = require("@newcondo/db");
const notificationModel = db_1.prisma.notification;
const channelFor = (userId) => `notif:user:${userId}`;
/** Persist + broadcast. Call this from ANY service — never write SSE/email logic inline. */
async function publishNotification(p) {
    if (!notificationModel) {
        // Pre-migration safety valve: the business operation must still succeed.
        console.warn("[notificationBus] Notification model not migrated yet — skipping persist:", p.title);
        redis_1.redis.publish(channelFor(p.userId), JSON.stringify({ ...p, id: "transient", createdAt: new Date(), readAt: null })).catch(() => { });
        return null;
    }
    const row = await notificationModel.create({ data: p });
    // fire-and-forget: a Redis outage must never fail the business operation
    redis_1.redis.publish(channelFor(p.userId), JSON.stringify(row)).catch((e) => console.error("notificationBus publish failed:", e));
    return row;
}
/**
 * Subscribe to one user's channel (used by the SSE endpoint).
 * Returns an unsubscribe fn — MUST be called on connection close or
 * dangling Redis connections accumulate.
 */
function subscribeToUser(userId, onMessage) {
    const sub = redis_1.redis.duplicate();
    const channel = channelFor(userId);
    sub.subscribe(channel).catch((e) => console.error("notificationBus subscribe failed:", e));
    sub.on("message", (ch, msg) => { if (ch === channel)
        onMessage(msg); });
    return () => { sub.unsubscribe(channel).finally(() => sub.disconnect()); };
}
//# sourceMappingURL=notificationBus.js.map