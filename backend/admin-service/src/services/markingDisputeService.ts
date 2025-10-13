// backend/admin-service/src/services/markingDisputeService.ts

import { PrismaClient } from "@newcondo/db";
import {
  PropertyMarkingJob,
  MarkingJobStatus,
  Payment,
  PaymentStatus,
} from "@newcondo/db";

interface MarkingDispute {
  id: string;
  jobId: string;
  propertyId: string;
  disputedBy: string;
  reason: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

enum DisputeStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  APPEALED = "APPEALED",
  CLOSED = "CLOSED",
}

interface DisputeResolution {
  outcome: "APPROVED" | "REJECTED" | "PARTIAL_REFUND";
  reason: string;
  compensationAmount?: number;
  refundAmount?: number;
  compensationReason?: string;
}

class MarkingDisputeService {
  private prisma: PrismaClient;
  private DISPUTE_RESOLUTION_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new marking dispute
   */
  async createDispute(
    jobId: string,
    disputedBy: string,
    reason: string,
    evidence: string[] = []
  ): Promise<MarkingDispute> {
    // Verify job exists and belongs to user
    const job = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Marking job not found");
    }

    if (job.requestedBy !== disputedBy && job.assignedAgentId !== disputedBy) {
      throw new Error(
        "Only job owner or assigned agent can create disputes"
      );
    }

    // Check if dispute already exists for this job
    const existingDispute = await this.prisma.propertyMarkingJob.findFirst({
      where: {
        id: jobId,
      },
    });

    if (existingDispute && existingDispute.status === MarkingJobStatus.COMPLETED) {
      // Job is already completed, can create a dispute
    }

    // Create dispute record in database
    // Note: You may need to add a DisputeTicket model to your Prisma schema
    const dispute: MarkingDispute = {
      id: this.generateDisputeId(),
      jobId,
      propertyId: job.propertyId,
      disputedBy,
      reason,
      evidence,
      status: DisputeStatus.OPEN,
      createdAt: new Date(),
    };

    // Here you would save to DB if you add DisputeTicket model
    // For now, we'll structure the response appropriately

