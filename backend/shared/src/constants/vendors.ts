// backend/shared/src/constants/vendors.ts
// ============================================================
// BACKEND source of truth for the vendor network. Extends the client-safe
// ./vendorsPublic with the parts customers and vendors must not see in a
// bundle: per-visit costs (VENDOR_COSTS), scheduling policy, matching
// weights, code attempt limits and reminder-call rules.
// Exported from constants/index.ts (backend only) — NOT from frontend.ts.
//
// THE MONEY RULE (why visits land on the dates they do):
//   Every paid billing period moves the VENDOR COST share of an owner's plan
//   out of platform:revenue into that property's service fund
//   (fund:{propertyId}:{service}). A visit is only scheduled for a date by
//   which the fund will hold its cost, and the vendor is paid FROM that fund.
//   Newcondo's margin (VENDOR_COSTS.markupRate) never leaves revenue, so a
//   vendor can never be paid out of profit, and an upgrade/downgrade simply
//   changes the accrual rate — the replanner moves the dates to match.
// ============================================================
import { SUBSCRIPTION_PLANS, VENDOR_COSTS, type SubscriptionPlanCode } from "./subscriptionPlans";
import { VENDORS_PUBLIC, VENDOR_SERVICE_TYPES, type VendorServiceType, type VendorReleaseMode, type ReminderContactRole } from "./vendorsPublic";

export {
  VENDORS_PUBLIC, VENDOR_SERVICE_TYPES, providerServices, isServiceDay, normaliseWindow, minuteLabel,
} from "./vendorsPublic";
export type { VendorServiceType, VendorKind, VendorProviderType, VendorReleaseMode, ReminderContactRole } from "./vendorsPublic";

const COST: Record<VendorServiceType, number> = {
  FUMIGATION: VENDOR_COSTS.fumigationPerVisit,
  INSPECTION: VENDOR_COSTS.inspectionPerVisit,
  WASTE_MANAGEMENT: VENDOR_COSTS.wastePerMonth,
};

export const VENDORS = {
  ...VENDORS_PUBLIC,

  services: Object.fromEntries(VENDOR_SERVICE_TYPES.map((s) => [s, { ...VENDORS_PUBLIC.services[s], visitCostNaira: COST[s] }])) as
    Record<VendorServiceType, (typeof VENDORS_PUBLIC.services)[VendorServiceType] & { visitCostNaira: number }>,

  scheduling: {
    /** Annual (prepaid) plans: first visit this many days after the line starts. */
    firstVisitLeadDays: 7,
    wasteIntervalDays: 30,
    /** How far ahead a concrete date is booked. Further visits are projected only. */
    bookAheadDays: 45,
    /** Inside this window a booked visit is frozen: replans never move it. */
    freezeHours: 72,
    maxSearchDays: 21,
    /** Downgrade dropping a service: honour one last visit if already funded;
     *  otherwise the remainder returns to platform:revenue (/refund §03). */
    downgradeLeftover: "HONOR_IF_FUNDED" as "HONOR_IF_FUNDED" | "RETURN_TO_REVENUE",
  },

  matching: {
    ...VENDORS_PUBLIC.matching,
    /** Lower score wins. Load dominates so properties spread evenly. */
    weights: { load: 0.6, distance: 0.3, rating: 0.1 },
    /** One vendor per service across all of an owner's properties in an area. */
    keepOwnerWithOneVendor: true,
  },

  codes: {
    ...VENDORS_PUBLIC.codes,
    /** Wrong attempts allowed per job before it locks and support is alerted. */
    maxAttempts: 5,
  },

  /** "Flash" reminder: ring until someone answers, then hang up. */
  reminders: {
    services: ["FUMIGATION", "INSPECTION"] as VendorServiceType[],
    daysBefore: [2, 0],
    callAt: { daysBefore: "10:00", sameDay: "07:30" },
    ringSeconds: 40,
    retryMinutes: 20,
    attemptsPerContact: 2,
    contactOrder: ["TENANT", "LISTING_AGENT", "OWNER"] as ReminderContactRole[],
  },

  payout: { ...VENDORS_PUBLIC.payout, defaultReleaseMode: VENDORS_PUBLIC.payout.defaultReleaseMode as VendorReleaseMode },
};

/* ---------- plan → service helpers (use these; never re-derive inline) ---------- */

/** Visits per year a plan buys for a service. Waste = 12 monthly jobs. */
export function visitsPerYear(plan: SubscriptionPlanCode, service: VendorServiceType): number {
  const p = SUBSCRIPTION_PLANS[plan];
  if (!p || p.pricingUnit !== "PER_PROPERTY") return 0;
  if (service === "FUMIGATION") return p.fumigationsPerYear;
  if (service === "INSPECTION") return p.inspectionsPerYear;
  return p.wasteManagement === "MONTHLY" ? 12 : 0;
}

export const servicesForPlan = (plan: SubscriptionPlanCode): VendorServiceType[] =>
  VENDOR_SERVICE_TYPES.filter((s) => visitsPerYear(plan, s) > 0);

export const visitCostNaira = (service: VendorServiceType): number => COST[service];

/** Naira moved into the service fund for ONE MONTH of a plan — exactly the
 *  vendor cost; the markup stays in revenue. */
export const monthlyAccrualNaira = (plan: SubscriptionPlanCode, service: VendorServiceType): number =>
  Math.round((visitsPerYear(plan, service) * visitCostNaira(service)) / 12);

/** Even spacing between visits for a plan (days). */
export function visitIntervalDays(plan: SubscriptionPlanCode, service: VendorServiceType): number {
  if (service === "WASTE_MANAGEMENT") return VENDORS.scheduling.wasteIntervalDays;
  const n = visitsPerYear(plan, service);
  return n > 0 ? Math.round(365 / n) : 0;
}
