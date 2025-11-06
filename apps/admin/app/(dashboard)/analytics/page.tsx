// apps/admin/src/app/(dashboard)/analytics/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { 
  Users, 
  Home, 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Fetch overview analytics
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview", timeRange],
    queryFn: () => analyticsApi.getOverview(timeRange),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform insights and performance metrics</p>
        </div>
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
      </div>

      {overviewLoading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{overview?.users.newThisPeriod || 0}</span> new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Properties Listed</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.properties.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{overview?.properties.newThisPeriod || 0}</span> new listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{(overview?.revenue.total || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+₦{(overview?.revenue.thisPeriod || 0).toLocaleString()}</span> this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.rentals.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overview?.rentals.pendingConfirmation || 0} pending confirmation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="marking">Marking Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Property Owners</span>
                      <span className="font-semibold">{overview?.users.byRole.OWNER || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Agents</span>
                      <span className="font-semibold">{overview?.users.byRole.AGENT || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Renters</span>
                      <span className="font-semibold">{overview?.users.byRole.RENTER || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Verification Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{overview?.users.verified || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold">{overview?.users.pending || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rejected</span>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">{overview?.users.rejected || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Premium Users</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Premium</span>
                      <span className="font-semibold">{overview?.users.premium || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                      <span className="font-semibold">
                        {((overview?.users.premium || 0) / (overview?.users.total || 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Link href="/analytics/users">
                  <Button variant="outline">View Detailed User Analytics</Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Property Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Published</span>
                      <span className="font-semibold">{overview?.properties.published || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending Approval</span>
                      <span className="font-semibold">{overview?.properties.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rented</span>
                      <span className="font-semibold">{overview?.properties.rented || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Boundary Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verified Boundaries</span>
                      <span className="font-semibold">{overview?.properties.boundaryVerified || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending Marking</span>
                      <span className="font-semibold">{overview?.properties.pendingMarking || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duplicates Detected</span>
                      <span className="font-semibold text-red-600">{overview?.properties.duplicates || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {overview?.properties.topLocations?.slice(0, 3).map((location: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{location.city}</span>
                        <span className="font-semibold">{location.count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Link href="/analytics/properties">
                  <Button variant="outline">View Detailed Property Analytics</Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rent Payments</span>
                      <span className="font-semibold">₦{(overview?.revenue.rent || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Marking Services</span>
                      <span className="font-semibold">₦{(overview?.revenue.marking || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Premium Subscriptions</span>
                      <span className="font-semibold">₦{(overview?.revenue.premium || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Commission Earned</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Platform Fees</span>
                      <span className="font-semibold">₦{(overview?.revenue.platformFees || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average per Transaction</span>
                      <span className="font-semibold">₦{(overview?.revenue.avgTransaction || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Successful</span>
                      <span className="font-semibold text-green-600">{overview?.revenue.successfulPayments || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-semibold text-yellow-600">{overview?.revenue.pendingPayments || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Failed</span>
                      <span className="font-semibold text-red-600">{overview?.revenue.failedPayments || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Link href="/analytics/revenue">
                  <Button variant="outline">View Detailed Revenue Analytics</Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="marking" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Marking Jobs Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Queued</span>
                      <span className="font-semibold">{overview?.marking.queued || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">In Progress</span>
                      <span className="font-semibold">{overview?.marking.inProgress || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-semibold">{overview?.marking.completed || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Agents</span>
                      <span className="font-semibold">{overview?.marking.activeAgents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Completion Time</span>
                      <span className="font-semibold">{overview?.marking.avgCompletionTime || 0}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-semibold">{overview?.marking.successRate || 0}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Revenue from Marking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Earned</span>
                      <span className="font-semibold">₦{(overview?.marking.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Agent Payouts</span>
                      <span className="font-semibold">₦{(overview?.marking.agentPayouts || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Link href="/analytics/marking">
                  <Button variant="outline">View Detailed Marking Analytics</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}




















// import { Suspense } from 'react';
// import { Metadata } from 'next';
// import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
// import { Skeleton } from '@/components/ui/skeleton';

// export const metadata: Metadata = {
//   title: 'Analytics Dashboard | Newcondo Admin',
//   description: 'Comprehensive analytics and insights',
// };

// export default function AnalyticsPage() {
//   return (
//     <div className="container mx-auto py-6 space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
//         <p className="text-muted-foreground">
//           Comprehensive insights into platform performance and metrics
//         </p>
//       </div>

//       <Suspense fallback={<DashboardSkeleton />}>
//         <AnalyticsDashboard />
//       </Suspense>
//     </div>
//   );
// }

// function DashboardSkeleton() {
//   return (
//     <div className="space-y-6">
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {[...Array(4)].map((_, i) => (
//           <Skeleton key={i} className="h-32" />
//         ))}
//       </div>
//       <div className="grid gap-4 md:grid-cols-2">
//         {[...Array(4)].map((_, i) => (
//           <Skeleton key={i} className="h-80" />
//         ))}
//       </div>
//     </div>
//   );
// }