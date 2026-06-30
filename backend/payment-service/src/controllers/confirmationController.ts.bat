// backend/payment-service/src/controllers/confirmationController.ts
import { Request, Response } from 'express';
import { confirmationService } from '../services/confirmationService';
import { responseUtil } from '../../../shared/src/utils/response';
import { z } from 'zod';

// Validation schemas
const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  confirmationType: z.enum(['LANDLORD', 'TENANT', 'ADMIN']),
  notes: z.string().optional(),
});

const disputePaymentSchema = z.object({
  paymentId: z.string().min(1),
  disputeReason: z.string().min(1),
  disputeDetails: z.string().min(10),
  evidence: z.array(z.string()).optional(), // URLs to evidence files
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1),
  resolution: z.enum(['REFUND_TENANT', 'RELEASE_LANDLORD', 'PARTIAL_REFUND']),
  adminNotes: z.string().min(1),
  refundAmount: z.number().optional(),
});

export class ConfirmationController {
  /**
   * Confirm a payment (by landlord, tenant, or admin)
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const validatedData = confirmPaymentSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const confirmation = await confirmationService.confirmPayment({
        ...validatedData,
        confirmedBy: userId,
      });
      
      return responseUtil.success(res, confirmation, 'Payment confirmed successfully');
    } catch (error) {
      console.error('Error confirming payment:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to confirm payment');
    }
  }

  /**
   * Dispute a payment
   */
  async disputePayment(req: Request, res: Response) {
    try {
      const validatedData = disputePaymentSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const dispute = await confirmationService.disputePayment({
        ...validatedData,
        disputedBy: userId,
      });
      
      return responseUtil.success(res, dispute, 'Payment dispute submitted successfully', 201);
    } catch (error) {
      console.error('Error disputing payment:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to submit payment dispute');
    }
  }

  /**
   * Get payment confirmation status
   */
  async getPaymentConfirmationStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const status = await confirmationService.getPaymentConfirmationStatus(paymentId);
      
      return responseUtil.success(res, status);
    } catch (error) {
      console.error('Error fetching confirmation status:', error);
      return responseUtil.error(res, 'Failed to fetch confirmation status');
    }
  }

  /**
   * Get payments pending confirmation
   */
  async getPendingConfirmations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = '1', limit = '10', type } = req.query;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const filters = {
        type: type as 'LANDLORD' | 'TENANT' | undefined,
      };
      
      const pendingConfirmations = await confirmationService.getPendingConfirmations(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, pendingConfirmations);
    } catch (error) {
      console.error('Error fetching pending confirmations:', error);
      return responseUtil.error(res, 'Failed to fetch pending confirmations');
    }
  }

  /**
   * Get payment disputes (admin only)
   */
  async getPaymentDisputes(req: Request, res: Response) {
    try {
      const { page = '1', limit = '10', status, priority } = req.query;
      
      const filters = {
        status: status as 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | undefined,
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
      };
      
      const disputes = await confirmationService.getPaymentDisputes(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, disputes);
    } catch (error) {
      console.error('Error fetching payment disputes:', error);
      return responseUtil.error(res, 'Failed to fetch payment disputes');
    }
  }

  /**
   * Get specific payment dispute
   */
  async getPaymentDispute(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      
      if (!disputeId) {
        return responseUtil.badRequest(res, 'Dispute ID is required');
      }
      
      const dispute = await confirmationService.getPaymentDisputeById(disputeId);
      
      if (!dispute) {
        return responseUtil.notFound(res, 'Payment dispute not found');
      }
      
      return responseUtil.success(res, dispute);
    } catch (error) {
      console.error('Error fetching payment dispute:', error);
      return responseUtil.error(res, 'Failed to fetch payment dispute');
    }
  }

  /**
   * Resolve payment dispute (admin only)
   */
  async resolveDispute(req: Request, res: Response) {
    try {
      const validatedData = resolveDisputeSchema.parse(req.body);
      const adminId = req.user?.id;
      
      if (!adminId) {
        return responseUtil.unauthorized(res, 'Admin authentication required');
      }
      
      const resolution = await confirmationService.resolveDispute({
        ...validatedData,
        resolvedBy: adminId,
      });
      
      return responseUtil.success(res, resolution, 'Dispute resolved successfully');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to resolve dispute');
    }
  }

  /**
   * Release payment after confirmation period
   */
  async releasePayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { force } = req.query;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const released = await confirmationService.releasePayment(
        paymentId, 
        force === 'true'
      );
      
      return responseUtil.success(res, released, 'Payment released successfully');
    } catch (error) {
      console.error('Error releasing payment:', error);
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to release payment');
    }
  }

  /**
   * Get confirmation period timeline for a payment
   */
  async getConfirmationTimeline(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const timeline = await confirmationService.getConfirmationTimeline(paymentId);
      
      return responseUtil.success(res, timeline);
    } catch (error) {
      console.error('Error fetching confirmation timeline:', error);
      return responseUtil.error(res, 'Failed to fetch confirmation timeline');
    }
  }

  /**
   * Extend confirmation period (admin only)
   */
  async extendConfirmationPeriod(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { extensionDays, reason } = req.body;
      const adminId = req.user?.id;
      
      if (!paymentId || !extensionDays || !reason) {
        return responseUtil.badRequest(res, 'Payment ID, extension days, and reason are required');
      }
      
      if (!adminId) {
        return responseUtil.unauthorized(res, 'Admin authentication required');
      }
      
      const extended = await confirmationService.extendConfirmationPeriod(
        paymentId,
        extensionDays,
        reason,
        adminId
      );
      
      return responseUtil.success(res, extended, 'Confirmation period extended successfully');
    } catch (error) {
      console.error('Error extending confirmation period:', error);
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to extend confirmation period');
    }
  }

  /**
   * Get payments nearing confirmation deadline
   */
  async getPaymentsNearingDeadline(req: Request, res: Response) {
    try {
      const { hours = '24' } = req.query;
      
      const payments = await confirmationService.getPaymentsNearingDeadline(
        parseInt(hours as string)
      );
      
      return responseUtil.success(res, payments);
    } catch (error) {
      console.error('Error fetching payments nearing deadline:', error);
      return responseUtil.error(res, 'Failed to fetch payments nearing deadline');
    }
  }
}

