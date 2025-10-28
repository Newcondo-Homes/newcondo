"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyticsApi } from "@/lib/api/analytics";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Mock structure for analytics data (replace with actual types from API)
interface UserAnalyticsData {
  totalUsers: number;
  newUsers: number;
  verifiedUsers: number;
  verificationRate: number;
  activeUsers: number;
  churnRate: number;
  growthData: { date: string; total: number; new: number; active: number; }[];
  roleDistribution: { name: string; value: number; }[];
  verificationStatus: { status: string; count: number; }[];
  avgSessionDuration: number; // in minutes
  avgPropertiesPerUser: number;
  returnRate: number;
  topLocations: { location: string; users: number; }[];
  acquisitionChannels: { name: string; count: number; percentage: number; }[];
}

export default function UserAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // In a real application, you would ensure analyticsApi.getUserAnalytics returns UserAnalyticsData
  const { data: analytics, isLoading } = useQuery<UserAnalyticsData>({
    queryKey: ["analytics-users", timeRange],
    // NOTE: This assumes 'analyticsApi' and 'getUserAnalytics' are defined elsewhere
    queryFn: () => analyticsApi.getUserAnalytics(timeRange), 
  });

  const handleExport = () => {
    // NOTE: This assumes 'analyticsApi' and 'exportUserAnalytics' are defined elsewhere
    analyticsApi.exportUserAnalytics(timeRange);
  };

  if (isLoading) {
    return <div className="p-8">Loading user analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Analytics</h1>
            <p className="text-muted-foreground">Detailed user behavior and growth metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics - 4-Column Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analytics?.newUsers || 0}</span> new users
            </p>
          </CardContent>
        </Card>

        {/* Verified Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.verifiedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.verificationRate || 0}% verification rate
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days activity
            </p>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.churnRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Inactive for 90+ days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.growthData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Users" />
              <Line type="monotone" dataKey="new" stroke="#82ca9d" name="New Users" />
              <Line type="monotone" dataKey="active" stroke="#ffc658" name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Distribution by Role */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.roleDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.roleDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.verificationStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Average Session Duration</h3>
              <p className="text-2xl font-bold">{analytics?.avgSessionDuration || 0} min</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Properties per User</h3>
              <p className="text-2xl font-bold">{analytics?.avgPropertiesPerUser || 0}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Return Rate</h3>
              <p className="text-2xl font-bold">{analytics?.returnRate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Top Locations by User Count</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.topLocations || []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#8884d8" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Acquisition Channels */}
      <Card>
        <CardHeader>
          <CardTitle>User Acquisition Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics?.acquisitionChannels?.map((channel: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{channel.count} users</span>
                  <span className="text-sm font-semibold">{channel.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
