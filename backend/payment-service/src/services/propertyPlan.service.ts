// backend/payment-service/src/services/propertyPlan.service.ts
// ============================================================
// PER-PROPERTY PLANS — one owner account, one tier per property.
//
// THE LIFECYCLE
//   Onboarding  The owner pays for ONE seat before owning a listing
//               (Subscription.reservedSeat = true, planType = the tier).
//   1st listing allocatePropertyPlan() claims that seat: the property goes on
//               the tier they paid for, ₦0 extra. reservedSeat → false.
//   Next ones   NEEDS_PLAN. The owner picks a tier → quotePropertyPlan() →
//               startPropertyPlan() charges the days left in the current
//               period (saved card first, Inline checkout as fallback). From
//               the next renewal the property is billed in full with the rest.
//   Discontinue discontinuePropertyPlan() — service runs to the end of the
//               paid period, then the renewal closes the line and leaves it
//               out of the bill. The PROPERTY stays (only Delete removes it);
//               it goes off-market (offPlanAt) until a plan is chosen again.
//   Tier change changePropertyTier() — scheduled for the next renewal, never
//               mid-period, so nobody is billed twice for one month.
//
// Every number comes from subscriptionPlans.ts. Every charge is a
// SubscriptionInvoice + a ledger posting into platform:revenue.
// ============================================================
import { prisma, SubscriptionStatus, SubscriptionEvent, type SubscriptionPlan } from "@newcondo/db";
import {
  SUBSCRIPTION_PLANS, withCycle, requiresCustomQuote, totalForProperties,
  MONEY, ACC, postLedger, toKobo, collectionLegs, withProcessingFee, FLW_FEES, type FundingSource,
  publishNotification, badRequest, conflict, notFound, forbidden, flutterwaveConfig, formatNaira,
  type SubscriptionPlanCode, type PropertyLineItem,
} from "@newcondo/backend-shared";
import { chargeTokenizedCard } from "../utils/flutterwave";

const DAY = 24 * 3600_000;
const ACTIVE_SUB = [SubscriptionStatus.ACTIVE] as SubscriptionStatus[];

function assertOwnerTier(tier: string): SubscriptionPlanCode {
  const p = SUBSCRIPTION_PLANS[tier as SubscriptionPlanCode];
  if (!p || p.role !== "OWNER" || p.pricingUnit !== "PER_PROPERTY") throw badRequest("Choose an owner plan for this property");
  if (p.customPriced || !p.sellable) throw badRequest("This plan is quoted by our team — contact support");
  return p.code;
}

async function ownedProperty(ownerId: string, propertyId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, ownerId: true, status: true, boundaryVerified: true, adminApprovalStatus: true, offPlanAt: true, subscriptionLine: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== ownerId) throw forbidden("Only the property owner manages its plan");
  return p;
}

async function liveSubscription(ownerId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId: ownerId } });
  if (!sub || !ACTIVE_SUB.includes(sub.status)) throw conflict("Your Newcondo subscription isn't active — renew it first");
  if (sub.userRole !== "OWNER") throw forbidden("Property plans are for owner accounts");
  return sub;
}

/** Cycle-correct code: an annual account bills every property annually. */
const codeFor = (tier: SubscriptionPlanCode, cycle: string) => withCycle(tier, cycle === "ANNUAL" ? "ANNUAL" : "MONTHLY") as SubscriptionPlan;

/* ---------------- allocation (called by createProperty) ---------------- */

export type AllocationResult =
  | { status: "INCLUDED"; planType: SubscriptionPlan }
  | { status: "ALREADY_ON_PLAN"; planType: SubscriptionPlan }
  | { status: "NEEDS_PLAN" }
  | { status: "NO_SUBSCRIPTION" };

