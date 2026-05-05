'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import MarkingQueueStatus from '@/components/marking/MarkingQueueStatus';
import { MarkingJobCard } from '@/components/marking/MarkingJobCard';
import AgentAvailabilityToggle from '@/components/marking/AgentAvailabilityToggle';
import { MarkingTimerCountdown } from '@/components/marking/MarkingTimerCountdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Loader2, MapPin, Clock, CheckCircle } from 'lucide-react';

interface MarkingJob {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: { url: string }[];
  };
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  queuePosition?: number;
  timeSlotExpiry?: string;
  markingFee: number;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  assignedAt?: string;
  createdAt: string;
}

export default function MarkingQueuePage() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<MarkingJob[]>([]);
  const [queuedJobs, setQueuedJobs] = useState<MarkingJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<MarkingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchMarkingJobs();
    fetchAvailabilityStatus();
  }, []);

  const fetchMarkingJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/marking/jobs', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch marking jobs');

      const data = await response.json();
      setActiveJobs(data.active || []);
      setQueuedJobs(data.queued || []);
      setCompletedJobs(data.completed || []);
    } catch (error) {
      console.error('Error fetching marking jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailabilityStatus = async () => {
    try {
      const response = await fetch('/api/marking/availability');
      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.isAvailable);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Marking Job Queue</h1>
            <p className="text-muted-foreground mt-1">
              Manage your property marking assignments
            </p>
          </div>
          <AgentAvailabilityToggle
            userId={user?.id ?? ''}
            initialAvailability={isAvailable}
            serviceAreas={user?.agentServiceAreas ?? []}
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Queue</p>
                <p className="text-2xl font-bold">{queuedJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="queued">
            Queued ({queuedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeJobs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Active Jobs</p>
              <p className="text-muted-foreground">
                Your active marking jobs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id}>
                  <MarkingTimerCountdown
                    expiryTime={job.timeSlotExpiry!}
                  />
                  <MarkingJobCard
                    job={{
                      ...job,
                      propertyTitle: job.property.title,
                      propertyAddress: job.property.address,
                      propertyImages: job.property.images.map(img => img.url),
                      paymentStatus: 'PENDING', // default since queue page MarkingJob type lacks this field
                    }}
                    viewType="agent"
                    onViewDetails={() => { }}
                    onComplete={() => { }}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="queued" className="mt-6">
          {queuedJobs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Queued Jobs</p>
              <p className="text-muted-foreground">
                Available marking jobs will appear here when you&apos;re set as available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queuedJobs.map((job) => (
                <div key={job.id}>
                  {job.queuePosition && (
                    <MarkingQueueStatus
                      jobId={job.id}
                      queuePosition={job.queuePosition}
                    />

                  )}
                  <MarkingJobCard
                    job={{
                      ...job,
                      propertyTitle: job.property.title,
                      propertyAddress: job.property.address,
                      propertyImages: job.property.images.map(img => img.url),
                      paymentStatus: 'PENDING', // default since queue page MarkingJob type lacks this field
                    }}
                    viewType="agent"
                    onViewDetails={() => { }}
                    onComplete={() => { }}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedJobs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Completed Jobs</p>
              <p className="text-muted-foreground">
                Your completed marking jobs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedJobs.map((job) => (
                <MarkingJobCard
                  key={job.id}
                  job={{
                    ...job,
                    propertyTitle: job.property.title,
                    propertyAddress: job.property.address,
                    propertyImages: job.property.images.map(img => img.url),
                    paymentStatus: 'PENDING', // default since queue page MarkingJob type lacks this field
                  }}
                  viewType="agent"
                  onViewDetails={() => { }}
                  onComplete={() => { }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}