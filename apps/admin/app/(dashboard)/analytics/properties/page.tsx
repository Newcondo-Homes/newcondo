// apps/admin/src/app/(dashboard)/analytics/properties/page.tsx
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
import { ArrowLeft, Download, Home, CheckCircle, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyticsApi } from "@/lib/api/analytics";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B9D"];

export default function PropertyAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-properties", timeRange],
    queryFn: () => analyticsApi.getPropertyAnalytics(timeRange),
  });

  const handleExport = () => {
    analyticsApi.exportPropertyAnalytics(timeRange);
  };

  if (isLoading) {
    return <div className="p-8">Loading property analytics...</div>;
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
            <h1 className="text-3xl font-bold">Property Analytics</h1>
            <p className="text-muted-foreground">Listing performance and inventory metrics</p>
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
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analytics?.newProperties || 0}</span> new listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.publishedProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.publishRate || 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.pendingProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg. approval: {analytics?.avgApprovalTime || 0}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Views</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgViews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Per property
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Listing Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Property Listings Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.listingTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
              <Line type="monotone" dataKey="published" stroke="#82ca9d" name="Published" />
              <Line type="monotone" dataKey="rented" stroke="#ffc658" name="Rented" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Property Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.typeDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics?.typeDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Status */}
        <Card>
          <CardHeader>
            <CardTitle>Property Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.statusBreakdown || []}>
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

      {/* Price Range Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Price Range Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.priceRanges || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Properties" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Locations by Property Count</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.topLocations || []} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="location" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Properties" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Boundary & Marking Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Boundary Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verified Boundaries</span>
                <span className="text-2xl font-bold text-green-600">{analytics?.boundaryVerified || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Marking</span>
                <span className="text-2xl font-bold text-yellow-600">{analytics?.pendingMarking || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Duplicates Detected</span>
                <span className="text-2xl font-bold text-red-600">{analytics?.duplicatesDetected || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verification Rate</span>
                <span className="text-2xl font-bold">{analytics?.verificationRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Time to Publish</span>
                <span className="text-2xl font-bold">{analytics?.avgTimeToPublish || 0}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Time to Rent</span>
                <span className="text-2xl font-bold">{analytics?.avgTimeToRent || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Images per Listing</span>
                <span className="text-2xl font-bold">{analytics?.avgImagesPerListing || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="text-2xl font-bold">{analytics?.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Family vs Single Unit */}
      <Card>
        <CardHeader>
          <CardTitle>Property Structure Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Single Unit Properties</h3>
              <p className="text-3xl font-bold">{analytics?.singleUnitProperties || 0}</p>
              <p className="text-sm text-muted-foreground">
                {analytics?.singleUnitPercentage || 0}% of total
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Multi-Family Properties</h3>
              <p className="text-3xl font-bold">{analytics?.multiFamilyProperties || 0}</p>
              <p className="text-sm text-muted-foreground">
                {analytics?.totalUnits || 0} total units available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}