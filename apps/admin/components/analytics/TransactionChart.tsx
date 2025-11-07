'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionChartProps {
  dateRange?: { from: Date; to: Date };
  detailed?: boolean;
}

export default function TransactionChart({ dateRange, detailed = false }: TransactionChartProps) {
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ['analytics-transactions', dateRange],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/transactions`, {
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
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80" />
        </CardContent>
      </Card>
    );
  }

  // Mock data - replace with actual data
  const mockData = [
    { month: 'Jan', total: 1120, successful: 1035, failed: 65, pending: 20, successRate: 92.4 },
    { month: 'Feb', total: 1280, successful: 1189, failed: 71, pending: 20, successRate: 92.9 },
    { month: 'Mar', total: 1450, successful: 1348, failed: 82, pending: 20, successRate: 93.0 },
    { month: 'Apr', total: 1350, successful: 1253, failed: 77, pending: 20, successRate: 92.8 },
    { month: 'May', total: 1520, successful: 1412, failed: 88, pending: 20, successRate: 92.9 },
    { month: 'Jun', total: 1680, successful: 1562, failed: 98, pending: 20, successRate: 93.0 },
    { month: 'Jul', total: 1640, successful: 1523, failed: 97, pending: 20, successRate: 92.9 },
    { month: 'Aug', total: 1780, successful: 1653, failed: 107, pending: 20, successRate: 92.9 },
    { month: 'Sep', total: 1720, successful: 1595, failed: 105, pending: 20, successRate: 92.7 },
    { month: 'Oct', total: 1850, successful: 1717, failed: 113, pending: 20, successRate: 92.8 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Volume</CardTitle>
        <CardDescription>
          {detailed ? 'Detailed transaction analysis and success rates' : 'Transaction overview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {detailed ? (
            <ComposedChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="successful" fill="#82ca9d" name="Successful" />
              <Bar yAxisId="left" dataKey="failed" fill="#ff6b6b" name="Failed" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="successRate" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Success Rate %"
              />
            </ComposedChart>
          ) : (
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Transactions" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}