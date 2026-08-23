import { redirect } from 'next/navigation';
import { auth } from '@newcondo/auth';
import DashboardLayout from '@/components/shared/layouts/DashboardLayout';
import { UserType } from "@/types/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard gate.
 *
 * ---- WHY THE REDIRECT LOOP HAPPENED ----
 *
 * The two gates were reading DIFFERENT sources of truth:
 *
 *   this layout   → session.user.isPremium   (a JWT claim, minted at sign-in)
 *   /onboarding   → the backend subscription row (live DB)
 *
 * After a successful payment the DB says ACTIVE while the JWT still says
 * isPremium: false, because a JWT claim only changes when the token is re-minted.
 * So: dashboard sees false → redirects to /onboarding → onboarding sees ACTIVE →
 * redirects to /dashboard → forever. And because both are SERVER-side 307s, no
 * client JS ever runs, so the `update()` poll that would refresh the claim never
 * gets a chance to execute. That is why it spun instead of settling.
 *
 * ---- THE FIX ----
 *
 * Both gates now read the same authoritative source. The stale JWT claim is only
 * used as a fast path: if it says premium, we trust it (it can't be true unless
 * a payment succeeded). If it says false we do NOT redirect — we ask the backend,
 * because false is exactly the value that goes stale.
 *
 *   ACTIVE / FREE_ACTIVE / TRIAL  → render the dashboard (claim was stale)
 *   PENDING                       → hold and poll (webhook still in flight)
 *   nothing                       → /onboarding (never checked out)
 *
 * A loop is now impossible: the only path that redirects to /onboarding is the
 * one where the backend agrees there is no subscription — and in that case
 * /onboarding won't send them back.
 */
export default async function ProtectedDashboardLayout({
  children
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;
  const requiresPremium = role === UserType.OWNER || role === UserType.AGENT;

  // RENTERS are free-plan — no isPremium gate. Anything that isn't a known role
  // hasn't finished onboarding.
  if (!requiresPremium && role !== UserType.RENTER) {
    redirect('/onboarding');
  }

  if (requiresPremium && !session.user.isPremium) {
    // The claim says no. It may simply be stale, so ask the source of truth
    // before doing anything irreversible.
    const status = await fetchSubscriptionStatus(session as { accessToken?: string });

    if (status === 'ACTIVE' || status === 'FREE_ACTIVE' || status === 'TRIAL') {
      // Stale claim, real subscription. Fall through and render — the session
      // will catch up on its next refresh.
    } else if (status === 'PENDING') {
      // Paid seconds ago; the Flutterwave webhook hasn't flipped isPremium yet.
      const ActivatingSubscription = (await import('@/components/auth/activating-subscription')).default;
      return <ActivatingSubscription />;
    } else {
      // No subscription at all (or the lookup failed) → finish onboarding.
      redirect('/onboarding');
    }
  }

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}

/**
 * Authoritative subscription status straight from the backend.
 *
 * Returns null on any failure, which sends the user to /onboarding. That is the
 * safe direction: onboarding re-checks the same endpoint and forwards a genuine
 * subscriber straight back, so a transient error costs one extra hop. Failing the
 * other way would strand a brand-new user on a "confirming your payment" screen
 * for a payment they never made.
 */
async function fetchSubscriptionStatus(
  session: { accessToken?: string }
): Promise<string | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
    if (!base) return null;
    const token = session?.accessToken;
    const res = await fetch(`${base.replace(/\/$/, "")}/auth/onboarding-state`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { subscriptionStatus?: string | null } };
    return json?.data?.subscriptionStatus ?? null;
  } catch {
    return null;
  }
}
