// apps/platform/components/commissions/EarningsChart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

interface EarningsData {
  date: string;
  listingCommissions: number;
  referralCommissions: number;
  totalEarnings: number;
}

interface EarningsChartProps {
  data: EarningsData[];
  currency?: string;
}

export function EarningsChart({ data, currency = 'NGN' }: EarningsChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const totalEarnings = data.reduce((sum, item) => sum + item.totalEarnings, 0);
  const totalListing = data.reduce(
    (sum, item) => sum + item.listingCommissions,
    0
  );
  const totalReferral = data.reduce(
    (sum, item) => sum + item.referralCommissions,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earnings Trend
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Area
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorListing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReferral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
                labelFormatter={formatDate}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="listingCommissions"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorListing)"
                name="Listing Commissions"
              />
              <Area
                type="monotone"
                dataKey="referralCommissions"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorReferral)"
                name="Referral Commissions"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
                labelFormatter={formatDate}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar
                dataKey="listingCommissions"
                fill="#3b82f6"
                name="Listing Commissions"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="referralCommissions"
                fill="#10b981"
                name="Referral Commissions"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Listing Commissions
              </span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(totalListing)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalEarnings > 0
                ? ((totalListing / totalEarnings) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Referral Commissions
              </span>
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(totalReferral)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalEarnings > 0
                ? ((totalReferral / totalEarnings) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}