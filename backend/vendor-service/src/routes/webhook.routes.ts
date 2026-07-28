import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import {
  activateSubscription,
  verifyFlutterwaveTransaction,
} from "../services/subscription.service";

const router: ExpressRouter = Router();

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH!; // Set in Flutterwave dashboard

// POST /api/webhooks/flutterwave
// Flutterwave calls this after every payment event
// IMPORTANT: This route must NOT use JSON body parsing middleware above it —
// it needs the raw body to verify the signature
router.post("/flutterwave", async (req: Request, res: Response) => {
  try {
    // ── Step 1: Verify the webhook signature ─────────────────────────────────
    const signature = req.headers["verif-hash"] as string;

    if (!signature || signature !== FLW_SECRET_HASH) {
      console.warn("Webhook signature mismatch — ignoring");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;
    const eventType = payload.event;

    console.log(`Flutterwave webhook received: ${eventType}`);

    // ── Step 2: Handle subscription charge events ─────────────────────────────
    // charge.completed = first payment or recurring renewal succeeded
    if (eventType === "charge.completed" || eventType === "subscription.activated") {
      const data = payload.data;

      // Only process successful payments
      if (data.status !== "successful") {
        console.log(`Payment not successful: ${data.status} — skipping`);
        return res.status(200).json({ received: true });
      }

      // ── Step 3: Verify with Flutterwave directly (don't trust webhook data alone)
      const verified = await verifyFlutterwaveTransaction(data.id);

      if (verified.status !== "successful") {
        console.warn(`Transaction ${data.id} verification failed — skipping`);
        return res.status(200).json({ received: true });
      }

      const txRef = verified.tx_ref as string;

      // Guard: only handle subscription payments (our tx_refs start with NC-SUB-)
      if (!txRef.startsWith("NC-SUB-")) {
        return res.status(200).json({ received: true }); // Different payment type
      }

      // ── Step 4: Activate the subscription ────────────────────────────────────
      await activateSubscription(
        txRef,
        String(verified.id),
        String(verified.plan || ""), // FLW subscription ID
        verified.card?.token || "",  // Card token for recurring
        String(verified.customer?.id || ""),
      );

      console.log(`✅ Subscription activated for tx_ref: ${txRef}`);
      return res.status(200).json({ received: true });
    }

    // ── Handle subscription cancellation ─────────────────────────────────────
    if (eventType === "subscription.cancelled") {
      const { PrismaClient, SubscriptionStatus, SubscriptionEvent } = await import("@newcondo/db");
      const prisma = new PrismaClient();

      const flwSubscriptionId = String(payload.data.id);
      const subscription = await prisma.subscription.findFirst({
        where: { flwSubscriptionId },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date(),
            autoRenew: false,
          },
        });

        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            eventType: SubscriptionEvent.CANCELLED,
            fromStatus: SubscriptionStatus.ACTIVE,
            toStatus: SubscriptionStatus.CANCELLED,
            triggeredBy: "flutterwave",
            notes: "Cancelled via Flutterwave webhook",
          },
        });
      }

      return res.status(200).json({ received: true });
    }

    // All other events — acknowledge and ignore
    return res.status(200).json({ received: true });

  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    // Always return 200 to Flutterwave — otherwise it retries indefinitely
    return res.status(200).json({ received: true, error: err.message });
  }
});

export default router;