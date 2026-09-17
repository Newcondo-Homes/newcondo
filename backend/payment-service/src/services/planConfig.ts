// backend/payment-service/src/services/planConfig.ts
// ============================================================================
// PLAN_CONFIG — derived from the single source of truth.
//
// This file replaces the hand-written PLAN_CONFIG block that used to sit at
// the top of subscription.service.ts (~lines 9–110). Import it there:
//
//     import { PLAN_CONFIG, chargeAmountForUser } from "./planConfig";
//
// and delete the old literal. Nothing in the payment service should declare a
// price, a commission rate or a listing cap any more — those come from
// @newcondo/backend-shared/constants (subscriptionPlans.ts), the same file the
// frontend renders from.
//
// The `Record<SubscriptionPlan, …>` annotation below is the point of the
// exercise: it is a COMPILE-TIME guard that keeps the shared constant's
// string-literal codes in lockstep with the Prisma enum. Add a member to the
// enum without adding it to subscriptionPlans.ts (or vice versa) and this file
// fails to build, instead of failing at runtime on a customer's checkout.
// ============================================================================

import { PrismaClient, type SubscriptionPlan } from "@newcondo/db";
import {
  SUBSCRIPTION_PLANS,
  planByCode,
  amountForProperty,
  totalForProperties,
  type PropertyLineItem,
} from "@newcondo/backend-shared/";

export interface PlanConfigEntry {
  amountNaira: number;
  name: string;
  role: string;
  cycle: "MONTHLY" | "ANNUAL";
  commissionRate: number;
  propertyListingCap: number | null;
  canAccessMarkingJobs: boolean;
  isFreeRenterPlan: boolean;
  /** true → the amount lives on the subscription record, not here. */
  customPriced: boolean;
  /** PER_PROPERTY tiers bill per property; PER_ACCOUNT bill once. */
  perProperty: boolean;
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfigEntry> =
  Object.fromEntries(
    (Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((code) => {
      const p = planByCode(code);
      return [
        code,
        {
          amountNaira: p.amountNaira,
          name: p.name,
          role: p.role,
          cycle: p.cycle,
          commissionRate: p.commissionRate,
          propertyListingCap: p.propertyListingCap,
          canAccessMarkingJobs: p.canAccessMarkingJobs,
          isFreeRenterPlan: p.isFreeRenterPlan,
          customPriced: !!p.customPriced,
          perProperty: p.pricingUnit === "PER_PROPERTY",
        },
      ];
    })
  ) as Record<SubscriptionPlan, PlanConfigEntry>;

/* ============================================================================
   chargeAmountForUser — THE BILL
   ============================================================================
   An owner's tier belongs to a PROPERTY, not the account: each property is
   independently on Essential, Plus, Premium or a custom-quoted rate, and the
   amount owed is the SUM over their active lines.

   On first subscribe there are no lines yet, so this falls back to the single
   tier being bought — the same number as before, which is why the change is
   safe to ship ahead of the per-property UI.

   Agent and renter plans are PER_ACCOUNT: one price, no summing. */
export async function chargeAmountForUser(
  prisma: PrismaClient,
  userId: string,
  planType: SubscriptionPlan,
  customAmountNaira?: number | null
): Promise<number> {
  const cfg = PLAN_CONFIG[planType];

  if (cfg.customPriced && !customAmountNaira) {
    // OWNER_CUSTOM has no price in the constant — amountNaira is a 0 sentinel.
    // Charging it would take a property live for free.
    throw new Error(
      "This property is on a custom rate that has not been quoted yet. Quote it before billing."
    );
  }

  if (!cfg.perProperty) {
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

