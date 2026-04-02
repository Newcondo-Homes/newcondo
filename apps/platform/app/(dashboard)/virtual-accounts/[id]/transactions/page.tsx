// apps/platform/app/(dashboard)/virtual-accounts/[id]/transactions/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import VirtualAccountTransactions from '@/components/virtual-accounts/VirtualAccountTransactions';
import { VirtualAccountDetails } from '@/components/virtual-accounts/VirtualAccountDetails';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

async function getVirtualAccount(id: string) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/virtual-accounts/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch virtual account');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching virtual account:', error);
    throw error;
  }
}

export default async function VirtualAccountTransactionsPage({
  params,
  searchParams,
}: PageProps) {
  const virtualAccount = await getVirtualAccount(params.id);

  if (!virtualAccount) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Virtual Accounts', href: '/virtual-accounts' },
    { label: virtualAccount.accountName, href: `/virtual-accounts/${params.id}` },
    { label: 'Transactions' },
  ];

  const transactionFilters = {
    page: parseInt(searchParams.page || '1'),
    limit: parseInt(searchParams.limit || '20'),
    type: searchParams.type,
    status: searchParams.status,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Virtual Account Details Sidebar */}
        <div className="lg:w-1/3">
          <Suspense fallback={<LoadingSpinner />}>
            <VirtualAccountDetails
              virtualAccount={virtualAccount}
              showTransactionButton={false}
            />
          </Suspense>
        </div>

        {/* Transactions Main Content */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-semibold text-gray-900">
                Transaction History
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View all transactions for {virtualAccount.accountName}
              </p>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
              <VirtualAccountTransactions
                virtualAccountId={params.id}
                filters={transactionFilters}
                showHeader={false}
                showPagination={true}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const virtualAccount = await getVirtualAccount(params.id);

    if (!virtualAccount) {
      return {
        title: 'Virtual Account Not Found',
      };
    }

    return {
      title: `${virtualAccount.accountName} - Transactions | NewCondo`,
      description: `View transaction history for virtual account ${virtualAccount.accountName}`,
    };
  } catch (error) {
    return {
      title: 'Virtual Account Transactions | NewCondo',
    };
  }
}