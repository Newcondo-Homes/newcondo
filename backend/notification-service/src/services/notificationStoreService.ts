// backend/notification-service/src/services/notificationStoreService.ts
// ============================================================
// Notification persistence reads + the real-time SSE stream.
// Writes happen through shared/utils/notificationBus.publishNotification()
// from ANY service; this service only reads and relays.
// ============================================================
import { Request, Response } from "express";
import { prisma } from "@newcondo/db";
import { subscribeToUser } from "@newcondo/backend-shared";

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function markRead(id: string, userId: string) {
  await prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
}

/**
 * SSE stream — the "instantaneous" channel. The dashboard opens ONE
 * EventSource; every publishNotification() for this user is pushed within
 * milliseconds via Redis pub/sub. Chosen over websockets because it is
 * one-directional, survives Render's free tier, and needs zero client deps.
 * Heartbeat every 25s keeps proxies from killing the idle connection.
 */
export function streamNotifications(req: Request, res: Response) {
  const userId = req.user!.id;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: ready\ndata: {}\n\n`);

  const unsubscribe = subscribeToUser(userId, (json) => res.write(`event: notification\ndata: ${json}\n\n`));
  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 25_000);

  req.on("close", () => { clearInterval(heartbeat); unsubscribe(); res.end(); });
}
