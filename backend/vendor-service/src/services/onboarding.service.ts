/* ============================================================
   Onboarding resume / idempotency — reconciled with YOUR backend

   Lives in @newcondo/payment-service (alongside initiateSubscription /
   createFreeRenterSubscription). These add the missing edge-case logic; they
   do NOT duplicate your initiate flow — your initiateSubscription already
   upserts the single PENDING subscription on a resumed attempt (Q1). What was
   missing: a state resolver (Q3), a role-change path (Q2), and a guard.

   Invariant this all leans on (from your schema): Subscription.userId @unique
   → a user has AT MOST ONE subscription, ever. Its `status` is the onboarding
   state machine. So the flow can never create a second subscription.
   ============================================================ */

import { prisma, SubscriptionStatus, SubscriptionEvent, Role, type SubscriptionPlan } from "@newcondo/db";

export type OnboardingStep = "account" | "plan" | "payment" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  redirectTo?: "dashboard";
  pendingPlan?: SubscriptionPlan;
  message?: string;
}

/* ------------------------------------------------------------------
   GET /payments/subscriptions/onboarding-state
   The frontend calls this on entering /onboarding when authenticated.
   Resolves the canonical state from the single subscription row.
   ------------------------------------------------------------------ */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) return { step: "account" };

  switch (sub.status) {
    // Q3 — already a customer (paid or free renter). Onboarding is DONE.
    case SubscriptionStatus.ACTIVE:
    case SubscriptionStatus.FREE_ACTIVE:
    case SubscriptionStatus.TRIAL:
      return {
        step: "done",
        redirectTo: "dashboard",
        message: "You're already subscribed — taking you to your dashboard.",
      };

    // Existing customer with a billing issue → manage from dashboard, not here.
    case SubscriptionStatus.PAST_DUE:
    case SubscriptionStatus.CANCELLED:
    case SubscriptionStatus.EXPIRED:
    case SubscriptionStatus.PAUSED:
    case SubscriptionStatus.SUSPENDED:
      return {
        step: "done",
        redirectTo: "dashboard",
        message: "Manage your plan from your dashboard billing settings.",
      };

    // Q1 — started a paid checkout but never confirmed. Resume on the plan step.
    case SubscriptionStatus.PENDING:
    default:
      return {
        step: "payment",
        pendingPlan: sub.planType,
        message: "Pick up where you left off, or choose a different plan.",
      };
  }
}

/* ------------------------------------------------------------------
   Q3 guard — call at the TOP of your EXISTING
   POST /payments/subscriptions/initiate handler, before initiateSubscription().
   Defense-in-depth: stops a forced/replayed initiate from charging an
   already-active customer a second time.

     const guard = await assertCanInitiate(userId);
     if (!guard.ok) return res.status(409).json({ success:false, code:"ALREADY_ACTIVE", error:guard.reason });
   ------------------------------------------------------------------ */
export async function assertCanInitiate(
  userId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (!sub) return { ok: true };

  const activeStatuses = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.FREE_ACTIVE,
    SubscriptionStatus.TRIAL,
  ] as const;

  if (activeStatuses.includes(sub.status as typeof activeStatuses[number])) {
    return { ok: false, reason: "You already have an active subscription." };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------
   Q2 — POST /payments/subscriptions/onboarding/account-type
   Returning user wants a different account type. Plan codes are role-specific,
   so changing role resets the in-progress checkout. Allowed ONLY while PENDING
   (nothing paid); refused once the user is a paying/free-active customer.
   ------------------------------------------------------------------ */
export async function changeAccountType(
  userId: string,
  newRole: Role
): Promise<{ ok: boolean; reason?: string }> {
  if (!Object.values(Role).includes(newRole)) {
    return { ok: false, reason: "Invalid account type." };
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });

  if (sub && sub.status !== SubscriptionStatus.PENDING) {
    return {
      ok: false,
      reason: "You already have an active plan. Contact support to change your account type.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role: newRole, userType: newRole as never },
    });

    if (sub) {
      // PENDING = never paid → safe to discard so they re-pick for the new role.
      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          userId,
          eventType: SubscriptionEvent.PLAN_CHANGED,
          fromStatus: sub.status,
          triggeredBy: "user",
          notes: `Account type changed to ${newRole}; pending checkout reset`,
        },
      });
      await tx.subscription.delete({ where: { id: sub.id } });
    }
  });

  return { ok: true };
}

/* ------------------------------------------------------------------
   POST /payments/subscriptions/onboarding/reset
   Abandon a PENDING checkout (e.g. "choose a different plan"). Never wipes a
   paid/free-active subscription.
   ------------------------------------------------------------------ */
export async function resetPendingOnboarding(userId: string): Promise<{ ok: boolean }> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return { ok: true };
  if (sub.status !== SubscriptionStatus.PENDING) return { ok: false };
  await prisma.subscription.delete({ where: { id: sub.id } });
  return { ok: true };
}
