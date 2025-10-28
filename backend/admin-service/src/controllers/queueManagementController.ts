// backend/admin-service/src/controllers/queueManagementController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class QueueManagementController {
  // Get current queue status
  async getQueueStatus(req: Request, res: Response) {
    try {
      const { propertyId } = req.query;

      const where: any = {
        status: 'QUEUED'
      };

      if (propertyId) {
        where.propertyId = propertyId;
      }

      const queuedJobs = await prisma.propertyMarkingJob.findMany({
        where,
        orderBy: {
          queuePosition: 'asc'
        },
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
          requestingUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Get assigned jobs (currently being worked on)
      const assignedJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: 'ASSIGNED',
          timeSlotExpiry: { gte: new Date() }
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Get expired time slots
      const expiredSlots = await prisma.propertyMarkingJob.findMany({
        where: {
          status: 'ASSIGNED',
          timeSlotExpiry: { lt: new Date() }
        },
        include: {
          property: {
            select: {
              id: true,
              title: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return successResponse(res, {
        queue: {
          total: queuedJobs.length,
          jobs: queuedJobs
        },
        assigned: {
          total: assignedJobs.length,
          jobs: assignedJobs
        },
        expired: {
          total: expiredSlots.length,
          jobs: expiredSlots
        }
      }, 'Queue status retrieved successfully');
    } catch (error) {
      console.error('Get queue status error:', error);
      return errorResponse(res, 'Failed to retrieve queue status', 500);
    }
  }

  // Manually reorder queue
  async reorderQueue(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { newPosition } = req.body;

      if (!newPosition || newPosition < 1) {
        return errorResponse(res, 'Valid position is required', 400);
      }

      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }

      if (job.status !== 'QUEUED') {
        return errorResponse(res, 'Only queued jobs can be reordered', 400);
      }

      const oldPosition = job.queuePosition;

      // Update positions
      if (newPosition > oldPosition!) {
        // Moving down - shift up jobs between old and new position
        await prisma.propertyMarkingJob.updateMany({
          where: {
            status: 'QUEUED',
            queuePosition: {
              gt: oldPosition!,
              lte: newPosition
            }
          },
          data: {
            queuePosition: {
              decrement: 1
            }
          }
        });
      } else {
        // Moving up - shift down jobs between new and old position
        await prisma.propertyMarkingJob.updateMany({
          where: {
            status: 'QUEUED',
            queuePosition: {
              gte: newPosition,
              lt: oldPosition!
            }
          },
          data: {
            queuePosition: {
              increment: 1
            }
          }
        });
      }

      // Update target job
      const updatedJob = await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          queuePosition: newPosition
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyMarkingJob',
        jobId,
        `Reordered queue position from ${oldPosition} to ${newPosition}`,
        { oldPosition, newPosition }
      );

      return successResponse(res, updatedJob, 'Queue reordered successfully');
    } catch (error) {
      console.error('Reorder queue error:', error);
      return errorResponse(res, 'Failed to reorder queue', 500);
    }
  }

  // Force expire time slot
  async forceExpireTimeSlot(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { jobId } = req.params;
      const { reason } = req.body;

      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: jobId },
        include: {
          assignedAgent: true,
          property: true
        }
      });

      if (!job) {
        return errorResponse(res, 'Job not found', 404);
      }

      if (job.status !== 'ASSIGNED') {
        return errorResponse(res, 'Only assigned jobs can be expired', 400);
      }

      // Expire the time slot
      const updatedJob = await prisma.propertyMarkingJob.update({
        where: { id: jobId },
        data: {
          status: 'QUEUED',
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
          completionNotes: `Admin forced expiration: ${reason || 'No reason provided'}`
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyMarkingJob',
        jobId,
        `Force expired time slot for job: ${job.property.title}`,
        { reason, agentId: job.assignedAgentId }
      );

      // TODO: Notify agent and reassign to next in queue

      return successResponse(res, updatedJob, 'Time slot expired successfully');
    } catch (error) {
      console.error('Force expire time slot error:', error);
      return errorResponse(res, 'Failed to expire time slot', 500);
    }
  }

  // Process expired time slots (cleanup)
  async processExpiredSlots(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      // Find all expired slots
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: 'ASSIGNED',
          timeSlotExpiry: { lt: new Date() }
        },
        include: {
          assignedAgent: true
        }
      });

      if (expiredJobs.length === 0) {
        return successResponse(res, {
          processed: 0,
          jobs: []
        }, 'No expired slots to process');
      }

      // Reset all expired jobs to queued
      const results = await Promise.all(
        expiredJobs.map(async (job) => {
          return prisma.propertyMarkingJob.update({
            where: { id: job.id },
            data: {
              status: 'QUEUED',
              assignedAgentId: null,
              assignedAt: null,
              timeSlotExpiry: null
            }
          });
        })
      );

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyMarkingJob',
        'bulk',
        `Processed ${expiredJobs.length} expired time slots`,
        { jobIds: expiredJobs.map(j => j.id) }
      );

      return successResponse(res, {
        processed: results.length,
        jobs: results
      }, `Processed ${results.length} expired time slots successfully`);
    } catch (error) {
      console.error('Process expired slots error:', error);
      return errorResponse(res, 'Failed to process expired slots', 500);
    }
  }

  // Clear entire queue (emergency)
  async clearQueue(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { reason, refundPayments } = req.body;

      if (!reason) {
        return errorResponse(res, 'Reason is required for clearing queue', 400);
      }

      // Get all queued jobs
      const queuedJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: 'QUEUED'
        }
      });

      // Cancel all queued jobs
      await prisma.propertyMarkingJob.updateMany({
        where: {
          status: 'QUEUED'
        },
        data: {
          status: 'CANCELLED',
          completionNotes: `Admin cleared queue: ${reason}`
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'BOUNDARY_DISPUTE_RESOLVED',
        'PropertyMarkingJob',
        'bulk',
        `Cleared queue: ${queuedJobs.length} jobs cancelled`,
        { reason, refundPayments, jobIds: queuedJobs.map(j => j.id) }
      );

      // TODO: Process refunds if requested

      return successResponse(res, {
        cancelled: queuedJobs.length,
        jobs: queuedJobs
      }, `Queue cleared successfully - ${queuedJobs.length} jobs cancelled`);
    } catch (error) {
      console.error('Clear queue error:', error);
      return errorResponse(res, 'Failed to clear queue', 500);
    }
  }

  // Get queue statistics
  async getQueueStatistics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        currentQueueLength,
        averageQueueTime,
        timeSlotUtilization,
        expiredSlotsCount
      ] = await Promise.all([
        prisma.propertyMarkingJob.count({
          where: { status: 'QUEUED' }
        }),
        // Calculate average queue time
        prisma.propertyMarkingJob.findMany({
          where: {
            status: { in: ['ASSIGNED', 'COMPLETED'] },
            assignedAt: { not: null },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true,
            assignedAt: true
          }
        }).then(jobs => {
          if (jobs.length === 0) return 0;
          const totalTime = jobs.reduce((sum, job) => {
            const time = job.assignedAt!.getTime() - job.createdAt.getTime();
            return sum + time;
          }, 0);
          return totalTime / jobs.length / (1000 * 60 * 60); // Hours
        }),
        // Calculate time slot utilization (completed vs expired)
        prisma.propertyMarkingJob.count({
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }).then(completed =>
          prisma.propertyMarkingJob.count({
            where: {
              status: 'EXPIRED',
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }).then(expired => ({
            completed,
            expired,
            total: completed + expired,
            utilizationRate: (completed + expired) > 0 ? (completed / (completed + expired)) * 100 : 0
          }))
        ),
        prisma.propertyMarkingJob.count({
          where: {
            status: 'ASSIGNED',
            timeSlotExpiry: { lt: new Date() }
          }
        })
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          currentQueueLength,
          averageQueueTime,
          timeSlotUtilization,
          expiredSlotsCount
        }
      }, 'Queue statistics retrieved successfully');
    } catch (error) {
      console.error('Get queue statistics error:', error);
      return errorResponse(res, 'Failed to retrieve queue statistics', 500);
    }
  }

  // Get agent queue performance
  async getAgentQueuePerformance(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get agent performance metrics
      const agentPerformance = await prisma.user.findMany({
        where: {
          isAvailableForMarking: true,
          assignedMarkingJobs: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          agentReliabilityScore: true,
          totalMarkingJobs: true,
          completedMarkingJobs: true,
          assignedMarkingJobs: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            },
            select: {
              status: true,
              createdAt: true,
              assignedAt: true,
              completedAt: true,
              timeSlotExpiry: true
            }
          }
        }
      });

      // Calculate metrics for each agent
      const agentMetrics = agentPerformance.map(agent => {
        const jobs = agent.assignedMarkingJobs;
        const completed = jobs.filter(j => j.status === 'COMPLETED').length;
        const expired = jobs.filter(j => 
          j.status === 'ASSIGNED' && j.timeSlotExpiry && j.timeSlotExpiry < new Date()
        ).length;
        const avgCompletionTime = jobs
          .filter(j => j.completedAt && j.assignedAt)
          .reduce((sum, j) => {
            const time = j.completedAt!.getTime() - j.assignedAt!.getTime();
            return sum + time;
          }, 0) / (completed || 1) / (1000 * 60 * 60); // Hours

        return {
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            reliabilityScore: agent.agentReliabilityScore
          },
          metrics: {
            totalJobs: jobs.length,
            completed,
            expired,
            completionRate: jobs.length > 0 ? (completed / jobs.length) * 100 : 0,
            avgCompletionTime
          }
        };
      });

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        agentPerformance: agentMetrics.sort((a, b) => 
          b.metrics.completionRate - a.metrics.completionRate
        )
      }, 'Agent queue performance retrieved successfully');
    } catch (error) {
      console.error('Get agent queue performance error:', error);
      return errorResponse(res, 'Failed to retrieve agent queue performance', 500);
    }
  }
}

export const queueManagementController = new QueueManagementController();