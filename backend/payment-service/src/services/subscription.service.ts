import { prisma, SubscriptionPlan, SubscriptionStatus, BillingCycle, Role, SubscriptionEvent, PropertyStatus } from "@newcondo/db";
import axios from "axios";
import type { Subscription } from "@newcondo/db";
import {
  sendBrandedEmail,
  EmailTemplates,
  // ++ plan data — the single source of truth (backend/shared/src/constants/
  // subscriptionPlans.ts). The frontend renders from the same file.
  SUBSCRIPTION_PLANS,
  planByCode,
  planRoleFrom,
  amountForProperty,
  totalForProperties,
  requiresCustomQuote,
  formatNaira,
  RENTER_LAUNCH_PRICING,
  type PropertyLineItem,
} from "@newcondo/backend-shared";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL = process.env.APP_URL!; // e.g. https://newcondo.homes

// ─── Plan config — DERIVED from the shared constant ──────────────────────────
// The shape is unchanged: every existing consumer (renewSubscriptions.ts,
// reviewAccess.service.ts) keeps reading PLAN_CONFIG[planType].amountNaira /
// .isFreeRenterPlan / .propertyListingCap / .canAccessMarkingJobs / .userRole /
// .billingCycle / .commissionRate exactly as before.
//
// What changed is where the NUMBERS come from. They were typed out here, and
// also in apps/platform (plan-selector, pages-data, pricing) — so a price
// change meant editing four files and the marketing page quietly drifted from
// the charge. Now: one file, both sides.
//
// The `Record<SubscriptionPlan, …>` annotation is the guard that makes this
// safe: the shared constant mirrors the Prisma enum as string literals, and if
// the two drift (a member added to one and not the other) this file fails to
// compile instead of failing at runtime on a customer's checkout.
//
// Owner tiers are PER PROPERTY as of Sept 2026 — amountNaira here is one
// property's price. The account total is the sum over PropertySubscription
// lines; see resolveChargeAmount below.
export const PLAN_CONFIG: Record<
  SubscriptionPlan,
  {
    userRole: Role;
    amountNaira: number;
    billingCycle: BillingCycle;
    propertyListingCap: number | null;
    canAccessMarkingJobs: boolean;
    isFreeRenterPlan: boolean;
    commissionRate: number; // as decimal e.g. 0.15
    /** true → price is per property, not per account. Owner tiers only. */
    perProperty: boolean;
    /** true → amount lives on the subscription record (quoted by sales). */
    customPriced: boolean;
    /** Display name, for Flutterwave customisations and emails. */
    name: string;
  }
