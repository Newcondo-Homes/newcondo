// apps/platform/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@newcondo/auth/';
import DashboardLayout from '@/components/shared/layouts/DashboardLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedDashboardLayout({ 
  children 
}: DashboardLayoutProps) {
  const session = await auth();
  // const { data: session, status } = useSession();

  if (!session) {
    redirect('/login');
  }

  console.info('😎😎😎😎', 'session is: ', session)
  
  // Check if user account is locked or requires additional verification
  // if (session.user.verificationStatus === 'REJECTED') {
  //   redirect('/profile/verification?error=rejected');
  // }

  // if (session.user.verificationStatus === 'PENDING' && session.user.role !== 'RENTER') {
  //   redirect('/profile/verification?warning=pending');
  // }

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}