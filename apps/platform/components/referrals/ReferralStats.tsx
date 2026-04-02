// apps/platform/components/referrals/ReferralStats.tsx

'use client';

import { Users, CheckCircle, TrendingUp, Wallet, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { useReferralStats } from '@/hooks/useReferrals';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { formatCurrency } from '@/lib/utils/referralHelpers';
import { cn } from '@/lib/utils';

export function ReferralStats() {
  const { stats, isLoading } = useReferralStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      description: `${stats?.clickCount || 0} link clicks`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Qualified Referrals',
      value: stats?.qualifiedReferrals || 0,
      description: `${stats?.pendingReferrals || 0} pending`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate || 0}%`,
      description: 'Click to signup',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats?.totalEarnings || 0),
      description: `${formatCurrency(stats?.pendingRewards || 0)} pending`,
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <Icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}