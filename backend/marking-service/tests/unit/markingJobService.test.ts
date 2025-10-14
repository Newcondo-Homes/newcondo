// backend/marking-service/tests/unit/markingJobService.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@newcondo/db';
import { MarkingJobService } from '../../src/services/markingJobService';

// Mock Prisma Client
vi.mock('@newcondo/db', () => ({
  PrismaClient: vi.fn(() => ({
    propertyMarkingJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    virtualAccount: {
      findFirst: vi.fn(),
    },
  })),
}));

describe('MarkingJobService', () => {
  let service: MarkingJobService;
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    service = new MarkingJobService(prisma);
    vi.clearAllMocks();
  });

  describe('createMarkingJob', () => {
    it('should create a marking job successfully', async () => {
      const mockProperty = {
        id: 'prop_123',
        title: 'Test Property',
        ownerId: 'user_123',
      };

      const mockUser = {
        id: 'user_123',
        role: 'OWNER',
        isPremium: false,
      };

      const mockJobData = {
        propertyId: 'prop_123',
        requestedBy: 'user_123',
        contactPersonName: 'John Doe',
        contactPersonPhone: '+2348012345678',
        accessInstructions: 'Ring the bell twice',
        markingFee: 20000,
      };

      const mockCreatedJob = {
        id: 'job_123',
        ...mockJobData,
        status: 'QUEUED',
        paymentStatus: 'PENDING',
        createdAt: new Date(),
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.propertyMarkingJob.create.mockResolvedValue(mockCreatedJob);

      const result = await service.createMarkingJob(mockJobData);

      expect(result).toEqual(mockCreatedJob);
      expect(prisma.propertyMarkingJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: mockJobData.propertyId,
          requestedBy: mockJobData.requestedBy,
          markingFee: mockJobData.markingFee,
        }),
      });
    });

    it('should throw error if property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.createMarkingJob({
          propertyId: 'invalid_prop',
          requestedBy: 'user_123',
          contactPersonName: 'John Doe',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
        })
      ).rejects.toThrow('Property not found');
    });

    it('should throw error if user is not authorized', async () => {
      const mockProperty = {
        id: 'prop_123',
        ownerId: 'owner_123',
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.createMarkingJob({
          propertyId: 'prop_123',
          requestedBy: 'unauthorized_user',
          contactPersonName: 'John Doe',
          contactPersonPhone: '+2348012345678',
          markingFee: 20000,
        })
      ).rejects.toThrow('Unauthorized to create marking job');
    });

    it('should calculate correct marking fee for property owner', async () => {
      const mockProperty = {
        id: 'prop_123',
        ownerId: 'user_123',
      };

      const mockUser = {
        id: 'user_123',
        role: 'OWNER',
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.propertyMarkingJob.create.mockResolvedValue({
        id: 'job_123',
        markingFee: 20000,
      });

      await service.createMarkingJob({
        propertyId: 'prop_123',
        requestedBy: 'user_123',
        contactPersonName: 'John Doe',
        contactPersonPhone: '+2348012345678',
        markingFee: 20000,
      });

      expect(prisma.propertyMarkingJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          markingFee: 20000,
        }),
      });
    });
  });

  describe('getMarkingJobById', () => {
    it('should return marking job by id', async () => {
      const mockJob = {
        id: 'job_123',
        propertyId: 'prop_123',
        status: 'QUEUED',
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      const result = await service.getMarkingJobById('job_123');

      expect(result).toEqual(mockJob);
      expect(prisma.propertyMarkingJob.findUnique).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        include: expect.any(Object),
      });
    });

    it('should return null for non-existent job', async () => {
      prisma.propertyMarkingJob.findUnique.mockResolvedValue(null);

      const result = await service.getMarkingJobById('invalid_job');

      expect(result).toBeNull();
    });
  });

  describe('updateMarkingJobStatus', () => {
    it('should update job status successfully', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'ASSIGNED',
        updatedAt: new Date(),
      };

      prisma.propertyMarkingJob.update.mockResolvedValue(mockJob);

      const result = await service.updateMarkingJobStatus('job_123', 'ASSIGNED');

      expect(result).toEqual(mockJob);
      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'ASSIGNED',
          assignedAt: expect.any(Date),
        },
      });
    });

    it('should throw error for invalid status transition', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'COMPLETED',
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.updateMarkingJobStatus('job_123', 'QUEUED')
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('cancelMarkingJob', () => {
    it('should cancel job and refund payment', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'QUEUED',
        paymentStatus: 'SUCCESS',
        markingFee: 20000,
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'CANCELLED',
      });

      await service.cancelMarkingJob('job_123', 'User requested cancellation');

      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        },
      });
    });

    it('should not allow cancellation of completed job', async () => {
      const mockJob = {
        id: 'job_123',
        status: 'COMPLETED',
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);

      await expect(
        service.cancelMarkingJob('job_123', 'Cancel')
      ).rejects.toThrow('Cannot cancel completed job');
    });
  });

  describe('completeMarkingJob', () => {
    it('should complete job with boundary data', async () => {
      const mockJob = {
        id: 'job_123',
        propertyId: 'prop_123',
        status: 'IN_PROGRESS',
        assignedAgentId: 'agent_123',
      };

      const completionData = {
        boundaryData: {
          coordinates: [[10.5, 20.3], [10.6, 20.4]],
        },
        completionImages: ['image1.jpg', 'image2.jpg'],
        completionNotes: 'Job completed successfully',
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      prisma.propertyMarkingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      await service.completeMarkingJob('job_123', completionData);

      expect(prisma.propertyMarkingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          boundaryData: completionData.boundaryData,
          completionImages: completionData.completionImages,
          completionNotes: completionData.completionNotes,
        }),
      });
    });

    it('should update property with boundary information', async () => {
      const mockJob = {
        id: 'job_123',
        propertyId: 'prop_123',
        status: 'IN_PROGRESS',
        assignedAgentId: 'agent_123',
      };

      const completionData = {
        boundaryData: {
          coordinates: [[10.5, 20.3], [10.6, 20.4]],
        },
      };

      prisma.propertyMarkingJob.findUnique.mockResolvedValue(mockJob);
      prisma.propertyMarkingJob.update.mockResolvedValue(mockJob);
      prisma.property.update.mockResolvedValue({});

      await service.completeMarkingJob('job_123', completionData);

      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop_123' },
        data: {
          boundaryCoordinates: completionData.boundaryData,
          boundaryMarkedBy: 'agent_123',
          boundaryMarkedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getJobsByStatus', () => {
    it('should return jobs filtered by status', async () => {
      const mockJobs = [
        { id: 'job_1', status: 'QUEUED' },
        { id: 'job_2', status: 'QUEUED' },
      ];

      prisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const result = await service.getJobsByStatus('QUEUED');

      expect(result).toEqual(mockJobs);
      expect(prisma.propertyMarkingJob.findMany).toHaveBeenCalledWith({
        where: { status: 'QUEUED' },
        include: expect.any(Object),
      });
    });
  });

  describe('getJobsForAgent', () => {
    it('should return jobs assigned to agent', async () => {
      const mockJobs = [
        { id: 'job_1', assignedAgentId: 'agent_123' },
        { id: 'job_2', assignedAgentId: 'agent_123' },
      ];

      prisma.propertyMarkingJob.findMany.mockResolvedValue(mockJobs);

      const result = await service.getJobsForAgent('agent_123');

      expect(result).toEqual(mockJobs);
      expect(prisma.propertyMarkingJob.findMany).toHaveBeenCalledWith({
        where: { assignedAgentId: 'agent_123' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });
});