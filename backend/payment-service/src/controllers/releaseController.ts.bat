// backend/payment-service/src/controllers/releaseController.ts

import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';
import { calculateCommissionSplit } from '../services/commissionService';

const prisma = new PrismaClient();

/**
 * Release payment after confirmation period
 * This is typically called by a scheduled job
 * POST /api/payments/:paymentId/release
 */
export const releasePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const adminId = req.user?.id; // Optional: admin can manually trigger release

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: true,
                agent: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    // Check if payment is already released
    if (payment.isReleased) {
      return errorResponse(res, 'Payment has already been released', 400);
    }

    // Check if payment status is HELD
    if (payment.status !== PaymentStatus.HELD) {
      return errorResponse(res, 'Only HELD payments can be released', 400);
    }

    // Check if confirmation period has ended
    const now = new Date();
    if (payment.confirmationPeriodEnd && now < payment.confirmationPeriodEnd) {
      return errorResponse(res, 'Confirmation period has not ended yet', 400);
    }

    // Calculate commission split
    const rental = payment.rental;
    if (!rental) {
      return errorResponse(res, 'Rental not found for this payment', 404);
    }

    const commissionData = await calculateCommissionSplit({
      totalAmount: payment.amount,
      property: rental.property,
      paymentId: payment.id,
    });

    // Start transaction for payment release
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: now,
          agentCommission: commissionData.agentCommission,
          platformFee: commissionData.platformFee,
          ownerAmount: commissionData.ownerAmount,
        },
      });

      // Update rental status if needed
      await tx.rental.update({
        where: { id: rental.id },
        data: {
          status: 'ACTIVE',
        },
      });

      // Create commission payment records for tracking
      const commissionRecords = [];

      // Platform fee record
      commissionRecords.push(
        await tx.eventLog.create({
          data: {
            type: 'COMMISSION_DISTRIBUTED',
            metadata: {
              paymentId: payment.id,
              recipient: 'PLATFORM',
              amount: commissionData.platformFee.toString(),
              percentage: commissionData.platformFeePercentage,
            },
          },
        })
      );

      // Agent commission record (if applicable)
      if (commissionData.agentCommission.toNumber() > 0 && rental.property.agentId) {
        commissionRecords.push(
          await tx.eventLog.create({
            data: {
              userId: rental.property.agentId,
              type: 'COMMISSION_RECEIVED',
              metadata: {
                paymentId: payment.id,
                recipient: 'AGENT',
                agentId: rental.property.agentId,
                amount: commissionData.agentCommission.toString(),
                percentage: commissionData.agentCommissionPercentage,
                isListingAgent: commissionData.isListingAgent,
                isSubAgent: commissionData.isSubAgent,
              },
            },
          })
        );
      }

      // Owner payment record
      commissionRecords.push(
        await tx.eventLog.create({
          data: {
            userId: rental.property.ownerId,
            type: 'PAYMENT_RECEIVED',
            metadata: {
              paymentId: payment.id,
              recipient: 'OWNER',
              ownerId: rental.property.ownerId,
              amount: commissionData.ownerAmount.toString(),
            },
          },
        })
      );

      // Log admin action if manually released
      if (adminId) {
        await tx.adminAction.create({
          data: {
            adminId,
            action: 'PAYMENT_REFUNDED', // Can add PAYMENT_RELEASED action type
            targetType: 'Payment',
            targetId: paymentId,
            description: 'Manually released payment',
            metadata: {
              releasedAt: now.toISOString(),
              commissionData,
            },
          },
        });
      }

      return {
        payment: updatedPayment,
        commissionData,
        commissionRecords,
      };
    });

    // TODO: Trigger actual money transfer to virtual accounts via Flutterwave
    // This would be handled by a separate service that listens to payment release events

    return successResponse(res, {
      message: 'Payment released successfully',
      paymentId: result.payment.id,
      releasedAt: result.payment.releasedAt,
      distribution: {
        totalAmount: payment.amount,
        platformFee: result.commissionData.platformFee,
        agentCommission: result.commissionData.agentCommission,
        ownerAmount: result.commissionData.ownerAmount,
      },
    });
  } catch (error) {
    console.error('Release payment error:', error);
    return errorResponse(res, 'Failed to release payment', 500);
  }
};

/**
 * Get payments ready for release
 * GET /api/payments/ready-for-release
 */
export const getPaymentsReadyForRelease = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const now = new Date();

    const readyPayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.HELD,
        isReleased: false,
        confirmationPeriodEnd: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      orderBy: {
        confirmationPeriodEnd: 'asc',
      },
    });

    const formattedPayments = readyPayments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      confirmationPeriodEnd: payment.confirmationPeriodEnd,
      renter: {
        id: payment.user.id,
        name: payment.user.name,
        email: payment.user.email,
      },
      property: {
        id: payment.rental?.property.id,
        title: payment.rental?.property.title,
        ownerId: payment.rental?.property.ownerId,
        agentId: payment.rental?.property.agentId,
        unit: payment.rental?.unit?.unitNumber,
      },
    }));

    return successResponse(res, {
      count: formattedPayments.length,
      payments: formattedPayments,
    });
  } catch (error) {
    console.error('Get payments ready for release error:', error);
    return errorResponse(res, 'Failed to get payments ready for release', 500);
  }
};

/**
 * Bulk release payments (admin only)
 * POST /api/payments/bulk-release
 */
