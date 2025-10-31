"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartContainer from "./ChartContainer";
import { DollarSign, TrendingUp, Wallet, CreditCard } from "lucide-react";

interface DateRange {
  from: Date;
  to: Date;
}

interface RevenueAnalyticsProps {
  dateRange: DateRange;
}

export default function RevenueAnalytics({ dateRange }: RevenueAnalyticsProps) {
  // Mock data - replace with actual API call
  const revenueStats = {
    totalRevenue: 45678900,
    rentPayments: 32456700,
    markingJobFees: 8976500,
    premiumSubscriptions: 3245700,
    agentCommissions: 12345600,
    platformFees: 9876500,
    averageTransactionValue: 134567,
    totalTransactions: 8934,
    revenueByMonth: [
      { month: "Jan", revenue: 6234500, rent: 4567800, marking: 1234500, premium: 432200 },
      { month: "Feb", revenue: 7456800, rent: 5432100, marking: 1567800, premium: 456900 },
      { month: "Mar", revenue: 8234600, rent: 6012300, marking: 1734500, premium: 487800 },
      { month: "Apr", revenue: 9456700, rent: 6892400, marking: 1987600, premium: 576700 },
      { month: "May", revenue: 10876500, rent: 7934500, marking: 2234600, premium: 707400 },
      { month: "Jun", revenue: 12876900, rent: 9401700, marking: 2652300, premium: 822900 },
    ],
    revenueByType: [
      { type: "Rent Payments", amount: 32456700, percentage: 71.0, color: "#3b82f6" },
      { type: "Marking Fees", amount: 8976500, percentage: 19.6, color: "#10b981" },
      { type: "Premium Subs", amount: 3245700, percentage: 7.1, color: "#f59e0b" },
      { type: "Other", amount: 1000000, percentage: 2.3, color: "#6b7280" },
    ],
    paymentMethods: [
      { method: "Card", transactions: 5234, amount: 28765400 },
      { method: "Bank Transfer", transactions: 2876, amount: 13456700 },
      { method: "Virtual Account", transactions: 824, amount: 3456800 },
    ],
  };

  const chartConfig = {
    revenue: {
      type: "line" as const,
      data: revenueStats.revenueByMonth,
      xKey: "month",
      lines: [
        { dataKey: "revenue", stroke: "#3b82f6", name: "Total Revenue" },
        { dataKey: "rent", stroke: "#10b981", name: "Rent" },
        { dataKey: "marking", stroke: "#f59e0b", name: "Marking" },
        { dataKey: "premium", stroke: "#8b5cf6", name: "Premium" },
      ],
    },
    revenueType: {
      type: "pie" as const,
      data: revenueStats.revenueByType.map((item) => ({
        name: item.type,
        value: item.amount,
        color: item.color,
      })),
      dataKey: "value",
      nameKey: "name",
    },
    paymentMethods: {
      type: "bar" as const,
      data: revenueStats.paymentMethods,
      xKey: "method",
      bars: [{ dataKey: "amount", fill: "#3b82f6", name: "Amount" }],
    },
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(2)}M`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+15.7%</span>
              <span>from last period</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent Payments</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueStats.rentPayments)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueStats.revenueByType[0].percentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marking Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueStats.markingJobFees)}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueStats.revenueByType[1].percentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueStats.averageTransactionValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueStats.totalTransactions.toLocaleString()} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ChartContainer
        title="Revenue Over Time"
        description="Monthly revenue breakdown by type"
        config={chartConfig.revenue}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartContainer
          title="Revenue by Type"
          description="Distribution of revenue sources"
          config={chartConfig.revenueType}
        />

        <ChartContainer
          title="Revenue by Payment Method"
          description="Payment method distribution"
          config={chartConfig.paymentMethods}
        />
      </div>

      {/* Detailed Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueStats.revenueByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="font-bold">{formatCurrency(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueStats.paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-medium">{method.method}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {method.transactions.toLocaleString()} txns
                  </span>
                  <span className="font-bold">{formatCurrency(method.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(revenueStats.agentCommissions)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Paid out to agents this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Fees Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(revenueStats.platformFees)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Net platform revenue this period
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}