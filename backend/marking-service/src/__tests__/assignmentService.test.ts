/**
 * Assignment Service Tests
 * Location: backend/marking-service/src/__tests__/assignmentService.test.ts
 * 
 * Tests for agent assignment logic including:
 * - Assignment algorithm
 * - Time slot management
 * - Job completion
 * - Performance tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AssignmentService } from '../services/assignmentService';
import { PrismaClient } from '@newcondo/db';

jest.mock('@newcondo/db');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;

  beforeEach(() => {
    assignmentService = new AssignmentService(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assignJobToAgent', () => {
    it('should assign job to agent with time slot', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'QUEUED',
        queuePosition: 1,
        assignedAgentId: 'agent_456',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'ASSIGNED',
        assignedAt: new Date(),
        timeSlotExpiry: new Date(Date.now() + 10800000), // 3 hours
      });

      const result = await assignmentService.assignJobToAgent('job_123', 'agent_456');

      expect(result.status).toBe('ASSIGNED');
      expect(result.timeSlotExpiry).toBeDefined();
      expect(mockPrisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: expect.objectContaining({
          status: 'ASSIGNED',
          assignedAt: expect.any(Date),
          timeSlotExpiry: expect.any(Date),
        }),
      });
    });

    it('should throw error if job not in queue position 1', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 3,
        assignedAgentId: 'agent_456',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.assignJobToAgent('job_123', 'agent_456')
      ).rejects.toThrow('Job is not ready for assignment');
    });

    it('should throw error if job assigned to different agent', async () => {
      const mockJob = {
        id: 'job_123',
        queuePosition: 1,
        assignedAgentId: 'agent_789',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.assignJobToAgent('job_123', 'agent_456')
      ).rejects.toThrow('Job assigned to different agent');
    });
  });

  describe('startMarkingJob', () => {
    it('should mark job as in progress', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        timeSlotExpiry: new Date(Date.now() + 3600000),
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'IN_PROGRESS',
      });

      const result = await assignmentService.startMarkingJob(
        'job_123',
        'agent_456',
        { latitude: 6.5244, longitude: 3.3792 }
      );

      expect(result.status).toBe('IN_PROGRESS');
      expect(mockPrisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    });

    it('should throw error if time slot expired', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        timeSlotExpiry: new Date(Date.now() - 1000),
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.startMarkingJob('job_123', 'agent_456', {
          latitude: 6.5244,
          longitude: 3.3792,
        })
      ).rejects.toThrow('Time slot has expired');
    });

    it('should throw error if job not assigned to agent', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_789',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.startMarkingJob('job_123', 'agent_456', {
          latitude: 6.5244,
          longitude: 3.3792,
        })
      ).rejects.toThrow('Job not assigned to this agent');
    });
  });

  describe('completeMarkingJob', () => {
    it('should complete job and release partial payment', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'IN_PROGRESS',
        assignedAgentId: 'agent_456',
        markingFee: 20000,
        propertyId: 'prop_123',
      };

      const mockProperty = {
        id: 'prop_123',
        boundaryVerified: false,
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue(mockProperty);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      mockPrisma.property.update = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction = jest.fn().mockImplementation(callback => callback(mockPrisma));

      const completionData = {
        boundaryCoordinates: {
          type: 'Polygon',
          coordinates: [[[3.3792, 6.5244]]],
        },
        completionImages: ['url1', 'url2'],
        completionNotes: 'Completed successfully',
      };

      const result = await assignmentService.completeMarkingJob(
        'job_123',
        'agent_456',
        completionData
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.partialPayment).toBe(1000);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop_123' },
        data: expect.objectContaining({
          boundaryCoordinates: completionData.boundaryCoordinates,
          boundaryImages: completionData.completionImages,
          boundaryMarkedBy: 'agent_456',
          boundaryMarkedAt: expect.any(Date),
        }),
      });
    });

    it('should throw error if job not in progress', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.completeMarkingJob('job_123', 'agent_456', {
          boundaryCoordinates: {},
          completionImages: [],
          completionNotes: '',
        })
      ).rejects.toThrow('Job is not in progress');
    });

    it('should update agent performance metrics', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'IN_PROGRESS',
        assignedAgentId: 'agent_456',
        markingFee: 20000,
        propertyId: 'prop_123',
        assignedAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      const mockAgent = {
        id: 'agent_456',
        completedMarkingJobs: 10,
        totalMarkingJobs: 15,
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.property.findUnique = jest.fn().mockResolvedValue({ id: 'prop_123' });
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockAgent);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({});
      mockPrisma.property.update = jest.fn().mockResolvedValue({});
      mockPrisma.user.update = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction = jest.fn().mockImplementation(callback => callback(mockPrisma));

      await assignmentService.completeMarkingJob('job_123', 'agent_456', {
        boundaryCoordinates: {},
        completionImages: [],
        completionNotes: '',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'agent_456' },
        data: {
          completedMarkingJobs: 11,
        },
      });
    });
  });

  describe('getCurrentAssignment', () => {
    it('should return current active assignment for agent', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        timeSlotExpiry: new Date(Date.now() + 3600000),
        property: {
          id: 'prop_123',
          address: '123 Main St',
          city: 'Lagos',
          images: [],
        },
        contactPersonName: 'John Doe',
        contactPersonPhone: '+2348012345678',
        markingFee: 20000,
      };

      mockPrisma.propertyMarkingJob.findFirst = jest.fn().mockResolvedValue(mockJob);

      const result = await assignmentService.getCurrentAssignment('agent_456');

      expect(result).toBeDefined();
      expect(result?.id).toBe('job_123');
      expect(result?.status).toBe('ASSIGNED');
    });

    it('should return null if no active assignment', async () => {
      mockPrisma.propertyMarkingJob.findFirst = jest.fn().mockResolvedValue(null);

      const result = await assignmentService.getCurrentAssignment('agent_456');

      expect(result).toBeNull();
    });
  });

  describe('getAssignmentHistory', () => {
    it('should return paginated assignment history', async () => {
      const mockJobs = [
        {
          id: 'job_123',
          status: 'COMPLETED',
          completedAt: new Date(),
          markingFee: 20000,
          property: { address: '123 Main St' },
        },
        {
          id: 'job_124',
          status: 'COMPLETED',
          completedAt: new Date(),
          markingFee: 20000,
          property: { address: '456 Oak Ave' },
        },
      ];

      mockPrisma.propertyMarkingJob.findMany = jest.fn().mockResolvedValue(mockJobs);
      mockPrisma.propertyMarkingJob.count = jest.fn().mockResolvedValue(25);

      const result = await assignmentService.getAssignmentHistory('agent_456', {
        page: 1,
        limit: 20,
      });

      expect(result.assignments).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by status', async () => {
      const mockJobs = [
        {
          id: 'job_123',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      ];

      mockPrisma.propertyMarkingJob.findMany = jest.fn().mockResolvedValue(mockJobs);
      mockPrisma.propertyMarkingJob.count = jest.fn().mockResolvedValue(1);

      const result = await assignmentService.getAssignmentHistory('agent_456', {
        status: 'COMPLETED',
        page: 1,
        limit: 20,
      });

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].status).toBe('COMPLETED');
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate correct performance statistics', async () => {
      const mockJobs = [
        { status: 'COMPLETED', assignedAt: new Date(), completedAt: new Date() },
        { status: 'COMPLETED', assignedAt: new Date(), completedAt: new Date() },
        { status: 'CANCELLED', assignedAt: new Date(), completedAt: null },
        { status: 'EXPIRED', assignedAt: new Date(), completedAt: null },
      ];

      mockPrisma.propertyMarkingJob.findMany = jest.fn().mockResolvedValue(mockJobs);

      const metrics = await assignmentService.calculatePerformanceMetrics('agent_456');

      expect(metrics.totalJobs).toBe(4);
      expect(metrics.completedJobs).toBe(2);
      expect(metrics.cancelledJobs).toBe(1);
      expect(metrics.expiredJobs).toBe(1);
      expect(metrics.completionRate).toBe(0.5);
    });

    it('should handle zero jobs gracefully', async () => {
      mockPrisma.propertyMarkingJob.findMany = jest.fn().mockResolvedValue([]);

      const metrics = await assignmentService.calculatePerformanceMetrics('agent_456');

      expect(metrics.totalJobs).toBe(0);
      expect(metrics.completedJobs).toBe(0);
      expect(metrics.completionRate).toBe(0);
    });
  });

  describe('extendTimeSlot', () => {
    it('should extend time slot by requested duration', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        timeSlotExpiry: new Date(Date.now() + 1800000), // 30 mins remaining
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({
        ...mockJob,
        timeSlotExpiry: new Date(Date.now() + 5400000), // +60 mins
      });

      const result = await assignmentService.extendTimeSlot('job_123', 'agent_456', 60);

      expect(result.extensionGranted).toBe(60);
      expect(mockPrisma.propertyMarkingJob.update).toHaveBeenCalled();
    });

    it('should throw error if extension exceeds limit', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        timeSlotExpiry: new Date(Date.now() + 1800000),
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.extendTimeSlot('job_123', 'agent_456', 120)
      ).rejects.toThrow('Extension cannot exceed 60 minutes');
    });

    it('should throw error if job not assigned to agent', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_789',
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);

      await expect(
        assignmentService.extendTimeSlot('job_123', 'agent_456', 30)
      ).rejects.toThrow('Job not assigned to this agent');
    });
  });

  describe('cancelAssignment', () => {
    it('should cancel assignment and move job back to queue', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        assignedAgentId: 'agent_456',
        queuePosition: 1,
      };

      mockPrisma.propertyMarkingJob.findUnique = jest.fn().mockResolvedValue(mockJob);
      mockPrisma.propertyMarkingJob.update = jest.fn().mockResolvedValue({
        ...mockJob,
        status: 'QUEUED',
        assignedAgentId: null,
        timeSlotExpiry: null,
      });

      await assignmentService.cancelAssignment('job_123', 'agent_456', 'Unable to reach property');

      expect(mockPrisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: expect.objectContaining({
          status: 'QUEUED',
          assignedAgentId: null,
          timeSlotExpiry: null,
        }),
      });
    });
  });
});