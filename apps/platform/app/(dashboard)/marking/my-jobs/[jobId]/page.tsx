// apps/platform/app/(dashboard)/marking/my-jobs/[jobId]/page.tsx

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import { JobDetailsClient } from '@/components/marking/JobDetailsClient';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';
import { Card } from '@newcondo/ui';
import { AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Marking Job Details | Newcondo',
  description: 'View marking job details and progress',
};

interface PageProps {
  params: {
    jobId: string;
  };
}

async function getMarkingJob(jobId: string, userId: string) {
  try {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
            totalMarkingJobs: true,
          },
        },
      },
    });

    if (!job) {
      return null;
    }

    // Check if user has access to this job
    const hasAccess =
      job.requestedBy === userId ||
      job.assignedAgentId === userId ||
      job.property.ownerId === userId;

    if (!hasAccess) {
      return null;
    }

    return job;
  } catch (error) {
    console.error('Error fetching marking job:', error);
    return null;
  }
}

async function getRelatedPayment(jobId: string) {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        markingJobId: jobId,
        paymentType: 'PROPERTY_MARKING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payment;
  } catch (error) {
    console.error('Error fetching payment:', error);
    return null;
  }
}

export default async function MarkingJobDetailsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const job = await getMarkingJob(params.jobId, session.user.id);

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Marking Jobs', href: '/marking/my-jobs' },
            { label: 'Job Details', href: '#' },
          ]}
        />

        <Card className="mt-6 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Job Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The marking job you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </Card>
      </div>
    );
  }

  const payment = await getRelatedPayment(params.jobId);

  // Determine user's role in this job
  const isRequester = job.requestedBy === session.user.id;
  const isAssignedAgent = job.assignedAgentId === session.user.id;
  const isPropertyOwner = job.property.ownerId === session.user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Marking Jobs', href: '/marking/my-jobs' },
          { label: `Job #${job.id.slice(0, 8)}`, href: '#' },
        ]}
      />

      <JobDetailsClient
        job={job}
        payment={payment}
        currentUserId={session.user.id}
        userRole={{
          isRequester,
          isAssignedAgent,
          isPropertyOwner,
        }}
      />
    </div>
  );
}