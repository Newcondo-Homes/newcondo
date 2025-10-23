// apps/admin/src/app/(dashboard)/marking-analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Download, Calendar } from "lucide-react";
import MarkingAnalytics from "@/components/admin/MarkingAnalytics";
import { Button } from "@newcondo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Alert, AlertDescription } from "@newcondo/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import { markingOversightApi } from "@/lib/api/markingOversight";
import type { MarkingAnalyticsData, DateRange } from "@/types/admin";

export default function MarkingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<MarkingAnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await markingOversightApi.getAnalytics(dateRange);
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await markingOversightApi.exportAnalytics(dateRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export analytics");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marking Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for property marking operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleExport} 
            disabled={exporting}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      {analyticsData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{analyticsData.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.revenueGrowth}% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.completedJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.completionRate}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.activeAgents}</div>
                <p className="text-xs text-muted-foreground">
                  Avg. {analyticsData.avgJobsPerAgent} jobs/agent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.avgCompletionHours}h</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.completionTimeChange > 0 ? '+' : ''}{analyticsData.completionTimeChange}% vs last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Components */}
          <MarkingAnalytics data={analyticsData} dateRange={dateRange} />
        </>
      )}
    </div>
  );
}