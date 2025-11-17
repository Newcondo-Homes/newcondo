import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import PropertyManagementTable from '@/components/admin/PropertyManagementTable';
import PropertyFilters from '@/components/admin/PropertyFilters';
import PropertyStatsCards from '@/components/admin/PropertyStatsCards';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.properties' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

// Fetch property statistics
async function getPropertyStats() {
  // TODO: Implement actual API call to analytics service
  return {
    totalProperties: 856,
    pendingApproval: 15,
    approved: 678,
    rejected: 23,
    available: 542,
    rented: 234,
    duplicateReports: 8,
    boundaryDisputes: 3,
  };
}

// Fetch properties with pagination and filters
async function getProperties(searchParams: any) {
  // TODO: Implement actual API call to property service
  return {
    properties: [
      {
        id: '1',
        title: 'Modern 2BR Apartment in Lekki',
        owner: 'John Doe',
        agent: null,
        price: 500000,
        city: 'Lagos',
        state: 'Lagos',
        status: 'PUBLISHED',
        adminApprovalStatus: 'APPROVED',
        boundaryVerified: true,
        createdAt: new Date('2024-01-15'),
        views: 156,
      },
      {
        id: '2',
        title: '3BR Duplex in Victoria Island',
        owner: 'Jane Smith',
        agent: 'Mike Johnson',
        price: 1200000,
        city: 'Lagos',
        state: 'Lagos',
        status: 'PENDING',
        adminApprovalStatus: 'PENDING',
        boundaryVerified: false,
        createdAt: new Date('2024-02-20'),
        views: 23,
      },
      // More mock properties...
    ],
    pagination: {
      total: 856,
      page: 1,
      pageSize: 20,
      totalPages: 43,
    },
  };
}

export default async function PropertiesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: any;
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard.properties' });
  const stats = await getPropertyStats();
  const { properties, pagination } = await getProperties(searchParams);

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
      <PropertyStatsCards stats={stats} locale={locale} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <PropertyFilters locale={locale} />
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <Suspense fallback={<LoadingSpinner />}>
          <PropertyManagementTable
            properties={properties}
            pagination={pagination}
            locale={locale}
          />
        </Suspense>
      </div>
    </div>
  );
}