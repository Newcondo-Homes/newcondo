import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - Newcondo',
  description: 'Secure admin access to Newcondo platform management',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // If user is already logged in as admin, redirect to dashboard
  if (session?.user?.role === 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}