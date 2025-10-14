import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeSlotService } from '../../src/services/timeSlotService';
import { prisma } from '@newcondo/db';
import { MarkingJobStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@newcondo/db', () => ({
  prisma: {
    propertyMarkingJob: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('TimeSlotService', () => {
  let timeSlotService: TimeSlotService;

  beforeEach(() => {
    timeSlotService = new TimeSlotService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('allocateTimeSlot', () => {
    it('should allocate a 3-hour time slot to an agent', async () => {
      const mockJob = {
        id: 'job-123',
        status: MarkingJobStatus.ASSIGNED,
        assignedAgentId: 'agent-123',
        assignedAt: new Date(),
        timeSlotExpiry: null,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.propertyMarkingJob.update as any).mockResolvedValue({
        ...mockJob,
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000),
      });

      const result = await timeSlotService.allocateTimeSlot('job-123', 'agent-123');

      expect(result.success).toBe(true);
      expect(result.timeSlotExpiry).toBeDefined();
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          timeSlotExpiry: expect.any(Date),
          status: MarkingJobStatus.ASSIGNED,
        },
      });
    });

    it('should calculate correct expiry time (3 hours from now)', async () => {
      const mockJob = {
        id: 'job-123',
        status: MarkingJobStatus.ASSIGNED,
        assignedAgentId: 'agent-123',
        assignedAt: new Date(),
        timeSlotExpiry: null,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.propertyMarkingJob.update as any).mockResolvedValue({
        ...mockJob,
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000),
      });

      const beforeAllocation = Date.now();
      const result = await timeSlotService.allocateTimeSlot('job-123', 'agent-123');
      const afterAllocation = Date.now();

      expect(result.success).toBe(true);
      const expiryTime = new Date(result.timeSlotExpiry!).getTime();
      const expectedMinExpiry = beforeAllocation + (3 * 60 * 60 * 1000);
      const expectedMaxExpiry = afterAllocation + (3 * 60 * 60 * 1000);

      expect(expiryTime).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(expiryTime).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should fail if job not found', async () => {
      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(null);

      const result = await timeSlotService.allocateTimeSlot('job-123', 'agent-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Marking job not found');
    });

    it('should fail if agent is not assigned to the job', async () => {
      const mockJob = {
        id: 'job-123',
        status: MarkingJobStatus.ASSIGNED,
        assignedAgentId: 'different-agent',
        assignedAt: new Date(),
        timeSlotExpiry: null,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.allocateTimeSlot('job-123', 'agent-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent not assigned to this job');
    });

    it('should fail if job is not in ASSIGNED status', async () => {
      const mockJob = {
        id: 'job-123',
        status: MarkingJobStatus.COMPLETED,
        assignedAgentId: 'agent-123',
        assignedAt: new Date(),
        timeSlotExpiry: null,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.allocateTimeSlot('job-123', 'agent-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid job status');
    });
  });

  describe('checkTimeSlotExpiry', () => {
    it('should return false if time slot has not expired', async () => {
      const futureExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: futureExpiry,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry('job-123');

      expect(result.expired).toBe(false);
      expect(result.remainingTime).toBeGreaterThan(0);
    });

    it('should return true if time slot has expired', async () => {
      const pastExpiry = new Date(Date.now() - 1000); // 1 second ago
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: pastExpiry,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry('job-123');

      expect(result.expired).toBe(true);
      expect(result.remainingTime).toBeLessThanOrEqual(0);
    });

    it('should calculate correct remaining time in milliseconds', async () => {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: twoHoursFromNow,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry('job-123');

      expect(result.remainingTime).toBeGreaterThan(1.9 * 60 * 60 * 1000); // ~2 hours
      expect(result.remainingTime).toBeLessThanOrEqual(2 * 60 * 60 * 1000);
    });

    it('should handle job with no time slot expiry', async () => {
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: null,
        status: MarkingJobStatus.QUEUED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.checkTimeSlotExpiry('job-123');

      expect(result.expired).toBe(false);
      expect(result.remainingTime).toBeNull();
    });
  });

  describe('handleExpiredTimeSlot', () => {
    it('should reassign job to next agent in queue when time slot expires', async () => {
      const mockJob = {
        id: 'job-123',
        assignedAgentId: 'agent-1',
        queuePosition: 1,
        status: MarkingJobStatus.ASSIGNED,
      };

      const mockNextAgent = {
        id: 'agent-2',
        isAvailableForMarking: true,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.user.findUnique as any).mockResolvedValue(mockNextAgent);
      (prisma.propertyMarkingJob.update as any).mockResolvedValue({
        ...mockJob,
        assignedAgentId: 'agent-2',
        queuePosition: 2,
        timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000),
      });

      const result = await timeSlotService.handleExpiredTimeSlot('job-123');

      expect(result.success).toBe(true);
      expect(result.reassigned).toBe(true);
      expect(result.newAgentId).toBe('agent-2');
    });

    it('should mark job as expired if no agents available in queue', async () => {
      const mockJob = {
        id: 'job-123',
        assignedAgentId: 'agent-1',
        queuePosition: 1,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.propertyMarkingJob.update as any).mockResolvedValue({
        ...mockJob,
        status: MarkingJobStatus.EXPIRED,
      });

      const result = await timeSlotService.handleExpiredTimeSlot('job-123');

      expect(result.success).toBe(true);
      expect(result.reassigned).toBe(false);
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          status: MarkingJobStatus.EXPIRED,
          assignedAgentId: null,
          timeSlotExpiry: null,
        },
      });
    });

    it('should send partial compensation to expired agent', async () => {
      const mockJob = {
        id: 'job-123',
        assignedAgentId: 'agent-1',
        markingFee: 20000,
        queuePosition: 1,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await timeSlotService.handleExpiredTimeSlot('job-123');

      expect(result.success).toBe(true);
      expect(result.partialCompensation).toBeDefined();
      expect(result.partialCompensation).toBe(1000); // Example compensation
    });
  });

  describe('extendTimeSlot', () => {
    it('should extend time slot by specified duration', async () => {
      const currentExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: currentExpiry,
        status: MarkingJobStatus.ASSIGNED,
        assignedAgentId: 'agent-123',
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);
      (prisma.propertyMarkingJob.update as any).mockResolvedValue({
        ...mockJob,
        timeSlotExpiry: new Date(currentExpiry.getTime() + 1 * 60 * 60 * 1000),
      });

      const result = await timeSlotService.extendTimeSlot('job-123', 1); // Extend by 1 hour

      expect(result.success).toBe(true);
      expect(result.newExpiry).toBeDefined();
      const newExpiryTime = new Date(result.newExpiry!).getTime();
      expect(newExpiryTime).toBeGreaterThan(currentExpiry.getTime());
    });

    it('should not extend beyond maximum allowed time', async () => {
      const currentExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const mockJob = {
        id: 'job-123',
        timeSlotExpiry: currentExpiry,
        status: MarkingJobStatus.ASSIGNED,
        assignedAgentId: 'agent-123',
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.extendTimeSlot('job-123', 5); // Try to extend by 5 hours

      expect(result.success).toBe(false);
      expect(result.error).toContain('maximum allowed extension');
    });
  });

  describe('getActiveTimeSlots', () => {
    it('should return all active time slots', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          assignedAgentId: 'agent-1',
          timeSlotExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: MarkingJobStatus.ASSIGNED,
        },
        {
          id: 'job-2',
          assignedAgentId: 'agent-2',
          timeSlotExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
          status: MarkingJobStatus.ASSIGNED,
        },
      ];

      (prisma.propertyMarkingJob.findMany as any).mockResolvedValue(mockJobs);

      const result = await timeSlotService.getActiveTimeSlots();

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('job-1');
      expect(result[1].id).toBe('job-2');
    });

    it('should filter out expired time slots', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          assignedAgentId: 'agent-1',
          timeSlotExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: MarkingJobStatus.ASSIGNED,
        },
        {
          id: 'job-2',
          assignedAgentId: 'agent-2',
          timeSlotExpiry: new Date(Date.now() - 1000),
          status: MarkingJobStatus.ASSIGNED,
        },
      ];

      (prisma.propertyMarkingJob.findMany as any).mockResolvedValue(mockJobs);

      const result = await timeSlotService.getActiveTimeSlots();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('job-1');
    });
  });

  describe('notifyTimeSlotExpiring', () => {
    it('should send notification when time slot is about to expire', async () => {
      const expiringIn30Min = new Date(Date.now() + 30 * 60 * 1000);
      const mockJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        timeSlotExpiry: expiringIn30Min,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.notifyTimeSlotExpiring('job-123');

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
    });

    it('should not send notification if time slot has more than 1 hour remaining', async () => {
      const expiringIn2Hours = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const mockJob = {
        id: 'job-123',
        assignedAgentId: 'agent-123',
        timeSlotExpiry: expiringIn2Hours,
        status: MarkingJobStatus.ASSIGNED,
      };

      (prisma.propertyMarkingJob.findUnique as any).mockResolvedValue(mockJob);

      const result = await timeSlotService.notifyTimeSlotExpiring('job-123');

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(false);
      expect(result.reason).toContain('Too early');
    });
  });
});