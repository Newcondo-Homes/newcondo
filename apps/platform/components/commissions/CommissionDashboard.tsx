// apps/platform/components/commissions/CommissionDashboard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Clock,
  Download,
  ArrowUpRight,
} from 'lucide-react';

interface CommissionDashboardProps {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalWithdrawals: number;
  currency?: string;
  onWithdraw?: () => void;
  onViewHistory?: () => void;
}

export function CommissionDashboard({
  totalEarnings,
  availableBalance,
  pendingBalance,
  thisMonthEarnings,
  lastMonthEarnings,
  totalWithdrawals,
  currency = 'NGN',
  onWithdraw,
  onViewHistory,
}: CommissionDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateGrowth = () => {
    if (lastMonthEarnings === 0) return 0;
    return ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
  };

  const growth = calculateGrowth();

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(totalEarnings)}
          icon={DollarSign}
          trend={{
            value: growth,
            isPositive: growth >= 0,
          }}
          description="All-time earnings"
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(availableBalance)}
          icon={Wallet}
          description="Ready to withdraw"
          className="border-green-200 bg-green-50"
        />
        <StatCard
          title="Pending Balance"
          value={formatCurrency(pendingBalance)}
          icon={Clock}
          description="Under confirmation"
          className="border-yellow-200 bg-yellow-50"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(thisMonthEarnings)}
          icon={TrendingUp}
          description="Current month earnings"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Wallet className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Withdraw Earnings</h3>
                  <p className="text-sm text-muted-foreground">
                    Transfer available balance to your bank account
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={onWithdraw}
                      disabled={availableBalance === 0}
                      className="w-full"
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Withdraw {formatCurrency(availableBalance)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Download className="h-8 w-8 text-muted-foreground" />
                  <h3 className="font-semibold">Transaction History</h3>
                  <p className="text-sm text-muted-foreground">
                    View all your commission transactions
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={onViewHistory}
                      variant="outline"
                      className="w-full"
                    >
                      View History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Withdrawals</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalWithdrawals)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Withdrawal Rate</p>
                <p className="text-lg font-semibold">
                  {totalEarnings > 0
                    ? ((totalWithdrawals / totalEarnings) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}