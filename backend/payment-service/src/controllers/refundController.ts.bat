// backend/payment-service/src/controllers/refundController.ts

import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, RentalStatus, Role } from '@prisma/client';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
// Assuming Decimal is imported and available, or using Prisma's utility methods
import { Decimal } from '@prisma/client/runtime/library';
import { PLATFORM_SERVICE_FEE_MULTIPLIER } from '../../../shared/src/constants/commission';
// Import the Flutterwave service client
import { initiateRefund } from '../services/flutterwaveService'; 
// Import AdminActionType from shared if needed, otherwise use local string
import { AdminActionType } from '../../../shared/src/types/admin'; // Assuming this exists in shared/src/types/admin.ts

const prisma = new PrismaClient();

/**
 * Request a refund during confirmation period
 * POST /api/payments/:paymentId/refund-request
 */
export const requestRefund = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    // @ts-ignore req.user is set by auth middleware
    const userId = req.user?.id;
    const { reason, details } = req.body;

    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!reason) {
      return errorResponse(res, 'Refund reason is required', 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                ownerId: true,
                agentId: true,
              },
            },
            unit: {
              select: {
                unitNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    if (payment.userId !== userId) {
      return errorResponse(res, 'Unauthorized to request refund for this payment', 403);
    }

    // Check if payment is already released
    if (payment.isReleased) {
      return errorResponse(res, 'Cannot refund released payment', 400);
    }

    // Check if payment status allows refund
    if (payment.status !== PaymentStatus.HELD && payment.status !== PaymentStatus.SUCCESS) {
      return errorResponse(res, 'Payment status does not allow refund', 400);
    }

    // Check if within confirmation period
    const now = new Date();
    if (payment.confirmationPeriodEnd && now > payment.confirmationPeriodEnd) {
      return errorResponse(
        res,
        'Refund request period has expired. Please contact support.',
        400
      );
    }

    // Calculate refund amount (excluding platform service fee)
    // Use the stored platformFee if available, otherwise calculate 2% as fallback
    const serviceFee = payment.platformFee || payment.amount.mul(new Decimal(PLATFORM_SERVICE_FEE_MULTIPLIER)); 
    // Ensure the result is a Decimal for safety, assuming payment.amount is Decimal
    const refundAmount = payment.amount.sub(serviceFee); 

    // Note: We charge double Flutterwave's fee to cover refund transaction costs
    // This is already factored into the initial payment

    // Create refund request event
    await prisma.eventLog.create({
      data: {
        userId,
        type: 'REFUND_REQUESTED',
        metadata: {
          paymentId: payment.id,
          rentalId: payment.rentalId,
          propertyId: payment.rental?.property.id,
          reason,
          details,
          requestedAmount: payment.amount.toString(),
          refundAmount: refundAmount.toString(),
          serviceFee: serviceFee.toString(),
          requestedAt: now.toISOString(),
        },
      },
    });

    // Create support ticket for refund request
    await prisma.supportTicket.create({
      data: {
        userId,
        title: `Refund Request - Payment ${paymentId}`,
        description: `Reason: ${reason}\n\nDetails: ${details || 'N/A'}\n\nProperty: ${
          payment.rental?.property.title
        }`,
        category: 'BILLING',
        priority: 'HIGH',
        status: 'OPEN',
      },
    });

    return successResponse(res, {
      message: 'Refund request submitted successfully',
      paymentId: payment.id,
      requestedAmount: payment.amount,
      refundAmount,
      serviceFee,
      note: 'Your refund request is being processed. Service fee is non-refundable.',
    });
  } catch (error) {
    console.error('Request refund error:', error);
    return errorResponse(res, 'Failed to request refund', 500);
  }
};

