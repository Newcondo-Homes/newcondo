import { Request, Response } from 'express';
import { queueService } from '../services/queueService';
import { ApiResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/utils/logger';

export const queueController = {
  // Get available marking jobs for agents
  async getAvailableJobs(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { city, urgencyLevel, limit = 10, offset = 0 } = req.query;

      const jobs = await queueService.getAvailableJobs({
        agentId,
        city: city as string,
        urgencyLevel: urgencyLevel as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      return ApiResponse.success(res, jobs, 'Available marking jobs retrieved');
    } catch (error) {
      logger.error('Error getting available jobs:', error);
      return ApiResponse.error(res, 'Failed to get available jobs', 500);
    }
  },

  // Get agent's current queue
  async getAgentQueue(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      
      const queue = await queueService.getAgentQueue(agentId);

      return ApiResponse.success(res, queue, 'Agent queue retrieved');
    } catch (error) {
      logger.error('Error getting agent queue:', error);
      return ApiResponse.error(res, 'Failed to get agent queue', 500);
    }
  },

  // Update agent availability for marking jobs
  async updateAgentAvailability(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { isAvailable } = req.body;

      const result = await queueService.updateAgentAvailability(agentId, isAvailable);

      return ApiResponse.success(res, result, 'Agent availability updated');
    } catch (error) {
      logger.error('Error updating agent availability:', error);
      return ApiResponse.error(res, 'Failed to update availability', 500);
    }
  },

  // Update agent service areas
  async updateServiceAreas(req: Request, res: Response) {
    try {
      const agentId = req.user.id;
      const { serviceAreas } = req.body;

      const result = await queueService.updateAgentServiceAreas(agentId, serviceAreas);

      return ApiResponse.success(res, result, 'Service areas updated');
    } catch (error) {
      logger.error('Error updating service areas:', error);
      return ApiResponse.error(res, 'Failed to update service areas', 500);
    }
  },

  // Get queue statistics for agent
  async getQueueStats(req: Request, res: Response) {
    try {
      const agentId = req.user.id;

      const stats = await queueService.getAgentQueueStats(agentId);

      return ApiResponse.success(res, stats, 'Queue statistics retrieved');
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return ApiResponse.error(res, 'Failed to get queue statistics', 500);
    }
  },

  // Get position of a specific job in queue
  async getJobQueuePosition(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const position = await queueService.getJobQueuePosition(jobId, userId);

      return ApiResponse.success(res, { position }, 'Queue position retrieved');
    } catch (error) {
      logger.error('Error getting job queue position:', error);
      return ApiResponse.error(res, 'Failed to get queue position', 500);
    }
  },

  // Admin: Get overall queue overview
  async getQueueOverview(req: Request, res: Response) {
    try {
      const overview = await queueService.getQueueOverview();

      return ApiResponse.success(res, overview, 'Queue overview retrieved');
    } catch (error) {
      logger.error('Error getting queue overview:', error);
      return ApiResponse.error(res, 'Failed to get queue overview', 500);
    }
  },

  // Admin: Prioritize a job in queue
  async prioritizeJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { urgencyLevel, reason } = req.body;
      const adminId = req.user.id;

      const result = await queueService.prioritizeJob(jobId, urgencyLevel, reason, adminId);

      return ApiResponse.success(res, result, 'Job prioritized successfully');
    } catch (error) {
      logger.error('Error prioritizing job:', error);
      return ApiResponse.error(res, 'Failed to prioritize job', 500);
    }
  },

  // Admin: Get active agents
  async getActiveAgents(req: Request, res: Response) {
    try {
      const { city } = req.query;

      const agents = await queueService.getActiveAgents(city as string);

      return ApiResponse.success(res, agents, 'Active agents retrieved');
    } catch (error) {
      logger.error('Error getting active agents:', error);
      return ApiResponse.error(res, 'Failed to get active agents', 500);
    }
  },

  // Admin: Reassign job to different agent
  async reassignJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { newAgentId, reason } = req.body;
      const adminId = req.user.id;

      const result = await queueService.reassignJob(jobId, newAgentId, reason, adminId);

      return ApiResponse.success(res, result, 'Job reassigned successfully');
    } catch (error) {
      logger.error('Error reassigning job:', error);
      return ApiResponse.error(res, 'Failed to reassign job', 500);
    }
  },

  // Admin: Get queue health metrics
  async getQueueHealth(req: Request, res: Response) {
    try {
      const health = await queueService.getQueueHealth();

      return ApiResponse.success(res, health, 'Queue health metrics retrieved');
    } catch (error) {
      logger.error('Error getting queue health:', error);
      return ApiResponse.error(res, 'Failed to get queue health', 500);
    }
  },

  // Admin: Process queue (assign jobs automatically)
  async processQueue(req: Request, res: Response) {
    try {
      const { maxAssignments = 10 } = req.body;
      
      const result = await queueService.processQueueAssignments(maxAssignments);

      return ApiResponse.success(res, result, 'Queue processed successfully');
    } catch (error) {
      logger.error('Error processing queue:', error);
      return ApiResponse.error(res, 'Failed to process queue', 500);
    }
  }
};



