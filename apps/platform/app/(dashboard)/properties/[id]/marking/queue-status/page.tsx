// apps/platform/app/(dashboard)/properties/[id]/marking/queue-status/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Phone,
  Calendar,
  Loader,
  RefreshCw,
  Share2,
  FileText,
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/feedback/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface QueueAgent {
  id: string;
  position: number;
  name: string;
  phone: string;
  reliabilityScore: number;
  completedJobs: number;
  serviceName: string;
  serviceAreas: string[];
  assignedAt?: string;
  timeSlotExpiry?: string;
  status: 'WAITING' | 'ASSIGNED' | 'COMPLETED' | 'SKIPPED';
}

interface MarkingJobDetail {
  id: string;
  propertyId: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD' | 'RELEASED';
  requestedBy: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  queuePosition?: number;
  timeSlotExpiry?: string;
  maxCompletionTime?: string;
  completedAt?: string;
  completionNotes?: string;
  completionImages?: string[];
  queue: QueueAgent[];
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
}

export default function QueueStatusPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const propertyId = params.id as string;
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<MarkingJobDetail | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const fetchJobStatus = useCallback(async () => {
    try {
      if (!jobId || !propertyId) return;

      const response = await fetch(`/api/marking-jobs/${jobId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJob(data.job);
      setProperty(data.property);

      if (data.job.status === 'COMPLETED' || data.job.status === 'CANCELLED') {
        setAutoRefresh(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, propertyId]);

  useEffect(() => {
    fetchJobStatus();
  }, [fetchJobStatus]);

  // Auto-refresh every 10 seconds if job is still queued or assigned
  useEffect(() => {
    if (!autoRefresh || !job) return;

    const interval = setInterval(() => {
      fetchJobStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, job, fetchJobStatus]);

  // Calculate time remaining
  useEffect(() => {
    if (!job?.timeSlotExpiry) return;

    const updateCountdown = () => {
      const expiry = new Date(job.timeSlotExpiry).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Time expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [job?.timeSlotExpiry]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'QUEUED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleShareMarkingLink = async () => {
    if (!job) return;

    const link = `${window.location.origin}/marking/${job.id}/shared`;
    setShareLink(link);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mark Property',
          text: `Help mark this property: ${property?.title}`,
          url: link,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !job) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Marking job not found'}</AlertDescription>
      </Alert>
    );
  }

  const isAssigned = job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS';
  const isCompleted = job.status === 'COMPLETED';
  const isQueued = job.status === 'QUEUED';
  const assignedAgent = job.queue?.find((a) => a.status === 'ASSIGNED' || a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-4">Marking Job Status</h1>
          <p className="text-gray-600 mt-2">Job ID: {job.id.slice(0, 12).toUpperCase()}...</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobStatus}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Status Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{property?.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {property?.address}, {property?.city}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace(/_/g, ' ')}
              </Badge>
              <Badge className={getUrgencyColor(job.urgencyLevel)}>
                {job.urgencyLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Job Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Job Timeline</h3>

            {/* Created */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
              </div>
              <div>
                <p className="font-semibold text-sm">Job Created</p>
                <p className="text-xs text-gray-600">{formatDate(job.createdAt)}</p>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    job.paymentStatus === 'SUCCESS' ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {job.paymentStatus === 'SUCCESS' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
              </div>
              <div>
                <p className="font-semibold text-sm">Payment {job.paymentStatus}</p>
                <p className="text-xs text-gray-600">
                  ₦{job.markingFee.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Queue/Assignment */}
            {isQueued && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-yellow-600 animate-spin" />
                  </div>
                  <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Waiting in Queue - Position #{job.queuePosition}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Agents are being notified. Average wait time: 2-4 hours
                  </p>
                </div>
              </div>
            )}

            {/* Assignment */}
            {isAssigned && assignedAgent && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-sm">Agent Assigned</p>
                  <p className="text-sm mt-1">{job.assignedAgentName}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {job.assignedAgentPhone}
                  </p>
                </div>
              </div>
            )}

            {/* Completion */}
            {isCompleted && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">Marking Completed</p>
                  <p className="text-xs text-gray-600">{formatDate(job.completedAt || '')}</p>
                  {job.completionNotes && (
                    <p className="text-xs bg-gray-50 p-2 rounded mt-2">{job.completionNotes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Time Slot Countdown */}
          {isAssigned && job.timeSlotExpiry && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Time Slot Expires In</p>
                  <p className="text-xs text-gray-600 mt-1">Agent has this window to complete marking</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">{timeRemaining}</p>
                  <p className="text-xs text-gray-600">3-hour window</p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Deadline */}
          {!isCompleted && job.maxCompletionTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">You must confirm by</p>
                  <p className="text-sm text-gray-700 mt-1">{formatDate(job.maxCompletionTime)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Confirm the marking is correct, or the agent will receive compensation
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Overview */}
      {job.queue && job.queue.length > 0 && isQueued && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Overview</CardTitle>
            <CardDescription>
              Agents waiting to mark this property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {job.queue.map((agent, idx) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border ${
                    agent.position === job.queuePosition
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-semibold text-sm">
                        {agent.position}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{agent.serviceName}</p>
                        <p className="text-xs text-gray-600">{agent.serviceAreas.join(', ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          ⭐ {agent.reliabilityScore}
                        </span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
                          {agent.completedJobs} jobs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Agent Details */}
      {isAssigned && job.assignedAgentName && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Agent Name</p>
                <p className="font-semibold mt-1">{job.assignedAgentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact
                </p>
                <p className="font-semibold mt-1">{job.assignedAgentPhone}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Access Information</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-sm font-medium">Contact Person: {job.contactPersonName}</p>
                <p className="text-sm text-gray-600 mt-1">Phone: {job.contactPersonPhone}</p>
                {job.accessInstructions && (
                  <p className="text-sm text-gray-600 mt-2">
                    Instructions: {job.accessInstructions}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Photos */}
      {isCompleted && job.completionImages && job.completionImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Photos</CardTitle>
            <CardDescription>
              Photos captured by the agent during marking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {job.completionImages.map((image, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={image}
                    alt={`Marking photo ${idx + 1}`}
                    className="w-full h-24 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75"
                  />
                  <p className="text-xs text-gray-600 mt-1 text-center">Photo {idx + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {isCompleted && (
          <div className="flex gap-3">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Marking
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Request New Marking
            </Button>
          </div>
        )}

        {isQueued && (
          <Button
            onClick={handleShareMarkingLink}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Marking Link
          </Button>
        )}

        {shareLink && (
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Share this link with someone to mark for you:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 text-xs border rounded bg-white"
              />
              <Button size="sm" onClick={handleCopyLink} variant="outline">
                Copy
              </Button>
            </div>
          </div>
        )}

        <Button variant="outline" onClick={() => router.push(`/properties/${propertyId}/marking`)}>
          Back to Marking Jobs
        </Button>
      </div>
    </div>
  );
}