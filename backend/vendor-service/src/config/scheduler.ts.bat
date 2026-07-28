import cron from 'node-cron';
import { PrismaClient } from '@newcondo/db';
import { ReleaseService } from '../services/releaseService';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();
const releaseService = new ReleaseService();
const notificationService = new NotificationService();

export class PaymentScheduler {
  private static instance: PaymentScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  static getInstance(): PaymentScheduler {
    if (!PaymentScheduler.instance) {
      PaymentScheduler.instance = new PaymentScheduler();
    }
    return PaymentScheduler.instance;
  }

  // Initialize all scheduled jobs
  initialize() {
    console.log('Initializing payment scheduler...');

    // Check for expired confirmation periods every 5 minutes
    this.scheduleConfirmationCheck();

    // Process payment releases every 5 minutes
    this.schedulePaymentReleases();

    // Send confirmation reminders every hour
    this.scheduleConfirmationReminders();

    // Clean up expired payment locks every 10 minutes
    this.schedulePaymentLockCleanup();

    console.log('Payment scheduler initialized successfully');
  }

  // Check for expired confirmation periods
  private scheduleConfirmationCheck() {
    const task = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running confirmation period check...');
        
        const expiredPayments = await prisma.payment.findMany({
          where: {
            status: 'HELD',
            confirmationPeriodEnd: {
              lte: new Date(),
            },
            isReleased: false,
          },
          include: {
            rental: {
              include: {
                property: true,
                renter: true,
              },
            },
            user: true,
          },
        });

        console.log(`Found ${expiredPayments.length} payments ready for release`);

        for (const payment of expiredPayments) {
          try {
            // Check if rental is confirmed
            if (payment.rental && !payment.rental.isConfirmed) {
              // Auto-confirm if renter didn't dispute
              await prisma.rental.update({
                where: { id: payment.rentalId! },
                data: {
                  isConfirmed: true,
                  confirmedAt: new Date(),
                },
              });

              console.log(`Auto-confirmed rental ${payment.rentalId}`);
            }

            // Trigger payment release
            await releaseService.releasePayment(payment.id);
            
            console.log(`Released payment ${payment.id}`);
          } catch (error) {
            console.error(`Error processing payment ${payment.id}:`, error);
            
            // Log failed release for admin review
            await prisma.adminAction.create({
              data: {
                adminId: 'SYSTEM',
                action: 'PAYMENT_RELEASE_FAILED',
                targetType: 'Payment',
                targetId: payment.id,
                description: `Automatic payment release failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                metadata: {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString(),
                },
              },
            });
          }
        }
      } catch (error) {
        console.error('Error in confirmation check:', error);
      }
    });

    this.jobs.set('confirmationCheck', task);
    console.log('Scheduled confirmation check job');
  }

  // Process payment releases
  private schedulePaymentReleases() {
    const task = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Running payment release processor...');
        
        const releasablePayments = await prisma.payment.findMany({
          where: {
            status: 'HELD',
            isReleased: false,
            confirmationPeriodEnd: {
              lte: new Date(),
            },
            rental: {
              isConfirmed: true,
            },
          },
          take: 50, // Process in batches
        });

        console.log(`Processing ${releasablePayments.length} payment releases`);

        for (const payment of releasablePayments) {
          try {
            await releaseService.releasePayment(payment.id);
          } catch (error) {
            console.error(`Failed to release payment ${payment.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in payment release processor:', error);
      }
    });

    this.jobs.set('paymentReleases', task);
    console.log('Scheduled payment release job');
  }

  // Send confirmation reminders
  private scheduleConfirmationReminders() {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Sending confirmation reminders...');
        
        const now = new Date();
        const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

        const upcomingDeadlines = await prisma.payment.findMany({
          where: {
            status: 'HELD',
            isReleased: false,
            confirmationPeriodEnd: {
              gte: now,
              lte: in6Hours,
            },
            rental: {
              isConfirmed: false,
            },
          },
          include: {
            rental: {
              include: {
                property: true,
                renter: true,
              },
            },
          },
        });

        console.log(`Sending reminders for ${upcomingDeadlines.length} payments`);

        for (const payment of upcomingDeadlines) {
          try {
            await notificationService.sendConfirmationReminder({
              paymentId: payment.id,
              renterEmail: payment.rental!.renter.email,
              renterPhone: payment.rental!.renter.phone || undefined,
              propertyTitle: payment.rental!.property.title,
              deadline: payment.confirmationPeriodEnd!,
            });
          } catch (error) {
            console.error(`Failed to send reminder for payment ${payment.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error sending confirmation reminders:', error);
      }
    });

    this.jobs.set('confirmationReminders', task);
    console.log('Scheduled confirmation reminder job');
  }

  // Clean up expired payment locks
  private schedulePaymentLockCleanup() {
    const task = cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('Cleaning up expired payment locks...');
        
        const result = await prisma.$transaction([
          // Clean up property locks
          prisma.property.updateMany({
            where: {
              isPaymentLocked: true,
              paymentLockExpiry: {
                lte: new Date(),
              },
            },
            data: {
              isPaymentLocked: false,
              paymentLockExpiry: null,
            },
          }),
          // Clean up unit locks
          prisma.propertyUnit.updateMany({
            where: {
              isPaymentLocked: true,
              paymentLockExpiry: {
                lte: new Date(),
              },
            },
            data: {
              isPaymentLocked: false,
              paymentLockExpiry: null,
            },
          }),
        ]);

        console.log(`Cleaned up ${result[0].count} property locks and ${result[1].count} unit locks`);
      } catch (error) {
        console.error('Error cleaning up payment locks:', error);
      }
    });

    this.jobs.set('paymentLockCleanup', task);
    console.log('Scheduled payment lock cleanup job');
  }

  // Stop all jobs
  stopAll() {
    console.log('Stopping all scheduled jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  // Get job status
  getStatus() {
    const status: Record<string, boolean> = {};
    this.jobs.forEach((job, name) => {
      status[name] = true;
    });
    return status;
  }
}

export default PaymentScheduler.getInstance();