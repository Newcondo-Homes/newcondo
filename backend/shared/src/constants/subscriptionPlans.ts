// backend/shared/src/constants/subscriptionPlans.ts
// ============================================================
// SINGLE SOURCE OF TRUTH for subscription plans — price, service level,
// entitlements AND the marketing/UI copy. Everything reads from here:
//
//   backend  payment-service/src/services/subscription.service.ts  → PLAN_CONFIG
//            payment-service/src/jobs/renewSubscriptions.ts        → cycle recalc
//            payment-service/src/services/reviewAccess.service.ts  → entitlements
//   frontend apps/platform/lib/constants/business.ts (shim)         → selector,
//            pricing page, landing pricing, profile plan tab
//
// ⚠️ NO PRISMA IMPORTS IN THIS FILE. It is bundled into the Next.js client via
// the ./constants subpath; importing @newcondo/db would drag Prisma into the
// browser bundle. The codes below are plain string literals that MIRROR the
// Prisma `SubscriptionPlan` enum — the mirror is enforced at compile time on
// the backend side, where Prisma IS available (PLAN_CONFIG is typed
// Record<SubscriptionPlan, …>, so a missing or misspelt code fails the build).
//
// ── THE MODEL (resolved Sept 2026) ──────────────────────────────────────────
// A service tier is attached to a PROPERTY, not to an account. One landlord
// account holds many properties; each property is independently on Essential,
// Plus or Premium, and the monthly bill is the SUM over their properties. A
// landlord can run Property A on Premium and Property B on Essential.
// Property count does not gate which tier is available.
//
//   Tier       Fumigation  Inspection  Waste     Commission  Price/property/mo
//   Essential  1×/yr       —           monthly   20%         ₦10,500
//   Plus       1×/yr       1×/yr       monthly   20%         ₦12,500
//   Premium    2×/yr       2×/yr       monthly   15%         ₦18,250
//
// Commission is flat at 20% across Essential and Plus; only Premium reduces
// it, to 15%. Plus's value over Essential is the inspection reports, not a
// commission break. (An earlier draft had Plus at 17.5% — revised.)
// Commission is rent-transaction revenue and has no bearing on the
// fulfillment margin below, which is fumigation + inspection + waste only.
//
// Margin is held flat at ~45% across all three tiers, deliberately: no tier is
// quietly more profitable, so nothing incentivises pushing one over another.
// `costBasisFor(code)` recomputes it from VENDOR_COSTS below, so the margin is
// auditable and a vendor price change propagates instead of rotting in a
// comment.
//
// Self-serve covers a property up to MAX_PLOTS_SELF_SERVE plots. Bigger single
// properties are a custom quote; estates are a different billing unit
// entirely. See BILLING-MODEL.md §4–5.
//
// CHANGING A PRICE is a one-step operation now: edit amountNaira. There are no
// Flutterwave Plan objects to migrate — billing charges a saved card token for
// an amount this file computes each cycle (BILLING-MODEL.md).
// ============================================================

/* ---------- enum mirrors (keep in lockstep with packages/db/schema.prisma) ---------- */
export type SubscriptionPlanCode =
  | "OWNER_ESSENTIAL"
  | "OWNER_PLUS"
  | "OWNER_PREMIUM"
  | "OWNER_ESSENTIAL_ANNUAL"
  | "OWNER_PLUS_ANNUAL"
  | "OWNER_PREMIUM_ANNUAL"
  | "OWNER_CUSTOM"
  | "AGENT_ESSENTIAL"
  | "AGENT_PREMIUM"
  | "AGENT_ESSENTIAL_ANNUAL"
  | "AGENT_PREMIUM_ANNUAL"
  | "RENTER_FREE"
  | "RENTER_PREMIUM_PLUS";

export type PlanRole = "OWNER" | "AGENT" | "RENTER";
export type PlanCycle = "MONTHLY" | "ANNUAL";
/**
 * What one unit of the price buys.
 *  PER_PROPERTY — owner service tiers: the price covers ONE property's
 *    fumigation / waste / inspection schedule. An owner with three properties
 *    owes three units, and each may be on a different tier.
 *  PER_ACCOUNT — agent and renter plans: one price, whole account.
 */