> = Object.fromEntries(
  (Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((code) => {
    const p = planByCode(code);
    return [
      code,
      {
        userRole: Role[p.role as keyof typeof Role],
        amountNaira: p.amountNaira,
        billingCycle: p.cycle === "ANNUAL" ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
        propertyListingCap: p.propertyListingCap,
        canAccessMarkingJobs: p.canAccessMarkingJobs,
        isFreeRenterPlan: p.isFreeRenterPlan,
        commissionRate: p.commissionRate,
        perProperty: p.pricingUnit === "PER_PROPERTY",
        customPriced: !!p.customPriced,
        name: p.name,
      },
    ];
  })
) as Record<SubscriptionPlan, {
  userRole: Role;
  amountNaira: number;
  billingCycle: BillingCycle;
  propertyListingCap: number | null;
  canAccessMarkingJobs: boolean;
  isFreeRenterPlan: boolean;
  commissionRate: number;
  perProperty: boolean;
  customPriced: boolean;
  name: string;
}>;

// ─── Get period end date from start ──────────────────────────────────────────
function getPeriodEnd(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === BillingCycle.MONTHLY) {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

// ─── Count founding cohort members ───────────────────────────────────────────
async function getNextFoundingNumber(field: "foundingAgentNumber" | "foundingMemberNumber") {
  // Count existing founding members to get the next number
  const count = await prisma.subscription.count({
    where: field === "foundingAgentNumber"
      ? { isFoundingAgent: true }
      : { isFoundingMember: true },
  });
  return count + 1; // e.g. if 47 exist, this person is #48
}

// ─── THE BILL ────────────────────────────────────────────────────────────────
// An owner's tier belongs to a PROPERTY, not the account: each property is
// independently on Essential, Plus, Premium or a quoted custom rate, and the
// amount owed is the SUM over their active lines. A landlord can run the flat
// they rent out from abroad on Premium and leave the rest on Essential.
//
// On a first subscribe there is one line (or none yet), so this returns the
// same figure the old code did — which is why it is safe to ship before the
// per-property UI exists.
//
// Agent and renter plans are per-account: one price, no summing.
export async function resolveChargeAmount(
  userId: string,
  planType: SubscriptionPlan,
  customAmountNaira?: number | null
): Promise<number> {
  const config = PLAN_CONFIG[planType];

  if (config.customPriced && !customAmountNaira) {
    // OWNER_CUSTOM has no price in the constant (amountNaira is a 0 sentinel).
    // Charging it would take a property live for free.
    throw new Error("This property is on a custom rate that has not been quoted yet.");
  }

  if (!config.perProperty) {
    return amountForProperty({ planCode: planType, customAmountNaira });
  }

  const lines = (await prisma.propertySubscription.findMany({
    where: { subscription: { userId }, cancelledAt: null },
    select: { planType: true, customAmountNaira: true },
  })) as unknown as PropertyLineItem[];

  return lines.length
    ? totalForProperties(lines)
    : amountForProperty({ planCode: planType, customAmountNaira });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FREE RENTER SIGNUP — called automatically when a new RENTER registers
// ─────────────────────────────────────────────────────────────────────────────
export async function createFreeRenterSubscription(userId: string): Promise<Subscription> {
  // Check if subscription already exists (idempotent)
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  // Check founding cohort — is this renter within the first 300?
  const foundingCount = await prisma.subscription.count({
    where: { isFoundingMember: true },
  });
  const isFoundingMember = foundingCount < 300;
  const planType = isFoundingMember
    ? SubscriptionPlan.RENTER_PREMIUM_PLUS
    : SubscriptionPlan.RENTER_FREE;

  const foundingMemberNumber = isFoundingMember
    ? await getNextFoundingNumber("foundingMemberNumber")
    : null;

  const now = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planType,
      billingCycle: BillingCycle.MONTHLY,
      userRole: Role.RENTER,
      amountNaira: 0,
      finalAmountNaira: 0,
      status: SubscriptionStatus.FREE_ACTIVE,
      isFreeRenterPlan: true,
      currentPeriodStart: now,
      currentPeriodEnd: null, // Free plans never expire
      isFoundingMember,
      foundingMemberNumber,
      // The locked rate the founding cohort keeps when renter billing launches.
      // Reads from the shared constant so this and the "₦3,500/mo after launch"
      // line on the pricing page cannot disagree.
      lockedRateNaira: isFoundingMember ? RENTER_LAUNCH_PRICING.premiumPlus : null,
      canAccessMarkingJobs: false,
      autoRenew: false, // No auto-renewal for free plans
    },
  });

  // Log event
  await prisma.subscriptionHistory.create({
    data: {
      subscriptionId: subscription.id,
      userId,
      eventType: SubscriptionEvent.FREE_ACCESS_GRANTED,
      toStatus: SubscriptionStatus.FREE_ACTIVE,
      toPlan: planType,
      triggeredBy: "system",
      notes: isFoundingMember
        ? `Founding member #${foundingMemberNumber} — Premium Plus locked rate ${formatNaira(RENTER_LAUNCH_PRICING.premiumPlus)}`
        : "Free plan assigned on registration",
    },
  });


  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { email: true, name: true, role: true },
  });
  if (user?.email) {
    await sendBrandedEmail(
      user.email,
      EmailTemplates.welcome({
        name: user.name ?? "there",
        // ADMIN never reaches this path, but the template's union is narrow —
        // narrow it here rather than casting the check away.
        role: (user.role === "ADMIN" ? "OWNER" : user.role) as "OWNER" | "AGENT" | "RENTER",
      })
    );
  }

  // If founding member on Premium Plus — create virtual account
  if (isFoundingMember) {
    await triggerVirtualAccountCreation(userId, subscription.id);
  }

  return subscription;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INITIATE PAID SUBSCRIPTION — owners and agents only for now
