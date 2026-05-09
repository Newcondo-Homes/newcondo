// apps/platform/app/(dashboard)/marking/my-jobs/[jobId]/page.tsx

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import { JobDetailsClient } from '@/components/marking/JobDetailsClient';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';
import { Card } from '@newcondo/ui';
import { AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobId } = await params;
  return {
    title: `Marking Job ${jobId.slice(0, 8)} | Newcondo`,
    description: 'View marking job details and progress',
  };
}

async function getMarkingJob(jobId: string, userId: string) {
  try {
    //TODO: Remember to remove this prisma call from here and wrap it behind
    // an express server endpoint so that the database connection is utilized properly
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
  const { jobId } = await params;

  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const job = await getMarkingJob(jobId, session.user.id);

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
            The marking job you&apos;re looking for doesn&apos;t exist or you don&apos;t have
            permission to view it.
          </p>
        </Card>
      </div>
    );
  }

  const payment = await getRelatedPayment(jobId);

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
          { label: `Job #${jobId.slice(0, 8)}`, href: '#' },
        ]}
      />

      <JobDetailsClient
        job={{
          ...job,
          markingFee: job.markingFee.toNumber(),
          assignedAgent: job.assignedAgent
            ? {
                ...job.assignedAgent,
                agentReliabilityScore:
                  job.assignedAgent.agentReliabilityScore?.toNumber() ?? null,
              }
            : null,
        }}
        payment={
          payment
            ? {
                ...payment,
                amount: payment.amount.toNumber(),
              }
            : null
        }
        currentUserId={session.user.id}
        userRole={{ isRequester, isAssignedAgent, isPropertyOwner }}
      />
    </div>
  );
}