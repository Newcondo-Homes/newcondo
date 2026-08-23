import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@newcondo/auth";
import OnboardingFlow from "@/components/auth/onboarding-flow";

export const metadata: Metadata = {
  title: "Get started | NewCondo",
  description:
    "Create your NewCondo account, choose your plan, and start renting out — or finding — verified property.",
};

/**
 * Server entry for /onboarding.
 *
 * CRITICAL with register-first: an authenticated user is NOT necessarily
 * finished. The account is created at form submit now, so from the OTP step
 * onward every user is signed in and still mid-onboarding. A blanket
 * "session → /dashboard" redirect here would break the flow on its very first
 * attempt, and would also break social sign-in and resume-after-abandon.
 *
 * Only an actual customer is redirected:
 *   active subscription → /dashboard (server-side, before anything renders)
 *   anything else       → render the flow; the client asks the backend which
 *                         step to show (GET /auth/onboarding-state)
 *
 * <Suspense> is REQUIRED — OnboardingFlow reads ?role= and ?social= via
 * useSearchParams(), and without a boundary the first client render can resolve
 * before those params are attached to the route tree.
 */
export default async function OnboardingPage() {
  const session = await auth();

  if (session?.user) {
    const settled = await hasActiveSubscription(session as { accessToken?: string });
    if (settled) redirect("/dashboard");
    // Authenticated but not subscribed → let the flow resume.
  }

  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}

/**
 * True when the user is already a customer (ACTIVE / FREE_ACTIVE / TRIAL).
 *
 * Fails OPEN — on any error we render the flow rather than redirecting. The
 * client re-resolves state and forwards a real subscriber to the dashboard
 * anyway, so a failed check costs one hop; a wrong redirect would lock a
 * half-onboarded user out of the only page that can finish their signup.
 * (Note this is the opposite default to the dashboard gate, on purpose: each
 * fails toward the page that can still make progress.)
 */
async function hasActiveSubscription(session: { accessToken?: string }): Promise<boolean> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
    if (!base) return false;
    const token = session?.accessToken;
    const res = await fetch(`${base.replace(/\/$/, "")}/auth/onboarding-state`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { redirectTo?: string; step?: string } };
    return json?.data?.redirectTo === "dashboard" || json?.data?.step === "done";
  } catch {
    return false;
  }
}
