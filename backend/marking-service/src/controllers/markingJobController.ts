// backend/marking-service/src/controllers/markingJobController.ts

import { Request, Response } from 'express';
import { MarkingJobService } from '../services/markingJobService';
import { QueueService } from '../services/queueService';
import { AssignmentService } from '../services/assignmentService';
import { NotificationService } from '../services/notificationService';

const markingJobService = new MarkingJobService();
const queueService = new QueueService();
const assignmentService = new AssignmentService();
const notificationService = new NotificationService();

export class MarkingJobController {
  async createMarkingJob(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const markingJobData = {
        ...req.body,
        requestedBy: userId,
      };

      const job = await markingJobService.createMarkingJob(markingJobData);
      
      // Add to queue
      await queueService.addToQueue(job.id);
      
      // Try to assign to available agent
      await assignmentService.tryAutoAssign(job.id);

      res.status(201).json({
        success: true,
        data: job,
        message: 'Marking job created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create marking job',
        error: error.message,
      });
    }
  }

  async getMarkingJobs(req: Request, res: Response) {
    try {
      const { status, agentId } = req.query;
      let jobs;

      if (agentId) {
        jobs = await markingJobService.getJobsForAgent(agentId as string);
      } else if (status) {
        jobs = await markingJobService.getJobsByStatus(status as any);
      } else {
        jobs = await markingJobService.getJobsByUser(req.user.id);
      }

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch marking jobs',
        error: error.message,
      });
    }
  }

  async assignAgent(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { agentId } = req.body;

      const job = await markingJobService.assignAgentToJob(jobId, agentId);
      
      // Send notification to agent
      await notificationService.notifyAgentAssignment(job);

      res.json({
        success: true,
        data: job,
        message: 'Agent assigned successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign agent',
        error: error.message,
      });
    }
  }

  async startJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await markingJobService.startJob(jobId);

      res.json({
        success: true,
        data: job,
        message: 'Job started successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start job',
        error: error.message,
      });
    }
  }

  async completeJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const completionData = req.body;

      const job = await markingJobService.completeJob(jobId, completionData);
      
      // Send completion notification
      await notificationService.notifyJobCompletion(job);

      res.json({
        success: true,
        data: job,
        message: 'Job completed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete job',
        error: error.message,
      });
    }
  }

  async cancelJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = await markingJobService.cancelJob(jobId);

      res.json({
        success: true,
        data: job,
        message: 'Job cancelled successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel job',
        error: error.message,
      });
    }
  }

  async getAvailableAgents(req: Request, res: Response) {
    try {
      const { serviceArea } = req.query;
      const agents = await markingJobService.getAvailableAgents(serviceArea as string);

      res.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available agents',
        error: error.message,
      });
    }
  }
}




// // backend/marking-service/src/controllers/markingJobController.ts

// import { Request, Response, NextFunction } from 'express';
// import { PrismaClient, MarkingJobStatus, UrgencyLevel, PaymentStatus } from '@prisma/client';
// import { z } from 'zod';

// const prisma = new PrismaClient();

// // Validation schemas
// const createMarkingJobSchema = z.object({
//   propertyId: z.string().cuid(),
//   contactPersonName: z.string().min(2).max(100),
//   contactPersonPhone: z.string().regex(/^(\+234|0)[789]\d{9}$/),
//   accessInstructions: z.string().max(500).optional(),
//   preferredTime: z.string().datetime().optional(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
//   markingChoice: z.enum(['SELF', 'NEWCONDO', 'SOMEONE_I_KNOW', 'ASSIGN_TO_AGENTS']),
// });

// const updateMarkingJobSchema = z.object({
//   contactPersonName: z.string().min(2).max(100).optional(),
//   contactPersonPhone: z.string().regex(/^(\+234|0)[789]\d{9}$/).optional(),
//   accessInstructions: z.string().max(500).optional(),
//   preferredTime: z.string().datetime().optional(),
//   urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
// });

// export class MarkingJobController {
//   /**
//    * Create a new marking job
//    * POST /api/marking-jobs
//    */
//   static async createMarkingJob(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       // Validate request body
//       const validatedData = createMarkingJobSchema.parse(req.body);

