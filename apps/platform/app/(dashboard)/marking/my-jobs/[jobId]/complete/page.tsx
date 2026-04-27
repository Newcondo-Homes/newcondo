// apps/platform/app/(dashboard)/marking/my-jobs/[jobId]/complete/page.tsx

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import { CompleteMarkingJobClient } from '@/components/marking/CompleteMarkingJobClient';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';
import { Card } from '@newcondo/ui';
import { AlertCircle, Lock } from 'lucide-react';
import { markingApi, MarkingJobResponse } from '@/lib/api/marking';

export const metadata: Metadata = {
  title: 'Complete Marking Job | Newcondo',
  description: 'Complete property marking job and submit boundary data',
};

interface PageProps {
  params: {
    jobId: string;
  };
}

async function getMarkingJobForCompletion(jobId: string, userId: string): Promise<{
  job: MarkingJobResponse | null;
  error: string | null;
}>  {
  try {
    const job = await markingApi.getJobById(jobId);

    if (!job) {
      return { job: null, error: 'Job not found' };
    }

    // Only assigned agent can complete the job
    if (job.assignedAgentId !== userId) {
      return { job: null, error: 'Unauthorized' };
    }

    // Check if job is in correct status
    if (job.status !== 'ASSIGNED' && job.status !== 'IN_PROGRESS') {
      return {
        job: null,
        error: 'Job cannot be completed in current status',
      };
    }

    // Check if time slot has expired
    if (job.timeSlotExpiry && new Date(job.timeSlotExpiry) < new Date()) {
      return { job: null, error: 'Time slot has expired' };
    }

    return { job, error: null };
  } catch (error) {
    console.error('Error fetching marking job:', error);
    return { job: null, error: 'Failed to fetch job' };
  }
}

export default async function CompleteMarkingJobPage({ params }: PageProps) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { job, error } = await getMarkingJobForCompletion(
    params.jobId,
    session.user.id
  );

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Marking Jobs', href: '/marking/my-jobs' },
            { label: `Job #${params.jobId.slice(0, 8)}`, href: `/marking/my-jobs/${params.jobId}` },
            { label: 'Complete', href: '#' },
          ]}
        />

        <Card className="mt-6 p-8 text-center">
          {error === 'Unauthorized' ? (
            <>
              <Lock className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
              <p className="mt-2 text-muted-foreground">
                You are not authorized to complete this marking job.
              </p>
            </>
          ) : error === 'Time slot has expired' ? (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-warning" />
              <h2 className="mt-4 text-xl font-semibold">Time Slot Expired</h2>
              <p className="mt-2 text-muted-foreground">
                The 3-hour time slot for completing this job has expired. The
                job will be reassigned to the next agent in queue.
              </p>
            </>
          ) : error === 'Job cannot be completed in current status' ? (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-warning" />
              <h2 className="mt-4 text-xl font-semibold">
                Job Cannot Be Completed
              </h2>
              <p className="mt-2 text-muted-foreground">
                This job is not in a status that allows completion. It may have
                already been completed or cancelled.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h2 className="mt-4 text-xl font-semibold">Job Not Found</h2>
              <p className="mt-2 text-muted-foreground">
                The marking job you're looking for doesn't exist.
              </p>
            </>
          )}
        </Card>
      </div>
    );
  }

  // Calculate time remaining in slot
  const timeRemaining = job.timeSlotExpiry
    ? Math.max(
        0,
        Math.floor(
          (new Date(job.timeSlotExpiry).getTime() - Date.now()) / 1000 / 60
        )
      )
    : 180; // Default 3 hours in minutes

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Marking Jobs', href: '/marking/my-jobs' },
          {
            label: `Job #${job.id.slice(0, 8)}`,
            href: `/marking/my-jobs/${job.id}`,
          },
          { label: 'Complete', href: '#' },
        ]}
      />

      <div className="mt-6">
        <CompleteMarkingJobClient
          job={job}
          timeRemainingMinutes={timeRemaining}
        />
      </div>
    </div>
  );
}