/* ============================================================
   lib/api/onboarding.ts

   The server is authoritative about where a user is in onboarding. The client
   used to infer it from session fields (`u.phone ? "plan" : "details"`), which
   could not express a rule spanning the User row, its linked OAuth accounts and
   its subscription — and which, once registration moved before the OTP, pushed
   signed-in-but-unverified users straight past verification.
   ============================================================ */

import { apiClient } from "./client";
import type { UserType } from "@/types/api";

const unwrap = <T,>(r: { data?: T }) => r.data as T;

export type OnboardingStep = "details" | "verify" | "plan" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  redirectTo: "dashboard" | null;
  needsEmailVerification: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  authProviders: string[];
  pendingPlan: string | null;
  subscriptionStatus: string | null;
  role: string;
  email: string | null;
  name: string | null;
}

/** GET /auth/onboarding-state — requires a session. */
export const getOnboardingState = () =>
  apiClient.get<OnboardingState>("/auth/onboarding-state").then(unwrap);

export interface RegisterResult {
  user: { id: string; email: string; name: string | null; role: string };
  requiresVerification: boolean;
  /** False when the transport failed — the OTP panel warns instead of leaving them waiting. */
  emailSent: boolean;
  /** True when an abandoned unverified stub was reused rather than a new row created. */
  resumed: boolean;
  expiresIn: number;
}

/**
 * POST /auth/register — creates the account AND issues the verification code in
 * one call. No separate sendOTP: register writes the OTP row itself, so calling
 * sendOTP as well would mint a second code and invalidate the one already on
 * its way to the user's inbox.
 */
export const registerAccount = (body: {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
}) => apiClient.post<RegisterResult>("/auth/register", body).then(unwrap);

/**
 * Does this address belong to a real, finished account?
 *
 * The backend deliberately answers `false` for an unverified row with no
 * subscription — an abandoned registration is a ghost, and its address must
 * stay available. So `true` means "verified, or already a customer": send them
 * to /login. `false` means "safe to register", including the resume case where
 * register will reuse their own stub.
 */
export const checkEmailRegistered = async (email: string): Promise<boolean> => {
  try {
    // Route is /auth/email-exists (authController.checkEmailExists) — NOT
    // /auth/check-email. Worth being careful here: this helper fails open, so a
    // wrong path 404s silently and the "You already have an account" panel just
    // never appears, with no error anywhere to explain why.
    const res = await apiClient.get<{ exists: boolean }>(
      `/auth/email-exists?email=${encodeURIComponent(email.trim().toLowerCase())}`
    );
    return !!(res as { exists?: boolean; data?: { exists?: boolean } }).exists
      || !!res.data?.exists;
  } catch {
    // Fail open: never block a genuine signup because a lookup failed.
    return false;
  }
};

/** PATCH the signed-in user's email: resets verification and re-issues the OTP. */
export const changeOnboardingEmail = (email: string) =>
  apiClient
    .patch<{ email: string; emailSent: boolean }>("/auth/change-email", {
      email: email.trim().toLowerCase(),
    })
    .then(unwrap);

/** Q2 — change account type while the subscription is still PENDING. */
export const changeAccountType = async (
  role: UserType
): Promise<{ ok: boolean; reason?: string }> => {
  try {
    await apiClient.patch("/payments/subscriptions/account-type", { userType: role });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as { message?: string })?.message };
  }
};
