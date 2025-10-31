// apps/admin/src/app/(dashboard)/marking-jobs/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { MarkingJobHeader } from '@/components/admin/marking-jobs/MarkingJobHeader';
import { MarkingJobDetails } from '@/components/admin/marking-jobs/MarkingJobDetails';
import { MarkingJobProperty } from '@/components/admin/marking-jobs/MarkingJobProperty';
import { MarkingJobAgent } from '@/components/admin/marking-jobs/MarkingJobAgent';
import { MarkingJobActions } from '@/components/admin/marking-jobs/MarkingJobActions';
import { MarkingJobTimeline } from '@/components/admin/marking-jobs/MarkingJobTimeline';
import { MarkingJobCompletion } from '@/components/admin/marking-jobs/MarkingJobCompletion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';

interface MarkingJobPageProps {
  params: {
    id: string;
  };
}

async function getMarkingJob(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/marking-jobs/${id}`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch marking job');
  }

  return response.json();
}

export async function generateMetadata({ params }: MarkingJobPageProps) {
  const job = await getMarkingJob(params.id);
  
  if (!job) {
    return {
      title: 'Marking Job Not Found',
    };
  }

  return {
    title: `Marking Job #${job.id.slice(0, 8)} | Admin Dashboard`,
    description: `Manage property marking job`,
  };
}

