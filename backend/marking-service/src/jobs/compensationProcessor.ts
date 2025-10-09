// backend/marking-service/src/jobs/compensationProcessor.ts

import { PrismaClient } from '@newcondo/db';
import cron from 'node-cron';
import { 
  CompensationCalculation, 
  CompensationProcessResult,
  PartialCompensationPayment 
} from '../types/compensation';
import { MarkingJobStatus, PaymentStatus } from '../types/markingJob';

const prisma = new PrismaClient();

/**
 * Compensation Processor
 * 
 * Handles partial compensation payments to agents when:
 * 1. Property owner doesn't confirm within 2-3 day window
 * 2. Agent completed marking but owner hasn't verified
 * 3. Processes incremental payments until marking fee is exhausted
 */
class CompensationProcessor {
  private readonly PARTIAL_COMPENSATION_AMOUNT = 1000; // NGN
  private readonly MARKING_FEE = 20000; // NGN
  private readonly VERIFICATION_WINDOW_HOURS = 72; // 3 days
  private readonly AGENT_COMMISSION_RATE = 0.25; // 25%
  private readonly INITIAL_PAYMENT = 1000; // NGN - paid when marking is done

  /**
   * Start the compensation processor cron job
   * Runs every hour to check for expired verification windows
   */
  startProcessor(): void {
    console.log('📊 Starting Compensation Processor...');
    
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running compensation check...');
      await this.processExpiredVerifications();
    });

    // Also run immediately on startup
    this.processExpiredVerifications().catch(console.error);
  }

  /**
   * Process all marking jobs with expired verification windows
   */
  private async processExpiredVerifications(): Promise<void> {
    try {
      // Find completed marking jobs where verification window has expired
      const expiredJobs = await prisma.propertyMarkingJob.findMany({
        where: {
          status: MarkingJobStatus.COMPLETED,
          completedAt: {
            lte: new Date(Date.now() - this.VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000)
          },
          // Only process if there's still marking fee available
          markingFee: {
            gt: 0
          }
        },
        include: {
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              virtualAccounts: {
                where: {
                  isActive: true
                },
                take: 1
              }
            }
          },
          requestingUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true
            }
          }
        }
      });

      console.log(`📋 Found ${expiredJobs.length} expired verification jobs`);

      const results: CompensationProcessResult[] = [];

      for (const job of expiredJobs) {
        try {
          const result = await this.processJobCompensation(job);
          results.push(result);
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          results.push({
            jobId: job.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            compensationPaid: 0
          });
        }
      }

      // Log summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalPaid = results.reduce((sum, r) => sum + r.compensationPaid, 0);

      console.log(`✅ Compensation processing complete:`);
      console.log(`   - Successful: ${successful}`);
      console.log(`   - Failed: ${failed}`);
      console.log(`   - Total compensation paid: ₦${totalPaid.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Error in compensation processor:', error);
      throw error;
    }
  }

  /**
   * Process compensation for a single marking job
   */
  private async processJobCompensation(job: any): Promise<CompensationProcessResult> {
    const calculation = this.calculateCompensation(job);

    // Check if job has exhausted the marking fee
    if (calculation.remainingFee <= 0) {
      console.log(`⚠️  Job ${job.id} has exhausted marking fee. Closing job.`);
      
      await prisma.propertyMarkingJob.update({
        where: { id: job.id },
        data: {
          status: MarkingJobStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      return {
        jobId: job.id,
        success: true,
        compensationPaid: 0,
        message: 'Job closed - marking fee exhausted',
        jobClosed: true
      };
    }

    // Process payment to agent
    const payment = await this.processAgentPayment(job, calculation);

    // Notify property owner about continued compensation
    await this.notifyOwnerAboutCompensation(job, calculation);

    return {
      jobId: job.id,
      success: true,
      compensationPaid: calculation.compensationAmount,
      remainingFee: calculation.remainingFee,
      paymentId: payment.id,
      nextCompensationDate: new Date(Date.now() + this.VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000)
    };
  }

  /**
   * Calculate compensation details for a marking job
   */
  private calculateCompensation(job: any): CompensationCalculation {
    const currentFee = Number(job.markingFee);
    const compensationAmount = Math.min(
      this.PARTIAL_COMPENSATION_AMOUNT,
      currentFee
    );
    const remainingFee = currentFee - compensationAmount;

    return {
      jobId: job.id,
      currentFee,
      compensationAmount,
      remainingFee,
      isFullyPaid: remainingFee <= 0,
      completedAt: job.completedAt,
      daysExpired: Math.floor(
        (Date.now() - new Date(job.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * Process payment to agent's virtual account
   */
  private async processAgentPayment(
    job: any, 
    calculation: CompensationCalculation
  ): Promise<PartialCompensationPayment> {
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: job.assignedAgentId,
        markingJobId: job.id,
        amount: calculation.compensationAmount,
        currency: 'NGN',
        paymentType: 'PROPERTY_MARKING',
        status: PaymentStatus.SUCCESS,
        description: `Partial compensation for marking job - Property: ${job.property.title}`,
        paidAt: new Date(),
        isReleased: true,
        releasedAt: new Date()
      }
    });

    // Update agent's virtual account balance
    if (job.assignedAgent.virtualAccounts.length > 0) {
      const virtualAccount = job.assignedAgent.virtualAccounts[0];
      
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: calculation.compensationAmount
          }
        }
      });
    }

    // Update marking job with new remaining fee
    await prisma.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        markingFee: calculation.remainingFee,
        updatedAt: new Date()
      }
    });

    console.log(`💰 Paid ₦${calculation.compensationAmount} to agent ${job.assignedAgent.name} for job ${job.id}`);

    return {
      id: payment.id,
      jobId: job.id,
      agentId: job.assignedAgentId,
      amount: calculation.compensationAmount,
      remainingFee: calculation.remainingFee,
      paidAt: new Date(),
      description: payment.description || ''
    };
  }

  /**
   * Notify property owner about ongoing compensation payments
   */
  private async notifyOwnerAboutCompensation(
    job: any,
    calculation: CompensationCalculation
  ): Promise<void> {
    // This will be picked up by the notification dispatcher
    await prisma.eventLog.create({
      data: {
        userId: job.requestedBy,
        type: 'MARKING_COMPENSATION_PAID',
        metadata: {
          jobId: job.id,
          propertyId: job.propertyId,
          propertyTitle: job.property.title,
          compensationPaid: calculation.compensationAmount,
          remainingFee: calculation.remainingFee,
          daysExpired: calculation.daysExpired,
          agentName: job.assignedAgent.name,
          message: calculation.isFullyPaid
            ? 'All marking fees have been paid to the agent. Please initiate a new marking job if needed.'
            : `₦${calculation.compensationAmount} has been paid to the agent. ₦${calculation.remainingFee} remains. Please verify the property marking.`
        }
      }
    });

    console.log(`📧 Notified owner ${job.requestingUser.name} about compensation payment`);
  }

  /**
   * Process initial payment when agent completes marking
   * This is called when marking is first completed
   */
  async processInitialCompletionPayment(jobId: string): Promise<void> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        assignedAgent: {
          include: {
            virtualAccounts: {
              where: { isActive: true },
              take: 1
            }
          }
        },
        property: true
      }
    });

    if (!job || !job.assignedAgentId) {
      throw new Error('Job not found or no assigned agent');
    }

    // Pay initial small amount (1000 NGN)
    const payment = await prisma.payment.create({
      data: {
        userId: job.assignedAgentId,
        markingJobId: job.id,
        amount: this.INITIAL_PAYMENT,
        currency: 'NGN',
        paymentType: 'PROPERTY_MARKING',
        status: PaymentStatus.HELD, // Held until owner verification
        description: `Initial payment for marking job - Property: ${job.property.title}`,
        confirmationPeriodEnd: new Date(Date.now() + this.VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000)
      }
    });

    // Update virtual account
    if (job.assignedAgent.virtualAccounts.length > 0) {
      await prisma.virtualAccount.update({
        where: { id: job.assignedAgent.virtualAccounts[0].id },
        data: {
          balance: {
            increment: this.INITIAL_PAYMENT
          }
        }
      });
    }

    console.log(`💰 Initial payment of ₦${this.INITIAL_PAYMENT} held for agent on job ${jobId}`);
  }

  /**
   * Release full payment when owner verifies marking
   */
  async releaseFullPayment(jobId: string): Promise<void> {
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        assignedAgent: {
          include: {
            virtualAccounts: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    });

    if (!job || !job.assignedAgentId) {
      throw new Error('Job not found or no assigned agent');
    }

    const remainingAmount = Number(job.markingFee) - this.INITIAL_PAYMENT;
    const totalAgentCommission = this.MARKING_FEE * this.AGENT_COMMISSION_RATE;

    // Release remaining payment to agent
    const payment = await prisma.payment.create({
      data: {
        userId: job.assignedAgentId,
        markingJobId: job.id,
        amount: totalAgentCommission - this.INITIAL_PAYMENT,
        currency: 'NGN',
        paymentType: 'PROPERTY_MARKING',
        status: PaymentStatus.RELEASED,
        description: 'Final payment for verified marking job',
        paidAt: new Date(),
        isReleased: true,
        releasedAt: new Date()
      }
    });

    // Update virtual account
    if (job.assignedAgent.virtualAccounts.length > 0) {
      await prisma.virtualAccount.update({
        where: { id: job.assignedAgent.virtualAccounts[0].id },
        data: {
          balance: {
            increment: totalAgentCommission - this.INITIAL_PAYMENT
          }
        }
      });
    }

    // Update the held payment status
    await prisma.payment.updateMany({
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

    // Mark job fee as fully paid
    await prisma.propertyMarkingJob.update({
      where: { id: jobId },
      data: {
        markingFee: 0, // All paid out
        paymentStatus: PaymentStatus.RELEASED
      }
    });

    console.log(`✅ Released full payment of ₦${totalAgentCommission} to agent for job ${jobId}`);
  }
}

// Export singleton instance
export const compensationProcessor = new CompensationProcessor();

// Auto-start if running directly
if (require.main === module) {
  compensationProcessor.startProcessor();
  console.log('💼 Compensation Processor running...');
}