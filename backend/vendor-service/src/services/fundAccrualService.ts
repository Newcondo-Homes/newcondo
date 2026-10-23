// backend/vendor-service/src/services/fundAccrualService.ts
// ============================================================
// Moves the vendor-cost share of every PAID billing period into each
// property's service fund (shared money/serviceFunds.ts). Driven purely by DB
// state, so payment-service needs no changes to feed it:
//
//   for each PAID SubscriptionInvoice in the look-back window
//     for each ACTIVE (or since-cancelled) PropertySubscription line on it
//       months = whole period if the line existed at periodStart,
//                otherwise the fraction of the period left when it started
//                (that's what the prorated mid-period charge paid for)
//       accrueServiceFunds(..., idempotencyBase = "inv:{invoiceId}")
//
// Idempotent per (invoice, property, service) via the ledger's unique key —
// running it every few minutes, or twice, posts nothing new.
// The onboarding checkout that pays the reserved first seat may not write a
// SubscriptionInvoice; for a line whose start no invoice covers, the
// subscription's current period is used instead ("sub:{id}:{periodStart}").
// ============================================================
import { prisma } from "@newcondo/db";
import { accrueServiceFunds, type SubscriptionPlanCode } from "@newcondo/backend-shared";

const LOOKBACK_DAYS = 400; // covers annual plans

interface Line { id: string; propertyId: string; planType: string; startedAt: Date; cancelledAt: Date | null; status: string }

function monthsCovered(periodStart: Date, periodEnd: Date, line: Line, annual: boolean): number {
  const span = periodEnd.getTime() - periodStart.getTime();
  if (span <= 0) return 0;
  const fullMonths = annual ? 12 : Math.max(1, Math.round(span / (30.44 * 86_400_000)));
  if (line.startedAt <= periodStart) return fullMonths;
  if (line.startedAt >= periodEnd) return 0;
  return Math.round(fullMonths * ((periodEnd.getTime() - line.startedAt.getTime()) / span) * 100) / 100;
}

const lineCountsFor = (l: Line, periodStart: Date) =>
  (l.status === "ACTIVE" || (l.cancelledAt && l.cancelledAt > periodStart));

export async function accrueFromPaidPeriods(now = new Date()): Promise<{ invoices: number; postings: number }> {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
  const invoices = await prisma.subscriptionInvoice.findMany({
    where: { status: "PAID", paidAt: { gte: since }, subscription: { userRole: "OWNER" } },
    select: { id: true, periodStart: true, periodEnd: true, subscription: { select: { billingCycle: true, lines: { select: { id: true, propertyId: true, planType: true, startedAt: true, cancelledAt: true, status: true } } } } },
    take: 2000,
  });
  let postings = 0;
  for (const inv of invoices) {
    for (const line of inv.subscription.lines as Line[]) {
      if (!lineCountsFor(line, inv.periodStart)) continue;
      const months = monthsCovered(inv.periodStart, inv.periodEnd, line, inv.subscription.billingCycle === "ANNUAL");
      if (months <= 0) continue;
      const done = await prisma.$transaction((tx) => accrueServiceFunds(tx, {
        propertyId: line.propertyId, planCode: line.planType as SubscriptionPlanCode, months,
        idempotencyBase: `inv:${inv.id}`, sourceType: "INVOICE", sourceId: inv.id,
      }));
      postings += done.length;
    }
  }
  postings += await accrueUninvoicedSeats(now);
  return { invoices: invoices.length, postings };
}

/** Lines whose start no PAID invoice covers (the onboarding seat). */
async function accrueUninvoicedSeats(now: Date): Promise<number> {
  const subs = await prisma.subscription.findMany({
    where: { userRole: "OWNER", status: { in: ["ACTIVE", "TRIAL"] }, currentPeriodStart: { not: null }, currentPeriodEnd: { gt: now } },
    select: { id: true, billingCycle: true, currentPeriodStart: true, currentPeriodEnd: true, invoices: { where: { status: "PAID" }, select: { periodStart: true, periodEnd: true } }, lines: { where: { status: "ACTIVE" }, select: { id: true, propertyId: true, planType: true, startedAt: true, cancelledAt: true, status: true } } },
    take: 2000,
  });
  let n = 0;
  for (const s of subs) {
    const ps = s.currentPeriodStart!, pe = s.currentPeriodEnd!;
    if (s.invoices.some((i) => i.periodStart <= ps && i.periodEnd > ps)) continue; // invoiced — handled above
    for (const line of s.lines as Line[]) {
      const months = monthsCovered(ps, pe, line, s.billingCycle === "ANNUAL");
      if (months <= 0) continue;
      const done = await prisma.$transaction((tx) => accrueServiceFunds(tx, {
        propertyId: line.propertyId, planCode: line.planType as SubscriptionPlanCode, months,
        idempotencyBase: `sub:${s.id}:${ps.toISOString().slice(0, 10)}`, sourceType: "PROPERTY_LINE", sourceId: line.id,
      }));
      n += done.length;
    }
  }
  return n;
}
