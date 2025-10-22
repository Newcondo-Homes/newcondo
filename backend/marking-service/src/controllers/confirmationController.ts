// backend/marking-service/src/controllers/confirmationController.ts

import { Request, Response } from 'express';
import { PrismaClient, MarkingJobStatus, PaymentStatus } from '@prisma/client';
import { standardResponse } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

/**
 * Property owner confirms marking job completion
 * POST /api/confirmation/:jobId/confirm
 */
export const confirmMarkingCompletion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    const { rating, feedback } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            agentReliabilityScore: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Verify user is the requester
    if (job.requestedBy !== userId) {
      return res.status(403).json(
        standardResponse(false, 'You are not authorized to confirm this marking job', null)
      );
    }

    // Check if job is completed
    if (job.status !== MarkingJobStatus.COMPLETED) {
      return res.status(400).json(
        standardResponse(false, 'Job has not been completed yet', null)
      );
    }

    // Check if already confirmed
    if (job.property.boundaryVerified) {
      return res.status(400).json(
        standardResponse(false, 'This marking job has already been confirmed', null)
      );
    }

    // Check if confirmation window has expired
    const completedAt = job.completedAt!;
    const confirmationDeadline = new Date(completedAt);
    confirmationDeadline.setDate(confirmationDeadline.getDate() + 3);

    if (new Date() > confirmationDeadline) {
      return res.status(400).json(
        standardResponse(false, 'Confirmation window has expired', null)
      );
    }

    await prisma.$transaction(async (tx) => {
      // Update property boundary verification
      await tx.property.update({
        where: { id: job.propertyId },
        data: {
          boundaryVerified: true
        }
      });

      // Calculate remaining payment
      const totalFee = Number(job.markingFee);
      const agentCommission = totalFee * 0.25; // 25% commission
      const partialPaid = 1000; // Already paid
      const remainingPayment = agentCommission - partialPaid;

      // Release remaining payment to agent
      if (remainingPayment > 0 && job.assignedAgentId) {
        // Find agent's virtual account
        const virtualAccount = await tx.virtualAccount.findFirst({
          where: { userId: job.assignedAgentId }
        });

        if (virtualAccount) {
          // Credit remaining payment
          await tx.virtualAccount.update({
            where: { id: virtualAccount.id },
            data: {
              balance: {
                increment: remainingPayment
              }
            }
          });

          // Update held payment to released
          await tx.payment.updateMany({
            where: {
              markingJobId: jobId,
              status: PaymentStatus.HELD
            },
            data: {
              status: PaymentStatus.RELEASED,
              isReleased: true,
              releasedAt: new Date()
            }
          });

          // Create payment record for remaining amount
          await tx.payment.create({
            data: {
              userId: job.assignedAgentId,
              markingJobId: jobId,
              amount: remainingPayment,
              currency: 'NGN',
              paymentType: 'PROPERTY_MARKING',
              status: PaymentStatus.SUCCESS,
              description: 'Final payment for confirmed property marking',
              paidAt: new Date(),
              isReleased: true,
              releasedAt: new Date()
            }
          });
        }

        // Update agent's completed jobs count
        await tx.user.update({
          where: { id: job.assignedAgentId },
          data: {
            completedMarkingJobs: {
              increment: 1
            }
          }
        });

        // Update agent's reliability score based on rating
        if (rating && rating >= 1 && rating <= 5) {
          const currentScore = Number(job.assignedAgent?.agentReliabilityScore || 3.0);
          const newScore = (currentScore * 0.9 + rating * 0.1); // Weighted average

          await tx.user.update({
            where: { id: job.assignedAgentId },
            data: {
              agentReliabilityScore: newScore
            }
          });
        }
      }

      // Close the queue for other agents waiting
      await tx.propertyMarkingJob.updateMany({
        where: {
          propertyId: job.propertyId,
          status: {
            in: [MarkingJobStatus.QUEUED, MarkingJobStatus.ASSIGNED]
          }
        },
        data: {
          status: MarkingJobStatus.CANCELLED,
          completionNotes: 'Job confirmed by property owner'
        }
      });
    });

    // TODO: Send notification to agent about confirmation and payment
    // TODO: Send receipt to property owner

    return res.status(200).json(
      standardResponse(true, 'Marking job confirmed successfully. Payment has been released to the agent.', {
        jobId: job.id,
        propertyId: job.propertyId,
        boundaryVerified: true
      })
    );
  } catch (error) {
    console.error('Confirm marking completion error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to confirm marking completion', null)
    );
  }
};

/**
 * Property owner rejects marking job completion
 * POST /api/confirmation/:jobId/reject
 */
