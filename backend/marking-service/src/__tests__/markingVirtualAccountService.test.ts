import { jest } from '@jest/globals';
import { MarkingVirtualAccountService } from '../services/markingVirtualAccountService';
import { FlutterwaveVirtualAccountService } from '../../payment-service/src/services/flutterwaveVirtualAccountService';
import { PrismaClient } from '@newcondo/db';
import { markingAccountConfig } from '../config/markingAccountConfig';

// Mock dependencies
jest.mock('../../payment-service/src/services/flutterwaveVirtualAccountService');
jest.mock('@newcondo/db');

const mockFlutterwaveService = FlutterwaveVirtualAccountService as jest.MockedClass<typeof FlutterwaveVirtualAccountService>;
const mockPrisma = {
  virtualAccount: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  propertyMarkingJob: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  }
} as any;

describe('MarkingVirtualAccountService', () => {
  let service: MarkingVirtualAccountService;
  let mockFlutterwaveInstance: jest.MockedObject<FlutterwaveVirtualAccountService>;

  beforeEach(() => {
    mockFlutterwaveInstance = {
      createVirtualAccount: jest.fn(),
      getAccountBalance: jest.fn(),
      getAccountTransactions: jest.fn(),
      deactivateAccount: jest.fn(),
      validateWebhook: jest.fn()
    } as any;

    mockFlutterwaveService.mockImplementation(() => mockFlutterwaveInstance);
    service = new MarkingVirtualAccountService(mockPrisma);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createAgentVirtualAccount', () => {
    it('should create virtual account for marking agent successfully', async () => {
      const agentId = 'agent-123';
      const agentData = {
        id: agentId,
        name: 'John Doe Agent',
        email: 'john@example.com',
        phone: '+2348012345678',
        role: 'AGENT',
        isAvailableForMarking: true
      };

      const mockFlutterwaveAccount = {
        account_number: '1234567890',
        account_reference: 'fw-ref-123',
        bank_name: 'Test Bank',
        bank_code: '035'
      };

      const mockVirtualAccount = {
        id: 'va-123',
        accountNumber: '1234567890',
        accountName: 'John Doe Agent Marking VA',
        bankCode: '035',
        userId: agentId,
        propertyId: null,
        balance: '0.00',
        currency: 'NGN',
        isActive: true,
        flutterwaveAccountId: 'fw-ref-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(agentData);
      mockFlutterwaveInstance.createVirtualAccount.mockResolvedValue(mockFlutterwaveAccount);
      mockPrisma.virtualAccount.create.mockResolvedValue(mockVirtualAccount);

      const result = await service.createAgentVirtualAccount(agentId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isAvailableForMarking: true
        }
      });

      expect(mockFlutterwaveInstance.createVirtualAccount).toHaveBeenCalledWith({
        email: agentData.email,
        is_permanent: true,
        bvn: undefined,
        tx_ref: expect.stringContaining('agent-marking-'),
        phonenumber: agentData.phone,
        firstname: 'John Doe Agent',
        lastname: 'Marking',
        narration: 'NewCondo Agent Marking Account'
      });

      expect(mockPrisma.virtualAccount.create).toHaveBeenCalledWith({
        data: {
          accountNumber: '1234567890',
          accountName: 'John Doe Agent Marking VA',
          bankCode: '035',
          userId: agentId,
          propertyId: null,
          balance: 0,
          currency: 'NGN',
          isActive: true,
          flutterwaveAccountId: 'fw-ref-123'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      expect(result).toEqual(mockVirtualAccount);
    });

    it('should throw error if agent is not available for marking', async () => {
      const agentId = 'agent-123';
      const agentData = {
        id: agentId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+2348012345678',
        role: 'AGENT',
        isAvailableForMarking: false
      };

      mockPrisma.user.findUnique.mockResolvedValue(agentData);

      await expect(service.createAgentVirtualAccount(agentId)).rejects.toThrow(
        'Agent is not available for marking services'
      );
    });

    it('should throw error if user is not an agent', async () => {
      const userId = 'user-123';
      const userData = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+2348012345678',
        role: 'RENTER',
        isAvailableForMarking: false
      };

      mockPrisma.user.findUnique.mockResolvedValue(userData);

      await expect(service.createAgentVirtualAccount(userId)).rejects.toThrow(
        'User is not an agent'
      );
    });

    it('should throw error if agent already has virtual account', async () => {
      const agentId = 'agent-123';
      const agentData = {
        id: agentId,
        name: 'John Doe Agent',
        email: 'john@example.com',
        phone: '+2348012345678',
        role: 'AGENT',
        isAvailableForMarking: true
      };

      const existingAccount = {
        id: 'va-existing',
        userId: agentId,
        propertyId: null
      };

      mockPrisma.user.findUnique.mockResolvedValue(agentData);
      mockPrisma.virtualAccount.findUnique.mockResolvedValue(existingAccount);

      await expect(service.createAgentVirtualAccount(agentId)).rejects.toThrow(
        'Agent already has a virtual account for marking services'
      );
    });
  });

  describe('holdPaymentForMarkingJob', () => {
    it('should hold payment in marking virtual account successfully', async () => {
      const paymentData = {
        markingJobId: 'job-123',
        agentId: 'agent-123',
        amount: 50.00,
        paymentReference: 'pay-ref-123'
      };

      const mockMarkingJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        markingFee: 50.00,
        status: 'ASSIGNED'
      };

      const mockVirtualAccount = {
        id: 'va-123',
        accountNumber: '1234567890',
        userId: 'agent-123',
        balance: 0.00,
        isActive: true
      };

      const mockHeldPayment = {
        id: 'payment-123',
        userId: 'system',
        markingJobId: 'job-123',
        amount: 50.00,
        currency: 'NGN',
        paymentType: 'PROPERTY_MARKING',
        status: 'HELD',
        flutterwaveRef: 'pay-ref-123',
        description: 'Marking fee held for job job-123',
        createdAt: new Date()
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.virtualAccount.findUnique.mockResolvedValue(mockVirtualAccount);
      mockPrisma.payment.create.mockResolvedValue(mockHeldPayment);
      mockPrisma.virtualAccount.update.mockResolvedValue({
        ...mockVirtualAccount,
        balance: 50.00
      });

      const result = await service.holdPaymentForMarkingJob(paymentData);

      expect(mockPrisma.propertyMarkingJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' }
      });

      expect(mockPrisma.virtualAccount.findUnique).toHaveBeenCalledWith({
        where: {
          userId_propertyId: {
            userId: 'agent-123',
            propertyId: null
          }
        }
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          userId: 'system',
          markingJobId: 'job-123',
          amount: 50.00,
          currency: 'NGN',
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
          flutterwaveRef: 'pay-ref-123',
          description: 'Marking fee held for job job-123'
        }
      });

      expect(mockPrisma.virtualAccount.update).toHaveBeenCalledWith({
        where: { id: 'va-123' },
        data: { balance: 50.00 }
      });

      expect(result).toEqual(mockHeldPayment);
    });

    it('should throw error if marking job not found', async () => {
      const paymentData = {
        markingJobId: 'non-existent',
        agentId: 'agent-123',
        amount: 50.00,
        paymentReference: 'pay-ref-123'
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(null);

      await expect(service.holdPaymentForMarkingJob(paymentData)).rejects.toThrow(
        'Marking job not found'
      );
    });

    it('should throw error if agent virtual account not found', async () => {
      const paymentData = {
        markingJobId: 'job-123',
        agentId: 'agent-123',
        amount: 50.00,
        paymentReference: 'pay-ref-123'
      };

      const mockMarkingJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        markingFee: 50.00,
        status: 'ASSIGNED'
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.virtualAccount.findUnique.mockResolvedValue(null);

      await expect(service.holdPaymentForMarkingJob(paymentData)).rejects.toThrow(
        'Agent virtual account not found'
      );
    });
  });

  describe('releasePaymentForCompletedJob', () => {
    it('should release payment to agent after job completion', async () => {
      const releaseData = {
        markingJobId: 'job-123',
        agentId: 'agent-123'
      };

      const mockMarkingJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        status: 'COMPLETED',
        markingFee: 50.00
      };

      const mockHeldPayment = {
        id: 'payment-123',
        markingJobId: 'job-123',
        amount: 50.00,
        status: 'HELD'
      };

      const mockVirtualAccount = {
        id: 'va-123',
        userId: 'agent-123',
        balance: 50.00
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.payment.findMany.mockResolvedValue([mockHeldPayment]);
      mockPrisma.virtualAccount.findUnique.mockResolvedValue(mockVirtualAccount);
      mockPrisma.payment.update.mockResolvedValue({
        ...mockHeldPayment,
        status: 'RELEASED',
        releasedAt: new Date()
      });

      const result = await service.releasePaymentForCompletedJob(releaseData);

      expect(mockPrisma.propertyMarkingJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' }
      });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { markingJobId: 'job-123', status: 'HELD' }
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: { status: 'RELEASED' }
      });

      expect(result).toHaveProperty('updatedPayment');
      expect(result.updatedPayment.status).toBe('RELEASED');
    });

    it('should throw an error if the marking job is not in a completed state', async () => {
      const releaseData = {
        markingJobId: 'job-123',
        agentId: 'agent-123'
      };

      const mockMarkingJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        status: 'ASSIGNED',
        markingFee: 50.00
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);

      await expect(service.releasePaymentForCompletedJob(releaseData)).rejects.toThrow(
        'Marking job is not in a completed state'
      );
    });

    it('should throw an error if no held payment is found for the job', async () => {
      const releaseData = {
        markingJobId: 'job-123',
        agentId: 'agent-123'
      };

      const mockMarkingJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        status: 'COMPLETED',
        markingFee: 50.00
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await expect(service.releasePaymentForCompletedJob(releaseData)).rejects.toThrow(
        'No held payment found for this marking job'
      );
    });
  });

  describe('handleFailedMarkingJob', () => {
    it('should refund the held payment and update the job status', async () => {
      const jobId = 'job-failed-123';
      const mockMarkingJob = {
        id: jobId,
        status: 'FAILED',
        markingFee: 50.00,
      };

      const mockHeldPayment = {
        id: 'payment-held-123',
        markingJobId: jobId,
        amount: 50.00,
        status: 'HELD'
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.payment.findMany.mockResolvedValue([mockHeldPayment]);
      mockPrisma.payment.update.mockResolvedValue({
        ...mockHeldPayment,
        status: 'REFUNDED',
        refundedAt: new Date()
      });
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockMarkingJob,
        status: 'FAILED_AND_REFUNDED'
      });

      const result = await service.handleFailedMarkingJob(jobId);

      expect(mockPrisma.propertyMarkingJob.findUnique).toHaveBeenCalledWith({
        where: { id: jobId }
      });
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { markingJobId: jobId, status: 'HELD' }
      });
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: mockHeldPayment.id },
        data: { status: 'REFUNDED' }
      });
      expect(mockPrisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: 'FAILED_AND_REFUNDED' }
      });
      expect(result).toHaveProperty('updatedJob');
      expect(result.updatedJob.status).toBe('FAILED_AND_REFUNDED');
    });

    it('should throw an error if the job is not in a failed state', async () => {
      const jobId = 'job-assigned-123';
      const mockMarkingJob = {
        id: jobId,
        status: 'ASSIGNED',
        markingFee: 50.00
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);

      await expect(service.handleFailedMarkingJob(jobId)).rejects.toThrow(
        'Marking job is not in a failed state'
      );
    });

    it('should throw an error if no held payment is found to refund', async () => {
      const jobId = 'job-failed-123';
      const mockMarkingJob = {
        id: jobId,
        status: 'FAILED',
        markingFee: 50.00,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockMarkingJob);
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await expect(service.handleFailedMarkingJob(jobId)).rejects.toThrow(
        'No held payment found for this marking job'
      );
    });
  });
});