//       // Verify user is property owner or authorized agent
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: { 
//           role: true, 
//           verificationStatus: true,
//           isB2BCustomer: true,
//         },
//       });

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found',
//         });
//       }

//       // Check if user can request marking jobs
//       if (!['OWNER', 'AGENT'].includes(user.role)) {
//         return res.status(403).json({
//           success: false,
//           message: 'Only property owners and agents can request marking jobs',
//         });
//       }

//       // Verify property exists and user has access
//       const property = await prisma.property.findFirst({
//         where: {
//           id: validatedData.propertyId,
//           OR: [
//             { ownerId: userId },
//             { agentId: userId },
//           ],
//         },
//       });

//       if (!property) {
//         return res.status(404).json({
//           success: false,
//           message: 'Property not found or you do not have access to it',
//         });
//       }

//       // Check if property already has a pending marking job
//       const existingJob = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           propertyId: validatedData.propertyId,
//           status: {
//             in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'],
//           },
//         },
//       });

//       if (existingJob) {
//         return res.status(400).json({
//           success: false,
//           message: 'This property already has a pending marking job',
//           jobId: existingJob.id,
//         });
//       }

//       // Check if property is already marked
//       if (property.boundaryVerified) {
//         return res.status(400).json({
//           success: false,
//           message: 'This property has already been marked and verified',
//         });
//       }

//       // Determine marking fee based on choice
//       let markingFee = 0;
//       let assignedAgentId = null;
//       let status: MarkingJobStatus = 'QUEUED';

//       switch (validatedData.markingChoice) {
//         case 'SELF':
//           markingFee = 0; // No fee for self-marking
//           assignedAgentId = userId;
//           status = 'ASSIGNED';
//           break;
//         case 'NEWCONDO':
//           markingFee = 25000; // 25,000 Naira for Newcondo
//           status = 'QUEUED';
//           break;
//         case 'SOMEONE_I_KNOW':
//           markingFee = 0; // No fee, will generate shareable link
//           status = 'QUEUED';
//           break;
//         case 'ASSIGN_TO_AGENTS':
//           markingFee = 20000; // 20,000 Naira for agent assignment
//           status = 'QUEUED';
//           break;
//       }

//       // Calculate max completion time (3 days from now)
//       const maxCompletionTime = new Date();
//       maxCompletionTime.setDate(maxCompletionTime.getDate() + 3);

//       // Create marking job
//       const markingJob = await prisma.propertyMarkingJob.create({
//         data: {
//           propertyId: validatedData.propertyId,
//           requestedBy: userId,
//           assignedAgentId,
//           contactPersonName: validatedData.contactPersonName,
//           contactPersonPhone: validatedData.contactPersonPhone,
//           accessInstructions: validatedData.accessInstructions,
//           preferredTime: validatedData.preferredTime ? new Date(validatedData.preferredTime) : null,
//           urgencyLevel: validatedData.urgencyLevel,
//           markingFee,
//           paymentStatus: markingFee > 0 ? 'PENDING' : 'SUCCESS',
//           status,
//           maxCompletionTime,
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               state: true,
//               images: {
//                 where: { isPrimary: true },
//                 take: 1,
//               },
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//         },
//       });

//       // Create payment record if fee is required
//       let paymentRecord = null;
//       if (markingFee > 0) {
//         paymentRecord = await prisma.payment.create({
//           data: {
//             userId,
//             markingJobId: markingJob.id,
//             amount: markingFee,
//             currency: 'NGN',
//             paymentType: 'PROPERTY_MARKING',
//             status: 'PENDING',
//             description: `Property marking service for ${property.title}`,
//           },
//         });
//       }

//       // Log event
//       await prisma.eventLog.create({
//         data: {
//           userId,
//           type: 'MARKING_JOB_CREATED',
//           metadata: {
//             markingJobId: markingJob.id,
//             propertyId: validatedData.propertyId,
//             markingChoice: validatedData.markingChoice,
//             markingFee,
//           },
//         },
//       });

//       return res.status(201).json({
//         success: true,
//         message: 'Marking job created successfully',
//         data: {
//           markingJob,
//           payment: paymentRecord,
//           nextStep: markingFee > 0 ? 'PAYMENT_REQUIRED' : 'PROCEED_TO_MARKING',
//         },
//       });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({
//           success: false,
//           message: 'Validation error',
//           errors: error.errors,
//         });
//       }
//       next(error);
//     }
//   }

//   /**
//    * Get all marking jobs for the authenticated user
//    * GET /api/marking-jobs
//    */
//   static async getMarkingJobs(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       const { status, page = '1', limit = '10' } = req.query;

//       const pageNum = parseInt(page as string);
//       const limitNum = parseInt(limit as string);
//       const skip = (pageNum - 1) * limitNum;

//       const where: any = {
//         OR: [
//           { requestedBy: userId },
//           { assignedAgentId: userId },
//         ],
//       };

//       if (status) {
//         where.status = status;
//       }

//       const [markingJobs, total] = await Promise.all([
//         prisma.propertyMarkingJob.findMany({
//           where,
//           skip,
//           take: limitNum,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             property: {
//               select: {
//                 id: true,
//                 title: true,
//                 address: true,
//                 city: true,
//                 state: true,
//                 images: {
//                   where: { isPrimary: true },
//                   take: 1,
//                 },
//               },
//             },
//             requestingUser: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//               },
//             },
//             assignedAgent: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 agentReliabilityScore: true,
//               },
//             },
//           },
//         }),
//         prisma.propertyMarkingJob.count({ where }),
//       ]);

//       return res.status(200).json({
//         success: true,
//         data: {
//           markingJobs,
//           pagination: {
//             total,
//             page: pageNum,
//             limit: limitNum,
//             totalPages: Math.ceil(total / limitNum),
//           },
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Get a specific marking job by ID
//    * GET /api/marking-jobs/:id
//    */
//   static async getMarkingJobById(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       const { id } = req.params;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       const markingJob = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           id,
//           OR: [
//             { requestedBy: userId },
//             { assignedAgentId: userId },
//           ],
//         },
//         include: {
//           property: {
//             include: {
//               images: true,
//               owner: {
//                 select: {
//                   id: true,
//                   name: true,
//                   email: true,
//                   phone: true,
//                 },
//               },
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             },
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true,
//               completedMarkingJobs: true,
//               totalMarkingJobs: true,
//             },
//           },
//         },
//       });

