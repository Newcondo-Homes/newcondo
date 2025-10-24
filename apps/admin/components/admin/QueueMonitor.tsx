// apps/admin/src/components/admin/QueueMonitor.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Badge } from "@newcondo/ui/badge";
import { Button } from "@newcondo/ui/button";
import { Progress } from "@newcondo/ui/progress";
import { Separator } from "@newcondo/ui/separator";
import { Alert, AlertDescription } from "@newcondo/ui/alert";
import { formatDuration } from "@/lib/utils/format";
import type { QueueStats } from "@/types/admin";

interface QueueMonitorProps {
  stats: QueueStats;
}

export default function QueueMonitor({ stats }: QueueMonitorProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          window.location.reload();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const getQueueHealthStatus = () => {
    const avgWaitTime = stats.avgWaitTime || 0;
    if (avgWaitTime > 180) return { status: "critical", color: "text-red-600", label: "Critical" };
    if (avgWaitTime > 120) return { status: "warning", color: "text-yellow-600", label: "Warning" };
    return { status: "healthy", color: "text-green-600", label: "Healthy" };
  };

  const queueHealth = getQueueHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Queue Health Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Real-time queue status and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? `Refreshing in ${countdown}s` : "Auto-refresh off"}
          </Button>
        </div>
      </div>

      {/* Queue Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Queue Health Status
            <Badge variant={queueHealth.status === "healthy" ? "default" : "destructive"}>
              {queueHealth.label}
            </Badge>
          </CardTitle>
          <CardDescription>Overall queue performance and health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Jobs in Queue</p>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.jobsInQueue}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeAgents} agents available
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Avg. Wait Time</p>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className={`text-3xl font-bold ${queueHealth.color}`}>
                {stats.avgWaitTime ? formatDuration(stats.avgWaitTime * 60000) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Target: {"<"} 2 hours
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.successRate}%</p>
              <Progress value={stats.successRate} className="mt-2 h-2" />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Queue Efficiency</p>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.queueEfficiency}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.expiredJobs} expired jobs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Alerts */}
      {(stats.expiredJobs > 5 || (stats.avgWaitTime && stats.avgWaitTime > 120)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stats.expiredJobs > 5 && (
              <p>High number of expired jobs detected. Consider adding more agents to service areas.</p>
            )}
            {stats.avgWaitTime && stats.avgWaitTime > 120 && (
              <p>Average wait time exceeds target. Queue backlog may be building up.</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Queue Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Queue Breakdown</CardTitle>
            <CardDescription>Jobs by status in queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Queued (Waiting)</span>
              </div>
              <span className="text-sm font-bold">{stats.queuedJobs}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Assigned</span>
              </div>
              <span className="text-sm font-bold">{stats.assignedJobs}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">In Progress</span>
              </div>
              <span className="text-sm font-bold">{stats.inProgressJobs}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Expired</span>
              </div>
              <span className="text-sm font-bold">{stats.expiredJobs}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between font-semibold">
              <span className="text-sm">Total Active</span>
              <span className="text-sm">{stats.jobsInQueue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Availability</CardTitle>
            <CardDescription>Current agent status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Available</span>
              </div>
              <span className="text-sm font-bold">{stats.activeAgents}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Busy</span>
              </div>
              <span className="text-sm font-bold">{stats.busyAgents || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Offline</span>
              </div>
              <span className="text-sm font-bold">{stats.offlineAgents || 0}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Agent Utilization</span>
                <span className="font-bold">
                  {stats.agentUtilization 
                    ? `${stats.agentUtilization}%` 
                    : "N/A"
                  }
                </span>
              </div>
              <Progress 
                value={stats.agentUtilization || 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {stats.activeAgents > 0 
                  ? `${(stats.jobsInQueue / stats.activeAgents).toFixed(1)} jobs per agent`
                  : "No agents available"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Queue Stats */}
      {stats.regionalStats && stats.regionalStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Regional Queue Distribution</CardTitle>
            <CardDescription>Queue status by service area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.regionalStats.map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{region.region}</span>
                    <Badge variant={region.queueLength > 10 ? "destructive" : "secondary"}>
                      {region.queueLength} in queue
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Available Agents</p>
                      <p className="font-semibold">{region.availableAgents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg. Wait</p>
                      <p className="font-semibold">
                        {region.avgWaitTime 
                          ? formatDuration(region.avgWaitTime * 60000)
                          : "N/A"
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completion Rate</p>
                      <p className="font-semibold">{region.completionRate}%</p>
                    </div>
                  </div>
                  <Progress value={region.utilizationRate} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}