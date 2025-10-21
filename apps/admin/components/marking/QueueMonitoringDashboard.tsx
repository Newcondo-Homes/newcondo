"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { QueueVisualization } from "./QueueVisualization";
import { AgentPerformanceTable } from "./AgentPerformanceTable";
import { MarkingJobsTable } from "./MarkingJobsTable";
import { QueueAnalytics } from "./QueueAnalytics";
import { queueOversightApi } from "@/lib/api/queueOversight";

interface QueueStats {
  totalInQueue: number;
  activeJobs: number;
  completedToday: number;
  expiredToday: number;
  averageWaitTime: number;
  averageCompletionTime: number;
  agentsAvailable: number;
  agentsActive: number;
}

interface QueueHealth {
  status: "healthy" | "warning" | "critical";
  issues: string[];
  recommendations: string[];
}

export function QueueMonitoringDashboard() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchQueueData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [statsData, healthData] = await Promise.all([
        queueOversightApi.getQueueStats(),
        queueOversightApi.getQueueHealth()
      ]);

      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchQueueData();
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "critical":
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-500">Loading queue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Monitoring</h1>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of property marking queue system
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Status */}
      {health && (
        <Card className={`border-2 ${getHealthColor(health.status)}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getHealthIcon(health.status)}
              <div>
                <CardTitle className="text-lg">
                  Queue Health: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                </CardTitle>
                <CardDescription>
                  System health assessment and recommendations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {(health.issues.length > 0 || health.recommendations.length > 0) && (
            <CardContent className="space-y-4">
              {health.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Issues Detected
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {health.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {health.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {health.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInQueue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeJobs} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                On track
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.averageWaitTime / 60)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(stats.averageCompletionTime / 60)}h avg completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents Status</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.agentsActive}/{stats.agentsAvailable}
              </div>
              <p className="text-xs text-muted-foreground">
                Active/Available agents
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">All Jobs</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <QueueVisualization />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <MarkingJobsTable />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentPerformanceTable />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <QueueAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}