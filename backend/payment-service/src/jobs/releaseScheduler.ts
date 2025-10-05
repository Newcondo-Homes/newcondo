import cron from 'node-cron';
import { prisma } from '@newcondo/db';
import { releaseService } from '../services/releaseService';
import { ReleaseJobResult } from '../types/release';

class ReleaseScheduler {
  private isRunning = false;

  /**
   * Schedule automatic payment releases
   * Runs every hour to check for payments ready to be released
   */
  start() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      if (this.isRunning) {
        console.log('[ReleaseScheduler] Previous job still running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('[ReleaseScheduler] Starting scheduled release job');

      try {
        const result = await this.processScheduledReleases();
        console.log('[ReleaseScheduler] Job completed:', result);
      } catch (error) {
        console.error('[ReleaseScheduler] Job failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('[ReleaseScheduler] Scheduler started - runs every hour');
  }

  /**
   * Process all payments ready for release
   */
  private async processScheduledReleases(): Promise<ReleaseJobResult> {
    const result: ReleaseJobResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    try {
      // Find all payments with expired confirmation periods that are still HELD
      const now = new Date();
      
      const paymentsToRelease = await prisma.payment.findMany({
        where: {
          status: 'HELD',
          isReleased: false,
          confirmationPeriodEnd: {
            lte: now,
          },
        },
        include: {
          rental: {
            include: {
              property: {
                include: {
                  owner: true,
                  agent: true,
                  virtualAccount: true,
                },
              },
              unit: true,
            },
          },
          user: true,
        },
      });

      result.totalProcessed = paymentsToRelease.length;
      console.log(`[ReleaseScheduler] Found ${paymentsToRelease.length} payments to release`);

      // Process each payment
      for (const payment of paymentsToRelease) {
        try {
          if (!payment.rental) {
            result.skipped++;
            result.details.push({
              paymentId: payment.id,
              status: 'SKIPPED',
              error: 'No associated rental found',
            });
            continue;
          }

          // Release the payment
          const releaseResult = await releaseService.releasePayment({
            paymentId: payment.id,
            rentalId: payment.rental.id,
            triggerType: 'AUTO',
          });

          if (releaseResult.success) {
            result.successful++;
            result.details.push({
              paymentId: payment.id,
              status: 'SUCCESS',
            });
          } else {
            result.failed++;
            result.details.push({
              paymentId: payment.id,
              status: 'FAILED',
              error: releaseResult.errors?.join(', '),
            });
          }
        } catch (error) {
          result.failed++;
          result.details.push({
            paymentId: payment.id,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          console.error(`[ReleaseScheduler] Error processing payment ${payment.id}:`, error);
        }
      }

      // Log summary
      console.log('[ReleaseScheduler] Summary:', {
        total: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        skipped: result.skipped,
      });

      return result;
    } catch (error) {
      console.error('[ReleaseScheduler] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for testing or admin override
   */
  async triggerManualRun(): Promise<ReleaseJobResult> {
    console.log('[ReleaseScheduler] Manual run triggered');
    return this.processScheduledReleases();
  }
}

export const releaseScheduler = new ReleaseScheduler();