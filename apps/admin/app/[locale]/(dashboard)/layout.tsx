import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

// This would typically validate the admin session
async function getAdminSession() {
  // TODO: Implement actual session validation with backend
  // For now, we'll simulate a session check
  const isAuthenticated = true; // Replace with actual session check
  
  if (!isAuthenticated) {
    return null;
  }

  return {
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@newcondo.com',
      role: 'ADMIN',
      image: null,
    },
  };
}

export default async function AdminDashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getAdminSession();
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar locale={locale} />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader session={session} locale={locale} />

        {/* Page Content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
              <p>© 2025 Newcondo. {t('footer.allRightsReserved')}</p>
              <div className="flex gap-4 mt-2 sm:mt-0">
                
                  href="#"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.privacyPolicy')}
                </a>
                
                  href="#"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.terms')}
                </a>
                
                  href="#"
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('footer.support')}
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}