// apps/admin/src/components/marking-jobs/AgentPerformance.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Target,
} from 'lucide-react';

interface AgentStats {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: string;
  reliabilityScore: number;
  onTimeRate: number;
  qualityScore: number;
  responseTime: string;
}

interface PerformanceMetrics {
  completionRate: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  averageRating: number;
  totalEarnings: number;
}

interface RecentActivity {
  id: string;
  propertyAddress: string;
  completedAt: string;
  timeTaken: string;
  rating: number;
  status: string;
}

interface AgentPerformanceProps {
  agentId: string;
  agentName: string;
}

export default function AgentPerformance({ agentId, agentName }: AgentPerformanceProps) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [agentId]);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/performance`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      
      const data = await response.json();
      setStats(data.stats);
      setMetrics(data.metrics);
      setRecentActivity(data.recentActivity || []);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{agentName}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Performance Overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className={`text-2xl font-bold ${getScoreColor(stats.reliabilityScore)}`}>
                {stats.reliabilityScore.toFixed(1)}
              </span>
              <Badge>{getScoreBadge(stats.reliabilityScore)}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.completionRate}%</p>
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">On-Time Delivery</p>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.onTimeDelivery}%</p>
              <Progress value={metrics.onTimeDelivery} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Customer Satisfaction</p>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.customerSatisfaction}%</p>
              <Progress value={metrics.customerSatisfaction} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Average Rating</p>
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}/5.0</p>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= metrics.averageRating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Job Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-500" />
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalJobs}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.completedJobs}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-gray-600">Cancelled</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledJobs}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <p className="text-sm text-gray-600">Expired</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiredJobs}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
              <p className="text-2xl font-bold">₦{metrics.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time & Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion Time</p>
                <p className="text-xl font-bold mt-1">{stats.averageCompletionTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On-Time Rate</p>
                <p className="text-xl font-bold mt-1">{stats.onTimeRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-xl font-bold mt-1">{stats.responseTime}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{activity.propertyAddress}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Completed: {new Date(activity.completedAt).toLocaleDateString()}</span>
                      <span>Time: {activity.timeTaken}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{activity.rating.toFixed(1)}</span>
                    </div>
                    <Badge variant={activity.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
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