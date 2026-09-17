// backend/payment-service/src/services/subscriptionRenewal.ts
// ============================================================================
// Recurring billing WITHOUT Flutterwave payment plans.
//
// The old model let Flutterwave drive renewal: a Plan object with a fixed
// amount on a fixed interval, and their scheduler charged it. That cannot
// express per-property pricing — the bill changes whenever an owner adds a
// property, re-tiers one, or gets re-quoted — and `payment_plan` pins the
// amount, so Flutterwave rejects a charge that differs from the plan's.
//
// So: our DB is the source of truth for what is owed, and we charge a saved
// card token for an amount recomputed at charge time.
//
// ⚠️ THIS FILE IS WHERE DUNNING LIVES. Flutterwave's plan machinery used to
// own retry schedules and "your payment failed" emails. It doesn't any more —
// that is the real cost of dropping Plans, and the retry policy below is the
// thing to agree on before launch, not after the first failed charge.
// ============================================================================

import { PrismaClient } from "@newcondo/db";
import { formatNaira } from "@newcondo/backend-shared/constants";
import { PLAN_CONFIG, chargeAmountForUser } from "./planConfig";

const FLW_BASE = "https://api.flutterwave.com/v3";

/** Retry ladder, in hours after the previous failure. After the last one the
 *  subscription goes PAST_DUE and the user is emailed to update their card.
 *  Deliberately short and finite: three attempts over four days. */
const RETRY_HOURS = [24, 48, 72];

/** Days of continued access after the final failed attempt. Listings stay
 *  live during this window — cutting a landlord's listing off over a bank
 *  decline is worse for us than a few days of unpaid service. */
const GRACE_DAYS = 7;

interface TokenizedChargeResult {
  ok: boolean;
  reference: string;
  message?: string;
}

/** Merchant-initiated charge against a stored card token. */
async function chargeToken(args: {
  token: string;
  email: string;
  amountNaira: number;
  txRef: string;
  narration: string;
}): Promise<TokenizedChargeResult> {
  const res = await fetch(`${FLW_BASE}/tokenized-charges`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: args.token,
      email: args.email,
      amount: args.amountNaira,
      currency: "NGN",
      tx_ref: args.txRef,
      narration: args.narration,
    }),
  });

  const json = (await res.json()) as {
    status?: string;
    message?: string;
    data?: { status?: string; tx_ref?: string };
  };

  return {
    ok: json.status === "success" && json.data?.status === "successful",
    reference: json.data?.tx_ref ?? args.txRef,
    message: json.message,
  };
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const addHours = (d: Date, n: number) => new Date(d.getTime() + n * 3_600_000);
const addMonths = (d: Date, n: number) => {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
};

/**
 * Run one renewal pass. Schedule hourly; it is idempotent per subscription
 * because the tx_ref embeds the period end.
 */
export async function renewSubscriptions(prisma: PrismaClient) {
  const now = new Date();

  const due = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      autoRenew: true,
      currentPeriodEnd: { lte: now },
      OR: [{ nextRenewalAttempt: null }, { nextRenewalAttempt: { lte: now } }],
    },
    include: { user: { select: { email: true } } },
  });

  for (const sub of due) {
    const cfg = PLAN_CONFIG[sub.planType];

    // Free renter plans never charge — just roll the period forward so they
    // don't sit in the due queue forever.
    if (cfg.isFreeRenterPlan || sub.isFreeRenterPlan) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { currentPeriodEnd: addMonths(now, 1), nextRenewalAttempt: null },
      });
      continue;
    }

    if (!sub.flwCustomerToken) {
      // Nothing we can do unattended. Surface it rather than retrying forever.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE", nextRenewalAttempt: null },
      });
      continue;
    }

    // Recompute from CURRENT data — this is the line that makes per-property
    // pricing work. A property added last week is billed this cycle.
    const amountNaira = await chargeAmountForUser(prisma, sub.userId, sub.planType);

    const periodMonths = cfg.cycle === "ANNUAL" ? 12 : 1;
    const txRef = `sub_${sub.id}_${sub.currentPeriodEnd?.toISOString().slice(0, 10)}`;

    const result = await chargeToken({
      token: sub.flwCustomerToken,
      email: sub.user.email,
      amountNaira,
      txRef,
      narration: `NewCondo ${cfg.name} — ${formatNaira(amountNaira)}`,
    });

    if (result.ok) {
      const periodStart = now;
      const periodEnd = addMonths(now, periodMonths);

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: "ACTIVE",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            lastChargedNaira: amountNaira,
            renewalFailureCount: 0,
            nextRenewalAttempt: null,
            lastRenewalAttemptAt: now,
          },
        }),
        prisma.subscriptionInvoice.create({
          data: {
            subscriptionId: sub.id,
            userId: sub.userId,
            invoiceNumber: txRef,
            periodStart,
            periodEnd,
            amountNaira,
            status: "PAID",
            flwTransactionRef: result.reference,
            paidAt: now,
          },
        }),
        prisma.subscriptionHistory.create({
          data: {
            subscriptionId: sub.id,
            userId: sub.userId,
            eventType: "RENEWED",
            amountCharged: amountNaira,
            paymentStatus: "SUCCESSFUL",
            flwTransactionRef: result.reference,
            triggeredBy: "system:renewal",
          },
        }),
      ]);
      continue;
    }

    // ── failure path ─────────────────────────────────────────────────────────
    const attempt = sub.renewalFailureCount + 1;
    const nextGap = RETRY_HOURS[attempt - 1];
    const exhausted = nextGap === undefined;

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAST_DUE",
          renewalFailureCount: attempt,
          lastRenewalAttemptAt: now,
          nextRenewalAttempt: exhausted ? null : addHours(now, nextGap),
          // Grace: keep the service live while they fix the card.
          currentPeriodEnd: exhausted ? addDays(now, GRACE_DAYS) : sub.currentPeriodEnd,
        },
      }),
      prisma.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          userId: sub.userId,
          eventType: "PAYMENT_FAILED",
          amountCharged: amountNaira,
          paymentStatus: "FAILED",
          notes: `Attempt ${attempt}. ${result.message ?? "Charge declined."}`,
          triggeredBy: "system:renewal",
        },
      }),
    ]);

    // TODO(notification): email the user — attempt 1 "we'll try again in 24
    // hours", exhausted "update your card within GRACE_DAYS days". Without
    // these emails the user's first signal is their listings going dark.
  }
}
