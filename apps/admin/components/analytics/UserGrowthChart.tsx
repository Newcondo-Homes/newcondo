'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface UserGrowthChartProps {
  dateRange?: { from: Date; to: Date };
  detailed?: boolean;
}

export default function UserGrowthChart({ dateRange, detailed = false }: UserGrowthChartProps) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ['analytics-users', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/users`, {
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
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80" />
        </CardContent>
      </Card>
    );
  }

  // Mock data - replace with actual data
  const mockData = [
    { month: 'Jan', total: 32450, owners: 8200, agents: 6100, renters: 18150, new: 1850 },
    { month: 'Feb', total: 34680, owners: 8750, agents: 6450, renters: 19480, new: 2230 },
    { month: 'Mar', total: 36920, owners: 9300, agents: 6800, renters: 20820, new: 2240 },
    { month: 'Apr', total: 38890, owners: 9800, agents: 7100, renters: 21990, new: 1970 },
    { month: 'May', total: 40560, owners: 10250, agents: 7400, renters: 22910, new: 1670 },
    { month: 'Jun', total: 42120, owners: 10680, agents: 7680, renters: 23760, new: 1560 },
    { month: 'Jul', total: 43450, owners: 11020, agents: 7920, renters: 24510, new: 1330 },
    { month: 'Aug', total: 44780, owners: 11350, agents: 8150, renters: 25280, new: 1330 },
    { month: 'Sep', total: 46230, owners: 11720, agents: 8410, renters: 26100, new: 1450 },
    { month: 'Oct', total: 48580, owners: 12450, agents: 8721, renters: 27409, new: 2350 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>
          {detailed ? 'Detailed user acquisition and breakdown' : 'User registration trends'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {detailed ? (
            <AreaChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="owners" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Owners"
              />
              <Area 
                type="monotone" 
                dataKey="agents" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="Agents"
              />
              <Area 
                type="monotone" 
                dataKey="renters" 
                stackId="1"
                stroke="#ffc658" 
                fill="#ffc658" 
                name="Renters"
              />
            </AreaChart>
          ) : (
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Users"
              />
              <Line 
                type="monotone" 
                dataKey="new" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}