// // backend/marking-service/src/controllers/queueController.ts

// import { Request, Response } from 'express';
// import { PrismaClient, MarkingJobStatus } from '@newcondo/db';
// import { z } from 'zod';

// const prisma = new PrismaClient();

// // Validation schemas
// const joinQueueSchema = z.object({
//   markingJobId: z.string().cuid(),
// });

// const leaveQueueSchema = z.object({
//   markingJobId: z.string().cuid(),
// });

// /**
//  * Get queue position for an agent in a specific marking job
//  * GET /api/marking/queue/:jobId/position
//  */
// export const getQueuePosition = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const agentId = req.user?.id;

//     if (!agentId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized - Agent ID not found',
//       });
//     }

//     // Check if agent is in queue for this job
//     const job = await prisma.propertyMarkingJob.findFirst({
//       where: {
//         id: jobId,
//         assignedAgentId: agentId,
//         status: MarkingJobStatus.QUEUED,
//       },
//       select: {
//         id: true,
//         queuePosition: true,
//         maxCompletionTime: true,
//         timeSlotExpiry: true,
//         status: true,
//       },
//     });

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: 'Job not found or agent not in queue',
//       });
//     }

//     // Get total agents in queue
//     const totalInQueue = await prisma.propertyMarkingJob.count({
//       where: {
//         id: jobId,
//         status: MarkingJobStatus.QUEUED,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: {
//         jobId: job.id,
//         queuePosition: job.queuePosition,
//         totalInQueue,
//         maxCompletionTime: job.maxCompletionTime,
//         timeSlotExpiry: job.timeSlotExpiry,
//         status: job.status,
//       },
//     });
//   } catch (error) {
//     console.error('Get queue position error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to get queue position',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// /**
//  * Join marking job queue (agent accepts job)
//  * POST /api/marking/queue/join
//  */
// export const joinQueue = async (req: Request, res: Response) => {
//   try {
//     const agentId = req.user?.id;

//     if (!agentId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized - Agent ID not found',
//       });
//     }

//     const validatedData = joinQueueSchema.parse(req.body);
//     const { markingJobId } = validatedData;

//     // Verify agent eligibility
//     const agent = await prisma.user.findUnique({
//       where: { id: agentId },
//       select: {
//         id: true,
//         role: true,
//         isPremium: true,
//         isAvailableForMarking: true,
//         agentServiceAreas: true,
//         verificationStatus: true,
//       },
//     });

//     if (!agent) {
//       return res.status(404).json({
//         success: false,
//         message: 'Agent not found',
//       });
//     }

//     // Check if agent is eligible
//     if (agent.verificationStatus !== 'VERIFIED') {
//       return res.status(403).json({
//         success: false,
//         message: 'Agent must be verified to accept marking jobs',
//       });
//     }

//     if (!agent.isAvailableForMarking && agent.role === 'AGENT') {
//       return res.status(403).json({
//         success: false,
//         message: 'Agent is not available for marking jobs',
//       });
//     }

//     // Check if renter has premium
//     if (agent.role === 'RENTER' && !agent.isPremium) {
//       return res.status(403).json({
//         success: false,
//         message: 'Renters must have premium subscription to accept marking jobs',
//       });
//     }

//     // Get the marking job
//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         property: {
//           select: {
//             city: true,
//             state: true,
//           },
//         },
//       },
//     });

//     if (!markingJob) {
//       return res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//     }

//     // Check if job is still available
//     if (markingJob.status !== MarkingJobStatus.QUEUED) {
//       return res.status(400).json({
//         success: false,
//         message: 'Marking job is no longer available',
//       });
//     }

//     // Check if agent already in queue for this job
//     const existingQueueEntry = await prisma.propertyMarkingJob.findFirst({
//       where: {
//         id: markingJobId,
//         assignedAgentId: agentId,
//       },
//     });

//     if (existingQueueEntry) {
//       return res.status(400).json({
//         success: false,
//         message: 'Agent already in queue for this job',
//       });
//     }