//    Returns a Flutterwave payload to open in the Inline modal
//
//    ⚠️ NO `payment_plan` ANY MORE. A Flutterwave payment plan is ONE FIXED
//    AMOUNT on a fixed interval, and it PINS the charge server-side — FLW
//    rejects a charge whose amount differs. That cannot express per-property
//    owner pricing, where the bill changes whenever a property is added,
//    re-tiered or re-quoted. So we charge once with tokenization, keep the
//    card token (activateSubscription, below), and bill that token each cycle
//    for an amount recomputed from the DB — renewSubscriptions.ts with
//    RENEWAL_MODE=charge.
//
//    This also removes the `flutterwavePlan.findUniqueOrThrow` that 500'd
//    every paid checkout after the db:reset emptied that table.
//
//    THE TRADE, stated plainly: Flutterwave's plan machinery owned retry
//    schedules and "payment failed" emails. It doesn't now — dunning lives in
//    renewSubscriptions.ts and is yours to tune.
// ─────────────────────────────────────────────────────────────────────────────
export async function initiateSubscription(
  userId: string,
  planType: SubscriptionPlan,
  /** Optional per-property context. Owner tiers are per property; omit for
   *  agent plans. `plots` gates self-serve, `customAmountNaira` is the sales
   *  quote for OWNER_CUSTOM. Backwards-compatible: existing callers
   *  (subscription.routes.ts) pass two arguments and behave as before. */
  opts?: { propertyId?: string; plots?: number | null; customAmountNaira?: number | null }
) {
  const config = PLAN_CONFIG[planType];

  // Guard: renters can't initiate paid subscriptions yet
  if (config.isFreeRenterPlan) {
    throw new Error("Renter paid billing is not yet active.");
  }

  // Get user
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  // Role must match plan
  if (user.role !== config.userRole) {
    throw new Error(`Plan ${planType} is not available for ${user.role} accounts.`);
  }

  // A property above the self-serve plot cap has no price in the constant —
  // fumigation and waste vendor pricing is built around a compound of up to
  // MAX_PLOTS_SELF_SERVE plots. Route it to sales rather than charging a rate
  // we cannot honour. An UNKNOWN plot count is treated as within the cap: the
  // listing form does not collect it yet, and blocking a checkout on data we
  // never asked for is worse than billing the standard tier.
  if (requiresCustomQuote(opts?.plots) && !config.customPriced) {
    throw new Error(
      "This property is larger than our self-serve plans cover. Request a quote and we'll price it."
    );
  }

  // Check founding agent cohort
  const foundingAgentCount = await prisma.subscription.count({
    where: { isFoundingAgent: true },
  });
  const isFoundingAgent =
    user.role === Role.AGENT &&
    planType === SubscriptionPlan.AGENT_PREMIUM &&
    foundingAgentCount < 100;

  const foundingAgentNumber = isFoundingAgent
    ? await getNextFoundingNumber("foundingAgentNumber")
    : null;

  // THE AMOUNT — sum over the owner's property lines, or this plan's price.
  const amountNaira = await resolveChargeAmount(userId, planType, opts?.customAmountNaira);

  // Upsert subscription to PENDING — cancel any previous pending attempt
  const existing = await prisma.subscription.findUnique({ where: { userId } });

  const now = new Date();
  const txRef = `NC-SUB-${userId}-${Date.now()}`;

  let subscription;
  if (existing && existing.status === SubscriptionStatus.PENDING) {
    // Update the existing pending record with the new attempt
    subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        planType,
        billingCycle: config.billingCycle,
        userRole: config.userRole,
        amountNaira,
        finalAmountNaira: amountNaira,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        isFoundingAgent,
        foundingAgentNumber,
        flwTransactionRef: txRef,
      },
    });
  } else if (!existing) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        billingCycle: config.billingCycle,
        userRole: config.userRole,
        amountNaira,
        finalAmountNaira: amountNaira,
        status: SubscriptionStatus.PENDING,
        isFreeRenterPlan: false,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        isFoundingAgent,
        foundingAgentNumber,
        currentPeriodStart: now,
        currentPeriodEnd: getPeriodEnd(now, config.billingCycle),
        autoRenew: true,
        flwTransactionRef: txRef,
      },
    });
  } else {
    // Existing subscription that's ACTIVE — this is an upgrade/downgrade
    // For now treat as a new initiation (extend this logic for upgrade flows)
    subscription = existing;
  }

  // Attach the property line up front, so the tier lands on the right property
  // even if the user abandons checkout. It only starts billing on activation.
  if (opts?.propertyId && config.perProperty) {
    await prisma.propertySubscription.upsert({
      where: { propertyId: opts.propertyId },
      create: {
        subscriptionId: subscription.id,
        propertyId: opts.propertyId,
        planType,
        plots: opts.plots ?? null,
        customAmountNaira: opts.customAmountNaira ?? null,
      },
      update: {
        subscriptionId: subscription.id,
        planType,
        plots: opts.plots ?? null,
        customAmountNaira: opts.customAmountNaira ?? null,
        cancelledAt: null,
      },
    });
  }

  // Build Flutterwave payment payload.
  // No payment_plan — see the note above this function. `payment_options` is
  // card-only ON PURPOSE: the model depends on getting a reusable token back,
  // and bank transfer / USSD cannot be tokenized, so accepting them here would
  // create subscriptions that can never renew.
  const flwPayload = {
    tx_ref: txRef,
    amount: amountNaira,
    currency: "NGN",
    payment_options: "card",
    customer: {
      email: user.email,
      name: user.name || user.email,
      phonenumber: user.phone || "",
    },
    meta: {
      userId,
      subscriptionId: subscription.id,
      planType,
    },
    customizations: {
      title: "NewCondo Subscription",
      description: `${config.name} — ${formatNaira(amountNaira)}`,
      logo: `${APP_URL}/images/logos/newcondo-logo.png`,
    },
    redirect_url: `${APP_URL}/dashboard/subscription/callback`,
  };

  return {
    txRef,
    subscriptionId: subscription.id,
    flwPayload, // Returned to frontend to pass into Inline modal
    planName: config.name,
    amountNaira,
    isFoundingAgent,
    foundingAgentNumber,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTIVATE SUBSCRIPTION — called by webhook after successful payment
//
//    Signature unchanged. `flwSubscriptionId` will now be empty for new
//    subscriptions (there is no Flutterwave subscription object without a
//    payment plan) — the column is kept for historical rows and the webhook
//    passes whatever it has.
//
//    `flwCustomerToken` was always stored here; it is now LOAD-BEARING. It is
//    the only thing that makes the next cycle chargeable, so a missing token
//    is logged loudly rather than quietly producing a subscription that looks
//    healthy today and cannot renew in a month.
// ─────────────────────────────────────────────────────────────────────────────
export interface SavedCardMeta {
  last4?: string;
  brand?: string;
  expiry?: string;
}

export async function activateSubscription(
  txRef: string,
  flwTransactionId: string,
  flwSubscriptionId: string,
  flwCustomerToken: string,
  flwCustomerId: string,
  card?: SavedCardMeta,
): Promise<Subscription> {
  const subscription = await prisma.subscription.findFirst({
    where: { flwTransactionRef: txRef },
  });

  if (!subscription) {
    throw new Error(`No subscription found for tx_ref: ${txRef}`);
  }

  if (subscription.status === SubscriptionStatus.ACTIVE) {
    // Already activated (duplicate webhook) — ignore safely
    return subscription;
  }

  const now = new Date();
  const periodEnd = getPeriodEnd(now, subscription.billingCycle);

  if (!flwCustomerToken) {
    console.error(
      `[subscription] ACTIVATED WITHOUT A CARD TOKEN — sub=${subscription.id} tx_ref=${txRef}. ` +
      `Recurring billing charges this token; without it the subscription cannot renew after ` +
      `${periodEnd.toISOString()} and the user must re-enter a card.`
    );
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      flwSubscriptionId: flwSubscriptionId || null,
      flwCustomerToken,
      flwCustomerId,
      flwTransactionRef: txRef,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextRenewalAttempt: periodEnd,
      ...(card?.last4 ? { cardLast4: card.last4 } : {}),
      ...(card?.brand ? { cardBrand: card.brand } : {}),
      ...(card?.expiry ? { cardExpiry: card.expiry } : {}),
    },
  });

  // Log activation
  await prisma.subscriptionHistory.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: SubscriptionEvent.ACTIVATED,
      fromStatus: SubscriptionStatus.PENDING,
      toStatus: SubscriptionStatus.ACTIVE,
      flwTransactionRef: txRef,
      amountCharged: subscription.finalAmountNaira,
      triggeredBy: "system",
      notes: flwSubscriptionId
        ? `Flutterwave subscription activated. ID: ${flwSubscriptionId}`
        : `Card charge activated; recurring billing via saved token.`,
    },
  });

  // Create invoice record.
  // NOTE the invoiceNumber shape: renewSubscriptions.ts derives
  // `NC-INV-${subscriptionId}-${periodStart}` as its idempotency anchor, so the
  // first invoice uses the same shape. A bare `NC-INV-${Date.now()}` (the old
  // value) can never be found by that lookup, which means the renewal job
  // cannot tell whether the first period was already paid.
  const invoiceNumber = `NC-INV-${subscription.id}-${now.toISOString().slice(0, 10)}`;
  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      invoiceNumber,
      periodStart: now,
      periodEnd,
      amountNaira: subscription.finalAmountNaira,
      status: "PAID",
      flwTransactionRef: txRef,
      flwTransactionId,
      paidAt: now,
    },
  });

  // Update User.isPremium
  await prisma.user.update({
    where: { id: subscription.userId },
    data: {
      isPremium: true,
      premiumExpiresAt: periodEnd,
    },
  });

  // Any property line attached at checkout starts billing from now.
  await prisma.propertySubscription.updateMany({
    where: { subscriptionId: subscription.id, cancelledAt: null },
    data: { startedAt: now },
  });

  // Coming back from a lapse: republish whatever the grace sweep hid, and
  // clear the grace state so a future lapse starts a fresh clock. Ordered
  // after the status update so a crash here leaves an ACTIVE subscription
  // with hidden listings — visible and fixable — rather than live listings
  // on an unpaid account.
  const restored = await restoreListingsFor(subscription.userId);
  if (restored > 0) {
    console.log(`[subscription] restored ${restored} listing(s) for ${subscription.userId} after payment`);
  }
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { gracePeriodEndsAt: null, listingsSuspendedAt: null },
  });


  // Fetched rather than passed in so this works from both the first-charge
  // path and the webhook path without changing either signature.
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { email: true, name: true, role: true },
  });
  if (user?.email) {
    await sendBrandedEmail(
      user.email,
      EmailTemplates.welcome({
        name: user.name ?? "there",
        // ADMIN never reaches this path, but the template's union is narrow —
        // narrow it here rather than casting the check away.
        role: (user.role === "ADMIN" ? "OWNER" : user.role) as "OWNER" | "AGENT" | "RENTER",
      })
    );
  }

  // Trigger virtual account if needed
  if (!subscription.virtualAccountCreated) {
    await triggerVirtualAccountCreation(subscription.userId, subscription.id);
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3b. PER-PROPERTY TIERS
//     "Change plan" for an owner means changing ONE property's tier — there is
//     no account-level tier to change. Takes effect from the next cycle: the
//     renewal job recomputes the total from these lines.
// ─────────────────────────────────────────────────────────────────────────────
export async function setPropertyTier(args: {
  userId: string;
  propertyId: string;
  planType: SubscriptionPlan;
  plots?: number | null;
  customAmountNaira?: number | null;
}): Promise<void> {
  const config = PLAN_CONFIG[args.planType];
  if (!config.perProperty) throw new Error("That plan is not a per-property plan.");
  if (config.customPriced && !args.customAmountNaira) {
    throw new Error("A custom-rate property needs a quoted amount.");
  }
  if (requiresCustomQuote(args.plots) && !config.customPriced) {
    throw new Error("Properties above our self-serve size need a quote.");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: args.userId },
    select: { id: true },
  });
  if (!subscription) throw new Error("No subscription for this account.");

  const property = await prisma.property.findFirst({
    where: { id: args.propertyId, ownerId: args.userId },
    select: { id: true },
  });
  if (!property) throw new Error("Property not found.");

  await prisma.propertySubscription.upsert({
    where: { propertyId: args.propertyId },
    create: {
      subscriptionId: subscription.id,
      propertyId: args.propertyId,
      planType: args.planType,
      plots: args.plots ?? null,
      customAmountNaira: args.customAmountNaira ?? null,
    },
    update: {
      planType: args.planType,
      plots: args.plots ?? null,
      customAmountNaira: args.customAmountNaira ?? null,
      cancelledAt: null,
    },
  });
}

