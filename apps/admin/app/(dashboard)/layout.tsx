import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Protect admin routes - only admins can access
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader user={session.user} />

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}