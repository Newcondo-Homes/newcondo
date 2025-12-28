// apps/platform/app/(dashboard)/referrals/rewards/page.tsx

import { Metadata } from 'next';
import { RewardsList } from '@/components/referrals/RewardsList';
import { RewardTiers } from '@/components/referrals/RewardTiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRewardsSummary } from '@/hooks/useRewards';
import { formatCurrency } from '@/lib/utils/referralHelpers';
import { Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Rewards | NewCondo',
  description: 'View and manage your referral rewards',
};

function RewardsSummaryCards() {
  const { summary } = useRewardsSummary();

  const cards = [
    {
      title: 'Total Rewards',
      value: formatCurrency(summary?.totalValue || 0),
      icon: Wallet,
      color: 'text-blue-600',
    },
    {
      title: 'Available Balance',
      value: formatCurrency(summary?.availableBalance || 0),
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Pending Approval',
      value: formatCurrency(summary?.lockedBalance || 0),
      icon: Clock,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function RewardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Rewards</h1>
        <p className="text-muted-foreground mt-1">
          View and redeem your referral rewards
        </p>
      </div>

      <RewardsSummaryCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RewardsList />
        </div>

        <div>
          <RewardTiers />
        </div>
      </div>
    </div>
  );
}