/**
 * Process refund (admin only)
 * POST /api/payments/:paymentId/process-refund
 */
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    // @ts-ignore req.user is set by auth middleware
    const adminId = req.user?.id;
    const { approvalNote, customRefundAmount } = req.body;

    if (!adminId) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    
    // Ensure the user is an Admin (Role ADMIN must be checked by middleware in the admin service, 
    // but a quick check here is good practice if this route is accessible to others)
    // NOTE: This controller should primarily be used by the Admin Service, which should already check role.
    
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    if (payment.isReleased) {
      return errorResponse(res, 'Cannot refund released payment', 400);
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      return errorResponse(res, 'Payment has already been refunded', 400);
    }
    
    if (!payment.flutterwaveRef) {
        return errorResponse(res, 'Payment reference required for external refund', 400);
    }

    // Calculate final refund amount
    const serviceFee = payment.platformFee || payment.amount.mul(new Decimal(PLATFORM_SERVICE_FEE_MULTIPLIER));
    let refundAmount: Decimal;
    
    if (customRefundAmount) {
        // Admin can set a custom refund amount
        refundAmount = new Decimal(customRefundAmount);
    } else {
        // Default to full refund minus non-refundable service fee
        refundAmount = payment.amount.sub(serviceFee);
    }
    
    if (refundAmount.lessThanOrEqual(new Decimal(0))) {
        return errorResponse(res, 'Refund amount must be positive', 400);
    }

    // 1. Call Flutterwave Refund Service
    const flutterwaveResult = await initiateRefund(payment.flutterwaveRef, refundAmount);

    if (flutterwaveResult.status !== 'success') {
        // Log the failure but allow the admin to retry or handle it manually
        await prisma.adminAction.create({
            data: {
                adminId,
                action: AdminActionType.PAYMENT_REFUND_FAILED,
                targetType: 'Payment',
                targetId: payment.id,
                description: `Failed to process Flutterwave refund. Amount: ${refundAmount.toString()}`,
                metadata: {
                    error: flutterwaveResult.message,
                    approvalNote,
                }
            }
        });
        return errorResponse(res, 'External refund failed. Check logs for details.', 500);
    }
    
    // 2. Update Payment Status and log the refund
    const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
            status: PaymentStatus.REFUNDED,
            failureReason: `Refunded by Admin ${adminId}. Note: ${approvalNote || 'N/A'}`,
            paidAt: new Date(), // Using paidAt for refund time, though status is 'REFUNDED'
            // Keep original amounts, but log the refund amount in metadata
            platformFee: payment.platformFee, // Keep the fee we deducted
        },
    });
    
    // 3. Update associated Rental Status
    if (payment.rentalId) {
        await prisma.rental.update({
            where: { id: payment.rentalId },
            data: {
                status: RentalStatus.TERMINATED,
                isConfirmed: false,
                confirmationDeadline: new Date(), // Terminate the confirmation period
            },
        });
    }
    
    // 4. Create Admin Action Log
    await prisma.adminAction.create({
        data: {
            adminId,
            action: AdminActionType.PAYMENT_REFUNDED,
            targetType: 'Payment',
            targetId: payment.id,
            description: `Payment successfully refunded. Refund Amount: ${refundAmount.toString()}`,
            metadata: {
                originalAmount: payment.amount.toString(),
                refundedAmount: refundAmount.toString(),
                serviceFeeRetained: serviceFee.toString(),
                approvalNote,
                flutterwaveRef: flutterwaveResult.ref,
            }
        }
    });

    return successResponse(res, {
      message: 'Payment successfully processed and refunded.',
      payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          refundedAmount: refundAmount,
          serviceFeeRetained: serviceFee,
          note: approvalNote,
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    return errorResponse(res, 'Failed to process refund', 500);
  }
};



// import { Request, Response } from 'express';
// import { refundService } from '../services/refundService';
// import { logger } from '../../../shared/src/middleware/logger';

// export class RefundController {
//   /**
//    * Process refund for disputed property
//    */
//   async processRefund(req: Request, res: Response): Promise<void> {
//     try {
//       const { rentalId } = req.params;
//       const { refundAmount, reason } = req.body;
//       const adminId = req.user?.id;

//       if (!adminId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const result = await refundService.processRefund(
//         rentalId,
//         refundAmount,
//         adminId,
//         reason
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Refund processed successfully',
//         data: result
//       });
//     } catch (error: any) {
//       logger.error('Error processing refund:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to process refund'
//       });
//     }
//   }

//   /**
//    * Get refund status
//    */
//   async getRefundStatus(req: Request, res: Response): Promise<void> {
//     try {
//       const { rentalId } = req.params;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const status = await refundService.getRefundStatus(rentalId, userId);

//       res.status(200).json({
//         success: true,
//         data: status
//       });
//     } catch (error: any) {
//       logger.error('Error getting refund status:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get refund status'
//       });
//     }
//   }

//   /**
//    * Get all pending refunds (admin only)
//    */
//   async getPendingRefunds(req: Request, res: Response): Promise<void> {
//     try {
//       const adminId = req.user?.id;
//       const { page = 1, limit = 20 } = req.query;

//       if (!adminId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const refunds = await refundService.getPendingRefunds(
//         Number(page),
//         Number(limit)
//       );

//       res.status(200).json({
//         success: true,
//         data: refunds
//       });
//     } catch (error: any) {
//       logger.error('Error getting pending refunds:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get pending refunds'
//       });
//     }
//   }

//   /**
//    * Calculate refund amount
//    */
//   async calculateRefund(req: Request, res: Response): Promise<void> {
//     try {
//       const { rentalId } = req.params;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const calculation = await refundService.calculateRefund(rentalId);

//       res.status(200).json({
//         success: true,
//         data: calculation
//       });
//     } catch (error: any) {
//       logger.error('Error calculating refund:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to calculate refund'
//       });
//     }
//   }
// }

// export const refundController = new RefundController();