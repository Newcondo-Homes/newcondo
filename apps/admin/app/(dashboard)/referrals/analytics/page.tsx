// apps/admin/src/app/(dashboard)/referrals/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReferralAnalyticsCharts from "@/components/referrals/ReferralAnalyticsCharts";
import ReferralExport from "@/components/referrals/ReferralExport";
import { referralAdminAPI } from "@/lib/api/referralAdmin";
import { Calendar, Download, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  referralsByType: Array<{ type: string; count: number; percentage: number }>;
  referralsByMonth: Array<{
    month: string;
    count: number;
    qualified: number;
    rewarded: number;
  }>;
  rewardsByType: Array<{ type: string; amount: number; count: number }>;
  performanceMetrics: {
    avgTimeToQualify: number;
    avgTimeToReward: number;
    qualificationRate: number;
    rewardRedemptionRate: number;
  };
}

export default function ReferralAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await referralAdminAPI.getAnalytics(dateRange);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      await referralAdminAPI.generateReport({
        reportType: "performance",
        startDate: dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: dateRange.endDate || new Date().toISOString(),
        format: "pdf",
      });

      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    } catch (error) {
      console.error("Report generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into referral program performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <ReferralExport />
        </div>
      </div>

      {/* Performance Metrics */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Avg. Time to Qualify
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.performanceMetrics.avgTimeToQualify.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">
                From referral to qualification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Avg. Time to Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.performanceMetrics.avgTimeToReward.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">
                From qualification to reward
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Qualification Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.performanceMetrics.qualificationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Referrals that qualify
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.performanceMetrics.rewardRedemptionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Rewards redeemed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ReferralAnalyticsCharts data={analytics} />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referrals by Type</CardTitle>
              <CardDescription>Breakdown of referral types</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.referralsByType.length > 0 ? (
                <div className="space-y-4">
                  {analytics.referralsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium min-w-[150px]">
                          {item.type.replace(/_/g, " → ")}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <span className="font-bold">{item.count}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rewards by Type</CardTitle>
              <CardDescription>Distribution of reward types</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.rewardsByType.length > 0 ? (
                <div className="space-y-4">
                  {analytics.rewardsByType.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.type.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">{item.count} rewards</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          ₦{item.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Total amount</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Referral activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.referralsByMonth.length > 0 ? (
                <div className="space-y-2">
                  {analytics.referralsByMonth.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-3 border-b last:border-0"
                    >
                      <span className="font-medium">{item.month}</span>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qualified: </span>
                          <span className="font-semibold">{item.qualified}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rewarded: </span>
                          <span className="font-semibold">{item.rewarded}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}