export const confirmationController = new ConfirmationController();




// import { Request, Response } from 'express';
// import { confirmationService } from '../services/confirmationService';
// import { logger } from '../../../shared/src/middleware/logger';

// export class ConfirmationController {
//   /**
//    * Renter confirms property is as described
//    */
//   async confirmProperty(req: Request, res: Response): Promise<void> {
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

//       const result = await confirmationService.confirmProperty(rentalId, userId);

//       res.status(200).json({
//         success: true,
//         message: 'Property confirmed successfully',
//         data: result
//       });
//     } catch (error: any) {
//       logger.error('Error confirming property:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to confirm property'
//       });
//     }
//   }

//   /**
//    * Renter disputes property and requests refund
//    */
//   async disputeProperty(req: Request, res: Response): Promise<void> {
//     try {
//       const { rentalId } = req.params;
//       const { reason, description, evidence } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const result = await confirmationService.disputeProperty(
//         rentalId,
//         userId,
//         reason,
//         description,
//         evidence
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Dispute submitted successfully',
//         data: result
//       });
//     } catch (error: any) {
//       logger.error('Error disputing property:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to submit dispute'
//       });
//     }
//   }

//   /**
//    * Get confirmation status for a rental
//    */
//   async getConfirmationStatus(req: Request, res: Response): Promise<void> {
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

//       const status = await confirmationService.getConfirmationStatus(rentalId, userId);

//       res.status(200).json({
//         success: true,
//         data: status
//       });
//     } catch (error: any) {
//       logger.error('Error getting confirmation status:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get confirmation status'
//       });
//     }
//   }

//   /**
//    * Get all rentals pending confirmation for a user
//    */
//   async getPendingConfirmations(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = req.user?.id;

//       if (!userId) {
//         res.status(401).json({
//           success: false,
//           message: 'Unauthorized'
//         });
//         return;
//       }

//       const rentals = await confirmationService.getPendingConfirmations(userId);

//       res.status(200).json({
//         success: true,
//         data: rentals
//       });
//     } catch (error: any) {
//       logger.error('Error getting pending confirmations:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to get pending confirmations'
//       });
//     }
//   }

//   /**
//    * Cancel confirmation period (admin only)
//    */
//   async cancelConfirmationPeriod(req: Request, res: Response): Promise<void> {
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

