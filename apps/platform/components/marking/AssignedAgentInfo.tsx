// apps/platform/components/marking/AssignedAgentInfo.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Phone, MapPin, Clock, AlertCircle } from 'lucide-react';

interface AssignedAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  agentServiceAreas: string[];
}

interface MarkingJobData {
  id: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAgentId: string | null;
  assignedAgent?: AssignedAgent;
  timeSlotExpiry?: string;
  queuePosition?: number;
  contactPersonName: string;
  contactPersonPhone: string;
}

interface AssignedAgentInfoProps {
  markingJob: MarkingJobData;
  showContactInfo?: boolean;
  isPropertyOwner?: boolean;
  onContactAgent?: (agentId: string) => void;
}

export function AssignedAgentInfo({
  markingJob,
  showContactInfo = true,
  isPropertyOwner = false,
  onContactAgent,
}: AssignedAgentInfoProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  const agent = markingJob.assignedAgent;

  // Calculate completion rate
  const completionRate = agent
    ? ((agent.completedMarkingJobs / (agent.totalMarkingJobs || 1)) * 100).toFixed(0)
    : 0;

  // Timer for time slot expiry
  useEffect(() => {
    if (!markingJob.timeSlotExpiry) return;

    const updateTimer = () => {
      const expiry = new Date(markingJob.timeSlotExpiry).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsExpiringSoon(true);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        setIsExpiringSoon(diff < 30 * 60 * 1000); // Less than 30 minutes
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [markingJob.timeSlotExpiry]);

  const getStatusBadgeVariant = useCallback(() => {
    switch (markingJob.status) {
      case 'ASSIGNED':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'default';
    }
  }, [markingJob.status]);

  const getStatusDisplay = useCallback(() => {
    const statusMap = {
      ASSIGNED: 'Agent Assigned',
      IN_PROGRESS: 'Marking In Progress',
      COMPLETED: 'Marking Completed',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Time Slot Expired',
    };
    return statusMap[markingJob.status as keyof typeof statusMap] || 'Unknown';
  }, [markingJob.status]);

  if (!agent) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-lg">Agent Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No agent assigned yet. Waiting for availability...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isExpiringSoon && markingJob.status === 'ASSIGNED' ? 'border-red-200' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Assigned Agent</CardTitle>
            <CardDescription>{getStatusDisplay()}</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant()}>{markingJob.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Agent Profile Section */}
        <div className="flex items-start gap-4">
          {agent.image ? (
            <Image
              src={agent.image}
              alt={agent.name}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">{agent.name.charAt(0)}</span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-semibold text-base">{agent.name}</h3>

            {/* Reliability Score */}
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(agent.agentReliabilityScore)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {agent.agentReliabilityScore.toFixed(1)} ({completionRate}%)
              </span>
            </div>

            {/* Job Stats */}
            <p className="text-xs text-gray-600 mt-1">
              {agent.completedMarkingJobs} completed jobs
            </p>
          </div>
        </div>

        {/* Time Slot Information */}
        {markingJob.timeSlotExpiry && markingJob.status === 'ASSIGNED' && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              isExpiringSoon ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <Clock className={`mt-0.5 flex-shrink-0 ${isExpiringSoon ? 'text-red-600' : 'text-blue-600'}`} size={18} />
            <div className="flex-1">
              <p className={`text-sm font-semibold ${isExpiringSoon ? 'text-red-900' : 'text-blue-900'}`}>
                3-Hour Time Slot
              </p>
              <p className={`text-xs ${isExpiringSoon ? 'text-red-700' : 'text-blue-700'}`}>
                Time remaining: <span className="font-mono font-semibold">{timeRemaining}</span>
              </p>
            </div>
          </div>
        )}

        {/* Queue Position */}
        {markingJob.queuePosition && markingJob.status === 'QUEUED' && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-700">
              Queue Position: <span className="font-semibold">#{markingJob.queuePosition}</span>
            </p>
          </div>
        )}

        {/* Contact Information - Show to Agent */}
        {showContactInfo && !isPropertyOwner && markingJob.status === 'ASSIGNED' && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 uppercase">Contact Person</p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{markingJob.contactPersonName}</p>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-600" />
                <a
                  href={`tel:${markingJob.contactPersonPhone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {markingJob.contactPersonPhone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Service Areas */}
        {agent.agentServiceAreas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase">Service Areas</p>
            <div className="flex flex-wrap gap-1">
              {agent.agentServiceAreas.map((area) => (
                <Badge key={area} variant="outline" className="text-xs">
                  <MapPin size={12} className="mr-1" />
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Agent Contact Button */}
        {isPropertyOwner && showContactInfo && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onContactAgent?.(agent.id)}
          >
            <Phone size={16} className="mr-2" />
            Contact Agent
          </Button>
        )}

        {/* Warning for Owner if Time is Expiring */}
        {isPropertyOwner && isExpiringSoon && markingJob.status === 'ASSIGNED' && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-2">
            <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-900">Time Slot Expiring Soon</p>
              <p className="text-xs text-yellow-700 mt-1">
                The agent has {timeRemaining} to complete the property marking. Please be available.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}