// backend/payment-service/src/controllers/referralPayoutController.ts

import { Request, Response } from 'express';
import { referralPayoutService } from '../services/referralPayoutService';
import { z } from 'zod';

// Validation schemas
const initiatePayoutSchema = z.object({
  userId: z.string(),
  rewardIds: z.array(z.string()).min(1),
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'WALLET', 'CREDIT']),
  bankDetails: z.object({
    accountNumber: z.string(),
    bankCode: z.string(),
    accountName: z.string(),
  }).optional(),
});

const getPayoutStatusSchema = z.object({
  payoutId: z.string(),
});

export class ReferralPayoutController {
  /**
   * Initiate reward payout
   */
  async initiatePayout(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = initiatePayoutSchema.parse(req.body);

      const payout = await referralPayoutService.initiatePayout(validatedData);

      res.status(200).json({
        success: true,
        message: 'Payout initiated successfully',
        data: payout,
      });
    } catch (error: any) {
      console.error('Initiate payout error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initiate payout',
      });
    }
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(req: Request, res: Response): Promise<void> {
    try {
      const { payoutId } = req.params;

      const payout = await referralPayoutService.getPayoutStatus(payoutId);

      if (!payout) {
        res.status(404).json({
          success: false,
          message: 'Payout not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payout,
      });
    } catch (error: any) {
      console.error('Get payout status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payout status',
        error: error.message,
      });
    }
  }

  /**
   * Get user payout history
   */
  async getPayoutHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const history = await referralPayoutService.getPayoutHistory({
        userId,
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('Get payout history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payout history',
        error: error.message,
      });
    }
  }

  /**
   * Cancel pending payout
   */
  async cancelPayout(req: Request, res: Response): Promise<void> {
    try {
      const { payoutId } = req.params;
      const { userId, reason } = req.body;

      await referralPayoutService.cancelPayout({
        payoutId,
        userId,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Payout cancelled successfully',
      });
    } catch (error: any) {
      console.error('Cancel payout error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel payout',
      });
    }
  }

  /**
   * Retry failed payout
   */
  async retryPayout(req: Request, res: Response): Promise<void> {
    try {
      const { payoutId } = req.params;

      const payout = await referralPayoutService.retryPayout(payoutId);

      res.status(200).json({
        success: true,
        message: 'Payout retry initiated',
        data: payout,
      });
    } catch (error: any) {
      console.error('Retry payout error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retry payout',
      });
    }
  }

  /**
   * Get available payout methods
   */
  async getPayoutMethods(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const methods = await referralPayoutService.getAvailablePayoutMethods(
        userId
      );

      res.status(200).json({
        success: true,
        data: methods,
      });
    } catch (error: any) {
      console.error('Get payout methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payout methods',
        error: error.message,
      });
    }
  }

  /**
   * Verify bank account for payout
   */
  async verifyBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountNumber, bankCode } = req.body;

      const verification = await referralPayoutService.verifyBankAccount({
        accountNumber,
        bankCode,
      });

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (error: any) {
      console.error('Verify bank account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify bank account',
        error: error.message,
      });
    }
  }

  /**
   * Get payout summary/stats
   */
  async getPayoutSummary(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const summary = await referralPayoutService.getPayoutSummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Get payout summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payout summary',
        error: error.message,
      });
    }
  }

  /**
   * Process payout webhook (from Flutterwave)
   */
  async handlePayoutWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['verif-hash'] as string;
      
      // Verify webhook signature
      if (signature !== process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
        res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      const { event, data } = req.body;

      await referralPayoutService.handlePayoutWebhook({
        event,
        data,
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error: any) {
      console.error('Handle payout webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message,
      });
    }
  }

  /**
   * Get payout fees
   */
  async getPayoutFees(req: Request, res: Response): Promise<void> {
    try {
      const { amount, method } = req.query;

      const fees = await referralPayoutService.calculatePayoutFees({
        amount: Number(amount),
        method: method as string,
      });

      res.status(200).json({
        success: true,
        data: fees,
      });
    } catch (error: any) {
      console.error('Get payout fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate fees',
        error: error.message,
      });
    }
  }

  /**
   * Bulk payout processing (Admin only)
   */
  async processBulkPayouts(req: Request, res: Response): Promise<void> {
    try {
      const { payoutIds } = req.body;

      const results = await referralPayoutService.processBulkPayouts(payoutIds);

      res.status(200).json({
        success: true,
        message: 'Bulk payouts processed',
        data: results,
      });
    } catch (error: any) {
      console.error('Process bulk payouts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk payouts',
        error: error.message,
      });
    }
  }
}

export const referralPayoutController = new ReferralPayoutController();