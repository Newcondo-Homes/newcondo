// backend/payment-service/src/controllers/balanceController.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';
import { fundHoldingService, FundTransferData, FundHoldData, FundReleaseData } from '../services/fundHoldingService';
import { standardResponse } from '../../shared/src/utils/response';

const prisma = new PrismaClient();

// Validation schemas
const getBalanceSchema = z.object({
  virtualAccountId: z.string().cuid(),
  includeHeldFunds: z.boolean().optional().default(true),
  asOf: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined)
});

const holdFundsSchema = z.object({
  virtualAccountId: z.string().cuid(),
  amount: z.number().positive().transform((val) => new Decimal(val)),
  holdReason: z.string().min(1).max(500),
  holdDurationDays: z.number().int().min(1).max(30).optional().default(7),
  metadata: z.record(z.any()).optional()
});

const releaseFundsSchema = z.object({
  virtualAccountId: z.string().cuid(),
  amount: z.number().positive().transform((val) => new Decimal(val)),
  releaseReason: z.string().min(1).max(500),
  paymentId: z.string().cuid().optional()
});

const transferFundsSchema = z.object({
  fromAccountId: z.string().cuid(),
  toAccountId: z.string().cuid(),
  amount: z.number().positive().transform((val) => new Decimal(val)),
  description: z.string().max(500).optional(),
  transactionReference: z.string().optional()
});

const addFundsSchema = z.object({
  virtualAccountId: z.string().cuid(),
  amount: z.number().positive().transform((val) => new Decimal(val)),
  description: z.string().min(1).max(500)
});

