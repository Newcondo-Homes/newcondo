'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Building2, TrendingUp, Activity, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface KPICardsProps {
  dateRange?: { from: Date; to: Date };
}

export default function KPICards({ dateRange }: KPICardsProps) {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['analytics-kpis', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange }),
      });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Revenue"
        value="₦12,450,000"
        change="+20.1%"
        icon={DollarSign}
        trend="up"
      />
      <KPICard
        title="Total Users"
        value="45,231"
        change="+2,350"
        icon={Users}
        trend="up"
      />
      <KPICard
        title="Active Properties"
        value="6,234"
        change="+412"
        icon={Building2}
        trend="up"
      />
      <KPICard
        title="Transactions"
        value="15,234"
        change="+1,432"
        icon={CreditCard}
        trend="up"
      />
      <KPICard
        title="Commission Earned"
        value="₦2,490,000"
        change="+12.5%"
        icon={TrendingUp}
        trend="up"
      />
      <KPICard
        title="Active Agents"
        value="3,456"
        change="+342"
        icon={Activity}
        trend="up"
      />
      <KPICard
        title="Avg. Property Price"
        value="₦2,450,000"
        change="+5.2%"
        icon={DollarSign}
        trend="up"
      />
      <KPICard
        title="Success Rate"
        value="92.7%"
        change="+2.3%"
        icon={TrendingUp}
        trend="up"
      />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }[trend];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trendColor} mt-1`}>
          {change} from last period
        </p>
      </CardContent>
    </Card>
  );
}