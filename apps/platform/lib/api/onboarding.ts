/* ============================================================
   Onboarding resume / state — client API

   Talks to the Express onboarding routes (mounted on your paymentRouter,
   backed by @newcondo/payment-service onboardingResume functions):

     GET  /payments/subscriptions/onboarding-state      → where to resume
     POST /payments/subscriptions/onboarding/account-type → change role (Q2)
     POST /payments/subscriptions/onboarding/reset       → abandon PENDING

   All routed through the shared apiClient so they carry the Bearer token —
   so they only work once the user is authenticated. A brand-new (not yet
   registered) visitor has no state; callers treat a failure as "fresh start".
   ============================================================ */

import apiClient, { isApiError } from "@/lib/api/client";
import type { UserType } from "@/types/api";

export type OnboardingStep = "account" | "plan" | "payment" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  redirectTo?: "dashboard";
  /** Backend plan code of an abandoned PENDING checkout (Q1). */
  pendingPlan?: string;
  message?: string;
}

/**
 * Ask the backend where this (authenticated) user should resume. Returns
 * null if we can't tell (not signed in yet, network error) — caller then
 * runs the normal flow from the top.
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  if (!process.env.NEXT_PUBLIC_API_URL) return null;
  try {
    const res = await apiClient.get<{ success: boolean; data: OnboardingState }>(
      "/payments/subscriptions/onboarding-state"
    );
    return res?.data?.data ?? null;
  } catch (err) {
    // 401 (not signed in) or any transient error → treat as "no state".
    if (isApiError(err) && err.status !== 401) {
      console.warn("[onboarding] getOnboardingState failed:", err.message);
    }
    return null;
  }
}

/**
 * Q2 — returning user wants a different account type. Allowed only while the
 * subscription is still PENDING (nothing paid). Resolves { ok, reason }.
 */
export async function changeAccountType(role: UserType): Promise<{ ok: boolean; reason?: string }> {
  if (!process.env.NEXT_PUBLIC_API_URL) return { ok: true }; // no backend → local-only change
  try {
    await apiClient.post("/payments/subscriptions/onboarding/account-type", { role });
    return { ok: true };
  } catch (err) {
    const reason = isApiError(err)
      ? err.message
      : "Couldn't change your account type. Please try again.";
    return { ok: false, reason };
  }
}

/** Abandon a PENDING checkout so the user can pick a different plan/role. */
export async function resetPendingOnboarding(): Promise<{ ok: boolean }> {
  if (!process.env.NEXT_PUBLIC_API_URL) return { ok: true };
  try {
    await apiClient.post("/payments/subscriptions/onboarding/reset", {});
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Q4 — server-truth check used at the register step: does this email already
 * have an account? Used to route a returning subscriber (whose session
 * expired) to /login instead of a fresh sign-up. This is a PUBLIC, unauthed
 * lookup (the user isn't signed in), so it does NOT go through the
 * Bearer-authed apiClient — it hits a small public endpoint directly.
 *
 * Backend: add a public route, e.g.
 *   GET /auth/email-exists?email=...  → { exists: boolean }
 * It must NOT leak anything beyond existence (no names, no status) and should
 * be rate-limited to avoid email enumeration abuse.
 *
 * Fails OPEN (returns false → onboard normally) on any error, so a flaky check
 * never blocks a genuine new signup.
 */
export async function checkEmailRegistered(email: string): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return false;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/auth/email-exists?email=${encodeURIComponent(trimmed)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) return false;
    const json = (await res.json()) as { exists?: boolean; data?: { exists?: boolean } };
    return Boolean(json?.exists ?? json?.data?.exists);
  } catch {
    return false;
  }
}
