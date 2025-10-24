// apps/admin/src/components/admin/MarkingAnalytics.tsx
"use client";

import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/tabs";
import type { MarkingAnalyticsData, DateRange } from "@/types/admin";

interface MarkingAnalyticsProps {
  data: MarkingAnalyticsData;
  dateRange: DateRange;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899"
};

export default function MarkingAnalytics({ data, dateRange }: MarkingAnalyticsProps) {
  // Helper function for formatting Naira currency
  const formatNaira = (value: number | string) => `₦${Number(value).toLocaleString()}`;
  const formatPercent = (value: number | string) => `${Number(value).toFixed(1)}%`;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="geographic">Geographic</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Jobs Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs Over Time</CardTitle>
              <CardDescription>Marking job trends for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.jobsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={COLORS.success} 
                    name="Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="queued" 
                    stroke={COLORS.primary} 
                    name="Queued"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cancelled" 
                    stroke={COLORS.danger} 
                    name="Cancelled"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current job status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Completion Times by Urgency */}
        <Card>
          <CardHeader>
            <CardTitle>Average Completion Time by Urgency</CardTitle>
            <CardDescription>How quickly jobs are completed based on urgency level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.completionTimeByUrgency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="urgency" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTime" fill={COLORS.primary} name="Avg. Time (hours)" />
                <Bar dataKey="targetTime" fill={COLORS.warning} name="Target Time (hours)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Performance Tab */}
      <TabsContent value="performance" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agents</CardTitle>
              <CardDescription>Agents with most completed jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topAgents} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="completedJobs" fill={COLORS.success} name="Completed Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Trend</CardTitle>
              <CardDescription>Job completion success over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.successRateTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} tickFormatter={formatPercent} />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Success Rate']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successRate" 
                    stroke={COLORS.success} 
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>Job quality and customer satisfaction indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">First Attempt Success</p>
                <p className="text-3xl font-bold">{data.firstAttemptSuccess}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-3xl font-bold">{data.avgRating}/5.0</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Dispute Rate</p>
                <p className="text-3xl font-bold">{data.disputeRate}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Resubmission Rate</p>
                <p className="text-3xl font-bold">{data.resubmissionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Financial Tab */}
      <TabsContent value="financial" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Marking service revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatNaira} />
                  <Tooltip formatter={(value) => [formatNaira(value), '']} />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill={COLORS.primary} name="Total Revenue" />
                  <Bar dataKey="platformFee" fill={COLORS.success} name="Platform Fee" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Payment processing status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.paymentStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatNaira(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.paymentStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNaira(value), 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Comprehensive financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatNaira(data.totalRevenue)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Agent Payouts</p>
                <p className="text-2xl font-bold">{formatNaira(data.agentPayouts)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Platform Earnings</p>
                <p className="text-2xl font-bold">{formatNaira(data.platformEarnings)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">{formatNaira(data.pendingPayments)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Avg. Job Value</p>
                <p className="text-2xl font-bold">{formatNaira(data.avgJobValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Geographic Tab */}
      <TabsContent value="geographic" className="space-y-4">
        {/* Jobs by Region */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Region</CardTitle>
            <CardDescription>Geographic distribution of marking jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.jobsByRegion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill={COLORS.success} name="Completed" />
                <Bar dataKey="inProgress" fill={COLORS.warning} name="In Progress" />
                <Bar dataKey="queued" fill={COLORS.primary} name="Queued" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Agent Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Distribution</CardTitle>
              <CardDescription>Number of agents per service area</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.agentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="agents" fill={COLORS.purple} name="Active Agents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance</CardTitle>
              <CardDescription>Success rate by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.regionalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis domain={[0, 100]} tickFormatter={formatPercent} />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Success Rate']} />
                  <Bar dataKey="successRate" fill={COLORS.success} name="Success Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Gaps */}
        {data.coverageGaps && data.coverageGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Coverage Gaps</CardTitle>
              <CardDescription>Areas with insufficient agent coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.coverageGaps.map((gap, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{gap.area}</p>
                      <p className="text-sm text-muted-foreground">
                        {gap.pendingJobs} pending jobs • {gap.availableAgents} agents
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        {gap.avgWaitTime}h avg. wait
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Need {gap.recommendedAgents} more agents
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}