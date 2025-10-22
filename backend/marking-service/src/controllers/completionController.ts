// backend/marking-service/src/controllers/completionController.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@newcondo/db';
import { notificationService } from '../services/notificationService';
import { timeSlotService } from '../services/timeSlotService';

const prisma = new PrismaClient();

// Validation schemas
const completeJobSchema = z.object({
  markingJobId: z.string().cuid(),
  completionNotes: z.string().min(10, 'Completion notes must be at least 10 characters'),
  completionImages: z.array(z.string().url()).min(1, 'At least one completion image is required'),
  boundaryData: z.object({
    coordinates: z.array(z.object({
      lat: z.number(),
      lng: z.number()
    })).min(3, 'Boundary must have at least 3 coordinates'),
    area: z.number().positive('Area must be positive'),
    perimeter: z.number().positive('Perimeter must be positive')
  })
});

const validateCompletionSchema = z.object({
  markingJobId: z.string().cuid(),
  isValid: z.boolean(),
  validationNotes: z.string().optional()
});

export class CompletionController {
  
  /**
   * Complete a marking job by agent
   */
  async completeMarkingJob(req: Request, res: Response) {
    try {
      const { markingJobId, completionNotes, completionImages, boundaryData } = 
        completeJobSchema.parse(req.body);
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Agent authentication required' 
        });
      }

      // Check if job exists and is assigned to this agent
      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: markingJobId,
          assignedAgentId: agentId,
          status: 'IN_PROGRESS'
        },
        include: {
          property: true,
          requestingUser: true,
          assignedAgent: true
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Marking job not found or not assigned to you'
        });
      }

      // Check if time slot is still valid
      const isTimeSlotValid = timeSlotService.validateTimeSlot(job.timeSlotExpiry);
      if (!isTimeSlotValid) {
        // Mark job as expired and reassign to queue
        await prisma.propertyMarkingJob.update({
          where: { id: markingJobId },
          data: {
            status: 'EXPIRED',
            assignedAgentId: null,
            assignedAt: null,
            timeSlotExpiry: null
          }
        });

        return res.status(400).json({
          success: false,
          error: 'Time slot expired. Job has been returned to queue.'
        });
      }

      // Complete the marking job
      const completedJob = await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNotes,
          completionImages,
          boundaryData
        },
        include: {
          property: true,
          requestingUser: true,
          assignedAgent: true
        }
      });

      // Update property with boundary data
      await prisma.property.update({
        where: { id: job.propertyId },
        data: {
          boundaryCoordinates: boundaryData,
          boundaryVerified: true,
          boundaryMarkedBy: agentId,
          boundaryMarkedAt: new Date(),
          boundaryImages: completionImages
        }
      });

      // Update agent statistics
      await prisma.user.update({
        where: { id: agentId },
        data: {
          completedMarkingJobs: {
            increment: 1
          }
        }
      });

      // Send completion notifications
      await notificationService.sendJobCompletionNotification(
        completedJob.requestingUser.email,
        completedJob.requestingUser.phone,
        {
          propertyTitle: completedJob.property.title,
          agentName: completedJob.assignedAgent?.name || 'Agent',
          completionTime: completedJob.completedAt!,
          boundaryData
        }
      );

      // Release time slot
      timeSlotService.releaseTimeSlot(agentId);

      res.status(200).json({
        success: true,
        data: {
          job: completedJob,
          message: 'Marking job completed successfully'
        }
      });

    } catch (error) {
      console.error('Complete marking job error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Upload completion images during job progress
   */
  async uploadCompletionImages(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const { images } = req.body;
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Agent authentication required' 
        });
      }

      // Verify job ownership
      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: markingJobId,
          assignedAgentId: agentId,
          status: 'IN_PROGRESS'
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Marking job not found or not assigned to you'
        });
      }

      // Add images to existing completion images
      const updatedJob = await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          completionImages: {
            push: images
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          images: updatedJob.completionImages,
          message: 'Images uploaded successfully'
        }
      });

    } catch (error) {
      console.error('Upload completion images error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get completion progress for a job
   */
  async getCompletionProgress(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Agent authentication required' 
        });
      }

      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: markingJobId,
          assignedAgentId: agentId
        },
        include: {
          property: {
            select: {
              title: true,
              address: true,
              gpsCoordinates: true
            }
          }
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Marking job not found'
        });
      }

      // Calculate completion percentage based on available data
      const completionSteps = {
        imagesUploaded: job.completionImages.length > 0,
        notesAdded: !!job.completionNotes,
        boundaryMarked: !!job.boundaryData,
        isCompleted: job.status === 'COMPLETED'
      };

      const completedSteps = Object.values(completionSteps).filter(Boolean).length;
      const completionPercentage = Math.round((completedSteps / 4) * 100);

      // Check remaining time in slot
      const remainingTime = timeSlotService.getRemainingTime(job.timeSlotExpiry);

      res.status(200).json({
        success: true,
        data: {
          job,
          completion: {
            percentage: completionPercentage,
            steps: completionSteps,
            remainingTime
          }
        }
      });

    } catch (error) {
      console.error('Get completion progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate completed marking job (admin function)
   */
  async validateCompletion(req: Request, res: Response) {
    try {
      const { markingJobId, isValid, validationNotes } = 
        validateCompletionSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Admin authentication required' 
        });
      }

      // Check if user is admin
      const admin = await prisma.user.findFirst({
        where: {
          id: adminId,
          role: 'ADMIN'
        }
      });

      if (!admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const job = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          property: true,
          requestingUser: true,
          assignedAgent: true
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Marking job not found'
        });
      }

      if (job.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'Job must be completed before validation'
        });
      }

      if (isValid) {
        // Approve the boundary marking
        await prisma.property.update({
          where: { id: job.propertyId },
          data: {
            boundaryVerified: true
          }
        });

        // Update agent reliability score
        if (job.assignedAgentId) {
          const agent = await prisma.user.findUnique({
            where: { id: job.assignedAgentId }
          });

          if (agent) {
            const currentScore = agent.agentReliabilityScore?.toNumber() || 3.0;
            const newScore = Math.min(5.0, currentScore + 0.1);
            
            await prisma.user.update({
              where: { id: job.assignedAgentId },
              data: {
                agentReliabilityScore: newScore
              }
            });
          }
        }

        // Send approval notification
        await notificationService.sendJobApprovalNotification(
          job.requestingUser.email,
          job.requestingUser.phone,
          {
            propertyTitle: job.property.title,
            approvedAt: new Date()
          }
        );

      } else {
        // Reject the marking - reset property boundary data
        await prisma.property.update({
          where: { id: job.propertyId },
          data: {
            boundaryCoordinates: null,
            boundaryVerified: false,
            boundaryMarkedBy: null,
            boundaryMarkedAt: null,
            boundaryImages: []
          }
        });

        // Decrease agent reliability score
        if (job.assignedAgentId) {
          const agent = await prisma.user.findUnique({
            where: { id: job.assignedAgentId }
          });

          if (agent) {
            const currentScore = agent.agentReliabilityScore?.toNumber() || 3.0;
            const newScore = Math.max(0.0, currentScore - 0.2);
            
            await prisma.user.update({
              where: { id: job.assignedAgentId },
              data: {
                agentReliabilityScore: newScore
              }
            });
          }
        }

        // Send rejection notification
        await notificationService.sendJobRejectionNotification(
          job.requestingUser.email,
          job.requestingUser.phone,
          {
            propertyTitle: job.property.title,
            rejectionReason: validationNotes || 'Boundary marking did not meet requirements',
            rejectedAt: new Date()
          }
        );
      }

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: isValid ? 'BOUNDARY_DISPUTE_RESOLVED' : 'PROPERTY_REJECTED',
          targetType: 'PropertyMarkingJob',
          targetId: markingJobId,
          description: `Marking job ${isValid ? 'approved' : 'rejected'}`,
          metadata: {
            validationNotes,
            propertyId: job.propertyId,
            agentId: job.assignedAgentId
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          markingJobId,
          isValid,
          validationNotes,
          message: `Marking job ${isValid ? 'approved' : 'rejected'} successfully`
        }
      });

    } catch (error) {
      console.error('Validate completion error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get completed jobs for admin review
   */
  async getCompletedJobsForReview(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Admin authentication required' 
        });
      }

      // Check admin role
      const admin = await prisma.user.findFirst({
        where: {
          id: adminId,
          role: 'ADMIN'
        }
      });

      if (!admin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.propertyMarkingJob.findMany({
          where: {
            status: 'COMPLETED'
          },
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true,
                state: true
              }
            },
            requestingUser: {
              select: {
                name: true,
                email: true
              }
            },
            assignedAgent: {
              select: {
                name: true,
                email: true,
                agentReliabilityScore: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.propertyMarkingJob.count({
          where: {
            status: 'COMPLETED'
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get completed jobs for review error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get agent's completed jobs history
   */
  async getAgentCompletedJobs(req: Request, res: Response) {
    try {
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Agent authentication required' 
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.propertyMarkingJob.findMany({
          where: {
            assignedAgentId: agentId,
            status: 'COMPLETED'
          },
          include: {
            property: {
              select: {
                title: true,
                address: true,
                city: true,
                state: true
              }
            },
            requestingUser: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.propertyMarkingJob.count({
          where: {
            assignedAgentId: agentId,
            status: 'COMPLETED'
          }
        })
      ]);

      // Get agent statistics
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          totalMarkingJobs: true,
          completedMarkingJobs: true,
          agentReliabilityScore: true
        }
      });

      res.status(200).json({
        success: true,
        data: {
          jobs,
          statistics: {
            totalJobs: agent?.totalMarkingJobs || 0,
            completedJobs: agent?.completedMarkingJobs || 0,
            reliabilityScore: agent?.agentReliabilityScore || 3.0,
            completionRate: agent?.totalMarkingJobs ? 
              Math.round((agent.completedMarkingJobs / agent.totalMarkingJobs) * 100) : 0
          },
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get agent completed jobs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Request job completion review (for disputed markings)
   */
  async requestCompletionReview(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const { disputeReason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Find the completed job
      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: markingJobId,
          requestedBy: userId,
          status: 'COMPLETED'
        },
        include: {
          property: true,
          assignedAgent: true
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Completed marking job not found'
        });
      }

      // Create support ticket for review
      const supportTicket = await prisma.supportTicket.create({
        data: {
          userId,
          title: `Marking Job Completion Review - ${job.property.title}`,
          description: `Dispute reason: ${disputeReason}\n\nProperty: ${job.property.address}\nAgent: ${job.assignedAgent?.name}\nCompleted: ${job.completedAt}`,
          category: 'PROPERTY',
          priority: 'HIGH'
        }
      });

      // Notify admins about the dispute
      await notificationService.sendAdminNotification(
        'MARKING_DISPUTE',
        {
          ticketId: supportTicket.id,
          markingJobId,
          propertyTitle: job.property.title,
          disputeReason
        }
      );

      res.status(200).json({
        success: true,
        data: {
          ticketId: supportTicket.id,
          message: 'Review request submitted successfully'
        }
      });

    } catch (error) {
      console.error('Request completion review error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Cancel an in-progress marking job (emergency cancellation)
   */
  async cancelMarkingJob(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const { cancellationReason } = req.body;
      const agentId = req.user?.id;

      if (!agentId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Agent authentication required' 
        });
      }

      const job = await prisma.propertyMarkingJob.findFirst({
        where: {
          id: markingJobId,
          assignedAgentId: agentId,
          status: 'IN_PROGRESS'
        },
        include: {
          requestingUser: true,
          property: true
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Active marking job not found'
        });
      }

      // Cancel the job and return to queue
      const cancelledJob = await prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: {
          status: 'CANCELLED',
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
          completionNotes: cancellationReason
        }
      });

      // Release time slot
      timeSlotService.releaseTimeSlot(agentId);

      // Notify requesting user about cancellation
      await notificationService.sendJobCancellationNotification(
        job.requestingUser.email,
        job.requestingUser.phone,
        {
          propertyTitle: job.property.title,
          cancellationReason,
          cancelledAt: new Date()
        }
      );

      // Log admin action if needed
      await prisma.adminAction.create({
        data: {
          adminId: agentId,
          action: 'AGENT_SUSPENDED', // This could be a different action type
          targetType: 'PropertyMarkingJob',
          targetId: markingJobId,
          description: `Marking job cancelled by agent`,
          metadata: {
            cancellationReason,
            propertyId: job.propertyId
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          job: cancelledJob,
          message: 'Marking job cancelled successfully'
        }
      });

    } catch (error) {
      console.error('Cancel marking job error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const completionController = new CompletionController();



// // backend/marking-service/src/controllers/completionController.ts

// import { Request, Response } from 'express';
// import { completionService } from '../services/completionService';
// import { compensationService } from '../services/compensationService';
// import { notificationService } from '../services/notificationService';
// import { ApiResponse } from '../../../shared/src/utils/response';

// /**
//  * Completion Controller
//  * Handles job completion and verification for property marking
//  */
// class CompletionController {
//   /**
//    * Submit marking job completion
//    * POST /api/marking/completion/submit
//    */
//   async submitCompletion(req: Request, res: Response): Promise<void> {
//     try {
//       const agentId = req.user?.id;
//       const {
//         markingJobId,
//         boundaryData,
//         completionNotes,
//         completionImages
//       } = req.body;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       // Validate completion data
//       const validation = await completionService.validateCompletionData({
//         markingJobId,
//         agentId,
//         boundaryData,
//         completionImages
//       });

//       if (!validation.isValid) {
//         res.status(400).json(
//           ApiResponse.error(validation.error || 'Invalid completion data', 400)
//         );
//         return;
//       }

//       // Submit completion
//       const completion = await completionService.submitCompletion({
//         markingJobId,
//         agentId,
//         boundaryData,
//         completionNotes,
//         completionImages
//       });

//       // Process initial compensation (holding amount)
//       const initialCompensation = await compensationService.processInitialCompensation(
//         markingJobId,
//         agentId
//       );

//       // Notify property owner for verification
//       await notificationService.notifyOwnerForVerification(
//         completion.markingJob.requestedBy,
//         completion.markingJob,
//         completion
//       );

//       res.status(200).json(
//         ApiResponse.success(
//           {
//             completion,
//             initialCompensation,
//             verificationDeadline: completion.verificationDeadline
//           },
//           'Completion submitted successfully. Awaiting owner verification.'
//         )
//       );
//     } catch (error: any) {
//       console.error('Error in submitCompletion:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to submit completion', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Property owner verifies/confirms marking completion
//    * POST /api/marking/completion/:jobId/verify
//    */
//   async verifyCompletion(req: Request, res: Response): Promise<void> {
//     try {
//       const { jobId } = req.params;
//       const ownerId = req.user?.id;
//       const { isApproved, rejectionReason } = req.body;

//       if (!ownerId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       // Verify ownership
//       const isOwner = await completionService.verifyOwnership(jobId, ownerId);
//       if (!isOwner) {
//         res.status(403).json(
//           ApiResponse.error('Only property owner can verify completion', 403)
//         );
//         return;
//       }

//       if (isApproved) {
//         // Owner approved the marking
//         const verification = await completionService.approveCompletion(
//           jobId,
//           ownerId
//         );

//         // Release full compensation to agent
//         const compensation = await compensationService.releaseFullCompensation(
//           jobId,
//           verification.agentId
//         );

//         // Update property with boundary data
//         await completionService.updatePropertyBoundary(
//           verification.propertyId,
//           verification.boundaryData
//         );

//         // Close the marking job
//         await completionService.closeMarkingJob(jobId);

//         // Notify agent of approval and payment
//         await notificationService.notifyAgentOfApproval(
//           verification.agentId,
//           verification.markingJob,
//           compensation.totalAmount
//         );

//         res.status(200).json(
//           ApiResponse.success(
//             {
//               verification,
//               compensation
//             },
//             'Marking approved and agent compensated successfully'
//           )
//         );
//       } else {
//         // Owner rejected the marking
//         const rejection = await completionService.rejectCompletion(
//           jobId,
//           ownerId,
//           rejectionReason
//         );

//         // Process partial compensation for agent's effort
//         const partialCompensation = await compensationService.processPartialCompensation(
//           jobId,
//           rejection.agentId,
//           rejection.attemptCount
//         );

//         // Check if max attempts reached
//         if (rejection.attemptCount >= rejection.maxAttempts) {
//           // Max attempts reached, close job
//           await completionService.closeMarkingJob(jobId);
          
//           // Notify owner to create new marking job
//           await notificationService.notifyOwnerMaxAttemptsReached(
//             ownerId,
//             rejection.markingJob
//           );
//         } else {
//           // Reassign to next agent in queue
//           const reassignment = await completionService.reassignAfterRejection(jobId);
          
//           if (reassignment) {
//             await notificationService.notifyAgentOfAssignment(
//               reassignment.newAgentId,
//               reassignment.markingJob
//             );
//           }
//         }

//         // Notify agent of rejection
//         await notificationService.notifyAgentOfRejection(
//           rejection.agentId,
//           rejection.markingJob,
//           rejectionReason,
//           partialCompensation?.amount
//         );

//         res.status(200).json(
//           ApiResponse.success(
//             {
//               rejection,
//               partialCompensation,
//               remainingAttempts: rejection.maxAttempts - rejection.attemptCount
//             },
//             'Marking rejected. Agent notified.'
//           )
//         );
//       }
//     } catch (error: any) {
//       console.error('Error in verifyCompletion:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to verify completion', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Get completion details for a marking job
//    * GET /api/marking/completion/:jobId
//    */
//   async getCompletionDetails(req: Request, res: Response): Promise<void> {
//     try {
//       const { jobId } = req.params;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const completion = await completionService.getCompletionDetails(jobId, userId);

//       if (!completion) {
//         res.status(404).json(
//           ApiResponse.error('Completion not found', 404)
//         );
//         return;
//       }

//       res.status(200).json(
//         ApiResponse.success(completion, 'Completion details retrieved')
//       );
//     } catch (error: any) {
//       console.error('Error in getCompletionDetails:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to get completion details', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Get pending verifications for property owner
//    * GET /api/marking/completion/pending-verifications
//    */
//   async getPendingVerifications(req: Request, res: Response): Promise<void> {
//     try {
//       const ownerId = req.user?.id;

//       if (!ownerId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const pendingVerifications = await completionService.getPendingVerifications(ownerId);

//       res.status(200).json(
//         ApiResponse.success(
//           {
//             verifications: pendingVerifications,
//             count: pendingVerifications.length
//           },
//           'Pending verifications retrieved'
//         )
//       );
//     } catch (error: any) {
//       console.error('Error in getPendingVerifications:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to get pending verifications', 500)
//       );
//     }
//   }

//   /**
//    * Handle verification deadline expiry (automated cron job endpoint)
//    * POST /api/marking/completion/handle-expiry
//    */
//   async handleVerificationExpiry(req: Request, res: Response): Promise<void> {
//     try {
//       // This should be called by a cron job
//       const expiredJobs = await completionService.getExpiredVerifications();

//       const processedJobs = [];

//       for (const job of expiredJobs) {
//         try {
//           // Process partial compensation
//           const compensation = await compensationService.processPartialCompensation(
//             job.id,
//             job.assignedAgentId!,
//             job.attemptCount || 1
//           );

//           // Check if max attempts reached
//           if ((job.attemptCount || 1) >= 3) {
//             await completionService.closeMarkingJob(job.id);
            
//             // Notify owner
//             await notificationService.notifyOwnerMaxAttemptsReached(
//               job.requestedBy,
//               job
//             );
//           } else {
//             // Reassign to next agent
//             const reassignment = await completionService.reassignAfterRejection(job.id);
            
//             if (reassignment) {
//               await notificationService.notifyAgentOfAssignment(
//                 reassignment.newAgentId,
//                 reassignment.markingJob
//               );
//             }
//           }

//           // Notify agent of expiry
//           await notificationService.notifyAgentOfVerificationExpiry(
//             job.assignedAgentId!,
//             job,
//             compensation?.amount
//           );

//           processedJobs.push({
//             jobId: job.id,
//             status: 'processed',
//             compensation: compensation?.amount
//           });
//         } catch (error) {
//           console.error(`Error processing expired job ${job.id}:`, error);
//           processedJobs.push({
//             jobId: job.id,
//             status: 'failed',
//             error: error instanceof Error ? error.message : 'Unknown error'
//           });
//         }
//       }

//       res.status(200).json(
//         ApiResponse.success(
//           {
//             processedCount: processedJobs.length,
//             jobs: processedJobs
//           },
//           'Expired verifications processed'
//         )
//       );
//     } catch (error: any) {
//       console.error('Error in handleVerificationExpiry:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to handle verification expiry', 500)
//       );
//     }
//   }

//   /**
//    * Update completion (before verification)
//    * PUT /api/marking/completion/:jobId
//    */
//   async updateCompletion(req: Request, res: Response): Promise<void> {
//     try {
//       const { jobId } = req.params;
//       const agentId = req.user?.id;
//       const {
//         boundaryData,
//         completionNotes,
//         completionImages
//       } = req.body;

//       if (!agentId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const updatedCompletion = await completionService.updateCompletion(
//         jobId,
//         agentId,
//         {
//           boundaryData,
//           completionNotes,
//           completionImages
//         }
//       );

//       // Notify owner of update
//       await notificationService.notifyOwnerOfCompletionUpdate(
//         updatedCompletion.markingJob.requestedBy,
//         updatedCompletion.markingJob
//       );

//       res.status(200).json(
//         ApiResponse.success(updatedCompletion, 'Completion updated successfully')
//       );
//     } catch (error: any) {
//       console.error('Error in updateCompletion:', error);
//       res.status(error.statusCode || 500).json(
//         ApiResponse.error(error.message || 'Failed to update completion', error.statusCode || 500)
//       );
//     }
//   }

//   /**
//    * Get completion statistics
//    * GET /api/marking/completion/stats
//    */
//   async getCompletionStats(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = req.user?.id;
//       const userRole = req.user?.role;

//       if (!userId) {
//         res.status(401).json(
//           ApiResponse.error('Unauthorized', 401)
//         );
//         return;
//       }

//       const stats = await completionService.getCompletionStats(userId, userRole);

//       res.status(200).json(
//         ApiResponse.success(stats, 'Completion statistics retrieved')
//       );
//     } catch (error: any) {
//       console.error('Error in getCompletionStats:', error);
//       res.status(500).json(
//         ApiResponse.error('Failed to get completion statistics', 500)
//       );
//     }
//   }
// }

// export const completionController = new CompletionController();







// import { Request, Response } from 'express';
// import { PrismaClient } from '@newcondo/db';
// import { ApiResponse } from '../../../shared/src/utils/response';
// import { CompletionService } from '../services/completionService';
// import { NotificationService } from '../../notification-service/src/services/notificationService';
// import { PaymentService } from '../../payment-service/src/services/paymentService';

// const prisma = new PrismaClient();
// const completionService = new CompletionService();
// const notificationService = new NotificationService();
// const paymentService = new PaymentService();

// /**
//  * Mark job as in-progress
//  * POST /api/marking/completion/start
//  */
// export const startMarking = async (req: Request, res: Response) => {
//   try {
//     const { markingJobId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         ApiResponse.error('Unauthorized', 401)
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         assignedAgent: { select: { id: true } },
//         requestingUser: { select: { id: true, email: true, name: true } }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     if (markingJob.assignedAgentId !== userId && markingJob.requestedBy !== userId) {
//       return res.status(403).json(
//         ApiResponse.error('Not authorized to mark this property', 403)
//       );
//     }

//     // Check if time slot is still valid
//     if (markingJob.timeSlotExpiry && markingJob.timeSlotExpiry < new Date()) {
//       return res.status(400).json(
//         ApiResponse.error('Time slot has expired', 400)
//       );
//     }

//     const updated = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: { status: 'IN_PROGRESS' }
//     });

//     // Notify owner that marking has started
//     await notificationService.sendMarkingStartedNotification({
//       ownerId: markingJob.requestedBy,
//       jobId: markingJobId,
//       agentName: markingJob.assignedAgent?.id
//     });

//     return res.status(200).json(
//       ApiResponse.success(updated, 'Marking started')
//     );
//   } catch (error) {
//     console.error('Error starting marking:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to start marking', 500)
//     );
//   }
// };

// /**
//  * Submit marking completion with photos and boundary data
//  * POST /api/marking/completion/submit
//  */
// export const submitMarkingCompletion = async (req: Request, res: Response) => {
//   try {
//     const { markingJobId, completionNotes, completionImages, boundaryData } = req.body;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         ApiResponse.error('Unauthorized', 401)
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         property: {
//           select: { id: true, ownerId: true, gpsCoordinates: true }
//         },
//         assignedAgent: { select: { id: true } },
//         requestingUser: { select: { id: true, email: true, name: true } }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     if (markingJob.assignedAgentId !== userId) {
//       return res.status(403).json(
//         ApiResponse.error('Not authorized to submit this marking', 403)
//       );
//     }

//     // Validate boundary data
//     if (!boundaryData || !boundaryData.coordinates) {
//       return res.status(400).json(
//         ApiResponse.error('Boundary data is required', 400)
//       );
//     }

//     if (!completionImages || completionImages.length === 0) {
//       return res.status(400).json(
//         ApiResponse.error('At least one completion photo is required', 400)
//       );
//     }

//     // Submit completion
//     const completed = await completionService.submitCompletion({
//       markingJobId,
//       agentId: userId,
//       completionNotes,
//       completionImages,
//       boundaryData
//     });

//     if (!completed) {
//       return res.status(400).json(
//         ApiResponse.error('Failed to submit completion', 400)
//       );
//     }

//     // Release initial payment to agent (~1000 NGN)
//     const initialPayment = await paymentService.releaseInitialMarkingPayment({
//       userId,
//       jobId: markingJobId,
//       amount: 1000, // Initial compensation
//       propertyId: markingJob.property.id
//     });

//     // Notify property owner to confirm marking
//     await notificationService.sendMarkingCompletedNotification({
//       ownerId: markingJob.requestedBy,
//       jobId: markingJobId,
//       completionImages,
//       confirmationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
//     });

//     return res.status(200).json(
//       ApiResponse.success(
//         {
//           markingJob: completed,
//           initialPayment,
//           confirmationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
//         },
//         'Marking submitted for confirmation'
//       )
//     );
//   } catch (error) {
//     console.error('Error submitting completion:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to submit marking', 500)
//     );
//   }
// };

// /**
//  * Property owner confirms marking is correct
//  * POST /api/marking/completion/confirm
//  */
// export const confirmMarking = async (req: Request, res: Response) => {
//   try {
//     const { markingJobId } = req.body;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         ApiResponse.error('Unauthorized', 401)
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         property: {
//           select: { id: true, ownerId: true }
//         },
//         assignedAgent: {
//           select: { id: true, email: true, name: true }
//         }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     if (markingJob.property.ownerId !== userId) {
//       return res.status(403).json(
//         ApiResponse.error('Not authorized to confirm this marking', 403)
//       );
//     }

//     if (markingJob.status !== 'COMPLETED') {
//       return res.status(400).json(
//         ApiResponse.error('Marking is not in completed state', 400)
//       );
//     }

//     // Update marking job as confirmed
//     const confirmed = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         status: 'VERIFIED'
//       }
//     });

//     // Update property with boundary data
//     const updatedProperty = await prisma.property.update({
//       where: { id: markingJob.property.id },
//       data: {
//         boundaryCoordinates: confirmed.boundaryData,
//         boundaryVerified: true,
//         boundaryMarkedBy: markingJob.assignedAgentId,
//         boundaryMarkedAt: new Date(),
//         boundaryImages: confirmed.completionImages
//       }
//     });

//     // Release remaining payment to agent
//     const remainingPayment = await paymentService.releaseRemainingMarkingPayment({
//       userId: markingJob.assignedAgentId,
//       jobId: markingJobId,
//       propertyId: markingJob.property.id
//     });

//     // Update agent performance metrics
//     await completionService.updateAgentPerformance(markingJob.assignedAgentId);

//     // Release other queued agents
//     await completionService.releaseQueuedAgents(markingJobId);

//     // Notify agent of payment release
//     await notificationService.sendPaymentReleasedNotification({
//       agentId: markingJob.assignedAgentId,
//       jobId: markingJobId,
//       amount: remainingPayment.amount
//     });

//     return res.status(200).json(
//       ApiResponse.success(
//         {
//           markingJob: confirmed,
//           property: updatedProperty,
//           remainingPayment
//         },
//         'Marking confirmed and verified'
//       )
//     );
//   } catch (error) {
//     console.error('Error confirming marking:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to confirm marking', 500)
//     );
//   }
// };

// /**
//  * Property owner rejects marking and needs to initiate new job
//  * POST /api/marking/completion/reject
//  */
// export const rejectMarking = async (req: Request, res: Response) => {
//   try {
//     const { markingJobId, rejectionReason } = req.body;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         ApiResponse.error('Unauthorized', 401)
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         property: { select: { id: true, ownerId: true } },
//         assignedAgent: { select: { id: true, email: true, name: true } }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     if (markingJob.property.ownerId !== userId) {
//       return res.status(403).json(
//         ApiResponse.error('Not authorized to reject this marking', 403)
//       );
//     }

//     // Update job as rejected
//     const rejected = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         status: 'CANCELLED',
//         completionNotes: `Rejected: ${rejectionReason}`
//       }
//     });

//     // Release initial payment back to agent (they keep it as compensation)
//     // This was already paid, so just notify them

//     // Notify agent of rejection
//     await notificationService.sendMarkingRejectionNotification({
//       agentId: markingJob.assignedAgentId,
//       jobId: markingJobId,
//       reason: rejectionReason
//     });

//     // Notify property owner they need to initiate new marking job
//     await notificationService.sendMarkingRejectionConfirmation({
//       ownerId: userId,
//       jobId: markingJobId,
//       rejectionReason
//     });

//     return res.status(200).json(
//       ApiResponse.success(rejected, 'Marking rejected. Please initiate a new marking job')
//     );
//   } catch (error) {
//     console.error('Error rejecting marking:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to reject marking', 500)
//     );
//   }
// };

// /**
//  * Handle confirmation deadline expiry
//  * POST /api/marking/completion/expire-confirmation
//  */
// export const expireConfirmationDeadline = async (req: Request, res: Response) => {
//   try {
//     const { markingJobId } = req.body;

//     // This should be called by a scheduled task

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: markingJobId },
//       include: {
//         assignedAgent: { select: { id: true, email: true } }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     // Update job status
//     const expired = await prisma.propertyMarkingJob.update({
//       where: { id: markingJobId },
//       data: {
//         status: 'EXPIRED',
//         completionNotes: 'Confirmation deadline expired. Agent compensated.'
//       }
//     });

//     // Agent keeps the initial payment as full compensation
//     // Add note to their account
//     await completionService.recordCompensationForExpiry(
//       markingJob.assignedAgentId,
//       markingJobId,
//       1000
//     );

//     // Notify agent
//     await notificationService.sendConfirmationDeadlineExpiredNotification({
//       agentId: markingJob.assignedAgentId,
//       jobId: markingJobId
//     });

//     return res.status(200).json(
//       ApiResponse.success(expired, 'Confirmation deadline expired')
//     );
//   } catch (error) {
//     console.error('Error expiring confirmation:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to expire confirmation', 500)
//     );
//   }
// };

// /**
//  * Get marking completion details
//  * GET /api/marking/completion/:jobId
//  */
// export const getCompletionDetails = async (req: Request, res: Response) => {
//   try {
//     const { jobId } = req.params;
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json(
//         ApiResponse.error('Unauthorized', 401)
//       );
//     }

//     const markingJob = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: true,
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             agentReliabilityScore: true
//           }
//         },
//         requestingUser: {
//           select: { id: true, name: true }
//         }
//       }
//     });

//     if (!markingJob) {
//       return res.status(404).json(
//         ApiResponse.error('Marking job not found', 404)
//       );
//     }

//     // Verify user has access
//     if (
//       markingJob.requestedBy !== userId &&
//       markingJob.assignedAgentId !== userId
//     ) {
//       return res.status(403).json(
//         ApiResponse.error('Not authorized to view this marking', 403)
//       );
//     }

//     return res.status(200).json(
//       ApiResponse.success(markingJob, 'Completion details retrieved')
//     );
//   } catch (error) {
//     console.error('Error getting completion details:', error);
//     return res.status(500).json(
//       ApiResponse.error('Failed to get completion details', 500)
//     );
//   }
// };









// // backend/marking-service/src/controllers/completionController.ts

// import { Request, Response } from 'express';
// import { PrismaClient, MarkingJobStatus, PaymentStatus } from '@prisma/client';
// import { standardResponse } from '../../../shared/src/utils/response';

// const prisma = new PrismaClient();

// /**
//  * Agent submits completion of marking job
//  * POST /api/completion/:jobId/submit
//  */
// export const submitCompletion = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { jobId } = req.params;
//     const { completionNotes, boundaryData, completionImages } = req.body;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     // Validate required fields
//     if (!boundaryData || !completionImages || completionImages.length === 0) {
//       return res.status(400).json(
//         standardResponse(
//           false,
//           'Boundary data and completion images are required',
//           null
//         )
//       );
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: true
//       }
//     });

//     if (!job) {
//       return res.status(404).json(standardResponse(false, 'Marking job not found', null));
//     }

//     // Verify agent is assigned to this job
//     if (job.assignedAgentId !== userId) {
//       return res.status(403).json(
//         standardResponse(false, 'You are not assigned to this marking job', null)
//       );
//     }

//     // Check if job is in IN_PROGRESS status
//     if (job.status !== MarkingJobStatus.IN_PROGRESS) {
//       return res.status(400).json(
//         standardResponse(false, 'Job must be in progress to submit completion', null)
//       );
//     }

//     // Check if time slot has expired
//     if (job.timeSlotExpiry && new Date() > job.timeSlotExpiry) {
//       return res.status(400).json(
//         standardResponse(false, 'Your time slot for this job has expired', null)
//       );
//     }

//     // Update job with completion data
//     const completedJob = await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: {
//         status: MarkingJobStatus.COMPLETED,
//         completedAt: new Date(),
//         completionNotes,
//         boundaryData,
//         completionImages,
//         property: {
//           update: {
//             boundaryCoordinates: boundaryData,
//             boundaryImages: completionImages,
//             boundaryMarkedBy: userId,
//             boundaryMarkedAt: new Date()
//           }
//         }
//       },
//       include: {
//         property: {
//           select: {
//             id: true,
//             title: true,
//             address: true,
//             boundaryCoordinates: true,
//             boundaryImages: true
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

//     // Pay partial amount to agent (1000 NGN or configured amount)
//     const partialPayment = 1000; // NGN
    
//     // Find or create agent's virtual account
//     let virtualAccount = await prisma.virtualAccount.findFirst({
//       where: { userId }
//     });

//     if (!virtualAccount) {
//       // Create virtual account if doesn't exist
//       virtualAccount = await prisma.virtualAccount.create({
//         data: {
//           userId,
//           accountNumber: `VA${Date.now()}${userId.substring(0, 6)}`,
//           accountName: `Agent ${userId}`,
//           bankCode: '000',
//           balance: 0
//         }
//       });
//     }

//     // Credit partial payment to agent's account
//     await prisma.virtualAccount.update({
//       where: { id: virtualAccount.id },
//       data: {
//         balance: {
//           increment: partialPayment
//         }
//       }
//     });

//     // Create payment record for partial payment
//     await prisma.payment.create({
//       data: {
//         userId,
//         markingJobId: jobId,
//         amount: partialPayment,
//         currency: 'NGN',
//         paymentType: 'PROPERTY_MARKING',
//         status: PaymentStatus.HELD, // Payment is held until confirmation
//         description: 'Partial payment for property marking (pending owner confirmation)',
//         paidAt: new Date()
//       }
//     });

//     // TODO: Send notification to property owner for confirmation
//     // TODO: Send confirmation notification to agent

//     return res.status(200).json(
//       standardResponse(true, 'Marking job submitted successfully. Awaiting property owner confirmation.', {
//         job: completedJob,
//         partialPayment: {
//           amount: partialPayment,
//           currency: 'NGN',
//           status: 'HELD'
//         }
//       })
//     );
//   } catch (error) {
//     console.error('Submit completion error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to submit completion', null)
//     );
//   }
// };

// /**
//  * Get completion details
//  * GET /api/completion/:jobId
//  */
// export const getCompletionDetails = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { jobId } = req.params;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: {
//           include: {
//             images: true
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
//             agentReliabilityScore: true
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
//         standardResponse(false, 'You are not authorized to view this completion', null)
//       );
//     }

//     // Check if job is completed
//     if (job.status !== MarkingJobStatus.COMPLETED) {
//       return res.status(400).json(
//         standardResponse(false, 'Job has not been completed yet', null)
//       );
//     }

//     return res.status(200).json(
//       standardResponse(true, 'Completion details retrieved successfully', job)
//     );
//   } catch (error) {
//     console.error('Get completion details error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve completion details', null)
//     );
//   }
// };

// /**
//  * Get pending completions for property owner
//  * GET /api/completion/pending
//  */
// export const getPendingCompletions = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const { page = 1, limit = 10 } = req.query;
//     const skip = (Number(page) - 1) * Number(limit);

//     // Find completed jobs awaiting confirmation
//     const [jobs, total] = await Promise.all([
//       prisma.propertyMarkingJob.findMany({
//         where: {
//           requestedBy: userId,
//           status: MarkingJobStatus.COMPLETED,
//           property: {
//             boundaryVerified: false
//           }
//         },
//         skip,
//         take: Number(limit),
//         orderBy: { completedAt: 'desc' },
//         include: {
//           property: {
//             include: {
//               images: {
//                 take: 3,
//                 orderBy: { order: 'asc' }
//               }
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
//       prisma.propertyMarkingJob.count({
//         where: {
//           requestedBy: userId,
//           status: MarkingJobStatus.COMPLETED,
//           property: {
//             boundaryVerified: false
//           }
//         }
//       })
//     ]);

//     // Calculate time remaining for confirmation (2-3 days)
//     const jobsWithTimeInfo = jobs.map(job => {
//       const confirmationDeadline = new Date(job.completedAt!);
//       confirmationDeadline.setDate(confirmationDeadline.getDate() + 3); // 3 days

//       const now = new Date();
//       const timeRemaining = Math.max(0, confirmationDeadline.getTime() - now.getTime());

//       return {
//         ...job,
//         confirmationInfo: {
//           deadline: confirmationDeadline,
//           timeRemainingMs: timeRemaining,
//           timeRemainingDays: (timeRemaining / (1000 * 60 * 60 * 24)).toFixed(2),
//           isExpiringSoon: timeRemaining < 1000 * 60 * 60 * 24, // Less than 1 day
//           hasExpired: timeRemaining === 0
//         }
//       };
//     });

//     return res.status(200).json(
//       standardResponse(true, 'Pending completions retrieved successfully', {
//         jobs: jobsWithTimeInfo,
//         pagination: {
//           total,
//           page: Number(page),
//           limit: Number(limit),
//           totalPages: Math.ceil(total / Number(limit))
//         }
//       })
//     );
//   } catch (error) {
//     console.error('Get pending completions error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve pending completions', null)
//     );
//   }
// };

// /**
//  * Update completion images/notes (agent can update before confirmation)
//  * PATCH /api/completion/:jobId/update
//  */
// export const updateCompletion = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     const { jobId } = req.params;
//     const { completionNotes, boundaryData, completionImages } = req.body;

//     if (!userId) {
//       return res.status(401).json(standardResponse(false, 'Unauthorized', null));
//     }

//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         property: true
//       }
//     });

//     if (!job) {
//       return res.status(404).json(standardResponse(false, 'Marking job not found', null));
//     }

//     // Verify agent is assigned to this job
//     if (job.assignedAgentId !== userId) {
//       return res.status(403).json(
//         standardResponse(false, 'You are not assigned to this marking job', null)
//       );
//     }

//     // Can only update if COMPLETED but not yet verified
//     if (job.status !== MarkingJobStatus.COMPLETED || job.property.boundaryVerified) {
//       return res.status(400).json(
//         standardResponse(false, 'Cannot update completion at this stage', null)
//       );
//     }

//     // Check if within update window (3 days)
//     const completedAt = job.completedAt!;
//     const updateDeadline = new Date(completedAt);
//     updateDeadline.setDate(updateDeadline.getDate() + 3);

//     if (new Date() > updateDeadline) {
//       return res.status(400).json(
//         standardResponse(false, 'Update window has expired', null)
//       );
//     }

//     // Update completion data
//     const updatedData: any = {};
//     if (completionNotes) updatedData.completionNotes = completionNotes;
//     if (boundaryData) {
//       updatedData.boundaryData = boundaryData;
//       updatedData.property = {
//         update: {
//           boundaryCoordinates: boundaryData
//         }
//       };
//     }
//     if (completionImages) {
//       updatedData.completionImages = completionImages;
//       updatedData.property = {
//         update: {
//           ...updatedData.property?.update,
//           boundaryImages: completionImages
//         }
//       };
//     }

//     const updatedJob = await prisma.propertyMarkingJob.update({
//       where: { id: jobId },
//       data: updatedData,
//       include: {
//         property: {
//           select: {
//             id: true,
//             title: true,
//             boundaryCoordinates: true,
//             boundaryImages: true
//           }
//         }
//       }
//     });

//     // TODO: Send notification to property owner about update

//     return res.status(200).json(
//       standardResponse(true, 'Completion updated successfully', updatedJob)
//     );
//   } catch (error) {
//     console.error('Update completion error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to update completion', null)
//     );
//   }
// };

// /**
//  * Get completion statistics for agent
//  * GET /api/completion/stats
//  */
// export const getCompletionStats = async (req: Request, res: Response) => {
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

//     if (user?.role !== 'ADMIN') {
//       // Non-admin users see only their stats
//       where = {
//         OR: [
//           { assignedAgentId: userId },
//           { requestedBy: userId }
//         ]
//       };
//     }

//     const [
//       totalCompleted,
//       awaitingConfirmation,
//       confirmed,
//       totalEarnings
//     ] = await Promise.all([
//       prisma.propertyMarkingJob.count({
//         where: {
//           ...where,
//           status: MarkingJobStatus.COMPLETED
//         }
//       }),
//       prisma.propertyMarkingJob.count({
//         where: {
//           ...where,
//           status: MarkingJobStatus.COMPLETED,
//           property: {
//             boundaryVerified: false
//           }
//         }
//       }),
//       prisma.propertyMarkingJob.count({
//         where: {
//           ...where,
//           status: MarkingJobStatus.COMPLETED,
//           property: {
//             boundaryVerified: true
//           }
//         }
//       }),
//       prisma.payment.aggregate({
//         where: {
//           userId,
//           paymentType: 'PROPERTY_MARKING',
//           status: {
//             in: [PaymentStatus.SUCCESS, PaymentStatus.RELEASED]
//           }
//         },
//         _sum: {
//           amount: true
//         }
//       })
//     ]);

//     const stats = {
//       completion: {
//         total: totalCompleted,
//         awaitingConfirmation,
//         confirmed
//       },
//       earnings: {
//         total: totalEarnings._sum.amount || 0,
//         currency: 'NGN'
//       },
//       confirmationRate: totalCompleted > 0 ? ((confirmed / totalCompleted) * 100).toFixed(2) : 0
//     };

//     return res.status(200).json(
//       standardResponse(true, 'Completion statistics retrieved successfully', stats)
//     );
//   } catch (error) {
//     console.error('Get completion stats error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to retrieve completion statistics', null)
//     );
//   }
// };

// /**
//  * Process automatic partial payments for expired confirmations
//  * POST /api/completion/process-expirations (Internal/Cron job endpoint)
//  */
// export const processExpiredConfirmations = async (req: Request, res: Response) => {
//   try {
//     const now = new Date();
//     const expirationDate = new Date();
//     expirationDate.setDate(expirationDate.getDate() - 3); // 3 days ago

//     // Find all completed jobs with expired confirmation windows
//     const expiredJobs = await prisma.propertyMarkingJob.findMany({
//       where: {
//         status: MarkingJobStatus.COMPLETED,
//         completedAt: {
//           lte: expirationDate
//         },
//         property: {
//           boundaryVerified: false
//         }
//       },
//       include: {
//         assignedAgent: {
//           select: {
//             id: true,
//             name: true,
//             email: true
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

//     if (expiredJobs.length === 0) {
//       return res.status(200).json(
//         standardResponse(true, 'No expired confirmations found', { processedCount: 0 })
//       );
//     }

//     const results = await Promise.all(
//       expiredJobs.map(async (job) => {
//         try {
//           // Calculate payment installment (e.g., 25% of remaining fee)
//           const totalFee = Number(job.markingFee);
//           const partialPayment = 1000; // Already paid
//           const remainingFee = totalFee * 0.25 - partialPayment; // 25% commission minus partial
//           const installment = Math.min(remainingFee, 2000); // Pay 2000 NGN or remaining amount

//           if (installment <= 0) {
//             return { jobId: job.id, status: 'already_paid' };
//           }

//           // Credit installment to agent's virtual account
//           const virtualAccount = await prisma.virtualAccount.findFirst({
//             where: { userId: job.assignedAgentId! }
//           });

//           if (!virtualAccount) {
//             return { jobId: job.id, status: 'no_account', error: 'Virtual account not found' };
//           }

//           await prisma.virtualAccount.update({
//             where: { id: virtualAccount.id },
//             data: {
//               balance: {
//                 increment: installment
//               }
//             }
//           });

//           // Create payment record
//           await prisma.payment.create({
//             data: {
//               userId: job.assignedAgentId!,
//               markingJobId: job.id,
//               amount: installment,
//               currency: 'NGN',
//               paymentType: 'PROPERTY_MARKING',
//               status: PaymentStatus.SUCCESS,
//               description: 'Installment payment for expired confirmation window',
//               paidAt: new Date()
//             }
//           });

//           // TODO: Send notification to agent about payment
//           // TODO: Send notification to property owner about expired confirmation

//           return { jobId: job.id, status: 'processed', amount: installment };
//         } catch (error) {
//           console.error(`Failed to process job ${job.id}:`, error);
//           return { jobId: job.id, status: 'failed', error };
//         }
//       })
//     );

//     const processedCount = results.filter(r => r.status === 'processed').length;
//     const failedCount = results.filter(r => r.status === 'failed').length;

//     return res.status(200).json(
//       standardResponse(true, 'Expired confirmations processed', {
//         processedCount,
//         failedCount,
//         details: results
//       })
//     );
//   } catch (error) {
//     console.error('Process expired confirmations error:', error);
//     return res.status(500).json(
//       standardResponse(false, 'Failed to process expired confirmations', null)
//     );
//   }
// };