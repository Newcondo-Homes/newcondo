'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketTrendsChartProps {
  dateRange?: { from: Date; to: Date };
}

export default function MarketTrendsChart({ dateRange }: MarketTrendsChartProps) {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ['analytics-market', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/market`, {
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
          <CardTitle>Market Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80" />
        </CardContent>
      </Card>
    );
  }

  // Mock data - replace with actual data
  const mockData = [
    { month: 'Jan', avgPrice: 2180000, demand: 72, supply: 65, occupancy: 74.2 },
    { month: 'Feb', avgPrice: 2220000, demand: 75, supply: 68, occupancy: 75.8 },
    { month: 'Mar', avgPrice: 2280000, demand: 78, supply: 70, occupancy: 76.5 },
    { month: 'Apr', avgPrice: 2310000, demand: 76, supply: 69, occupancy: 75.9 },
    { month: 'May', avgPrice: 2360000, demand: 80, supply: 72, occupancy: 77.2 },
    { month: 'Jun', avgPrice: 2390000, demand: 82, supply: 74, occupancy: 77.8 },
    { month: 'Jul', avgPrice: 2410000, demand: 81, supply: 73, occupancy: 77.4 },
    { month: 'Aug', avgPrice: 2440000, demand: 84, supply: 76, occupancy: 78.1 },
    { month: 'Sep', avgPrice: 2420000, demand: 83, supply: 75, occupancy: 77.9 },
    { month: 'Oct', avgPrice: 2450000, demand: 86, supply: 78, occupancy: 78.3 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Trends</CardTitle>
        <CardDescription>Property prices, demand, and occupancy rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'Avg Price') return `₦${value.toLocaleString()}`;
                if (name === 'Occupancy %') return `${value}%`;
                return value;
              }}
            />
            <Legend />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="avgPrice" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Avg Price"
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="demand" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="Demand Index"
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="supply" 
              stroke="#ffc658" 
              strokeWidth={2}
              name="Supply Index"
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="occupancy" 
              stroke="#ff7300" 
              strokeWidth={2}
              name="Occupancy %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}