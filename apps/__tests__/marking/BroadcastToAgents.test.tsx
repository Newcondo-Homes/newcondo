// apps/platform/__tests__/marking/BroadcastToAgents.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BroadcastToAgents from '@/components/properties/marking/BroadcastToAgents';
import * as proximityHooks from '@/hooks/useProximityAgents';
import * as markingHooks from '@/hooks/useMarkingJobs';

// Mock hooks
vi.mock('@/hooks/useProximityAgents');
vi.mock('@/hooks/useMarkingJobs');
vi.mock('@/components/shared/feedback/Toast', () => ({
  default: ({ message }: any) => <div data-testid="toast">{message}</div>,
}));

describe('BroadcastToAgents', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const mockBroadcastJob = vi.fn();
  
  const defaultProps = {
    propertyId: 'prop-123',
    propertyLocation: {
      state: 'Lagos',
      city: 'Ikeja',
      address: '123 Test Street',
      gpsCoordinates: JSON.stringify({ lat: 6.5244, lng: 3.3792 }),
    },
    markingFee: 20000,
    onComplete: mockOnComplete,
    onCancel: mockOnCancel,
  };

  const mockNearbyAgents = [
    {
      id: 'agent-1',
      name: 'John Agent',
      distance: 2.5,
      reliabilityScore: 4.5,
      completedJobs: 25,
      isAvailable: true,
    },
    {
      id: 'agent-2',
      name: 'Jane Agent',
      distance: 3.8,
      reliabilityScore: 4.8,
      completedJobs: 42,
      isAvailable: true,
    },
    {
      id: 'agent-3',
      name: 'Bob Agent',
      distance: 5.1,
      reliabilityScore: 4.2,
      completedJobs: 15,
      isAvailable: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(proximityHooks.useProximityAgents).mockReturnValue({
      agents: mockNearbyAgents,
      loading: false,
      error: null,
      fetchNearbyAgents: vi.fn(),
    } as any);

    vi.mocked(markingHooks.useMarkingJobs).mockReturnValue({
      broadcastMarkingJob: mockBroadcastJob,
      loading: false,
      error: null,
    } as any);
  });

  it('renders broadcast form with property details', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/Broadcast to Nearby Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Lagos/i)).toBeInTheDocument();
    expect(screen.getByText(/Ikeja/i)).toBeInTheDocument();
  });

  it('displays list of nearby agents', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText('John Agent')).toBeInTheDocument();
    expect(screen.getByText('Jane Agent')).toBeInTheDocument();
    expect(screen.getByText('Bob Agent')).toBeInTheDocument();
  });

  it('shows agent distance from property', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/2.5 km away/i)).toBeInTheDocument();
    expect(screen.getByText(/3.8 km away/i)).toBeInTheDocument();
  });

  it('displays agent reliability scores', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/4.5/)).toBeInTheDocument();
    expect(screen.getByText(/4.8/)).toBeInTheDocument();
  });

  it('shows completed jobs count for each agent', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/25 jobs completed/i)).toBeInTheDocument();
    expect(screen.getByText(/42 jobs completed/i)).toBeInTheDocument();
  });

  it('marks unavailable agents visually', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const bobAgent = screen.getByText('Bob Agent').closest('div');
    expect(bobAgent).toHaveClass('opacity-50');
  });

  it('displays marking fee and agent commission', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/₦20,000/i)).toBeInTheDocument();
    expect(screen.getByText(/₦5,000/i)).toBeInTheDocument(); // 25% commission
  });

  it('handles contact person details form', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Contact Person Name/i);
    const phoneInput = screen.getByLabelText(/Contact Phone/i);

    fireEvent.change(nameInput, { target: { value: 'Contact Person' } });
    fireEvent.change(phoneInput, { target: { value: '08012345678' } });

    expect(nameInput).toHaveValue('Contact Person');
    expect(phoneInput).toHaveValue('08012345678');
  });

  it('validates contact person phone number', async () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Contact Phone/i);
    const submitButton = screen.getByText(/Broadcast Job/i);

    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid phone number/i)).toBeInTheDocument();
    });
  });

  it('handles access instructions textarea', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const instructionsInput = screen.getByLabelText(/Access Instructions/i);
    const instructions = 'Gate code is 1234. Ask for Mr. Johnson.';

    fireEvent.change(instructionsInput, { target: { value: instructions } });

    expect(instructionsInput).toHaveValue(instructions);
  });

  it('displays 3-hour time window information', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/3-hour time window/i)).toBeInTheDocument();
  });

  it('shows queue system explanation', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/first-come-first-served/i)).toBeInTheDocument();
    expect(screen.getByText(/queue/i)).toBeInTheDocument();
  });

  it('successfully broadcasts job to agents', async () => {
    mockBroadcastJob.mockResolvedValue({ success: true, jobId: 'job-123' });

    render(<BroadcastToAgents {...defaultProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Contact Person Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Phone/i), {
      target: { value: '08012345678' },
    });

    // Submit
    const submitButton = screen.getByText(/Broadcast Job/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockBroadcastJob).toHaveBeenCalledWith({
        propertyId: 'prop-123',
        contactPersonName: 'John Doe',
        contactPersonPhone: '08012345678',
        accessInstructions: '',
        markingFee: 20000,
      });
      expect(mockOnComplete).toHaveBeenCalledWith('job-123');
    });
  });

  it('handles broadcast error gracefully', async () => {
    const errorMessage = 'No agents available in this area';
    mockBroadcastJob.mockRejectedValue(new Error(errorMessage));

    render(<BroadcastToAgents {...defaultProps} />);

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/Contact Person Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Phone/i), {
      target: { value: '08012345678' },
    });
    fireEvent.click(screen.getByText(/Broadcast Job/i));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables submit button when loading', () => {
    vi.mocked(markingHooks.useMarkingJobs).mockReturnValue({
      broadcastMarkingJob: mockBroadcastJob,
      loading: true,
      error: null,
    } as any);

    render(<BroadcastToAgents {...defaultProps} />);

    const submitButton = screen.getByText(/Broadcasting.../i);
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state for nearby agents', () => {
    vi.mocked(proximityHooks.useProximityAgents).mockReturnValue({
      agents: [],
      loading: true,
      error: null,
      fetchNearbyAgents: vi.fn(),
    } as any);

    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/Finding nearby agents/i)).toBeInTheDocument();
  });

  it('displays message when no agents are available', () => {
    vi.mocked(proximityHooks.useProximityAgents).mockReturnValue({
      agents: [],
      loading: false,
      error: null,
      fetchNearbyAgents: vi.fn(),
    } as any);

    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/No agents available/i)).toBeInTheDocument();
  });

  it('handles cancel button click', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('validates all required fields before submission', async () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const submitButton = screen.getByText(/Broadcast Job/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Contact person name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Contact phone is required/i)).toBeInTheDocument();
    });

    expect(mockBroadcastJob).not.toHaveBeenCalled();
  });

  it('filters out unavailable agents from broadcast', async () => {
    mockBroadcastJob.mockResolvedValue({ success: true, jobId: 'job-123' });

    render(<BroadcastToAgents {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Contact Person Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Phone/i), {
      target: { value: '08012345678' },
    });
    fireEvent.click(screen.getByText(/Broadcast Job/i));

    await waitFor(() => {
      expect(screen.getByText(/Broadcast to 2 available agents/i)).toBeInTheDocument();
    });
  });

  it('displays agent radius search setting', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/within 10 km/i)).toBeInTheDocument();
  });

  it('shows estimated response time', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    expect(screen.getByText(/Usually within 30 minutes/i)).toBeInTheDocument();
  });

  it('handles preferred time selection', () => {
    render(<BroadcastToAgents {...defaultProps} />);

    const timeInput = screen.getByLabelText(/Preferred Time/i);
    fireEvent.change(timeInput, { target: { value: '2024-12-01T10:00' } });

    expect(timeInput).toHaveValue('2024-12-01T10:00');
  });

  it('tracks broadcast analytics', async () => {
    const trackEvent = vi.fn();
    window.gtag = trackEvent;
    mockBroadcastJob.mockResolvedValue({ success: true, jobId: 'job-123' });

    render(<BroadcastToAgents {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Contact Person Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Contact Phone/i), {
      target: { value: '08012345678' },
    });
    fireEvent.click(screen.getByText(/Broadcast Job/i));

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith('event', 'marking_job_broadcast', {
        property_id: 'prop-123',
        available_agents: 2,
        marking_fee: 20000,
      });
    });
  });
});