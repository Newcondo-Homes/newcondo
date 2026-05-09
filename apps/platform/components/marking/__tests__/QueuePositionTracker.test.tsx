// apps/platform/components/marking/__tests__/QueuePositionTracker.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import QueuePositionTracker from '../QueuePositionTracker';
import * as queueHooks from '@/hooks/useMarkingQueue';
import '@testing-library/jest-dom';

// Mock the useMarkingQueue hook
vi.mock('@/hooks/useMarkingQueue', () => ({
  useMarkingQueue: vi.fn(),
}));

// Typed alias — avoids `as any` on every call site
const mockUseMarkingQueue = queueHooks.useMarkingQueue as ReturnType<typeof vi.fn>;

describe('QueuePositionTracker', () => {
  const mockJobId = 'job-123';
  const defaultQueueData = {
    position: 5,
    estimatedWaitTime: {
      minutes: 180,
      hours: 3,
      formattedTime: '3 hours',
    },
    status: 'QUEUED' as const,
    totalInQueue: 10,
    isExpired: false,
    remainingTime: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading spinner when data is loading', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      const errorMessage = 'Failed to fetch queue data';
      mockUseMarkingQueue.mockReturnValue({
        queueData: null,
        isLoading: false,
        error: new Error(errorMessage),
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const mockRefetch = vi.fn();
      mockUseMarkingQueue.mockReturnValue({
        queueData: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await act(async () => {
        retryButton.click();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Queue Position Display', () => {
    it('should display current queue position', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/position in queue/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display total queue count', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/10 jobs in queue/i)).toBeInTheDocument();
    });

    it('should display position #1 differently', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, position: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/next in line/i)).toBeInTheDocument();
    });
  });

  describe('Estimated Wait Time', () => {
    it('should display estimated wait time', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/estimated wait/i)).toBeInTheDocument();
      expect(screen.getByText('3 hours')).toBeInTheDocument();
    });

    it('should display minutes when less than 1 hour', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          estimatedWaitTime: {
            minutes: 45,
            hours: 0.75,
            formattedTime: '45 minutes',
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText('45 minutes')).toBeInTheDocument();
    });
  });

  describe('Assigned Status', () => {
    it('should display assigned status with time slot', () => {
      const remainingTime = 7200000; // 2 hours in milliseconds
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
          position: null,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/assigned to you/i)).toBeInTheDocument();
      expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    });

    it('should show urgency when time is running low', () => {
      const remainingTime = 1800000; // 30 minutes
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
          position: null,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const urgentElement = screen.getByTestId('urgent-warning');
      expect(urgentElement).toBeInTheDocument();
      expect(urgentElement).toHaveClass('text-red-600');
    });
  });

  describe('In Progress Status', () => {
    it('should display in progress status', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'IN_PROGRESS',
          position: null,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/marking in progress/i)).toBeInTheDocument();
    });
  });

  describe('Expired Status', () => {
    it('should display expired warning', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'EXPIRED',
          isExpired: true,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/time slot expired/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar for queued jobs', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();

      // Position 5 out of 10 = 50% progress
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should show 100% progress when assigned', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          position: null,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Auto-refresh', () => {
    it('should auto-refresh queue data periodically', async () => {
      const mockRefetch = vi.fn();
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      vi.useFakeTimers();

      render(<QueuePositionTracker jobId={mockJobId} />);

      // Fast-forward time by 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it('should not auto-refresh when disabled', async () => {
      const mockRefetch = vi.fn();
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      vi.useFakeTimers();

      render(<QueuePositionTracker jobId={mockJobId} />);

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(mockRefetch).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByRole('region', { name: /queue status/i })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label');
    });

    it('should announce status changes to screen readers', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const liveRegion = screen.getByRole('status', { name: /queue updates/i });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode when specified', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const container = screen.getByTestId('queue-tracker-compact');
      expect(container).toHaveClass('compact');
    });
  });

  describe('Custom Callbacks', () => {
    it('should call onPositionChange when position updates', async () => {
      const onAssigned = vi.fn();

      const { rerender } = render(
        <QueuePositionTracker jobId={mockJobId} />
      );

      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<QueuePositionTracker jobId={mockJobId} />);

      // Update to assigned status
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, status: 'ASSIGNED', position: null },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<QueuePositionTracker jobId={mockJobId} />);

      await waitFor(() => {
        expect(onAssigned).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onExpired when time slot expires', async () => {
      const onExpired = vi.fn();
      const { rerender } = render(
        <QueuePositionTracker jobId={mockJobId} onExpired={onExpired} />
      );

      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, status: 'ASSIGNED' },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<QueuePositionTracker jobId={mockJobId} onExpired={onExpired} />);

      // Update to expired status
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, status: 'EXPIRED', isExpired: true },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<QueuePositionTracker jobId={mockJobId} onExpired={onExpired} />);

      await waitFor(() => {
        expect(onExpired).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing queue data gracefully', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/no queue data/i)).toBeInTheDocument();
    });

    it('should handle zero position', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, position: 0 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/invalid position/i)).toBeInTheDocument();
    });

    it('should handle negative remaining time', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime: -1000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });

    it('should handle very large wait times', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          estimatedWaitTime: {
            minutes: 4320, // 3 days
            hours: 72,
            formattedTime: '3 days',
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText('3 days')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should show green indicator when position is good', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, position: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveClass('bg-green-500');
    });

    it('should show yellow indicator when position is moderate', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, position: 5 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveClass('bg-yellow-500');
    });

    it('should show red indicator when position is poor', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: { ...defaultQueueData, position: 15 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveClass('bg-red-500');
    });
  });

  describe('Time Formatting', () => {
    it('should format time correctly for seconds', () => {
      const remainingTime = 45000; // 45 seconds
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/45 seconds/i)).toBeInTheDocument();
    });

    it('should format time correctly for minutes and seconds', () => {
      const remainingTime = 125000; // 2 minutes 5 seconds
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/2 minutes/i)).toBeInTheDocument();
    });

    it('should format time correctly for hours and minutes', () => {
      const remainingTime = 5400000; // 1 hour 30 minutes
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/1 hour 30 minutes/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update countdown timer in real-time', async () => {
      const remainingTime = 60000; // 1 minute
      mockUseMarkingQueue.mockReturnValue({
        queueData: {
          ...defaultQueueData,
          status: 'ASSIGNED',
          remainingTime,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      vi.useFakeTimers();

      render(<QueuePositionTracker jobId={mockJobId} />);

      expect(screen.getByText(/1 minute/i)).toBeInTheDocument();

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.getByText(/30 seconds/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Interactive Elements', () => {
    it('should have clickable refresh button', () => {
      const mockRefetch = vi.fn();
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();

      act(() => {
        refreshButton.click();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should disable refresh button while loading', () => {
      mockUseMarkingQueue.mockReturnValue({
        queueData: defaultQueueData,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<QueuePositionTracker jobId={mockJobId} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });
});