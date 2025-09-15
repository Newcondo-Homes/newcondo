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