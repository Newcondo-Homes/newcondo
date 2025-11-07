'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueChartProps {
  dateRange?: { from: Date; to: Date };
  detailed?: boolean;
}

export default function RevenueChart({ dateRange, detailed = false }: RevenueChartProps) {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['analytics-revenue', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange }),
      });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80" />
        </CardContent>
      </Card>
    );
  }

  // Mock data - replace with actual data
  const mockData = [
    { month: 'Jan', total: 8500000, commission: 1700000, marking: 450000, premium: 380000 },
    { month: 'Feb', total: 9200000, commission: 1840000, marking: 520000, premium: 420000 },
    { month: 'Mar', total: 10100000, commission: 2020000, marking: 580000, premium: 450000 },
    { month: 'Apr', total: 9800000, commission: 1960000, marking: 540000, premium: 410000 },
    { month: 'May', total: 10800000, commission: 2160000, marking: 620000, premium: 480000 },
    { month: 'Jun', total: 11500000, commission: 2300000, marking: 680000, premium: 520000 },
    { month: 'Jul', total: 11200000, commission: 2240000, marking: 650000, premium: 500000 },
    { month: 'Aug', total: 12000000, commission: 2400000, marking: 720000, premium: 550000 },
    { month: 'Sep', total: 11800000, commission: 2360000, marking: 690000, premium: 530000 },
    { month: 'Oct', total: 12450000, commission: 2490000, marking: 750000, premium: 582000 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>
          {detailed ? 'Detailed monthly revenue breakdown' : 'Monthly revenue overview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {detailed ? (
            <AreaChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `₦${value.toLocaleString()}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="commission" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Commission"
              />
              <Area 
                type="monotone" 
                dataKey="marking" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="Marking Service"
              />
              <Area 
                type="monotone" 
                dataKey="premium" 
                stackId="1"
                stroke="#ffc658" 
                fill="#ffc658" 
                name="Premium"
              />
            </AreaChart>
          ) : (
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `₦${value.toLocaleString()}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Revenue"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}