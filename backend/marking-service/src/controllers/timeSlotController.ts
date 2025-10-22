// backend/marking-service/src/controllers/timeSlotController.ts

import { Request, Response } from 'express';
import { PrismaClient, MarkingJobStatus } from '@prisma/client';
import { standardResponse } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

/**
 * Get time slot information for a marking job
 * GET /api/time-slots/:jobId
 */
export const getTimeSlotInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        assignedAgentId: true,
        assignedAt: true,
        timeSlotExpiry: true,
        maxCompletionTime: true,
        completedAt: true,
        requestedBy: true
      }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAuthorized =
      user?.role === 'ADMIN' ||
      job.assignedAgentId === userId ||
      job.requestedBy === userId;

    if (!isAuthorized) {
      return res.status(403).json(
        standardResponse(false, 'You are not authorized to view this time slot information', null)
      );
    }

    const now = new Date();
    let timeSlotInfo: any = {
      status: job.status,
      isAssigned: !!job.assignedAgentId,
      assignedAt: job.assignedAt
    };

    // Calculate time slot expiry info (3-hour window)
    if (job.timeSlotExpiry) {
      const timeRemaining = Math.max(0, job.timeSlotExpiry.getTime() - now.getTime());
      const timeElapsed = job.assignedAt
        ? now.getTime() - job.assignedAt.getTime()
        : 0;

      timeSlotInfo = {
        ...timeSlotInfo,
        timeSlotExpiry: job.timeSlotExpiry,
        timeRemainingMs: timeRemaining,
        timeRemainingMinutes: (timeRemaining / (1000 * 60)).toFixed(0),
        timeRemainingHours: (timeRemaining / (1000 * 60 * 60)).toFixed(2),
        timeElapsedMs: timeElapsed,
        timeElapsedMinutes: (timeElapsed / (1000 * 60)).toFixed(0),
        timeElapsedHours: (timeElapsed / (1000 * 60 * 60)).toFixed(2),
        hasExpired: timeRemaining === 0,
        isExpiringSoon: timeRemaining < 30 * 60 * 1000, // Less than 30 minutes
        progressPercentage: job.assignedAt
          ? Math.min(100, (timeElapsed / (3 * 60 * 60 * 1000)) * 100).toFixed(2)
          : 0
      };
    }

    // Calculate max completion time info (3-day window)
    if (job.maxCompletionTime) {
      const maxTimeRemaining = Math.max(0, job.maxCompletionTime.getTime() - now.getTime());
      
      timeSlotInfo.maxCompletionInfo = {
        maxCompletionTime: job.maxCompletionTime,
        maxTimeRemainingMs: maxTimeRemaining,
        maxTimeRemainingDays: (maxTimeRemaining / (1000 * 60 * 60 * 24)).toFixed(2),
        maxTimeRemainingHours: (maxTimeRemaining / (1000 * 60 * 60)).toFixed(2),
        hasMaxTimeExpired: maxTimeRemaining === 0,
        isMaxTimeExpiringSoon: maxTimeRemaining < 24 * 60 * 60 * 1000 // Less than 1 day
      };
    }

    return res.status(200).json(
      standardResponse(true, 'Time slot information retrieved successfully', timeSlotInfo)
    );
  } catch (error) {
    console.error('Get time slot info error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve time slot information', null)
    );
  }
};

/**
 * Extend time slot for a marking job (agent request)
 * POST /api/time-slots/:jobId/extend
 */
export const extendTimeSlot = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    const { reason, extensionHours = 1 } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    if (!reason) {
      return res.status(400).json(
        standardResponse(false, 'Extension reason is required', null)
      );
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Verify agent is assigned to this job
    if (job.assignedAgentId !== userId) {
      return res.status(403).json(
        standardResponse(false, 'You are not assigned to this marking job', null)
      );
    }

    // Can only extend if ASSIGNED or IN_PROGRESS
    if (![MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS].includes(job.status)) {
      return res.status(400).json(
        standardResponse(false, 'Cannot extend time slot for job in current status', null)
      );
    }

    // Check if already expired
    if (job.timeSlotExpiry && new Date() > job.timeSlotExpiry) {
      return res.status(400).json(
        standardResponse(false, 'Time slot has already expired', null)
      );
    }

    // Limit extensions (maximum 2 extensions per job)
    const extensionCount = (job.completionNotes?.match(/Time slot extended/g) || []).length;
    if (extensionCount >= 2) {
      return res.status(400).json(
        standardResponse(false, 'Maximum number of extensions (2) reached', null)
      );
    }

    // Extend time slot
    const currentExpiry = job.timeSlotExpiry || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setHours(newExpiry.getHours() + Number(extensionHours));

    const updatedJob = await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        timeSlotExpiry: newExpiry,
        completionNotes: `${job.completionNotes || ''}\nTime slot extended by ${extensionHours} hour(s): ${reason}`
      },
      select: {
        id: true,
        timeSlotExpiry: true,
        completionNotes: true
      }
    });

    // TODO: Send notification to property owner about extension

    return res.status(200).json(
      standardResponse(true, 'Time slot extended successfully', {
        ...updatedJob,
        extensionHours,
        extensionsUsed: extensionCount + 1,
        extensionsRemaining: 1 - extensionCount
      })
    );
  } catch (error) {
    console.error('Extend time slot error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to extend time slot', null)
    );
  }
};

/**
 * Get all expiring time slots (for monitoring/alerts)
 * GET /api/time-slots/expiring
 */
