"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/components/tabs";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  MapPin,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MarkingAnalytics {
  overview: {
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    cancelledJobs: number;
    averageCompletionTime: number;
    totalRevenue: number;
    agentEarnings: number;
    platformEarnings: number;
  };
  trends: Array<{
    date: string;
    completed: number;
    queued: number;
    cancelled: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    totalJobs: number;
    completedJobs: number;
    averageTime: number;
    reliabilityScore: number;
    totalEarnings: number;
  }>;
  locationStats: Array<{
    state: string;
    totalJobs: number;
    completedJobs: number;
    averageCompletionTime: number;
  }>;
  timeSlotUtilization: Array<{
    hour: string;
    assignments: number;
    completions: number;
  }>;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function MarkingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<MarkingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics/marking?days=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching marking analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/marking/export?days=${timeRange}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marking-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting analytics:", err);
    }
  };

  const completionRate = analytics 
    ? ((analytics.overview.completedJobs / analytics.overview.totalJobs) * 100).toFixed(1)
    : "0";

  const avgCompletionHours = analytics
    ? (analytics.overview.averageCompletionTime / 3600000).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marking Service Analytics</h1>
          <p className="text-muted-foreground">
            Track property marking job performance and agent metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.cancelledJobs} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionHours}h</div>
            <p className="text-xs text-muted-foreground">
              Target: 3 hours per job
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{analytics.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform: ₦{analytics.overview.platformEarnings.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Job Trends</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="locations">Location Stats</TabsTrigger>
          <TabsTrigger value="timeslots">Time Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Status Over Time</CardTitle>
              <CardDescription>Track marking job trends and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                  <Line type="monotone" dataKey="queued" stroke="#f59e0b" name="Queued" />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
              <CardDescription>Agent metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.agentPerformance.slice(0, 10).map((agent, idx) => (
                  <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">#{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{agent.agentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.completedJobs} / {agent.totalJobs} jobs completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time</p>
                        <p className="font-medium">{(agent.averageTime / 3600000).toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <Badge variant={agent.reliabilityScore >= 4.5 ? "default" : "secondary"}>
                          {agent.reliabilityScore.toFixed(1)} ⭐
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Earnings</p>
                        <p className="font-medium">₦{agent.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Location</CardTitle>
              <CardDescription>Geographic distribution of marking jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.locationStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalJobs" fill="#10b981" name="Total Jobs" />
                  <Bar dataKey="completedJobs" fill="#06b6d4" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeslots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Slot Utilization</CardTitle>
              <CardDescription>Peak hours for marking job assignments and completions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics.timeSlotUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assignments" fill="#8b5cf6" name="Assignments" />
                  <Bar dataKey="completions" fill="#10b981" name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}