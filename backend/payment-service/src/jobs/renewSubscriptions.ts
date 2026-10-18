/* ============================================================
   Subscription renewal cron — reconciled with YOUR backend

   ⚠️ READ FIRST — THIS FILE IS NOW MANDATORY, AND THE DEFAULT MODE CHANGED.

   The header used to say "do you even need this?" and default to "detect",
   because initiateSubscription attached `payment_plan` to the first charge
   (Model A) and Flutterwave auto-charged the card each cycle.

   That is no longer true. As of Sept 2026 owner tiers are priced PER PROPERTY,
   so the bill is a SUM over PropertySubscription lines that changes whenever a
   property is added, re-tiered or re-quoted. A Flutterwave payment plan is one
   fixed amount and PINS the charge server-side, so it cannot express that —
   `payment_plan` is gone from initiateSubscription and Flutterwave no longer
   charges anyone on our behalf.

   Consequence: if this cron does not run in "charge" mode, NOBODY IS EVER
   BILLED AGAIN after their first month. Set RENEWAL_MODE=charge.

   • "charge"  (Model B — current architecture) — bills the saved
     flwCustomerToken via tokenized charges for an amount RECOMPUTED from the
     DB at charge time. This is the only mode that actually collects money now.

   • "detect"  (legacy, Model A only) — does NOT charge; only flags lapsed
     subscriptions as PAST_DUE. Kept because an environment still running an
     old build with payment_plan attached would DOUBLE-BILL in charge mode.
     Leave it as the default so a stale deploy fails safe (no money taken)
     rather than unsafe (money taken twice) — but set RENEWAL_MODE=charge in
     every environment running this code.

   DUNNING IS OURS NOW. Flutterwave's plan machinery owned retry schedules and
   "payment failed" emails; it doesn't any more. flagFailure below is the whole
   policy: 1-day retry, 3 attempts, then EXPIRED. The one thing still missing
   is the customer EMAIL on failure — see the TODO in flagFailure. Without it
   a user's first signal is their listings going dark.

   Query matches your spec: status ACTIVE/PAST_DUE, currentPeriodEnd ≤ now+3d,
   isFreeRenterPlan = false.
   ============================================================ */

import { prisma, SubscriptionStatus, SubscriptionEvent, BillingCycle } from "@newcondo/db";
import {
    publishNotification,
    sendBrandedEmail,
    EmailTemplates,
    formatNaira,
    // ++ MONEY CORE
    ACC,
    postLedger,
    toKobo,
    toNaira,
    Referrals,
    // ++ FLW FEES
    withProcessingFee,
    collectionLegs,
} from "@newcondo/backend-shared";
import { applyScheduledLineChanges } from "../services/propertyPlan.service";
import {
    PLAN_CONFIG,
    resolveChargeAmount,
    suspendListingsFor,
    restoreListingsFor,
} from "../services/subscription.service";
import { chargeTokenizedCard } from "../utils/flutterwave";
import cron from "node-cron";

const CHARGE_MODE: "detect" | "charge" = (process.env.RENEWAL_MODE as "detect" | "charge") ?? "detect";
const LOOK_AHEAD_DAYS = 3;
const MAX_RETRIES = 3;
/** Days between a subscription expiring and its listings being pulled.
 *  ENFORCED — suspendLapsedListings() below reads this, and the lapse email
 *  quotes the same date, so the promise and the behaviour cannot drift. */
const GRACE_DAYS = 7;

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

/** "12 Aug 2026" — short, unambiguous, and not US-ordered. */
/* ── GRACE-PERIOD ENFORCEMENT ─────────────────────────────────────────────────
   Second pass, run after the charge pass. Accounts that expired GRACE_DAYS ago
   and were never recovered lose their live listings here.

   Why a separate sweep rather than doing it inline at expiry: the grace period
   is the entire point. At expiry we promised the owner a week to fix their
   card, so the suspension has to happen on a later day than the decision to
   suspend — which means a query over elapsed deadlines, not a branch.

   listingsSuspendedAt is the idempotency guard: a suspended account is scanned
   every night forever (its period end stays in the past), and without the
   guard it would re-suspend and re-notify daily.
   ───────────────────────────────────────────────────────────────────────────── */
