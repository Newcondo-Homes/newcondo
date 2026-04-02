// apps/platform/components/analytics/RentalMetrics.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RentalMetric {
  name: string;
  value: number;
  color: string;
}

interface RentalMetricsProps {
  data: RentalMetric[];
  totalRentals: number;
}

export function RentalMetrics({ data, totalRentals }: RentalMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Status Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total rentals: {totalRentals}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}