import { PrismaClient, Rental, RentalStatus, PaymentStatus, Payment } from '@newcondo/db';

export class RentalService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createRental(rentalData: {
    propertyId: string;
    unitId?: string;
    renterId: string;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
  }): Promise<Rental> {
    try {
      // Check if property/unit is available
      const property = await this.prisma.property.findUnique({
        where: { id: rentalData.propertyId },
        include: {
          units: rentalData.unitId ? {
            where: { id: rentalData.unitId }
          } : false,
        },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      if (rentalData.unitId) {
        const unit = property.units?.[0];
        if (!unit || !unit.isAvailable) {
          throw new Error('Unit is not available for rental');
        }
      } else if (!property.isAvailable) {
        throw new Error('Property is not available for rental');
      }

      // Calculate confirmation deadline (7 days from creation)
      const confirmationDeadline = new Date();
      confirmationDeadline.setDate(confirmationDeadline.getDate() + 7);

      const rental = await this.prisma.rental.create({
        data: {
          propertyId: rentalData.propertyId,
          unitId: rentalData.unitId,
          renterId: rentalData.renterId,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          monthlyRent: rentalData.monthlyRent,
          status: RentalStatus.PENDING_CONFIRMATION,
          confirmationDeadline,
        },
      });

      return rental;
    } catch (error) {
      console.error('Error creating rental:', error);
      throw new Error(`Failed to create rental: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processSuccessfulRentPayment(paymentId: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          rental: {
            include: {
              property: true,
              unit: true,
            },
          },
        },
      });

      if (!payment || !payment.rental) {
        throw new Error('Payment or rental not found');
      }

      // Ensure the payment has not been processed before
      if (payment.status === PaymentStatus.COMPLETED && payment.rental.status === RentalStatus.ACTIVE) {
        console.warn(`Payment ${paymentId} already processed. Skipping.`);
        return;
      }

      await this.prisma.$transaction(async (prisma) => {
        // 1. Update payment status
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.COMPLETED },
        });

        // 2. Update rental status
        await prisma.rental.update({
          where: { id: payment.rental.id },
          data: { status: RentalStatus.ACTIVE, confirmedAt: new Date() },
        });

        // 3. Mark property or unit as unavailable
        if (payment.rental.unitId) {
          await prisma.unit.update({
            where: { id: payment.rental.unitId },
            data: { isAvailable: false },
          });
        } else {
          await prisma.property.update({
            where: { id: payment.rental.propertyId },
            data: { isAvailable: false },
          });
        }
      });

      console.log(`Rental for payment ${paymentId} successfully activated.`);

    } catch (error) {
      console.error('Error processing successful rent payment:', error);
      throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates the status of a rental.
   */
  async updateRentalStatus(rentalId: string, status: RentalStatus): Promise<Rental> {
    try {
      const updatedRental = await this.prisma.rental.update({
        where: { id: rentalId },
        data: { status },
      });
      return updatedRental;
    } catch (error) {
      console.error(`Error updating rental status for ${rentalId}:`, error);
      throw new Error(`Failed to update rental status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches all rentals for a specific user.
   */
  async getRentalsByUserId(userId: string): Promise<Rental[]> {
    try {
      const rentals = await this.prisma.rental.findMany({
        where: { renterId: userId },
        include: {
          property: true,
          unit: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return rentals;
    } catch (error) {
      console.error(`Error fetching rentals for user ${userId}:`, error);
      throw new Error(`Failed to fetch rentals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}



// import { PrismaClient, PaymentType, PaymentStatus, RentalStatus, Rental } from '@newcondo/db';
// import { Decimal } from 'decimal.js';
// import { standardResponse } from '../../../shared/src/utils/response';
// import type { ApiResponse } from '../../../shared/src/types/api';

// export interface CreateRentalPaymentData {
//   propertyId: string;
//   unitId?: string;
//   renterId: string;
//   startDate: Date;
//   endDate?: Date;
//   monthlyRent: number;
//   paymentType: PaymentType;
//   paymentMethod?: string;
//   description?: string;
// }

// export interface RentalPaymentResult {
//   rental: Rental;
//   paymentId: string;
//   amount: Decimal;
//   confirmationDeadline: Date;
// }

// export interface ConfirmRentalData {
//   rentalId: string;
//   userId: string;
// }

// export class RentalService {
//   private prisma: PrismaClient;

//   constructor() {
//     this.prisma = new PrismaClient();
//   }

//   /**
//    * Create rental agreement with payment
//    */
//   async createRentalPayment(data: CreateRentalPaymentData): Promise<ApiResponse<RentalPaymentResult>> {
//     try {
//       const { 
//         propertyId, 
//         unitId, 
//         renterId, 
//         startDate, 
//         endDate, 
//         monthlyRent, 
//         paymentType,
//         paymentMethod,
//         description 
//       } = data;

//       // Validate property and unit existence
//       const property = await this.prisma.property.findUnique({
//         where: { id: propertyId },
//         include: {
//           units: unitId ? { where: { id: unitId } } : undefined
//         }
//       });

//       if (!property) {
//         return standardResponse(false, 'Property not found', null, 404);
//       }

//       if (unitId) {
//         const unit = property.units?.find(u => u.id === unitId);
//         if (!unit) {
//           return standardResponse(false, 'Unit not found', null, 404);
//         }
//         if (!unit.isAvailable) {
//           return standardResponse(false, 'Unit is not available', null, 400);
//         }
//       } else {
//         if (!property.isAvailable) {
//           return standardResponse(false, 'Property is not available', null, 400);
//         }
//       }

//       // Validate renter exists
//       const renter = await this.prisma.user.findUnique({
//         where: { id: renterId }
//       });

//       if (!renter) {
//         return standardResponse(false, 'Renter not found', null, 404);
//       }

//       // Check if property/unit is already payment locked
//       if (property.isPaymentLocked && property.paymentLockExpiry && property.paymentLockExpiry > new Date()) {
//         return standardResponse(false, 'Property is currently locked for payment by another user', null, 423);
//       }

//       if (unitId) {
//         const unit = await this.prisma.propertyUnit.findUnique({
//           where: { id: unitId }
//         });
//         if (unit?.isPaymentLocked && unit.paymentLockExpiry && unit.paymentLockExpiry > new Date()) {
//           return standardResponse(false, 'Unit is currently locked for payment by another user', null, 423);
//         }
//       }

//       // Set confirmation deadline (7 days from now)
//       const confirmationDeadline = new Date();
//       confirmationDeadline.setDate(confirmationDeadline.getDate() + 7);

//       // Create rental and payment in transaction
//       const result = await this.prisma.$transaction(async (tx) => {
//         // Create rental
//         const rental = await tx.rental.create({
//           data: {
//             propertyId,
//             unitId,
//             renterId,
//             startDate,
//             endDate,
//             monthlyRent: new Decimal(monthlyRent),
//             status: RentalStatus.PENDING_CONFIRMATION,
//             confirmationDeadline,
//             isConfirmed: false
//           }
//         });

//         // Create payment record
//         const payment = await tx.payment.create({
//           data: {
//             userId: renterId,
//             rentalId: rental.id,
//             amount: new Decimal(monthlyRent),
//             currency: 'NGN',
//             paymentType,
//             status: PaymentStatus.PENDING,
//             paymentMethod,
//             description: description || `${paymentType.toLowerCase()} payment for property`,
//             confirmationPeriodEnd: confirmationDeadline
//           }
//         });

//         // Lock property/unit for payment (30 minutes)
//         const lockExpiry = new Date();
//         lockExpiry.setMinutes(lockExpiry.getMinutes() + 30);

//         if (unitId) {
//           await tx.propertyUnit.update({
//             where: { id: unitId },
//             data: {
//               isPaymentLocked: true,
//               paymentLockExpiry: lockExpiry
//             }
//           });
//         } else {
//           await tx.property.update({
//             where: { id: propertyId },
//             data: {
//               isPaymentLocked: true,
//               paymentLockExpiry: lockExpiry
//             }
//           });
//         }

//         return { rental, payment };
//       });

//       return standardResponse(true, 'Rental payment created successfully', {
//         rental: result.rental,
//         paymentId: result.payment.id,
//         amount: result.payment.amount,
//         confirmationDeadline
//       });

//     } catch (error) {
//       console.error('Error creating rental payment:', error);
//       return standardResponse(false, 'Failed to create rental payment', null, 500);
//     }
//   }

//   /**
//    * Confirm rental after successful payment
//    */
//   async confirmRental(data: ConfirmRentalData): Promise<ApiResponse<Rental>> {
//     try {
//       const { rentalId, userId } = data;

//       // Find rental with payment
//       const rental = await this.prisma.rental.findUnique({
//         where: { id: rentalId },
//         include: {
//           payments: {
//             where: { status: PaymentStatus.SUCCESS },
//             orderBy: { createdAt: 'desc' }
//           }
//         }
//       });

//       if (!rental) {
//         return standardResponse(false, 'Rental not found', null, 404);
//       }

//       if (rental.renterId !== userId) {
//         return standardResponse(false, 'Unauthorized to confirm this rental', null, 403);
//       }

//       if (rental.isConfirmed) {
//         return standardResponse(false, 'Rental already confirmed', null, 400);
//       }

//       // Check if payment was successful
//       if (rental.payments.length === 0) {
//         return standardResponse(false, 'No successful payment found for this rental', null, 400);
//       }

//       // Check confirmation deadline
//       if (rental.confirmationDeadline && rental.confirmationDeadline < new Date()) {
//         return standardResponse(false, 'Confirmation deadline has passed', null, 400);
//       }

//       // Confirm rental and update property/unit status
//       const updatedRental = await this.prisma.$transaction(async (tx) => {
//         // Update rental
//         const confirmedRental = await tx.rental.update({
//           where: { id: rentalId },
//           data: {
//             isConfirmed: true,
//             confirmedAt: new Date(),
//             status: RentalStatus.ACTIVE
//           }
//         });

//         // Update property/unit availability
//         if (rental.unitId) {
//           await tx.propertyUnit.update({
//             where: { id: rental.unitId },
//             data: {
//               isAvailable: false,
//               status: 'OCCUPIED'
//             }
//           });
//         } else {
//           await tx.property.update({
//             where: { id: rental.propertyId },
//             data: {
//               isAvailable: false,
//               status: 'RENTED'
//             }
//           });
//         }

//         return confirmedRental;
//       });

//       return standardResponse(true, 'Rental confirmed successfully', updatedRental);

//     } catch (error) {
//       console.error('Error confirming rental:', error);
//       return standardResponse(false, 'Failed to confirm rental', null, 500);
//     }
//   }

//   /**
//    * Cancel rental before confirmation
//    */
//   async cancelRental(rentalId: string, userId: string): Promise<ApiResponse<boolean>> {
//     try {
//       const rental = await this.prisma.rental.findUnique({
//         where: { id: rentalId }
//       });

//       if (!rental) {
//         return standardResponse(false, 'Rental not found', null, 404);
//       }

//       if (rental.renterId !== userId) {
//         return standardResponse(false, 'Unauthorized to cancel this rental', null, 403);
//       }

//       if (rental.isConfirmed) {
//         return standardResponse(false, 'Cannot cancel confirmed rental', null, 400);
//       }

//       await this.prisma.$transaction(async (tx) => {
//         // Update rental status
//         await tx.rental.update({
//           where: { id: rentalId },
//           data: {
//             status: RentalStatus.TERMINATED
//           }
//         });

//         // Release property/unit lock
//         if (rental.unitId) {
//           await tx.propertyUnit.update({
//             where: { id: rental.unitId },
//             data: {
//               isPaymentLocked: false,
//               paymentLockExpiry: null
//             }
//           });
//         } else {
//           await tx.property.update({
//             where: { id: rental.propertyId },
//             data: {
//               isPaymentLocked: false,
//               paymentLockExpiry: null
//             }
//           });
//         }

//         // Cancel pending payments
//         await tx.payment.updateMany({
//           where: {
//             rentalId: rentalId,
//             status: PaymentStatus.PENDING
//           },
//           data: {
//             status: PaymentStatus.CANCELLED
//           }
//         });
//       });

//       return standardResponse(true, 'Rental cancelled successfully', true);

//     } catch (error) {
//       console.error('Error cancelling rental:', error);
//       return standardResponse(false, 'Failed to cancel rental', null, 500);
//     }
//   }

//   /**
//    * Get rental by ID
//    */
//   async getRental(rentalId: string): Promise<ApiResponse<Rental | null>> {
//     try {
//       const rental = await this.prisma.rental.findUnique({
//         where: { id: rentalId },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               images: { take: 1, orderBy: { order: 'asc' } }
//             }
//           },
//           unit: {
//             select: {
//               id: true,
//               unitNumber: true,
//               bedrooms: true,
//               bathrooms: true
//             }
//           },
//           renter: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true
//             }
//           },
//           payments: {
//             orderBy: { createdAt: 'desc' }
//           }
//         }
//       });

//       return standardResponse(true, 'Rental retrieved successfully', rental);

//     } catch (error) {
//       console.error('Error getting rental:', error);
//       return standardResponse(false, 'Failed to get rental', null, 500);
//     }
//   }

//   /**
//    * Get user rentals
//    */
//   async getUserRentals(userId: string, status?: RentalStatus): Promise<ApiResponse<Rental[]>> {
//     try {
//       const where: any = { renterId: userId };
//       if (status) {
//         where.status = status;
//       }

//       const rentals = await this.prisma.rental.findMany({
//         where,
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//               images: { take: 1, orderBy: { order: 'asc' } }
//             }
//           },
//           unit: {
//             select: {
//               id: true,
//               unitNumber: true,
//               bedrooms: true,
//               bathrooms: true
//             }
//           },
//           payments: {
//             select: {
//               id: true,
//               amount: true,
//               status: true,
//               paidAt: true
//             },
//             orderBy: { createdAt: 'desc' },
//             take: 1
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       });

//       return standardResponse(true, 'User rentals retrieved successfully', rentals);

//     } catch (error) {
//       console.error('Error getting user rentals:', error);
//       return standardResponse(false, 'Failed to get user rentals', null, 500);
//     }
//   }

//   /**
//    * Process expired rental confirmations
//    */
//   async processExpiredConfirmations(): Promise<void> {
//     try {
//       const expiredRentals = await this.prisma.rental.findMany({
//         where: {
//           status: RentalStatus.PENDING_CONFIRMATION,
//           confirmationDeadline: {
//             lt: new Date()
//           }
//         }
//       });

//       for (const rental of expiredRentals) {
//         await this.prisma.$transaction(async (tx) => {
//           // Update rental status
//           await tx.rental.update({
//             where: { id: rental.id },
//             data: {
//               status: RentalStatus.EXPIRED
//             }
//           });

//           // Release property/unit locks
//           if (rental.unitId) {
//             await tx.propertyUnit.update({
//               where: { id: rental.unitId },
//               data: {
//                 isPaymentLocked: false,
//                 paymentLockExpiry: null,
//                 isAvailable: true
//               }
//             });
//           } else {
//             await tx.property.update({
//               where: { id: rental.propertyId },
//               data: {
//                 isPaymentLocked: false,
//                 paymentLockExpiry: null,
//                 isAvailable: true
//               }
//             });
//           }

//           // Refund payments that were held
//           await tx.payment.updateMany({
//             where: {
//               rentalId: rental.id,
//               status: PaymentStatus.HELD
//             },
//             data: {
//               status: PaymentStatus.REFUNDED
//             }
//           });
//         });
//       }

//       console.log(`Processed ${expiredRentals.length} expired rental confirmations`);

//     } catch (error) {
//       console.error('Error processing expired confirmations:', error);
//     }
//   }

//   /**
//    * Cleanup method
//    */
//   async disconnect(): Promise<void> {
//     await this.prisma.$disconnect();
//   }
// }