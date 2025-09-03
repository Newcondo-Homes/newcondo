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