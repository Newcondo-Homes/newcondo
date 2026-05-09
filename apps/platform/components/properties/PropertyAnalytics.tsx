'use client';
// apps/platform/components/properties/PropertyAnalytics.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Eye,  MessageSquare, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Tabs, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { propertyApi } from '@/lib/api/properties';

interface PropertyAnalyticsProps {
  propertyId: string;
}

type Period = 'week' | 'month' | 'year';

export default function PropertyAnalytics({ propertyId }: PropertyAnalyticsProps) {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['property-analytics', propertyId, period],
    queryFn: () => propertyApi.getAnalytics(propertyId, period),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Failed to load analytics. Please try again later.
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    { label: 'Total Views', value: data.views, icon: Eye, color: 'text-blue-600' },
    { label: 'Inquiries', value: data.inquiries, icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Rentals', value: data.rentals, icon: TrendingUp, color: 'text-green-600' },
    {
      label: 'Revenue (₦)',
      value: new Intl.NumberFormat('en-NG').format(data.revenue),
      icon: Calendar,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Property Analytics</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`p-2 rounded-full bg-gray-100 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Views Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Popular Features */}
      {data.popularFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.popularFeatures} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}