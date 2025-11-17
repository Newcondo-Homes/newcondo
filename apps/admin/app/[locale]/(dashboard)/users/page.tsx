import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserFilters from '@/components/admin/UserFilters';
import UserStatsCards from '@/components/admin/UserStatsCards';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.users' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

// Fetch user statistics
async function getUserStats() {
  // TODO: Implement actual API call to admin service
  return {
    totalUsers: 1247,
    verifiedUsers: 892,
    pendingVerification: 23,
    rejectedVerification: 12,
    activeUsers: 1015,
    owners: 456,
    agents: 234,
    renters: 557,
  };
}

// Fetch users with pagination and filters
async function getUsers(searchParams: any) {
  // TODO: Implement actual API call to admin service
  return {
    users: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+234 800 000 0001',
        role: 'OWNER',
        verificationStatus: 'VERIFIED',
        createdAt: new Date('2024-01-15'),
        isPremium: false,
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+234 800 000 0002',
        role: 'AGENT',
        verificationStatus: 'PENDING',
        createdAt: new Date('2024-02-20'),
        isPremium: true,
      },
      // More mock users...
    ],
    pagination: {
      total: 1247,
      page: 1,
      pageSize: 20,
      totalPages: 63,
    },
  };
}

export default async function UsersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: any;
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.users' });
  const stats = await getUserStats();
  const { users, pagination } = await getUsers(searchParams);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={stats} locale={locale} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <UserFilters locale={locale} />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Suspense fallback={<LoadingSpinner />}>
          <UserManagementTable
            users={users}
            pagination={pagination}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  );
}