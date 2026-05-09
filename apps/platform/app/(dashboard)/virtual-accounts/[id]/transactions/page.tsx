// apps/platform/app/(dashboard)/virtual-accounts/[id]/transactions/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TransactionsClient } from './_components/TransactionsClient';
import { VirtualAccountDetails } from '@/components/virtual-accounts/VirtualAccountDetails';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

async function getVirtualAccount(id: string) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/virtual-accounts/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
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

async function getTransactions(
  accountId: string,
  filters: {
    page: number;
    limit: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  try {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    );

    const response = await fetch(
      `${process.env.API_BASE_URL}/virtual-accounts/${accountId}/transactions?${params}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch transactions:', response.status);
      return [];
    }

    const data = await response.json();
    return data.transactions ?? [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export default async function VirtualAccountTransactionsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { page, limit, type, status, startDate, endDate } = await searchParams;

  const transactionFilters = {
    page: parseInt(page || '1'),
    limit: parseInt(limit || '20'),
    type,
    status,
    startDate,
    endDate,
  };

  const [virtualAccount, transactions] = await Promise.all([
    getVirtualAccount(id),
    getTransactions(id, transactionFilters),
  ]);

  if (!virtualAccount) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Virtual Accounts', href: '/virtual-accounts' },
    { label: virtualAccount.accountName, href: `/virtual-accounts/${id}` },
    { label: 'Transactions' },
  ];

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
              <TransactionsClient
                accountId={id}
                transactions={transactions}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params;
    const virtualAccount = await getVirtualAccount(id);

    if (!virtualAccount) {
      return {
        title: 'Virtual Account Not Found',
      };
    }

    return {
      title: `${virtualAccount.accountName} - Transactions | NewCondo`,
      description: `View transaction history for virtual account ${virtualAccount.accountName}`,
    };
  } catch {
    return {
      title: 'Virtual Account Transactions | NewCondo',
    };
  }
}