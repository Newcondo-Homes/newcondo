// apps/platform/app/(dashboard)/marking/performance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  Target,
  Calendar,
  DollarSign,
  Star
} from 'lucide-react';

interface PerformanceMetrics {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  reliabilityScore: number;
  averageCompletionTime: number;
  totalEarnings: number;
  currentStreak: number;
  bestStreak: number;
  onTimeCompletionRate: number;
  currentMonthStats: {
    jobs: number;
    earnings: number;
    avgRating: number;
  };
  lastMonthStats: {
    jobs: number;
    earnings: number;
    avgRating: number;
  };
  recentJobs: Array<{
    id: string;
    propertyTitle: string;
    completedAt: string;
    timeTaken: number;
    earnings: number;
    rating?: number;
  }>;
}

export default function AgentPerformancePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && (user.role !== 'AGENT' && user.role !== 'RENTER')) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      fetchPerformanceMetrics();
    }
  }, [user, authLoading, router]);

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marking/performance', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 4.5) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 4.0) return { label: 'Very Good', color: 'bg-blue-500' };
    if (score >= 3.5) return { label: 'Good', color: 'bg-yellow-500' };
    if (score >= 3.0) return { label: 'Fair', color: 'bg-orange-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const getCompletionRate = () => {
    if (!metrics) return 0;
    const total = metrics.totalJobs;
    if (total === 0) return 0;
    return Math.round((metrics.completedJobs / total) * 100);
  };

  const getMonthlyChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const reliabilityBadge = getReliabilityBadge(metrics.reliabilityScore);
  const completionRate = getCompletionRate();
  const jobsChange = getMonthlyChange(metrics.currentMonthStats.jobs, metrics.lastMonthStats.jobs);
  const earningsChange = getMonthlyChange(metrics.currentMonthStats.earnings, metrics.lastMonthStats.earnings);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Metrics</h1>
        <p className="text-muted-foreground">Track your marking job performance and earnings</p>
      </div>

      {/* Reliability Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reliability Score</span>
            <Badge className={reliabilityBadge.color}>{reliabilityBadge.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">
              {metrics.reliabilityScore.toFixed(2)}
            </div>
            <p className="text-muted-foreground">out of 5.00</p>
            <Progress value={(metrics.reliabilityScore / 5) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.averageCompletionTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per job</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Compare this month with last month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jobs Completed</span>
                <div className="flex items-center gap-1">
                  {jobsChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : jobsChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${jobsChange > 0 ? 'text-green-500' : jobsChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {jobsChange > 0 ? '+' : ''}{jobsChange}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">{metrics.currentMonthStats.jobs}</div>
              <p className="text-xs text-muted-foreground">vs {metrics.lastMonthStats.jobs} last month</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Earnings</span>
                <div className="flex items-center gap-1">
                  {earningsChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : earningsChange < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${earningsChange > 0 ? 'text-green-500' : earningsChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {earningsChange > 0 ? '+' : ''}{earningsChange}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">₦{metrics.currentMonthStats.earnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">vs ₦{metrics.lastMonthStats.earnings.toLocaleString()} last month</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Average Rating</span>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{metrics.currentMonthStats.avgRating.toFixed(1)}</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(metrics.currentMonthStats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Completed</span>
              </div>
              <span className="font-bold">{metrics.completedJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span>Cancelled</span>
              </div>
              <span className="font-bold">{metrics.cancelledJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>Expired</span>
              </div>
              <span className="font-bold">{metrics.expiredJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievement Streaks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Current Streak</span>
              </div>
              <span className="font-bold">{metrics.currentStreak} jobs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span>Best Streak</span>
              </div>
              <span className="font-bold">{metrics.bestStreak} jobs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>On-Time Rate</span>
              </div>
              <span className="font-bold">{metrics.onTimeCompletionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Jobs</CardTitle>
          <CardDescription>Your last 10 completed marking jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed jobs yet</p>
          ) : (
            <div className="space-y-4">
              {metrics.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium">{job.propertyTitle}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(job.completedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(job.timeTaken)}
                      </span>
                      {job.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {job.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₦{job.earnings.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}