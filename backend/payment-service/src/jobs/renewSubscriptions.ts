/* ============================================================
   Subscription renewal cron — reconciled with YOUR backend

   ⚠️ READ FIRST — do you even need this?
   You attach `payment_plan` to the first charge (Model A), so FLUTTERWAVE
   auto-charges the card each cycle and your webhook's RENEWAL branch
   (flutterwave.webhook.ts §5b) extends the period. In Model A you do NOT need
   this cron to charge anyone — running it would DOUBLE-BILL.

   Keep this file for ONE of two roles (pick via CHARGE_MODE):

   • "detect"  (safe with Model A) — does NOT charge. It only flags
     subscriptions whose period lapsed without a paid invoice (Flutterwave's
     auto-charge silently failed or a webhook was missed) as PAST_DUE so the
     user is prompted. This is a useful reconciliation safety net.

   • "charge"  (Model B only — you dropped payment_plan) — bills the saved
     flwCustomerToken yourself via tokenized charges. ONLY enable this if your
     initiate flow stopped sending payment_plan.

   Query matches your spec: status ACTIVE/PAST_DUE, currentPeriodEnd ≤ now+3d,
   isFreeRenterPlan = false.
   ============================================================ */

import { prisma, SubscriptionStatus, SubscriptionEvent, BillingCycle } from "@newcondo/db";
import { PLAN_CONFIG } from "../services/subscription.service";
import { chargeTokenizedCard } from "../utils/flutterwave";
import cron from "node-cron";

const CHARGE_MODE: "detect" | "charge" = (process.env.RENEWAL_MODE as "detect" | "charge") ?? "detect";
const LOOK_AHEAD_DAYS = 3;
const MAX_RETRIES = 3;

function addDays(from: Date, days: number): Date {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d;
}
function getPeriodEnd(start: Date, cycle: BillingCycle): Date {
    const end = new Date(start);
    if (cycle === BillingCycle.ANNUAL) end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    return end;
}

export interface RenewalSummary {
    mode: string;
    scanned: number;
    renewed: number;
    flaggedPastDue: number;
    expired: number;
    skipped: number;
}

async function runRenewals(now = new Date()): Promise<RenewalSummary> {
    const summary: RenewalSummary = {
        mode: CHARGE_MODE,
        scanned: 0,
        renewed: 0,
        flaggedPastDue: 0,
        expired: 0,
        skipped: 0,
    };
    const cutoff = addDays(now, LOOK_AHEAD_DAYS);

    const due = await prisma.subscription.findMany({
        where: {
            isFreeRenterPlan: false, // CRITICAL — never touch free renter records
            autoRenew: true,
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
            currentPeriodEnd: { lte: cutoff },
        },
        include: { user: { select: { email: true } } },
    });
    summary.scanned = due.length;

    for (const sub of due) {
        try {
            // Has THIS period already been paid (e.g. by Flutterwave auto-charge +
            // the webhook)? If so, just roll the period forward and move on.
            const periodStart = sub.currentPeriodEnd ?? now;
            const invoiceNumber = `NC-INV-${sub.id}-${periodStart.toISOString().slice(0, 10)}`;
            const paid = await prisma.subscriptionInvoice.findUnique({ where: { invoiceNumber } });
            if (paid?.status === "PAID") {
                summary.skipped++;
                continue;
            }

            if (CHARGE_MODE === "detect") {
                // Model A safety net: period lapsed with no paid invoice → flag/expire.
                if ((sub.currentPeriodEnd ?? now) <= now) {
                    await flagFailure(sub.id, sub.userId, sub.status, sub.renewalFailureCount, now, summary,
                        "Auto-charge not confirmed for the new period");
                } else {
                    summary.skipped++; // not lapsed yet — leave it to Flutterwave
                }
                continue;
            }

            // Only reaches here if CHARGE_MODE === "charge"
            // CHARGE_MODE === "charge" (Model B) — bill the saved token ourselves.
            await chargeOne(sub, sub.user.email, periodStart, invoiceNumber, now, summary);
        } catch (err) {
            console.error(`[renewals] error on subscription ${sub.id}:`, err);
        }
    }

    console.log(`[renewals] ${JSON.stringify(summary)}`);
    return summary;
}