export async function allocatePropertyPlan(ownerId: string, propertyId: string): Promise<AllocationResult> {
  const sub = await prisma.subscription.findUnique({ where: { userId: ownerId } });
  if (!sub || !ACTIVE_SUB.includes(sub.status) || sub.userRole !== "OWNER") return { status: "NO_SUBSCRIPTION" };
  const existing = await prisma.propertySubscription.findUnique({ where: { propertyId } });
  if (existing && existing.status === "ACTIVE" && !existing.cancelledAt) return { status: "ALREADY_ON_PLAN", planType: existing.planType };

  if (sub.reservedSeat) {
    const claimed = await prisma.$transaction(async (tx) => {
      // Conditional flip — two listings created at once can't both claim it.
      const { count } = await tx.subscription.updateMany({ where: { id: sub.id, reservedSeat: true }, data: { reservedSeat: false } });
      if (!count) return false;
      await tx.propertySubscription.upsert({
        where: { propertyId },
        create: { subscriptionId: sub.id, propertyId, planType: sub.planType, status: "ACTIVE", included: true, startedAt: new Date() },
        update: { subscriptionId: sub.id, planType: sub.planType, status: "ACTIVE", included: true, cancelledAt: null, cancelAtPeriodEnd: false, nextPlanType: null },
      });
      await tx.subscriptionHistory.create({
        data: { subscriptionId: sub.id, userId: ownerId, eventType: SubscriptionEvent.PLAN_CHANGED, toPlan: sub.planType, triggeredBy: "system", notes: `Onboarding seat attached to property ${propertyId}` },
      });
      return true;
    });
    if (claimed) return { status: "INCLUDED", planType: sub.planType };
  }

  const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { title: true } });
  await publishNotification({
    userId: ownerId, kind: "payment", title: `Choose a plan for ${prop?.title ?? "your new property"}`,
    body: "Each property has its own service plan. Pick one to put it on the market — you only pay for the days left this period.",
    to: `/properties/${propertyId}`, entityType: "property", entityId: propertyId,
  });
  return { status: "NEEDS_PLAN" };
}

/* ---------------- quote ---------------- */

export interface PlanQuote {
  planType: SubscriptionPlan;
  name: string;
  unitNaira: number;
  /** Plan cost for the rest of the current period (0 = rides free to renewal). */
  dueNowNaira: number;
  /** ++ FLW FEES — Flutterwave's cost on dueNow, rounded up to the naira */
  processingFeeNaira: number;
  processingFeeLabel: string;
  /** what the card is actually charged now = dueNow + processing fee */
  totalDueNaira: number;
  /** What the whole account will be billed at the next renewal. */
  nextBillNaira: number;
  periodEnd: Date | null;
  cycle: string;
  savedCard: { last4: string | null; brand: string | null } | null;
  usesOnboardingSeat: boolean;
}

function prorate(unitNaira: number, start: Date | null, end: Date | null, now = new Date()): number {
  if (!start || !end || end <= now) return 0;
  const total = end.getTime() - start.getTime();
  const left = end.getTime() - now.getTime();
  const amount = Math.ceil((unitNaira * left) / total);
  return amount < MONEY.proration.minChargeNaira ? 0 : amount;
}

/** Sum of what the account owes next cycle, optionally with one extra line. */
export async function nextBillFor(subscriptionId: string, extra?: PropertyLineItem, excludePropertyId?: string): Promise<number> {
  const lines = await prisma.propertySubscription.findMany({
    where: { subscriptionId, status: "ACTIVE", cancelledAt: null, cancelAtPeriodEnd: false, ...(excludePropertyId ? { propertyId: { not: excludePropertyId } } : {}) },
    select: { planType: true, nextPlanType: true, customAmountNaira: true },
  });
  const items: PropertyLineItem[] = lines.map((l) => ({ planCode: (l.nextPlanType ?? l.planType) as SubscriptionPlanCode, customAmountNaira: l.customAmountNaira }));
  if (extra) items.push(extra);
  return totalForProperties(items);
}

export async function quotePropertyPlan(ownerId: string, propertyId: string, tier: string): Promise<PlanQuote> {
  const code = assertOwnerTier(tier);
  const [sub, prop] = await Promise.all([liveSubscription(ownerId), ownedProperty(ownerId, propertyId)]);
  if (requiresCustomQuote(prop.subscriptionLine?.plots)) throw badRequest("This property is larger than our self-serve plans cover. Request a quote.");
  const planType = codeFor(code, sub.billingCycle);
  const spec = SUBSCRIPTION_PLANS[planType as SubscriptionPlanCode];
  const seat = sub.reservedSeat;
  const dueNow = seat ? 0 : prorate(spec.amountNaira, sub.currentPeriodStart, sub.currentPeriodEnd);
  const charge = withProcessingFee(dueNow);
  return {
    planType,
    name: spec.name,
    unitNaira: spec.amountNaira,
    dueNowNaira: dueNow,
    processingFeeNaira: charge.processingFeeNaira,
    processingFeeLabel: FLW_FEES.label,
    totalDueNaira: charge.totalNaira,
    nextBillNaira: await nextBillFor(sub.id, { planCode: planType as SubscriptionPlanCode }, propertyId),
    periodEnd: sub.currentPeriodEnd,
    cycle: sub.billingCycle,
    savedCard: sub.flwCustomerToken ? { last4: sub.cardLast4, brand: sub.cardBrand } : null,
    usesOnboardingSeat: seat,
  };
}