//       if (!markingJob) {
//         return res.status(404).json({
//           success: false,
//           message: 'Marking job not found or you do not have access to it',
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         data: markingJob,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Update marking job details
//    * PATCH /api/marking-jobs/:id
//    */
//   static async updateMarkingJob(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       const { id } = req.params;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       // Validate request body
//       const validatedData = updateMarkingJobSchema.parse(req.body);

//       // Check if marking job exists and user is the requester
//       const existingJob = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           id,
//           requestedBy: userId,
//         },
//       });

//       if (!existingJob) {
//         return res.status(404).json({
//           success: false,
//           message: 'Marking job not found or you do not have permission to update it',
//         });
//       }

//       // Only allow updates if job is still in QUEUED or ASSIGNED status
//       if (!['QUEUED', 'ASSIGNED'].includes(existingJob.status)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot update marking job in current status',
//         });
//       }

//       // Update marking job
//       const updatedJob = await prisma.propertyMarkingJob.update({
//         where: { id },
//         data: {
//           ...validatedData,
//           preferredTime: validatedData.preferredTime ? new Date(validatedData.preferredTime) : undefined,
//           updatedAt: new Date(),
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//             },
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//       });

//       // Log event
//       await prisma.eventLog.create({
//         data: {
//           userId,
//           type: 'MARKING_JOB_UPDATED',
//           metadata: {
//             markingJobId: id,
//             updates: validatedData,
//           },
//         },
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Marking job updated successfully',
//         data: updatedJob,
//       });
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({
//           success: false,
//           message: 'Validation error',
//           errors: error.errors,
//         });
//       }
//       next(error);
//     }
//   }

//   /**
//    * Cancel a marking job
//    * DELETE /api/marking-jobs/:id
//    */
//   static async cancelMarkingJob(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       const { id } = req.params;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       // Check if marking job exists and user is the requester
//       const existingJob = await prisma.propertyMarkingJob.findFirst({
//         where: {
//           id,
//           requestedBy: userId,
//         },
//       });

//       if (!existingJob) {
//         return res.status(404).json({
//           success: false,
//           message: 'Marking job not found or you do not have permission to cancel it',
//         });
//       }

//       // Only allow cancellation if job is not completed
//       if (['COMPLETED', 'CANCELLED'].includes(existingJob.status)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot cancel marking job in current status',
//         });
//       }

//       // If job is in progress, check if agent has started work
//       if (existingJob.status === 'IN_PROGRESS') {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot cancel job that is already in progress. Please contact support.',
//         });
//       }

//       // Cancel the marking job
//       const cancelledJob = await prisma.propertyMarkingJob.update({
//         where: { id },
//         data: {
//           status: 'CANCELLED',
//           updatedAt: new Date(),
//         },
//       });

//       // Handle refund if payment was made
//       if (existingJob.paymentStatus === 'SUCCESS') {
//         await prisma.payment.updateMany({
//           where: {
//             markingJobId: id,
//             status: 'SUCCESS',
//           },
//           data: {
//             status: 'REFUNDED',
//             updatedAt: new Date(),
//           },
//         });
//       }

//       // Log event
//       await prisma.eventLog.create({
//         data: {
//           userId,
//           type: 'MARKING_JOB_CANCELLED',
//           metadata: {
//             markingJobId: id,
//             previousStatus: existingJob.status,
//           },
//         },
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Marking job cancelled successfully',
//         data: cancelledJob,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Get marking job statistics for the authenticated user
//    * GET /api/marking-jobs/stats
//    */
//   static async getMarkingJobStats(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized',
//         });
//       }

//       const [requested, assigned, completed, cancelled] = await Promise.all([
//         prisma.propertyMarkingJob.count({
//           where: { requestedBy: userId },
//         }),
//         prisma.propertyMarkingJob.count({
//           where: {
//             assignedAgentId: userId,
//             status: {
//               in: ['ASSIGNED', 'IN_PROGRESS'],
//             },
//           },
//         }),
//         prisma.propertyMarkingJob.count({
//           where: {
//             assignedAgentId: userId,
//             status: 'COMPLETED',
//           },
//         }),
//         prisma.propertyMarkingJob.count({
//           where: {
//             requestedBy: userId,
//             status: 'CANCELLED',
//           },
//         }),
//       ]);

//       return res.status(200).json({
//         success: true,
//         data: {
//           requested,
//           assigned,
//           completed,
//           cancelled,
//         },
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }





// // backend/marking-service/src/controllers/markingJobController.ts
// import { Request, Response, NextFunction } from 'express';
// import { prisma } from '@newcondo/db';
// import { standardResponse } from '../../../shared/src/utils/response';
// import { MarkingJobStatus, PaymentStatus, UrgencyLevel } from '@prisma/client';

// /**
//  * Create a new marking job
//  * Only property owners and listing agents can request marking jobs
//  */
// export const createMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const {
//       propertyId,
//       contactPersonName,
//       contactPersonPhone,
//       accessInstructions,
//       preferredTime,
//       urgencyLevel = UrgencyLevel.NORMAL,
//       markingType, // 'SELF', 'KNOWN_PERSON', 'AGENT_FROM_QUEUE', 'NEWCONDO_AGENT'
//     } = req.body;

//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         standardResponse(false, 'Unauthorized', null, 401)
//       );
//     }

//     // Verify property exists and user has permission
//     const property = await prisma.property.findUnique({
//       where: { id: propertyId },
//       include: { owner: true, agent: true },
//     });

//     if (!property) {
//       return res.status(404).json(
//         standardResponse(false, 'Property not found', null, 404)
//       );
//     }

//     // Check if user is owner or agent
//     const isOwner = property.ownerId === userId;
//     const isAgent = property.agentId === userId;

//     if (!isOwner && !isAgent) {
//       return res.status(403).json(
//         standardResponse(
//           false,
//           'Only property owner or agent can request marking',
//           null,
//           403
//         )
//       );
//     }

//     // Determine marking fee based on marking type
//     let markingFee = 0;
//     if (markingType === 'AGENT_FROM_QUEUE') {
//       markingFee = 20000; // NGN 20,000 for agent from queue
//     } else if (markingType === 'NEWCONDO_AGENT') {
//       markingFee = 25000; // NGN 25,000 for Newcondo agent
//     }

//     // Create marking job
//     const markingJob = await prisma.propertyMarkingJob.create({
//       data: {
//         propertyId,
//         requestedBy: userId,
//         contactPersonName,
//         contactPersonPhone,
//         accessInstructions,
//         preferredTime: preferredTime ? new Date(preferredTime) : null,
//         urgencyLevel,
//         markingFee: markingFee > 0 ? markingFee : 0,
//         status: MarkingJobStatus.QUEUED,
//         paymentStatus: markingFee > 0 ? PaymentStatus.PENDING : PaymentStatus.SUCCESS,
//         maxCompletionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
//       },
//       include: {
//         property: true,
//         requestingUser: true,
//       },
//     });

//     return res.status(201).json(
//       standardResponse(
//         true,
//         'Marking job created successfully',
//         markingJob,
//         201
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get all marking jobs for a property owner or agent
//  */
// export const getMarkingJobs = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id;
//     const { propertyId, status, limit = 10, offset = 0 } = req.query;

//     if (!userId) {
//       return res.status(401).json(
//         standardResponse(false, 'Unauthorized', null, 401)
//       );
//     }

//     const query: any = {
//       requestedBy: userId,
//     };

//     if (propertyId) {
//       query.propertyId = propertyId;
//     }

//     if (status) {
//       query.status = status;
//     }

//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where: query,
//         include: {
//           property: true,
//           requestingUser: true,
//           assignedAgent: true,
//         },
//         orderBy: { createdAt: 'desc' },
//         take: parseInt(limit as string),
//         skip: parseInt(offset as string),
//       }),
//       prisma.propertyMarkingJob.count({ where: query }),
//     ]);

//     return res.status(200).json(
//       standardResponse(true, 'Marking jobs retrieved successfully', {
//         data: jobs,
//         pagination: {
//           total,
//           limit: parseInt(limit as string),
//           offset: parseInt(offset as string),
//         },
//       })
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get marking job details
//  */
// export const getMarkingJobById = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user?.id;

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id },
//       include: {
//         property: true,
//         requestingUser: true,
//         assignedAgent: true,
//       },
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         standardResponse(false, 'Marking job not found', null, 404)
//       );
//     }

