// apps/platform/__tests__/hooks/useMarkingJobs.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import * as markingApi from '@/lib/api/marking';

// Mock API
jest.mock('@/lib/api/marking');

const mockMarkingApi = markingApi as jest.Mocked<typeof markingApi>;

describe('useMarkingJobs', () => {
  let queryClient: QueryClient;

  const mockMarkingJobs = [
    {
      id: 'job-1',
      propertyId: 'prop-1',
      status: 'COMPLETED',
      assignedAgentId: 'agent-1',
      markingFee: 20000,
      paymentStatus: 'SUCCESS',
      contactPersonName: 'John Doe',
      contactPersonPhone: '+2348012345678',
      completionImages: ['https://example.com/image1.jpg'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'job-2',
      propertyId: 'prop-2',
      status: 'QUEUED',
      markingFee: 20000,
      paymentStatus: 'PENDING',
      contactPersonName: 'Jane Smith',
      contactPersonPhone: '+2348087654321',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('getMarkingJobs', () => {
    it('should fetch marking jobs successfully', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toEqual(mockMarkingJobs);
      });

      expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      mockMarkingApi.getMarkingJobs.mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should filter jobs by status', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [mockMarkingJobs[0]],
        total: 1,
      });

      const { result } = renderHook(
        () => useMarkingJobs({ status: 'COMPLETED' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(1);
        expect(result.current.markingJobs[0].status).toBe('COMPLETED');
      });

      expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'COMPLETED' })
      );
    });

    it('should handle pagination', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 10,
        page: 1,
        pageSize: 10,
      });

      const { result } = renderHook(
        () => useMarkingJobs({ page: 1, pageSize: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.markingJobs).toEqual(mockMarkingJobs);
        expect(result.current.pagination?.total).toBe(10);
      });
    });
  });

  describe('getMarkingJobById', () => {
    it('should fetch single marking job', async () => {
      mockMarkingApi.getMarkingJobById.mockResolvedValueOnce(mockMarkingJobs[0]);

      const { result } = renderHook(() => useMarkingJobs({ jobId: 'job-1' }), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJob).toEqual(mockMarkingJobs[0]);
      });
    });

    it('should return null for non-existent job', async () => {
      mockMarkingApi.getMarkingJobById.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useMarkingJobs({ jobId: 'invalid' }), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJob).toBeNull();
      });
    });
  });

  describe('createMarkingJob', () => {
    it('should create marking job successfully', async () => {
      const newJobData = {
        propertyId: 'prop-3',
        contactPersonName: 'Bob Johnson',
        contactPersonPhone: '+2348098765432',
        accessInstructions: 'Gate code: 1234',
        markingOption: 'ASSIGN_TO_AGENTS' as const,
      };

      mockMarkingApi.createMarkingJob.mockResolvedValueOnce({
        success: true,
        job: { ...mockMarkingJobs[0], ...newJobData },
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      let createdJob: any;
      await waitFor(async () => {
        createdJob = await result.current.createMarkingJob(newJobData);
      });

      expect(createdJob.success).toBe(true);
      expect(mockMarkingApi.createMarkingJob).toHaveBeenCalledWith(newJobData);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        propertyId: '',
        contactPersonName: '',
        contactPersonPhone: 'invalid',
        markingOption: 'ASSIGN_TO_AGENTS' as const,
      };

      mockMarkingApi.createMarkingJob.mockRejectedValueOnce(
        new Error('Validation failed')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.createMarkingJob(invalidData)).rejects.toThrow();
    });

    it('should invalidate queries after creation', async () => {
      const newJobData = {
        propertyId: 'prop-3',
        contactPersonName: 'Bob Johnson',
        contactPersonPhone: '+2348098765432',
        markingOption: 'ASSIGN_TO_AGENTS' as const,
      };

      mockMarkingApi.createMarkingJob.mockResolvedValueOnce({
        success: true,
        job: mockMarkingJobs[0],
      });
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(async () => {
        await result.current.createMarkingJob(newJobData);
      });

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalled();
      });
    });
  });

  describe('verifyMarking', () => {
    it('should verify marking successfully', async () => {
      mockMarkingApi.verifyMarking.mockResolvedValueOnce({
        success: true,
        message: 'Marking verified',
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      let verifyResult: any;
      await waitFor(async () => {
        verifyResult = await result.current.verifyMarking({
          jobId: 'job-1',
          propertyId: 'prop-1',
        });
      });

      expect(verifyResult.success).toBe(true);
      expect(mockMarkingApi.verifyMarking).toHaveBeenCalledWith({
        jobId: 'job-1',
        propertyId: 'prop-1',
      });
    });

    it('should handle verification with notes', async () => {
      mockMarkingApi.verifyMarking.mockResolvedValueOnce({
        success: true,
        message: 'Marking verified',
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(async () => {
        await result.current.verifyMarking({
          jobId: 'job-1',
          propertyId: 'prop-1',
          notes: 'All good',
        });
      });

      expect(mockMarkingApi.verifyMarking).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'All good' })
      );
    });

    it('should invalidate queries after verification', async () => {
      mockMarkingApi.verifyMarking.mockResolvedValueOnce({ success: true });
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(async () => {
        await result.current.verifyMarking({
          jobId: 'job-1',
          propertyId: 'prop-1',
        });
      });

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalled();
      });
    });
  });

  describe('rejectMarking', () => {
    it('should reject marking successfully', async () => {
      mockMarkingApi.rejectMarking.mockResolvedValueOnce({
        success: true,
        message: 'Marking rejected',
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      let rejectResult: any;
      await waitFor(async () => {
        rejectResult = await result.current.rejectMarking({
          jobId: 'job-1',
          reason: 'INCORRECT_BOUNDARY',
          details: 'Boundary too large',
        });
      });

      expect(rejectResult.success).toBe(true);
    });

    it('should require rejection reason', async () => {
      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(
        result.current.rejectMarking({
          jobId: 'job-1',
          reason: '',
        })
      ).rejects.toThrow();
    });
  });

  describe('acceptMarkingJob', () => {
    it('should accept job successfully', async () => {
      mockMarkingApi.acceptMarkingJob.mockResolvedValueOnce({
        success: true,
        queuePosition: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      let acceptResult: any;
      await waitFor(async () => {
        acceptResult = await result.current.acceptMarkingJob('job-1');
      });

      expect(acceptResult.success).toBe(true);
      expect(acceptResult.queuePosition).toBe(1);
    });

    it('should handle queue full error', async () => {
      mockMarkingApi.acceptMarkingJob.mockRejectedValueOnce(
        new Error('Queue is full')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.acceptMarkingJob('job-1')).rejects.toThrow('Queue is full');
    });
  });

  describe('completeMarkingJob', () => {
    it('should complete job with images and boundary', async () => {
      const completionData = {
        jobId: 'job-1',
        completionImages: ['https://example.com/img1.jpg'],
        boundaryData: {
          type: 'Polygon',
          coordinates: [[[3.3792, 6.5244]]],
        },
        completionNotes: 'Job done',
      };

      mockMarkingApi.completeMarkingJob.mockResolvedValueOnce({
        success: true,
        message: 'Job completed',
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(async () => {
        await result.current.completeMarkingJob(completionData);
      });

      // apps/platform/__tests__/hooks/useMarkingJobs.test.ts (continued)

      expect(mockMarkingApi.completeMarkingJob).toHaveBeenCalledWith(completionData);
    });

    it('should require completion images', async () => {
      const completionData = {
        jobId: 'job-1',
        completionImages: [],
        boundaryData: {
          type: 'Polygon',
          coordinates: [[[3.3792, 6.5244]]],
        },
      };

      mockMarkingApi.completeMarkingJob.mockRejectedValueOnce(
        new Error('Completion images are required')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.completeMarkingJob(completionData)).rejects.toThrow(
        'Completion images are required'
      );
    });

    it('should require boundary data', async () => {
      const completionData = {
        jobId: 'job-1',
        completionImages: ['https://example.com/img1.jpg'],
        boundaryData: null,
      };

      mockMarkingApi.completeMarkingJob.mockRejectedValueOnce(
        new Error('Boundary data is required')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.completeMarkingJob(completionData)).rejects.toThrow(
        'Boundary data is required'
      );
    });

    it('should handle upload errors', async () => {
      const completionData = {
        jobId: 'job-1',
        completionImages: ['invalid-url'],
        boundaryData: {
          type: 'Polygon',
          coordinates: [[[3.3792, 6.5244]]],
        },
      };

      mockMarkingApi.completeMarkingJob.mockRejectedValueOnce(
        new Error('Image upload failed')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.completeMarkingJob(completionData)).rejects.toThrow(
        'Image upload failed'
      );
    });
  });

  describe('cancelMarkingJob', () => {
    it('should cancel job successfully', async () => {
      mockMarkingApi.cancelMarkingJob.mockResolvedValueOnce({
        success: true,
        message: 'Job cancelled',
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      let cancelResult: any;
      await waitFor(async () => {
        cancelResult = await result.current.cancelMarkingJob('job-1');
      });

      expect(cancelResult.success).toBe(true);
      expect(mockMarkingApi.cancelMarkingJob).toHaveBeenCalledWith('job-1');
    });

    it('should handle cancellation of in-progress job', async () => {
      mockMarkingApi.cancelMarkingJob.mockRejectedValueOnce(
        new Error('Cannot cancel job in progress')
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await expect(result.current.cancelMarkingJob('job-1')).rejects.toThrow(
        'Cannot cancel job in progress'
      );
    });

    it('should invalidate queries after cancellation', async () => {
      mockMarkingApi.cancelMarkingJob.mockResolvedValueOnce({ success: true });
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(async () => {
        await result.current.cancelMarkingJob('job-1');
      });

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalled();
      });
    });
  });

  describe('getMarkingJobQueue', () => {
    it('should fetch job queue for agent', async () => {
      const queueData = [
        {
          ...mockMarkingJobs[1],
          queuePosition: 1,
          timeSlotExpiry: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        },
      ];

      mockMarkingApi.getMarkingJobQueue.mockResolvedValueOnce(queueData);

      const { result } = renderHook(() => useMarkingJobs({ fetchQueue: true }), { wrapper });

      await waitFor(() => {
        expect(result.current.jobQueue).toEqual(queueData);
      });
    });

    it('should sort queue by position', async () => {
      const queueData = [
        { ...mockMarkingJobs[0], queuePosition: 2 },
        { ...mockMarkingJobs[1], queuePosition: 1 },
      ];

      mockMarkingApi.getMarkingJobQueue.mockResolvedValueOnce(queueData);

      const { result } = renderHook(() => useMarkingJobs({ fetchQueue: true }), { wrapper });

      await waitFor(() => {
        expect(result.current.jobQueue?.[0].queuePosition).toBe(1);
        expect(result.current.jobQueue?.[1].queuePosition).toBe(2);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching', () => {
      mockMarkingApi.getMarkingJobs.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle network errors', async () => {
      mockMarkingApi.getMarkingJobs.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toBe('Network error');
      });
    });

    it('should show mutation loading states', async () => {
      mockMarkingApi.createMarkingJob.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      const promise = result.current.createMarkingJob({
        propertyId: 'prop-1',
        contactPersonName: 'Test',
        contactPersonPhone: '+2348012345678',
        markingOption: 'ASSIGN_TO_AGENTS',
      });

      expect(result.current.isCreating).toBe(true);

      await waitFor(() => promise);
    });
  });

  describe('Real-time Updates', () => {
    it('should refetch on window focus', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValue({
        jobs: mockMarkingJobs,
        total: 2,
      });

      renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(1);
      });

      // Simulate window focus
      window.dispatchEvent(new Event('focus'));

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(2);
      });
    });

    it('should poll for updates on active jobs', async () => {
      jest.useFakeTimers();
      mockMarkingApi.getMarkingJobs.mockResolvedValue({
        jobs: mockMarkingJobs,
        total: 2,
      });

      renderHook(() => useMarkingJobs({ pollInterval: 30000 }), { wrapper });

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(1);
      });

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Optimistic Updates', () => {
    it('should optimistically update job status', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });
      mockMarkingApi.acceptMarkingJob.mockResolvedValueOnce({
        success: true,
        queuePosition: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(2);
      });

      // Accept job
      await waitFor(async () => {
        await result.current.acceptMarkingJob('job-2');
      });

      // Should see optimistic update before server response
      await waitFor(() => {
        const acceptedJob = result.current.markingJobs?.find((j) => j.id === 'job-2');
        expect(acceptedJob?.status).toBe('ASSIGNED');
      });
    });

    it('should rollback on error', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });
      mockMarkingApi.acceptMarkingJob.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(2);
      });

      const originalStatus = result.current.markingJobs?.[1].status;

      // Try to accept job (will fail)
      await expect(result.current.acceptMarkingJob('job-2')).rejects.toThrow();

      // Should rollback to original status
      await waitFor(() => {
        const job = result.current.markingJobs?.find((j) => j.id === 'job-2');
        expect(job?.status).toBe(originalStatus);
      });
    });
  });

  describe('Cache Management', () => {
    it('should cache marking jobs', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result, rerender } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(2);
      });

      // Rerender should use cached data
      rerender();

      expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(1);
      expect(result.current.markingJobs).toHaveLength(2);
    });

    it('should invalidate cache after mutations', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValue({
        jobs: mockMarkingJobs,
        total: 2,
      });
      mockMarkingApi.verifyMarking.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(2);
      });

      // Verify marking
      await waitFor(async () => {
        await result.current.verifyMarking({
          jobId: 'job-1',
          propertyId: 'prop-1',
        });
      });

      // Should refetch after mutation
      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(2);
      });
    });

    it('should respect staleTime configuration', async () => {
      jest.useFakeTimers();
      mockMarkingApi.getMarkingJobs.mockResolvedValue({
        jobs: mockMarkingJobs,
        total: 2,
      });

      const { result, rerender } = renderHook(
        () => useMarkingJobs({ staleTime: 60000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.markingJobs).toHaveLength(2);
      });

      // Advance time by 30 seconds (within staleTime)
      jest.advanceTimersByTime(30000);
      rerender();

      // Should not refetch
      expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(1);

      // Advance past staleTime
      jest.advanceTimersByTime(31000);
      rerender();

      // Should refetch now
      await waitFor(() => {
        expect(mockMarkingApi.getMarkingJobs).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous mutations', async () => {
      mockMarkingApi.acceptMarkingJob.mockResolvedValue({
        success: true,
        queuePosition: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      // Fire multiple accept operations
      const promises = [
        result.current.acceptMarkingJob('job-1'),
        result.current.acceptMarkingJob('job-2'),
        result.current.acceptMarkingJob('job-3'),
      ];

      await waitFor(() => Promise.all(promises));

      expect(mockMarkingApi.acceptMarkingJob).toHaveBeenCalledTimes(3);
    });

    it('should prevent duplicate submissions', async () => {
      mockMarkingApi.createMarkingJob.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      const jobData = {
        propertyId: 'prop-1',
        contactPersonName: 'Test',
        contactPersonPhone: '+2348012345678',
        markingOption: 'ASSIGN_TO_AGENTS' as const,
      };

      // Try to create same job twice quickly
      const promise1 = result.current.createMarkingJob(jobData);
      const promise2 = result.current.createMarkingJob(jobData);

      await Promise.all([promise1, promise2]);

      // Should only call API once due to deduplication
      expect(mockMarkingApi.createMarkingJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Transformation', () => {
    it('should format dates correctly', async () => {
      const jobWithDates = {
        ...mockMarkingJobs[0],
        createdAt: '2025-01-15T10:30:00Z',
        completedAt: '2025-01-15T14:45:00Z',
        confirmationDeadline: '2025-01-18T10:30:00Z',
      };

      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [jobWithDates],
        total: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        const job = result.current.markingJobs?.[0];
        expect(job?.createdAt).toBeInstanceOf(Date);
        expect(job?.completedAt).toBeInstanceOf(Date);
      });
    });

    it('should parse JSON boundary data', async () => {
      const jobWithBoundary = {
        ...mockMarkingJobs[0],
        boundaryData: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[3.3792, 6.5244]]],
        }),
      };

      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [jobWithBoundary],
        total: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        const job = result.current.markingJobs?.[0];
        expect(job?.boundaryData).toBeInstanceOf(Object);
        expect(job?.boundaryData?.type).toBe('Polygon');
      });
    });

    it('should calculate time remaining for deadlines', async () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const jobWithDeadline = {
        ...mockMarkingJobs[0],
        confirmationDeadline: futureDate.toISOString(),
      };

      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [jobWithDeadline],
        total: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        const job = result.current.markingJobs?.[0];
        expect(job?.timeRemaining).toBeDefined();
        expect(job?.timeRemaining?.days).toBe(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [],
        total: 0,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJobs).toEqual([]);
        expect(result.current.isEmpty).toBe(true);
      });
    });

    it('should handle null/undefined responses', async () => {
      mockMarkingApi.getMarkingJobById.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useMarkingJobs({ jobId: 'invalid' }), { wrapper });

      await waitFor(() => {
        expect(result.current.markingJob).toBeNull();
      });
    });

    it('should handle malformed data gracefully', async () => {
      const malformedJob = {
        ...mockMarkingJobs[0],
        markingFee: 'invalid' as any,
      };

      mockMarkingApi.getMarkingJobs.mockResolvedValueOnce({
        jobs: [malformedJob],
        total: 1,
      });

      const { result } = renderHook(() => useMarkingJobs(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });
});