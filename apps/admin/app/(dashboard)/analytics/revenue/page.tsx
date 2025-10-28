// apps/admin/src/app/(dashboard)/analytics/revenue/page.tsx
"use client";

import { useState } from "react";
// Corrected import path for useQuery
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
import { ArrowLeft, Download, DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyticsApi } from "@/lib/api/analytics";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Mock Interface for Revenue Data (assumes API returns this structure)
interface RevenueAnalyticsData {
  totalRevenue: number;
  growthRate: number; // e.g., 5.5 or -2.1
  platformFees: number;
  platformFeePercentage: number;
  avgTransaction: number;
  totalTransactions: number;
  successRate: number;
  revenueTrend: { date: string; revenue: number; }[];
  revenueBySource: { name: string; value: number; }[];
  transactionStatus: { status: string; count: number; }[];
}


export default function RevenueAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { data: analytics, isLoading } = useQuery<RevenueAnalyticsData>({
    queryKey: ["analytics-revenue", timeRange],
    queryFn: () => analyticsApi.getRevenueAnalytics(timeRange),
  });

  const handleExport = () => {
    analyticsApi.exportRevenueAnalytics(timeRange);
  };

  if (isLoading) {
    return <div className="p-8">Loading revenue analytics...</div>;
  }

  const growthRate = analytics?.growthRate || 0;
  const isPositiveGrowth = growthRate >= 0;

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
            <h1 className="text-3xl font-bold">Revenue Analytics</h1>
            <p className="text-muted-foreground">Financial performance and transaction metrics</p>
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(analytics?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isPositiveGrowth ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={isPositiveGrowth ? "text-green-600" : "text-red-600"}>
                {Math.abs(growthRate)}%
              </span>
              {" "}vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(analytics?.platformFees || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.platformFeePercentage || 0}% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(analytics?.avgTransaction || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={analytics?.revenueTrend || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="Revenue (₦)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.revenueBySource || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.revenueBySource?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analytics?.revenueBySource?.map((source: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="font-semibold">₦{source.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Status - Completed Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.transactionStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
