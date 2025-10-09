// backend/marking-service/src/controllers/compensationController.ts

import { Request, Response, NextFunction } from 'express';
import { CompensationService } from '../services/compensationService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

export class CompensationController {
  private compensationService: CompensationService;

  constructor() {
    this.compensationService = new CompensationService();
  }

  /**
   * Process initial payment for marking job
   */
  processMarkingPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.user!;
      const { markingJobId, paymentReference } = req.body;

      if (!markingJobId) {
        res.status(400).json(errorResponse('Marking job ID is required'));
        return;
      }

      const paymentResult = await this.compensationService.processMarkingJobPayment(
        markingJobId,
        userId,
        paymentReference
      );

      res.json(
        successResponse(paymentResult, 'Marking job payment processed successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Release partial compensation to agent after marking
   */
  releasePartialCompensation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingJobId } = req.params;

      const compensation = await this.compensationService.releasePartialCompensation(
        markingJobId
      );

      res.json(
        successResponse(
          compensation,
          'Partial compensation released to agent'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Release full compensation after owner confirmation
   */
  releaseFullCompensation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingJobId } = req.params;
      const { userId } = req.user!;

      const compensation = await this.compensationService.releaseFullCompensation(
        markingJobId,
        userId
      );

      res.json(
        successResponse(
          compensation,
          'Full compensation released to agent'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle timeout compensation for unconfirmed marking
   */
  handleTimeoutCompensation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingJobId } = req.params;

      const compensation = await this.compensationService.handleTimeoutCompensation(
        markingJobId
      );

      res.json(
        successResponse(
          compensation,
          'Timeout compensation processed'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate compensation breakdown for a marking job
   */
  calculateCompensation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingFee, assignmentType } = req.query;

      if (!markingFee) {
        res.status(400).json(errorResponse('Marking fee is required'));
        return;
      }

      const breakdown = this.compensationService.calculateCompensationBreakdown(
        parseFloat(markingFee as string),
        assignmentType as 'NEWCONDO' | 'AGENT' | 'PERSONAL'
      );

      res.json(
        successResponse(breakdown, 'Compensation breakdown calculated')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get compensation history for an agent
   */
  getAgentCompensationHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { agentId } = req.params;
      const { page = '1', limit = '10' } = req.query;

      const history = await this.compensationService.getAgentCompensationHistory(
        agentId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(
        successResponse(history, 'Compensation history retrieved')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get total earnings for an agent
   */
  getAgentTotalEarnings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { agentId } = req.params;

      const earnings = await this.compensationService.getAgentTotalEarnings(
        agentId
      );

      res.json(
        successResponse(earnings, 'Agent earnings retrieved')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refund marking job payment
   */
  refundMarkingPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingJobId } = req.params;
      const { reason } = req.body;
      const { userId } = req.user!; // Admin ID

      const refund = await this.compensationService.refundMarkingPayment(
        markingJobId,
        userId,
        reason
      );

      res.json(
        successResponse(refund, 'Marking job payment refunded')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Process Newcondo admin marking compensation (25,000 NGN)
   */
  processNewcondoMarkingPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.user!;
      const { markingJobId, paymentReference } = req.body;

      const result = await this.compensationService.processNewcondoMarkingPayment(
        markingJobId,
        userId,
        paymentReference
      );

      res.json(
        successResponse(result, 'Newcondo marking payment processed')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pending compensations requiring action
   */
  getPendingCompensations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const pending = await this.compensationService.getPendingCompensations(
        status as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(
        successResponse(pending, 'Pending compensations retrieved')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Withdraw earnings to bank account
   */
  withdrawEarnings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.user!;
      const { amount, bankAccount } = req.body;

      if (!amount || !bankAccount) {
        res.status(400).json(
          errorResponse('Amount and bank account details are required')
        );
        return;
      }

      const withdrawal = await this.compensationService.withdrawEarnings(
        userId,
        parseFloat(amount),
        bankAccount
      );

      res.json(
        successResponse(withdrawal, 'Withdrawal initiated successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}