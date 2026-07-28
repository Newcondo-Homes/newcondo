import cron from 'node-cron';
import { prisma } from '@newcondo/db';
import { notificationService } from '../services/notificationService';

interface DeadlineCheckResult {
  totalChecked: number;
  remindersSet: number;
  expiringSoon: number;
  expired: number;
}

class ConfirmationDeadlineChecker {
  private isRunning = false;

  /**
   * Check confirmation deadlines and send reminders
   * Runs every 6 hours
   */
  start() {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      if (this.isRunning) {
        console.log('[DeadlineChecker] Previous job still running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('[DeadlineChecker] Starting deadline check job');

      try {
        const result = await this.checkDeadlines();
        console.log('[DeadlineChecker] Job completed:', result);
      } catch (error) {
        console.error('[DeadlineChecker] Job failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('[DeadlineChecker] Scheduler started - runs every 6 hours');
  }

  /**
   * Check all pending confirmations and send appropriate notifications
   */
  private async checkDeadlines(): Promise<DeadlineCheckResult> {
    const result: DeadlineCheckResult = {
      totalChecked: 0,
      remindersSet: 0,
      expiringSoon: 0,
      expired: 0,
    };

    try {
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      // Find all rentals with pending confirmations
      const pendingRentals = await prisma.rental.findMany({
        where: {
          status: 'PENDING_CONFIRMATION',
          isConfirmed: false,
          confirmationDeadline: {
            not: null,
          },
        },
        include: {
          renter: true,
          property: {
            include: {
              owner: true,
              agent: true,
            },
          },
          unit: true,
          payments: {
            where: { status: 'HELD' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      result.totalChecked = pendingRentals.length;
      console.log(`[DeadlineChecker] Checking ${pendingRentals.length} pending confirmations`);

      for (const rental of pendingRentals) {
        if (!rental.confirmationDeadline) continue;

        const hoursUntilDeadline = 
          (rental.confirmationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Already expired
        if (hoursUntilDeadline <= 0) {
          result.expired++;
          console.log(`[DeadlineChecker] Rental ${rental.id} deadline expired`);
          continue;
        }

        // Expiring within 6 hours - send urgent reminder
        if (hoursUntilDeadline <= 6) {
          result.expiringSoon++;
          await this.sendUrgentReminder(rental);
          console.log(`[DeadlineChecker] Sent urgent reminder for rental ${rental.id}`);
        }
        // Expiring within 12 hours - send reminder
        else if (hoursUntilDeadline <= 12) {
          result.remindersSet++;
          await this.sendReminder(rental);
          console.log(`[DeadlineChecker] Sent reminder for rental ${rental.id}`);
        }
      }

      return result;
    } catch (error) {
      console.error('[DeadlineChecker] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Send standard reminder notification
   */
  private async sendReminder(rental: any) {
    const hoursRemaining = Math.floor(
      (rental.confirmationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    try {
      await notificationService.sendConfirmationReminder({
        userId: rental.renterId,
        rentalId: rental.id,
        propertyTitle: rental.property.title,
        hoursRemaining,
        urgency: 'NORMAL',
      });
    } catch (error) {
      console.error(`[DeadlineChecker] Failed to send reminder for rental ${rental.id}:`, error);
    }
  }

  /**
   * Send urgent reminder notification
   */
  private async sendUrgentReminder(rental: any) {
    const hoursRemaining = Math.floor(
      (rental.confirmationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    );

    try {
      await notificationService.sendConfirmationReminder({
        userId: rental.renterId,
        rentalId: rental.id,
        propertyTitle: rental.property.title,
        hoursRemaining,
        urgency: 'URGENT',
      });
    } catch (error) {
      console.error(`[DeadlineChecker] Failed to send urgent reminder for rental ${rental.id}:`, error);
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualCheck(): Promise<DeadlineCheckResult> {
    console.log('[DeadlineChecker] Manual check triggered');
    return this.checkDeadlines();
  }
}

export const confirmationDeadlineChecker = new ConfirmationDeadlineChecker();