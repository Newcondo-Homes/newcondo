"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import { MapPin, CheckCircle, Clock, Users } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface MarkingAnalyticsProps {
  dateRange: DateRange;
}

export default function MarkingAnalytics({ dateRange }: MarkingAnalyticsProps) {
  // Mock data - replace with actual API call
  const markingStats = {
    totalJobs: 892,
    completedJobs: 734,
    inProgressJobs: 89,
    queuedJobs: 69,
    averageCompletionTime: 4.2, // hours
    totalAgents: 234,
    activeAgents: 156,
    averageAgentRating: 4.6,
    jobsByStatus: [
      { status: "Completed", count: 734, color: "#10b981" },
      { status: "In Progress", count: 89, color: "#3b82f6" },
      { status: "Queued", count: 69, color: "#f59e0b" },
    ],
    jobsByMonth: [
      { month: "Jan", total: 98, completed: 89, cancelled: 9 },
      { month: "Feb", total: 124, completed: 112, cancelled: 12 },
      { month: "Mar", total: 156, completed: 143, cancelled: 13 },
      { month: "Apr", total: 187, completed: 171, cancelled: 16 },
      { month: "May", total: 213, completed: 196, cancelled: 17 },
      { month: "Jun", total: 249, completed: 231, cancelled: 18 },
    ],
    jobsByState: [
      { state: "Lagos", count: 456 },
      { state: "Abuja", count: 187 },
      { state: "Port Harcourt", count: 123 },
      { state: "Ibadan", count: 76 },
      { state: "Others", count: 50 },
    ],
    agentPerformance: [
      { name: "Top 10%", jobs: 234, rating: 4.9, avgTime: 2.8 },
      { name: "11-30%", jobs: 312, rating: 4.7, avgTime: 3.5 },
      { name: "31-60%", jobs: 198, rating: 4.5, avgTime: 4.8 },
      { name: "Bottom 40%", jobs: 148, rating: 4.2, avgTime: 6.2 },
    ],
    completionTimeDistribution: [
      { range: "< 2hrs", count: 234 },
      { range: "2-4hrs", count: 312 },
      { range: "4-6hrs", count: 156 },
      { range: "> 6hrs", count: 32 },
    ],
  };

  const chartConfig = {
    jobsOverTime: {
      type: "line" as const,
      data: markingStats.jobsByMonth,
      xKey: "month",
      lines: [
        { dataKey: "total", stroke: "#3b82f6", name: "Total Jobs" },
        { dataKey: "completed", stroke: "#10b981", name: "Completed" },
        { dataKey: "cancelled", stroke: "#ef4444", name: "Cancelled" },
      ],
    },
    jobsByState: {
      type: "bar" as const,
      data: markingStats.jobsByState,
      xKey: "state",
      bars: [{ dataKey: "count", fill: "#3b82f6", name: "Jobs" }],
    },
    jobStatus: {
      type: "pie" as const,
      data: markingStats.jobsByStatus.map((item) => ({
        name: item.status,
        value: item.count,
        color: item.color,
      })),
      dataKey: "value",
      nameKey: "name",
    },
    completionTime: {
      type: "bar" as const,
      data: markingStats.completionTimeDistribution,
      xKey: "range",
      bars: [{ dataKey: "count", fill: "#10b981", name: "Jobs" }],
    },
  };

  return (
    <div className="space-y-6">
      {/* Marking Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{markingStats.totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {markingStats.inProgressJobs + markingStats.queuedJobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {markingStats.completedJobs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((markingStats.completedJobs / markingStats.totalJobs) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{markingStats.averageCompletionTime} hrs</div>
            <p className="text-xs text-muted-foreground">Within 3-hour target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{markingStats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {markingStats.totalAgents} total agents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ChartContainer
        title="Marking Jobs Over Time"
        description="Total, completed, and cancelled jobs trend"
        config={chartConfig.jobsOverTime}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer
          title="Jobs by Status"
          description="Current status distribution"
          config={chartConfig.jobStatus}
        />

        <ChartContainer
          title="Completion Time Distribution"
          description="How long jobs take to complete"
          config={chartConfig.completionTime}
        />
      </div>

      <ChartContainer
        title="Jobs by State"
        description="Geographic distribution of marking jobs"
        config={chartConfig.jobsByState}
      />

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {markingStats.agentPerformance.map((tier) => (
              <div key={tier.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-medium">{tier.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{tier.jobs} jobs</p>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{tier.rating}/5.0</p>
                    <p className="text-xs text-muted-foreground">rating</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{tier.avgTime}hrs</p>
                    <p className="text-xs text-muted-foreground">avg time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Queue Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">In Queue</span>
                <span className="font-bold">{markingStats.queuedJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-bold">{markingStats.inProgressJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Wait Time</span>
                <span className="font-bold">1.2 hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Avg Rating</span>
                <span className="font-bold">{markingStats.averageAgentRating}/5.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Rate</span>
                <span className="font-bold">
                  {((markingStats.activeAgents / markingStats.totalAgents) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Jobs/Agent</span>
                <span className="font-bold">
                  {(markingStats.completedJobs / markingStats.activeAgents).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="font-bold">
                  {((markingStats.completedJobs / markingStats.totalJobs) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">On-Time Rate</span>
                <span className="font-bold">92.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cancellation Rate</span>
                <span className="font-bold">7.7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}