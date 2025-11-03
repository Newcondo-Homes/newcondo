// backend/marking-service/src/services/markingHistoryService.ts

import { PrismaClient, MarkingJobStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface MarkingHistoryFilters {
  page: number;
  limit: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class MarkingHistoryService {
  /**
   * Get marking history for property owner or agent
   */
  async getMarkingHistory(
    userId: string,
    role: 'owner' | 'agent',
    filters: MarkingHistoryFilters
  ) {
    const { page, limit, status, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === 'owner') {
      where.requestedBy = userId;
    } else if (role === 'agent') {
      where.assignedAgentId = userId;
    }

    if (status) {
      where.status = status as MarkingJobStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [jobs, total] = await Promise.all([
      prisma.propertyMarkingJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
          requestingUser: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              agentReliabilityScore: true,
            },
          },
        },
      }),
      prisma.propertyMarkingJob.count({ where }),
    ]);

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        propertyId: job.propertyId,
        propertyTitle: job.property.title,
        propertyAddress: `${job.property.address}, ${job.property.city}, ${job.property.state}`,
        propertyImage: job.property.images[0]?.url || null,
        status: job.status,
        markingFee: job.markingFee.toString(),
        paymentStatus: job.paymentStatus,
        contactPerson: {
          name: job.contactPersonName,
          phone: job.contactPersonPhone,
        },
        assignedAgent: job.assignedAgent
          ? {
              id: job.assignedAgent.id,
              name: job.assignedAgent.name,
              email: job.assignedAgent.email,
              phone: job.assignedAgent.phone,
              reliabilityScore: job.assignedAgent.agentReliabilityScore?.toString(),
            }
          : null,
        requestedBy: role === 'agent' ? {
          id: job.requestingUser.id,
          name: job.requestingUser.name,
          email: job.requestingUser.email,
          phone: job.requestingUser.phone,
        } : undefined,
        assignedAt: job.assignedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        timeSlotExpiry: job.timeSlotExpiry?.toISOString(),
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get marking job details
   */
  async getMarkingJobDetails(jobId: string, userId: string) {
    const job = await prisma.propertyMarkingJob.findFirst({
      where: {
        id: jobId,
        OR: [
          { requestedBy: userId },
          { assignedAgentId: userId },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            address: true,
            city: true,
            state: true,
            gpsCoordinates: true,
            boundaryCoordinates: true,
            boundaryVerified: true,
            images: {
              select: {
                id: true,
                url: true,
                altText: true,
                isPrimary: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            agentReliabilityScore: true,
            completedMarkingJobs: true,
            totalMarkingJobs: true,
          },
        },
      },
    });

    if (!job) return null;

    return {
      id: job.id,
      property: {
        id: job.property.id,
        title: job.property.title,
        description: job.property.description,
        address: job.property.address,
        city: job.property.city,
        state: job.property.state,
        gpsCoordinates: job.property.gpsCoordinates,
        boundaryCoordinates: job.property.boundaryCoordinates,
        boundaryVerified: job.property.boundaryVerified,
        images: job.property.images,
      },
      requestedBy: {
        id: job.requestingUser.id,
        name: job.requestingUser.name,
        email: job.requestingUser.email,
        phone: job.requestingUser.phone,
      },
      assignedAgent: job.assignedAgent
        ? {
            id: job.assignedAgent.id,
            name: job.assignedAgent.name,
            email: job.assignedAgent.email,
            phone: job.assignedAgent.phone,
            reliabilityScore: job.assignedAgent.agentReliabilityScore?.toString(),
            completedJobs: job.assignedAgent.completedMarkingJobs,
            totalJobs: job.assignedAgent.totalMarkingJobs,
          }
        : null,
      contactPerson: {
        name: job.contactPersonName,
        phone: job.contactPersonPhone,
      },
      accessInstructions: job.accessInstructions,
      preferredTime: job.preferredTime?.toISOString(),
      urgencyLevel: job.urgencyLevel,
      markingFee: job.markingFee.toString(),
      paymentStatus: job.paymentStatus,
      status: job.status,
      queuePosition: job.queuePosition,
      assignedAt: job.assignedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      timeSlotExpiry: job.timeSlotExpiry?.toISOString(),
      maxCompletionTime: job.maxCompletionTime?.toISOString(),
      completionNotes: job.completionNotes,
      completionImages: job.completionImages,
      boundaryData: job.boundaryData,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  /**
   * Get marking statistics for user
   */
  async getMarkingStatistics(userId: string, role: 'owner' | 'agent') {
    const where: any = {};

    if (role === 'owner') {
      where.requestedBy = userId;
    } else if (role === 'agent') {
      where.assignedAgentId = userId;
    }

    const [
      totalJobs,
      completedJobs,
      activeJobs,
      cancelledJobs,
      totalFees,
      avgCompletionTime,
    ] = await Promise.all([
      prisma.propertyMarkingJob.count({ where }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.COMPLETED },
      }),
      prisma.propertyMarkingJob.count({
        where: {
          ...where,
          status: {
            in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
          },
        },
      }),
      prisma.propertyMarkingJob.count({
        where: { ...where, status: MarkingJobStatus.CANCELLED },
      }),
      prisma.propertyMarkingJob.aggregate({
        where: { ...where, status: MarkingJobStatus.COMPLETED },
        _sum: { markingFee: true },
      }),
      this.calculateAverageCompletionTime(userId, role),
    ]);

    // Calculate earnings for agent
    let earnings = 0;
    if (role === 'agent' && totalFees._sum.markingFee) {
      // Agent gets 25% of marking fee
      earnings = Number(totalFees._sum.markingFee) * 0.25;
    }

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      cancelledJobs,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      totalFees: role === 'owner' ? totalFees._sum.markingFee?.toString() || '0' : undefined,
      totalEarnings: role === 'agent' ? earnings.toFixed(2) : undefined,
      avgCompletionTimeHours: avgCompletionTime,
    };
  }

  /**
   * Calculate average completion time in hours
   */
  private async calculateAverageCompletionTime(userId: string, role: 'owner' | 'agent'): Promise<number> {
    const where: any = {
      status: MarkingJobStatus.COMPLETED,
      completedAt: { not: null },
    };

    if (role === 'owner') {
      where.requestedBy = userId;
    } else if (role === 'agent') {
      where.assignedAgentId = userId;
    }

    const jobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        assignedAt: true,
        completedAt: true,
      },
    });

    if (jobs.length === 0) return 0;

    const totalHours = jobs.reduce((sum, job) => {
      if (job.assignedAt && job.completedAt) {
        const hours = (job.completedAt.getTime() - job.assignedAt.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    return Math.round(totalHours / jobs.length);
  }

  /**
   * Get active marking jobs for agent
   */
  async getActiveMarkingJobs(userId: string) {
    const jobs = await prisma.propertyMarkingJob.findMany({
      where: {
        assignedAgentId: userId,
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS],
        },
      },
      orderBy: { timeSlotExpiry: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            gpsCoordinates: true,
            images: {
              take: 1,
              select: { url: true },
            },
          },
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return jobs.map(job => ({
      id: job.id,
      property: {
        id: job.property.id,
        title: job.property.title,
        address: `${job.property.address}, ${job.property.city}, ${job.property.state}`,
        gpsCoordinates: job.property.gpsCoordinates,
        image: job.property.images[0]?.url || null,
      },
      contactPerson: {
        name: job.contactPersonName,
        phone: job.contactPersonPhone,
      },
      requestingUser: {
        id: job.requestingUser.id,
        name: job.requestingUser.name,
        phone: job.requestingUser.phone,
      },
      accessInstructions: job.accessInstructions,
      preferredTime: job.preferredTime?.toISOString(),
      urgencyLevel: job.urgencyLevel,
      status: job.status,
      timeSlotExpiry: job.timeSlotExpiry?.toISOString(),
      maxCompletionTime: job.maxCompletionTime?.toISOString(),
      assignedAt: job.assignedAt?.toISOString(),
    }));
  }

  /**
   * Get marking job timeline
   */
  async getMarkingJobTimeline(jobId: string, userId: string) {
    const job = await prisma.propertyMarkingJob.findFirst({
      where: {
        id: jobId,
        OR: [
          { requestedBy: userId },
          { assignedAgentId: userId },
        ],
      },
    });

    if (!job) return null;

    const timeline = [
      {
        event: 'Job Created',
        timestamp: job.createdAt.toISOString(),
        status: 'completed',
      },
    ];

    if (job.assignedAt && job.assignedAgentId) {
      timeline.push({
        event: 'Agent Assigned',
        timestamp: job.assignedAt.toISOString(),
        status: 'completed',
      });
    }

    if (job.status === MarkingJobStatus.IN_PROGRESS) {
      timeline.push({
        event: 'Marking In Progress',
        timestamp: new Date().toISOString(),
        status: 'in_progress',
      });
    }

    if (job.completedAt) {
      timeline.push({
        event: 'Job Completed',
        timestamp: job.completedAt.toISOString(),
        status: 'completed',
      });
    }

    if (job.status === MarkingJobStatus.CANCELLED) {
      timeline.push({
        event: 'Job Cancelled',
        timestamp: job.updatedAt.toISOString(),
        status: 'cancelled',
      });
    }

    return timeline;
  }

  /**
   * Get completed marking jobs for agent
   */
  async getCompletedMarkingJobs(
    userId: string,
    filters: Omit<MarkingHistoryFilters, 'status'>
  ) {
    const { page, limit, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      assignedAgentId: userId,
      status: MarkingJobStatus.COMPLETED,
    };

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = dateFrom;
      if (dateTo) where.completedAt.lte = dateTo;
    }

    const [jobs, total] = await Promise.all([
      prisma.propertyMarkingJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { completedAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              images: {
                take: 1,
                select: { url: true },
              },
            },
          },
          requestingUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.propertyMarkingJob.count({ where }),
    ]);

    // Calculate earnings (25% of marking fee)
    const earnings = jobs.map(job => ({
      ...job,
      agentEarning: (Number(job.markingFee) * 0.25).toFixed(2),
    }));

    return {
      jobs: earnings.map(job => ({
        id: job.id,
        propertyTitle: job.property.title,
        propertyAddress: `${job.property.address}, ${job.property.city}, ${job.property.state}`,
        propertyImage: job.property.images[0]?.url || null,
        requestedBy: job.requestingUser.name,
        markingFee: job.markingFee.toString(),
        agentEarning: job.agentEarning,
        completedAt: job.completedAt?.toISOString(),
        completionImages: job.completionImages,
        completionNotes: job.completionNotes,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }
}

export const markingHistoryService = new MarkingHistoryService();