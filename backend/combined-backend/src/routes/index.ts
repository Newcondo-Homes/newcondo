// backend/combined-backend/src/routes/index.ts
// UPDATED main router — mounts the new property/notification routers and
// keeps auth + payments exactly as they were. Drop-in replacement.
import { Router } from "express";
import { logger } from "../utils/logger";
import type { Router as ExpressRouter } from "express";

import { authRouter } from "./auth";
import { paymentRouter } from "./payments";
import { paymentsDashboardRouter } from "./payments.dashboard"; // bank accounts, receipts, rent checkout
import { paymentsBillingRouter } from "./payments.billing";     // MONEY CORE: property plans, ledger, admin money
import { propertyRouter } from "./properties";                  // browse, tenants, invite links
import { notificationRouter } from "./notifications";           // list, mark-read, SSE stream
import { collabRouter } from "./collab";                        // share links, promotions, agent invites
import { markingRouter } from "./marking";                      // jobs, queue, photos, confirm
import { referralRouter } from "./referrals";                   // stats, invite
import { servicesRouter } from "./services";                    // vendor services
import { vendorPortalRouter, serviceVisitsRouter } from "./vendors"; // ++ vendor network (apps/vendors + visit codes)
import { accountDeletionRouter, metaDataDeletionRouter } from "./auth.account-deletion"; // delete account
import { adminRouter, accountGuard } from "./admin";              // ++ ADMIN — apps/admin (staff + scopes)

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

// ++ ADMIN — runs before every router: suspended accounts, "sign out everywhere",
// support-session limits (no money/credential routes, every write logged), device tracking.
router.use(accountGuard);

mountRoute("/auth", authRouter, "Auth Service");
mountRoute("/payments", paymentRouter, "Payment Service");
mountRoute("/payments", paymentsDashboardRouter, "Payment Service (dashboard)");
mountRoute("/payments", paymentsBillingRouter, "Payment Service (billing + ledger)");
// Webhooks: /api/v1/webhooks/* is mounted in app.ts (before the JSON parser);
// /payments/webhooks/flutterwave lives in payments.ts. Both run the same
// dispatcher (payment-service flutterwave.webhook.ts).
mountRoute("/properties", propertyRouter, "Property Service");
mountRoute("/notifications", notificationRouter, "Notification Service");
mountRoute("/", collabRouter, "Collaboration (share/promote/invite)");
mountRoute("/marking", markingRouter, "Marking Service");
mountRoute("/referrals", referralRouter, "Referral Service");
mountRoute("/services", servicesRouter, "Vendor Service");
mountRoute("/services", serviceVisitsRouter, "Vendor Service (visits, codes, windows)");
mountRoute("/vendors", vendorPortalRouter, "Vendor Portal (apps/vendors)");
// Account deletion. Mounted under /auth so the paths are
// /api/v1/auth/account/deletion* — matching lib/api/account-deletion.ts.
mountRoute("/auth", accountDeletionRouter, "Account Deletion");
// Public status lookup: /api/v1/data-deletion/:code (no auth — Meta opens it).
// NOTE the Meta CALLBACK itself (POST /facebook/data-deletion) is NOT under
// /api/v1 — it must be mounted at the app root in index.ts:
//   app.use("/", metaDataDeletionRouter);
mountRoute("/", metaDataDeletionRouter, "Meta data-deletion callback");

// Still to wire as their barrels fill out:
// mountRoute('/bookings', bookingRouter, 'Booking Service');
mountRoute("/admin", adminRouter, "Admin Service (apps/admin)");
// mountRoute('/analytics', analyticsRouter, 'Analytics Service');

router.get("/status", (req, res) => {
  res.json({
    success: true,
    services: { auth: "active", properties: "active", payments: "active", notifications: "active", bookings: "active", marking: "active", admin: "active", referrals: "active", analytics: "pending" },
    timestamp: new Date().toISOString(),
  });
});

export { router as mainRouter };
