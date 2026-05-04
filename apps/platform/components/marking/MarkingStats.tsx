"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Skeleton } from "@newcondo/ui/components/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/client";

interface MarkingStatsData {
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
  cancelledJobs: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  totalEarnings: number;
  pendingEarnings: number;
  reliabilityScore: number;
  trend: {
    jobs: number; // percentage change
    earnings: number; // percentage change
    completionRate: number; // percentage change
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
}

const StatCard = ({ title, value, subtitle, trend, trendLabel }: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (!trend) return "text-gray-500";
    if (trend > 0) return "text-green-500";
    if (trend < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-gray-500 text-xs">vs {trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function MarkingStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MarkingStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get(`/marking/agents/${user.id}/statistics`);
        setStats(response.data as MarkingStatsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching marking stats:", err);
        const errorMessage = err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Failed to load statistics";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
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

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Job Statistics */}
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          trend={stats.trend.jobs}
          trendLabel="last month"
        />

        <StatCard
          title="Completed Jobs"
          value={stats.completedJobs}
          subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
          trend={stats.trend.completionRate}
          trendLabel="last month"
        />

        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          subtitle="Currently in progress"
        />

        <StatCard
          title="Cancelled Jobs"
          value={stats.cancelledJobs}
          subtitle={`${((stats.cancelledJobs / stats.totalJobs) * 100).toFixed(1)}% of total`}
        />

        {/* Earnings Statistics */}
        <StatCard
          title="Total Earnings"
          value={`₦${stats.totalEarnings.toLocaleString()}`}
          trend={stats.trend.earnings}
          trendLabel="last month"
        />

        <StatCard
          title="Pending Earnings"
          value={`₦${stats.pendingEarnings.toLocaleString()}`}
          subtitle="Awaiting release"
        />

        {/* Performance Metrics */}
        <StatCard
          title="Avg. Completion Time"
          value={`${stats.averageCompletionTime.toFixed(1)}h`}
          subtitle="Per job"
        />

        <StatCard
          title="Reliability Score"
          value={stats.reliabilityScore.toFixed(2)}
          subtitle="Out of 5.00"
        />
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {stats.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {stats.averageCompletionTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg. Time to Complete</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                ₦{(stats.totalEarnings / Math.max(stats.completedJobs, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg. Earnings per Job</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}