//     // Check permissions
//     if (
//       userId !== markingJob.requestedBy &&
//       userId !== markingJob.assignedAgentId &&
//       req.user?.role !== 'ADMIN'
//     ) {
//       return res.status(403).json(
//         standardResponse(false, 'Access denied', null, 403)
//       );
//     }

//     return res.status(200).json(
//       standardResponse(true, 'Marking job retrieved successfully', markingJob)
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Update marking job with completion details
//  */
// export const completeMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { completionNotes, completionImages, boundaryData } = req.body;
//     const userId = req.user?.id;

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id },
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         standardResponse(false, 'Marking job not found', null, 404)
//       );
//     }

//     // Only assigned agent can complete the job
//     if (markingJob.assignedAgentId !== userId) {
//       return res.status(403).json(
//         standardResponse(false, 'Only assigned agent can complete this job', null, 403)
//       );
//     }

//     // Check time slot validity (3-hour window)
//     if (markingJob.timeSlotExpiry && new Date() > markingJob.timeSlotExpiry) {
//       return res.status(400).json(
//         standardResponse(false, 'Time slot has expired', null, 400)
//       );
//     }

//     const updatedJob = await prisma.propertyMarkingJob.update({
//       where: { id },
//       data: {
//         status: MarkingJobStatus.COMPLETED,
//         completedAt: new Date(),
//         completionNotes,
//         completionImages: completionImages || [],
//         boundaryData: boundaryData || null,
//       },
//       include: {
//         property: true,
//         requestingUser: true,
//         assignedAgent: true,
//       },
//     });

