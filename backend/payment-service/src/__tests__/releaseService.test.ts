import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@newcondo/db';
import { ReleaseService } from '../services/releaseService';
import { PaymentStatus } from '@newcondo/db';

vi.mock('@newcondo/db');

describe('ReleaseService', () => {
  let releaseService: ReleaseService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    releaseService = new ReleaseService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('releasePayment', () => {
    it('should successfully release payment to all parties', async () => {
      const mockPayment = {
        id: 'payment-123',
        amount: 100000,
        status: PaymentStatus.HELD,
        isReleased: false,
        rental: {
          id: 'rental-123',
          property: {
            id: 'property-123',
            ownerId: 'owner-123',
            agentId: 'agent-123',
            isOwnerListing: false,
          },
        },
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      const result = await releaseService.releasePayment('payment-123');

      expect(result.success).toBe(true);
      expect(result.distributions).toBeDefined();
      expect(mockPrisma.payment.update).toHaveBeenCalled();
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(releaseService.releasePayment('invalid-payment')).rejects.toThrow(
        'Payment not found'
      );
    });

    it('should throw error if payment already released', async () => {
      const mockPayment = {
        id: 'payment-123',
        isReleased: true,
        status: PaymentStatus.RELEASED,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(releaseService.releasePayment('payment-123')).rejects.toThrow(
        'Payment already released'
      );
    });
  });

  describe('scheduleAutomaticRelease', () => {
    it('should schedule release for expired confirmation periods', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          confirmationPeriodEnd: new Date(Date.now() - 1000),
        },
      ];

      mockPrisma.payment.findMany = vi.fn().mockResolvedValue(mockPayments);
      const releaseSpy = vi.spyOn(releaseService, 'releasePayment').mockResolvedValue({
        success: true,
        paymentId: 'payment-1',
        distributions: [],
      } as any);

      await releaseService.scheduleAutomaticRelease();

      expect(releaseSpy).toHaveBeenCalledWith('payment-1');
    });
  });

  describe('releaseFundsToVirtualAccounts', () => {
    it('should distribute funds correctly to all parties', async () => {
      mockPrisma.virtualAccount.findFirst = vi.fn().mockResolvedValue({
        id: 'va-123',
        balance: 50000,
      });
      mockPrisma.virtualAccount.update = vi.fn().mockResolvedValue({});

      const distributions = [
        { accountId: 'va-owner', amount: 80000, party: 'OWNER' },
        { accountId: 'va-agent', amount: 10000, party: 'AGENT' },
        { accountId: 'va-newcondo', amount: 10000, party: 'NEWCONDO' },
      ];

      await releaseService.releaseFundsToVirtualAccounts('payment-123', distributions);

      expect(mockPrisma.virtualAccount.update).toHaveBeenCalledTimes(3);
    });
  });
});