export const rejectMarkingCompletion = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    const { reason, requestRemark } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    if (!reason) {
      return res.status(400).json(
        standardResponse(false, 'Rejection reason is required', null)
      );
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Verify user is the requester
    if (job.requestedBy !== userId) {
      return res.status(403).json(
        standardResponse(false, 'You are not authorized to reject this marking job', null)
      );
    }

    // Check if job is completed
    if (job.status !== MarkingJobStatus.COMPLETED) {
      return res.status(400).json(
        standardResponse(false, 'Job has not been completed yet', null)
      );
    }

    // Check if already confirmed
    if (job.property.boundaryVerified) {
      return res.status(400).json(
        standardResponse(false, 'This marking job has already been confirmed', null)
      );
    }

    // Check if confirmation window has expired
    const completedAt = job.completedAt!;
    const confirmationDeadline = new Date(completedAt);
    confirmationDeadline.setDate(confirmationDeadline.getDate() + 3);

    if (new Date() > confirmationDeadline) {
      return res.status(400).json(
        standardResponse(false, 'Confirmation window has expired. Please create a new marking job.', null)
      );
    }

    // Update job with rejection
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        completionNotes: `Rejected by property owner: ${reason}${requestRemark ? ` | Remark request: ${requestRemark}` : ''}`
      }
    });

    // Penalize agent's reliability score slightly
    if (job.assignedAgentId) {
      await prisma.user.update({
        where: { id: job.assignedAgentId },
        data: {
          agentReliabilityScore: {
            decrement: 0.3 // Reduce by 0.3 points for rejection
          }
        }
      });
    }

    // TODO: Send notification to agent about rejection
    // TODO: Ask property owner if they want to request remark or create new job

    return res.status(200).json(
      standardResponse(true, 'Marking job rejected. The agent has been notified.', {
        jobId: job.id,
        message: 'You can now create a new marking job or wait for the automatic payment installments.'
      })
    );
  } catch (error) {
    console.error('Reject marking completion error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to reject marking completion', null)
    );
  }
};

/**
 * Property owner requests remark for marking job
 * POST /api/confirmation/:jobId/request-remark
 */
export const requestRemark = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;
    const { remarkNotes } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    if (!remarkNotes) {
      return res.status(400).json(
        standardResponse(false, 'Remark notes are required', null)
      );
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Verify user is the requester
    if (job.requestedBy !== userId) {
      return res.status(403).json(
        standardResponse(false, 'You are not authorized to request remark for this job', null)
      );
    }

    // Check if job is completed
    if (job.status !== MarkingJobStatus.COMPLETED) {
      return res.status(400).json(
        standardResponse(false, 'Job has not been completed yet', null)
      );
    }

    // Check if already confirmed
    if (job.property.boundaryVerified) {
      return res.status(400).json(
        standardResponse(false, 'This marking job has already been confirmed', null)
      );
    }

    // Reset job to IN_PROGRESS for remark
    const updatedJob = await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        status: MarkingJobStatus.IN_PROGRESS,
        completionNotes: `Remark requested by property owner: ${remarkNotes}`,
        // Extend time slot for remark
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 more hours
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // TODO: Send notification to agent about remark request

    return res.status(200).json(
      standardResponse(true, 'Remark requested successfully. The agent has been notified.', updatedJob)
    );
  } catch (error) {
    console.error('Request remark error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to request remark', null)
    );
  }
};

/**
 * Get confirmation status for a marking job
 * GET /api/confirmation/:jobId/status
 */
export const getConfirmationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.params;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          select: {
            id: true,
            boundaryVerified: true,
            boundaryCoordinates: true,
            boundaryImages: true
          }
        }
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
      job.requestedBy === userId ||
      job.assignedAgentId === userId;

    if (!isAuthorized) {
      return res.status(403).json(
        standardResponse(false, 'You are not authorized to view this confirmation status', null)
      );
    }

    // Calculate confirmation window info
    let confirmationInfo: any = null;
    if (job.status === MarkingJobStatus.COMPLETED && !job.property.boundaryVerified) {
      const completedAt = job.completedAt!;
      const confirmationDeadline = new Date(completedAt);
      confirmationDeadline.setDate(confirmationDeadline.getDate() + 3);

      const now = new Date();
      const timeRemaining = Math.max(0, confirmationDeadline.getTime() - now.getTime());

      confirmationInfo = {
        deadline: confirmationDeadline,
        timeRemainingMs: timeRemaining,
        timeRemainingDays: (timeRemaining / (1000 * 60 * 60 * 24)).toFixed(2),
        isExpiringSoon: timeRemaining < 1000 * 60 * 60 * 24, // Less than 1 day
        hasExpired: timeRemaining === 0,
        canConfirm: timeRemaining > 0,
        canReject: timeRemaining > 0
      };
    }

    const status = {
      jobId: job.id,
      status: job.status,
      isCompleted: job.status === MarkingJobStatus.COMPLETED,
      isConfirmed: job.property.boundaryVerified,
      completedAt: job.completedAt,
      confirmationInfo
    };

    return res.status(200).json(
      standardResponse(true, 'Confirmation status retrieved successfully', status)
    );
  } catch (error) {
    console.error('Get confirmation status error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve confirmation status', null)
    );
  }
};

/**
 * Get confirmation history for property owner
 * GET /api/confirmation/history
 */
export const getConfirmationHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {
      requestedBy: userId,
      status: MarkingJobStatus.COMPLETED
    };

    if (status === 'confirmed') {
      where.property = { boundaryVerified: true };
    } else if (status === 'pending') {
      where.property = { boundaryVerified: false };
    }

    const [history, total] = await Promise.all([
      prisma.propertyMarkingJob.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { completedAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              boundaryVerified: true,
              boundaryImages: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              agentReliabilityScore: true
            }
          }
        }
      }),
      prisma.propertyMarkingJob.count({ where })
    ]);

    return res.status(200).json(
      standardResponse(true, 'Confirmation history retrieved successfully', {
        history,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      })
    );
  } catch (error) {
    console.error('Get confirmation history error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve confirmation history', null)
    );
  }
};