//     return res.status(200).json(
//       standardResponse(
//         true,
//         'Marking job completed successfully',
//         updatedJob
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Cancel marking job
//  */
// export const cancelMarkingJob = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const userId = req.user?.id;

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id },
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         standardResponse(false, 'Marking job not found', null, 404)
//       );
//     }

//     // Only requester or admin can cancel
//     if (userId !== markingJob.requestedBy && req.user?.role !== 'ADMIN') {
//       return res.status(403).json(
//         standardResponse(false, 'Access denied', null, 403)
//       );
//     }

//     const cancelledJob = await prisma.propertyMarkingJob.update({
//       where: { id },
//       data: {
//         status: MarkingJobStatus.CANCELLED,
//       },
//     });

//     return res.status(200).json(
//       standardResponse(
//         true,
//         'Marking job cancelled successfully',
//         cancelledJob
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get marking jobs awaiting confirmation from property owner
//  */
// export const getAwaitingConfirmationJobs = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         standardResponse(false, 'Unauthorized', null, 401)
//       );
//     }

//     const jobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         requestedBy: userId,
//         status: MarkingJobStatus.COMPLETED,
//       },
//       include: {
//         property: true,
//         assignedAgent: true,
//       },
//       orderBy: { completedAt: 'desc' },
//     });

