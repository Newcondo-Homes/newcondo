// backend/admin-service/src/controllers/transactionController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@newcondo/db';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { adminController } from './adminController';

const prisma = new PrismaClient();

export class TransactionController {
  // Get all transactions
  async getAllTransactions(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentType,
        userId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (paymentType) {
        where.paymentType = paymentType;
      }

      if (userId) {
        where.userId = userId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) {
          where.amount.gte = Number(minAmount);
        }
        if (maxAmount) {
          where.amount.lte = Number(maxAmount);
        }
      }

      const [transactions, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: order },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
              }
            },
            rental: {
              select: {
                id: true,
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true
                  }
                }
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return successResponse(res, {
        transactions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Transactions retrieved successfully');
    } catch (error) {
      console.error('Get all transactions error:', error);
      return errorResponse(res, 'Failed to retrieve transactions', 500);
    }
  }

  // Get transaction details
  async getTransactionDetails(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;

      const transaction = await prisma.payment.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  state: true
                }
              },
              unit: {
                select: {
                  id: true,
                  unitNumber: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      return successResponse(res, transaction, 'Transaction details retrieved successfully');
    } catch (error) {
      console.error('Get transaction details error:', error);
      return errorResponse(res, 'Failed to retrieve transaction details', 500);
    }
  }

  // Process refund
  async processRefund(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { transactionId } = req.params;
      const { reason, refundAmount } = req.body;

      if (!reason) {
        return errorResponse(res, 'Refund reason is required', 400);
      }

      const transaction = await prisma.payment.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!transaction) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      if (transaction.status !== 'SUCCESS') {
        return errorResponse(res, 'Only successful transactions can be refunded', 400);
      }

      const amountToRefund = refundAmount || transaction.amount;

      if (Number(amountToRefund) > Number(transaction.amount)) {
        return errorResponse(res, 'Refund amount cannot exceed transaction amount', 400);
      }

      // Update transaction status
      const updatedTransaction = await prisma.payment.update({
        where: { id: transactionId },
        data: {
          status: 'REFUNDED',
          description: transaction.description 
            ? `${transaction.description} [REFUNDED: ${reason}]`
            : `[REFUNDED: ${reason}]`
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'PAYMENT_REFUNDED',
        'Payment',
        transactionId,
        `Refunded ₦${amountToRefund} to ${transaction.user.name}`,
        { reason, refundAmount: amountToRefund, originalAmount: transaction.amount }
      );

      // TODO: Process actual refund through Flutterwave
      // TODO: Send refund notification to user

      return successResponse(res, updatedTransaction, 'Refund processed successfully');
    } catch (error) {
      console.error('Process refund error:', error);
      return errorResponse(res, 'Failed to process refund', 500);
    }
  }

  // Release held payment
  async releaseHeldPayment(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { transactionId } = req.params;
      const { notes } = req.body;

      const transaction = await prisma.payment.findUnique({
        where: { id: transactionId },
        include: {
          rental: {
            include: {
              property: {
                select: {
                  ownerId: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      if (transaction.status !== 'HELD') {
        return errorResponse(res, 'Only held payments can be released', 400);
      }

      // Release payment
      const updatedTransaction = await prisma.payment.update({
        where: { id: transactionId },
        data: {
          status: 'RELEASED',
          isReleased: true,
          releasedAt: new Date()
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'PAYMENT_REFUNDED',
        'Payment',
        transactionId,
        'Released held payment',
        { notes }
      );

      // TODO: Transfer funds to property owner's virtual account
      // TODO: Send notification to property owner

      return successResponse(res, updatedTransaction, 'Payment released successfully');
    } catch (error) {
      console.error('Release held payment error:', error);
      return errorResponse(res, 'Failed to release payment', 500);
    }
  }

  // Flag transaction
  async flagTransaction(req: Request, res: Response) {
    try {
      const adminId = req.user?.id;
      const { transactionId } = req.params;
      const { reason, severity } = req.body;

      if (!reason) {
        return errorResponse(res, 'Flag reason is required', 400);
      }

      const transaction = await prisma.payment.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      // Update transaction with flag
      const updatedTransaction = await prisma.payment.update({
        where: { id: transactionId },
        data: {
          description: transaction.description 
            ? `${transaction.description} [FLAGGED: ${reason}]`
            : `[FLAGGED: ${reason}]`
        }
      });

      // Log admin action
      await adminController.logAdminAction(
        adminId!,
        'PAYMENT_REFUNDED',
        'Payment',
        transactionId,
        `Flagged transaction: ${reason}`,
        { reason, severity }
      );

      return successResponse(res, updatedTransaction, 'Transaction flagged successfully');
    } catch (error) {
      console.error('Flag transaction error:', error);
      return errorResponse(res, 'Failed to flag transaction', 500);
    }
  }

  // Get transaction statistics
  async getTransactionStatistics(req: Request, res: Response) {
    try {
      const { period = '30d', groupBy = 'day' } = req.query;

      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const [
        totalTransactions,
        statusBreakdown,
        typeBreakdown,
        totalRevenue,
        averageTransactionValue,
        transactionTrend,
        successRate
      ] = await Promise.all([
        prisma.payment.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.groupBy({
          by: ['status'],
          _count: { status: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.groupBy({
          by: ['paymentType'],
          _count: { paymentType: true },
          _sum: { amount: true },
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.aggregate({
          _avg: { amount: true },
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.payment.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            amount: true,
            status: true,
            createdAt: true,
            paymentType: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }),
        prisma.payment.count({
          where: {
            status: 'SUCCESS',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }).then(success =>
          prisma.payment.count({
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }).then(total => ({
            success,
            total,
            rate: total > 0 ? (success / total) * 100 : 0
          }))
        )
      ]);

      return successResponse(res, {
        period,
        dateRange: { startDate, endDate },
        statistics: {
          totalTransactions,
          statusBreakdown,
          typeBreakdown,
          totalRevenue: totalRevenue._sum.amount || 0,
          averageTransactionValue: averageTransactionValue._avg.amount || 0,
          transactionTrend,
          successRate
        }
      }, 'Transaction statistics retrieved successfully');
    } catch (error) {
      console.error('Get transaction statistics error:', error);
      return errorResponse(res, 'Failed to retrieve transaction statistics', 500);
    }
  }

  // Export transactions
  async exportTransactions(req: Request, res: Response) {
    try {
      const {
        status,
        paymentType,
        startDate,
        endDate,
        format = 'json'
      } = req.query;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (paymentType) {
        where.paymentType = paymentType;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const transactions = await prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          rental: {
            select: {
              id: true,
              property: {
                select: {
                  title: true,
                  address: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (format === 'csv') {
        // TODO: Convert to CSV format
        return res.status(200).send('CSV export not yet implemented');
      }

      return successResponse(res, transactions, 'Transactions exported successfully');
    } catch (error) {
      console.error('Export transactions error:', error);
      return errorResponse(res, 'Failed to export transactions', 500);
    }
  }
}

export const transactionController = new TransactionController();










// import { Request, Response } from 'express';
// import { transactionService } from '../services/transactionService';
// import { sendSuccess, sendError } from '../../../shared/src/utils/response';

// export class TransactionController {
//   /**
//    * Get all transactions with filtering
//    */
//   async getTransactions(req: Request, res: Response) {
//     try {
//       const {
//         page = '1',
//         limit = '50',
//         status,
//         paymentType,
//         userId,
//         startDate,
//         endDate,
//         minAmount,
//         maxAmount,
//         search,
//       } = req.query;

//       const transactions = await transactionService.getTransactions({
//         page: parseInt(page as string),
//         limit: parseInt(limit as string),
//         status: status as string,
//         paymentType: paymentType as string,
//         userId: userId as string,
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//         minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
//         maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
//         search: search as string,
//       });

//       return sendSuccess(res, transactions, 'Transactions retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching transactions:', error);
//       return sendError(res, 'Failed to fetch transactions', 500);
//     }
//   }

//   /**
//    * Get transaction details
//    */
//   async getTransactionDetails(req: Request, res: Response) {
//     try {
//       const { id } = req.params;

//       const transaction = await transactionService.getTransactionDetails(id);

//       if (!transaction) {
//         return sendError(res, 'Transaction not found', 404);
//       }

//       return sendSuccess(res, transaction, 'Transaction details retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching transaction details:', error);
//       return sendError(res, 'Failed to fetch transaction details', 500);
//     }
//   }

//   /**
//    * Get transaction statistics
//    */
//   async getTransactionStats(req: Request, res: Response) {
//     try {
//       const { startDate, endDate, groupBy = 'day' } = req.query;

//       const stats = await transactionService.getTransactionStats({
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//         groupBy: groupBy as 'day' | 'week' | 'month',
//       });

//       return sendSuccess(res, stats, 'Transaction statistics retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching transaction stats:', error);
//       return sendError(res, 'Failed to fetch transaction statistics', 500);
//     }
//   }

//   /**
//    * Get failed transactions for review
//    */
//   async getFailedTransactions(req: Request, res: Response) {
//     try {
//       const { page = '1', limit = '50', startDate, endDate } = req.query;

//       const failed = await transactionService.getFailedTransactions({
//         page: parseInt(page as string),
//         limit: parseInt(limit as string),
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       return sendSuccess(res, failed, 'Failed transactions retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching failed transactions:', error);
//       return sendError(res, 'Failed to fetch failed transactions', 500);
//     }
//   }

//   /**
//    * Get suspicious transactions
//    */
//   async getSuspiciousTransactions(req: Request, res: Response) {
//     try {
//       const { page = '1', limit = '50' } = req.query;

//       const suspicious = await transactionService.getSuspiciousTransactions({
//         page: parseInt(page as string),
//         limit: parseInt(limit as string),
//       });

//       return sendSuccess(res, suspicious, 'Suspicious transactions retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching suspicious transactions:', error);
//       return sendError(res, 'Failed to fetch suspicious transactions', 500);
//     }
//   }

//   /**
//    * Manually process refund
//    */
//   async processRefund(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { reason, amount } = req.body;
//       const adminId = req.user?.id;

//       const result = await transactionService.processRefund({
//         transactionId: id,
//         adminId: adminId!,
//         reason,
//         amount: amount ? parseFloat(amount) : undefined,
//       });

//       return sendSuccess(res, result, 'Refund processed successfully');
//     } catch (error) {
//       console.error('Error processing refund:', error);
//       return sendError(res, 'Failed to process refund', 500);
//     }
//   }

//   /**
//    * Get payment method breakdown
//    */
//   async getPaymentMethodBreakdown(req: Request, res: Response) {
//     try {
//       const { startDate, endDate } = req.query;

//       const breakdown = await transactionService.getPaymentMethodBreakdown({
//         startDate: startDate ? new Date(startDate as string) : undefined,
//         endDate: endDate ? new Date(endDate as string) : undefined,
//       });

//       return sendSuccess(res, breakdown, 'Payment method breakdown retrieved successfully');
//     } catch (error) {
//       console.error('Error fetching payment method breakdown:', error);
//       return sendError(res, 'Failed to fetch payment method breakdown', 500);
//     }
//   }
// }

// export const transactionController = new TransactionController();