export async function suspendLapsedListings(
    now: Date,
    summary: RenewalSummary
): Promise<void> {
    const lapsed = await prisma.subscription.findMany({
        where: {
            isFreeRenterPlan: false,
            status: { in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED] },
            gracePeriodEndsAt: { lte: now },
            listingsSuspendedAt: null,
        },
        include: { user: { select: { email: true, name: true } } },
    });

    for (const sub of lapsed) {
        try {
            const hidden = await suspendListingsFor(sub.userId);

            await prisma.$transaction([
                prisma.subscription.update({
                    where: { id: sub.id },
                    data: { listingsSuspendedAt: now },
                }),
                // Grace is over — now the access flag actually comes down.
                prisma.user.update({
                    where: { id: sub.userId },
                    data: { isPremium: false },
                }),
                prisma.subscriptionHistory.create({
                    data: {
                        subscriptionId: sub.id,
                        userId: sub.userId,
                        eventType: SubscriptionEvent.SUSPENDED,
                        fromStatus: sub.status,
                        toStatus: sub.status,
                        triggeredBy: "system",
                        notes: `Grace period ended — ${hidden} listing(s) unpublished`,
                    },
                }),
            ]);
            summary.listingsSuspended++;

            // Only worth telling them if something actually changed. An owner
            // with no published listings gets silence, not a scary email about
            // listings they don't have.
            if (hidden > 0) {
                const planName = PLAN_CONFIG[sub.planType]?.name ?? "your plan";
                try {
                    await publishNotification({
                        userId: sub.userId,
                        kind: "payment",
                        title: "Your listings have been unpublished",
                        body: `${hidden} listing${hidden === 1 ? "" : "s"} hidden because ${planName} is unpaid. Update your card to put ${hidden === 1 ? "it" : "them"} back.`,
                        to: "/profile",
                        entityType: "subscription",
                        entityId: sub.id,
                    });
                } catch (err) {
                    console.error(`[renewals] suspend notification failed for ${sub.userId}:`, err);
                }
                if (sub.user.email) {
                    try {
                        await sendBrandedEmail(
                            sub.user.email,
                            EmailTemplates.listingsSuspended({
                                name: (sub.user.name ?? "there").split(" ")[0],
                                plan: planName,
                                count: hidden,
                                amount: Number(sub.finalAmountNaira ?? 0),
                            })
                        );
                    } catch (err) {
                        console.error(`[renewals] suspend email failed for ${sub.userId}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error(`[renewals] suspend failed for subscription ${sub.id}:`, err);
        }
    }
}

/** "12 Aug 2026" — short, unambiguous, and not US-ordered. */
function shortDate(d: Date): string {
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/* ── DUNNING ──────────────────────────────────────────────────────────────────
   Flutterwave's payment-plan machinery used to send these. It doesn't any
   more (no plan objects — see create-flw-plans.ts), so this job owns them.
   Without it the first thing a landlord notices is their listings archived.

   Every send is wrapped: a Mailgun outage or a Redis blip must never abort
   the renewal run or leave the subscription in a half-updated state. The DB
   write has already committed by the time this is called — the notification
   is the soft part, and it logs loudly rather than throwing.

   In-app notification AND email, deliberately. The in-app one is what they
   see when they next open the dashboard; the email is what reaches them when
   they don't. Both deep-link to /profile, where the card lives. */
async function notifyRenewalFailure(args: {
    userId: string;
    email: string | null;
    name: string | null;
    planName: string;
    amountNaira: number;
    attempts: number;
    /** Set when another attempt is scheduled; absent = the ladder is spent. */
    retryOn?: Date;
    /** Set on expiry when access continues for a while. */
    graceEndsAt?: Date;
}): Promise<void> {
    const firstName = (args.name ?? "there").split(" ")[0];
    const isFinal = !args.retryOn;

    try {
        await publishNotification({
            userId: args.userId,
            kind: "payment",
            title: isFinal ? "Subscription lapsed" : "We couldn't charge your card",
            body: isFinal
                ? `${args.planName} — ${formatNaira(args.amountNaira)} is unpaid after ${args.attempts} attempts. Update your card to restore your listings.`
                : `${args.planName} renewal of ${formatNaira(args.amountNaira)} was declined. We'll try again on ${shortDate(args.retryOn!)}.`,
            to: "/profile",
            entityType: "subscription",
            entityId: args.userId,
        });
    } catch (err) {
        console.error(`[renewals] notification failed for user ${args.userId}:`, err);
    }

    if (!args.email) {
        console.warn(`[renewals] no email on user ${args.userId} — dunning email skipped`);
        return;
    }

    try {
        const template = isFinal
            ? EmailTemplates.subscriptionLapsed({
                name: firstName,
                plan: args.planName,
                amount: args.amountNaira,
                attempts: args.attempts,
                graceEndsAt: args.graceEndsAt ? shortDate(args.graceEndsAt) : undefined,
            })
            : EmailTemplates.subscriptionPaymentFailed({
                name: firstName,
                plan: args.planName,
                retryOn: shortDate(args.retryOn!),
            });
        await sendBrandedEmail(args.email, template);
    } catch (err) {
        console.error(`[renewals] dunning email failed for user ${args.userId}:`, err);
    }
}

export { runRenewals };

export interface RenewalSummary {
    mode: string;
    scanned: number;
    renewed: number;
    flaggedPastDue: number;
    expired: number;
    skipped: number;
    /** Accounts whose grace period ran out this run and had listings pulled. */
    listingsSuspended: number;
    /** Listings republished because a lapsed account paid. */
    listingsRestored: number;
}

async function runRenewals(now = new Date()): Promise<RenewalSummary> {
    const summary: RenewalSummary = {
        mode: CHARGE_MODE,
        scanned: 0,
        renewed: 0,
        flaggedPastDue: 0,
        expired: 0,
        skipped: 0,
        listingsSuspended: 0,
        listingsRestored: 0,
    };
    const cutoff = addDays(now, LOOK_AHEAD_DAYS);

    if (CHARGE_MODE === "detect") {
        console.warn(
            "[renewals] RENEWAL_MODE=detect — no charges will be made. " +
            "Since payment_plan was removed, Flutterwave does not bill subscriptions " +
            "either, so nothing is being collected. Set RENEWAL_MODE=charge."
        );
    }

    const due = await prisma.subscription.findMany({
        where: {
            isFreeRenterPlan: false, // CRITICAL — never touch free renter records
            autoRenew: true,
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
            currentPeriodEnd: { lte: cutoff },
        },
        // name + email drive the dunning copy; nothing else new is needed.
        include: { user: { select: { email: true, name: true } } },
    });
    summary.scanned = due.length;

    for (const sub of due) {
        try {
            // Has THIS period already been paid (first charge, or a previous run
            // of this job)? If so, roll the period forward and move on.
            const periodStart = sub.currentPeriodEnd ?? now;
            const invoiceNumber = `NC-INV-${sub.id}-${periodStart.toISOString().slice(0, 10)}`;
            const paid = await prisma.subscriptionInvoice.findUnique({ where: { invoiceNumber } });
            if (paid?.status === "PAID") {
                summary.skipped++;
                continue;
            }

            if (CHARGE_MODE === "detect") {
                // Legacy Model A safety net: period lapsed with no paid invoice → flag/expire.
                if ((sub.currentPeriodEnd ?? now) <= now) {
                    await flagFailure({
                        id: sub.id, userId: sub.userId, fromStatus: sub.status,
                        prevFailures: sub.renewalFailureCount, now, summary,
                        note: "Auto-charge not confirmed for the new period",
                        planName: PLAN_CONFIG[sub.planType].name,
                        amountNaira: Number(sub.finalAmountNaira ?? 0),
                        email: sub.user.email, name: sub.user.name,
                    });
                } else {
                    summary.skipped++; // not lapsed yet
                }
                continue;
            }

            // CHARGE_MODE === "charge" — bill the saved token ourselves.
            await chargeOne(sub, sub.user.email, sub.user.name, periodStart, invoiceNumber, now, summary);
        } catch (err) {
            console.error(`[renewals] error on subscription ${sub.id}:`, err);
        }
    }

    // Second pass — enforce the grace deadline on accounts that already
    // expired. Runs in BOTH modes: detect mode takes no money, but an account
    // that lapsed a week ago should still not keep live listings.
    await suspendLapsedListings(now, summary);

    console.log(`[renewals] ${JSON.stringify(summary)}`);
    return summary;
}

async function chargeOne(
    sub: { id: string; userId: string; planType: keyof typeof PLAN_CONFIG; billingCycle: BillingCycle; status: SubscriptionStatus; renewalFailureCount: number; finalAmountNaira: unknown; flwCustomerToken: string | null },
    email: string,
    name: string | null,
    periodStart: Date,
    invoiceNumber: string,
    now: Date,
    summary: RenewalSummary
): Promise<void> {
    const cfg = PLAN_CONFIG[sub.planType];

    // ── 1. Close discontinued properties and apply scheduled tier changes
    //       BEFORE pricing, so the bill is for exactly what continues.
    if (cfg.perProperty) await applyScheduledLineChanges(sub.id, now);

    // ── 2. THE AMOUNT — recomputed from CURRENT data, not read off the
    //       subscription. Sums the live PropertySubscription lines, so a
    //       property added, re-tiered or discontinued mid-cycle is billed
    //       correctly from this cycle with no migration.
    //       No fallback to the plan price for per-property plans: an owner
    //       who discontinued every property owes ₦0 (the old `computed ||
    //       finalAmountNaira` billed them for a property they no longer pay for).
    const amount = cfg.perProperty
        ? await resolveChargeAmount(sub.userId, sub.planType)
        : (await resolveChargeAmount(sub.userId, sub.planType)) || Number(sub.finalAmountNaira ?? cfg.amountNaira);
    const periodEnd = getPeriodEnd(periodStart, sub.billingCycle);

    // ── 3. Claim the invoice (idempotency anchor) and reserve referral credit
    //       in the same transaction, FIFO by expiry.
    const { invoice, reservedKobo } = await prisma.$transaction(async (tx) => {
        const inv = await tx.subscriptionInvoice.upsert({
            where: { invoiceNumber },
            create: {
                subscriptionId: sub.id, userId: sub.userId, invoiceNumber,
                periodStart, periodEnd, amountNaira: amount, currency: "NGN", status: "PENDING",
            },
            // Re-price a PENDING invoice: a retry must charge what is owed today.
            update: { amountNaira: amount, periodEnd },
        });
        const reserved = inv.status === "PAID" ? 0n : await Referrals.reserveCredits(tx, sub.userId, inv.id, toKobo(amount));
        return { invoice: inv, reservedKobo: reserved };
    });
    if (invoice.status === "PAID") { summary.skipped++; return; }

    const chargeNaira = toNaira(toKobo(amount) - reservedKobo);
    // ++ FLW FEES — the card pays (bill − referral credit) + Flutterwave's cost,
    // rounded up to the naira. Credit never pays the processing fee.
    const charge = withProcessingFee(Math.max(0, chargeNaira));

    // ── 4a. Nothing to charge (no billable properties, or fully covered by
    //        credit): roll the period forward without touching Flutterwave.
    if (chargeNaira <= 0) {
        await markRenewed(sub, invoice.id, { txRef: `NC-NOCHARGE-${invoice.id}`, transactionId: null }, amount, 0, periodStart, periodEnd, now,
            amount === 0 ? "No billable properties this period" : "Covered by referral credit");
        await Referrals.confirmRedemptions(invoice.id, sub.userId);
        summary.renewed++;
        return;
    }

    if (!sub.flwCustomerToken) {
        await Referrals.releaseRedemptions(invoice.id);
        await flagFailure({
            id: sub.id, userId: sub.userId, fromStatus: sub.status,
            prevFailures: sub.renewalFailureCount, now, summary,
            note: "No saved card token",
            planName: cfg.name, amountNaira: charge.totalNaira,
            email, name,
        });
        return;
    }

    await prisma.subscriptionInvoice.update({ where: { id: invoice.id }, data: { processingFeeNaira: charge.processingFeeNaira } });

    const result = await chargeTokenizedCard({
        token: sub.flwCustomerToken,
        email,
        amount: charge.totalNaira,
        txRef: `NC-RENEW-${invoice.id}`,
        narration: `NewCondo ${cfg.name} renewal`,
        meta: { subscriptionId: sub.id, invoiceId: invoice.id, kind: "renewal" },
    });

    if (result.ok) {
        await markRenewed(sub, invoice.id, { txRef: result.txRef, transactionId: result.transactionId ? String(result.transactionId) : null }, amount, chargeNaira, periodStart, periodEnd, now,
            `Renewed until ${periodEnd.toISOString().slice(0, 10)}`, { grossNaira: charge.totalNaira, settledNaira: result.settledNaira ?? null });
        await Referrals.confirmRedemptions(invoice.id, sub.userId);
        summary.renewed++;

        // Referral engine — margin is computed on CASH collected, so a cycle
        // paid with credit generates no further reward downstream.
        const lines = cfg.perProperty
            ? await prisma.propertySubscription.findMany({ where: { subscriptionId: sub.id, status: "ACTIVE", cancelledAt: null }, select: { propertyId: true, planType: true } })
            : [];
        Referrals.emitReferralEvent({
            type: "subscription_payment_cleared",
            sourceType: "SUBSCRIPTION_PAYMENT",
            sourceId: invoice.id,
            occurredAt: now.toISOString(),
            subjectUserId: sub.userId,
            cashCollectedKobo: Number(toKobo(chargeNaira)),
            items: (cfg.perProperty && !lines.length ? [{ propertyId: null, planType: sub.planType }] : lines).map((l) => ({
                propertyId: l.propertyId, planCode: l.planType, amountKobo: Number(toKobo(PLAN_CONFIG[l.planType].amountNaira)),
            })),
        });

        // A successful charge on a PAST_DUE account is a recovery: republish
        // whatever the grace sweep hid.
        try {
            const restored = await restoreListingsFor(sub.userId);
            if (restored > 0) {
                summary.listingsRestored += restored;
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: { gracePeriodEndsAt: null, listingsSuspendedAt: null },
                });
                await publishNotification({
                    userId: sub.userId,
                    kind: "payment",
                    title: "Payment received — your listings are back",
                    body: `${restored} listing${restored === 1 ? "" : "s"} republished. Next billing ${shortDate(periodEnd)}.`,
                    to: "/properties",
                    entityType: "subscription",
                    entityId: sub.id,
                });
            }
        } catch (err) {
            console.error(`[renewals] listing restore failed for ${sub.userId}:`, err);
        }
        return;
    }

    await Referrals.releaseRedemptions(invoice.id);
    await prisma.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: { status: "FAILED", failureReason: `Charge ${result.status}`, retryCount: { increment: 1 }, nextRetryAt: addDays(now, 1) },
    });
    await flagFailure({
        id: sub.id, userId: sub.userId, fromStatus: sub.status,
        prevFailures: sub.renewalFailureCount, now, summary,
        note: `Renewal charge ${result.status}`,
        planName: cfg.name, amountNaira: charge.totalNaira,
        email, name,
    });
}

