"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, TrendingUp, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyStats {
  total: number;
  published: number;
  rented: number;
  totalViews: number;
}

interface PropertyStatsCardsProps {
  stats?: PropertyStats;
  isLoading: boolean;
}

export default function PropertyStatsCards({
  stats,
  isLoading,
}: PropertyStatsCardsProps) {
  const statsData = [
    {
      title: "Total Properties",
      value: stats?.total || 0,
      icon: Building2,
      description: "All your listings",
      color: "text-blue-600",
    },
    {
      title: "Published",
      value: stats?.published || 0,
      icon: CheckCircle,
      description: "Active listings",
      color: "text-green-600",
    },
    {
      title: "Rented",
      value: stats?.rented || 0,
      icon: TrendingUp,
      description: "Successfully rented",
      color: "text-purple-600",
    },
    {
      title: "Total Views",
      value: stats?.totalViews || 0,
      icon: Eye,
      description: "Across all properties",
      color: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}