export type PricingUnit = "PER_PROPERTY" | "PER_ACCOUNT";

export interface SubscriptionPlanSpec {
  code: SubscriptionPlanCode;
  role: PlanRole;
  cycle: PlanCycle;

  /** Stable UI id — what the selector, pages-data and URLs use. Shared by a
   *  plan and its annual twin; (role, uiId, cycle) resolves back to a code. */
  uiId: string;
  /** Other ids already in the wild for this plan — persisted onboarding
   *  drafts, /pricing?plan= links, and the marketing page (which calls the
   *  agent tiers "essential"/"premium" while the selector says
   *  "agent-essential"/"agent-premium"). All resolve to this code. */
  uiAliases?: string[];
  /** Display name in product + marketing ("Essential"). */
  name: string;

  /** The authoritative amount charged, in whole naira, for ONE unit. */
  amountNaira: number;
  pricingUnit: PricingUnit;
  /** Rendered after the price: "/property/month". */
  unitLabel: string;
  /** Optional struck-through "was" price (founding offers). */
  strikeAmountNaira?: number;
  /** Small print under the price. */
  priceNote?: string;

  tagline: string;
  features: string[];
  highlight?: boolean;
  badge?: string;

  /* service level — what the owner tiers actually differ on.
     `inspectionsPerYear` is the MOVE-IN / MOVE-OUT INSPECTION REPORT, which is
     a tiered service, not a universal one. It is defined here and ONLY here —
     never hardcode `true` for it in a comparison table (that bug shipped once
     already: a "Tenants & legal" row claimed Essential included inspections
     while the service-level row correctly showed a dash). */
  fumigationsPerYear: number;
  inspectionsPerYear: number;
  wasteManagement: "MONTHLY" | "NONE";

  /* entitlements — enforced server-side */
  propertyListingCap: number | null;
  canAccessMarkingJobs: boolean;
  isFreeRenterPlan: boolean;
  /** Commission on rent, as a decimal (0.175 = 17.5%). */
  commissionRate: number;
  /** Largest property this tier can be self-served for, in plots. null =
   *  not plot-bound (agent/renter plans, and OWNER_CUSTOM which is quoted). */
  maxPlots: number | null;

  /** false → hidden in the UI and never auto-billed (free renter tiers,
   *  OWNER_CUSTOM, and anything not launched yet). */
  sellable: boolean;
  /** true → the amount is not from this file; it lives on the subscription
   *  record, entered once by sales. */
  customPriced?: boolean;
  /** The annual counterpart, for the monthly/annual billing toggle. */
  annualCode?: SubscriptionPlanCode;
  /** The monthly counterpart — set on annual plans. */
  monthlyCode?: SubscriptionPlanCode;
}

/* ---------- property size ---------- */

/** A "property" = 1–3 buildings inside one fence, one owner, up to this many
 *  plots of land. At or under this, self-serve checkout prices it instantly.
 *  Above it, the flow must route to a custom quote — fumigation is exterior
 *  and waste is bin-emptying, so vendor cost is flat per COMPOUND, which is
 *  why the cap is plots and not buildings. */
export const MAX_PLOTS_SELF_SERVE = 3;

/** Working assumption for quoting a single compound above the cap: each extra
 *  plot adds this much to the fumigation + waste cost basis. NOT VALIDATED —
 *  pending real vendor quotes on larger jobs. Sales-facing tooling may use it
 *  as a starting point; never bill from it automatically. */
export const EXTRA_PLOT_COST_UPLIFT = 0.225; // +22.5%, midpoint of 20–25%

/* ---------- internal vendor economics (NEVER render to users) ----------
   These are the cash costs behind the service tiers, and the basis of the
   ~45% margin. Scope matters and is the reason costs are flat per compound:
     fumigation — EXTERIOR / compound only, not interior rooms
     waste      — bin-emptying only, not per housing unit
   Keep these out of any client-facing string; the frontend imports this
   module, so the numbers reach the browser bundle. Treat them as
   commercially sensitive but not secret. */
