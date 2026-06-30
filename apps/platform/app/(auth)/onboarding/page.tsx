import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
 * Requirement (Q4): a user who ALREADY has a subscription and re-enters
 * onboarding must go to the DASHBOARD if their session is active, or the LOGIN
 * page if it has expired.
 *
 *   • Active session + active subscription → redirect to /dashboard here
 *     (server-side, before any flow renders).
 *   • Active session + NO/ PENDING subscription → render the flow so social /
 *     returning users can finish (the client resolves Q1/Q3 via the backend).
 *   • Expired / no session → render the flow; the client checks the
 *     "returning subscriber" marker and routes lapsed subscribers to /login.
 *
 * NOTE: do NOT blanket-redirect every session to /dashboard — that breaks
 * social-login and resume-after-abandon onboarding, where the user is
 * authenticated but not yet subscribed.
 */
export default async function OnboardingPage() {
  const session = await auth();

  if (session?.user) {
    // Replace this with your real subscription lookup (e.g. a server helper that
    // reads the single Subscription row for the user). It must return true for
    // ACTIVE / FREE_ACTIVE / TRIAL — i.e. "already a customer".
    const hasActiveSubscription = await userHasActiveSubscription(session.user.id);
    if (hasActiveSubscription) {
      redirect("/dashboard");
    }
    // Authenticated but not subscribed → let the flow resume (Q1/Q3 client-side).
  }

  return <OnboardingFlow />;
}

/**
 * TODO: wire to your backend. Suggested implementation calls the same source
 * of truth as getOnboardingState — e.g. GET /payments/subscriptions/onboarding-state
 * with the server session token, or a direct Prisma read if this app shares the
 * DB. Returns true when the user already has an active/free/trial subscription.
 */
async function userHasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
    if (!base) return false;
    const session = await auth();
    const token = (session as { accessToken?: string } | null)?.accessToken;
    const res = await fetch(`${base.replace(/\/$/, "")}/payments/subscriptions/onboarding-state`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { redirectTo?: string; step?: string } };
    return json?.data?.redirectTo === "dashboard" || json?.data?.step === "done";
  } catch {
    // On any failure, fall through to rendering the flow (the client will still
    // guard Q3 via getOnboardingState). Never hard-fail the page on this check.
    return false;
  }
}
