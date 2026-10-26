// apps/platform/__tests__/marking/MarkingOptionsModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MarkingOptionsModal from '@/components/properties/marking/MarkingOptionsModal';
import * as markingHooks from '@/hooks/useMarkingJobs';
import * as authHooks from '@/hooks/useAuth';

// Mock hooks
vi.mock('@/hooks/useMarkingJobs');
vi.mock('@/hooks/useAuth');

describe('MarkingOptionsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnOptionSelect = vi.fn();
  const mockInitiateMarkingJob = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    propertyId: 'prop-123',
    onOptionSelect: mockOnOptionSelect,
  };

  const mockUser = {
    id: 'user-123',
    role: 'OWNER' as const,
    isPremium: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
    } as any);

    vi.mocked(markingHooks.useMarkingJobs).mockReturnValue({
      initiateMarkingJob: mockInitiateMarkingJob,
      loading: false,
      error: null,
    } as any);
  });

  it('renders all marking options when modal is open', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/Choose Marking Option/i)).toBeInTheDocument();
    expect(screen.getByText(/Mark yourself/i)).toBeInTheDocument();
    expect(screen.getByText(/Assign to Newcondo/i)).toBeInTheDocument();
    expect(screen.getByText(/Send someone you know/i)).toBeInTheDocument();
    expect(screen.getByText(/Broadcast to agents/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<MarkingOptionsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Choose Marking Option/i)).not.toBeInTheDocument();
  });

  it('displays correct pricing for each option', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/Free/i)).toBeInTheDocument();
    expect(screen.getByText(/₦25,000/i)).toBeInTheDocument();
    expect(screen.getByText(/₦20,000/i)).toBeInTheDocument();
  });

  it('handles selecting "Mark yourself" option', async () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const selfMarkOption = screen.getByText(/Mark yourself/i).closest('button');
    fireEvent.click(selfMarkOption!);

    await waitFor(() => {
      expect(mockOnOptionSelect).toHaveBeenCalledWith('SELF');
    });
  });

  it('handles selecting "Assign to Newcondo" option', async () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const newcondoOption = screen.getByText(/Assign to Newcondo/i).closest('button');
    fireEvent.click(newcondoOption!);

    await waitFor(() => {
      expect(mockOnOptionSelect).toHaveBeenCalledWith('NEWCONDO');
    });
  });

  it('handles selecting "Send someone you know" option', async () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const knowSomeoneOption = screen.getByText(/Send someone you know/i).closest('button');
    fireEvent.click(knowSomeoneOption!);

    await waitFor(() => {
      expect(mockOnOptionSelect).toHaveBeenCalledWith('KNOWN_PERSON');
    });
  });

  it('handles selecting "Broadcast to agents" option', async () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const broadcastOption = screen.getByText(/Broadcast to agents/i).closest('button');
    fireEvent.click(broadcastOption!);

    await waitFor(() => {
      expect(mockOnOptionSelect).toHaveBeenCalledWith('BROADCAST');
    });
  });

  it('displays agent commission information for broadcast option', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/Agent receives 25%/i)).toBeInTheDocument();
    expect(screen.getByText(/₦5,000/i)).toBeInTheDocument();
  });

  it('shows premium badge for agents', () => {
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: { ...mockUser, role: 'AGENT', isPremium: true },
      isAuthenticated: true,
      loading: false,
    } as any);

    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/Premium Feature/i)).toBeInTheDocument();
  });

  it('disables options when loading', () => {
    vi.mocked(markingHooks.useMarkingJobs).mockReturnValue({
      initiateMarkingJob: mockInitiateMarkingJob,
      loading: true,
      error: null,
    } as any);

    render(<MarkingOptionsModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const optionButtons = buttons.filter(btn => 
      !btn.textContent?.includes('Cancel')
    );

    optionButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays error message when marking initiation fails', () => {
    const errorMessage = 'Failed to initiate marking job';
    vi.mocked(markingHooks.useMarkingJobs).mockReturnValue({
      initiateMarkingJob: mockInitiateMarkingJob,
      loading: false,
      error: errorMessage,
    } as any);

    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('closes modal when Cancel button is clicked', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when clicking outside modal content', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows time window information for broadcast option', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/3-hour time window/i)).toBeInTheDocument();
    expect(screen.getByText(/First-come-first-served queue/i)).toBeInTheDocument();
  });

  it('displays verification requirement notice', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/2-3 day verification window/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation (Escape key)', () => {
    render(<MarkingOptionsModal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents option selection for unverified users', () => {
    vi.mocked(authHooks.useAuth).mockReturnValue({
      user: { ...mockUser, verificationStatus: 'PENDING' },
      isAuthenticated: true,
      loading: false,
    } as any);

    render(<MarkingOptionsModal {...defaultProps} />);

    expect(screen.getByText(/verify your account/i)).toBeInTheDocument();
  });

  it('tracks analytics when option is selected', async () => {
    const trackEvent = vi.fn();
    window.gtag = trackEvent;

    render(<MarkingOptionsModal {...defaultProps} />);

    const selfMarkOption = screen.getByText(/Mark yourself/i).closest('button');
    fireEvent.click(selfMarkOption!);

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith('event', 'marking_option_selected', {
        option_type: 'SELF',
        property_id: 'prop-123',
      });
    });
  });

  it('displays warning for high-demand areas', () => {
    render(<MarkingOptionsModal {...defaultProps} isHighDemandArea />);

    expect(screen.getByText(/high demand area/i)).toBeInTheDocument();
  });
});