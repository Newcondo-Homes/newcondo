// apps/platform/components/marking/MarkingJobStatus.tsx
'use client';

import React, { useMemo } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { AlertCircle, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MarkingJobStatusProps {
  jobId: string;
  propertyTitle: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt?: Date;
  completedAt?: Date;
  maxCompletionTime?: Date;
  queuePosition?: number;
  agentName?: string;
  agentPhone?: string;
  onConfirmRequired?: boolean;
}

export const MarkingJobStatus: React.FC<MarkingJobStatusProps> = ({
  jobId,
  propertyTitle,
  status,
  assignedAt,
  completedAt,
  maxCompletionTime,
  queuePosition,
  agentName,
  agentPhone,
  onConfirmRequired,
}) => {
  // Status configuration
  const statusConfig = {
    QUEUED: {
      label: 'In Queue',
      icon: Hourglass,
      color: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-800',
      description: 'Waiting for an agent to accept',
    },
    ASSIGNED: {
      label: 'Assigned',
      icon: Clock,
      color: 'bg-orange-50',
      badge: 'bg-orange-100 text-orange-800',
      description: 'Agent is on the way',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: Clock,
      color: 'bg-purple-50',
      badge: 'bg-purple-100 text-purple-800',
      description: 'Agent is marking your property',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle,
      color: 'bg-green-50',
      badge: 'bg-green-100 text-green-800',
      description: 'Awaiting your confirmation',
    },
    CANCELLED: {
      label: 'Cancelled',
      icon: XCircle,
      color: 'bg-red-50',
      badge: 'bg-red-100 text-red-800',
      description: 'Job has been cancelled',
    },
    EXPIRED: {
      label: 'Expired',
      icon: AlertCircle,
      color: 'bg-gray-50',
      badge: 'bg-gray-100 text-gray-800',
      description: 'Time slot has expired',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Calculate time remaining for confirmation
  const timeRemaining = useMemo(() => {
    if (!maxCompletionTime) return null;
    const now = new Date();
    const daysRemaining = differenceInDays(maxCompletionTime, now);
    const isOverdue = isPast(maxCompletionTime);

    return {
      daysRemaining: Math.max(0, daysRemaining),
      isOverdue,
      formattedDeadline: format(maxCompletionTime, 'MMM dd, yyyy h:mm a'),
    };
  }, [maxCompletionTime]);

  // Timeline steps
  const timeline = [
    { step: 'Job Created', completed: true },
    { step: 'Agent Assigned', completed: status !== 'QUEUED' },
    { step: 'Marking Complete', completed: ['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(status) },
    { step: 'Your Confirmation', completed: status === 'COMPLETED' && !onConfirmRequired },
  ];

  const completedSteps = timeline.filter(t => t.completed).length;
  const progressPercentage = (completedSteps / timeline.length) * 100;

  return (
    <Card className={`${config.color} border border-gray-200`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.label}</CardTitle>
              <CardDescription>{propertyTitle}</CardDescription>
            </div>
          </div>
          <Badge className={config.badge}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Description */}
        <p className="text-sm text-gray-600">{config.description}</p>

        {/* Queue Position (only for QUEUED status) */}
        {status === 'QUEUED' && queuePosition !== undefined && (
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-gray-700">Position in Queue</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">#{queuePosition}</div>
            <p className="text-xs text-gray-500 mt-2">
              Agents are being notified. Expected to be assigned soon.
            </p>
          </div>
        )}

        {/* Agent Assignment (only for ASSIGNED and IN_PROGRESS) */}
        {(status === 'ASSIGNED' || status === 'IN_PROGRESS') && agentName && (
          <div className="p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-sm font-medium text-gray-700">Assigned Agent</div>
            <div className="mt-2 space-y-1">
              <div className="font-semibold text-gray-900">{agentName}</div>
              {agentPhone && (
                <div className="text-sm text-gray-600">
                  Contact: <a href={`tel:${agentPhone}`} className="text-blue-600 hover:underline">{agentPhone}</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Remaining for Confirmation */}
        {timeRemaining && status === 'COMPLETED' && (
          <div className={`p-3 rounded-lg border ${timeRemaining.isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="text-sm font-medium text-gray-700">
              {timeRemaining.isOverdue ? 'Confirmation Overdue' : 'Confirm by'}
            </div>
            <div className="mt-1">
              <div className={`text-lg font-bold ${timeRemaining.isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                {timeRemaining.isOverdue ? 'Overdue' : `${timeRemaining.daysRemaining} days remaining`}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Deadline: {timeRemaining.formattedDeadline}
              </p>
            </div>
          </div>
        )}

        {/* Completion Timestamp */}
        {completedAt && (
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700">Completed At</div>
            <div className="text-gray-900 font-medium mt-1">
              {format(completedAt, 'MMM dd, yyyy h:mm a')}
            </div>
          </div>
        )}

        {/* Timeline Progress */}
        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Timeline Steps */}
          <div className="space-y-2 pt-2">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    item.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                <span className={`text-sm ${item.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {item.step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Job ID Reference */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Job ID: <span className="font-mono text-gray-700">{jobId}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};