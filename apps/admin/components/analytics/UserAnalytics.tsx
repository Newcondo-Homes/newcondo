"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface UserAnalyticsProps {
  dateRange: DateRange;
}

export default function UserAnalytics({ dateRange }: UserAnalyticsProps) {
  // Mock data - replace with actual API call
  const userStats = {
    totalUsers: 12453,
    verifiedUsers: 8921,
    pendingVerification: 2134,
    rejectedUsers: 421,
    newUsers: 1523,
    activeUsers: 9876,
    usersByRole: {
      OWNER: 4231,
      AGENT: 1892,
      RENTER: 6012,
      ADMIN: 23,
    },
    userGrowthData: [
      { month: "Jan", users: 8234, verified: 5432 },
      { month: "Feb", users: 9123, verified: 6234 },
      { month: "Mar", users: 9876, verified: 7123 },
      { month: "Apr", users: 10543, verified: 7892 },
      { month: "May", users: 11234, verified: 8456 },
      { month: "Jun", users: 12453, verified: 8921 },
    ],
    verificationStatusData: [
      { name: "Verified", value: 8921, color: "#10b981" },
      { name: "Pending", value: 2134, color: "#f59e0b" },
      { name: "Rejected", value: 421, color: "#ef4444" },
      { name: "Not Started", value: 977, color: "#6b7280" },
    ],
  };

  const chartConfig = {
    users: {
      type: "line" as const,
      data: userStats.userGrowthData,
      xKey: "month",
      lines: [
        { dataKey: "users", stroke: "#3b82f6", name: "Total Users" },
        { dataKey: "verified", stroke: "#10b981", name: "Verified Users" },
      ],
    },
    roles: {
      type: "bar" as const,
      data: Object.entries(userStats.usersByRole).map(([role, count]) => ({
        role,
        count,
      })),
      xKey: "role",
      bars: [{ dataKey: "count", fill: "#3b82f6", name: "Users" }],
    },
    verification: {
      type: "pie" as const,
      data: userStats.verificationStatusData,
      dataKey: "value",
      nameKey: "name",
    },
  };

  return (
    <div className="space-y-6">
      {/* User Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{userStats.newUsers} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.verifiedUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((userStats.verifiedUsers / userStats.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <UserPlus className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats.pendingVerification.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((userStats.pendingVerification / userStats.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Users</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.rejectedUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((userStats.rejectedUsers / userStats.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer
          title="User Growth Over Time"
          description="Total and verified users trend"
          config={chartConfig.users}
        />

        <ChartContainer
          title="Verification Status Distribution"
          description="Current verification status breakdown"
          config={chartConfig.verification}
        />
      </div>

      <ChartContainer
        title="Users by Role"
        description="Distribution of users across different roles"
        config={chartConfig.roles}
      />

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Breakdown by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(userStats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-medium">{role}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {((count / userStats.totalUsers) * 100).toFixed(1)}%
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