/** Period roll-forward + invoice PAID + ledger posting, in one transaction.
 *  The ledger key is the invoice id, so the webhook for the same charge
 *  (Flutterwave sends charge.completed for tokenized charges too) can never
 *  post it a second time. */
async function markRenewed(
    sub: { id: string; userId: string; status: SubscriptionStatus; planType: keyof typeof PLAN_CONFIG },
    invoiceId: string,
    ref: { txRef: string; transactionId: string | null },
    billedNaira: number,
    cashNaira: number,
    periodStart: Date,
    periodEnd: Date,
    now: Date,
    note: string,
    /** ++ FLW FEES — what the card was actually charged / what settled */
    collected?: { grossNaira: number; settledNaira: number | null }
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
            where: { id: sub.id },
            data: {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                nextRenewalAttempt: periodEnd,
                renewalFailureCount: 0,
                lastRenewalAttemptAt: now,
                flwTransactionRef: ref.txRef,
                amountNaira: billedNaira,
                finalAmountNaira: billedNaira,
            },
        });
        await tx.subscriptionInvoice.update({
            where: { id: invoiceId },
            data: { status: "PAID", flwTransactionRef: ref.txRef, flwTransactionId: ref.transactionId, paidAt: now },
        });
        if (cashNaira > 0) {
            await postLedger(tx, {
                idempotencyKey: `invoice:${invoiceId}`,
                type: "SUBSCRIPTION_COLLECTED",
                sourceType: "INVOICE",
                sourceId: invoiceId,
                memo: `${PLAN_CONFIG[sub.planType].name} renewal`,
                legs: collectionLegs({
                    via: "CHECKOUT",
                    receivedKobo: toKobo(collected?.grossNaira ?? withProcessingFee(cashNaira).totalNaira),
                    settledKobo: collected?.settledNaira != null ? toKobo(collected.settledNaira) : null,
                    dueKobo: toKobo(collected?.grossNaira ?? withProcessingFee(cashNaira).totalNaira),
                    allocations: [{ account: ACC.revenue, amountKobo: toKobo(cashNaira) }],
                }),
            });
        }
        await tx.subscriptionHistory.create({
            data: {
                subscriptionId: sub.id, userId: sub.userId,
                eventType: SubscriptionEvent.RENEWED,
                fromStatus: sub.status, toStatus: SubscriptionStatus.ACTIVE,
                flwTransactionRef: ref.txRef, amountCharged: cashNaira,
                triggeredBy: "system",
                notes: note,
            },
        });
        await tx.user.update({ where: { id: sub.userId }, data: { isPremium: true, premiumExpiresAt: periodEnd } });
    });
}