//     return res.status(200).json(
//       standardResponse(
//         true,
//         'Awaiting confirmation jobs retrieved',
//         jobs
//       )
//     );
//   } catch (error) {
//     next(error);
//   }
// };














// // backend/marking-service/src/controllers/markingJobController.ts

// import { Request, Response } from 'express';
// import { PrismaClient, MarkingJobStatus, PaymentStatus, UrgencyLevel } from '@prisma/client';
// import { standardResponse } from '../../../shared/src/utils/response';

// const prisma = new PrismaClient();

// /**
//  * Create a new marking job
//  * POST /api/marking-jobs
//  */
// export const createMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const {
//       propertyId,
//       contactPersonName,
//       contactPersonPhone,
//       accessInstructions,
//       preferredTime,
//       urgencyLevel,
//       markingFee
//     } = req.body;

//     // Validate property exists and belongs to user or user is an agent
//     const property = await prisma.property.findUnique({
//       where: { id: propertyId },
//       include: {
//         owner: true,
//         agent: true
//       }
//     });

//     if (!property) {
//       return res.status(404).json(standardResponse(false, 'Property not found', null));
//     }

//     // Check if user is authorized to create marking job for this property
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true, isPremium: true }
//     });

//     const isOwner = property.ownerId === userId;
//     const isAgent = property.agentId === userId;
//     const isPremiumRenter = user?.role === 'RENTER' && user.isPremium;

//     if (!isOwner && !isAgent && !isPremiumRenter) {
//       return res.status(403).json(
//         standardResponse(false, 'You are not authorized to create a marking job for this property', null)
//       );
//     }

//     // Check if property already has boundary marked
//     if (property.boundaryVerified) {
//       return res.status(400).json(
//         standardResponse(false, 'Property boundary is already verified', null)
//       );
//     }

//     // Check if there's already an active marking job for this property
//     const existingJob = await prisma.propertyMarkingJob.findFirst({
//       where: {
//         propertyId,
//         status: {
//           in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS']
//         }
//       }
//     });

//     if (existingJob) {
//       return res.status(400).json(
//         standardResponse(false, 'An active marking job already exists for this property', null)
//       );
//     }

//     // Get current queue position
//     const currentQueueCount = await prisma.propertyMarkingJob.count({
//       where: {
//         status: {
//           in: ['QUEUED', 'ASSIGNED']
//         }
//       }
//     });

//     // Calculate max completion time (3 days from now)
//     const maxCompletionTime = new Date();
//     maxCompletionTime.setDate(maxCompletionTime.getDate() + 3);

//     // Create marking job
//     const markingJob = await prisma.propertyMarkingJob.create({
//       data: {
//         propertyId,
//         requestedBy: userId,
//         contactPersonName,
//         contactPersonPhone,
//         accessInstructions,
//         preferredTime: preferredTime ? new Date(preferredTime) : undefined,
//         urgencyLevel: urgencyLevel || UrgencyLevel.NORMAL,
//         markingFee: markingFee || 20000, // Default 20,000 NGN
//         paymentStatus: PaymentStatus.PENDING,
//         status: MarkingJobStatus.QUEUED,
//         queuePosition: currentQueueCount + 1,
//         maxCompletionTime
//       },
//       include: {
//         property: {
//           select: {
//             title: true,
//             address: true,
//             city: true,
//             state: true,
//             gpsCoordinates: true
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true
//           }
//         }
//       }
//     });

