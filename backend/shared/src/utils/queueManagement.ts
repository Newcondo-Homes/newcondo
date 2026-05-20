import { MarkingJobStatus, prisma } from '@newcondo/db';


export interface QueueItemManagement {
  id: string;
  userId: string;
  propertyId: string;
  markingJobId: string;
  position: number;
  assignedAt: Date | null;
  timeSlotExpiry: Date | null;
  createdAt: Date;
}

interface QueueStats {
  totalInQueue: number;
  activeAssignments: number;
  completedToday: number;
  averageCompletionTime: number;
  currentPosition: number | null;
}

export interface QueueTimeSlotConfig {
  durationMinutes: number;
  bufferMinutes: number;
  maxConcurrentAssignments: number;
}

const DEFAULT_TIME_SLOT_CONFIG: QueueTimeSlotConfig = {
  durationMinutes: 180, // 3 hours
  bufferMinutes: 15, // 15-minute buffer
  maxConcurrentAssignments: 10, // Maximum concurrent marking jobs
};

/**
 * Add a marking job to the queue
 */
export async function addToQueue(
  markingJobId: string,
  userId: string,
  propertyId: string
): Promise<QueueItemManagement> {
  // Get current queue position
  const currentMaxPosition = await prisma.propertyMarkingJob.findFirst({
    where: {
      status: MarkingJobStatus.QUEUED,
    },
    orderBy: {
      queuePosition: 'desc',
    },
    select: {
      queuePosition: true,
    },
  });

  const nextPosition = (currentMaxPosition?.queuePosition ?? 0) + 1;

  // Update the marking job with queue position
  const updatedJob = await prisma.propertyMarkingJob.update({
    where: { id: markingJobId },
    data: {
      queuePosition: nextPosition,
      status: MarkingJobStatus.QUEUED,
    },
  });

  return {
    id: updatedJob.id,
    userId,
    propertyId,
    markingJobId,
    position: nextPosition,
    assignedAt: updatedJob.assignedAt,
    timeSlotExpiry: updatedJob.timeSlotExpiry,
    createdAt: updatedJob.createdAt,
  };
}

/**
 * Get next available item from queue
 */
export async function getNextInQueue(
  markingJobId: string
): Promise<QueueItemManagement | null> {
  const job = await prisma.propertyMarkingJob.findFirst({
    where: {
      propertyId: {
        in: await prisma.propertyMarkingJob
          .findUnique({
            where: { id: markingJobId },
            select: { propertyId: true },
          })
          .then((j) => (j ? [j.propertyId] : [])),
      },
      status: MarkingJobStatus.QUEUED,
      queuePosition: {
        gt: 0,
      },
    },
    orderBy: {
      queuePosition: 'asc',
    },
  });

  if (!job) return null;

  return {
    id: job.id,
    userId: job.requestedBy,
    propertyId: job.propertyId,
    markingJobId: job.id,
    position: job.queuePosition ?? 0,
    assignedAt: job.assignedAt,
    timeSlotExpiry: job.timeSlotExpiry,
    createdAt: job.createdAt,
  };
}

/**
 * Assign time slot to agent
 */
export async function assignTimeSlot(
  markingJobId: string,
  agentId: string,
  config: QueueTimeSlotConfig = DEFAULT_TIME_SLOT_CONFIG
): Promise<{
  success: boolean;
  timeSlotExpiry: Date | null;
  message: string;
}> {
  // Check if agent already has too many active assignments
  const activeAssignments = await prisma.propertyMarkingJob.count({
    where: {
      assignedAgentId: agentId,
      status: {
        in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
      },
      timeSlotExpiry: {
        gte: new Date(),
      },
    },
  });

  if (activeAssignments >= config.maxConcurrentAssignments) {
    return {
      success: false,
      timeSlotExpiry: null,
      message: 'Agent has reached maximum concurrent assignments',
    };
  }

  // Calculate time slot expiry
  const now = new Date();
  const timeSlotExpiry = new Date(
    now.getTime() + config.durationMinutes * 60 * 1000
  );

  // Assign the job
  const updatedJob = await prisma.propertyMarkingJob.update({
    where: { id: markingJobId },
    data: {
      assignedAgentId: agentId,
      status: MarkingJobStatus.ASSIGNED,
      assignedAt: now,
      timeSlotExpiry,
    },
  });

  return {
    success: true,
    timeSlotExpiry: updatedJob.timeSlotExpiry,
    message: 'Time slot assigned successfully',
  };
}

/**
 * Release expired time slots
 */
export async function releaseExpiredTimeSlots(): Promise<number> {
  const now = new Date();

  const expiredJobs = await prisma.propertyMarkingJob.findMany({
    where: {
      status: {
        in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
      },
      timeSlotExpiry: {
        lt: now,
      },
    },
  });

  if (expiredJobs.length === 0) return 0;

  // Release all expired slots
  await prisma.propertyMarkingJob.updateMany({
    where: {
      id: {
        in: expiredJobs.map((job) => job.id),
      },
    },
    data: {
      assignedAgentId: null,
      status: MarkingJobStatus.QUEUED,
      assignedAt: null,
      timeSlotExpiry: null,
    },
  });

  return expiredJobs.length;
}

/**
 * Move to next in queue after completion or failure
 */