/* ---------------- start (charge) ---------------- */

export type StartResult =
  | { status: "ACTIVE"; chargedNaira: number; line: { propertyId: string; planType: SubscriptionPlan } }
  | { status: "PENDING_PAYMENT"; chargedNaira: 0; checkout: Record<string, unknown>; savedCardFailure?: string };

export async function startPropertyPlan(opts: { ownerId: string; email: string; propertyId: string; tier: string }): Promise<StartResult> {
  const quote = await quotePropertyPlan(opts.ownerId, opts.propertyId, opts.tier);
  const sub = await liveSubscription(opts.ownerId);
  const prop = await ownedProperty(opts.ownerId, opts.propertyId);
  const line = prop.subscriptionLine;

  if (line && line.status === "ACTIVE" && !line.cancelledAt) {
    if (line.cancelAtPeriodEnd) {
      await resumePropertyPlan(opts.ownerId, opts.propertyId);
      if ((line.nextPlanType ?? line.planType) !== quote.planType) await changePropertyTier(opts.ownerId, opts.propertyId, opts.tier);
      return { status: "ACTIVE", chargedNaira: 0, line: { propertyId: opts.propertyId, planType: line.planType } };
    }
    throw conflict("This property already has a plan — change its tier instead");
  }

  // Never been billed for and the onboarding seat is free → attach it.
  if (quote.usesOnboardingSeat) {
    const a = await allocatePropertyPlan(opts.ownerId, opts.propertyId);
    if (a.status === "INCLUDED" && a.planType !== quote.planType) await changePropertyTier(opts.ownerId, opts.propertyId, opts.tier);
    if (a.status === "INCLUDED" || a.status === "ALREADY_ON_PLAN") {
      await restoreOffPlanListing(opts.propertyId);
      return { status: "ACTIVE", chargedNaira: 0, line: { propertyId: opts.propertyId, planType: a.planType } };
    }
  }

  const txRef = `NC-PSUB-${opts.propertyId.slice(-10)}-${Date.now()}`;
  const pending = await prisma.propertySubscription.upsert({
    where: { propertyId: opts.propertyId },
    create: { subscriptionId: sub.id, propertyId: opts.propertyId, planType: quote.planType, status: "PENDING_PAYMENT", pendingTxRef: txRef, proratedNaira: quote.dueNowNaira },
    update: { subscriptionId: sub.id, planType: quote.planType, status: "PENDING_PAYMENT", pendingTxRef: txRef, proratedNaira: quote.dueNowNaira, cancelledAt: null, cancelAtPeriodEnd: false, nextPlanType: null, included: false },
  });

  if (quote.dueNowNaira === 0) {
    await activatePropertyPlan(txRef, { transactionId: null, amountNaira: 0, settledNaira: 0, via: "CHECKOUT" });
    return { status: "ACTIVE", chargedNaira: 0, line: { propertyId: opts.propertyId, planType: quote.planType } };
  }

  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: sub.id, userId: opts.ownerId, invoiceNumber: `NC-PINV-${pending.id}-${Date.now()}`,
      periodStart: new Date(), periodEnd: sub.currentPeriodEnd ?? new Date(Date.now() + 30 * DAY),
      amountNaira: quote.dueNowNaira, processingFeeNaira: quote.processingFeeNaira, status: "PENDING", flwTransactionRef: txRef,
    },
  });

  let savedCardFailure: string | undefined;
  if (sub.flwCustomerToken) {
    const r = await chargeTokenizedCard({
      token: sub.flwCustomerToken, email: opts.email, amount: quote.totalDueNaira, txRef,
      narration: `Newcondo ${quote.name} — ${prop.title}`, meta: { kind: "property_plan", lineId: pending.id },
    });
    if (r.ok) {
      await activatePropertyPlan(txRef, { transactionId: r.transactionId ? String(r.transactionId) : null, amountNaira: quote.totalDueNaira, settledNaira: r.settledNaira ?? null, via: "CHECKOUT" });
      return { status: "ACTIVE", chargedNaira: quote.totalDueNaira, line: { propertyId: opts.propertyId, planType: quote.planType } };
    }
    savedCardFailure = r.status === "failed" ? "Your saved card was declined — pay with another card below." : "Your saved card couldn't be charged.";
  }

  return {
    status: "PENDING_PAYMENT",
    chargedNaira: 0,
    savedCardFailure,
    // Card-only, like subscriptions: the token it returns renews this line.
    checkout: {
      public_key: flutterwaveConfig.FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: quote.totalDueNaira,
      currency: "NGN",
      payment_options: "card",
      customer: { email: opts.email },
      customizations: { title: "Newcondo", description: `${quote.name} for ${prop.title} — ${formatNaira(quote.dueNowNaira)} for the rest of this period + ${formatNaira(quote.processingFeeNaira)} payment processing` },
      meta: { kind: "property_plan", lineId: pending.id },
    },
  };
}

