// backend/payment-service/src/controllers/virtualAccountWebhookController.ts

import { Request, Response } from 'express';
import { VirtualAccountWebhookService } from '../services/virtualAccountWebhookService';
import { virtualAccountLogger } from '../utils/virtualAccountLogger';
import { VirtualAccountErrorHandler } from '../utils/virtualAccountErrorHandler';
import { FlutterwaveWebhookPayload } from '@newcondo/shared/types/flutterwaveVirtualAccount';

export class VirtualAccountWebhookController {
  private webhookService: VirtualAccountWebhookService;
  private errorHandler: VirtualAccountErrorHandler;

  constructor() {
    this.webhookService = new VirtualAccountWebhookService();
    this.errorHandler = new VirtualAccountErrorHandler();
  }

  /**
   * Handle Flutterwave virtual account webhook
   */
  handleFlutterwaveWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: FlutterwaveWebhookPayload = req.body;
      const signature = req.headers['verif-hash'] as string;

      virtualAccountLogger.info('Virtual account webhook received', {
        event: payload.event,
        txRef: payload.data?.tx_ref,
        accountNumber: payload.data?.account_number,
        amount: payload.data?.amount
      });

      // Verify webhook signature
      if (!this.webhookService.verifyWebhookSignature(payload, signature)) {
        virtualAccountLogger.warn('Invalid webhook signature', { signature });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Process webhook based on event type
      let result;
      switch (payload.event) {
        case 'virtual-account-transaction':
          result = await this.webhookService.handleVirtualAccountTransaction(payload);
          break;

        case 'virtual-account-created':
          result = await this.webhookService.handleVirtualAccountCreated(payload);
          break;

        case 'virtual-account-updated':
          result = await this.webhookService.handleVirtualAccountUpdated(payload);
          break;

        case 'virtual-account-disabled':
          result = await this.webhookService.handleVirtualAccountDisabled(payload);
          break;

        default:
          virtualAccountLogger.warn('Unhandled webhook event', { event: payload.event });
          res.status(200).json({ message: 'Event not handled' });
          return;
      }

      virtualAccountLogger.info('Webhook processed successfully', {
        event: payload.event,
        result: result?.id
      });

      res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, req.body);
      virtualAccountLogger.error('Webhook processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };

  /**
   * Handle virtual account balance update webhook
   */
  handleBalanceUpdate = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const signature = req.headers['verif-hash'] as string;

      // Verify signature
      if (!this.webhookService.verifyWebhookSignature(payload, signature)) {
        virtualAccountLogger.warn('Invalid balance update signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      await this.webhookService.handleBalanceUpdate(payload);

      virtualAccountLogger.info('Balance update processed', {
        accountNumber: payload.account_number,
        newBalance: payload.available_balance
      });

      res.status(200).json({ message: 'Balance updated successfully' });

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, req.body);
      virtualAccountLogger.error('Balance update failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({ error: 'Balance update failed' });
    }
  };

  /**
   * Handle virtual account transaction status webhook
   */
  handleTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const signature = req.headers['verif-hash'] as string;

      // Verify signature
      if (!this.webhookService.verifyWebhookSignature(payload, signature)) {
        virtualAccountLogger.warn('Invalid transaction status signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      await this.webhookService.handleTransactionStatusUpdate(payload);

      virtualAccountLogger.info('Transaction status updated', {
        transactionId: payload.transaction_id,
        status: payload.status
      });

      res.status(200).json({ message: 'Transaction status updated' });

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, req.body);
      virtualAccountLogger.error('Transaction status update failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({ error: 'Transaction status update failed' });
    }
  };

  /**
   * Get webhook processing status
   */
  getWebhookStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { webhookId } = req.params;

      const status = await this.webhookService.getWebhookProcessingStatus(webhookId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      await this.errorHandler.handleControllerError(error, req, res);
    }
  };

  /**
   * Retry failed webhook processing
   */
  retryWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { webhookId } = req.params;

      const result = await this.webhookService.retryFailedWebhook(webhookId);

      virtualAccountLogger.info('Webhook retry initiated', {
        webhookId,
        success: result.success
      });

      res.json({
        success: true,
        message: 'Webhook retry initiated',
        data: result
      });

    } catch (error) {
      await this.errorHandler.handleControllerError(error, req, res);
    }
  };
}