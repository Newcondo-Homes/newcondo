// backend/payment-service/src/webhooks/subscriptionCharge.ts
// ============================================================
// NC-SUB-* (and legacy plan-driven renewals with Flutterwave-minted refs).
// Moved out of flutterwave.webhook.ts unchanged in behaviour, plus:
//   • the verified amount must cover what the subscription costs
//   • the legacy renewal path posts to the ledger like every other charge
// ============================================================
import { prisma, SubscriptionStatus, SubscriptionEvent, BillingCycle } from "@newcondo/db";
import { ACC, postLedger, toKobo, collectionLegs } from "@newcondo/backend-shared";
import { activateSubscription } from "../services";
import { extractSavedCardMeta } from "../services/flutterwave.types";
import type { VerifiedPayment } from "./chargeHandlers";

function getPeriodEnd(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === BillingCycle.ANNUAL) end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function handleSubscriptionCharge(txRef: string, paid: VerifiedPayment): Promise<string> {
  const tx = paid.raw;
  const transactionId = String(paid.transactionId ?? tx.id);

  // Idempotency: already processed this transaction?
  const seen = await prisma.subscriptionInvoice.findFirst({ where: { flwTransactionId: transactionId } });
  if (seen) return "already-processed";

  const meta = (tx.meta ?? {}) as { subscriptionId?: string };
  const customerEmail: string | undefined = tx.customer?.email;
  const cardToken: string = tx.card?.token ?? "";
  const flwCustomerId = tx.customer?.id ? String(tx.customer.id) : "";
  const card = extractSavedCardMeta(tx as never);
  const flwSubscriptionId = String(tx.subscription_id ?? meta.subscriptionId ?? tx.payment_plan ?? "");

  let subscription =
    (meta.subscriptionId ? await prisma.subscription.findUnique({ where: { id: String(meta.subscriptionId) } }) : null) ??
    (txRef ? await prisma.subscription.findFirst({ where: { flwTransactionRef: txRef } }) : null);
  if (!subscription && customerEmail) {
    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (user) subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  }
  if (!subscription) return "no-subscription";

  // Checked against the PLAN price, not plan + processing fee: checkouts
  // started before FLW FEES shipped carry no fee, and a fee shortfall is
  // absorbed by platform:processing rather than refusing the subscription.
  if (paid.amountNaira + 0.001 < Number(subscription.finalAmountNaira)) {
    console.error(`[webhook] subscription ${subscription.id} underpaid: ₦${paid.amountNaira} < ₦${subscription.finalAmountNaira}`);
    return "underpaid";
  }

  // FIRST charge → activate (activateSubscription posts the ledger entry).
  if (subscription.status === SubscriptionStatus.PENDING) {
    await activateSubscription(subscription.flwTransactionRef ?? txRef ?? `NC-${transactionId}`, transactionId, flwSubscriptionId, cardToken, flwCustomerId, card,
      { grossNaira: paid.amountNaira, settledNaira: paid.settledNaira });
    return "activated";
  }

  // LEGACY renewal (Model A payment_plan, Flutterwave-minted tx_ref). New
  // renewals are NC-RENEW-* and settle in the cron, never here.
  if (subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.PAST_DUE) {
    const now = new Date();
    const periodStart = subscription.currentPeriodEnd ?? now;
    const periodEnd = getPeriodEnd(periodStart, subscription.billingCycle);
    const invoiceNumber = `NC-INV-${subscription.id}-${periodStart.toISOString().slice(0, 10)}`;
    await prisma.$transaction(async (db) => {
      await db.subscription.update({
        where: { id: subscription!.id },
        data: {
          status: SubscriptionStatus.ACTIVE, currentPeriodStart: periodStart, currentPeriodEnd: periodEnd,
          nextRenewalAttempt: periodEnd, renewalFailureCount: 0, lastRenewalAttemptAt: now,
          ...(cardToken ? { flwCustomerToken: cardToken } : {}),
          ...(card?.last4 ? { cardLast4: card.last4 } : {}),
          ...(card?.brand ? { cardBrand: card.brand } : {}),
          ...(card?.expiry ? { cardExpiry: card.expiry } : {}),
        },
      });
      const inv = await db.subscriptionInvoice.upsert({
        where: { invoiceNumber },
        create: {
          subscriptionId: subscription!.id, userId: subscription!.userId, invoiceNumber, periodStart, periodEnd,
          amountNaira: paid.amountNaira, currency: paid.currency, status: "PAID",
          flwTransactionRef: String(txRef ?? transactionId), flwTransactionId: transactionId, paidAt: now,
        },
        update: { status: "PAID", flwTransactionId: transactionId, paidAt: now },
      });
      await postLedger(db, {
        idempotencyKey: `invoice:${inv.id}`, type: "SUBSCRIPTION_COLLECTED", sourceType: "INVOICE", sourceId: inv.id,
        memo: "Subscription renewal (legacy plan)",
        // Legacy payment plans charge a fixed amount with no fee on top, so
        // Newcondo absorbs Flutterwave's cost here (processing goes negative).
        legs: collectionLegs({
          via: "CHECKOUT",
          receivedKobo: toKobo(paid.amountNaira),
          settledKobo: paid.settledNaira != null ? toKobo(paid.settledNaira) : null,
          dueKobo: toKobo(paid.amountNaira),
          allocations: [{ account: ACC.revenue, amountKobo: toKobo(paid.amountNaira) }],
        }),
      });
      await db.subscriptionHistory.create({
        data: {
          subscriptionId: subscription!.id, userId: subscription!.userId, eventType: SubscriptionEvent.RENEWED,
          fromStatus: subscription!.status, toStatus: SubscriptionStatus.ACTIVE, flwTransactionRef: String(txRef ?? transactionId),
          amountCharged: paid.amountNaira, triggeredBy: "system", notes: `Auto-renewed (legacy payment plan) until ${periodEnd.toISOString().slice(0, 10)}`,
        },
      });
      await db.user.update({ where: { id: subscription!.userId }, data: { isPremium: true, premiumExpiresAt: periodEnd } });
    });
    return "renewed";
  }
  return `ignored-${subscription.status}`;
}
