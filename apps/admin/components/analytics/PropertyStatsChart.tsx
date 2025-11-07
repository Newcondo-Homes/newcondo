'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyStatsChartProps {
  dateRange?: { from: Date; to: Date };
  detailed?: boolean;
}

export default function PropertyStatsChart({ dateRange, detailed = false }: PropertyStatsChartProps) {
  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['analytics-properties', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/properties`, {
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
          <CardTitle>Property Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80" />
        </CardContent>
      </Card>
    );
  }

  // Mock data - replace with actual data
  const mockData = [
    { month: 'Jan', listed: 520, rented: 180, available: 340, pending: 45 },
    { month: 'Feb', listed: 580, rented: 210, available: 370, pending: 52 },
    { month: 'Mar', listed: 640, rented: 240, available: 400, pending: 58 },
    { month: 'Apr', listed: 590, rented: 220, available: 370, pending: 48 },
    { month: 'May', listed: 680, rented: 260, available: 420, pending: 62 },
    { month: 'Jun', listed: 720, rented: 280, available: 440, pending: 68 },
    { month: 'Jul', listed: 710, rented: 270, available: 440, pending: 65 },
    { month: 'Aug', listed: 760, rented: 290, available: 470, pending: 72 },
    { month: 'Sep', listed: 740, rented: 280, available: 460, pending: 69 },
    { month: 'Oct', listed: 820, rented: 320, available: 500, pending: 78 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Statistics</CardTitle>
        <CardDescription>
          {detailed ? 'Detailed property listing and rental activity' : 'Property overview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {detailed ? (
            <ComposedChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="listed" fill="#8884d8" name="New Listings" />
              <Bar dataKey="rented" fill="#82ca9d" name="Rented" />
              <Line 
                type="monotone" 
                dataKey="available" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="Available"
              />
            </ComposedChart>
          ) : (
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="listed" fill="#8884d8" name="New Listings" />
              <Bar dataKey="rented" fill="#82ca9d" name="Rented" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}