/** Webhook / saved-card success (NC-PSUB-*). Idempotent on the line state. */
export async function activatePropertyPlan(
  txRef: string,
  paid: { transactionId: string | null; amountNaira: number; settledNaira?: number | null; via: FundingSource; cardToken?: string }
): Promise<{ activated: boolean }> {
  const line = await prisma.propertySubscription.findUnique({ where: { pendingTxRef: txRef }, include: { property: { select: { title: true, ownerId: true } } } });
  if (!line || line.status === "ACTIVE") return { activated: false };
  const invoice = await prisma.subscriptionInvoice.findFirst({ where: { flwTransactionRef: txRef } });
  const due = Number(invoice?.amountNaira ?? 0);
  if (due > 0 && paid.amountNaira + 0.001 < due) {
    console.error(`[propertyPlan] underpaid ${txRef}: got ${paid.amountNaira}, due ${due}`);
    return { activated: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.propertySubscription.update({ where: { id: line.id }, data: { status: "ACTIVE", pendingTxRef: null, startedAt: new Date() } });
    if (invoice) {
      await tx.subscriptionInvoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date(), flwTransactionId: paid.transactionId } });
      if (due > 0) {
        await postLedger(tx, {
          idempotencyKey: `invoice:${invoice.id}`,
          type: "PROPERTY_PLAN_COLLECTED",
          sourceType: "INVOICE",
          sourceId: invoice.id,
          memo: `Property plan — ${line.property.title}`,
          legs: collectionLegs({
            via: paid.via,
            receivedKobo: toKobo(paid.amountNaira || due),
            settledKobo: paid.settledNaira != null ? toKobo(paid.settledNaira) : null,
            dueKobo: toKobo(due + Number(invoice.processingFeeNaira ?? 0)),
            payerId: line.property.ownerId,
            allocations: [{ account: ACC.revenue, amountKobo: toKobo(due) }],
          }),
        });
      }
    }
    if (paid.cardToken) await tx.subscription.update({ where: { id: line.subscriptionId }, data: { flwCustomerToken: paid.cardToken } });
    await tx.subscriptionHistory.create({
      data: { subscriptionId: line.subscriptionId, userId: line.property.ownerId, eventType: SubscriptionEvent.PLAN_CHANGED, toPlan: line.planType, amountCharged: due, triggeredBy: "user", notes: `Property plan started — ${line.property.title}` },
    });
  });
  await restoreOffPlanListing(line.propertyId);
  await publishNotification({
    userId: line.property.ownerId, kind: "payment", title: `${line.property.title} is on ${SUBSCRIPTION_PLANS[line.planType as SubscriptionPlanCode].name}`,
    body: due > 0 ? `${formatNaira(paid.amountNaira || due)} charged for the rest of this period (incl. payment processing). It's billed with your other properties from the next renewal.` : "Included until your next renewal.",
    to: `/properties/${line.propertyId}`, entityType: "property", entityId: line.propertyId,
  });
  return { activated: true };
}

/* ---------------- discontinue / resume / change tier ---------------- */