//     // Check if property is in agent's service area
//     const propertyLocation = `${markingJob.property.city}, ${markingJob.property.state}`;
//     const isInServiceArea = agent.agentServiceAreas.some(
//       (area) =>
//         area.toLowerCase().includes(markingJob.property.city.toLowerCase()) ||
//         area.toLowerCase().includes(markingJob.property.state.toLowerCase())
//     );

//     if (!isInServiceArea) {
//       return res.status(403).json({
//         success: false,
//         message: 'Property is outside agent service area',
//       });
//     }

//     // Get current queue count
//     const currentQueueCount = await prisma.propertyMarkingJob.count({
//       where: {
//         id: markingJobId,
//         status: MarkingJobStatus.QUEUED,
//       },
//     });

//     // Calculate time slot expiry (3 hours from now)
//     const timeSlotExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);

//     // Add agent to queue
//     const updatedJob = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         assignedAgentId: agentId,
//         queuePosition: currentQueueCount + 1,
//         timeSlotExpiry,
//         status: currentQueueCount === 0 ? MarkingJobStatus.ASSIGNED : MarkingJobStatus.QUEUED,
//         assignedAt: currentQueueCount === 0 ? new Date() : undefined,
//       },
//       include: {
//         property: {
//           select: {
//             id: true,
//             title: true,
//             address: true,
//             city: true,
//             state: true,
//           },
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             phone: true,
//             email: true,
//           },
//         },
//       },
//     });

//     // Log event
//     await prisma.eventLog.create({
//       data: {
//         userId: agentId,
//         type: 'MARKING_JOB_QUEUE_JOINED',
//         metadata: {
//           markingJobId,
//           queuePosition: currentQueueCount + 1,
//           timeSlotExpiry,
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: currentQueueCount === 0 
//         ? 'Job assigned successfully - You are first in queue' 
//         : 'Successfully joined queue',
//       data: {
//         jobId: updatedJob.id,
//         queuePosition: updatedJob.queuePosition,
//         timeSlotExpiry: updatedJob.timeSlotExpiry,
//         status: updatedJob.status,
//         property: updatedJob.property,
//         contactPerson: {
//           name: updatedJob.contactPersonName,
//           phone: updatedJob.contactPersonPhone,
//         },
//         accessInstructions: updatedJob.accessInstructions,
//         markingFee: updatedJob.markingFee,
//       },
//     });
//   } catch (error) {
//     console.error('Join queue error:', error);
    
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: error.errors,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Failed to join queue',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// /**
//  * Leave marking job queue
//  * POST /api/marking/queue/leave
//  */
// export const leaveQueue = async (req: Request, res: Response) => {
//   try {
//     const agentId = req.user?.id;

//     if (!agentId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized - Agent ID not found',
//       });
//     }

//     const validatedData = leaveQueueSchema.parse(req.body);
//     const { markingJobId } = validatedData;

//     // Check if agent is in queue
//     const queueEntry = await prisma.propertyMarkingJob.findFirst({
//       where: {
//         id: markingJobId,
//         assignedAgentId: agentId,
//         status: {
//           in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED],
//         },
//       },
//     });

//     if (!queueEntry) {
//       return res.status(404).json({
//         success: false,
//         message: 'Agent not found in queue for this job',
//       });
//     }

//     const wasAssigned = queueEntry.status === MarkingJobStatus.ASSIGNED;

//     // Remove agent from queue
//     await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         assignedAgentId: null,
//         queuePosition: null,
//         timeSlotExpiry: null,
//         status: MarkingJobStatus.QUEUED,
//         assignedAt: null,
//       },
//     });

//     // If agent was assigned, promote next agent in queue
//     if (wasAssigned) {
//       const nextAgent = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           id: markingJobId,
//           status: MarkingJobStatus.QUEUED,
//           queuePosition: { gt: 0 },
//         },
//         orderBy: {
//           queuePosition: 'asc',
//         },
//       });

//       if (nextAgent) {
//         const newTimeSlotExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);
        
//         await prisma.propertyMarkingJob.update({
//           where: { id: nextAgent.id },
//           data: {
//             status: MarkingJobStatus.ASSIGNED,
//             assignedAt: new Date(),
//             timeSlotExpiry: newTimeSlotExpiry,
//           },
//         });

//         // Notify next agent
//         // TODO: Implement notification service
//       }
//     }

//     // Reorder queue positions
//     const remainingAgents = await prisma.propertyMarkingJob.findMany({
//       where: {
//         id: markingJobId,
//         status: MarkingJobStatus.QUEUED,
//       },
//       orderBy: {
//         queuePosition: 'asc',
//       },
//     });

