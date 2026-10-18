// backend/shared/src/referrals/display.ts — spec §14 "UI copy is rendered from config"
// Turns rules.ts into the words and numbers the referral page and emails
// show. Change a pool % or cap in rules.ts and this copy follows.
import { prisma } from "@newcondo/db";
import { SUBSCRIPTION_PLANS, OWNER_TIER_ORDER, costBasisFor } from "../constants/subscriptionPlans";
import type { ReferralRule, Role } from "./rule-types";
import { REFERRAL_RULES, isReferralProgramEnabled } from "./rules";
import { COHORTS } from "./cohorts";
import { AGENT_SUBSCRIPTION_COST_RATE, SUBSCRIPTION_REWARD_HOLD_HOURS } from "./limits";
import { planReward, withinWindow } from "./plan";
import { maskName } from "./names";

const ngn = (kobo: bigint | number) => `₦${(Number(kobo) / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const blank = (marginKobo: bigint) => ({ marginKobo, priorEvents: 0, paidRefereeIds: [], refereeId: "x", usedReferredUserKobo: { referrer: 0n, referee: 0n }, usedReferrerYearKobo: 0n });

/** "≈ ₦1,166–₦2,062 each, per payment" from the real plan prices. */
function exampleRange(rule: ReferralRule): string | null {
  let margins: bigint[] = [];
  if (rule.marginSource === "owner_fulfillment_margin") {
    margins = OWNER_TIER_ORDER.map((c) => BigInt(SUBSCRIPTION_PLANS[c].amountNaira - costBasisFor(c)) * 100n);
  } else if (rule.marginSource === "agent_subscription_margin") {
    margins = (["AGENT_ESSENTIAL", "AGENT_PREMIUM"] as const).map((c) => BigInt(Math.floor(SUBSCRIPTION_PLANS[c].amountNaira * (1 - AGENT_SUBSCRIPTION_COST_RATE))) * 100n);
  } else return null;
  const shares = margins.map((m) => planReward(rule, blank(m)).referrerKobo).filter((s) => s > 0n);
  if (!shares.length) return null;
  const lo = shares.reduce((a, b) => (b < a ? b : a)), hi = shares.reduce((a, b) => (b > a ? b : a));
  return lo === hi ? `≈ ${ngn(lo)}` : `≈ ${ngn(lo)}–${ngn(hi)}`;
}

export function rewardText(rule: ReferralRule): string {
  const n = rule.release.installments;
  const split = rule.splitReferee > 0 ? "shared equally between you and them" : "to you";
  switch (rule.rewardForm) {
    case "subscription_credit": {
      const ex = exampleRange(rule);
      const times = n && n > 1 ? `on each of their first ${n} payments` : n === 1 ? "on their first payment" : "per payment";
      const cap = rule.capPerEventKobo ? ` (up to ${ngn(rule.capPerEventKobo)} each)` : "";
      return `${pct(rule.poolPercentage)} of Newcondo's margin ${times}, ${split}, as subscription credit${cap}.${ex ? ` ${ex} each.` : ""}`;
    }
    case "commission_override":
      return `${pct(rule.poolPercentage)} of Newcondo's net rent commission, for up to ${rule.release.capRentPaymentCycles} rent payments on each of up to ${rule.release.capReferredCount} landlords${rule.capPerReferredUserKobo ? ` (max ${ngn(rule.capPerReferredUserKobo)} per landlord)` : ""}, paid to your wallet.`;
    case "service_credit":
      return `${rule.marketing?.title ?? "A free service"} on one of your properties.`;
  }
}

export interface ProgramCard {
  ruleId: string;
  title: string;
  blurb: string;
  reward: string;
  kind: "credit" | "override" | "milestone";
  endsAt?: string;
  spots?: { claimed: number; total: number };
  milestone?: { target: number };
}

const fromDbRole = (r: string): Role => (r === "AGENT" ? "agent" : r === "RENTER" ? "renter" : "owner");