export const VENDOR_COSTS = {
  fumigationPerVisit: 20_000,
  inspectionPerVisit: 10_000,
  wastePerMonth: 3_000,
  markupRate: 0.25,
} as const;

const marked = (cost: number) => cost * (1 + VENDOR_COSTS.markupRate);

/** Monthly cost basis for one property on a tier, marked up — the denominator
 *  behind marginFor(). Essential ≈ ₦5,833, Plus ≈ ₦6,875, Premium ≈ ₦10,000. */
export const costBasisFor = (code: SubscriptionPlanCode): number => {
  const p = SUBSCRIPTION_PLANS[code];
  if (p.pricingUnit !== "PER_PROPERTY") return 0;
  const months = p.cycle === "ANNUAL" ? 12 : 1;
  const perMonth =
    (p.fumigationsPerYear * marked(VENDOR_COSTS.fumigationPerVisit)) / 12 +
    (p.inspectionsPerYear * marked(VENDOR_COSTS.inspectionPerVisit)) / 12 +
    (p.wasteManagement === "MONTHLY" ? marked(VENDOR_COSTS.wastePerMonth) : 0);
  return Math.round(perMonth * months);
};

/** Shared by every owner tier — platform features, not service level.
 *  NOTE: the move-in/move-out inspection report is NOT here. It is tiered
 *  (inspectionsPerYear) and putting it in the shared list is exactly how the
 *  contradictory comparison row got introduced. */
const OWNER_BASE_FEATURES = [
  "Escrow rent collection",
  "Identity-verified tenants",
  "Auto tenancy agreements",
  "Tenant blacklist access",
  "Monthly waste management",
  "Unlimited property listings",
];

