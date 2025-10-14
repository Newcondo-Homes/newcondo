// apps/platform/__tests__/marking/PropertyVerificationForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropertyVerificationForm from '@/components/marking/PropertyVerificationForm';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useMarkingJobs');
jest.mock('sonner');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockUseMarkingJobs = useMarkingJobs as jest.MockedFunction<typeof useMarkingJobs>;

describe('PropertyVerificationForm', () => {
  let queryClient: QueryClient;
  const mockVerifyMarking = jest.fn();
  const mockRejectMarking = jest.fn();

  const mockMarkingJob = {
    id: 'job-123',
    propertyId: 'prop-123',
    status: 'COMPLETED',
    assignedAgentId: 'agent-123',
    completionImages: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ],
    completionNotes: 'Property marked successfully. All boundaries verified.',
    boundaryData: {
      type: 'Polygon',
      coordinates: [
        [
          [3.3792, 6.5244],
          [3.3795, 6.5244],
          [3.3795, 6.5247],
          [3.3792, 6.5247],
          [3.3792, 6.5244],
        ],
      ],
    },
    contactPersonName: 'John Doe',
    contactPersonPhone: '+2348012345678',
    markingFee: 20000,
    paymentStatus: 'SUCCESS',
    confirmationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseMarkingJobs.mockReturnValue({
      verifyMarking: mockVerifyMarking,
      rejectMarking: mockRejectMarking,
      isVerifying: false,
      isRejecting: false,
    } as any);

    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PropertyVerificationForm markingJob={mockMarkingJob} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render verification form with marking details', () => {
      renderComponent();

      expect(screen.getByText(/verify property marking/i)).toBeInTheDocument();
      expect(screen.getByText(/property marked successfully/i)).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+2348012345678')).toBeInTheDocument();
    });

    it('should display completion images', () => {
      renderComponent();

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(mockMarkingJob.completionImages.length);
    });

    it('should show countdown timer for verification deadline', () => {
      renderComponent();

      expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
      expect(screen.getByText(/days/i)).toBeInTheDocument();
    });

    it('should display boundary data visualization', () => {
      renderComponent();

      expect(screen.getByTestId('boundary-map')).toBeInTheDocument();
    });

    it('should show verification actions', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /approve marking/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject marking/i })).toBeInTheDocument();
    });
  });

  describe('Image Gallery', () => {
    it('should allow image navigation', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next image/i });
      await user.click(nextButton);

      // Verify image changed
      await waitFor(() => {
        const currentImage = screen.getByRole('img', { name: /completion image/i });
        expect(currentImage).toHaveAttribute('src', expect.stringContaining('image2.jpg'));
      });
    });

    it('should open image in fullscreen on click', async () => {
      const user = userEvent.setup();
      renderComponent();

      const image = screen.getAllByRole('img')[0];
      await user.click(image);

      expect(screen.getByTestId('fullscreen-modal')).toBeInTheDocument();
    });

    it('should allow zooming in on images', async () => {
      const user = userEvent.setup();
      renderComponent();

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      const image = screen.getByRole('img', { name: /completion image/i });
      expect(image).toHaveStyle({ transform: expect.stringContaining('scale') });
    });
  });

  describe('Boundary Verification', () => {
    it('should display boundary on map', () => {
      renderComponent();

      const map = screen.getByTestId('boundary-map');
      expect(map).toBeInTheDocument();
    });

    it('should show boundary measurements', () => {
      renderComponent();

      expect(screen.getByText(/area/i)).toBeInTheDocument();
      expect(screen.getByText(/perimeter/i)).toBeInTheDocument();
    });

    it('should allow toggling satellite view', async () => {
      const user = userEvent.setup();
      renderComponent();

      const satelliteToggle = screen.getByRole('button', { name: /satellite view/i });
      await user.click(satelliteToggle);

      expect(satelliteToggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('should validate boundary overlaps', async () => {
      const markingJobWithOverlap = {
        ...mockMarkingJob,
        boundaryWarnings: ['Boundary overlaps with existing property PROP-456'],
      };

      renderComponent({ markingJob: markingJobWithOverlap });

      expect(screen.getByText(/boundary overlaps/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Verification Actions', () => {
    it('should verify marking successfully', async () => {
      const user = userEvent.setup();
      mockVerifyMarking.mockResolvedValueOnce({ success: true });

      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      await user.click(approveButton);

      // Confirm dialog
      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockVerifyMarking).toHaveBeenCalledWith({
          jobId: mockMarkingJob.id,
          propertyId: mockMarkingJob.propertyId,
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Property marking verified successfully');
    });

    it('should handle verification with notes', async () => {
      const user = userEvent.setup();
      mockVerifyMarking.mockResolvedValueOnce({ success: true });

      renderComponent();

      const notesTextarea = screen.getByPlaceholderText(/add verification notes/i);
      await user.type(notesTextarea, 'All boundaries look correct');

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      await user.click(approveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockVerifyMarking).toHaveBeenCalledWith({
          jobId: mockMarkingJob.id,
          propertyId: mockMarkingJob.propertyId,
          notes: 'All boundaries look correct',
        });
      });
    });

    it('should reject marking with reason', async () => {
      const user = userEvent.setup();
      mockRejectMarking.mockResolvedValueOnce({ success: true });

      renderComponent();

      const rejectButton = screen.getByRole('button', { name: /reject marking/i });
      await user.click(rejectButton);

      // Fill rejection form
      const reasonSelect = screen.getByLabelText(/rejection reason/i);
      await user.selectOptions(reasonSelect, 'INCORRECT_BOUNDARY');

      const detailsTextarea = screen.getByPlaceholderText(/provide additional details/i);
      await user.type(detailsTextarea, 'Boundary does not match property dimensions');

      const confirmRejectButton = screen.getByRole('button', { name: /confirm rejection/i });
      await user.click(confirmRejectButton);

      await waitFor(() => {
        expect(mockRejectMarking).toHaveBeenCalledWith({
          jobId: mockMarkingJob.id,
          reason: 'INCORRECT_BOUNDARY',
          details: 'Boundary does not match property dimensions',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Marking rejected. Agent will be notified.');
    });

    it('should require rejection reason', async () => {
      const user = userEvent.setup();
      renderComponent();

      const rejectButton = screen.getByRole('button', { name: /reject marking/i });
      await user.click(rejectButton);

      const confirmRejectButton = screen.getByRole('button', { name: /confirm rejection/i });
      await user.click(confirmRejectButton);

      expect(screen.getByText(/please select a reason/i)).toBeInTheDocument();
      expect(mockRejectMarking).not.toHaveBeenCalled();
    });

    it('should handle verification errors', async () => {
      const user = userEvent.setup();
      mockVerifyMarking.mockRejectedValueOnce(new Error('Verification failed'));

      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      await user.click(approveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to verify marking. Please try again.');
      });
    });

    it('should disable actions during processing', async () => {
      const user = userEvent.setup();
      mockUseMarkingJobs.mockReturnValue({
        verifyMarking: mockVerifyMarking,
        rejectMarking: mockRejectMarking,
        isVerifying: true,
        isRejecting: false,
      } as any);

      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      expect(approveButton).toBeDisabled();
    });
  });

  describe('Deadline Management', () => {
    it('should show warning when deadline is near', () => {
      const nearDeadlineJob = {
        ...mockMarkingJob,
        confirmationDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      };

      renderComponent({ markingJob: nearDeadlineJob });

      expect(screen.getByText(/urgent: deadline approaching/i)).toBeInTheDocument();
    });

    it('should show expired state when deadline passed', () => {
      const expiredJob = {
        ...mockMarkingJob,
        confirmationDeadline: new Date(Date.now() - 1000).toISOString(),
      };

      renderComponent({ markingJob: expiredJob });

      expect(screen.getByText(/verification deadline expired/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /approve marking/i })).toBeDisabled();
    });

    it('should update countdown in real-time', async () => {
      jest.useFakeTimers();
      renderComponent();

      const initialTime = screen.getByText(/time remaining/i).textContent;

      // Advance time by 1 minute
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        const updatedTime = screen.getByText(/time remaining/i).textContent;
        expect(updatedTime).not.toBe(initialTime);
      });

      jest.useRealTimers();
    });
  });

  describe('Agent Information', () => {
    it('should display agent details', () => {
      const jobWithAgent = {
        ...mockMarkingJob,
        assignedAgent: {
          id: 'agent-123',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+2348087654321',
          agentReliabilityScore: 4.8,
          completedMarkingJobs: 25,
        },
      };

      renderComponent({ markingJob: jobWithAgent });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText(/4\.8/)).toBeInTheDocument();
      expect(screen.getByText(/25 completed jobs/i)).toBeInTheDocument();
    });

    it('should allow contacting agent', async () => {
      const user = userEvent.setup();
      const jobWithAgent = {
        ...mockMarkingJob,
        assignedAgent: {
          id: 'agent-123',
          name: 'Jane Smith',
          phone: '+2348087654321',
        },
      };

      renderComponent({ markingJob: jobWithAgent });

      const contactButton = screen.getByRole('button', { name: /contact agent/i });
      await user.click(contactButton);

      expect(screen.getByText(/\+2348087654321/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /approve marking/i })).toHaveAttribute(
        'aria-label'
      );
      expect(screen.getByRole('button', { name: /reject marking/i })).toHaveAttribute(
        'aria-label'
      );
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      approveButton.focus();

      expect(approveButton).toHaveFocus();

      await user.keyboard('{Tab}');
      const rejectButton = screen.getByRole('button', { name: /reject marking/i });
      expect(rejectButton).toHaveFocus();
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      mockVerifyMarking.mockResolvedValueOnce({ success: true });

      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      await user.click(approveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/verified successfully/i);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing completion images', () => {
      const jobWithoutImages = {
        ...mockMarkingJob,
        completionImages: [],
      };

      renderComponent({ markingJob: jobWithoutImages });

      expect(screen.getByText(/no images available/i)).toBeInTheDocument();
    });

    it('should handle missing boundary data', () => {
      const jobWithoutBoundary = {
        ...mockMarkingJob,
        boundaryData: null,
      };

      renderComponent({ markingJob: jobWithoutBoundary });

      expect(screen.getByText(/boundary data not available/i)).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockVerifyMarking.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      const approveButton = screen.getByRole('button', { name: /approve marking/i });
      await user.click(approveButton);

      const confirmButton = screen.getByRole('button', { name: /confirm approval/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('network error')
        );
      });
    });
  });

  describe('Payment Information', () => {
    it('should display marking fee and payment status', () => {
      renderComponent();

      expect(screen.getByText(/₦20,000/)).toBeInTheDocument();
      expect(screen.getByText(/payment: success/i)).toBeInTheDocument();
    });

    it('should show commission breakdown', () => {
      renderComponent();

      expect(screen.getByText(/agent commission: ₦5,000/i)).toBeInTheDocument();
      expect(screen.getByText(/platform fee: ₦15,000/i)).toBeInTheDocument();
    });

    it('should indicate pending payment release', () => {
      const jobPendingRelease = {
        ...mockMarkingJob,
        paymentStatus: 'HELD',
      };

      renderComponent({ markingJob: jobPendingRelease });

      expect(screen.getByText(/payment will be released after verification/i)).toBeInTheDocument();
    });
  });
});