export const getExpiringTimeSlots = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const { hoursThreshold = 1 } = req.query;

    // Calculate threshold time
    const now = new Date();
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() + Number(hoursThreshold));

    // Check if user is admin or agent
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let where: any = {
      status: {
        in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
      },
      timeSlotExpiry: {
        gte: now,
        lte: thresholdTime
      }
    };

    // Non-admin users only see their own assignments
    if (user?.role !== 'ADMIN') {
      where.assignedAgentId = userId;
    }

    const expiringJobs = await prisma.propertyMarkingJob.findMany({
      where,
      orderBy: { timeSlotExpiry: 'asc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Add time remaining info
    const jobsWithTimeInfo = expiringJobs.map(job => {
      const timeRemaining = job.timeSlotExpiry
        ? Math.max(0, job.timeSlotExpiry.getTime() - now.getTime())
        : 0;

      return {
        ...job,
        timeRemaining: {
          ms: timeRemaining,
          minutes: (timeRemaining / (1000 * 60)).toFixed(0),
          hours: (timeRemaining / (1000 * 60 * 60)).toFixed(2)
        },
        urgency: timeRemaining < 30 * 60 * 1000 ? 'CRITICAL' : 'WARNING'
      };
    });

    return res.status(200).json(
      standardResponse(true, 'Expiring time slots retrieved successfully', {
        jobs: jobsWithTimeInfo,
        count: jobsWithTimeInfo.length,
        hoursThreshold: Number(hoursThreshold)
      })
    );
  } catch (error) {
    console.error('Get expiring time slots error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve expiring time slots', null)
    );
  }
};

/**
 * Check and process expired time slots (Cron job endpoint)
 * POST /api/time-slots/process-expired
 */
export const processExpiredTimeSlots = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Find all expired time slots
    const expiredJobs = await prisma.propertyMarkingJob.findMany({
      where: {
        status: {
          in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
        },
        timeSlotExpiry: {
          lte: now
        }
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (expiredJobs.length === 0) {
      return res.status(200).json(
        standardResponse(true, 'No expired time slots found', { processedCount: 0 })
      );
    }

    const results = await Promise.all(
      expiredJobs.map(async (job) => {
        try {
          await prisma.$transaction(async (tx) => {
            // Reset job to QUEUED
            await tx.propertyMarkingJob.update({
              where: { id: job.id },
              data: {
                status: MarkingJobStatus.QUEUED,
                assignedAgentId: null,
                assignedAt: null,
                timeSlotExpiry: null,
                completionNotes: `${job.completionNotes || ''}\nTime slot expired - returned to queue`
              }
            });

            // Penalize agent reliability score
            if (job.assignedAgentId) {
              await tx.user.update({
                where: { id: job.assignedAgentId },
                data: {
                  agentReliabilityScore: {
                    decrement: 0.15
                  },
                  totalMarkingJobs: {
                    decrement: 1
                  }
                }
              });
            }
          });

          // TODO: Send notification to agent about expiration
          // TODO: Send notification to property owner about reassignment
          // TODO: Broadcast job availability to other agents

          return { jobId: job.id, status: 'processed' };
        } catch (error) {
          console.error(`Failed to process expired job ${job.id}:`, error);
          return { jobId: job.id, status: 'failed', error };
        }
      })
    );

    const processedCount = results.filter(r => r.status === 'processed').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return res.status(200).json(
      standardResponse(true, 'Expired time slots processed', {
        processedCount,
        failedCount,
        details: results
      })
    );
  } catch (error) {
    console.error('Process expired time slots error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to process expired time slots', null)
    );
  }
};

/**
 * Get time slot statistics
 * GET /api/time-slots/stats
 */
export const getTimeSlotStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    let where: any = {
      status: {
        in: [MarkingJobStatus.ASSIGNED, MarkingJobStatus.IN_PROGRESS]
      },
      timeSlotExpiry: { not: null }
    };

    // Non-admin users see only their stats
    if (user?.role !== 'ADMIN') {
      where.assignedAgentId = userId;
    }

    const activeJobs = await prisma.propertyMarkingJob.findMany({
      where,
      select: {
        id: true,
        assignedAt: true,
        timeSlotExpiry: true,
        status: true
      }
    });

    // Calculate statistics
    let totalActive = activeJobs.length;
    let expiringSoon = 0; // < 1 hour
    let onTrack = 0; // 1-2 hours
    let safe = 0; // > 2 hours
    let totalTimeRemaining = 0;

    activeJobs.forEach(job => {
      if (job.timeSlotExpiry) {
        const timeRemaining = Math.max(0, job.timeSlotExpiry.getTime() - now.getTime());
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);

        totalTimeRemaining += timeRemaining;

        if (hoursRemaining < 1) {
          expiringSoon++;
        } else if (hoursRemaining < 2) {
          onTrack++;
        } else {
          safe++;
        }
      }
    });

    const avgTimeRemaining = totalActive > 0 ? totalTimeRemaining / totalActive : 0;

    const stats = {
      activeTimeSlots: {
        total: totalActive,
        expiringSoon, // < 1 hour
        onTrack, // 1-2 hours
        safe // > 2 hours
      },
      averageTimeRemaining: {
        ms: avgTimeRemaining,
        hours: (avgTimeRemaining / (1000 * 60 * 60)).toFixed(2),
        minutes: (avgTimeRemaining / (1000 * 60)).toFixed(0)
      }
    };

    return res.status(200).json(
      standardResponse(true, 'Time slot statistics retrieved successfully', stats)
    );
  } catch (error) {
    console.error('Get time slot stats error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve time slot statistics', null)
    );
  }
};