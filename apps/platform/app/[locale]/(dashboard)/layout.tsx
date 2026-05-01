import { redirect } from 'next/navigation';
import { getServerSession } from '@newcondo/auth';
import Navbar  from '@/components/shared/navigation/Navbar';
import  Sidebar from '@/components/shared/navigation/Sidebar';
import { Role, VerificationStatus } from '@newcondo/db';


interface SidebarUser {
  id: string;
  email: string;
  name?: string | null | undefined;
  role: Role;
  image?: string | null | undefined;
  phone?: string | null | undefined;
  verificationStatus: VerificationStatus;
  isAvailableForMarking?: boolean
}

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession();
  const user = session?.user

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Navbar locale={locale} /> */}
      <Navbar/>

      
      <div className="flex">
        {/* <Sidebar locale={locale} /> */}
        <Sidebar user={user as SidebarUser} />

        
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}