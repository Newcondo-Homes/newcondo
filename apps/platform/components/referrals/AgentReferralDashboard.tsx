// apps/platform/components/referrals/AgentReferralDashboard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import {
  Users,
  Eye,
  DollarSign,
  TrendingUp,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface ReferralStats {
  totalSubAgents: number;
  activePromotions: number;
  totalViews: number;
  totalConversions: number;
  totalReferralEarnings: number;
  conversionRate: number;
  viewsThisMonth: number;
  earningsThisMonth: number;
}

interface AgentReferralDashboardProps {
  stats: ReferralStats;
  currency?: string;
  onViewSubAgents?: () => void;
  onViewPromotions?: () => void;
  onViewActivity?: () => void;
}

export function AgentReferralDashboard({
  stats,
  currency = 'NGN',
  onViewSubAgents,
  onViewPromotions,
  onViewActivity,
}: AgentReferralDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sub-Agents"
          value={stats.totalSubAgents}
          icon={Users}
          description="Agents promoting your properties"
        />
        <StatCard
          title="Active Promotions"
          value={stats.activePromotions}
          icon={Share2}
          description="Properties being promoted"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          icon={Eye}
          description={`${stats.viewsThisMonth} this month`}
        />
        <StatCard
          title="Referral Earnings"
          value={formatCurrency(stats.totalReferralEarnings)}
          icon={DollarSign}
          description={`${formatCurrency(stats.earningsThisMonth)} this month`}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Conversion Rate
                </span>
                <span className="font-semibold">{stats.conversionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.conversionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{stats.totalConversions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views per Conversion</p>
                <p className="text-2xl font-bold">
                  {stats.totalConversions > 0
                    ? Math.round(stats.totalViews / stats.totalConversions)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onViewSubAgents}
              variant="outline"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Sub-Agents
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              onClick={onViewPromotions}
              variant="outline"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                View Promotions
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              onClick={onViewActivity}
              variant="outline"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Activity Log
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}