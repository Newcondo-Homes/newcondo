// backend/combined-backend/src/routes/webhooks.ts — /api/v1/webhooks/*
// This used to be a SECOND, simpler Flutterwave handler (subscriptions only,
// no idempotency, always-200 even on DB errors). Two handlers for one
// provider meant whichever URL was configured in the Flutterwave dashboard
// silently decided which money got processed. Both URLs now run the SAME
// dispatcher, so either can be configured.
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { flutterwaveWebhook } from "@newcondo/payment-service";

const router: ExpressRouter = Router();

// POST /api/v1/webhooks/flutterwave  (≡ /api/v1/payments/webhooks/flutterwave)
router.post("/flutterwave", flutterwaveWebhook);

export { router as webhookRouter };