async function chargeOne(
    sub: { id: string; userId: string; planType: keyof typeof PLAN_CONFIG; billingCycle: BillingCycle; status: SubscriptionStatus; renewalFailureCount: number; finalAmountNaira: unknown; flwCustomerToken: string | null },
    email: string,
    periodStart: Date,
    invoiceNumber: string,
    now: Date,
    summary: RenewalSummary
): Promise<void> {
    if (!sub.flwCustomerToken) {
        await flagFailure(sub.id, sub.userId, sub.status, sub.renewalFailureCount, now, summary, "No saved card token");
        return;
    }
    const cfg = PLAN_CONFIG[sub.planType];
    const amount = Number(sub.finalAmountNaira ?? cfg.amountNaira);
    const periodEnd = getPeriodEnd(periodStart, sub.billingCycle);

    // Claim the invoice first (idempotency anchor), then charge.
    const invoice = await prisma.subscriptionInvoice.upsert({
        where: { invoiceNumber },
        create: {
            subscriptionId: sub.id, userId: sub.userId, invoiceNumber,
            periodStart, periodEnd, amountNaira: amount, currency: "NGN", status: "PENDING",
        },
        update: {},
    });
    if (invoice.status === "PAID") { summary.skipped++; return; }

    const result = await chargeTokenizedCard({
        token: sub.flwCustomerToken,
        email,
        amount,
        txRef: `NC-RENEW-${invoice.id}`,
        narration: `NewCondo ${sub.planType} renewal`,
        meta: { subscriptionId: sub.id, invoiceId: invoice.id, kind: "renewal" },
    });

    if (result.ok) {
        await prisma.$transaction([
            prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    nextRenewalAttempt: periodEnd,
                    renewalFailureCount: 0,
                    lastRenewalAttemptAt: now,
                    flwTransactionRef: result.txRef,
                },
            }),
            prisma.subscriptionInvoice.update({
                where: { id: invoice.id },
                data: {
                    status: "PAID",
                    flwTransactionRef: result.txRef,
                    flwTransactionId: result.transactionId ? String(result.transactionId) : null,
                    paidAt: now,
                },
            }),
            prisma.subscriptionHistory.create({
                data: {
                    subscriptionId: sub.id, userId: sub.userId,
                    eventType: SubscriptionEvent.RENEWED,
                    fromStatus: sub.status, toStatus: SubscriptionStatus.ACTIVE,
                    flwTransactionRef: result.txRef, amountCharged: amount,
                    triggeredBy: "system",
                    notes: `Renewed until ${periodEnd.toISOString().slice(0, 10)}`,
                },
            }),
            prisma.user.update({
                where: { id: sub.userId },
                data: { isPremium: true, premiumExpiresAt: periodEnd },
            }),
        ]);
        summary.renewed++;
        return;
    }

    await prisma.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: { status: "FAILED", failureReason: `Charge ${result.status}`, retryCount: { increment: 1 }, nextRetryAt: addDays(now, 1) },
    });
    await flagFailure(sub.id, sub.userId, sub.status, sub.renewalFailureCount, now, summary, `Renewal charge ${result.status}`);
}

async function flagFailure(
    id: string,
    userId: string,
    fromStatus: SubscriptionStatus,
    prevFailures: number,
    now: Date,
    summary: RenewalSummary,
    note: string
): Promise<void> {
    const failures = prevFailures + 1;
    if (failures >= MAX_RETRIES) {
        await prisma.$transaction([
            prisma.subscription.update({
                where: { id },
                data: { status: SubscriptionStatus.EXPIRED, renewalFailureCount: failures, lastRenewalAttemptAt: now },
            }),
            prisma.subscriptionHistory.create({
                data: {
                    subscriptionId: id, userId,
                    eventType: SubscriptionEvent.EXPIRED,
                    fromStatus, toStatus: SubscriptionStatus.EXPIRED,
                    triggeredBy: "system", notes: `Expired after ${failures} failed renewals — ${note}`,
                },
            }),
        ]);
        summary.expired++;
    } else {
        await prisma.$transaction([
            prisma.subscription.update({
                where: { id },
                data: {
                    status: SubscriptionStatus.PAST_DUE,
                    renewalFailureCount: failures,
                    lastRenewalAttemptAt: now,
                    nextRenewalAttempt: addDays(now, 1),
                },
            }),
            prisma.subscriptionHistory.create({
                data: {
                    subscriptionId: id, userId,
                    eventType: SubscriptionEvent.RENEWAL_FAILED,
                    fromStatus, toStatus: SubscriptionStatus.PAST_DUE,
                    triggeredBy: "system", notes: note,
                },
            }),
        ]);
        summary.flaggedPastDue++;
    }
}

export function startRenewalCron() {
    cron.schedule("0 1 * * *", async () => {
        console.log("[cron] Starting renewal detection run...");
        try {
            const summary = await runRenewals();
            console.log("[cron] Renewal run complete:", summary);
        } catch (err) {
            console.error("[cron] Renewal run failed:", err);
        }
    }, {
        timezone: "Africa/Lagos",
    });

    console.log("[cron] Renewal job scheduled — 2:00 AM WAT daily");
}

// CLI one-shot: `ts-node src/jobs/renewSubscriptions.ts`
if (require.main === module) {
    runRenewals()
        .then((s) => {
            console.log("Renewal run complete:", s);
            return prisma.$disconnect();
        })
        .then(() => process.exit(0))
        .catch(async (e) => {
            console.error("Renewal run failed:", e);
            await prisma.$disconnect();
            process.exit(1);
        });
}
