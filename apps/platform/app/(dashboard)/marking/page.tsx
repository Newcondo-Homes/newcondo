// apps/platform/app/(dashboard)/marking/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { 
  Clock, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  Star,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { formatDistanceToNow } from 'date-fns';

export default function MarkingDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    stats, 
    currentJob, 
    upcomingJobs,
    isLoading,
    error,
    fetchDashboardData 
  } = useMarkingJobs();

  useEffect(() => {
    if (!authLoading && user) {
      // Check if user is eligible for marking jobs
      if (user.role !== 'AGENT' && !user.isPremium) {
        router.push('/dashboard');
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading, router, fetchDashboardData]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || (user.role !== 'AGENT' && !user.isPremium)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have access to marking jobs. Only agents and premium users can access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Marking Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your property marking jobs and track your performance
        </p>
      </div>

      {/* Availability Toggle */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={user.isAvailableForMarking ? "h-6 w-6 text-green-500" : "h-6 w-6 text-gray-400"} />
              <div>
                <h3 className="font-semibold">Availability Status</h3>
                <p className="text-sm text-muted-foreground">
                  {user.isAvailableForMarking 
                    ? "You're currently available for marking jobs" 
                    : "You're currently unavailable for marking jobs"}
                </p>
              </div>
            </div>
            <Button
              variant={user.isAvailableForMarking ? "outline" : "default"}
              onClick={() => {
                // Toggle availability
                // This will be implemented in the hook
              }}
            >
              {user.isAvailableForMarking ? "Set Unavailable" : "Set Available"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedJobs || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month: {formatCurrency(stats?.monthlyEarnings || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.agentReliabilityScore?.toString() || '0.00'} / 5.00
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {stats?.completedJobs || 0} jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate ? `${stats.successRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedOnTime || 0} on-time completions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Job Alert */}
      {currentJob && (
        <Alert className="mb-6 border-2 border-primary">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Active Job in Progress</p>
                <p className="text-sm">
                  Time remaining: {formatDistanceToNow(new Date(currentJob.timeSlotExpiry), { addSuffix: true })}
                </p>
              </div>
              <Button asChild>
                <Link href={`/marking/${currentJob.id}/details`}>
                  View Job
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="available">Available Jobs</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to different sections</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto py-6">
                <Link href="/marking/available-jobs" className="flex flex-col items-center gap-2">
                  <MapPin className="h-6 w-6" />
                  <span>Browse Available Jobs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-6">
                <Link href="/marking/my-queue" className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>My Queue</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-6">
                <Link href="/marking/performance" className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Performance Metrics</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest marking jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentJobs && stats.recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/marking/${job.id}/details`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{job.property.title}</h4>
                          <Badge variant={
                            job.status === 'COMPLETED' ? 'default' :
                            job.status === 'IN_PROGRESS' ? 'secondary' :
                            'outline'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.property.address}, {job.property.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(job.markingFee * 0.25)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>
                View all available marking jobs in your service areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/marking/available-jobs">
                  View All Available Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Jobs you're scheduled to complete</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingJobs && upcomingJobs.length > 0 ? (
                <div className="space-y-4">
                  {upcomingJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/marking/${job.id}/details`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{job.property.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {job.property.address}, {job.property.city}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Complete by: {formatDistanceToNow(new Date(job.timeSlotExpiry), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge>Position #{job.queuePosition}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming jobs</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href="/marking/available-jobs">
                      Browse available jobs
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}