/* ---------- the plans ---------- */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, SubscriptionPlanSpec> = {
  OWNER_ESSENTIAL: {
    code: "OWNER_ESSENTIAL", role: "OWNER", cycle: "MONTHLY",
    uiId: "essential", name: "Essential",
    amountNaira: 10_500, pricingUnit: "PER_PROPERTY", unitLabel: "/property/month",
    tagline: "Keep the property covered — fumigation, waste, escrow",
    features: [
      "1× exterior fumigation per year",
      ...OWNER_BASE_FEATURES,
      "20% platform commission",
    ],
    fumigationsPerYear: 1, inspectionsPerYear: 0, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, annualCode: "OWNER_ESSENTIAL_ANNUAL",
  },
  OWNER_PLUS: {
    code: "OWNER_PLUS", role: "OWNER", cycle: "MONTHLY",
    uiId: "plus", name: "Plus",
    amountNaira: 12_500, pricingUnit: "PER_PROPERTY", unitLabel: "/property/month",
    tagline: "Adds an inspection report at every tenant handover",
    features: [
      "1× exterior fumigation per year",
      "1× move-in / move-out inspection report per year",
      ...OWNER_BASE_FEATURES,
      "Priority marking agents",
      "Free re-listing when a tenant vacates",
      "20% platform commission",
    ],
    highlight: true, badge: "Most popular",
    fumigationsPerYear: 1, inspectionsPerYear: 1, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, annualCode: "OWNER_PLUS_ANNUAL",
  },
  OWNER_PREMIUM: {
    code: "OWNER_PREMIUM", role: "OWNER", cycle: "MONTHLY",
    // "elite" is the id this tier shipped under until Sept 2026 — kept as an
    // alias so saved onboarding drafts and /pricing?plan=elite links resolve.
    uiId: "premium", uiAliases: ["elite"], name: "Premium",
    amountNaira: 18_250, pricingUnit: "PER_PROPERTY", unitLabel: "/property/month",
    tagline: "Twice the cover, lowest commission — for owners who are away",
    features: [
      "2× exterior fumigation per year",
      "2× move-in / move-out inspection reports per year",
      ...OWNER_BASE_FEATURES,
      "Commission drops to 15%",
      "24-hour emergency maintenance",
      "Dedicated account manager",
      "Rent default insurance",
    ],
    fumigationsPerYear: 2, inspectionsPerYear: 2, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.15, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, annualCode: "OWNER_PREMIUM_ANNUAL",
  },

  OWNER_ESSENTIAL_ANNUAL: {
    code: "OWNER_ESSENTIAL_ANNUAL", role: "OWNER", cycle: "ANNUAL",
    uiId: "essential", name: "Essential",
    amountNaira: 105_000, // 10 months — 2 months free
    pricingUnit: "PER_PROPERTY", unitLabel: "/property/year",
    priceNote: "Billed yearly — 2 months free",
    tagline: "Keep the property covered — fumigation, waste, escrow",
    features: ["Everything in monthly Essential", "2 months free"],
    fumigationsPerYear: 1, inspectionsPerYear: 0, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, monthlyCode: "OWNER_ESSENTIAL",
  },
  OWNER_PLUS_ANNUAL: {
    code: "OWNER_PLUS_ANNUAL", role: "OWNER", cycle: "ANNUAL",
    uiId: "plus", name: "Plus",
    amountNaira: 125_000,
    pricingUnit: "PER_PROPERTY", unitLabel: "/property/year",
    priceNote: "Billed yearly — 2 months free",
    tagline: "Adds an inspection report at every tenant handover",
    features: ["Everything in monthly Plus", "2 months free"],
    highlight: true, badge: "Most popular",
    fumigationsPerYear: 1, inspectionsPerYear: 1, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, monthlyCode: "OWNER_PLUS",
  },
  OWNER_PREMIUM_ANNUAL: {
    code: "OWNER_PREMIUM_ANNUAL", role: "OWNER", cycle: "ANNUAL",
    uiId: "premium", uiAliases: ["elite"], name: "Premium",
    amountNaira: 182_500,
    pricingUnit: "PER_PROPERTY", unitLabel: "/property/year",
    priceNote: "Billed yearly — 2 months free",
    tagline: "Twice the cover, lowest commission — for owners who are away",
    features: ["Everything in monthly Premium", "2 months free"],
    fumigationsPerYear: 2, inspectionsPerYear: 2, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.15, maxPlots: MAX_PLOTS_SELF_SERVE,
    sellable: true, monthlyCode: "OWNER_PREMIUM",
  },

  /** Quoted by sales: single properties above MAX_PLOTS_SELF_SERVE plots, and
   *  properties inside an estate on a negotiated rate card. The amount is NOT
   *  in this file — it lives on the subscription/property record, entered once,
   *  then billed automatically like any other. amountNaira 0 is a sentinel:
   *  code that reads it without checking customPriced is a bug. */
  OWNER_CUSTOM: {
    code: "OWNER_CUSTOM", role: "OWNER", cycle: "MONTHLY",
    uiId: "custom", name: "Custom",
    amountNaira: 0, pricingUnit: "PER_PROPERTY", unitLabel: "/property/month",
    tagline: "Properties above 3 plots, and estates",
    features: [
      "Everything in Premium",
      "Priced to the size of the property",
      "Negotiated estate rate cards",
    ],
    fumigationsPerYear: 2, inspectionsPerYear: 2, wasteManagement: "MONTHLY",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.15, maxPlots: null,
    sellable: false, customPriced: true,
  },

  AGENT_ESSENTIAL: {
    code: "AGENT_ESSENTIAL", role: "AGENT", cycle: "MONTHLY",
    uiId: "agent-essential", uiAliases: ["essential"], name: "Essential",
    amountNaira: 2_000, pricingUnit: "PER_ACCOUNT", unitLabel: "/month",
    tagline: "Agents getting started — up to 5 listings",
    features: [
      "Up to 5 active listings",
      "GPS property marking",
      "Commission through the platform",
      "Standard verified-agent badge",
    ],
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: 5, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: null,
    sellable: true, annualCode: "AGENT_ESSENTIAL_ANNUAL",
  },
  AGENT_PREMIUM: {
    code: "AGENT_PREMIUM", role: "AGENT", cycle: "MONTHLY",
    uiId: "agent-premium", uiAliases: ["premium"], name: "Premium",
    amountNaira: 3_500, pricingUnit: "PER_ACCOUNT", unitLabel: "/month",
    tagline: "Full-time agents · every income stream",
    features: [
      "Everything in Essential",
      "Unlimited listings",
      "Marking-job queue access",
      "Referral income access",
      "Priority search placement",
    ],
    highlight: true, badge: "Founding: free for life",
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: null, canAccessMarkingJobs: true, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: null,
    sellable: true, annualCode: "AGENT_PREMIUM_ANNUAL",
  },
  AGENT_ESSENTIAL_ANNUAL: {
    code: "AGENT_ESSENTIAL_ANNUAL", role: "AGENT", cycle: "ANNUAL",
    uiId: "agent-essential", uiAliases: ["essential"], name: "Essential",
    amountNaira: 20_000, pricingUnit: "PER_ACCOUNT", unitLabel: "/year",
    priceNote: "Billed yearly — 2 months free",
    tagline: "Agents getting started — up to 5 listings",
    features: ["Everything in monthly Essential", "2 months free"],
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: 5, canAccessMarkingJobs: false, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: null,
    sellable: true, monthlyCode: "AGENT_ESSENTIAL",
  },
  AGENT_PREMIUM_ANNUAL: {
    code: "AGENT_PREMIUM_ANNUAL", role: "AGENT", cycle: "ANNUAL",
    uiId: "agent-premium", uiAliases: ["premium"], name: "Premium",
    amountNaira: 35_000, pricingUnit: "PER_ACCOUNT", unitLabel: "/year",
    priceNote: "Billed yearly — 2 months free",
    tagline: "Full-time agents · every income stream",
    features: ["Everything in monthly Premium", "2 months free"],
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: null, canAccessMarkingJobs: true, isFreeRenterPlan: false,
    commissionRate: 0.20, maxPlots: null,
    sellable: true, monthlyCode: "AGENT_PREMIUM",
  },

  RENTER_FREE: {
    code: "RENTER_FREE", role: "RENTER", cycle: "MONTHLY",
    uiId: "renter-free", name: "Free",
    amountNaira: 0, pricingUnit: "PER_ACCOUNT", unitLabel: "",
    tagline: "Browse and rent on Newcondo",
    features: ["Browse verified listings", "24-hour confirmation window"],
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: true,
    commissionRate: 0, maxPlots: null, sellable: false,
  },
  RENTER_PREMIUM_PLUS: {
    code: "RENTER_PREMIUM_PLUS", role: "RENTER", cycle: "MONTHLY",
    uiId: "renter-plus", uiAliases: ["plus", "premium-plus"], name: "Premium Plus",
    // Free right now — Subscription.renterPaidPlanUnlockedAt gates paid billing.
    // When it launches: set amountNaira to RENTER_LAUNCH_PRICING.premiumPlus,
    // sellable: true.
    amountNaira: 0, pricingUnit: "PER_ACCOUNT", unitLabel: "/month",
    strikeAmountNaira: 3_500, // = RENTER_LAUNCH_PRICING.premiumPlus
    priceNote: "Free for the first 300 founding renters",
    tagline: "Everything renters get on Newcondo",
    features: [
      "Browse & search verified listings",
      "24-hour confirmation & refund window",
      "Verified-listings-only view",
      "Early access to new listings",
      "Boosted referral bonus credits",
      "Priority customer support",
    ],
    highlight: true, badge: "Founding offer",
    fumigationsPerYear: 0, inspectionsPerYear: 0, wasteManagement: "NONE",
    propertyListingCap: null, canAccessMarkingJobs: false, isFreeRenterPlan: true,
    commissionRate: 0, maxPlots: null, sellable: false,
  },
};

