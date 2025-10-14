// apps/admin/src/app/(dashboard)/marking/jobs/[jobId]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MarkingJobDetails } from '@/components/marking/MarkingJobDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

async function getMarkingJobDetails(jobId: string) {
  // TODO: Replace with actual API call
  if (jobId === 'not-found') return null;

  return {
    id: jobId,
    propertyId: 'prop-1',
    property: {
      title: '3 Bedroom Flat, Lekki Phase 1',
      address: '15 Admiralty Way, Lekki Phase 1, Lagos',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
      ],
      owner: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+234 801 234 5678'
      }
    },
    requestedBy: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+234 801 234 5678',
      role: 'OWNER'
    },
    assignedAgent: {
      id: 'agent-1',
      name: 'Agent Smith',
      email: 'agent@example.com',
      phone: '+234 802 345 6789',
      reliabilityScore: 4.8,
      completedJobs: 45
    },
    contactPerson: {
      name: 'Jane Doe',
      phone: '+234 802 345 6789'
    },
    status: 'IN_PROGRESS',
    urgencyLevel: 'NORMAL',
    markingFee: 20000,
    paymentStatus: 'SUCCESS',
    accessInstructions: 'Call the contact person 30 minutes before arrival. Gate code is 1234.',
    preferredTime: new Date('2024-10-15T10:00:00'),
    assignedAt: new Date('2024-10-10T08:30:00'),
    timeSlotExpiry: new Date('2024-10-15T14:00:00'),
    completionNotes: null,
    completionImages: [],
    boundaryData: null,
    queuePosition: null,
    maxCompletionTime: new Date('2024-10-13T08:30:00'),
    createdAt: new Date('2024-10-10T08:00:00'),
    updatedAt: new Date('2024-10-10T08:30:00')
  };
}

async function JobDetailsContent({ jobId }: { jobId: string }) {
  const job = await getMarkingJobDetails(jobId);

  if (!job) {
    notFound();
  }

  return <MarkingJobDetails job={job} />;
}

export default function JobDetailsPage({
  params,
}: {
  params: { jobId: string };
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/marking/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Marking Job Details
          </h2>
          <p className="text-muted-foreground">
            Job ID: {params.jobId}
          </p>
        </div>
      </div>

      <Suspense fallback={<JobDetailsSkeleton />}>
        <JobDetailsContent jobId={params.jobId} />
      </Suspense>
    </div>
  );
}

function JobDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}