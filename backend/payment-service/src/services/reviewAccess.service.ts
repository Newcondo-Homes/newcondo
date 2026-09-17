// backend/payment-service/src/services/reviewAccess.service.ts
// ============================================================
// REVIEW ACCESS CODE — comped subscription for platform reviewers.
//
// WHY THIS EXISTS: Newcondo has no free tier. Meta/Google/Apple app reviewers
// sign in with their own account, reach the subscription step, and dead-end at
// Flutterwave — so they cannot verify the OAuth permission they are reviewing,
// and the submission gets rejected.
//
// The alternatives were worse. Sharing a real Facebook account hands over
// control of the app (and app admins can use unapproved permissions, so it
// proves nothing to a reviewer). Running checkout on Flutterwave TEST keys
// would stop real customers paying for the whole multi-week review window,
// because test cards are declined on live keys.
//
// So: one code, redeemed server-side, that creates an ACTIVE subscription at
// ₦0 and never touches Flutterwave. Live payments stay live throughout.
//
// SAFETY — this grants paid access, so it is deliberately narrow:
//   • Off unless REVIEW_ACCESS_CODE is set (no default, no fallback value).
//   • Timing-safe compare, so the code cannot be discovered by probing.
//   • Global redemption cap (REVIEW_ACCESS_MAX_USES, default 10) counted from
//     SubscriptionHistory — no extra store, and it survives a restart.
//   • Per-user attempt throttle (5/hour, in-process) so a leaked code can't
//     be farmed from one account.
//   • Every grant writes SubscriptionEvent.FREE_ACCESS_GRANTED with
//     triggeredBy "review_code", so comped accounts are auditable and can be
//     found and revoked in one query.
//
// Mirrors subscription.service.ts: same prisma import, same enum imports from
// @newcondo/db (never string literals), same PLAN_CONFIG shape for caps.
// ============================================================
import { timingSafeEqual } from "crypto";
import {
  prisma,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionEvent,
  Role,
} from "@newcondo/db";
import type { Subscription } from "@newcondo/db";
import { badRequest, conflict, forbidden, notFound, tooMany } from "@newcondo/backend-shared";

import { PLAN_CONFIG } from "./subscription.service";

/** Plan granted per role — the entry tier each role would otherwise buy. */
const PLAN_FOR_ROLE: Partial<Record<Role, SubscriptionPlan>> = {
  [Role.OWNER]: SubscriptionPlan.OWNER_ESSENTIAL,
  [Role.AGENT]: SubscriptionPlan.AGENT_ESSENTIAL,
  [Role.RENTER]: SubscriptionPlan.RENTER_PREMIUM_PLUS,
};

const MAX_USES = Number(process.env.REVIEW_ACCESS_MAX_USES ?? 10);

/** Per-user attempt throttle. In-process on purpose — no Redis dependency in
 *  this service, and the combined backend runs as a single process. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function throttle(userId: string) {
  const now = Date.now();
  const entry = attempts.get(userId);
  if (!entry || entry.resetAt < now) {
    attempts.set(userId, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) throw tooMany("Too many attempts — try again later");
}

/** Constant-time comparison — avoids leaking the code through response timing. */
function codeMatches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface ReviewAccessResult {
  planType: SubscriptionPlan;
  currentPeriodEnd: Date;
}

/**
 * Redeem a review access code for the signed-in user.
 * Creates (or upgrades a PENDING) subscription to ACTIVE at zero cost.
 */
export async function redeemReviewAccess(
  userId: string,
  suppliedCode: string
): Promise<ReviewAccessResult> {
  const expected = process.env.REVIEW_ACCESS_CODE;

  // Feature is entirely absent unless configured. Same error as a wrong code,
  // so a prober can't tell "not enabled" from "wrong value".
  if (!expected || expected.trim().length < 8) throw forbidden("That access code is not valid");

  const code = (suppliedCode ?? "").trim();
  if (!code) throw badRequest("Enter an access code");

  throttle(userId);

  if (!codeMatches(code, expected.trim())) throw forbidden("That access code is not valid");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, subscription: { select: { id: true, status: true } } },
  });
  if (!user) throw notFound("Account not found");

  // Already paid or already comped — refuse rather than silently re-issue.
  const live = user.subscription?.status;
  if (
    live === SubscriptionStatus.ACTIVE ||
    live === SubscriptionStatus.FREE_ACTIVE ||
    live === SubscriptionStatus.TRIAL
  ) {
    throw conflict("This account already has an active subscription");
  }

  const planType = PLAN_FOR_ROLE[user.role];
  if (!planType) throw badRequest("Review access is not available for this account type");
  const config = PLAN_CONFIG[planType];

  // Global cap — counted after the code matches, so a wrong code can't burn
  // uses. Distinct users, so a re-redeem by the same reviewer isn't double-counted.
  const granted = await prisma.subscriptionHistory.findMany({
    where: { eventType: SubscriptionEvent.FREE_ACCESS_GRANTED, triggeredBy: "review_code" },
    select: { userId: true },
    distinct: ["userId"],
  });
  if (!granted.some((g) => g.userId === userId) && granted.length >= MAX_USES) {
    throw forbidden("That access code is no longer available");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const subscription: Subscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType,
        billingCycle: BillingCycle.MONTHLY,
        userRole: user.role,
        amountNaira: config.amountNaira,
        discountPercent: 100,
        finalAmountNaira: 0,
        status: SubscriptionStatus.ACTIVE,
        isFreeRenterPlan: config.isFreeRenterPlan,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        // Never let a comped account attempt a real renewal charge.
        autoRenew: false,
      },
      update: {
        planType,
        userRole: user.role,
        status: SubscriptionStatus.ACTIVE,
        discountPercent: 100,
        finalAmountNaira: 0,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: false,
        renewalFailureCount: 0,
        nextRenewalAttempt: null,
      },
    });

    await tx.subscriptionHistory.create({
      data: {
        subscriptionId: sub.id,
        userId,
        eventType: SubscriptionEvent.FREE_ACCESS_GRANTED,
        toStatus: SubscriptionStatus.ACTIVE,
        toPlan: planType,
        amountCharged: 0,
        notes: "Complimentary access granted via platform review code",
        triggeredBy: "review_code",
      },
    });

    // The dashboard gate reads User.isPremium, not the Subscription row.
    await tx.user.update({
      where: { id: userId },
      data: { isPremium: true, premiumExpiresAt: periodEnd },
    });

    return sub;
  });

  console.log(
    `[reviewAccess] Granted comped ${planType} to user ${userId} until ${periodEnd.toISOString()}`
  );

  return { planType: subscription.planType, currentPeriodEnd: periodEnd };
}

/**
 * Revoke every comped review subscription. Run this once review completes:
 *   await revokeReviewAccessGrants();
 */
export async function revokeReviewAccessGrants(): Promise<number> {
  const grants = await prisma.subscriptionHistory.findMany({
    where: { eventType: SubscriptionEvent.FREE_ACCESS_GRANTED, triggeredBy: "review_code" },
    select: { userId: true },
    distinct: ["userId"],
  });
  if (!grants.length) return 0;

  const userIds = grants.map((g) => g.userId);
  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId: { in: userIds }, status: SubscriptionStatus.ACTIVE, finalAmountNaira: 0 },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: "Review access revoked",
      },
    }),
    prisma.user.updateMany({ where: { id: { in: userIds } }, data: { isPremium: false } }),
  ]);
  return userIds.length;
}