/** Stop billing for one property. The account subscription survives — an owner
 *  with three properties who drops one still owes for two. */
export async function cancelPropertyTier(userId: string, propertyId: string): Promise<void> {
  const line = await prisma.propertySubscription.findFirst({
    where: { propertyId, subscription: { userId }, cancelledAt: null },
    select: { id: true },
  });
  if (!line) throw new Error("That property is not on a plan.");
  await prisma.propertySubscription.update({
    where: { id: line.id },
    data: { cancelledAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3c. LISTING SUSPENSION — the enforcement behind the grace period
//
//     The dunning email promises "your listings stay live until <date>, then
//     they're archived". Nothing used to do that: on EXPIRED the subscription
//     row flipped status and NOTHING else happened — User.isPremium stayed
//     true forever, and every property stayed PUBLISHED. So a landlord who
//     stopped paying kept the full product, and the email was a lie in the
//     other direction.
//
//     PropertyStatus has no ARCHIVED member and adding one would mean auditing
//     every status switch in the codebase. UNAVAILABLE already means "live
//     listing, not currently takeable", which is exactly right — but it is
//     lossy on its own, so Property.suspendedBySubscription records that WE
//     hid it. Restore only ever touches rows carrying that flag, so an owner's
//     own manual UNAVAILABLE is never silently republished.
//
//     Only PUBLISHED properties are suspended. A RENTED one has a tenant in
//     it and rent flowing through escrow — pulling that listing would be
//     punishing the tenant for the landlord's card, and escrow is explicitly
//     not tied to the subscription.
// ─────────────────────────────────────────────────────────────────────────────

/** Hide a lapsed owner's live listings. Returns how many were hidden. */
export async function suspendListingsFor(userId: string): Promise<number> {
  const { count } = await prisma.property.updateMany({
    where: {
      ownerId: userId,
      status: PropertyStatus.PUBLISHED,
      suspendedBySubscription: false,
    },
    data: { status: PropertyStatus.UNAVAILABLE, suspendedBySubscription: true },
  });
  return count;
}

/**
 * Put back exactly what we hid, and nothing else.
 *
 * Called on every successful activation and renewal — including the first
 * charge after a lapse, which is the whole point: paying restores the
 * listings without a support ticket. Safe to call when nothing is suspended.
 */
export async function restoreListingsFor(userId: string): Promise<number> {
  const { count } = await prisma.property.updateMany({
    where: { ownerId: userId, suspendedBySubscription: true },
    data: { status: PropertyStatus.PUBLISHED, suspendedBySubscription: false },
  });
  return count;
}

/** What this account will be charged next cycle. Use this for the dashboard's
 *  "next billing" figure — NOT `subscription.finalAmountNaira`, which is a
 *  snapshot from checkout and goes stale the moment a property is added. */
export async function currentMonthlyTotal(userId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { planType: true },
  });
  if (!sub) return 0;
  return resolveChargeAmount(userId, sub.planType);
}

/** Commission rate on rent for an owner, from their plan: 20% on Essential and
 *  Plus, 15% on Premium.
 *
 *  Resolve it through here (or commissionRateFor from the shared constant).
 *  Never `planType === "OWNER_PREMIUM" ? 0.15 : 0.20` — correct today, and
 *  silently wrong the next time a tier's rate moves. Unsubscribed owners get
 *  the standard rate. Round the fee ONCE, in kobo, and derive owner payout as
 *  `rent - fee` so the two figures reconcile. */
export async function commissionRateForOwner(ownerId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { userId: ownerId },
    select: { planType: true, status: true },
  });
  if (
    !sub ||
    (sub.status !== SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.FREE_ACTIVE)
  ) {
    return PLAN_CONFIG[SubscriptionPlan.OWNER_ESSENTIAL].commissionRate;
  }
  return PLAN_CONFIG[sub.planType].commissionRate;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VIRTUAL ACCOUNT TRIGGER
// ─────────────────────────────────────────────────────────────────────────────
async function triggerVirtualAccountCreation(userId: string, subscriptionId: string) {
  // Check if virtual account already exists
  const existingVA = await prisma.virtualAccount.findFirst({ where: { userId } });
  if (existingVA) return;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  try {
    // Call Flutterwave to create a virtual account
    const response = await axios.post(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        email: user.email,
        is_permanent: true,
        bvn: "00000000000", // NOTE: In production, you'll collect real BVN
        tx_ref: `NC-VA-${userId}-${Date.now()}`,
        phonenumber: "08000000000", // Replace with user.phone in production
        firstname: user.name?.split(" ")[0] || "NewCondo",
        lastname: user.name?.split(" ")[1] || "User",
        narration: `NewCondo - ${user.name}`,
      },
      { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
    );

    const va = response.data.data;

    await prisma.virtualAccount.create({
      data: {
        userId,
        accountNumber: va.account_number,
        accountName: va.account_name,
        bankCode: va.bank_name,
        flutterwaveAccountId: va.order_ref,
        balance: 0,
        isActive: true,
      },
    });

    // Mark VA as created on subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { virtualAccountCreated: true },
    });

    // Log event
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        userId,
        eventType: SubscriptionEvent.VIRTUAL_ACCOUNT_CREATED,
        triggeredBy: "system",
        notes: `Virtual account created: ${va.account_number}`,
      },
    });
  } catch (err: any) {
    console.error("Virtual account creation failed:", err.response?.data || err.message);
    // Non-fatal — log but don't throw. Can be retried.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VERIFY FLUTTERWAVE PAYMENT — called by webhook handler to verify tx
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyFlutterwaveTransaction(transactionId: string) {
  const response = await axios.get(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
  );
  return response.data.data;
}
