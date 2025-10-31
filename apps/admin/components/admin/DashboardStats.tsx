"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Users, Home, CheckCircle, Clock, TrendingUp, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  pendingVerifications: number;
  pendingPropertyApprovals: number;
  totalRevenue: number;
  markingJobsInProgress: number;
  newUsersToday: number;
  newPropertiesToday: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    pendingPropertyApprovals: 0,
    totalRevenue: 0,
    markingJobsInProgress: 0,
    newUsersToday: 0,
    newPropertiesToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `+${stats.newUsersToday} today`,
    },
    {
      title: "Total Properties",
      value: stats.totalProperties,
      icon: Home,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: `+${stats.newPropertiesToday} today`,
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "Requires action",
    },
    {
      title: "Property Approvals",
      value: stats.pendingPropertyApprovals,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "Pending review",
    },
    {
      title: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "All time",
    },
    {
      title: "Marking Jobs",
      value: stats.markingJobsInProgress,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "In progress",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse bg-gray-200 rounded" />
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 animate-pulse bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}