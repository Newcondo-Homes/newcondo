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

      expect(mockMarkingApi.completeMarkingJob).toHaveBeenCalle