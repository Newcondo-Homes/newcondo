// apps/admin/src/components/referrals/ReferralAnalyticsCharts.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface AnalyticsData {
  referralsByType?: Array<{ type: string; count: number; percentage: number }>;
  referralsByMonth?: Array<{
    month: string;
    count: number;
    qualified: number;
    rewarded: number;
  }>;
  rewardsByType?: Array<{ type: string; amount: number; count: number }>;
}

interface ReferralAnalyticsChartsProps {
  data?: AnalyticsData | null;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function ReferralAnalyticsCharts({ data }: ReferralAnalyticsChartsProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  // Prepare data for pie chart
  const pieData = data.referralsByType?.map((item, index) => ({
    name: item.type.replace(/_TO_/g, " → "),
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  // Prepare data for trend line
  const trendData = data.referralsByMonth?.map((item) => ({
    month: item.month,
    Total: item.count,
    Qualified: item.qualified,
    Rewarded: item.rewarded,
  })) || [];

  // Prepare data for rewards bar chart
  const rewardsData = data.rewardsByType?.map((item) => ({
    type: item.type.replace(/_/g, " "),
    amount: item.amount,
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Referrals by Type - Pie Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referrals by Type</CardTitle>
            <CardDescription>Distribution of referral categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends - Line Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Referral activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Total" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Qualified" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="Rewarded" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Rewards by Type - Bar Chart */}
      {rewardsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rewards by Type</CardTitle>
            <CardDescription>Total reward amounts and counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rewardsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="amount" fill="#8884d8" name="Amount (₦)" />
                <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}