//     for (let i = 0; i < remainingAgents.length; i++) {
//       await prisma.propertyMarkingJob.update({
//         where: { id: remainingAgents[i].id },
//         data: { queuePosition: i + 1 },
//       });
//     }

//     // Log event
//     await prisma.eventLog.create({
//       data: {
//         userId: agentId,
//         type: 'MARKING_JOB_QUEUE_LEFT',
//         metadata: {
//           markingJobId,
//           wasAssigned,
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Successfully left queue',
//     });
//   } catch (error) {
//     console.error('Leave queue error:', error);
    
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: error.errors,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Failed to leave queue',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// /**
//  * Get all agents in queue for a job (for admin/property owner)
//  * GET /api/marking/queue/:jobId/agents
//  */
// export const getQueueAgents = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized',
//       });
//     }

//     // Verify user has access to this job
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       select: {
//         requestedBy: true,
//       },
//     });

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: 'Marking job not found',
//       });
//     }

//     // Check if user is property owner or admin
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true },
//     });

//     if (job.requestedBy !== userId && user?.role !== 'ADMIN') {
//       return res.status(403).json({
//         success: false,
//         message: 'Unauthorized to view queue',
//       });
//     }

//     // Get all agents in queue
//     const queuedAgents = await prisma.propertyMarkingJob.findMany({
//       where: {
//         id: jobId,
//         status: {
//           in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED],
//         },
//       },
//       orderBy: {
//         queuePosition: 'asc',
//       },
//       include: {
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             agentReliabilityScore: true,
//             totalMarkingJobs: true,
//             completedMarkingJobs: true,
//             agentServiceAreas: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalAgents: queuedAgents.length,
//         agents: queuedAgents.map((entry) => ({
//           agentId: entry.assignedAgent?.id,
//           agentName: entry.assignedAgent?.name,
//           queuePosition: entry.queuePosition,
//           status: entry.status,
//           timeSlotExpiry: entry.timeSlotExpiry,
//           assignedAt: entry.assignedAt,
//           reliabilityScore: entry.assignedAgent?.agentReliabilityScore,
//           completedJobs: entry.assignedAgent?.completedMarkingJobs,
//           totalJobs: entry.assignedAgent?.totalMarkingJobs,
//         })),
//       },
//     });
//   } catch (error) {
//     console.error('Get queue agents error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to get queue agents',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };

// /**
//  * Check for expired time slots and promote next agent
//  * CRON JOB - Should be called periodically
//  * POST /api/marking/queue/check-expired
//  */
// export const checkExpiredTimeSlots = async (req: Request, res: Response) => {
//   try {
//     const now = new Date();

//     // Find all assigned jobs with expired time slots
//     const expiredJobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: MarkingJobStatus.ASSIGNED,
//         timeSlotExpiry: {
//           lte: now,
//         },
//       },
//       include: {
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });

//     const processedJobs = [];

//     for (const job of expiredJobs) {
//       // Move job back to queue
//       await prisma.propertyMarkingJob.update({
//         where: { id: job.id },
//         data: {
//           assignedAgentId: null,
//           status: MarkingJobStatus.QUEUED,
//           timeSlotExpiry: null,
//           assignedAt: null,
//         },
//       });

//       // Log timeout
//       await prisma.eventLog.create({
//         data: {
//           userId: job.assignedAgent?.id,
//           type: 'MARKING_JOB_TIMEOUT',
//           metadata: {
//             markingJobId: job.id,
//             agentId: job.assignedAgent?.id,
//           },
//         },
//       });

//       // Find next agent in queue
//       const nextAgent = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           id: job.id,
//           status: MarkingJobStatus.QUEUED,
//         },
//         orderBy: {
//           queuePosition: 'asc',
//         },
//       });

//       if (nextAgent) {
//         const newTimeSlotExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);
        
//         await prisma.propertyMarkingJob.update({
//           where: { id: nextAgent.id },
//           data: {
//             status: MarkingJobStatus.ASSIGNED,
//             assignedAt: new Date(),
//             timeSlotExpiry: newTimeSlotExpiry,
//           },
//         });

//         // TODO: Notify next agent
//       }

//       processedJobs.push({
//         jobId: job.id,
//         expiredAgent: job.assignedAgent?.name,
//         nextAgentPromoted: !!nextAgent,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Processed ${expiredJobs.length} expired time slots`,
//       data: processedJobs,
//     });
//   } catch (error) {
//     console.error('Check expired time slots error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to check expired time slots',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };