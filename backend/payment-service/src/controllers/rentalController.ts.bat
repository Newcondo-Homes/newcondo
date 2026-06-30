import { Request, Response } from 'express';
import { RentalService } from '../services/rentalService';
import { PaymentService } from '../services/paymentService';
import { LockingService } from '../services/lockingService';
import { FlutterwaveService } from '../services/flutterwaveService';
import { ApiResponse } from '../../shared/src/utils/response';
import { PaymentType, PaymentStatus, RentalStatus } from '@newcondo/db';
import { z } from 'zod';

const createRentalPaymentSchema = z.object({
  propertyId: z.string(),
  unitId: z.string().optional(),
  monthlyRent: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  redirectUrl: z.string().url(),
});

const confirmRentalSchema = z.object({
  rentalId: z.string(),
  confirmed: z.boolean(),
});

export class RentalController {
  private rentalService: RentalService;
  private paymentService: PaymentService;
  private lockingService: LockingService;
  private flutterwaveService: FlutterwaveService;

  constructor() {
    this.rentalService = new RentalService();
    this.paymentService = new PaymentService();
    this.lockingService = new LockingService();
    this.flutterwaveService = new FlutterwaveService();
  }

  /**
   * Initiate rental payment process
   */
  public initiateRentalPayment = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    let validatedData;

    try {
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      validatedData = createRentalPaymentSchema.parse(req.body);

      // Check if property/unit is available
      const isAvailable = await this.rentalService.checkAvailability(
        validatedData.propertyId,
        validatedData.unitId
      );

      if (!isAvailable) {
        res.status(409).json(ApiResponse.error('Property is not available', 409));
        return;
      }

      // Lock the property to prevent double booking
      const lockResult = await this.lockingService.lockProperty(
        validatedData.propertyId,
        validatedData.unitId,
        userId,
        15 // 15 minutes lock
      );

      if (!lockResult.success) {
        res.status(409).json(ApiResponse.error(lockResult.error || 'Unable to reserve property', 409));
        return;
      }

      // Create payment record for rent
      const payment = await this.paymentService.createPayment({
        userId,
        amount: validatedData.monthlyRent,
        currency: 'NGN',
        paymentType: PaymentType.RENT,
        description: `Rent payment for property ${validatedData.propertyId}`,
      });

      // Initialize Flutterwave payment
      const flutterwaveResponse = await this.flutterwaveService.initiatePayment({
        tx_ref: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        redirect_url: validatedData.redirectUrl,
        meta: {
          userId,
          paymentId: payment.id,
          propertyId: validatedData.propertyId,
          unitId: validatedData.unitId,
        }
      });
      
      if (!flutterwaveResponse || !flutterwaveResponse.data || !flutterwaveResponse.data.link) {
          throw new Error('Flutterwave payment initiation failed');
      }

      // Create rental record
      const rental = await this.rentalService.createRental({
        userId,
        propertyId: validatedData.propertyId,
        unitId: validatedData.unitId,
        monthlyRent: validatedData.monthlyRent,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: RentalStatus.PENDING_PAYMENT,
        paymentId: payment.id,
      });

      // Link payment to rental
      await this.paymentService.updatePayment(payment.id, {
        rentalId: rental.id,
      });

      res.status(200).json(ApiResponse.success('Rental payment initiated', {
        paymentUrl: flutterwaveResponse.data.link,
        rentalId: rental.id,
        paymentId: payment.id,
      }));

    } catch (error: any) {
      console.error('Error initiating rental payment:', error);
      res.status(500).json(ApiResponse.error(error.message || 'An unexpected error occurred', 500));
    } finally {
      if (validatedData) {
        // Ensure property lock is always released
        await this.lockingService.unlockProperty(
          validatedData.propertyId,
          validatedData.unitId,
          userId
        );
      }
    }
  };

  /**
   * Confirm rental agreement after successful payment
   */
  public confirmRental = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    let validatedData;
    try {
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      validatedData = confirmRentalSchema.parse(req.body);
      const { rentalId, confirmed } = validatedData;

      // Acquire lock for the rental process
      const lockResult = await this.lockingService.lockRental(rentalId, userId, 5); // 5 minutes lock
      if (!lockResult.success) {
        res.status(409).json(ApiResponse.error(lockResult.error || 'Unable to lock rental record', 409));
        return;
      }

      const rental = await this.rentalService.getRentalById(rentalId);
      if (!rental) {
        res.status(404).json(ApiResponse.error('Rental record not found', 404));
        return;
      }

      // Only allow confirmation if the rental is pending payment
      if (rental.status !== RentalStatus.PENDING_PAYMENT) {
        res.status(409).json(ApiResponse.error('Rental is not in a confirmable state', 409));
        return;
      }

      let newStatus: RentalStatus;
      let newPaymentStatus: PaymentStatus;

      if (confirmed) {
        newStatus = RentalStatus.ACTIVE;
        newPaymentStatus = PaymentStatus.COMPLETED;
      } else {
        newStatus = RentalStatus.REJECTED;
        newPaymentStatus = PaymentStatus.CANCELLED;
      }

      // Update rental status
      await this.rentalService.updateRental(rentalId, { status: newStatus });

      // Update associated payment status
      if (rental.paymentId) {
        await this.paymentService.updatePayment(rental.paymentId, { status: newPaymentStatus });
      }

      res.status(200).json(ApiResponse.success('Rental confirmation successful', {
        rentalId: rental.id,
        newStatus,
      }));

    } catch (error: any) {
      console.error('Error confirming rental:', error);
      res.status(500).json(ApiResponse.error(error.message || 'An unexpected error occurred', 500));
    } finally {
      if (validatedData) {
        await this.lockingService.unlockRental(validatedData.rentalId);
      }
    }
  };
}