const getTransactionHistorySchema = z.object({
  virtualAccountId: z.string().cuid(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  fromDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  toDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  transactionType: z.enum(['HOLD', 'RELEASE', 'TRANSFER_IN', 'TRANSFER_OUT']).optional()
});

class BalanceController {
  /**
   * Get balance information for a virtual account
   */
  async getBalance(req: Request, res: Response) {
    try {
      const { virtualAccountId, includeHeldFunds, asOf } = getBalanceSchema.parse({
        ...req.params,
        ...req.query
      });

      // Check if user has permission to access this virtual account
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          property: {
            select: { id: true, title: true, ownerId: true }
          }
        }
      });

      if (!virtualAccount) {
        return res.status(404).json(standardResponse({
          success: false,
          message: 'Virtual account not found',
          statusCode: 404
        }));
      }

      // Check authorization - user must be the account owner or property owner
      const userId = req.user?.id;
      if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Unauthorized to access this virtual account',
          statusCode: 403
        }));
      }

      const balanceInfo = await fundHoldingService.getAvailableBalance({
        virtualAccountId,
        includeHeldFunds,
        asOf
      });

      return res.json(standardResponse({
        success: true,
        message: 'Balance retrieved successfully',
        data: {
          virtualAccount: {
            id: virtualAccount.id,
            accountNumber: virtualAccount.accountNumber,
            accountName: virtualAccount.accountName,
            isActive: virtualAccount.isActive,
            currency: virtualAccount.currency
          },
          balance: {
            total: balanceInfo.totalBalance.toString(),
            available: balanceInfo.availableBalance.toString(),
            held: balanceInfo.heldBalance.toString(),
            currency: virtualAccount.currency,
            asOf: asOf || new Date()
          }
        }
      }));
    } catch (error) {
      console.error('Error getting balance:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Hold funds in a virtual account
   */
  async holdFunds(req: Request, res: Response) {
    try {
      const holdData: FundHoldData = holdFundsSchema.parse(req.body);

      // Check if user has permission to hold funds in this account
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: holdData.virtualAccountId },
        include: {
          property: { select: { ownerId: true } }
        }
      });

      if (!virtualAccount) {
        return res.status(404).json(standardResponse({
          success: false,
          message: 'Virtual account not found',
          statusCode: 404
        }));
      }

      const userId = req.user?.id;
      if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Unauthorized to hold funds in this account',
          statusCode: 403
        }));
      }

      const holdTransaction = await fundHoldingService.holdFunds(holdData);

      return res.status(201).json(standardResponse({
        success: true,
        message: 'Funds held successfully',
        data: {
          transaction: {
            id: holdTransaction.id,
            amount: holdTransaction.amount.toString(),
            type: holdTransaction.type,
            status: holdTransaction.status,
            description: holdTransaction.description,
            createdAt: holdTransaction.createdAt,
            metadata: holdTransaction.metadata
          }
        }
      }));
    } catch (error) {
      console.error('Error holding funds:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Release held funds
   */
  async releaseFunds(req: Request, res: Response) {
    try {
      const releaseData: FundReleaseData = releaseFundsSchema.parse(req.body);

      // Check permissions
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: releaseData.virtualAccountId },
        include: {
          property: { select: { ownerId: true } }
        }
      });

      if (!virtualAccount) {
        return res.status(404).json(standardResponse({
          success: false,
          message: 'Virtual account not found',
          statusCode: 404
        }));
      }

      const userId = req.user?.id;
      if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Unauthorized to release funds from this account',
          statusCode: 403
        }));
      }

      const releaseTransaction = await fundHoldingService.releaseFunds(releaseData);

      return res.json(standardResponse({
        success: true,
        message: 'Funds released successfully',
        data: {
          transaction: {
            id: releaseTransaction.id,
            amount: releaseTransaction.amount.toString(),
            type: releaseTransaction.type,
            status: releaseTransaction.status,
            description: releaseTransaction.description,
            createdAt: releaseTransaction.createdAt,
            completedAt: releaseTransaction.completedAt,
            metadata: releaseTransaction.metadata
          }
        }
      }));
    } catch (error) {
      console.error('Error releasing funds:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Transfer funds between virtual accounts
   */
  async transferFunds(req: Request, res: Response) {
    try {
      const transferData: FundTransferData = transferFundsSchema.parse(req.body);

      // Check permissions for sender account
      const fromAccount = await prisma.virtualAccount.findUnique({
        where: { id: transferData.fromAccountId },
        include: {
          property: { select: { ownerId: true } }
        }
      });

      if (!fromAccount) {
        return res.status(404).json(standardResponse({
          success: false,
          message: 'Sender virtual account not found',
          statusCode: 404
        }));
      }

      const userId = req.user?.id;
      if (fromAccount.userId !== userId && fromAccount.property?.ownerId !== userId) {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Unauthorized to transfer funds from this account',
          statusCode: 403
        }));
      }

      const { fromTransaction, toTransaction } = await fundHoldingService.transferFunds(transferData);

      return res.json(standardResponse({
        success: true,
        message: 'Funds transferred successfully',
        data: {
          transfer: {
            fromTransaction: {
              id: fromTransaction.id,
              amount: fromTransaction.amount.toString(),
              type: fromTransaction.type,
              status: fromTransaction.status,
              description: fromTransaction.description,
              createdAt: fromTransaction.createdAt,
              completedAt: fromTransaction.completedAt
            },
            toTransaction: {
              id: toTransaction.id,
              amount: toTransaction.amount.toString(),
              type: toTransaction.type,
              status: toTransaction.status,
              description: toTransaction.description,
              createdAt: toTransaction.createdAt,
              completedAt: toTransaction.completedAt
            }
          }
        }
      }));
    } catch (error) {
      console.error('Error transferring funds:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Add funds to a virtual account (admin operation)
   */
  async addFunds(req: Request, res: Response) {
    try {
      const { virtualAccountId, amount, description } = addFundsSchema.parse(req.body);

      // This should typically be restricted to admin users only
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Only administrators can add funds to accounts',
          statusCode: 403
        }));
      }

      const transaction = await fundHoldingService.addFunds(virtualAccountId, amount, description);

      return res.status(201).json(standardResponse({
        success: true,
        message: 'Funds added successfully',
        data: {
          transaction: {
            id: transaction.id,
            amount: transaction.amount.toString(),
            type: transaction.type,
            status: transaction.status,
            description: transaction.description,
            createdAt: transaction.createdAt,
            completedAt: transaction.completedAt
          }
        }
      }));
    } catch (error) {
      console.error('Error adding funds:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Get transaction history for a virtual account
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { 
        virtualAccountId, 
        limit, 
        offset, 
        fromDate, 
        toDate, 
        transactionType 
      } = getTransactionHistorySchema.parse({
        ...req.params,
        ...req.query
      });

      // Check permissions
      const virtualAccount = await prisma.virtualAccount.findUnique({
        where: { id: virtualAccountId },
        include: {
          property: { select: { ownerId: true } }
        }
      });

      if (!virtualAccount) {
        return res.status(404).json(standardResponse({
          success: false,
          message: 'Virtual account not found',
          statusCode: 404
        }));
      }

      const userId = req.user?.id;
      if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
        return res.status(403).json(standardResponse({
          success: false,
          message: 'Unauthorized to view transaction history for this account',
          statusCode: 403
        }));
      }

      const transactions = await fundHoldingService.getTransactionHistory(virtualAccountId, {
        limit,
        offset,
        fromDate,
        toDate,
        transactionType
      });

      return res.json(standardResponse({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: {
          transactions: transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount.toString(),
            type: tx.type,
            status: tx.status,
            description: tx.description,
            createdAt: tx.createdAt,
            completedAt: tx.completedAt,
            metadata: tx.metadata
          })),
          pagination: {
            limit,
            offset,
            total: transactions.length // This would be the actual count in a real implementation
          }
        }
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: 'Internal server error',
        statusCode: 500
      }));
    }
  }

  /**
   * Reconcile virtual account balance
   */
  async reconcileBalance(req: Request, res: Response) {
    try {
      const { virtualAccountId } = z.object({
        virtualAccountId: z.string().cuid()
      }).parse(req.params);

      // Check permissions - typically admin only
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN') {
        // Allow account owners to reconcile their own accounts
        const virtualAccount = await prisma.virtualAccount.findUnique({
          where: { id: virtualAccountId },
          include: {
            property: { select: { ownerId: true } }
          }
        });

        if (!virtualAccount) {
          return res.status(404).json(standardResponse({
            success: false,
            message: 'Virtual account not found',
            statusCode: 404
          }));
        }

        const userId = req.user?.id;
        if (virtualAccount.userId !== userId && virtualAccount.property?.ownerId !== userId) {
          return res.status(403).json(standardResponse({
            success: false,
            message: 'Unauthorized to reconcile this account',
            statusCode: 403
          }));
        }
      }

      const reconciliation = await fundHoldingService.reconcileBalance(virtualAccountId);

      return res.json(standardResponse({
        success: true,
        message: 'Balance reconciliation completed',
        data: {
          reconciliation: {
            currentBalance: reconciliation.currentBalance.toString(),
            calculatedBalance: reconciliation.calculatedBalance.toString(),
            discrepancy: reconciliation.discrepancy.toString(),
            isReconciled: reconciliation.isReconciled,
            reconciledAt: new Date()
          }
        }
      }));
    } catch (error) {
      console.error('Error reconciling balance:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json(standardResponse({
          success: false,
          message: 'Validation error',
          errors: error.errors,
          statusCode: 400
        }));
      }

      return res.status(500).json(standardResponse({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        statusCode: 500
      }));
    }
  }
}