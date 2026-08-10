/* ============================================================
   POST /api/v1/payments/webhooks/flutterwave

   UPDATED: now persists display-only card metadata (last4 / brand / expiry)
   alongside the card token, so the dashboard can say "Visa •••• 4242" when
   charging the saved card for a marking fee instead of "Your saved card".

   Everything else is unchanged from your version:
     • verif-hash auth   → rejects forgeries.
     • verify-then-act   → never trusts the body for money.
     • idempotent        → dedupes on flwTransactionId (Flutterwave RETRIES).
     • always 200        → so Flutterwave stops retrying; 500 only on transient
                           errors we WANT retried (DB down, verify timeout).

   Because you attach `payment_plan` to the initial charge (Model A),
   Flutterwave bills the card every cycle itself and sends charge.completed
   each time, so this handler covers BOTH:
     1. FIRST charge  (subscription PENDING) → activateSubscription(...)
     2. RENEWAL charge (subscription ACTIVE) → extend period + invoice + history

   PREREQUISITES
     • Migration `subscription_card_metadata` (Subscription.cardLast4 /
       cardBrand / cardExpiry).
     • activateSubscription() accepts an optional 6th `card` argument.
     • services/flutterwave.types.ts provides extractSavedCardMeta().
   ============================================================ */

import type { Request, Response } from "express";
import {
  prisma,
  SubscriptionStatus,
  SubscriptionEvent,
  BillingCycle,
} from "@newcondo/db";
import {
  verifyFlutterwaveTransaction,
  activateSubscription,
} from "../services";
import { extractSavedCardMeta } from "../services/flutterwave.types";

