// apps/platform/components/marking/QueuePositionTracker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Users,
} from 'lucide-react';

interface QueuePosition {
  id: string;
  jobId: string;
  agentId: string;
  position: number;
  totalInQueue: number;
  status: 'WAITING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  timeSlotExpiry: string;
  assignedAt?: string;
  completedAt?: string;
  compensation?: number;
}

interface QueuePositionTrackerProps {
  jobId: string;
  onExpired?: () => void;
  onCompleted?: () => void;
  updateInterval?: number; // milliseconds
}

export default function QueuePositionTracker({
  jobId,
  onExpired,
  onCompleted,
  updateInterval = 30000, // 30 seconds
}: QueuePositionTrackerProps) {
  const [queueData, setQueueData] = useState<QueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch queue position
  const fetchQueuePosition = async () => {
    try {
      const response = await fetch(`/api/marking/queue/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch queue position');
      const data = await response.json();
      setQueueData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueuePosition();
    const interval = setInterval(fetchQueuePosition, updateInterval);
    return () => clearInterval(interval);
  }, [jobId, updateInterval]);

  // Calculate time remaining
  useEffect(() => {
    if (!queueData?.timeSlotExpiry) return;

    const updateTimeRemaining = () => {
      const expiry = new Date(queueData.timeSlotExpiry).getTime();
      const now = new Date().getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        onExpired?.();
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [queueData?.timeSlotExpiry, onExpired]);

  // Handle completion
  useEffect(() => {
    if (queueData?.status === 'COMPLETED') {
      onCompleted?.();
    }
  }, [queueData?.status, onCompleted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">Loading queue info...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Queue Error</p>
            <p className="text-sm text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchQueuePosition}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600">No queue data available</p>
      </div>
    );
  }

  const statusConfig = {
    WAITING: {
      label: 'Waiting in Queue',
      color: 'bg-blue-100 text-blue-900',
      icon: <Users className="h-5 w-5" />,
    },
    ASSIGNED: {
      label: 'Assigned to You',
      color: 'bg-yellow-100 text-yellow-900',
      icon: <Clock className="h-5 w-5" />,
    },
    IN_PROGRESS: {
      label: 'Marking in Progress',
      color: 'bg-purple-100 text-purple-900',
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
    },
    COMPLETED: {
      label: 'Completed',
      color: 'bg-green-100 text-green-900',
      icon: <CheckCircle className="h-5 w-5" />,
    },
    EXPIRED: {
      label: 'Time Slot Expired',
      color: 'bg-red-100 text-red-900',
      icon: <X className="h-5 w-5" />,
    },
  };

  const status = statusConfig[queueData.status];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Queue Status</h3>
        <Badge className={`${status.color} flex items-center gap-2 px-3 py-1`}>
          {status.icon}
          <span>{status.label}</span>
        </Badge>
      </div>

      {/* Queue Position */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Your Position in Queue
          </span>
          <span className="text-2xl font-bold text-blue-600">
            #{queueData.position}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${Math.max(100 - (queueData.position / queueData.totalInQueue) * 100, 5)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-600 text-right">
          {queueData.totalInQueue} total in queue
        </p>
      </div>

      {/* Time Slot */}
      {queueData.status !== 'COMPLETED' && queueData.status !== 'EXPIRED' && (
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                3-Hour Time Slot
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {queueData.status === 'ASSIGNED'
                  ? 'Complete marking within this time'
                  : 'You will have 3 hours once assigned'}
              </p>
            </div>
            {queueData.status === 'ASSIGNED' && (
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {timeRemaining}
                </p>
                <p className="text-xs text-blue-700 mt-1">remaining</p>
              </div>
            )}
          </div>

          {queueData.status === 'ASSIGNED' && timeRemaining && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                Expires at:{' '}
                <span className="font-semibold">
                  {new Date(queueData.timeSlotExpiry).toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compensation Info */}
      {queueData.compensation && (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-sm font-medium text-green-900 mb-1">
            Your Compensation
          </p>
          <p className="text-2xl font-bold text-green-600">
            ₦{queueData.compensation.toLocaleString()}
          </p>
          <p className="text-xs text-green-700 mt-2">
            Transferred to your virtual account upon completion and confirmation
          </p>
        </div>
      )}

      {/* Completed Status */}
      {queueData.status === 'COMPLETED' && queueData.completedAt && (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Job Completed!</p>
              <p className="text-sm text-green-700">
                Completed on{' '}
                {new Date(queueData.completedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Status */}
      {queueData.status === 'EXPIRED' && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Time Slot Expired</p>
              <p className="text-sm text-red-700 mt-1">
                Your 3-hour window has expired. The marking job may have been
                reassigned to another agent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchQueuePosition}
        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        Refresh Queue Status
      </button>
    </div>
  );
}