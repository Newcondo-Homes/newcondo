import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Home, 
  FileCheck, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  Briefcase
} from 'lucide-react';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { PendingActions } from '@/components/admin/PendingActions';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Admin Dashboard - Newcondo',
  description: 'Newcondo platform management dashboard',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage the Newcondo platform
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Pending Actions Alert */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <PendingActions />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>System status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <QuickStatItem
                icon={Users}
                label="Active Users Today"
                value="Loading..."
                trend="+12%"
              />
              <QuickStatItem
                icon={Home}
                label="Properties Listed"
                value="Loading..."
                trend="+8%"
              />
              <QuickStatItem
                icon={CreditCard}
                label="Transactions Today"
                value="Loading..."
                trend="+15%"
              />
              <QuickStatItem
                icon={MapPin}
                label="Marking Jobs Pending"
                value="Loading..."
                trend=""
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickStatItem({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: any;
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          {trend}
        </div>
      )}
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}