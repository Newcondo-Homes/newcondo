// backend/marking-service/tests/unit/compensationService.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CompensationService } from '../../src/services/compensationService';
import { prisma } from '@newcondo/db';

// Mock Prisma
jest.mock('@newcondo/db', () => ({
  prisma: {
    propertyMarkingJob: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    virtualAccount: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('CompensationService', () => {
  let compensationService: CompensationService;

  beforeEach(() => {
    jest.clearAllMocks();
    compensationService = new CompensationService();
  });

  describe('calculateMarkingCompensation', () => {
    it('should calculate correct compensation for agent (25% of 20,000)', () => {
      const totalFee = 20000;
      const result = compensationService.calculateMarkingCompensation(totalFee);

      expect(result.agentCompensation).toBe(5000); // 25% of 20,000
      expect(result.platformFee).toBe(15000); // Remaining 75%
      expect(result.initialPayment).toBe(1000); // Initial payment to agent
      expect(result.remainingPayment).toBe(4000); // Remaining after initial
    });

    it('should handle custom initial payment percentage', () => {
      const totalFee = 20000;
      const result = compensationService.calculateMarkingCompensation(
        totalFee,
        0.25,
        0.1 // 10% initial payment
      );

      expect(result.initialPayment).toBe(500); // 10% of 5,000
      expect(result.remainingPayment).toBe(4500); // 90% of 5,000
    });

    it('should calculate compensation for Newcondo marking job (25,000)', () => {
      const totalFee = 25000;
      const result = compensationService.calculateMarkingCompensation(
        totalFee,
        1.0 // 100% to Newcondo
      );

      expect(result.agentCompensation).toBe(25000);
      expect(result.platformFee).toBe(0);
    });
  });

  describe('processInitialCompensation', () => {
    it('should successfully process initial compensation for agent', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'IN_PROGRESS',
      };

      const mockVirtualAccount = {
        id: 'va123',
        userId: 'agent123',
        balance: 0,
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.virtualAccount.findFirst as jest.Mock).mockResolvedValue(mockVirtualAccount);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });
      (prisma.virtualAccount.update as jest.Mock).mockResolvedValue({
        ...mockVirtualAccount,
        balance: 1000,
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment123',
        amount: 1000,
        status: 'HELD',
      });

      const result = await compensationService.processInitialCompensation('job123');

      expect(result.success).toBe(true);
      expect(result.amountPaid).toBe(1000);
      expect(prisma.virtualAccount.update).toHaveBeenCalledWith({
        where: { id: 'va123' },
        data: { balance: { increment: 1000 } },
      });
    });

    it('should throw error if marking job not found', async () => {
      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        compensationService.processInitialCompensation('invalid-job')
      ).rejects.toThrow('Marking job not found');
    });

    it('should throw error if no agent assigned', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: null,
        markingFee: 20000,
        status: 'QUEUED',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      await expect(
        compensationService.processInitialCompensation('job123')
      ).rejects.toThrow('No agent assigned to this marking job');
    });

    it('should throw error if virtual account not found', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'IN_PROGRESS',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.virtualAccount.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        compensationService.processInitialCompensation('job123')
      ).rejects.toThrow('Virtual account not found for agent');
    });
  });

  describe('processRemainingCompensation', () => {
    it('should successfully process remaining compensation after owner confirmation', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'COMPLETED',
      };

      const mockVirtualAccount = {
        id: 'va123',
        userId: 'agent123',
        balance: 1000, // Initial payment already received
      };

      const mockInitialPayment = {
        id: 'payment123',
        amount: 1000,
        status: 'HELD',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.virtualAccount.findFirst as jest.Mock).mockResolvedValue(mockVirtualAccount);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockInitialPayment);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });
      (prisma.virtualAccount.update as jest.Mock).mockResolvedValue({
        ...mockVirtualAccount,
        balance: 5000, // 1000 + 4000
      });
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockInitialPayment,
        status: 'RELEASED',
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment456',
        amount: 4000,
        status: 'RELEASED',
      });

      const result = await compensationService.processRemainingCompensation('job123');

      expect(result.success).toBe(true);
      expect(result.amountPaid).toBe(4000);
      expect(result.totalPaid).toBe(5000);
      expect(prisma.virtualAccount.update).toHaveBeenCalledWith({
        where: { id: 'va123' },
        data: { balance: { increment: 4000 } },
      });
    });

    it('should throw error if job is not completed', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'IN_PROGRESS',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

      await expect(
        compensationService.processRemainingCompensation('job123')
      ).rejects.toThrow('Marking job is not completed');
    });

    it('should throw error if initial payment not found', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'COMPLETED',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.virtualAccount.findFirst as jest.Mock).mockResolvedValue({ id: 'va123' });
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        compensationService.processRemainingCompensation('job123')
      ).rejects.toThrow('Initial payment not found');
    });
  });

  describe('handleExpiredConfirmation', () => {
    it('should process partial compensation for expired confirmation', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'COMPLETED',
      };

      const mockVirtualAccount = {
        id: 'va123',
        userId: 'agent123',
        balance: 1000,
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.virtualAccount.findFirst as jest.Mock).mockResolvedValue(mockVirtualAccount);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(prisma);
      });
      (prisma.virtualAccount.update as jest.Mock).mockResolvedValue({
        ...mockVirtualAccount,
        balance: 2000, // Added 1000
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment789',
        amount: 1000,
        status: 'RELEASED',
      });

      const result = await compensationService.handleExpiredConfirmation('job123');

      expect(result.success).toBe(true);
      expect(result.compensationPaid).toBe(1000);
      expect(result.remainingFee).toBe(3000); // 4000 - 1000
    });
  });

  describe('processPlatformFee', () => {
    it('should calculate and record platform fee', async () => {
      const mockJob = {
        id: 'job123',
        assignedAgentId: 'agent123',
        markingFee: 20000,
        status: 'COMPLETED',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'platform-fee-123',
        amount: 15000,
        paymentType: 'PROPERTY_MARKING',
      });

      const result = await compensationService.processPlatformFee('job123');

      expect(result.success).toBe(true);
      expect(result.platformFee).toBe(15000);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 15000,
          paymentType: 'PROPERTY_MARKING',
          description: expect.stringContaining('Platform fee'),
        }),
      });
    });
  });

  describe('getCompensationSummary', () => {
    it('should return comprehensive compensation summary', async () => {
      const mockPayments = [
        {
          id: 'payment1',
          amount: 1000,
          status: 'HELD',
          paymentType: 'PROPERTY_MARKING',
          description: 'Initial compensation',
          createdAt: new Date(),
        },
        {
          id: 'payment2',
          amount: 4000,
          status: 'RELEASED',
          paymentType: 'PROPERTY_MARKING',
          description: 'Remaining compensation',
          createdAt: new Date(),
        },
      ];

      const mockJob = {
        id: 'job123',
        markingFee: 20000,
        assignedAgentId: 'agent123',
        status: 'COMPLETED',
      };

      (prisma.propertyMarkingJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);

      const result = await compensationService.getCompensationSummary('job123');

      expect(result.totalFee).toBe(20000);
      expect(result.agentCompensation).toBe(5000);
      expect(result.platformFee).toBe(15000);
      expect(result.paidToAgent).toBe(5000);
      expect(result.paymentStatus).toBe('COMPLETED');
    });
  });

  describe('edge cases', () => {
    it('should handle zero marking fee', () => {
      const result = compensationService.calculateMarkingCompensation(0);

      expect(result.agentCompensation).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.initialPayment).toBe(0);
      expect(result.remainingPayment).toBe(0);
    });

    it('should handle very large marking fee', () => {
      const totalFee = 1000000;
      const result = compensationService.calculateMarkingCompensation(totalFee);

      expect(result.agentCompensation).toBe(250000); // 25%
      expect(result.platformFee).toBe(750000); // 75%
    });

    it('should handle fractional amounts correctly', () => {
      const totalFee = 20001; // Odd number
      const result = compensationService.calculateMarkingCompensation(totalFee);

      expect(result.agentCompensation).toBe(5000.25); // 25% of 20,001
      expect(result.platformFee).toBe(15000.75); // Remaining
    });
  });
});