    return dispute;
  }

  /**
   * Get all open disputes
   */
  async getOpenDisputes() {
    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        // Query for jobs that might have disputes
        // This would be better with a Dispute model in schema
        status: MarkingJobStatus.COMPLETED,
      },
      include: {
        property: true,
        requestingUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return jobs;
  }

  /**
   * Get disputes for a specific marking job
   */
  async getJobDisputes(jobId: string) {
    const job = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: true,
        requestingUser: true,
        assignedAgent: true,
      },
    });

    if (!job) {
      throw new Error("Marking job not found");
    }

    return {
      jobId,
      job,
      // Disputes would be fetched from a Dispute model if it exists
    };
  }

  /**
   * Review and validate dispute claim
   */
  async reviewDispute(
    jobId: string,
    adminId: string
  ): Promise<{
    isValid: boolean;
    issues: string[];
    recommendedAction: string;
  }> {
    const job = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        completionImages: true,
        property: true,
        assignedAgent: true,
      },
    });

    if (!job) {
      throw new Error("Marking job not found");
    }

    const issues: string[] = [];
    let isValid = true;

    // Check if completion images exist
    if (!job.completionImages || job.completionImages.length === 0) {
      issues.push("No completion images provided");
      isValid = false;
    }

    // Check if boundary data exists
    if (!job.boundaryData) {
      issues.push("No boundary data marked");
      isValid = false;
    }

    // Check time taken for completion
    if (job.completedAt && job.createdAt) {
      const timeTaken =
        (new Date(job.completedAt).getTime() -
          new Date(job.createdAt).getTime()) /
        (1000 * 60);
      if (timeTaken < 5) {
        issues.push("Completion time suspiciously short (less than 5 minutes)");
      }
    }

    // Check for notes
    if (!job.completionNotes || job.completionNotes.trim().length === 0) {
      issues.push("No completion notes provided");
    }

    const recommendedAction =
      issues.length === 0
        ? "APPROVE - No issues detected"
        : issues.length <= 2
          ? "REVIEW - Minor issues detected, may still be valid"
          : "REJECT - Multiple issues detected";

    return {
      isValid: issues.length === 0,
      issues,
      recommendedAction,
    };
  }

  /**
   * Resolve a dispute with compensation or rejection
   */
  async resolveDispute(
    jobId: string,
    adminId: string,
    resolution: DisputeResolution
  ): Promise<void> {
    const job = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        assignedAgent: true,
        requestingUser: true,
      },
    });

    if (!job) {
      throw new Error("Marking job not found");
    }

    // Get associated payment
    const payment = await this.prisma.payment.findFirst({
      where: {
        markingJobId: jobId,
      },
    });

    // Handle different resolution outcomes
    if (resolution.outcome === "APPROVED") {
      await this.approveMarkingJob(job, payment);
    } else if (resolution.outcome === "REJECTED") {
      await this.rejectMarkingJob(job, payment, resolution.reason);
    } else if (resolution.outcome === "PARTIAL_REFUND") {
      await this.processPartialRefund(
        job,
        payment,
        resolution.refundAmount || 0,
        resolution.compensationAmount || 0
      );
    }

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId,
        action: "BOUNDARY_DISPUTE_RESOLVED",
        targetType: "PropertyMarkingJob",
        targetId: jobId,
        description: resolution.reason,
        metadata: {
          outcome: resolution.outcome,
          compensationAmount: resolution.compensationAmount,
          refundAmount: resolution.refundAmount,
        },
      },
    });
  }

  /**
   * Approve a disputed marking job
   */
  private async approveMarkingJob(
    job: any,
    payment: Payment | null
  ): Promise<void> {
    // Update marking job status
    await this.prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: MarkingJobStatus.COMPLETED,
      },
    });

    // Release payment if held
    if (payment && payment.status === PaymentStatus.HELD) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
        },
      });

      // Credit agent's virtual account
      if (job.assignedAgent) {
        const virtualAccount = await this.prisma.virtualAccount.findFirst({
          where: { userId: job.assignedAgent.id },
        });

        if (virtualAccount) {
          await this.prisma.virtualAccount.update({
            where: { id: virtualAccount.id },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });
        }
      }
    }
  }

  /**
   * Reject a disputed marking job and process refund
   */
  private async rejectMarkingJob(
    job: any,
    payment: Payment | null,
    reason: string
  ): Promise<void> {
    // Update marking job status
    await this.prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: MarkingJobStatus.CANCELLED,
      },
    });

    // Process full refund
    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      // Refund to user's virtual account
      const userVirtualAccount = await this.prisma.virtualAccount.findFirst({
        where: { userId: job.requestedBy },
      });

      if (userVirtualAccount) {
        await this.prisma.virtualAccount.update({
          where: { id: userVirtualAccount.id },
          data: {
            balance: {
              increment: payment.amount,
            },
          },
        });
      }
    }
  }

  /**
   * Process partial refund for disputed marking job
   */
  private async processPartialRefund(
    job: any,
    payment: Payment | null,
    refundAmount: number,
    compensationAmount: number
  ): Promise<void> {
    if (!payment) {
      throw new Error("Payment not found for this marking job");
    }

    // Update marking job status
    await this.prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: MarkingJobStatus.COMPLETED,
      },
    });

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.RELEASED,
        isReleased: true,
        releasedAt: new Date(),
      },
    });

    // Process refund to property owner
    if (refundAmount > 0) {
      const ownerVirtualAccount = await this.prisma.virtualAccount.findFirst({
        where: { userId: job.requestedBy },
      });

      if (ownerVirtualAccount) {
        await this.prisma.virtualAccount.update({
          where: { id: ownerVirtualAccount.id },
          data: {
            balance: {
              increment: refundAmount,
            },
          },
        });
      }
    }

    // Process compensation to agent
    if (compensationAmount > 0 && job.assignedAgent) {
      const agentVirtualAccount = await this.prisma.virtualAccount.findFirst({
        where: { userId: job.assignedAgent.id },
      });

      if (agentVirtualAccount) {
        await this.prisma.virtualAccount.update({
          where: { id: agentVirtualAccount.id },
          data: {
            balance: {
              increment: compensationAmount,
            },
          },
        });
      }
    }
  }

  /**
   * Handle appeal of dispute resolution
   */
  async appealDispute(
    jobId: string,
    userId: string,
    appealReason: string,
    evidence: string[]
  ): Promise<void> {
    const job = await this.prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Marking job not found");
    }

    // Verify user is involved in the job
    if (job.requestedBy !== userId && job.assignedAgentId !== userId) {
      throw new Error("User is not involved in this marking job");
    }

    // Create new support ticket for appeal
    await this.prisma.supportTicket.create({
      data: {
        userId,
        title: `Appeal - Marking Job Dispute #${jobId}`,
        description: `Appeal Reason: ${appealReason}\n\nEvidence: ${evidence.join(
          ", "
        )}`,
        category: "PROPERTY",
        priority: "HIGH",
      },
    });
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(startDate?: Date, endDate?: Date) {
    const jobs = await this.prisma.propertyMarkingJob.findMany({
      where: {
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      include: {
        assignedAgent: true,
      },
    });

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(
      (j) => j.status === MarkingJobStatus.COMPLETED
    ).length;
    const expiredJobs = jobs.filter(
      (j) => j.status === MarkingJobStatus.EXPIRED
    ).length;

    const disputeRate =
      totalJobs > 0 ? ((expiredJobs + 0) / totalJobs) * 100 : 0;

    return {
      totalJobs,
      completedJobs,
      expiredJobs,
      disputeRate: Math.round(disputeRate * 100) / 100,
      averageResolutionTime: await this.calculateAverageResolutionTime(jobs),
    };
  }

  /**
   * Calculate average dispute resolution time
   */
  private async calculateAverageResolutionTime(jobs: any[]): Promise<number> {
    const resolutionTimes = jobs
      .filter((j) => j.completedAt && j.createdAt)
      .map(
        (j) =>
          (new Date(j.completedAt).getTime() -
            new Date(j.createdAt).getTime()) /
          (1000 * 60 * 60)
      );

    return resolutionTimes.length > 0
      ? Math.round(
          (resolutionTimes.reduce((a, b) => a + b, 0) /
            resolutionTimes.length) *
            100
        ) / 100
      : 0;
  }

  /**
   * Generate unique dispute ID
   */
  private generateDisputeId(): string {
    return `DISPUTE-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

export default MarkingDisputeService;