'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Clock, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { formatDistanceToNow } from 'date-fns';

interface QueueAgent {
  id: string;
  name: string;
  position: number;
  timeSlotExpiry: Date;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'EXPIRED';
}

interface MarkingQueueStatusProps {
  jobId: string;
  queuePosition?: number;
  totalInQueue?: number;
  estimatedWaitTime?: number; // in minutes
  currentAgentExpiry?: Date;
  queueAgents?: QueueAgent[];
  onRefresh?: () => void;
}

export default function MarkingQueueStatus({
  jobId,
  queuePosition,
  totalInQueue,
  estimatedWaitTime,
  currentAgentExpiry,
  queueAgents = [],
  onRefresh,
}: MarkingQueueStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!currentAgentExpiry) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(currentAgentExpiry).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentAgentExpiry]);

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--:--';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getQueueStatusColor = () => {
    if (!queuePosition) return 'default';
    if (queuePosition === 1) return 'success';
    if (queuePosition <= 3) return 'warning';
    return 'default';
  };

  const getProgressPercentage = () => {
    if (!queuePosition || !totalInQueue) return 0;
    return ((totalInQueue - queuePosition + 1) / totalInQueue) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Queue Status
        </CardTitle>
        <CardDescription>
          Track your position in the marking job queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Position */}
        {queuePosition && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Position</span>
              <Badge variant={getQueueStatusColor() as any}>
                #{queuePosition} of {totalInQueue}
              </Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        {/* Current Agent Timer */}
        {currentAgentExpiry && queuePosition && queuePosition > 1 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Current agent time remaining:</p>
                <p className="text-2xl font-bold font-mono">
                  {formatTime(timeRemaining)}
                </p>
                {timeRemaining !== null && timeRemaining < 30 * 60 * 1000 && (
                  <p className="text-xs text-muted-foreground">
                    You may be next soon!
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* First in Queue */}
        {queuePosition === 1 && (
          <Alert className="bg-green-50 border-green-200">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-green-800">You're next!</p>
                <p className="text-sm text-green-700">
                  Your 3-hour time slot will begin when the current agent's time expires or they complete the job.
                </p>
                {currentAgentExpiry && (
                  <p className="text-xs text-green-600 mt-2">
                    Starting in approximately: {formatTime(timeRemaining)}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Estimated Wait Time */}
        {estimatedWaitTime && queuePosition && queuePosition > 1 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estimated Wait</span>
            </div>
            <span className="text-sm font-bold">
              ~{Math.round(estimatedWaitTime / 60)} hours
            </span>
          </div>
        )}

        {/* Queue List */}
        {queueAgents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Agents in Queue</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queueAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border ${
                    agent.position === queuePosition
                      ? 'bg-primary/5 border-primary'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.position === 1 ? 'default' : 'outline'}>
                        #{agent.position}
                      </Badge>
                      <span className="text-sm font-medium">
                        {agent.position === queuePosition ? 'You' : agent.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.status === 'IN_PROGRESS' && (
                        <Badge variant="secondary">
                          In Progress
                        </Badge>
                      )}
                      {agent.status === 'EXPIRED' && (
                        <Badge variant="destructive">
                          Expired
                        </Badge>
                      )}
                      {agent.status === 'ASSIGNED' && agent.position === 1 && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(agent.timeSlotExpiry), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Position (Not in queue yet) */}
        {!queuePosition && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">
                You are not currently in the queue. Accept the marking job to join the queue.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
          >
            Refresh Status
          </button>
        )}
      </CardContent>
    </Card>
  );
}