function getPeriodEnd(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === BillingCycle.ANNUAL) end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function flutterwaveWebhook(req: Request, res: Response): Promise<void> {
  try {
    // ── 1. Authenticate the caller ─────────────────────────────────────────
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers["verif-hash"];
    if (!secretHash || !signature || signature !== secretHash) {
      console.log("⚠️ Unauthorized Flutterwave webhook attempt blocked.");
      res.status(401).json({ error: "Unauthorized signature" });
      return;
    }

    const event = req.body?.event ?? req.body?.["event.type"];
    const body = req.body?.data ?? req.body;
    console.log(`📡 Flutterwave webhook: ${event}`);

    // Only completed card charges matter here. ACK everything else with 200.
    const isCharge =
      event === "charge.completed" || String(event).toUpperCase().includes("CARD_TRANSACTION");
    if (!isCharge) {
      res.status(200).send("Ignored");
      return;
    }

    const transactionId = body?.id;
    const txRef: string | undefined = body?.tx_ref ?? body?.txRef;
    if (!transactionId) {
      res.status(200).send("No transaction id");
      return;
    }

    // ── 2. Idempotency: already processed this transaction? ────────────────
    const seen = await prisma.subscriptionInvoice.findFirst({
      where: { flwTransactionId: String(transactionId) },
    });
    if (seen) {
      console.log(`↩️  Transaction ${transactionId} already processed — skipping.`);
      res.status(200).send("Already processed");
      return;
    }

    // ── 3. Verify with Flutterwave (don't trust the body for money) ────────
    const tx = await verifyFlutterwaveTransaction(String(transactionId));
    if (tx?.status !== "successful") {
      console.log(`Charge ${transactionId} not successful (${tx?.status}) — acknowledging.`);
      res.status(200).send("Not successful");
      return;
    }

    const meta = tx.meta ?? body?.meta ?? {};
    const customerEmail: string | undefined = tx.customer?.email ?? body?.customer?.email;
    const cardToken: string = tx.card?.token ?? "";
    const flwCustomerId = tx.customer?.id ? String(tx.customer.id) : "";
    // ++ ADDED — display-only card fields (last4 / brand / expiry). Undefined
    // for non-card charges (transfer, USSD), so we simply skip the write.
    const card = extractSavedCardMeta(tx);
    // Flutterwave plan-driven subs return the subscription id on the charge;
    // fall back to the plan id so activateSubscription always has a value.
    const flwSubscriptionId = String(
      tx.subscription_id ?? (meta as { subscriptionId?: string })?.subscriptionId ?? tx.payment_plan ?? ""
    );

    // ── 4. Resolve the subscription ────────────────────────────────────────
    // First charge → meta.subscriptionId / tx_ref. Renewal (Flutterwave mints
    // its own tx_ref) → match by customer email → user → subscription.
    const metaSubId = (meta as { subscriptionId?: string })?.subscriptionId;
    let subscription =
      (metaSubId
        ? await prisma.subscription.findUnique({ where: { id: String(metaSubId) } })
        : null) ??
      (txRef ? await prisma.subscription.findFirst({ where: { flwTransactionRef: txRef } }) : null);

    if (!subscription && customerEmail) {
      const user = await prisma.user.findUnique({ where: { email: customerEmail } });
      if (user) subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    }

    if (!subscription) {
      console.log(`No subscription matched (tx_ref ${txRef}, email ${customerEmail}) — ack.`);
      res.status(200).send("No matching subscription");
      return;
    }

    // ── 5a. FIRST charge → activate via YOUR existing function ─────────────
    if (subscription.status === SubscriptionStatus.PENDING) {
      await activateSubscription(
        subscription.flwTransactionRef ?? txRef ?? `NC-${transactionId}`,
        String(transactionId),
        flwSubscriptionId,
        cardToken,
        flwCustomerId,
        card // ++ ADDED — persists cardLast4 / cardBrand / cardExpiry
      );
      console.log(`✅ Subscription ${subscription.id} activated (first charge).`);
      res.status(200).send("Activated");
      return;
    }

    // ── 5b. RENEWAL charge → extend period, invoice, history ───────────────
    if (
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.PAST_DUE
    ) {
      const now = new Date();
      const periodStart = subscription.currentPeriodEnd ?? now;
      const periodEnd = getPeriodEnd(periodStart, subscription.billingCycle);
      const invoiceNumber = `NC-INV-${subscription.id}-${periodStart.toISOString().slice(0, 10)}`;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            nextRenewalAttempt: periodEnd,
            renewalFailureCount: 0,
            lastRenewalAttemptAt: now,
            // Refresh the saved card token if Flutterwave sent a new one.
            ...(cardToken ? { flwCustomerToken: cardToken } : {}),
            // ++ ADDED — keep the display label in step with the token, so a
            // card the bank reissued shows its new last4 rather than a stale
            // one. Each field is written only when present, so a sparse
            // response never blanks details we already hold.
            ...(card?.last4 ? { cardLast4: card.last4 } : {}),
            ...(card?.brand ? { cardBrand: card.brand } : {}),
            ...(card?.expiry ? { cardExpiry: card.expiry } : {}),
          },
        }),
        prisma.subscriptionInvoice.upsert({
          where: { invoiceNumber },
          create: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            invoiceNumber,
            periodStart,
            periodEnd,
            amountNaira: tx.amount,
            currency: tx.currency ?? "NGN",
            status: "PAID",
            flwTransactionRef: String(txRef ?? transactionId),
            flwTransactionId: String(transactionId),
            paidAt: now,
          },
          update: {
            status: "PAID",
            flwTransactionId: String(transactionId),
            paidAt: now,
          },
        }),
        prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            eventType: SubscriptionEvent.RENEWED,
            fromStatus: subscription.status,
            toStatus: SubscriptionStatus.ACTIVE,
            flwTransactionRef: String(txRef ?? transactionId),
            amountCharged: tx.amount,
            triggeredBy: "system",
            notes: `Auto-renewed (Flutterwave payment plan) until ${periodEnd
              .toISOString()
              .slice(0, 10)}`,
          },
        }),
        prisma.user.update({
          where: { id: subscription.userId },
          data: { isPremium: true, premiumExpiresAt: periodEnd },
        }),
      ]);

      console.log(`✅ Subscription ${subscription.id} renewed until ${periodEnd.toISOString()}.`);
      res.status(200).send("Renewed");
      return;
    }

    // Any other status (CANCELLED/EXPIRED/…) — record but don't reactivate here.
    console.log(`Charge for subscription ${subscription.id} in status ${subscription.status} — ack.`);
    res.status(200).send("Acknowledged");
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    // 500 → Flutterwave retries later; idempotency above makes the retry safe.
    res.status(500).json({ error: "Internal processing error" });
  }
}