export default async function MarkingJobPage({ params }: MarkingJobPageProps) {
  const job = await getMarkingJob(params.id);

  if (!job) {
    notFound();
  }

  // Calculate time remaining for time slot
  const timeRemaining = job.timeSlotExpiry 
    ? new Date(job.timeSlotExpiry).getTime() - Date.now()
    : null;
  const hoursRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60)) : null;
  const minutesRemaining = timeRemaining ? Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)) : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/marking-jobs">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marking Jobs
        </Button>
      </Link>

      {/* Header with job status and quick actions */}
      <MarkingJobHeader job={job} />

      {/* Time Slot Alert (if applicable) */}
      {job.status === 'ASSIGNED' && timeRemaining && timeRemaining > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Time Slot Active
              </p>
              <p className="text-sm text-amber-700">
                {hoursRemaining}h {minutesRemaining}m remaining before automatic reassignment
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiry Warning (if applicable) */}
      {job.maxCompletionTime && new Date(job.maxCompletionTime).getTime() - Date.now() < 86400000 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Approaching Maximum Completion Time
              </p>
              <p className="text-sm text-red-700">
                Job must be completed by {new Date(job.maxCompletionTime).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="completion">Completion</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                  <CardDescription>
                    Details about the property marking request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<DetailsSkeleton />}>
                    <MarkingJobDetails job={job} />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Property access contact details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Contact Name</span>
                      <span className="text-sm font-medium">{job.contactPersonName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phone Number</span>
                      <span className="text-sm font-medium">{job.contactPersonPhone}</span>
                    </div>
                    {job.accessInstructions && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Access Instructions</p>
                        <p className="text-sm text-muted-foreground">{job.accessInstructions}</p>
                      </div>
                    )}
                    {job.preferredTime && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Preferred Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.preferredTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Marking Fee</span>
                      <span className="text-sm font-medium">
                        ₦{job.markingFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <span className={`text-sm font-medium ${
                        job.paymentStatus === 'SUCCESS' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {job.paymentStatus}
                      </span>
                    </div>
                    {job.paymentStatus === 'SUCCESS' && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Agent Commission (25%)</span>
                          <span className="font-medium">
                            ₦{(job.markingFee * 0.25).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className="text-muted-foreground">Platform Fee (75%)</span>
                          <span className="font-medium">
                            ₦{(job.markingFee * 0.75).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Requester Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Requested By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<UserSkeleton />}>
                    <UserInfo userId={job.requestedBy} />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Assigned Agent Information */}
              {job.assignedAgentId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<AgentSkeleton />}>
                      <MarkingJobAgent agentId={job.assignedAgentId} job={job} />
                    </Suspense>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="property">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                  <CardDescription>
                    Information about the property to be marked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<PropertySkeleton />}>
                    <MarkingJobProperty propertyId={job.propertyId} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completion">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Details</CardTitle>
                  <CardDescription>
                    Review job completion data and uploaded materials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<CompletionSkeleton />}>
                    <MarkingJobCompletion job={job} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Job Timeline</CardTitle>
                  <CardDescription>
                    History of marking job activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TimelineSkeleton />}>
                    <MarkingJobTimeline jobId={job.id} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkingJobActions job={job} />
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusInfo job={job} />
            </CardContent>
          </Card>

          {/* Queue Information */}
          {job.queuePosition !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Queue Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Position</span>
                    <span className="text-sm font-medium">#{job.queuePosition}</span>
                  </div>
                  {job.maxCompletionTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Max Completion</span>
                      <span className="text-sm font-medium">
                        {new Date(job.maxCompletionTime).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Facts */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickFacts job={job} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Component implementations
function UserInfo({ userId }: { userId: string }) {
  // Fetch and display user information
  return <div>User info component</div>;
}

function JobStatusInfo({ job }: { job: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-50';
      case 'ASSIGNED':
        return 'text-purple-600 bg-purple-50';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-amber-600 bg-amber-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'LOW':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Job Status</p>
        <div className={`px-3 py-2 rounded-lg ${getStatusColor(job.status)}`}>
          <p className="text-sm font-medium text-center">
            {job.status.replace('_', ' ')}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Urgency Level</p>
        <div className={`px-3 py-2 rounded-lg ${getUrgencyColor(job.urgencyLevel)}`}>
          <p className="text-sm font-medium text-center">
            {job.urgencyLevel}
          </p>
        </div>
      </div>

      {job.assignedAt && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Assigned On</p>
          <p className="text-sm text-muted-foreground">
            {new Date(job.assignedAt).toLocaleString()}
          </p>
        </div>
      )}

      {job.completedAt && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Completed On</p>
          <p className="text-sm text-muted-foreground">
            {new Date(job.completedAt).toLocaleString()}
          </p>
        </div>
      )}

      {job.completionNotes && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Completion Notes</p>
          <p className="text-sm text-muted-foreground">{job.completionNotes}</p>
        </div>
      )}
    </div>
  );
}

function QuickFacts({ job }: { job: any }) {
  const facts = [
    {
      label: 'Created',
      value: new Date(job.createdAt).toLocaleDateString(),
    },
    {
      label: 'Last Updated',
      value: new Date(job.updatedAt).toLocaleDateString(),
    },
    {
      label: 'Urgency',
      value: job.urgencyLevel,
    },
  ];

  if (job.assignedAt) {
    const daysSinceAssignment = Math.floor(
      (Date.now() - new Date(job.assignedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    facts.push({
      label: 'Days Since Assignment',
      value: daysSinceAssignment.toString(),
    });
  }

  if (job.completedAt) {
    const completionTime = new Date(job.completedAt).getTime() - new Date(job.assignedAt || job.createdAt).getTime();
    const hoursToComplete = Math.floor(completionTime / (1000 * 60 * 60));
    facts.push({
      label: 'Completion Time',
      value: `${hoursToComplete} hours`,
    });
  }

  if (job.completionImages && job.completionImages.length > 0) {
    facts.push({
      label: 'Completion Images',
      value: job.completionImages.length.toString(),
    });
  }

  return (
    <div className="space-y-3">
      {facts.map((fact, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{fact.label}</span>
          <span className="text-sm font-medium">{fact.value}</span>
        </div>
      ))}
    </div>
  );
}

// Skeleton components
function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function UserSkeleton() {
  return <DetailsSkeleton />;
}

function AgentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-48 w-full bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

function CompletionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 w-full bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}