//     return res.status(201).json(
//       standardResponse(true, 'Marking job created successfully', markingJob)
//     );
//   } catch (error) {
//     console.error('Create marking job error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to create marking job', null)
//     );
//   }
// };

// /**
//  * Get all marking jobs (with filters)
//  * GET /api/marking-jobs
//  */
// export const getMarkingJobs = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const {
//       status,
//       page = 1,
//       limit = 10,
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     const skip = (Number(page) - 1) * Number(limit);

//     // Build filter based on user role
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true }
//     });

//     let where: any = {};

//     if (user?.role === 'ADMIN') {
//       // Admin can see all jobs
//       if (status) {
//         where.status = status;
//       }
//     } else {
//       // Users can only see their own jobs (requested or assigned)
//       where = {
//         OR: [
//           { requestedBy: userId },
//           { assignedAgentId: userId }
//         ]
//       };
//       if (status) {
//         where.status = status;
//       }
//     }

//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where,
//         skip,
//         take: Number(limit),
//         orderBy: {
//           [sortBy as string]: sortOrder
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               city: true,
//               state: true,
//               gpsCoordinates: true,
//               images: {
//                 take: 1,
//                 orderBy: { order: 'asc' }
//               }
//             }
//           },
//           requestingUser: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           },
//           assignedAgent: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//               agentReliabilityScore: true
//             }
//           }
//         }
//       }),
//       prisma.propertyMarkingJob.count({ where })
//     ]);

//     return res.status(200).json(
//       standardResponse(true, 'Marking jobs retrieved successfully', {
//         jobs,
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           totalPages: Math.ceil(total / Number(limit))
//         }
//       })
//     );
//   } catch (error) {
//     console.error('Get marking jobs error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve marking jobs', null)
//     );
//   }
// };

// /**
//  * Get a specific marking job by ID
//  * GET /api/marking-jobs/:id
//  */
// export const getMarkingJobById = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { id } = req.params;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id },
//       include: {
//         property: {
//           include: {
//             images: true,
//             owner: {
//               select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true
//               }
//             }
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true
//           }
//         },
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             phone: true,
//             agentReliabilityScore: true,
//             totalMarkingJobs: true,
//             completedMarkingJobs: true
//           }
//         }
//       }
//     });

//     if (!job) {
//       return res.status(404).json(standardResponse(false, 'Marking job not found', null));
//     }

//     // Check authorization
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true }
//     });

//     const isAuthorized =
//       user?.role === 'ADMIN' ||
//       job.requestedBy === userId ||
//       job.assignedAgentId === userId;

//     if (!isAuthorized) {
//       return res.status(403).json(
//         standardResponse(false, 'You are not authorized to view this marking job', null)
//       );
//     }

//     return res.status(200).json(
//       standardResponse(true, 'Marking job retrieved successfully', job)
//     );
//   } catch (error) {
//     console.error('Get marking job by ID error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve marking job', null)
//     );
//   }
// };

// /**
//  * Update a marking job
//  * PATCH /api/marking-jobs/:id
//  */
// export const updateMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { id } = req.params;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const {
//       contactPersonName,
//       contactPersonPhone,
//       accessInstructions,
//       preferredTime,
//       urgencyLevel
//     } = req.body;

//     // Find the marking job
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id }
//     });

//     if (!job) {
//       return res.status(404).json(standardResponse(false, 'Marking job not found', null));
//     }

//     // Only the requester or admin can update
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true }
//     });

//     if (job.requestedBy !== userId && user?.role !== 'ADMIN') {
//       return res.status(403).json(
//         standardResponse(false, 'You are not authorized to update this marking job', null)
//       );
//     }

