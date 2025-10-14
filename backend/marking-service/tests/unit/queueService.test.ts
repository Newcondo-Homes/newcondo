// backend/marking-service/tests/unit/queueService.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@newcondo/db';
import { QueueService } from '../../src/services/queueService';

vi.mock('@newcondo/db', () => ({
  PrismaClient: vi.fn(() => ({
    propertyMarkingJob: {
      findMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  })),
}));

describe('QueueService', () => {
  let service: QueueService;
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    service = new QueueService(prisma);
    vi.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add job to queue with correct position', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'QUEUED',
      };

      prisma.propertyMarkingJob.count.mockResolvedValue(5);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        queuePosition: 6,
      });

      const result = await service.addToQueue('job_123');

      expect(result.queuePosition).toBe(6);
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          queuePosition: 6,
          status: 'QUEUED',
        },
      });
    });

    it('should set position to 1 for first job in queue', async () => {
      prisma.propertyMarkingJob.count.mockResolvedValue(0);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        id: 'job_123',
        queuePosition: 1,
      });

      const result = await service.addToQueue('job_123');

      expect(result.queuePosition).toBe(1);
    });
  });

  describe('getNextInQueue', () => {
    it('should return next job in queue', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 1,
        status: 'QUEUED',
      };

      prisma.propertyMarkingJob.findFirst.mockResolvedValue(mockJob);

      const result = await service.getNextInQueue();

      expect(result).toEqual(mockJob);
      expect(prisma.propertyMarkingJob.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'QUEUED',
          queuePosition: { not: null },
        },
        orderBy: { queuePosition: 'asc' },
      });
    });

    it('should return null if queue is empty', async () => {
      prisma.propertyMarkingJob.findFirst.mockResolvedValue(null);

      const result = await service.getNextInQueue();

      expect(result).toBeNull();
    });
  });

  describe('assignJobToAgent', () => {
    it('should assign job to agent and update status', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 1,
      };

      const timeSlotExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000);

      prisma.propertyMarkingJob.findFirst.mockResolvedValue(mockJob);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        assignedAgentId: 'agent_123',
        status: 'ASSIGNED',
      });

      const result = await service.assignJobToAgent('job_123', 'agent_123');

      expect(result.assignedAgentId).toBe('agent_123');
      expect(result.status).toBe('ASSIGNED');
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          assignedAgentId: 'agent_123',
          status: 'ASSIGNED',
          assignedAt: expect.any(Date),
          timeSlotExpiry: expect.any(Date),
        },
      });
    });

    it('should throw error if job not found', async () => {
      prisma.propertyMarkingJob.findFirst.mockResolvedValue(null);

      await expect(
        service.assignJobToAgent('invalid_job', 'agent_123')
      ).rejects.toThrow('Job not found or not in queue');
    });
  });

  describe('removeFromQueue', () => {
    it('should remove job and reorder remaining jobs', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 2,
      };

      const remainingJobs = [
        { id: 'job_3', queuePosition: 3 },
        { id: 'job_4', queuePosition: 4 },
      ];

      prisma.propertyMarkingJob.findFirst.mockResolvedValue(mockJob);
      prisma.propertyMarkingJob.findMany.mockResolvedValue(remainingJobs);
      prisma.propertyMarkingJob.update
        .mockResolvedValueOnce({ ...mockJob, queuePosition: null })
        .mockResolvedValueOnce({ id: 'job_3', queuePosition: 2 })
        .mockResolvedValueOnce({ id: 'job_4', queuePosition: 3 });

      await service.removeFromQueue('job_123');

      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledTimes(3);
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_3' },
        data: { queuePosition: 2 },
      });
    });
  });

  describe('getQueuePosition', () => {
    it('should return queue position for job', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 5,
      };

      prisma.propertyMarkingJob.findFirst.mockResolvedValue(mockJob);

      const result = await service.getQueuePosition('job_123');

      expect(result).toBe(5);
    });

    it('should return null if job not in queue', async () => {
      prisma.propertyMarkingJob.findFirst.mockResolvedValue(null);

      const result = await service.getQueuePosition('invalid_job');

      expect(result).toBeNull();
    });
  });

  describe('getQueueLength', () => {
    it('should return number of jobs in queue', async () => {
      prisma.propertyMarkingJob.count.mockResolvedValue(8);

      const result = await service.getQueueLength();

      expect(result).toBe(8);
      expect(prisma.propertyMarkingJob.count).toHaveBeenCalledWith({
        where: {
          status: 'QUEUED',
          queuePosition: { not: null },
        },
      });
    });
  });

  describe('handleExpiredTimeSlot', () => {
    it('should reassign job when time slot expires', async () => {
      const expiredJob = {
        id: 'job_123',
        assignedAgentId: 'agent_123',
        timeSlotExpiry: new Date(Date.now() - 1000),
        status: 'ASSIGNED',
      };

      prisma.propertyMarkingJob.findMany.mockResolvedValue([expiredJob]);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        ...expiredJob,
        status: 'QUEUED',
        assignedAgentId: null,
      });

      await service.handleExpiredTimeSlots();

      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'QUEUED',
          assignedAgentId: null,
          assignedAt: null,
          timeSlotExpiry: null,
        },
      });
    });

    it('should move to next agent in queue', async () => {
      const expiredJob = {
        id: 'job_123',
        queuePosition: 1,
      };

      prisma.propertyMarkingJob.findMany.mockResolvedValue([expiredJob]);
      prisma.propertyMarkingJob.update.mockResolvedValue(expiredJob);

      await service.handleExpiredTimeSlots();

      expect(prisma.propertyMarkingJob.update).toHaveBeenCalled();
    });
  });

  describe('getAvailableAgents', () => {
    it('should return agents available for marking', async () => {
      const mockAgents = [
        {
          id: 'agent_1',
          isAvailableForMarking: true,
          role: 'AGENT',
        },
        {
          id: 'agent_2',
          isAvailableForMarking: true,
          role: 'AGENT',
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockAgents);

      const result = await service.getAvailableAgents();

      expect(result).toEqual(mockAgents);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          isAvailableForMarking: true,
          OR: [
            { role: 'AGENT' },
            { role: 'RENTER', isPremium: true },
          ],
        },
      });
    });
  });

  describe('prioritizeQueue', () => {
    it('should reorder queue based on urgency', async () => {
      const mockJobs = [
        { id: 'job_1', urgencyLevel: 'NORMAL', queuePosition: 1 },
        { id: 'job_2', urgencyLevel: 'URGENT', queuePosition: 2 },
        { id: 'job_3', urgencyLevel: 'HIGH', queuePosition: 3 },
      ];

      prisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);
      prisma.propertyMarkingJob.update.mockResolvedValue({});

      await service.prioritizeQueue();

      // Verify urgent jobs moved to front
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_2' },
        data: { queuePosition: 1 },
      });
    });
  });

  describe('notifyQueuedAgents', () => {
    it('should notify agents of queue position changes', async () => {
      const mockJobs = [
        { id: 'job_1', assignedAgentId: 'agent_1' },
        { id: 'job_2', assignedAgentId: 'agent_2' },
      ];

      prisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const notificationSpy = vi.fn();
      service.setNotificationHandler(notificationSpy);

      await service.notifyQueuedAgents();

      expect(notificationSpy).toHaveBeenCalledTimes(2);
    });
  });
});