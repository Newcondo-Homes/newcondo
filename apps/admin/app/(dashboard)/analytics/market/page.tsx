import { Suspense } from 'react';
import { Metadata } from 'next';
import MarketTrendsChart from '@/components/analytics/MarketTrendsChart';
import DateRangeFilter from '@/components/analytics/DateRangeFilter';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import ExportOptions from '@/components/analytics/ExportOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Market Insights | Newcondo Admin',
  description: 'Real estate market trends and insights',
};

export default function MarketInsightsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Insights</h1>
          <p className="text-muted-foreground">
            Real estate market trends and pricing analytics
          </p>
        </div>
        <div className="flex gap-2">
          <DateRangeFilter />
          <CategoryFilter />
          <ExportOptions />
        </div>
      </div>

      {/* Market KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Property Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">₦2,450,000</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+5.2%</span> from last quarter
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Rent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">18 days</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-green-600">-3 days</span> from last month
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">78.3%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+2.1%</span> from last month
              </p>
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-8 w-24" />}>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                High-demand areas
              </p>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Market Trends</CardTitle>
          <CardDescription>Property prices and demand trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-80" />}>
            <MarketTrendsChart />
          </Suspense>
        </CardContent>
      </Card>

      {/* Location-based Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Locations</CardTitle>
            <CardDescription>Areas with highest rental activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Lekki, Lagos</span>
                  <span className="text-sm text-muted-foreground">92% occupancy</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Asokoro, Abuja</span>
                  <span className="text-sm text-muted-foreground">88% occupancy</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">GRA, Port Harcourt</span>
                  <span className="text-sm text-muted-foreground">85% occupancy</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bodija, Ibadan</span>
                  <span className="text-sm text-muted-foreground">79% occupancy</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '79%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Trends by Property Type</CardTitle>
            <CardDescription>Average monthly rental prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Apartments</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₦850,000</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3" /> +3.2%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Houses</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₦1,850,000</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3" /> +5.7%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duplexes</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₦3,200,000</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3" /> +4.1%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rooms</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₦350,000</span>
                  <span className="text-xs text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3" /> -1.2%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supply and Demand */}
      <Card>
        <CardHeader>
          <CardTitle>Supply & Demand Analysis</CardTitle>
          <CardDescription>Property availability vs. demand by state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Lagos State</span>
                <span className="text-sm text-muted-foreground">High Demand, Moderate Supply</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supply</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Demand</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Abuja (FCT)</span>
                <span className="text-sm text-muted-foreground">High Demand, Good Supply</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supply</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Demand</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Rivers State</span>
                <span className="text-sm text-muted-foreground">Balanced Market</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supply</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Demand</p>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '74%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}