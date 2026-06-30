import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@newcondo/db';
import { ConfirmationService } from '../services/confirmationService';
import { PaymentStatus, RentalStatus } from '@newcondo/db';

// Mock Prisma Client
vi.mock('@newcondo/db', () => ({
  PrismaClient: vi.fn(() => ({
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    rental: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  })),
  PaymentStatus: {
    PENDING: 'PENDING',
    HELD: 'HELD',
    RELEASED: 'RELEASED',
    REFUNDED: 'REFUNDED',
  },
  RentalStatus: {
    PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
    ACTIVE: 'ACTIVE',
  },
}));

describe('ConfirmationService', () => {
  let confirmationService: ConfirmationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    confirmationService = new ConfirmationService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('confirmPayment', () => {
    it('should successfully confirm a payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        rentalId: 'rental-123',
        amount: 100000,
        status: PaymentStatus.HELD,
        confirmationPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockRental = {
        id: 'rental-123',
        status: RentalStatus.PENDING_CONFIRMATION,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrisma.rental.findUnique.mockResolvedValue(mockRental);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayment,
        isReleased: true,
        status: PaymentStatus.RELEASED,
      });
      mockPrisma.rental.update.mockResolvedValue({
        ...mockRental,
        isConfirmed: true,
        status: RentalStatus.ACTIVE,
      });

      const result = await confirmationService.confirmPayment('payment-123', 'user-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          isReleased: true,
          releasedAt: expect.any(Date),
          status: PaymentStatus.RELEASED,
        },
      });
    });

    it('should reject confirmation if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        confirmationService.confirmPayment('invalid-payment', 'user-123')
      ).rejects.toThrow('Payment not found');
    });

    it('should reject confirmation if user is not the payer', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'different-user',
        status: PaymentStatus.HELD,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        confirmationService.confirmPayment('payment-123', 'user-123')
      ).rejects.toThrow('Unauthorized to confirm this payment');
    });

    it('should reject confirmation if payment is not in HELD status', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        status: PaymentStatus.RELEASED,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        confirmationService.confirmPayment('payment-123', 'user-123')
      ).rejects.toThrow('Payment is not in confirmable state');
    });

    it('should reject confirmation if confirmation period has expired', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        status: PaymentStatus.HELD,
        confirmationPeriodEnd: new Date(Date.now() - 1000), // Expired
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        confirmationService.confirmPayment('payment-123', 'user-123')
      ).rejects.toThrow('Confirmation period has expired');
    });
  });

  describe('checkConfirmationStatus', () => {
    it('should return correct status for pending confirmation', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.HELD,
        confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000),
        isReleased: false,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await confirmationService.checkConfirmationStatus('payment-123');

      expect(result.canConfirm).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.hoursRemaining).toBeGreaterThan(0);
    });

    it('should return correct status for expired confirmation', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.HELD,
        confirmationPeriodEnd: new Date(Date.now() - 1000),
        isReleased: false,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await confirmationService.checkConfirmationStatus('payment-123');

      expect(result.canConfirm).toBe(false);
      expect(result.isExpired).toBe(true);
    });

    it('should return correct status for already confirmed payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        status: PaymentStatus.RELEASED,
        isReleased: true,
        releasedAt: new Date(),
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await confirmationService.checkConfirmationStatus('payment-123');

      expect(result.canConfirm).toBe(false);
      expect(result.isConfirmed).toBe(true);
    });
  });

  describe('getExpiredPayments', () => {
    it('should retrieve all expired unconfirmed payments', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          confirmationPeriodEnd: new Date(Date.now() - 1000),
          status: PaymentStatus.HELD,
        },
        {
          id: 'payment-2',
          confirmationPeriodEnd: new Date(Date.now() - 2000),
          status: PaymentStatus.HELD,
        },
      ];

      mockPrisma.payment.findMany = vi.fn().mockResolvedValue(mockPayments);

      const result = await confirmationService.getExpiredPayments();

      expect(result).toHaveLength(2);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.HELD,
          isReleased: false,
          confirmationPeriodEnd: {
            lt: expect.any(Date),
          },
        },
        include: expect.any(Object),
      });
    });
  });
});