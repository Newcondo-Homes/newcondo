import { Suspense } from 'react';
import { Metadata } from 'next';
import KPICards from '@/components/analytics/KPICards';
import RevenueChart from '@/components/analytics/RevenueChart';
import UserGrowthChart from '@/components/analytics/UserGrowthChart';
import PropertyStatsChart from '@/components/analytics/PropertyStatsChart';
import TransactionChart from '@/components/analytics/TransactionChart';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Analytics Overview | Newcondo Admin',
  description: 'Platform overview and key metrics',
};

export default function OverviewPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            High-level platform metrics and trends
          </p>
        </div>
        <DateRangeFilter />
      </div>

      <Suspense fallback={<Skeleton className="h-32" />}>
        <KPICards />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <UserGrowthChart />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <PropertyStatsChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80" />}>
          <TransactionChart />
        </Suspense>
      </div>
    </div>
  );
}