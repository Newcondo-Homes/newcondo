"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAnalytics from "./UserAnalytics";
import PropertyAnalytics from "./PropertyAnalytics";
import RevenueAnalytics from "./RevenueAnalytics";
import MarkingAnalytics from "./MarkingAnalytics";
import DateRangeSelector from "./DateRangeSelector";
import ExportButton from "./ExportButton";
import { TrendingUp, Users, Building2, DollarSign, MapPin } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface OverviewStats {
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  totalMarkingJobs: number;
  userGrowth: number;
  propertyGrowth: number;
  revenueGrowth: number;
  markingJobGrowth: number;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API call
  const overviewStats: OverviewStats = {
    totalUsers: 12453,
    totalProperties: 3421,
    totalRevenue: 45678900,
    totalMarkingJobs: 892,
    userGrowth: 12.5,
    propertyGrowth: 8.3,
    revenueGrowth: 15.7,
    markingJobGrowth: 22.4,
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // Trigger data refresh
  };

  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    setLoading(true);
    try {
      // Implement export logic based on active tab
      console.log(`Exporting ${activeTab} data as ${format}`);
      // API call to export data
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance and key metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
          <ExportButton onExport={handleExport} loading={loading} />
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{overviewStats.userGrowth}%</span>
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewStats.totalProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{overviewStats.propertyGrowth}%</span>
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(overviewStats.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{overviewStats.revenueGrowth}%</span>
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marking Jobs</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewStats.totalMarkingJobs.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{overviewStats.markingJobGrowth}%</span>
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="marking">Marking Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">User Growth Trend</p>
                    <p className="text-2xl font-bold text-green-500">+{overviewStats.userGrowth}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Revenue Growth</p>
                    <p className="text-2xl font-bold text-green-500">+{overviewStats.revenueGrowth}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Active Properties</p>
                    <p className="text-2xl font-bold">{(overviewStats.totalProperties * 0.73).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completion Rate</p>
                    <p className="text-2xl font-bold">87%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="properties">
          <PropertyAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="marking">
          <MarkingAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
















// 'use client';

// import { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import KPICards from './KPICards';
// import RevenueChart from './RevenueChart';
// import UserGrowthChart from './UserGrowthChart';
// import PropertyStatsChart from './PropertyStatsChart';
// import TransactionChart from './TransactionChart';
// import AgentPerformanceChart from './AgentPerformanceChart';
// import TransactionTable from './TransactionTable';
// import DateRangeFilter from './DateRangeFilter';

// export default function AnalyticsDashboard() {
//   const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });

//   return (
//     <div className="space-y-6">
//       {/* KPI Overview */}
//       <KPICards dateRange={dateRange} />

//       {/* Main Analytics Tabs */}
//       <Tabs defaultValue="overview" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="overview">Overview</TabsTrigger>
//           <TabsTrigger value="revenue">Revenue</TabsTrigger>
//           <TabsTrigger value="users">Users</TabsTrigger>
//           <TabsTrigger value="properties">Properties</TabsTrigger>
//           <TabsTrigger value="transactions">Transactions</TabsTrigger>
//         </TabsList>

//         <TabsContent value="overview" className="space-y-4">
//           <div className="grid gap-4 md:grid-cols-2">
//             <RevenueChart dateRange={dateRange} />
//             <UserGrowthChart dateRange={dateRange} />
//           </div>
//           <div className="grid gap-4 md:grid-cols-2">
//             <PropertyStatsChart dateRange={dateRange} />
//             <TransactionChart dateRange={dateRange} />
//           </div>
//         </TabsContent>

//         <TabsContent value="revenue" className="space-y-4">
//           <RevenueChart dateRange={dateRange} detailed />
//           <Card>
//             <CardHeader>
//               <CardTitle>Revenue Breakdown</CardTitle>
//               <CardDescription>Detailed revenue analysis by source</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <RevenueBreakdownRow 
//                   source="Rent Commissions" 
//                   amount={2490000} 
//                   percentage={60.5}
//                   trend={12.3}
//                 />
//                 <RevenueBreakdownRow 
//                   source="Property Marking" 
//                   amount={750000} 
//                   percentage={18.2}
//                   trend={-3.1}
//                 />
//                 <RevenueBreakdownRow 
//                   source="Premium Subscriptions" 
//                   amount={582000} 
//                   percentage={14.1}
//                   trend={8.7}
//                 />
//                 <RevenueBreakdownRow 
//                   source="Service Fees" 
//                   amount={298000} 
//                   percentage={7.2}
//                   trend={5.4}
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="users" className="space-y-4">
//           <UserGrowthChart dateRange={dateRange} detailed />
//           <AgentPerformanceChart dateRange={dateRange} />
//         </TabsContent>

//         <TabsContent value="properties" className="space-y-4">
//           <PropertyStatsChart dateRange={dateRange} detailed />
//         </TabsContent>

//         <TabsContent value="transactions" className="space-y-4">
//           <TransactionChart dateRange={dateRange} detailed />
//           <TransactionTable />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

// function RevenueBreakdownRow({ 
//   source, 
//   amount, 
//   percentage, 
//   trend 
// }: { 
//   source: string; 
//   amount: number; 
//   percentage: number; 
//   trend: number;
// }) {
//   const isPositive = trend > 0;
  
//   return (
//     <div className="flex items-center justify-between">
//       <div className="flex-1">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-sm font-medium">{source}</span>
//           <span className="text-sm font-semibold">₦{amount.toLocaleString()}</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="flex-1 bg-secondary rounded-full h-2">
//             <div 
//               className="bg-primary h-2 rounded-full" 
//               style={{ width: `${percentage}%` }} 
//             />
//           </div>
//           <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
//             {isPositive ? '+' : ''}{trend}%
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }