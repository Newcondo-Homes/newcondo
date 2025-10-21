// backend/marking-service/src/__tests__/timeSlotService.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeSlotService } from '../services/timeSlotService';
import { PrismaClient } from '@newcondo/db';
import { RedisClientType } from 'redis';

// Mock Prisma and Redis
vi.mock('@newcondo/db', () => ({
  PrismaClient: vi.fn(),
}));

describe('TimeSlotService', () => {
  let timeSlotService: TimeSlotService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    // Setup mock Prisma
    mockPrisma = {
      propertyMarkingJob: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    // Setup mock Redis
    mockRedis = {
      get: vi.fn(),
      setEx: vi.fn(),
      del: vi.fn(),
      publish: vi.fn(),
      isOpen: true,
    };

    timeSlotService = new TimeSlotService(mockPrisma, mockRedis);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('allocateTimeSlot', () => {
    it('should allocate a 3-hour time slot successfully', async () => {
      const jobId = 'job-123';
      const agentId = 'agent-456';
      const mockJob = {
        id: jobId,
        status: 'QUEUED',
        queuePosition: 1,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'ASSIGNED',
        assignedAgentId: agentId,
        timeSlotExpiry: expect.any(Date),
      });

      const result = await timeSlotService.allocateTimeSlot(jobId, agentId);

      expect(result.success).toBe(true);
      expect(result.timeSlotExpiry).toBeInstanceOf(Date);
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it('should fail if job is already assigned', async () => {
      const jobId = 'job-123';
      const agentId = 'agent-456';
      const mockJob = {
        id: jobId,
        status: 'ASSIGNED',
        assignedAgentId: 'another-agent',
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        timeSlotService.allocateTimeSlot(jobId, agentId)
      ).rejects.toThrow('Job is already assigned');
    });

    it('should handle concurrent allocation attempts', async () => {
      const jobId = 'job-123';
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';
      const mockJob = {
        id: jobId,
        status: 'QUEUED',
        queuePosition: 1,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update
        .mockResolvedValueOnce({
          ...mockJob,
          status: 'ASSIGNED',
          assignedAgentId: agentId1,
        })
        .mockRejectedValueOnce(new Error('Concurrent modification'));

      const [result1, result2] = await Promise.allSettled([
        timeSlotService.allocateTimeSlot(jobId, agentId1),
        timeSlotService.allocateTimeSlot(jobId, agentId2),
      ]);

      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');
    });
  });

  describe('checkTimeSlotExpiry', () => {
    it('should detect expired time slot', async () => {
      const jobId = 'job-123';
      const expiredTime = new Date(Date.now() - 1000); // 1 second ago
      const mockJob = {
        id: jobId,
        status: 'ASSIGNED',
        timeSlotExpiry: expiredTime,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry(jobId);

      expect(result.isExpired).toBe(true);
      expect(result.remainingTime).toBeLessThanOrEqual(0);
    });

    it('should return remaining time for active slot', async () => {
      const jobId = 'job-123';
      const futureTime = new Date(Date.now() + 3600000); // 1 hour from now
      const mockJob = {
        id: jobId,
        status: 'ASSIGNED',
        timeSlotExpiry: futureTime,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry(jobId);

      expect(result.isExpired).toBe(false);
      expect(result.remainingTime).toBeGreaterThan(0);
      expect(result.remainingTime).toBeLessThanOrEqual(3600000);
    });

    it('should return null for job without time slot', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        status: 'QUEUED',
        timeSlotExpiry: null,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry(jobId);

      expect(result.isExpired).toBe(false);
      expect(result.remainingTime).toBeNull();
    });
  });

  describe('extendTimeSlot', () => {
    it('should extend time slot by specified duration', async () => {
      const jobId = 'job-123';
      const extensionMinutes = 30;
      const currentExpiry = new Date(Date.now() + 3600000);
      const mockJob = {
        id: jobId,
        status: 'IN_PROGRESS',
        timeSlotExpiry: currentExpiry,
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        timeSlotExpiry: new Date(currentExpiry.getTime() + extensionMinutes * 60000),
      });

      const result = await timeSlotService.extendTimeSlot(jobId, extensionMinutes);

      expect(result.success).toBe(true);
      expect(result.newExpiry).toBeInstanceOf(Date);
      expect(result.newExpiry.getTime()).toBeGreaterThan(currentExpiry.getTime());
    });

    it('should not extend beyond maximum allowed time', async () => {
      const jobId = 'job-123';
      const extensionMinutes = 300; // 5 hours
      const mockJob = {
        id: jobId,
        status: 'IN_PROGRESS',
        timeSlotExpiry: new Date(),
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        timeSlotService.extendTimeSlot(jobId, extensionMinutes)
      ).rejects.toThrow('Extension exceeds maximum allowed time');
    });
  });

  describe('releaseTimeSlot', () => {
    it('should release time slot and reassign job', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        status: 'ASSIGNED',
        assignedAgentId: 'agent-1',
        queuePosition: 1,
      };
      const nextAgent = {
        id: 'agent-2',
        name: 'Next Agent',
        email: 'next@example.com',
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue([
        { id: 'job-124', assignedAgentId: 'agent-2', queuePosition: 2 },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue(nextAgent);
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'QUEUED',
        assignedAgentId: null,
        timeSlotExpiry: null,
      });

      const result = await timeSlotService.releaseTimeSlot(jobId, 'Time expired');

      expect(result.success).toBe(true);
      expect(result.reassigned).toBe(true);
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle release when no next agent available', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        status: 'ASSIGNED',
        assignedAgentId: 'agent-1',
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue([]);
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'QUEUED',
        assignedAgentId: null,
      });

      const result = await timeSlotService.releaseTimeSlot(jobId, 'Agent cancelled');

      expect(result.success).toBe(true);
      expect(result.reassigned).toBe(false);
    });
  });

  describe('calculateEstimatedWaitTime', () => {
    it('should calculate wait time based on queue position', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        queuePosition: 5,
        status: 'QUEUED',
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await timeSlotService.calculateEstimatedWaitTime(jobId);

      expect(result.estimatedMinutes).toBeGreaterThan(0);
      expect(result.estimatedHours).toBeGreaterThan(0);
      expect(result.queuePosition).toBe(5);
    });

    it('should return zero wait time for assigned jobs', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        queuePosition: null,
        status: 'ASSIGNED',
      };

      mockPrisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await timeSlotService.calculateEstimatedWaitTime(jobId);

      expect(result.estimatedMinutes).toBe(0);
      expect(result.estimatedHours).toBe(0);
    });
  });

  describe('getActiveTimeSlots', () => {
    it('should return all active time slots', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          assignedAgentId: 'agent-1',
          timeSlotExpiry: new Date(Date.now() + 3600000),
          status: 'ASSIGNED',
        },
        {
          id: 'job-2',
          assignedAgentId: 'agent-2',
          timeSlotExpiry: new Date(Date.now() + 7200000),
          status: 'IN_PROGRESS',
        },
      ];

      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const result = await timeSlotService.getActiveTimeSlots();

      expect(result).toHaveLength(2);
      expect(result[0].remainingTime).toBeGreaterThan(0);
    });

    it('should filter out expired slots', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          assignedAgentId: 'agent-1',
          timeSlotExpiry: new Date(Date.now() + 3600000),
          status: 'ASSIGNED',
        },
        {
          id: 'job-2',
          assignedAgentId: 'agent-2',
          timeSlotExpiry: new Date(Date.now() - 1000),
          status: 'ASSIGNED',
        },
      ];

      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const result = await timeSlotService.getActiveTimeSlots();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('job-1');
    });
  });

  describe('handleExpiredSlots', () => {
    it('should process all expired slots', async () => {
      const mockExpiredJobs = [
        {
          id: 'job-1',
          assignedAgentId: 'agent-1',
          timeSlotExpiry: new Date(Date.now() - 1000),
          status: 'ASSIGNED',
        },
        {
          id: 'job-2',
          assignedAgentId: 'agent-2',
          timeSlotExpiry: new Date(Date.now() - 2000),
          status: 'ASSIGNED',
        },
      ];

      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue(mockExpiredJobs);
      mockPrisma.propertyMarkingJob.findUnique.mockImplementation((args) =>
        mockExpiredJobs.find((job) => job.id === args.where.id)
      );
      mockPrisma.propertyMarkingJob.update.mockResolvedValue({});

      const result = await timeSlotService.handleExpiredSlots();

      expect(result.processedCount).toBe(2);
      expect(result.reassignedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTimeSlotStatistics', () => {
    it('should return comprehensive time slot statistics', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          status: 'ASSIGNED',
          timeSlotExpiry: new Date(Date.now() + 3600000),
        },
        {
          id: 'job-2',
          status: 'IN_PROGRESS',
          timeSlotExpiry: new Date(Date.now() + 1800000),
        },
        {
          id: 'job-3',
          status: 'ASSIGNED',
          timeSlotExpiry: new Date(Date.now() - 1000),
        },
      ];

      mockPrisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const result = await timeSlotService.getTimeSlotStatistics();

      expect(result.totalActiveSlots).toBeGreaterThanOrEqual(0);
      expect(result.totalExpiredSlots).toBeGreaterThanOrEqual(0);
      expect(result.averageRemainingTime).toBeGreaterThanOrEqual(0);
    });
  });
});