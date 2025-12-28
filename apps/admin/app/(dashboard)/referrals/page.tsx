// apps/admin/src/app/(dashboard)/referrals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ReferralStatsCard from "@/components/referrals/ReferralStatsCard";
import ReferralTable from "@/components/referrals/ReferralTable";
import ReferralAnalyticsCharts from "@/components/referrals/ReferralAnalyticsCharts";
import ReferralFilters from "@/components/referrals/ReferralFilters";
import ReferralExport from "@/components/referrals/ReferralExport";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { RefreshCw, TrendingUp, Users, Award, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  qualifiedReferrals: number;
  pendingRewards: number;
  totalRewardsPaid: number;
  conversionRate: number;
  avgRewardAmount: number;
}

export default function ReferralOverviewPage() {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    qualifiedReferrals: 0,
    pendingRewards: 0,
    totalRewardsPaid: 0,
    conversionRate: 0,
    avgRewardAmount: 0,
  });
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [filters, pagination.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, referralsRes] = await Promise.all([
        referralAdminAPI.getStats(),
        referralAdminAPI.getReferrals({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        }),
      ]);

      setStats(statsRes.data);
      setReferrals(referralsRes.data.referrals);
      setPagination((prev) => ({
        ...prev,
        total: referralsRes.data.total,
      }));
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Data refreshed successfully",
    });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral System</h1>
          <p className="text-muted-foreground">
            Manage and monitor the referral program
          </p>
        </div>
        <div className="flex gap-2">
          <ReferralExport filters={filters} />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReferralStatsCard
          title="Total Referrals"
          value={stats.totalReferrals}
          icon={<Users className="h-4 w-4" />}
          description="All time referrals"
          trend={"+12% from last month"}
        />
        <ReferralStatsCard
          title="Active Referrals"
          value={stats.activeReferrals}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Currently active"
          trend={"+8% from last month"}
        />
        <ReferralStatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={<Award className="h-4 w-4" />}
          description="Qualified referrals"
        />
        <ReferralStatsCard
          title="Total Rewards Paid"
          value={`₦${stats.totalRewardsPaid.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          description={`Avg: ₦${stats.avgRewardAmount.toLocaleString()}`}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter referrals by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>

          {/* Referrals Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Referrals</CardTitle>
              <CardDescription>
                View and manage all referrals in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralTable
                referrals={referrals}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onRefresh={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ReferralAnalyticsCharts />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest referral activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralTable
                referrals={referrals.slice(0, 10)}
                loading={loading}
                showPagination={false}
                onRefresh={loadData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}