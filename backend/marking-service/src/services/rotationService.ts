// backend/marking-service/src/services/rotationService.ts

import { PrismaClient, MarkingJobStatus, UrgencyLevel } from '@prisma/client';
import { TimeSlotService } from './timeSlotService';
import { NotificationService } from './notificationService';
import { QueueService } from './queueService';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Utility for calculating Haversine distance (approximation) - essential for agent proximity
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export class RotationService {
  private timeSlotService: TimeSlotService;
  private notificationService: NotificationService;
  private queueService: QueueService;

  constructor() {
    this.timeSlotService = new TimeSlotService();
    this.notificationService = new NotificationService();
    this.queueService = new QueueService();
  }

  /**
   * Automatically rotate expired jobs to next agent in queue
   */
  async processAutomaticRotation() {
    // Check for expired time slots, which updates job status from ASSIGNED to QUEUED
    const expiredResult = await this.timeSlotService.checkExpiredTimeSlots();

    // Process jobs that need reassignment (those just moved back to QUEUED)
    const reassignedJobs = await this.reassignExpiredJobs();

    return {
      expiredTimeSlots: expiredResult.processedCount,
      reassignedJobs: reassignedJobs.length,
      details: reassignedJobs.map(job => ({ id: job.id, property: job.property.title })),
    };
  }

  /**
   * Reassign expired jobs to next available agents
   */
  private async reassignExpiredJobs() {
    // Find jobs that were recently moved back to queue by checkExpiredTimeSlots
    const recentlyQueuedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.QUEUED,
        queuePosition: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
      include: {
        property: true,
      },
      orderBy: {
        queuePosition: 'asc',
      },
    });

    const reassigned = [];

    for (const job of recentlyQueuedJobs) {
      try {
        // Perform smart rotation (re-broadcast to the best agents based on new priority)
        await this.smartRotation(job.id);
        reassigned.push(job);
      } catch (error) {
        console.error(`Failed to reassign job ${job.id}:`, error);
      }
    }

    return reassigned;
  }

  /**
   * Rotate job to next agent in waiting queue
   */
  async rotateToNextAgent(jobId: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        requestingUser: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Reset job to queued
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.QUEUED,
        assignedAgentId: null,
        assignedAt: null,
        timeSlotExpiry: null,
      },
    });

    // Smart Rotation will re-broadcast based on eligibility and performance
    await this.smartRotation(jobId);

    return {
      success: true,
      message: 'Job rotated to next available agents',
    };
  }

  /**
   * Get rotation history for a job
   */
  async getJobRotationHistory(jobId: string) {
    const events = await prisma.eventLog.findMany({
      where: {
        type: {
          in: ['TIME_SLOT_EXPIRED', 'JOB_REASSIGNED', 'MARKING_JOB_ASSIGNED'],
        },
        metadata: {
          path: ['jobId'],
          equals: jobId,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Parse rotation events
    const rotations = events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      details: event.metadata,
    }));

    return {
      jobId,
      totalRotations: rotations.filter(r => r.type === 'TIME_SLOT_EXPIRED').length,
      history: rotations,
    };
  }

  /**
   * Get agents who failed to complete jobs (for rotation tracking)
   */
  async getFailedAgents(timeframe: 'week' | 'month' = 'week') {
    const daysAgo = timeframe === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Find jobs that expired (i.e., status went back to QUEUED after being ASSIGNED)
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.QUEUED,
        assignedAgentId: { not: null },
        updatedAt: { gte: startDate },
      },
      select: {
        id: true,
        assignedAgentId: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            agentReliabilityScore: true,
          },
        },
      },
    });

    // Count failures per agent
    const agentFailures = new Map<string, any>();

    for (const job of expiredJobs) {
      if (!job.assignedAgentId || !job.assignedAgent) continue;

      const agentId = job.assignedAgentId;
      if (agentFailures.has(agentId)) {
        agentFailures.get(agentId).failures++;
      } else {
        agentFailures.set(agentId, {
          agent: job.assignedAgent,
          failures: 1,
        });
      }
    }

    // Convert to array and sort by failures
    return Array.from(agentFailures.values())
      .sort((a, b) => b.failures - a.failures);
  }

  /**
   * Implement smart rotation based on agent performance
   */
  async smartRotation(jobId: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Get property coordinates
    const gpsData = job.property.gpsCoordinates
      ? JSON.parse(job.property.gpsCoordinates)
      : null;

    if (!gpsData || !gpsData.lat || !gpsData.lng) {
      throw new Error('Property must have valid GPS coordinates for smart rotation');
    }
    
    // Check rotation history and set minimum score requirement
    const rotationHistory = await this.getJobRotationHistory(jobId);
    let minReliabilityScore = 3.0; // Default threshold
    if (rotationHistory.totalRotations >= 1) {
        // Lower threshold slightly for jobs that are harder to assign
        minReliabilityScore = 2.5; 
    }
    if (rotationHistory.totalRotations >= 2) {
        // If it's rotated twice, use the core queuing mechanism (all available)
        return this.queueService.addToQueue(jobId);
    }
    
    // Convert Decimal to number for gte filter
    const minScoreDecimal = new Decimal(minReliabilityScore);


    // Find best available agents (high reliability, nearby)
    const eligibleAgents = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: 'AGENT',
            isAvailableForMarking: true,
          },
          {
            role: 'RENTER',
            isPremium: true,
            isAvailableForMarking: true,
          },
        ],
        agentServiceAreas: {
          hasSome: [job.property.city, job.property.state],
        },
        agentReliabilityScore: {
          gte: minScoreDecimal, // Only agents with good scores
        },
        // Exclude the agent who just failed this job, if any
        NOT: job.assignedAgentId ? { id: job.assignedAgentId } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
        // Assuming we could get agent's last known location from a separate tracking field
        // lastKnownLocation: true, 
      },
    });

    if (eligibleAgents.length === 0) {
      // If smart rotation fails, fall back to general queue broadcast
      return this.queueService.addToQueue(jobId);
    }

    // NOTE: True proximity scoring requires agents' current/home coordinates.
    // For now, we rely on the service area filter and reliability score.

    // Broadcast to top-performing agents
    await this.notificationService.broadcastMarkingJobToAgents(job, eligibleAgents);

    return {
      success: true,
      eligibleAgents: eligibleAgents.length,
      message: 'Job broadcasted to top-performing agents for smart rotation',
    };
  }

  /**
   * Handle maximum rotation limit reached
   */
  async handleMaxRotationsReached(jobId: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        requestingUser: true,
        property: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Get rotation count
    const rotationHistory = await this.getJobRotationHistory(jobId);

    // If rotated more than 3 times, escalate
    if (rotationHistory.totalRotations >= 3) {
      // Update job to urgent
      await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          urgencyLevel: UrgencyLevel.URGENT,
          // Also remove from queue/assignment to await admin review
             status: MarkingJobStatus.CANCELLED, // Or a new status like ADMIN_REVIEW
             queuePosition: null,
        },
      });

      // Create support ticket
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: job.requestedBy,
          title: `Marking Job Rotation Limit Reached - ${job.property.title} (${jobId})`,
          description: `Job has been rotated ${rotationHistory.totalRotations} times without completion. Requires immediate admin intervention. Job location: ${job.property.address}, ${job.property.city}.`,
          category: 'PROPERTY',
          priority: 'HIGH',
          status: 'OPEN',
        },
      });

      // Notify admin
      await this.notificationService.notifyAdminMaxRotations(job, rotationHistory.totalRotations, ticket.id);

      // Notify property owner
      await this.notificationService.notifyPropertyOwnerDelayed(job, 'Multiple agents failed to complete marking. Your job has been escalated to our priority support team.');

      return {
        escalated: true,
        ticketId: ticket.id,
        rotations: rotationHistory.totalRotations,
      };
    }

    return {
      escalated: false,
      rotations: rotationHistory.totalRotations,
    };
  }

  /**
   * Get rotation statistics
   */
  async getRotationStats() {
    const [
      totalRotations,
      avgRotationsPerJob,
      jobsWithMultipleRotations,
      mostRotatedJobs,
    ] = await Promise.all([
      this.getTotalRotations(),
      this.getAvgRotationsPerJob(),
      this.getJobsWithMultipleRotations(),
      this.getMostRotatedJobs(),
    ]);

    return {
      totalRotations,
      avgRotationsPerJob,
      jobsWithMultipleRotations,
      mostRotatedJobs,
    };
  }

  /**
   * Get total rotation count
   */
  private async getTotalRotations(): Promise<number> {
    return prisma.eventLog.count({
      where: {
        type: 'TIME_SLOT_EXPIRED',
      },
    });
  }

  /**
   * Calculate average rotations per job
   */
  private async getAvgRotationsPerJob(): Promise<number> {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: {
          in: [MarkingJobStatus.COMPLETED, MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED],
        },
      },
      select: {
        id: true,
      },
    });

    if (jobs.length === 0) return 0;

    const rotationCounts = await Promise.all(
      jobs.map(async job => {
        const events = await prisma.eventLog.count({
          where: {
            type: 'TIME_SLOT_EXPIRED',
            metadata: {
              path: ['jobId'],
              equals: job.id,
            },
          },
        });
        return events;
      })
    );

    const totalRotations = rotationCounts.reduce((sum, count) => sum + count, 0);
    return Number((totalRotations / jobs.length).toFixed(2));
  }

  /**
   * Get jobs with multiple rotations
   */
  private async getJobsWithMultipleRotations(): Promise<number> {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: {
          in: [MarkingJobStatus.COMPLETED, MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED],
        },
      },
      select: {
        id: true,
      },
    });

    let multipleRotationsCount = 0;

    for (const job of jobs) {
      const rotations = await prisma.eventLog.count({
        where: {
          type: 'TIME_SLOT_EXPIRED',
          metadata: {
            path: ['jobId'],
            equals: job.id,
          },
        },
      });

      if (rotations > 1) {
        multipleRotationsCount++;
      }
    }

    return multipleRotationsCount;
  }

  /**
   * Get most rotated jobs
   */
  private async getMostRotatedJobs() {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: {
          in: [MarkingJobStatus.COMPLETED, MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED],
        },
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
      take: 100,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const jobsWithRotations = await Promise.all(
      jobs.map(async job => {
        const rotations = await prisma.eventLog.count({
          where: {
            type: 'TIME_SLOT_EXPIRED',
            metadata: {
              path: ['jobId'],
              equals: job.id,
            },
          },
        });

        return {
          ...job,
          rotationCount: rotations,
        };
      })
    );

    return jobsWithRotations
      .filter(job => job.rotationCount > 0)
      .sort((a, b) => b.rotationCount - a.rotationCount)
      .slice(0, 10);
  }

  /**
   * Schedule automatic rotation checks (to be called by cron job)
   */
  async scheduleRotationCheck() {
    // Check for expired time slots (This handles the rotation of one agent to the next)
    await this.timeSlotService.checkExpiredTimeSlots();

    // Process automatic rotation (This triggers the smart-rotation broadcast for newly queued jobs)
    await this.processAutomaticRotation();

    // Handle jobs with too many rotations
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: MarkingJobStatus.QUEUED,
        queuePosition: { not: null },
      },
      select: {
        id: true,
      },
    });

    for (const job of jobs) {
      const rotationHistory = await this.getJobRotationHistory(job.id);
      // Only check jobs that have actually been rotated (i.e., time slot expired)
      if (rotationHistory.totalRotations >= 3) {
        await this.handleMaxRotationsReached(job.id);
      }
    }

    // Send time slot warnings
    await this.timeSlotService.sendTimeSlotWarnings();
  }

  /**
   * Force rotate job (admin action)
   */
  async forceRotateJob(jobId: string, adminId: string, reason: string) {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        assignedAgent: true,
        property: true,
        requestingUser: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Penalize current agent if assigned
    if (job.assignedAgentId && job.assignedAgent) {
      const currentScore = Number(job.assignedAgent.agentReliabilityScore) || 3.0;
      const newScore = new Decimal(Math.max(0, currentScore - 0.3));

      await prisma.user.update({
        where: { id: job.assignedAgentId },
        data: {
          agentReliabilityScore: newScore,
          // Log a failed job
          totalMarkingJobs: { increment: 1 }, 
        },
      });
    }

    // Rotate the job (resets to QUEUED and triggers smartRotation)
    await this.rotateToNextAgent(jobId);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'MARKING_JOB_ROTATED',
        targetType: 'PropertyMarkingJob',
        targetId: jobId,
        description: `Job forcefully rotated. Reason: ${reason}`,
        metadata: {
          previousAgentId: job.assignedAgentId,
          reason,
        },
      },
    });

    // Notify previous agent
    if (job.assignedAgent) {
      await this.notificationService.notifyAgentForceRotated(job, reason);
    }

    return {
      success: true,
      message: 'Job rotated successfully',
    };
  }

  /**
   * Get agent rotation performance
   */
  async getAgentRotationPerformance(agentId: string) {
    const assignedJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: agentId,
        status: { not: MarkingJobStatus.QUEUED } // Exclude those currently in queue 
      },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        completedAt: true,
        timeSlotExpiry: true,
        assignedAgentId: true,
      },
    });

    let expiredCount = 0;
    let completedOnTime = 0;
    let totalCompleted = 0;

    for (const job of assignedJobs) {
      // Check if time slot expired (rotated)
      const rotations = await prisma.eventLog.count({
        where: {
          type: 'TIME_SLOT_EXPIRED',
          // Filter by job ID, as the event log might not have userId for a TIME_SLOT_EXPIRED event.
          metadata: {
            path: ['jobId'],
            equals: job.id,
          },
        },
      });

      if (rotations > 0) {
        expiredCount++;
      }

      // Check completion status
      if (job.status === MarkingJobStatus.COMPLETED) {
        totalCompleted++;

        if (job.timeSlotExpiry && job.completedAt && job.completedAt <= job.timeSlotExpiry) {
          completedOnTime++;
        }
      }
    }

    return {
      totalAssigned: assignedJobs.length,
      expired: expiredCount,
      completed: totalCompleted,
      completedOnTime,
      expirationRate: assignedJobs.length > 0 ? Number(((expiredCount / assignedJobs.length) * 100).toFixed(2)) : 0,
      onTimeRate: totalCompleted > 0 ? Number(((completedOnTime / totalCompleted) * 100).toFixed(2)) : 0,
    };
  }
}

export default RotationService;