export const bulkReleasePayments = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { paymentIds } = req.body;

    if (!adminId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return errorResponse(res, 'Payment IDs array is required', 400);
    }

    const now = new Date();
    const results = {
      successful: [] as string[],
      failed: [] as { paymentId: string; reason: string }[],
    };

    // Process each payment
    for (const paymentId of paymentIds) {
      try {
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
          results.failed.push({ paymentId, reason: 'Payment not found' });
          continue;
        }

        if (payment.isReleased) {
          results.failed.push({ paymentId, reason: 'Already released' });
          continue;
        }

        if (payment.status !== PaymentStatus.HELD) {
          results.failed.push({ paymentId, reason: 'Payment not in HELD status' });
          continue;
        }

        if (payment.confirmationPeriodEnd && now < payment.confirmationPeriodEnd) {
          results.failed.push({ paymentId, reason: 'Confirmation period not ended' });
          continue;
        }

        // Calculate commission and release
        const rental = payment.rental;
        if (!rental) {
          results.failed.push({ paymentId, reason: 'Rental not found' });
          continue;
        }

        const commissionData = await calculateCommissionSplit({
          totalAmount: payment.amount,
          property: rental.property,
          paymentId: payment.id,
        });

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.RELEASED,
              isReleased: true,
              releasedAt: now,
              agentCommission: commissionData.agentCommission,
              platformFee: commissionData.platformFee,
              ownerAmount: commissionData.ownerAmount,
            },
          });

          await tx.rental.update({
            where: { id: rental.id },
            data: {
              status: 'ACTIVE',
            },
          });
        });

        results.successful.push(paymentId);
      } catch (error) {
        console.error(`Error releasing payment ${paymentId}:`, error);
        results.failed.push({
          paymentId,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log bulk release action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'PAYMENT_REFUNDED', // Can add BULK_PAYMENT_RELEASED action type
        targetType: 'Payment',
        targetId: 'bulk',
        description: `Bulk released ${results.successful.length} payments`,
        metadata: {
          successful: results.successful,
          failed: results.failed,
          totalProcessed: paymentIds.length,
        },
      },
    });

    return successResponse(res, {
      message: 'Bulk release completed',
      summary: {
        total: paymentIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
      },
      results,
    });
  } catch (error) {
    console.error('Bulk release payments error:', error);
    return errorResponse(res, 'Failed to bulk release payments', 500);
  }
};

/**
 * Get release history for a property
 * GET /api/payments/property/:propertyId/releases
 */
export const getPropertyReleaseHistory = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    // Verify user owns or is agent for the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    if (property.ownerId !== userId && property.agentId !== userId) {
      return errorResponse(res, 'Unauthorized to view release history', 403);
    }

    const releases = await prisma.payment.findMany({
      where: {
        rental: {
          propertyId,
        },
        isReleased: true,
        status: PaymentStatus.RELEASED,
      },
      include: {
        rental: {
          include: {
            unit: {
              select: {
                unitNumber: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        releasedAt: 'desc',
      },
    });

    const formattedReleases = releases.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      platformFee: payment.platformFee,
      agentCommission: payment.agentCommission,
      ownerAmount: payment.ownerAmount,
      releasedAt: payment.releasedAt,
      unit: payment.rental?.unit?.unitNumber,
      renter: {
        name: payment.user.name,
        email: payment.user.email,
      },
    }));

    return successResponse(res, {
      propertyId,
      count: formattedReleases.length,
      releases: formattedReleases,
    });
  } catch (error) {
    console.error('Get property release history error:', error);
    return errorResponse(res, 'Failed to get release history', 500);
  }
};


// import { Request, Response } from 'express';
// import { releaseService } from '../services/releaseService';
// import { logger } from '../../../shared/src/middleware/logger';

// export class ReleaseController {
//   /**
//    * Manually trigger payment release (admin only)
//    */
//   async releasePayment(req: Request, res: Response): Promise<void> {
//     try {
//       const { rentalId } = req.params;
//       const { reason } = req.body;
//       const adminId = req.user?.id;

//       if (!adminId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const result = await releaseService.manualRelease(rentalId, adminId, reason);

//       res.status(200).json({
//         success: true,
//         message: 'Payment released successfully',
//         data: result
//       });
//     } catch (error: any) {
//       logger.error('Error releasing payment:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to release payment'
//       });
//     }
//   }

//   /**
//    * Get release status for a rental
//    */
//   async getReleaseStatus(req: Request, res: Response): Promise<void> {
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

//       const status = await releaseService.getReleaseStatus(rentalId, userId);

//       res.status(200).json({
//         success: true,
//         data: status
//       });
//     } catch (error: any) {
//       logger.error('Error getting release status:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get release status'
//       });
//     }
//   }

//   /**
//    * Get all pending releases (admin only)
//    */
//   async getPendingReleases(req: Request, res: Response): Promise<void> {
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

//       const releases = await releaseService.getPendingReleases(
//         Number(page),
//         Number(limit)
//       );

//       res.status(200).json({
//         success: true,
//         data: releases
//       });
//     } catch (error: any) {
//       logger.error('Error getting pending releases:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get pending releases'
//       });
//     }
//   }

//   /**
//    * Get release history for user
//    */
//   async getReleaseHistory(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = req.user?.id;
//       const { page = 1, limit = 20 } = req.query;

//       if (!userId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const history = await releaseService.getReleaseHistory(
//         userId,
//         Number(page),
//         Number(limit)
//       );

//       res.status(200).json({
//         success: true,
//         data: history
//       });
//     } catch (error: any) {
//       logger.error('Error getting release history:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get release history'
//       });
//     }
//   }
// }

// export const releaseController = new ReleaseController();