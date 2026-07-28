// backend/combined-backend/src/routes/notifications.ts
// Mounted at /api/v1/notifications. The SSE stream is the real-time channel
// the dashboard Topbar subscribes to (EventSource can't set an Authorization
// header, so /stream also accepts ?token= — verified by the same middleware
// via a tiny shim below).
import { Router, type Router as ExpressRouter, Request, Response, NextFunction } from "express";
import { authMiddleware } from "@newcondo/backend-shared";
import { listNotifications, markAllRead, markRead, streamNotifications } from "@newcondo/notification-service";

const router: ExpressRouter = Router();

// EventSource shim: lift ?token= into the Authorization header, then run the
// standard authMiddleware — one auth code path, no duplicate JWT logic.
const tokenQueryShim = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers.authorization && typeof req.query.token === "string") {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

router.get("/", authMiddleware, async (req, res, next) => {
  try { res.json({ success: true, data: await listNotifications(req.user!.id) }); } catch (e) { next(e); }
});
router.post("/mark-all-read", authMiddleware, async (req, res, next) => {
  try { await markAllRead(req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/:id/read", authMiddleware, async (req, res, next) => {
  try { await markRead(req.params.id, req.user!.id); res.json({ success: true }); } catch (e) { next(e); }
});

// GET /api/v1/notifications/stream — Server-Sent Events, instantaneous push
router.get("/stream", tokenQueryShim, authMiddleware, streamNotifications);

export { router as notificationRouter };
