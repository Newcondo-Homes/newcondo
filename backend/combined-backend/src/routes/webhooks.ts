import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { verifyFlutterwaveTransaction, activateSubscription} from "@newcondo/payment-service"

const router: ExpressRouter = Router();


// POST /api/v1/webhooks/flutterwave
// Must be registered before express.json() in app.ts
router.post("/flutterwave", async (req, res) => {
  try {
    const signature = req.headers["verif-hash"] as string;
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;

    if (!signature || signature !== secretHash) {
      console.warn("⚠️ Webhook signature mismatch — blocked");
      return res.status(401).json({ error: "Unauthorized signature" });
    }

    const payload = req.body;
    const eventType = payload.event;

    console.log(`📡 Flutterwave webhook: ${eventType}`);

    if (eventType === "charge.completed" || eventType === "subscription.activated") {
      const data = payload.data;

      if (data.status !== "successful") {
        return res.status(200).json({ received: true });
      }

      // Verify with Flutterwave directly

      const verified = await verifyFlutterwaveTransaction(String(data.id));

      if (verified.status !== "successful") {
        return res.status(200).json({ received: true });
      }

      const txRef = verified.tx_ref as string;

      if (txRef.startsWith("NC-SUB-")) {
        await activateSubscription(
          txRef,
          String(verified.id),
          String(verified.plan || ""),
          verified.card?.token || "",
          String(verified.customer?.id || "")
        );
        console.log(`✅ Subscription activated: ${txRef}`);
      }
    }

    if (eventType === "subscription.cancelled") {
      const { prisma, SubscriptionStatus, SubscriptionEvent } = await import("@newcondo/db");

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
    }

    // Always 200 — prevent Flutterwave retry loops
    return res.status(200).json({ received: true });

  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    return res.status(200).json({ received: true }); // Still 200
  }
});

export { router as webhookRouter };