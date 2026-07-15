import { redirect } from 'next/navigation';
import { auth } from '@newcondo/auth';
import DashboardLayout from '@/components/shared/layouts/DashboardLayout';
import { UserType } from "@/types/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedDashboardLayout({
  children
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Only AGENTS and OWNERS with an ACTIVE (isPremium) subscription may enter
  // the dashboard. RENTERS are free-plan and never gated on isPremium here;
  // route them to their own free-tier home instead of the paid dashboard.
  const role = session.user.role;
  const isPremium = !!session.user.isPremium;

  if (role !== UserType.OWNER && role !== UserType.AGENT) {
    redirect('/onboarding');
  }
  console.info("💯💯 session is : ", session)
  if (!isPremium) {
    // Do NOT hard-redirect straight back to /onboarding here — right after a
    // successful Flutterwave charge, the webhook that flips isPremium: true
    // can still be a second or two behind the client's own success callback.
    // A hard redirect creates a ping-pong loop: dashboard sees isPremium:false
    // -> onboarding, onboarding's live DB check sees "already subscribed" ->
    // dashboard, repeat. Instead, render a short "confirming your payment"
    // holding screen that polls and moves on once the webhook lands.
    const ActivatingSubscription = (await import('@/components/auth/activating-subscription')).default;
    return <ActivatingSubscription />;
  }

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}