//       const result = await confirmationService.cancelConfirmationPeriod(
//         rentalId,
//         adminId,
//         reason
//       );

//       res.status(200).json({
//         success: true,
//         message: 'Confirmation period cancelled',
//         data: result
//       });
//     } catch (error: any) {
//       logger.error('Error cancelling confirmation period:', error);
//       res.status(error.statusCode || 500).json({
//         success: false,
//         message: error.message || 'Failed to cancel confirmation period'
//       });
//     }
//   }
// }

// export const confirmationController = new ConfirmationController();


// backend/payment-service/src/controllers/confirmationController.ts

// import { Request, Response } from 'express';
// import { PrismaClient, PaymentStatus } from '@prisma/client';
// import { successResponse, errorResponse } from '../../../shared/src/utils/response';
// import { CONFIRMATION_PERIOD_HOURS } from '../../../shared/src/constants/paymentTimings';

// const prisma = new PrismaClient();

// /**
//  * Get payment confirmation status
//  * GET /api/payments/:paymentId/confirmation-status
//  */
// export const getConfirmationStatus = async (req: Request, res: Response) => {
//   try {
//     const { paymentId } = req.params;
//     const userId = req.user?.id;

//     if (!userId) {
//       return errorResponse(res, 'Unauthorized', 401);
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         rental: {
//           include: {
//             property: {
//               select: {
//                 title: true,
//                 address: true,
//               },
//             },
//             unit: {
//               select: {
//                 unitNumber: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!payment) {
//       return errorResponse(res, 'Payment not found', 404);
//     }

//     // Check if user is the renter
//     if (payment.userId !== userId) {
//       return errorResponse(res, 'Unauthorized to view this payment', 403);
//     }

//     const now = new Date();
//     const confirmationPeriodEnd = payment.confirmationPeriodEnd;
//     const isConfirmationPeriodActive = confirmationPeriodEnd && now < confirmationPeriodEnd;
//     const hoursRemaining = confirmationPeriodEnd
//       ? Math.max(0, Math.floor((confirmationPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60)))
//       : 0;

//     return successResponse(res, {
//       paymentId: payment.id,
//       amount: payment.amount,
//       status: payment.status,
//       isReleased: payment.isReleased,
//       confirmationPeriodEnd: payment.confirmationPeriodEnd,
//       isConfirmationPeriodActive,
//       hoursRemaining,
//       canRequestRefund: isConfirmationPeriodActive && !payment.isReleased,
//       property: {
//         title: payment.rental?.property.title,
//         address: payment.rental?.property.address,
//         unit: payment.rental?.unit?.unitNumber,
//       },
//     });
//   } catch (error) {
//     console.error('Get confirmation status error:', error);
//     return errorResponse(res, 'Failed to get confirmation status', 500);
//   }
// };

// /**
//  * Confirm payment and property satisfaction
//  * POST /api/payments/:paymentId/confirm
//  */
// export const confirmPayment = async (req: Request, res: Response) => {
//   try {
//     const { paymentId } = req.params;
//     const userId = req.user?.id;
//     const { confirmationNotes } = req.body;

//     if (!userId) {
//       return errorResponse(res, 'Unauthorized', 401);
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         rental: true,
//       },
//     });

//     if (!payment) {
//       return errorResponse(res, 'Payment not found', 404);
//     }

//     if (payment.userId !== userId) {
//       return errorResponse(res, 'Unauthorized to confirm this payment', 403);
//     }

//     // Check if payment is already released
//     if (payment.isReleased) {
//       return errorResponse(res, 'Payment has already been released', 400);
//     }

//     // Check if confirmation period has expired
//     const now = new Date();
//     if (payment.confirmationPeriodEnd && now > payment.confirmationPeriodEnd) {
//       return errorResponse(res, 'Confirmation period has expired', 400);
//     }

//     // Update rental to confirmed
//     if (payment.rental) {
//       await prisma.rental.update({
//         where: { id: payment.rental.id },
//         data: {
//           isConfirmed: true,
//           confirmedAt: now,
//         },
//       });
//     }

//     // Log the confirmation
//     await prisma.eventLog.create({
//       data: {
//         userId,
//         type: 'PAYMENT_CONFIRMED',
//         metadata: {
//           paymentId: payment.id,
//           rentalId: payment.rentalId,
//           confirmationNotes,
//           confirmedAt: now.toISOString(),
//         },
//       },
//     });

//     return successResponse(res, {
//       message: 'Payment confirmed successfully',
//       paymentId: payment.id,
//       confirmedAt: now,
//       note: 'Payment will be released to the property owner after the confirmation period ends',
//     });
//   } catch (error) {
//     console.error('Confirm payment error:', error);
//     return errorResponse(res, 'Failed to confirm payment', 500);
//   }
// };

// /**
//  * Get all pending confirmations for a user
//  * GET /api/payments/confirmations/pending
//  */
// export const getPendingConfirmations = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return errorResponse(res, 'Unauthorized', 401);
//     }

//     const now = new Date();

//     const pendingPayments = await prisma.payment.findMany({
//       where: {
//         userId,
//         status: PaymentStatus.HELD,
//         isReleased: false,
//         confirmationPeriodEnd: {
//           gte: now,
//         },
//       },
//       include: {
//         rental: {
//           include: {
//             property: {
//               select: {
//                 id: true,
//                 title: true,
//                 address: true,
//                 city: true,
//               },
//             },
//             unit: {
//               select: {
//                 unitNumber: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         confirmationPeriodEnd: 'asc',
//       },
//     });

//     const formattedPayments = pendingPayments.map((payment) => {
//       const hoursRemaining = payment.confirmationPeriodEnd
//         ? Math.max(
//             0,
//             Math.floor((payment.confirmationPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60))
//           )
//         : 0;

//       return {
//         id: payment.id,
//         amount: payment.amount,
//         currency: payment.currency,
//         status: payment.status,
//         confirmationPeriodEnd: payment.confirmationPeriodEnd,
//         hoursRemaining,
//         property: {
//           id: payment.rental?.property.id,
//           title: payment.rental?.property.title,
//           address: payment.rental?.property.address,
//           city: payment.rental?.property.city,
//           unit: payment.rental?.unit?.unitNumber,
//         },
//         rental: {
//           id: payment.rental?.id,
//           isConfirmed: payment.rental?.isConfirmed,
//         },
//       };
//     });

//     return successResponse(res, {
//       count: formattedPayments.length,
//       payments: formattedPayments,
//     });
//   } catch (error) {
//     console.error('Get pending confirmations error:', error);
//     return errorResponse(res, 'Failed to get pending confirmations', 500);
//   }
// };

// /**
//  * Extend confirmation period (admin only)
//  * POST /api/payments/:paymentId/extend-confirmation
//  */
// export const extendConfirmationPeriod = async (req: Request, res: Response) => {
//   try {
//     const { paymentId } = req.params;
//     const { extensionHours, reason } = req.body;
//     const adminId = req.user?.id;

//     if (!adminId) {
//       return errorResponse(res, 'Unauthorized', 401);
//     }

//     // Validate extension hours
//     if (!extensionHours || extensionHours <= 0 || extensionHours > 72) {
//       return errorResponse(res, 'Extension hours must be between 1 and 72', 400);
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//     });

//     if (!payment) {
//       return errorResponse(res, 'Payment not found', 404);
//     }

//     if (payment.isReleased) {
//       return errorResponse(res, 'Cannot extend confirmation period for released payment', 400);
//     }

//     const currentEnd = payment.confirmationPeriodEnd || new Date();
//     const newEnd = new Date(currentEnd.getTime() + extensionHours * 60 * 60 * 1000);

//     const updatedPayment = await prisma.payment.update({
//       where: { id: paymentId },
//       data: {
//         confirmationPeriodEnd: newEnd,
//       },
//     });

//     // Log admin action
//     await prisma.adminAction.create({
//       data: {
//         adminId,
//         action: 'PAYMENT_REFUNDED', // We can add a new action type later
//         targetType: 'Payment',
//         targetId: paymentId,
//         description: `Extended confirmation period by ${extensionHours} hours`,
//         metadata: {
//           reason,
//           originalEnd: currentEnd.toISOString(),
//           newEnd: newEnd.toISOString(),
//         },
//       },
//     });

//     return successResponse(res, {
//       message: 'Confirmation period extended successfully',
//       paymentId: updatedPayment.id,
//       newConfirmationPeriodEnd: newEnd,
//     });
//   } catch (error) {
//     console.error('Extend confirmation period error:', error);
//     return errorResponse(res, 'Failed to extend confirmation period', 500);
//   }
// };