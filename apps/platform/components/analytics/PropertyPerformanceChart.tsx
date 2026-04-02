// apps/platform/components/analytics/PropertyPerformanceChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PerformanceData {
  date: string;
  views: number;
  inquiries: number;
  payments: number;
}

interface PropertyPerformanceChartProps {
  data: PerformanceData[];
  title?: string;
}

export function PropertyPerformanceChart({
  data,
  title = 'Property Performance',
}: PropertyPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                });
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#8884d8"
              strokeWidth={2}
              name="Views"
            />
            <Line
              type="monotone"
              dataKey="inquiries"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Inquiries"
            />
            <Line
              type="monotone"
              dataKey="payments"
              stroke="#ffc658"
              strokeWidth={2}
              name="Payments"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}