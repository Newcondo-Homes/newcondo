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

   So the account must exist + be signed in before these run (the
   onboarding flow registers → signs in → then calls these).
   ============================================================ */

import apiClient, { isApiError } from "@/lib/api/client";
import type {
  BillingCycle,
  InitiateSubscriptionResult,
  SubscriptionPlanCode,
  UserType,
} from "@/types/api";

/** Live whenever the API base URL is configured (apiClient requires it). */
export const isLiveBackend = Boolean(process.env.NEXT_PUBLIC_API_URL);

/* ------------------------------------------------------------------ */
/* Plan-code resolution: UI plan → backend SubscriptionPlan enum       */
/* ------------------------------------------------------------------ */

/**
 * Flutterwave payment-plan IDs, keyed by backend plan code — only needed if
 * you ever build the FLW payload client-side. In the current flow the BACKEND
 * returns the payload (with payment_plan attached), so these can stay empty.
 */
const FLW_PLAN_IDS: Partial<Record<SubscriptionPlanCode, string>> = {
  OWNER_ESSENTIAL: process.env.NEXT_PUBLIC_FLW_PLAN_OWNER_ESSENTIAL ?? "",
  OWNER_ELITE: process.env.NEXT_PUBLIC_FLW_PLAN_OWNER_ELITE ?? "",
  OWNER_ESSENTIAL_ANNUAL: process.env.NEXT_PUBLIC_FLW_PLAN_OWNER_ESSENTIAL_ANNUAL ?? "",
  OWNER_ELITE_ANNUAL: process.env.NEXT_PUBLIC_FLW_PLAN_OWNER_ELITE_ANNUAL ?? "",
  AGENT_ESSENTIAL: process.env.NEXT_PUBLIC_FLW_PLAN_AGENT_ESSENTIAL ?? "",
  AGENT_PREMIUM: process.env.NEXT_PUBLIC_FLW_PLAN_AGENT_PREMIUM ?? "",
  AGENT_ESSENTIAL_ANNUAL: process.env.NEXT_PUBLIC_FLW_PLAN_AGENT_ESSENTIAL_ANNUAL ?? "",
  AGENT_PREMIUM_ANNUAL: process.env.NEXT_PUBLIC_FLW_PLAN_AGENT_PREMIUM_ANNUAL ?? "",
};

/** FLW payment-plan id for a UI plan (recurring). undefined → one-off charge. */
export function resolveFlutterwavePlanId(
  role: UserType,
  planId: string,
  cycle: BillingCycle = "MONTHLY"
): string | undefined {
  const code = resolveSubscriptionPlanCode(role, planId, cycle);
  return FLW_PLAN_IDS[code] || undefined;
}

/**
 * Maps the role + UI plan id (+ billing cycle) to a backend plan code.
 * Tier is inferred from the id: "elite"/"premium"/"pro"/"plus" → higher
 * tier, everything else → essential/base. Annual cycle appends _ANNUAL
 * for owner/agent (renters have no annual variant yet).
 */
export function resolveSubscriptionPlanCode(
  role: UserType,
  planId: string,
  cycle: BillingCycle = "MONTHLY"
): SubscriptionPlanCode {
  const id = planId.toLowerCase();
  const higher = /(elite|premium|pro|plus)/.test(id);
  const annual = cycle === "ANNUAL";
  const roleStr = String(role).toUpperCase();

  if (roleStr.includes("OWNER")) {
    if (higher) return annual ? "OWNER_ELITE_ANNUAL" : "OWNER_ELITE";
    return annual ? "OWNER_ESSENTIAL_ANNUAL" : "OWNER_ESSENTIAL";
  }
  if (roleStr.includes("AGENT")) {
    if (higher) return annual ? "AGENT_PREMIUM_ANNUAL" : "AGENT_PREMIUM";
    return annual ? "AGENT_ESSENTIAL_ANNUAL" : "AGENT_ESSENTIAL";
  }
  return higher ? "RENTER_PREMIUM_PLUS" : "RENTER_FREE";
}

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
