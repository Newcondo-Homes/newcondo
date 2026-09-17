/* ============================================================
   Subscriptions API client

   Routed through the shared apiClient (lib/api/client.ts) so these calls
   are authenticated EXACTLY like the rest of the app — apiClient attaches
   `Authorization: Bearer <session.accessToken>` from getSession()
   (@newcondo/auth/client) on every request. The backend's authMiddleware
   reads that Bearer token.

   Endpoints (Express payment service, behind authMiddleware):
     POST /payments/subscriptions/initiate       (paid)   → Flutterwave payload
     POST /payments/subscriptions/renter-signup   (free renter)
     POST /payments/subscriptions/review-access   (platform review code)

   So the account must exist + be signed in before these run (the
   onboarding flow registers → signs in → then calls these).

   PLAN RESOLUTION moved out of this file. It used to guess the plan code
   from the UI id with a regex (/(elite|premium|pro|plus)/) and hold a map of
   NEXT_PUBLIC_FLW_PLAN_* ids that nothing read. Both are gone: the codes and
   prices come from the shared single source of truth, and the Flutterwave
   plan id is attached server-side (as `payment_plan`) from the
   FlutterwavePlan table — the only place it is ever correct per environment.
   ============================================================ */

import apiClient, { isApiError } from "@/lib/api/client";
import type { InitiateSubscriptionResult, SubscriptionPlanCode } from "@/types/api";

/** Live whenever the API base URL is configured (apiClient requires it). */
export const isLiveBackend = Boolean(process.env.NEXT_PUBLIC_API_URL);

/* ------------------------------------------------------------------ */
/* Plan-code resolution: UI plan → backend SubscriptionPlan enum       */
/* ------------------------------------------------------------------ */

/**
 * (role, UI plan id, billing cycle) → backend plan code.
 *
 * Re-exported under the old name so payment-processing.tsx and
 * FlutterwaveCheckoutModal.tsx keep working unchanged — same signature,
 * but now a data lookup over SUBSCRIPTION_PLANS (including the id aliases
 * the marketing page uses) instead of a regex on the id string.
 */
export { resolvePlanCode as resolveSubscriptionPlanCode } from "@/lib/constants/business";

/* ------------------------------------------------------------------ */
/* initiateSubscription — paid plans (owners + agents)                 */
/* ------------------------------------------------------------------ */
export async function initiateSubscription(
  planType: SubscriptionPlanCode
): Promise<InitiateSubscriptionResult> {
  try {
    const res = await apiClient.post<InitiateSubscriptionResult>(
      "/payments/subscriptions/initiate",
      { planType }
    );
    if (!res.data) throw new Error("The server didn't return a checkout payload.");
    return res.data;
  } catch (err: unknown) {
    if (isApiError(err) && (err as { status?: number }).status === 401) {
      throw new Error("Your session wasn't ready for checkout. Please sign in and try again.");
    }
    throw new Error(
      (err as { message?: string })?.message ?? "Could not start your subscription. Please try again."
    );
  }
}

/* ------------------------------------------------------------------ */
/* redeemReviewAccess — platform app review (Meta / Google / Apple)    */
/* ------------------------------------------------------------------ */

/**
 * Redeem a review access code instead of paying.
 *
 * Newcondo has no free tier, so an app reviewer signing in with their own
 * account reaches the plan step and dead-ends at Flutterwave — they can never
 * verify the OAuth permission they are reviewing. This exchanges a code for a
 * comped ACTIVE subscription server-side; Flutterwave is never called, so live
 * payments keep working normally for real customers throughout the review.
 *
 * The code lives only in the backend env (REVIEW_ACCESS_CODE) — never here.
 */
export async function redeemReviewAccess(
  code: string
): Promise<{ planType: string; currentPeriodEnd: string }> {
  try {
    const res = await apiClient.post<{ planType: string; currentPeriodEnd: string }>(
      "/payments/subscriptions/review-access",
      { code: code.trim() }
    );
    if (!res.data) throw new Error("Could not apply that access code.");
    return res.data;
  } catch (err: unknown) {
    if (isApiError(err) && (err as { status?: number }).status === 401) {
      throw new Error("Your session wasn't ready. Please sign in and try again.");
    }
    throw new Error(
      (err as { message?: string })?.message ?? "That access code is not valid."
    );
  }
}

/* ------------------------------------------------------------------ */
/* createFreeRenterSubscription — free plans                           */
/* ------------------------------------------------------------------ */
export async function createFreeRenterSubscription(): Promise<void> {
  try {
    await apiClient.post("/payments/subscriptions/renter-signup");
  } catch (err: unknown) {
    if (isApiError(err) && (err as { status?: number }).status === 401) {
      throw new Error("Your session wasn't ready. Please sign in and try again.");
    }
    throw new Error(
      (err as { message?: string })?.message ?? "Could not set up your free plan. Please try again."
    );
  }
}