/* ---------- renter pricing that has not launched yet ----------
   Renter billing is free today, but the marketing copy quotes the post-launch
   intent ("Basic Premium ₦1,500/mo and Premium Plus ₦3,500/mo"). Those two
   numbers had no home in the system — Basic Premium has no Prisma enum member
   — so they were hardcoded in pages-data.ts and in the old business.ts PLANS
   literal, where they had already drifted apart. They live here until the
   tiers become real plans. */
export const RENTER_LAUNCH_PRICING = {
  /** Future entry paid renter tier. No SubscriptionPlan code yet. */
  basicPremium: 1_500,
  /** Post-launch price of RENTER_PREMIUM_PLUS; the founding locked rate. */
  premiumPlus: 3_500,
} as const;

/** The self-serve owner tiers, cheapest first — the marketing page's column
 *  order. OWNER_CUSTOM is excluded: it is a sales conversation, not a card. */
export const OWNER_TIER_ORDER: SubscriptionPlanCode[] = [
  "OWNER_ESSENTIAL",
  "OWNER_PLUS",
  "OWNER_PREMIUM",
];

/* ---------- derived helpers (use these, don't re-filter inline) ---------- */

export const ALL_PLAN_CODES = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanCode[];

export const planByCode = (code: SubscriptionPlanCode): SubscriptionPlanSpec =>
  SUBSCRIPTION_PLANS[code];

