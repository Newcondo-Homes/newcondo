"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import { Building2, CheckCircle, Clock, XCircle } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface PropertyAnalyticsProps {
  dateRange: DateRange;
}

export default function PropertyAnalytics({ dateRange }: PropertyAnalyticsProps) {
  // Mock data - replace with actual API call
  const propertyStats = {
    totalProperties: 3421,
    approvedProperties: 2876,
    pendingApproval: 398,
    rejectedProperties: 147,
    availableProperties: 2341,
    rentedProperties: 535,
    propertiesByType: {
      APARTMENT: 1567,
      HOUSE: 892,
      DUPLEX: 456,
      ROOM: 234,
      SHARED_APARTMENT: 189,
      OFFICE: 52,
      SHOP: 21,
      WAREHOUSE: 10,
    },
    propertiesByState: [
      { state: "Lagos", count: 1876 },
      { state: "Abuja", count: 654 },
      { state: "Port Harcourt", count: 432 },
      { state: "Ibadan", count: 234 },
      { state: "Kano", count: 125 },
      { state: "Others", count: 100 },
    ],
    propertyGrowthData: [
      { month: "Jan", total: 2345, approved: 1987, rented: 342 },
      { month: "Feb", total: 2567, approved: 2123, rented: 398 },
      { month: "Mar", total: 2789, approved: 2301, rented: 445 },
      { month: "Apr", total: 2987, approved: 2456, rented: 478 },
      { month: "May", total: 3198, approved: 2687, rented: 501 },
      { month: "Jun", total: 3421, approved: 2876, rented: 535 },
    ],
    boundaryVerificationData: {
      verified: 2134,
      pending: 987,
      disputed: 234,
      notMarked: 66,
    },
  };

  const chartConfig = {
    growth: {
      type: "line" as const,
      data: propertyStats.propertyGrowthData,
      xKey: "month",
      lines: [
        { dataKey: "total", stroke: "#3b82f6", name: "Total" },
        { dataKey: "approved", stroke: "#10b981", name: "Approved" },
        { dataKey: "rented", stroke: "#f59e0b", name: "Rented" },
      ],
    },
    types: {
      type: "bar" as const,
      data: Object.entries(propertyStats.propertiesByType).map(([type, count]) => ({
        type,
        count,
      })),
      xKey: "type",
      bars: [{ dataKey: "count", fill: "#3b82f6", name: "Properties" }],
    },
    states: {
      type: "bar" as const,
      data: propertyStats.propertiesByState,
      xKey: "state",
      bars: [{ dataKey: "count", fill: "#10b981", name: "Properties" }],
    },
    boundary: {
      type: "pie" as const,
      data: [
        { name: "Verified", value: propertyStats.boundaryVerificationData.verified, color: "#10b981" },
        { name: "Pending", value: propertyStats.boundaryVerificationData.pending, color: "#f59e0b" },
        { name: "Disputed", value: propertyStats.boundaryVerificationData.disputed, color: "#ef4444" },
        { name: "Not Marked", value: propertyStats.boundaryVerificationData.notMarked, color: "#6b7280" },
      ],
      dataKey: "value",
      nameKey: "name",
    },
  };

  return (
    <div className="space-y-6">
      {/* Property Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertyStats.totalProperties.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {propertyStats.availableProperties} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyStats.approvedProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((propertyStats.approvedProperties / propertyStats.totalProperties) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyStats.pendingApproval.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((propertyStats.pendingApproval / propertyStats.totalProperties) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertyStats.rejectedProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((propertyStats.rejectedProperties / propertyStats.totalProperties) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ChartContainer
        title="Property Growth Over Time"
        description="Total, approved, and rented properties trend"
        config={chartConfig.growth}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer
          title="Properties by Type"
          description="Distribution across property types"
          config={chartConfig.types}
        />

        <ChartContainer
          title="Boundary Verification Status"
          description="Property boundary marking status"
          config={chartConfig.boundary}
        />
      </div>

      <ChartContainer
        title="Properties by State"
        description="Geographic distribution of properties"
        config={chartConfig.states}
      />

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(propertyStats.propertiesByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="font-medium">{type.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {((count / propertyStats.totalProperties) * 100).toFixed(1)}%
                    </span>
                    <span className="font-bold">{count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}