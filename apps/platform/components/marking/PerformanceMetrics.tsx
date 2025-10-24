"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/tabs";
import { Progress } from "@newcondo/ui/progress";
import { Badge } from "@newcondo/ui/badge";
import { Skeleton } from "@newcondo/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";

interface PerformanceMetrics {
  // Time-based metrics
  averageResponseTime: number; // hours
  averageCompletionTime: number; // hours
  fastestCompletion: number; // hours
  slowestCompletion: number; // hours
  
  // Quality metrics
  reliabilityScore: number; // 0-5
  qualityScore: number; // 0-100
  customerSatisfaction: number; // 0-5
  
  // Efficiency metrics
  jobsCompletedOnTime: number;
  jobsCompletedLate: number;
  jobsCancelled: number;
  averagePhotosPerJob: number;
  
  // Consistency metrics
  consistencyScore: number; // 0-100
  streakDays: number;
  longestStreak: number;
  
  // Ranking
  ranking: {
    position: number;
    total: number;
    percentile: number;
  };
  
  // Monthly breakdown
  monthlyMetrics: {
    month: string;
    jobsCompleted: number;
    earnings: number;
    averageTime: number;
  }[];
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
}

const MetricCard = ({ icon, title, value, subtitle, color = "blue", trend }: MetricCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "−"}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600 mt-1">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PerformanceMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get(`/marking/agents/${user.id}/performance`);
        setMetrics(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching performance metrics:", err);
        setError(err.response?.data?.message || "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const getReliabilityColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-blue-600";
    if (score >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time">Time Metrics</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Star className="h-5 w-5" />}
              title="Reliability Score"
              value={metrics.reliabilityScore.toFixed(2)}
              subtitle="Out of 5.00"
              color="yellow"
              trend={metrics.reliabilityScore >= 4 ? "up" : "neutral"}
            />
            
            <MetricCard
              icon={<Target className="h-5 w-5" />}
              title="Quality Score"
              value={`${metrics.qualityScore}%`}
              subtitle="Overall quality"
              color="green"
            />
            
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="On-Time Completion"
              value={`${((metrics.jobsCompletedOnTime / (metrics.jobsCompletedOnTime + metrics.jobsCompletedLate)) * 100).toFixed(1)}%`}
              subtitle={`${metrics.jobsCompletedOnTime} jobs`}
              color="blue"
            />
            
            <MetricCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Current Streak"
              value={`${metrics.streakDays} days`}
              subtitle={`Best: ${metrics.longestStreak} days`}
              color="purple"
            />
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Reliability Score</span>
                  <span className={`font-semibold ${getReliabilityColor(metrics.reliabilityScore)}`}>
                    {metrics.reliabilityScore.toFixed(2)} / 5.00
                  </span>
                </div>
                <Progress value={(metrics.reliabilityScore / 5) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold text-green-600">{metrics.qualityScore}%</span>
                </div>
                <Progress value={metrics.qualityScore} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Consistency Score</span>
                  <span className="font-semibold text-blue-600">{metrics.consistencyScore}%</span>
                </div>
                <Progress value={metrics.consistencyScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Metrics Tab */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<Clock className="h-5 w-5" />}
              title="Avg. Response Time"
              value={`${metrics.averageResponseTime.toFixed(1)}h`}
              subtitle="Time to accept job"
              color="blue"
            />
            
            <MetricCard
              icon={<Clock className="h-5 w-5" />}
              title="Avg. Completion Time"
              value={`${metrics.averageCompletionTime.toFixed(1)}h`}
              subtitle="Time to complete"
              color="green"
            />
            
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Fastest Completion"
              value={`${metrics.fastestCompletion.toFixed(1)}h`}
              subtitle="Personal best"
              color="purple"
            />
            
            <MetricCard
              icon={<AlertCircle className="h-5 w-5" />}
              title="Slowest Completion"
              value={`${metrics.slowestCompletion.toFixed(1)}h`}
              subtitle="Needs improvement"
              color="yellow"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Time Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-green-700">On-Time Completions</div>
                    <div className="text-sm text-gray-600">Within 3-hour time slot</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{metrics.jobsCompletedOnTime}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-yellow-700">Late Completions</div>
                    <div className="text-sm text-gray-600">Exceeded time slot</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{metrics.jobsCompletedLate}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-red-700">Cancelled Jobs</div>
                    <div className="text-sm text-gray-600">Did not complete</div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{metrics.jobsCancelled}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={<Star className="h-5 w-5" />}
              title="Customer Satisfaction"
              value={`${metrics.customerSatisfaction.toFixed(2)}/5`}
              subtitle="Average rating"
              color="yellow"
            />
            
            <MetricCard
              icon={<Target className="h-5 w-5" />}
              title="Quality Score"
              value={`${metrics.qualityScore}%`}
              color="green"
            />
            
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Avg. Photos per Job"
              value={metrics.averagePhotosPerJob.toFixed(1)}
              subtitle="Photo documentation"
              color="blue"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quality Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Photo Quality</span>
                  <Badge variant={metrics.averagePhotosPerJob >= 5 ? "default" : "secondary"}>
                    {metrics.averagePhotosPerJob >= 5 ? "Excellent" : "Good"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Boundary Accuracy</span>
                  <Badge variant="default">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documentation</span>
                  <Badge variant="default">Complete</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-blue-600">
                  #{metrics.ranking.position}
                </div>
                <div className="text-gray-600">
                  Out of {metrics.ranking.total} agents
                </div>
                <div className="text-sm text-gray-500">
                  Top {metrics.ranking.percentile}% of all agents
                </div>
                <Progress value={100 - metrics.ranking.percentile} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.monthlyMetrics.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold">{month.month}</div>
                      <div className="text-sm text-gray-600">
                        {month.jobsCompleted} jobs • {month.averageTime.toFixed(1)}h avg
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ₦{month.earnings.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}