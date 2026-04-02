"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Building2, Eye, TrendingUp, CheckCircle } from "lucide-react";
import { Skeleton } from "@newcondo/ui/components/skeleton";

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











// // apps/platform/components/properties/PropertyStatsCards.tsx
// 'use client';

// import { StatCard } from '@/components/shared/StatCard';
// import {
//   Home,
//   CheckCircle,
//   Clock,
//   Eye,
//   DollarSign,
//   TrendingUp,
// } from 'lucide-react';

// interface PropertyStatsCardsProps {
//   stats: {
//     total: number;
//     published: number;
//     rented: number;
//     pending: number;
//     totalViews: number;
//     totalRevenue: number;
//   };
//   userRole: 'OWNER' | 'AGENT';
//   previousStats?: {
//     totalViews: number;
//     totalRevenue: number;
//   };
// }

// export function PropertyStatsCards({
//   stats,
//   userRole,
//   previousStats,
// }: PropertyStatsCardsProps) {
//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       notation: 'compact',
//     }).format(amount);
//   };

//   const calculateGrowth = (current: number, previous: number) => {
//     if (previous === 0) return 0;
//     return ((current - previous) / previous) * 100;
//   };

//   const viewsGrowth = previousStats
//     ? calculateGrowth(stats.totalViews, previousStats.totalViews)
//     : 0;

//   const revenueGrowth = previousStats
//     ? calculateGrowth(stats.totalRevenue, previousStats.totalRevenue)
//     : 0;

//   return (
//     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
//       <StatCard
//         title="Total Properties"
//         value={stats.total}
//         icon={Home}
//         description={`${stats.published} published`}
//       />
//       <StatCard
//         title="Published"
//         value={stats.published}
//         icon={CheckCircle}
//         description="Active listings"
//         className="border-green-200 bg-green-50"
//       />
//       <StatCard
//         title="Rented"
//         value={stats.rented}
//         icon={TrendingUp}
//         description="Currently occupied"
//         className="border-blue-200 bg-blue-50"
//       />
//       <StatCard
//         title="Pending"
//         value={stats.pending}
//         icon={Clock}
//         description="Awaiting approval"
//         className="border-yellow-200 bg-yellow-50"
//       />
//       <StatCard
//         title="Total Views"
//         value={stats.totalViews.toLocaleString()}
//         icon={Eye}
//         description="All-time views"
//         trend={
//           previousStats
//             ? {
//                 value: viewsGrowth,
//                 isPositive: viewsGrowth >= 0,
//               }
//             : undefined
//         }
//       />
//       {userRole === 'AGENT' && (
//         <StatCard
//           title="Total Revenue"
//           value={formatCurrency(stats.totalRevenue)}
//           icon={DollarSign}
//           description="Commission earned"
//           trend={
//             previousStats
//               ? {
//                   value: revenueGrowth,
//                   isPositive: revenueGrowth >= 0,
//                 }
//               : undefined
//           }
//           className="border-green-200 bg-green-50"
//         />
//       )}
//     </div>
//   );
// }