/** Plans to show a role, in display order, for one billing cycle. Custom and
 *  unlaunched plans are excluded — use ALL_PLAN_CODES if you need everything. */
export const plansFor = (
  role: PlanRole | string,
  cycle: PlanCycle = "MONTHLY"
): SubscriptionPlanSpec[] => {
  const r = planRoleFrom(role);
  return ALL_PLAN_CODES.map((c) => SUBSCRIPTION_PLANS[c]).filter(
    (p) => p.role === r && p.cycle === cycle && !p.customPriced
  );
};

/** Plans billed automatically from this file's amounts. */
export const sellablePlans = (): SubscriptionPlanSpec[] =>
  ALL_PLAN_CODES.map((c) => SUBSCRIPTION_PLANS[c]).filter((p) => p.sellable);

/** The frontend's UserType enum carries PROPERTY_MANAGER and ADMIN too —
 *  neither sells plans. Anything unrecognised is treated as an owner, which
 *  is what the old code did by falling back to PLANS_BY_ROLE[OWNER]. */
export function planRoleFrom(role: string): PlanRole {
  const r = String(role).toUpperCase();
  if (r.includes("AGENT")) return "AGENT";
  if (r.includes("RENTER") || r.includes("TENANT")) return "RENTER";
  return "OWNER";
}

/** (role, uiId, cycle) → plan code. Replaces the regex guess in
 *  apps/platform/lib/api/subscriptions.ts::resolveSubscriptionPlanCode. */
export function resolvePlanCode(
  role: PlanRole | string,
  uiId: string,
  cycle: PlanCycle = "MONTHLY"
): SubscriptionPlanCode {
  const r = planRoleFrom(role);
  const id = uiId.toLowerCase();
  const match = plansFor(r, cycle).find(
    (p) => p.uiId.toLowerCase() === id || p.uiAliases?.some((a) => a.toLowerCase() === id)
  );
  if (match) return match.code;
  // Fall back to the role's entry tier rather than throwing — the caller is
  // usually a UI id from persisted onboarding state, which can go stale.
  const fallback = plansFor(r, cycle)[0] ?? SUBSCRIPTION_PLANS.OWNER_ESSENTIAL;
  return fallback.code;
}

/** Switch a code between billing cycles; returns the same code if there is no twin. */
export const withCycle = (
  code: SubscriptionPlanCode,
  cycle: PlanCycle
): SubscriptionPlanCode => {
  const p = SUBSCRIPTION_PLANS[code];
  if (p.cycle === cycle) return code;
  return (cycle === "ANNUAL" ? p.annualCode : p.monthlyCode) ?? code;
};

/** ₦10,500 — the one formatter, so the symbol and separators never drift. */
export const formatNairaa = (amount: number): string =>
  `₦${amount.toLocaleString("en-NG")}`;

/** "20%" / "17.5%" — one decimal only when there is one. Every current rate
 *  is a whole number, but this stays the single rate formatter: the moment a
 *  half-point rate is introduced, `Math.round(r * 100)` renders it wrong (17.5
 *  → 18) and the bug is invisible in review. Format rates through here. */
export const formatRate = (rate: number): string =>
  `${Math.round(rate * 1000) / 10}%`;

/** Commission rate for a plan, as a decimal. Owner Premium = 0.15. */
export const commissionRateFor = (code: SubscriptionPlanCode): number =>
  SUBSCRIPTION_PLANS[code].commissionRate;

