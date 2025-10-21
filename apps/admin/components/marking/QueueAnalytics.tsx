"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar,
  Timer,
  DollarSign,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface QueueMetrics {
  totalJobs: number;
  queuedJobs: number;
  assignedJobs: number;
  completedJobs: number;
  expiredJobs: number;
  cancelledJobs: number;
  averageWaitTime: number; // in minutes
  averageCompletionTime: number; // in minutes
  agentUtilization: number; // percentage
  totalRevenue: number;
  platformRevenue: number;
  agentRevenue: number;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalAssigned: number;
  completed: number;
  expired: number;
  averageCompletionTime: number;
  reliabilityScore: number;
  totalEarnings: number;
}

interface TimeSlotUtilization {
  hour: string;
  assigned: number;
  completed: number;
  expired: number;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export function QueueAnalytics() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotUtilization[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/marking-jobs/analytics?range=${dateRange}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setMetrics(data.metrics);
      setAgentPerformance(data.agentPerformance);
      setTimeSlotData(data.timeSlotUtilization);
      setStatusDistribution(data.statusDistribution);
    } catch (error) {
      toast.error("Failed to load analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const COLORS = {
    queued: "#3b82f6",
    assigned: "#8b5cf6",
    completed: "#10b981",
    expired: "#ef4444",
    cancelled: "#6b7280",
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Queue Performance Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights into property marking queue operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.queuedJobs} in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutesToHours(metrics.averageWaitTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From queue to assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutesToHours(metrics.averageCompletionTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From assignment to completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agentUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active agents capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.completedJobs / metrics.totalJobs) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {metrics.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Jobs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.expiredJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.expiredJobs / metrics.totalJobs) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(metrics.totalRevenue / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform: ₦{(metrics.platformRevenue / 1000).toFixed(1)}k
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(metrics.agentRevenue / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.agentRevenue / metrics.totalRevenue) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
            <CardDescription>Current distribution of marking jobs by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Slot Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Time Slot Performance</CardTitle>
            <CardDescription>3-hour time slot utilization and outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill={COLORS.assigned} name="Assigned" />
                <Bar dataKey="completed" fill={COLORS.completed} name="Completed" />
                <Bar dataKey="expired" fill={COLORS.expired} name="Expired" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Agent Performance</CardTitle>
          <CardDescription>
            Agent reliability scores and completion statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentPerformance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No agent performance data available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Agent</th>
                      <th className="text-center py-3 px-4 font-medium">Assigned</th>
                      <th className="text-center py-3 px-4 font-medium">Completed</th>
                      <th className="text-center py-3 px-4 font-medium">Expired</th>
                      <th className="text-center py-3 px-4 font-medium">Avg Time</th>
                      <th className="text-center py-3 px-4 font-medium">Reliability</th>
                      <th className="text-right py-3 px-4 font-medium">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.slice(0, 10).map((agent) => {
                      const completionRate = (agent.completed / agent.totalAssigned) * 100;
                      return (
                        <tr key={agent.agentId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{agent.agentName}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {agent.agentId.slice(0, 8)}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{agent.totalAssigned}</Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className="bg-green-100 text-green-800">
                              {agent.completed}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge className="bg-red-100 text-red-800">
                              {agent.expired}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4 text-sm">
                            {formatMinutesToHours(agent.averageCompletionTime)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    agent.reliabilityScore >= 4
                                      ? "bg-green-500"
                                      : agent.reliabilityScore >= 3
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${(agent.reliabilityScore / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {agent.reliabilityScore.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            ₦{agent.totalEarnings.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Queue</span>
                <Badge variant={metrics.queuedJobs > 10 ? "destructive" : "default"}>
                  {metrics.queuedJobs} jobs
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <Badge variant="secondary">{metrics.assignedJobs} jobs</Badge>
              </div>
              {metrics.queuedJobs > 10 && (
                <div className="text-xs text-orange-600 mt-2 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Queue is getting backed up
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {((metrics.completedJobs / metrics.totalJobs) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expiry Rate</span>
                <span className="font-medium">
                  {((metrics.expiredJobs / metrics.totalJobs) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(metrics.completedJobs / metrics.totalJobs) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Platform (75%)</span>
                <span className="font-medium">
                  ₦{(metrics.platformRevenue / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Agents (25%)</span>
                <span className="font-medium">
                  ₦{(metrics.agentRevenue / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                <div
                  className="h-2 bg-blue-500 rounded"
                  style={{ width: "75%" }}
                  title="Platform"
                />
                <div
                  className="h-2 bg-green-500 rounded"
                  style={{ width: "25%" }}
                  title="Agents"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );