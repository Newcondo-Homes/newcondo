// backend/shared/src/referrals/margin.ts — spec §7
// Realized margin per source, in integer kobo. Calls the pricing layer
// (subscriptionPlans.ts); never copies its numbers.
import { costBasisFor, SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from "../constants/subscriptionPlans";
import type { BusinessEvent, MarginSource } from "./rule-types";
import { AGENT_SUBSCRIPTION_COST_RATE } from "./limits";

const isPlan = (c: string): c is SubscriptionPlanCode => c in SUBSCRIPTION_PLANS;

/** §7.1 — cash actually collected minus the tier cost basis of every
 *  property on the charge. Credit-paid cycles therefore yield 0 margin, so no
 *  reward is ever funded by another reward. */
function ownerFulfillmentMargin(ev: BusinessEvent): bigint {
  const cash = BigInt(ev.cashCollectedKobo ?? 0);
  const items = ev.items ?? [];
  const basis = items.reduce((s, it) => {
    if (!isPlan(it.planCode)) throw new Error(`margin: unknown plan ${it.planCode}`);
    return s + BigInt(costBasisFor(it.planCode)) * 100n;
  }, 0n);
  const m = cash - basis;
  return m > 0n ? m : 0n;
}

function agentSubscriptionMargin(ev: BusinessEvent): bigint {
  const cash = BigInt(ev.cashCollectedKobo ?? 0);
  return (cash * BigInt(Math.round((1 - AGENT_SUBSCRIPTION_COST_RATE) * 1_000_000))) / 1_000_000n;
}

/** §7.3 — NewCondo's NET share after listing/sub-agent cuts. */
function platformCommissionMargin(ev: BusinessEvent): bigint {
  const n = BigInt(ev.breakdown?.newcondoNetKobo ?? 0);
  return n > 0n ? n : 0n;
}

export function computeMarginKobo(source: MarginSource, ev: BusinessEvent): bigint {
  switch (source) {
    case "owner_fulfillment_margin": return ownerFulfillmentMargin(ev);
    case "agent_subscription_margin": return agentSubscriptionMargin(ev);
    case "platform_commission_margin": return platformCommissionMargin(ev);
    case "fixed_service_cost": return 0n; // gated by vendor cost, §7.4
  }
}