export async function discontinuePropertyPlan(ownerId: string, propertyId: string) {
  const sub = await liveSubscription(ownerId);
  const prop = await ownedProperty(ownerId, propertyId);
  const line = prop.subscriptionLine;
  if (!line || line.status !== "ACTIVE" || line.cancelledAt) throw conflict("This property has no active plan");
  await prisma.propertySubscription.update({ where: { id: line.id }, data: { cancelAtPeriodEnd: true, nextPlanType: null } });
  const nextBill = await nextBillFor(sub.id);
  await publishNotification({
    userId: ownerId, kind: "payment", title: `Monthly service for ${prop.title} will stop`,
    body: `Services continue until ${sub.currentPeriodEnd?.toDateString() ?? "the end of this period"}. Your next bill: ${formatNaira(nextBill)}. The property stays in your account.`,
    to: `/properties/${propertyId}`, entityType: "property", entityId: propertyId,
  });
  return { endsAt: sub.currentPeriodEnd, nextBillNaira: nextBill };
}

export async function resumePropertyPlan(ownerId: string, propertyId: string) {
  const sub = await liveSubscription(ownerId);
  const prop = await ownedProperty(ownerId, propertyId);
  const line = prop.subscriptionLine;
  if (!line || line.status !== "ACTIVE" || line.cancelledAt || !line.cancelAtPeriodEnd) throw conflict("Nothing to resume");
  await prisma.propertySubscription.update({ where: { id: line.id }, data: { cancelAtPeriodEnd: false } });
  return { nextBillNaira: await nextBillFor(sub.id) };
}

export async function changePropertyTier(ownerId: string, propertyId: string, tier: string) {
  const code = assertOwnerTier(tier);
  const sub = await liveSubscription(ownerId);
  const prop = await ownedProperty(ownerId, propertyId);
  const line = prop.subscriptionLine;
  if (!line || line.status !== "ACTIVE" || line.cancelledAt) throw conflict("Choose a plan for this property first");
  const target = codeFor(code, sub.billingCycle);
  await prisma.propertySubscription.update({ where: { id: line.id }, data: { nextPlanType: target === line.planType ? null : target, cancelAtPeriodEnd: false } });
  return { effectiveFrom: sub.currentPeriodEnd, nextBillNaira: await nextBillFor(sub.id) };
}

/* ---------------- renewal hook ---------------- */

/** Run at the START of each renewal, before the amount is computed. Closes
 *  discontinued lines, applies scheduled tier changes, drops checkouts that
 *  were never paid. */
export async function applyScheduledLineChanges(subscriptionId: string, now = new Date()): Promise<{ closed: number; retiered: number }> {
  const closing = await prisma.propertySubscription.findMany({ where: { subscriptionId, cancelAtPeriodEnd: true, cancelledAt: null }, select: { id: true, propertyId: true } });
  for (const l of closing) {
    await prisma.$transaction([
      prisma.propertySubscription.update({ where: { id: l.id }, data: { status: "CANCELLED", cancelledAt: now, cancelAtPeriodEnd: false } }),
      // Off the market, not deleted. Tenancies and escrow are unaffected.
      prisma.property.updateMany({ where: { id: l.propertyId, status: "PUBLISHED" }, data: { status: "UNAVAILABLE" } }),
      prisma.property.update({ where: { id: l.propertyId }, data: { offPlanAt: now } }),
    ]);
  }
  const retier = await prisma.propertySubscription.findMany({ where: { subscriptionId, nextPlanType: { not: null }, status: "ACTIVE" }, select: { id: true, nextPlanType: true } });
  for (const l of retier) await prisma.propertySubscription.update({ where: { id: l.id }, data: { planType: l.nextPlanType!, nextPlanType: null } });
  await prisma.propertySubscription.deleteMany({ where: { subscriptionId, status: "PENDING_PAYMENT", updatedAt: { lt: new Date(now.getTime() - DAY) } } });
  return { closed: closing.length, retiered: retier.length };
}

/** A property back on a plan returns to the market only if it had earned its
 *  way there (marked + approved) before it went off-plan. */
async function restoreOffPlanListing(propertyId: string) {
  const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { offPlanAt: true, status: true, boundaryVerified: true, adminApprovalStatus: true } });
  if (!p?.offPlanAt) return;
  await prisma.property.update({
    where: { id: propertyId },
    data: { offPlanAt: null, ...(p.status === "UNAVAILABLE" && p.boundaryVerified && p.adminApprovalStatus === "APPROVED" ? { status: "PUBLISHED" } : {}) },
  });
}