/** GET /referrals/programs — what THIS user can earn from, in display order. */
export async function programsFor(userId: string, dbRole: string): Promise<{ enabled: boolean; programs: ProgramCard[]; howItWorks: string[]; hints: string[] }> {
  const role = fromDbRole(dbRole);
  const now = Date.now();
  const rules = REFERRAL_RULES.filter((r) => r.active && withinWindow(r, now) && (r.referrerRole === "any" || r.referrerRole === role));

  // Sprint replaces base inside its group — show only the winner.
  const best = new Map<string, ReferralRule>();
  const visible: ReferralRule[] = [];
  for (const r of rules) {
    if (r.eligibility.cohortOnly) {
      const m = await prisma.referralCohortMember.findUnique({ where: { cohort_userId: { cohort: r.eligibility.cohortOnly, userId } } });
      const flag = r.eligibility.cohortOnly === "founding_100_agents"
        ? (await prisma.subscription.findUnique({ where: { userId }, select: { isFoundingAgent: true } }))?.isFoundingAgent
        : false;
      if (!m && !flag) continue;
    }
    if (r.exclusiveGroup) {
      const cur = best.get(r.exclusiveGroup);
      if (!cur || (r.priority ?? 0) > (cur.priority ?? 0)) best.set(r.exclusiveGroup, r);
    } else visible.push(r);
  }
  const ordered = [...best.values(), ...visible];

  const cards: ProgramCard[] = [];
  for (const r of ordered) {
    const card: ProgramCard = {
      ruleId: r.id,
      title: r.marketing?.title ?? r.id,
      blurb: r.marketing?.blurb ?? r.description,
      reward: rewardText(r),
      kind: r.rewardForm === "service_credit" ? "milestone" : r.rewardForm === "commission_override" ? "override" : "credit",
    };
    if (r.activeWindow) card.endsAt = r.activeWindow.end;
    const capture = r.eligibility.cohortCapturesOnFirstUse;
    if (capture) card.spots = { claimed: await prisma.referralCohortMember.count({ where: { cohort: capture } }), total: COHORTS[capture].size };
    if (r.milestone) card.milestone = { target: r.milestone.referredActiveCount };
    cards.push(card);
  }

  return {
    enabled: isReferralProgramEnabled(),
    programs: cards,
    howItWorks: ["Invite with your link or code", role === "renter" ? "Your friend completes their first rent" : "Your friend subscribes or pays", "You both get credit"],
    hints: [
      "You earn when your friend's first payment clears, not at signup.",
      `Subscription credit becomes available ${SUBSCRIPTION_REWARD_HOLD_HOURS} hours after their payment clears, then applies to your next subscription charge automatically.`,
      "Credit can't be withdrawn as cash and expires 12 months after it becomes available.",
    ],
  };
}

/** GET /referrals/campaigns/sprint — public, cache 30s at the route. */
export async function sprintStatus() {
  const sprint = REFERRAL_RULES.find((r) => r.eligibility.cohortCapturesOnFirstUse === "founding_sprint_owners");
  if (!sprint?.activeWindow) return { active: false, claimed: 0, total: 0, endsAt: null };
  const claimed = await prisma.referralCohortMember.count({ where: { cohort: "founding_sprint_owners" } });
  const total = COHORTS.founding_sprint_owners.size;
  return { active: sprint.active && withinWindow(sprint, Date.now()) && claimed < total, claimed, total, endsAt: sprint.activeWindow.end };
}

/** GET /referrals/public/:code — the /r/[code] invitation page.
 *  Shape matches apps/platform/components/referral/referral-invitation.tsx
 *  ReferralData. Name is masked ("Ada O."); the reward is the most a NEW
 *  user can earn as the referee under the live rules, so the page never
 *  promises more than the engine pays. */
export async function publicInvitation(code: string): Promise<{
  valid: boolean;
  referrer: { name: string; role: "OWNER" | "AGENT" | "RENTER" };
  reward: { amount: number; description: string } | null;
}> {
  const empty = { valid: false, referrer: { name: "", role: "RENTER" as const }, reward: null };
  if (!/^[A-Za-z0-9-]{3,40}$/.test(code)) return empty;
  const u = await prisma.user.findFirst({
    where: { referralCode: { equals: code, mode: "insensitive" }, referralCodeDisabledAt: null },
    select: { name: true, role: true },
  });
  if (!u) return empty;
  const role = (u.role === "OWNER" || u.role === "AGENT" || u.role === "RENTER" ? u.role : "RENTER") as "OWNER" | "AGENT" | "RENTER";
  const name = maskName(u.name);
  if (!isReferralProgramEnabled()) return { valid: true, referrer: { name, role }, reward: null };

  const now = Date.now();
  let best = 0n;
  for (const r of REFERRAL_RULES) {
    if (!r.active || r.splitReferee <= 0 || !withinWindow(r, now)) continue;
    if (r.referrerRole !== "any" && r.referrerRole !== fromDbRole(role)) continue;
    const times = BigInt(r.release.installments ?? 1);
    let margins: bigint[] = [];
    if (r.marginSource === "owner_fulfillment_margin") margins = OWNER_TIER_ORDER.map((c) => BigInt(SUBSCRIPTION_PLANS[c].amountNaira - costBasisFor(c)) * 100n);
    else if (r.marginSource === "agent_subscription_margin") margins = (["AGENT_ESSENTIAL", "AGENT_PREMIUM"] as const).map((c) => BigInt(Math.floor(SUBSCRIPTION_PLANS[c].amountNaira * (1 - AGENT_SUBSCRIPTION_COST_RATE))) * 100n);
    else if (r.marginSource === "platform_commission_margin" && r.capPerEventKobo) margins = [BigInt(r.capPerEventKobo) * 10n];
    for (const m of margins) {
      const each = planReward(r, blank(m)).refereeKobo;
      const total = each * times;
      if (total > best) best = total;
    }
  }
  return {
    valid: true,
    referrer: { name, role },
    reward: best > 0n
      ? { amount: Number(best) / 100, description: "Up to this much in Newcondo subscription credit, applied after your first subscription or rent payment clears." }
      : null,
  };
}
