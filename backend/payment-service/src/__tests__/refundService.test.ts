import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@newcondo/db';
import { RefundService } from '../services/refundService';
import { PaymentStatus } from '@newcondo/db';

vi.mock('@newcondo/db');

describe('RefundService', () => {
  let refundService: RefundService;
  let mockPrisma: any;
  let mockFlutterwaveService: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockFlutterwaveService = {
      refundPayment: vi.fn(),
    };
    refundService = new RefundService(mockPrisma, mockFlutterwaveService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateRefund', () => {
    it('should successfully initiate a refund', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        amount: 100000,
        status: PaymentStatus.HELD,
        platformFee: 4000,
        flutterwaveRef: 'fw-ref-123',
        confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000),
        isReleased: false,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockFlutterwaveService.refundPayment.mockResolvedValue({
        status: 'success',
        transactionId: 'refund-tx-123',
      });
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
      });

      const result = await refundService.initiateRefund({
        paymentId: 'payment-123',
        userId: 'user-123',
        reason: 'Property not as described',
      });

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(96000); // 100000 - 4000 (platform fee is non-refundable)
      expect(result.platformFeeRetained).toBe(4000);
    });

    it('should reject refund if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        refundService.initiateRefund({
          paymentId: 'invalid-payment',
          userId: 'user-123',
          reason: 'Test',
        })
      ).rejects.toThrow('Payment not found');
    });

    it('should reject refund if user is not the payer', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'different-user',
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        refundService.initiateRefund({
          paymentId: 'payment-123',
          userId: 'user-123',
          reason: 'Test',
        })
      ).rejects.toThrow('Unauthorized to refund this payment');
    });

    it('should reject refund if confirmation period expired', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        confirmationPeriodEnd: new Date(Date.now() - 1000),
        status: PaymentStatus.HELD,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        refundService.initiateRefund({
          paymentId: 'payment-123',
          userId: 'user-123',
          reason: 'Test',
        })
      ).rejects.toThrow('Refund period has expired');
    });

    it('should reject refund if payment already released', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: 'user-123',
        status: PaymentStatus.RELEASED,
        isReleased: true,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        refundService.initiateRefund({
          paymentId: 'payment-123',
          userId: 'user-123',
          reason: 'Test',
        })
      ).rejects.toThrow('Payment has already been released');
    });
  });

  describe('calculateRefundAmount', () => {
    it('should deduct platform fee from refund amount', () => {
      const result = refundService.calculateRefundAmount({
        totalPaid: 100000,
        platformFee: 4000,
      });

      expect(result.refundAmount).toBe(96000);
      expect(result.platformFeeRetained).toBe(4000);
    });

    it('should handle cases with no platform fee', () => {
      const result = refundService.calculateRefundAmount({
        totalPaid: 100000,
        platformFee: 0,
      });

      expect(result.refundAmount).toBe(100000);
      expect(result.platformFeeRetained).toBe(0);
    });
  });

  describe('canRequestRefund', () => {
    it('should return true if within confirmation period', () => {
      const result = refundService.canRequestRefund({
        confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000),
        isReleased: false,
        status: PaymentStatus.HELD,
      });

      expect(result.canRefund).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return false if confirmation period expired', () => {
      const result = refundService.canRequestRefund({
        confirmationPeriodEnd: new Date(Date.now() - 1000),
        isReleased: false,
        status: PaymentStatus.HELD,
      });

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Refund period has expired');
    });

    it('should return false if payment already released', () => {
      const result = refundService.canRequestRefund({
        confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000),
        isReleased: true,
        status: PaymentStatus.RELEASED,
      });

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Payment has already been released');
    });

    it('should return false if payment already refunded', () => {
      const result = refundService.canRequestRefund({
        confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000),
        isReleased: false,
        status: PaymentStatus.REFUNDED,
      });

      expect(result.canRefund).toBe(false);
      expect(result.reason).toBe('Payment has already been refunded');
    });
  });
});