/** Gate for anything that makes a property live. */
export async function assertPropertyHasPlan(propertyId: string): Promise<void> {
  const line = await prisma.propertySubscription.findUnique({ where: { propertyId }, select: { status: true, cancelledAt: true } });
  if (!line || line.status !== "ACTIVE" || line.cancelledAt) throw conflict("Choose a plan for this property before it goes live");
}

/** Commission on rent is a property-level benefit now (Premium = 15%). */
export async function commissionRateForProperty(propertyId: string): Promise<number> {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { subscriptionLine: { select: { planType: true, status: true, cancelledAt: true } }, owner: { select: { subscription: { select: { planType: true, status: true } } } } },
  });
  const line = p?.subscriptionLine;
  if (line && line.status === "ACTIVE" && !line.cancelledAt) return SUBSCRIPTION_PLANS[line.planType as SubscriptionPlanCode].commissionRate;
  const sub = p?.owner.subscription;
  if (sub && (sub.status === "ACTIVE" || sub.status === "FREE_ACTIVE")) return SUBSCRIPTION_PLANS[sub.planType as SubscriptionPlanCode].commissionRate;
  return SUBSCRIPTION_PLANS.OWNER_ESSENTIAL.commissionRate;
}

/* ---------------- dashboard ---------------- */

export async function billingSummary(ownerId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { userId: ownerId },
    include: { lines: { include: { property: { select: { title: true, status: true, offPlanAt: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!sub) return null;
  const props = await prisma.property.findMany({ where: { ownerId }, select: { id: true, title: true, subscriptionLine: { select: { id: true } } } });
  const spec = (c: string) => SUBSCRIPTION_PLANS[c as SubscriptionPlanCode];
  return {
    status: sub.status,
    cycle: sub.billingCycle,
    periodEnd: sub.currentPeriodEnd,
    reservedSeat: sub.reservedSeat ? { planType: sub.planType, name: spec(sub.planType).name } : null,
    savedCard: sub.flwCustomerToken ? { last4: sub.cardLast4, brand: sub.cardBrand } : null,
    nextBillNaira: sub.reservedSeat && !sub.lines.some((l) => l.status === "ACTIVE") ? spec(sub.planType).amountNaira : await nextBillFor(sub.id),
    lines: sub.lines.filter((l) => l.status !== "CANCELLED").map((l) => ({
      propertyId: l.propertyId,
      title: l.property.title,
      planType: l.planType,
      name: spec(l.planType).name,
      amountNaira: spec(l.nextPlanType ?? l.planType).customPriced ? l.customAmountNaira ?? 0 : spec(l.nextPlanType ?? l.planType).amountNaira,
      status: l.status,
      included: l.included,
      cancelAtPeriodEnd: l.cancelAtPeriodEnd,
      nextPlan: l.nextPlanType ? { planType: l.nextPlanType, name: spec(l.nextPlanType).name } : null,
    })),
    withoutPlan: props.filter((p) => !p.subscriptionLine || sub.lines.find((l) => l.propertyId === p.id)?.status === "CANCELLED").map((p) => ({ propertyId: p.id, title: p.title })),
  };
}

export async function propertyPlanFor(ownerId: string, propertyId: string) {
  const prop = await ownedProperty(ownerId, propertyId);
  const sub = await prisma.subscription.findUnique({ where: { userId: ownerId }, select: { currentPeriodEnd: true, reservedSeat: true, planType: true } });
  const l = prop.subscriptionLine;
  const spec = (c: string) => SUBSCRIPTION_PLANS[c as SubscriptionPlanCode];
  return {
    propertyId,
    periodEnd: sub?.currentPeriodEnd ?? null,
    canUseSeat: !!sub?.reservedSeat,
    offPlan: !!prop.offPlanAt,
    line: l && l.status !== "CANCELLED" ? {
      planType: l.planType, name: spec(l.planType).name, status: l.status, included: l.included,
      cancelAtPeriodEnd: l.cancelAtPeriodEnd, amountNaira: spec(l.planType).amountNaira,
      nextPlan: l.nextPlanType ? { planType: l.nextPlanType, name: spec(l.nextPlanType).name } : null,
    } : null,
  };
}