//     // Can only update jobs that are QUEUED or ASSIGNED
//     if (!['QUEUED', 'ASSIGNED'].includes(job.status)) {
//       return res.status(400).json(
//         standardResponse(false, 'Cannot update marking job in current status', null)
//       );
//     }

//     const updatedJob = await prisma.propertyMarkingJob.update({
//       where: { id },
//       data: {
//         contactPersonName,
//         contactPersonPhone,
//         accessInstructions,
//         preferredTime: preferredTime ? new Date(preferredTime) : undefined,
//         urgencyLevel
//       },
//       include: {
//         property: {
//           select: {
//             title: true,
//             address: true,
//             city: true,
//             state: true
//           }
//         },
//         requestingUser: {
//           select: {
//             id: true,
//             name: true,
//             email: true
//           }
//         }
//       }
//     });

//     return res.status(200).json(
//       standardResponse(true, 'Marking job updated successfully', updatedJob)
//     );
//   } catch (error) {
//     console.error('Update marking job error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to update marking job', null)
//     );
//   }
// };

// /**
//  * Cancel a marking job
//  * POST /api/marking-jobs/:id/cancel
//  */
// export const cancelMarkingJob = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { id } = req.params;
//     const { reason } = req.body;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id }
//     });

//     if (!job) {
//       return res.status(404).json(standardResponse(false, 'Marking job not found', null));
//     }

//     // Only requester or admin can cancel
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true }
//     });

//     if (job.requestedBy !== userId && user?.role !== 'ADMIN') {
//       return res.status(403).json(
//         standardResponse(false, 'You are not authorized to cancel this marking job', null)
//       );
//     }

//     // Can only cancel jobs that are QUEUED or ASSIGNED
//     if (!['QUEUED', 'ASSIGNED'].includes(job.status)) {
//       return res.status(400).json(
//         standardResponse(false, 'Cannot cancel marking job in current status', null)
//       );
//     }

//     // Update job status to CANCELLED
//     const cancelledJob = await prisma.propertyMarkingJob.update({
//       where: { id },
//       data: {
//         status: MarkingJobStatus.CANCELLED,
//         completionNotes: reason || 'Job cancelled by requester'
//       }
//     });

//     // If job was assigned, update queue positions for other jobs
//     if (job.assignedAgentId) {
//       await prisma.propertyMarkingJob.updateMany({
//         where: {
//           status: MarkingJobStatus.QUEUED,
//           queuePosition: {
//             gt: job.queuePosition || 0
//           }
//         },
//         data: {
//           queuePosition: {
//             decrement: 1
//           }
//         }
//       });
//     }

//     // TODO: Trigger refund if payment was made
//     // TODO: Send notification to assigned agent (if any)

//     return res.status(200).json(
//       standardResponse(true, 'Marking job cancelled successfully', cancelledJob)
//     );
//   } catch (error) {
//     console.error('Cancel marking job error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to cancel marking job', null)
//     );
//   }
// };

// /**
//  * Get marking job statistics
//  * GET /api/marking-jobs/stats
//  */
// export const getMarkingJobStats = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { role: true }
//     });

//     let where: any = {};

//     // Non-admin users see only their stats
//     if (user?.role !== 'ADMIN') {
//       where = {
//         OR: [
//           { requestedBy: userId },
//           { assignedAgentId: userId }
//         ]
//       };
//     }

//     const [
//       total,
//       queued,
//       assigned,
//       inProgress,
//       completed,
//       cancelled,
//       expired
//     ] = await Promise.all([
//       prisma.propertyMarkingJob.count({ where }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.QUEUED } }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.ASSIGNED } }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.IN_PROGRESS } }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.COMPLETED } }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.CANCELLED } }),
//       prisma.propertyMarkingJob.count({ where: { ...where, status: MarkingJobStatus.EXPIRED } })
//     ]);

//     const stats = {
//       total,
//       byStatus: {
//         queued,
//         assigned,
//         inProgress,
//         completed,
//         cancelled,
//         expired
//       },
//       completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
//     };

//     return res.status(200).json(
//       standardResponse(true, 'Marking job statistics retrieved successfully', stats)
//     );
//   } catch (error) {
//     console.error('Get marking job stats error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve marking job statistics', null)
//     );
//   }
// };