/* Positional args became unreadable once dunning needed the plan name, the
   amount and the user's contact details, so this takes an object. */
interface FlagFailureArgs {
    id: string;
    userId: string;
    fromStatus: SubscriptionStatus;
    prevFailures: number;
    now: Date;
    summary: RenewalSummary;
    note: string;
    planName: string;
    amountNaira: number;
    email: string | null;
    name: string | null;
}

async function flagFailure({
    id, userId, fromStatus, prevFailures, now, summary, note,
    planName, amountNaira, email, name,
}: FlagFailureArgs): Promise<void> {
    const failures = prevFailures + 1;
    if (failures >= MAX_RETRIES) {
        const graceEndsAt = addDays(now, GRACE_DAYS);
        await prisma.$transaction([
            prisma.subscription.update({
                where: { id },
                data: {
                    status: SubscriptionStatus.EXPIRED,
                    renewalFailureCount: failures,
                    lastRenewalAttemptAt: now,
                    // The deadline the email quotes. suspendLapsedListings()
                    // reads this field — one value, both behaviours.
                    gracePeriodEndsAt: graceEndsAt,
                },
            }),
            // Access rides until the grace period ends rather than being cut
            // the instant the third charge fails. isPremium stays true and
            // premiumExpiresAt carries the deadline, which is the shape
            // admin-service/revenueService.ts already queries
            // (isPremium: true AND premiumExpiresAt > now) — so a lapsed
            // account drops out of active-revenue figures on its own.
            prisma.user.update({
                where: { id: userId },
                data: { premiumExpiresAt: graceEndsAt },
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

        // Terminal: tell them plainly what lapsed and what did NOT.
        await notifyRenewalFailure({
            userId, email, name, planName, amountNaira, attempts: failures,
            graceEndsAt,
        });
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

        await notifyRenewalFailure({
            userId, email, name, planName, amountNaira, attempts: failures,
            retryOn: addDays(now, 1),
        });
    }
}

export function startRenewalCron() {
    cron.schedule("0 1 * * *", async () => {
        console.log("[cron] Starting renewal run...");
        try {
            const summary = await runRenewals();
            console.log("[cron] Renewal run complete:", summary);
        } catch (err) {
            console.error("[cron] Renewal run failed:", err);
        }
    }, {
        timezone: "Africa/Lagos",
    });

    console.log(`[cron] Renewal job scheduled — 1:00 AM WAT daily (mode: ${CHARGE_MODE})`);
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
