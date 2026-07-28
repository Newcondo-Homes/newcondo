// backend/combined-backend/src/routes/index.ts
// UPDATED main router — mounts the new property/notification routers and
// keeps auth + payments exactly as they were. Drop-in replacement.
import { Router } from "express";
import { logger } from "../utils/logger";
import type { Router as ExpressRouter } from "express";

import { authRouter } from "./auth";
import { paymentRouter } from "./payments";
import { paymentsDashboardRouter } from "./payments.dashboard"; // bank accounts, receipts, rent checkout
import { propertyRouter } from "./properties";                  // browse, tenants, invite links
import { notificationRouter } from "./notifications";           // list, mark-read, SSE stream
import { collabRouter } from "./collab";                        // share links, promotions, agent invites
import { markingRouter } from "./marking";                      // jobs, queue, photos, confirm
import { referralRouter } from "./referrals";                   // stats, invite
import { servicesRouter } from "./services";                    // vendor services

const router: ExpressRouter = Router();

router.get("/test", (req, res) => {
  logger.info("Test route hit successfully");
  res.json({ success: true, message: "Main router is working correctly", timestamp: new Date().toISOString(), route: "/api/v1/test" });
});

const mountRoute = (path: string, routerInstance: Router, serviceName: string) => {
  try {
    router.use(path, routerInstance);
    logger.info(`✅ ${serviceName} routes mounted on ${path}`);
  } catch (error) {
    logger.error(`❌ Failed to mount ${serviceName} routes on ${path}:`, error);
  }
};

mountRoute("/auth", authRouter, "Auth Service");
mountRoute("/payments", paymentRouter, "Payment Service");
mountRoute("/payments", paymentsDashboardRouter, "Payment Service (dashboard)");
mountRoute("/properties", propertyRouter, "Property Service");
mountRoute("/notifications", notificationRouter, "Notification Service");
mountRoute("/", collabRouter, "Collaboration (share/promote/invite)");
mountRoute("/marking", markingRouter, "Marking Service");
mountRoute("/referrals", referralRouter, "Referral Service");
mountRoute("/services", servicesRouter, "Vendor Service");
// Still to wire as their barrels fill out:
// mountRoute('/bookings', bookingRouter, 'Booking Service');
// mountRoute('/admin', adminRouter, 'Admin Service');
// mountRoute('/analytics', analyticsRouter, 'Analytics Service');

router.get("/status", (req, res) => {
  res.json({
    success: true,
    services: { auth: "active", properties: "active", payments: "active", notifications: "active", bookings: "active", marking: "active", admin: "pending", referrals: "pending", analytics: "pending" },
    timestamp: new Date().toISOString(),
  });
});

export { router as mainRouter };