/** Monthly-equivalent of an annual plan — for "saves you ₦X" copy. */
export const monthlyEquivalent = (code: SubscriptionPlanCode): number => {
  const p = SUBSCRIPTION_PLANS[code];
  return p.cycle === "ANNUAL" ? Math.round(p.amountNaira / 12) : p.amountNaira;
};

/** Annual saving vs paying monthly for 12 months. 0 when there is no twin. */
export const annualSaving = (code: SubscriptionPlanCode): number => {
  const annual = SUBSCRIPTION_PLANS[withCycle(code, "ANNUAL")];
  const monthly = SUBSCRIPTION_PLANS[withCycle(code, "MONTHLY")];
  if (annual.cycle !== "ANNUAL" || monthly.cycle !== "MONTHLY") return 0;
  return Math.max(0, monthly.amountNaira * 12 - annual.amountNaira);
};

/** Gross margin on one unit against its cost basis. ~0.45 on every owner
 *  tier, by design. 0 for plans with no per-unit service cost. */
export const marginFor = (code: SubscriptionPlanCode): number => {
  const p = SUBSCRIPTION_PLANS[code];
  if (!p.amountNaira) return 0;
  const basis = costBasisFor(code);
  if (!basis) return 0;
  return (p.amountNaira - basis) / p.amountNaira;
};

/** true when a property of this many plots must go to sales instead of
 *  self-serve checkout. Unknown plot count (undefined/0) is treated as within
 *  the cap — do not block a checkout on data you never collected. */
export const requiresCustomQuote = (plots?: number | null): boolean =>
  typeof plots === "number" && plots > MAX_PLOTS_SELF_SERVE;

/** One property's line item. `customAmountNaira` is required when the tier is
 *  custom-priced — sales enters it once onto the record. */
export interface PropertyLineItem {
  planCode: SubscriptionPlanCode;
  customAmountNaira?: number | null;
}

/** Amount for a single property line. */
export const amountForProperty = (item: PropertyLineItem): number => {
  const p = SUBSCRIPTION_PLANS[item.planCode];
  if (p.customPriced) return item.customAmountNaira ?? 0;
  return p.amountNaira;
};

/** THE BILL. Sum over an account's properties, each on its own tier. This is
 *  what the recurring-charge job charges the saved card token for — see
 *  BILLING-MODEL.md. Owners with no properties owe nothing. */
export const totalForProperties = (items: PropertyLineItem[]): number =>
  items.reduce((sum, item) => sum + amountForProperty(item), 0);

/* ---------- legacy shape ----------
   business.ts used to export a hand-written PLANS object. Kept as a derived
   view so existing imports keep compiling; delete once nothing reads it. */
export const PLANS = {
  owner: {
    essential: { name: SUBSCRIPTION_PLANS.OWNER_ESSENTIAL.name, price: SUBSCRIPTION_PLANS.OWNER_ESSENTIAL.amountNaira },
    plus: { name: SUBSCRIPTION_PLANS.OWNER_PLUS.name, price: SUBSCRIPTION_PLANS.OWNER_PLUS.amountNaira },
    premium: { name: SUBSCRIPTION_PLANS.OWNER_PREMIUM.name, price: SUBSCRIPTION_PLANS.OWNER_PREMIUM.amountNaira },
  },
  agent: {
    essential: { name: SUBSCRIPTION_PLANS.AGENT_ESSENTIAL.name, price: SUBSCRIPTION_PLANS.AGENT_ESSENTIAL.amountNaira },
    premium: { name: SUBSCRIPTION_PLANS.AGENT_PREMIUM.name, price: SUBSCRIPTION_PLANS.AGENT_PREMIUM.amountNaira },
  },
  renter: {
    free: { name: SUBSCRIPTION_PLANS.RENTER_FREE.name, price: SUBSCRIPTION_PLANS.RENTER_FREE.amountNaira },
    premium: { name: SUBSCRIPTION_PLANS.RENTER_PREMIUM_PLUS.name, price: SUBSCRIPTION_PLANS.RENTER_PREMIUM_PLUS.amountNaira },
  },
} as const;
