import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { commissionService } from './commissionService';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled jobs
   */
  initialize(): void {
    this.schedulePaymentReleases();
    this.scheduleConfirmationDeadlineCheck();
    this.schedulePropertyUnlock();
    
    console.log('✅ Scheduler service initialized');
  }

  /**
   * Schedule automatic payment releases (runs every hour)
   */
  private schedulePaymentReleases(): void {
    // Run every hour
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🔄 Running scheduled payment releases...');
      
      try {
        await this.processPaymentReleases();
      } catch (error) {
        console.error('❌ Error processing payment releases:', error);
      }
    });

    this.jobs.set('payment-releases', job);
  }

  /**
   * Check for confirmation deadline expirations (runs every 30 minutes)
   */
  private scheduleConfirmationDeadlineCheck(): void {
    // Run every 30 minutes
    const job = cron.schedule('*/30 * * * *', async () => {
      console.log('🔄 Checking confirmation deadlines...');
      
      try {
        await this.checkConfirmationDeadlines();
      } catch (error) {
        console.error('❌ Error checking confirmation deadlines:', error);
      }
    });

    this.jobs.set('confirmation-deadline-check', job);
  }

  /**
   * Unlock properties after payment lock expiry (runs every 15 minutes)
   */
  private schedulePropertyUnlock(): void {
    // Run every 15 minutes
    const job = cron.schedule('*/15 * * * *', async () => {
      console.log('🔄 Unlocking expired payment locks...');
      
      try {
        await this.unlockExpiredProperties();
      } catch (error) {
        console.error('❌ Error unlocking properties:', error);
      }
    });

    this.jobs.set('property-unlock', job);
  }

  /**
   * Process all payments ready for release
   */
  async processPaymentReleases(): Promise<void> {
    const now = new Date();

    // Find all payments where confirmation period has ended
    const paymentsToRelease = await prisma.payment.findMany({
      where: {
        status: 'HELD',
        isReleased: false,
        confirmationPeriodEnd: {
          lte: now,
        },
        rental: {
          isConfirmed: true, // Only release if rental is confirmed
        },
      },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    console.log(`Found ${paymentsToRelease.length} payments ready for release`);

    for (const payment of paymentsToRelease) {
      try {
        // Distribute commission
        const distribution = await commissionService.distributeCommission(payment.id);

        console.log(`✅ Released payment ${payment.id}:`, {
          ownerAmount: distribution.ownerAmount.toString(),
          agentAmount: distribution.listingAgentAmount?.toString(),
          platformFee: distribution.platformFee.toString(),
        });

        // Send notifications
        await this.sendReleaseNotifications(payment.id, distribution);

        // Update rental status
        await prisma.rental.update({
          where: { id: payment.rentalId! },
          data: {
            status: 'ACTIVE',
          },
        });

        // Unlock property
        if (payment.rental) {
          await prisma.property.update({
            where: { id: payment.rental.propertyId },
            data: {
              isPaymentLocked: false,
              paymentLockExpiry: null,
            },
          });

          // Unlock unit if applicable
          if (payment.rental.unitId) {
            await prisma.propertyUnit.update({
              where: { id: payment.rental.unitId },
              data: {
                isPaymentLocked: false,
                paymentLockExpiry: null,
                status: 'OCCUPIED',
              },
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error releasing payment ${payment.id}:`, error);
        
        // Log error for manual intervention
        await prisma.eventLog.create({
          data: {
            type: 'PAYMENT_RELEASE_ERROR',
            metadata: {
              paymentId: payment.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
      }
    }
  }

  /**
   * Check for rentals that exceeded confirmation deadline without confirmation
   */
  async checkConfirmationDeadlines(): Promise<void> {
    const now = new Date();

    // Find rentals where confirmation deadline has passed but not confirmed
    const expiredRentals = await prisma.rental.findMany({
      where: {
        confirmationDeadline: {
          lte: now,
        },
        isConfirmed: false,
        status: 'PENDING_CONFIRMATION',
      },
      include: {
        payments: true,
        property: true,
        renter: true,
      },
    });

    console.log(`Found ${expiredRentals.length} rentals with expired confirmation deadlines`);

    for (const rental of expiredRentals) {
      try {
        // Auto-confirm the rental (renter didn't dispute within 24 hours)
        await prisma.rental.update({
          where: { id: rental.id },
          data: {
            isConfirmed: true,
            confirmedAt: new Date(),
          },
        });

        console.log(`✅ Auto-confirmed rental ${rental.id} (no dispute within 24 hours)`);

        // Log the auto-confirmation
        await prisma.eventLog.create({
          data: {
            userId: rental.renterId,
            type: 'RENTAL_AUTO_CONFIRMED',
            metadata: {
              rentalId: rental.id,
              propertyId: rental.propertyId,
              reason: 'No dispute within 24-hour confirmation period',
            },
          },
        });

        // Send notification to renter
        await this.sendAutoConfirmationNotification(rental.id);
      } catch (error) {
        console.error(`❌ Error auto-confirming rental ${rental.id}:`, error);
      }
    }
  }

  /**
   * Unlock properties with expired payment locks
   */
  async unlockExpiredProperties(): Promise<void> {
    const now = new Date();

    // Unlock properties
    const unlockedProperties = await prisma.property.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lte: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    // Unlock units
    const unlockedUnits = await prisma.propertyUnit.updateMany({
      where: {
        isPaymentLocked: true,
        paymentLockExpiry: {
          lte: now,
        },
      },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
      },
    });

    if (unlockedProperties.count > 0 || unlockedUnits.count > 0) {
      console.log(`✅ Unlocked ${unlockedProperties.count} properties and ${unlockedUnits.count} units`);
    }
  }

  /**
   * Send notifications when payment is released
   */
  private async sendReleaseNotifications(
    paymentId: string,
    distribution: any
  ): Promise<void> {
    // This would integrate with your notification service
    // For now, we'll just log to event log
    await prisma.eventLog.create({
      data: {
        type: 'PAYMENT_RELEASED',
        metadata: {
          paymentId,
          distribution: {
            ownerAmount: distribution.ownerAmount.toString(),
            agentAmount: distribution.listingAgentAmount?.toString(),
            subAgentAmount: distribution.subAgentAmount?.toString(),
            platformFee: distribution.platformFee.toString(),
          },
        },
      },
    });
  }

  /**
   * Send notification for auto-confirmed rental
   */
  private async sendAutoConfirmationNotification(rentalId: string): Promise<void> {
    // This would integrate with your notification service
    await prisma.eventLog.create({
      data: {
        type: 'AUTO_CONFIRMATION_NOTIFICATION_SENT',
        metadata: {
          rentalId,
        },
      },
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getJobStatus(): { name: string; running: boolean }[] {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: job.getStatus() === 'scheduled',
    }));
  }
}

export const schedulerService = new SchedulerService();