export async function moveToNextInQueue(
  propertyId: string
): Promise<QueueItemManagement | null> {
  // Get the next job in queue
  const nextJob = await prisma.propertyMarkingJob.findFirst({
    where: {
      propertyId,
      status: MarkingJobStatus.QUEUED,
    },
    orderBy: {
      queuePosition: 'asc',
    },
  });

  if (!nextJob) return null;

  // Update queue positions for all jobs after this one
  await prisma.propertyMarkingJob.updateMany({
    where: {
      propertyId,
      status: MarkingJobStatus.QUEUED,
      queuePosition: {
        gt: nextJob.queuePosition ?? 0,
      },
    },
    data: {
      queuePosition: {
        decrement: 1,
      },
    },
  });

  return {
    id: nextJob.id,
    userId: nextJob.requestedBy,
    propertyId: nextJob.propertyId,
    markingJobId: nextJob.id,
    position: nextJob.queuePosition ?? 0,
    assignedAt: nextJob.assignedAt,
    timeSlotExpiry: nextJob.timeSlotExpiry,
    createdAt: nextJob.createdAt,
  };
}

/**
 * Remove from queue
 */
export async function removeFromQueue(markingJobId: string): Promise<boolean> {
  const job = await prisma.propertyMarkingJob.findUnique({
    where: { id: markingJobId },
    select: {
      propertyId: true,
      queuePosition: true,
    },
  });

  if (!job) return false;

  // Update the job status
  await prisma.propertyMarkingJob.update({
    where: { id: markingJobId },
    data: {
      status: MarkingJobStatus.CANCELLED,
      queuePosition: null,
    },
  });

  // Update queue positions for jobs after this one
  if (job.queuePosition) {
    await prisma.propertyMarkingJob.updateMany({
      where: {
        propertyId: job.propertyId,
        status: MarkingJobStatus.QUEUED,
        queuePosition: {
          gt: job.queuePosition,
        },
      },
      data: {
        queuePosition: {
          decrement: 1,
        },
      },
    });
  }

  return true;
}

/**
 * Get queue statistics for a property
 */
export async function getQueueStats(
  propertyId: string,
  userId?: string
): Promise<QueueStats> {
  const totalInQueue = await prisma.propertyMarkingJob.count({
    where: {
      propertyId,
      status: MarkingJobStatus.QUEUED,
    },
  });

  const activeAssignments = await prisma.propertyMarkingJob.count({
    where: {
      propertyId,
      status: {
        in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedToday = await prisma.propertyMarkingJob.count({
    where: {
      propertyId,
      status: MarkingJobStatus.COMPLETED,
      completedAt: {
        gte: today,
      },
    },
  });

  // Calculate average completion time
  const completedJobs = await prisma.propertyMarkingJob.findMany({
    where: {
      propertyId,
      status: MarkingJobStatus.COMPLETED,
      assignedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      assignedAt: true,
      completedAt: true,
    },
    take: 20, // Last 20 completed jobs
  });

  const avgCompletionTime =
    completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
        if (job.assignedAt && job.completedAt) {
          return (
            sum +
            (job.completedAt.getTime() - job.assignedAt.getTime()) / 60000
          );
        }
        return sum;
      }, 0) / completedJobs.length
      : 0;

  // Get current user's position if userId provided
  let currentPosition: number | null = null;
  if (userId) {
    const userJob = await prisma.propertyMarkingJob.findFirst({
      where: {
        propertyId,
        requestedBy: userId,
        status: MarkingJobStatus.QUEUED,
      },
      select: {
        queuePosition: true,
      },
    });
    currentPosition = userJob?.queuePosition ?? null;
  }

  return {
    totalInQueue,
    activeAssignments,
    completedToday,
    averageCompletionTime: Math.round(avgCompletionTime),
    currentPosition,
  };
}

/**
 * Clear entire queue for a property (admin action)
 */
export async function clearQueue(propertyId: string): Promise<number> {
  const result = await prisma.propertyMarkingJob.updateMany({
    where: {
      propertyId,
      status: MarkingJobStatus.QUEUED,
    },
    data: {
      status: MarkingJobStatus.CANCELLED,
      queuePosition: null,
    },
  });

  return result.count;
}

/**
 * Reorder queue positions after manual intervention
 */
export async function reorderQueue(propertyId: string): Promise<void> {
  const jobs = await prisma.propertyMarkingJob.findMany({
    where: {
      propertyId,
      status: MarkingJobStatus.QUEUED,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Update positions sequentially
  for (let i = 0; i < jobs.length; i++) {
    await prisma.propertyMarkingJob.update({
      where: { id: jobs[i].id },
      data: { queuePosition: i + 1 },
    });
  }
}

/**
 * Get agent's current queue assignments
 */
export async function getAgentQueueAssignments(agentId: string): Promise<
  Array<{
    markingJobId: string;
    propertyId: string;
    position: number;
    timeSlotExpiry: Date | null;
    status: MarkingJobStatus;
  }>
> {
  const assignments = await prisma.propertyMarkingJob.findMany({
    where: {
      assignedAgentId: agentId,
      status: {
        in: [
          MarkingJobStatus.ASSIGNED,
          MarkingJobStatus.IN_PROGRESS,
          MarkingJobStatus.QUEUED,
        ],
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  });

  return assignments.map((job) => ({
    markingJobId: job.id,
    propertyId: job.propertyId,
    position: job.queuePosition ?? 0,
    timeSlotExpiry: job.timeSlotExpiry,
    status: job.status,
  }));
}