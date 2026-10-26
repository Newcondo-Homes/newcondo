// apps/platform/__tests__/components/ConfirmationForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmationForm from '@/components/payments/ConfirmationForm';
import * as paymentApi from '@/lib/api/payments';

// Mock the API calls
vi.mock('@/lib/api/payments', () => ({
  confirmPayment: vi.fn(),
  requestRefund: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock toast notifications
vi.mock('@/components/shared/feedback/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ConfirmationForm', () => {
  const mockPayment = {
    id: 'payment_123',
    amount: 500000,
    confirmationPeriodEnd: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    status: 'HELD' as const,
    rental: {
      property: {
        title: 'Beautiful 3 Bedroom Apartment',
        address: '123 Lagos Street',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render payment details correctly', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      expect(screen.getByText('Beautiful 3 Bedroom Apartment')).toBeInTheDocument();
      expect(screen.getByText('123 Lagos Street')).toBeInTheDocument();
      expect(screen.getByText(/₦500,000.00/)).toBeInTheDocument();
    });

    it('should display countdown timer', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      expect(screen.getByText(/Time Remaining:/)).toBeInTheDocument();
      expect(screen.getByText(/hours/)).toBeInTheDocument();
    });

    it('should show confirmation checklist items', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      expect(screen.getByText(/I have physically visited the property/)).toBeInTheDocument();
      expect(screen.getByText(/The property matches the listing description/)).toBeInTheDocument();
      expect(screen.getByText(/All amenities are functional/)).toBeInTheDocument();
      expect(screen.getByText(/I confirm the property is available/)).toBeInTheDocument();
    });

    it('should disable confirm button initially', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Checkbox Interactions', () => {
    it('should enable confirm button when all checkboxes are checked', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should disable confirm button when any checkbox is unchecked', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Check all
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Uncheck one
      fireEvent.click(checkboxes[0]);

      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Confirmation Flow', () => {
    it('should call confirmPayment API on confirm button click', async () => {
      const mockConfirmPayment = vi.mocked(paymentApi.confirmPayment);
      mockConfirmPayment.mockResolvedValueOnce({
        success: true,
        message: 'Payment confirmed successfully',
      });

      render(<ConfirmationForm payment={mockPayment} />);

      // Check all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockConfirmPayment).toHaveBeenCalledWith(mockPayment.id);
      });
    });

    it('should show loading state during confirmation', async () => {
      const mockConfirmPayment = vi.mocked(paymentApi.confirmPayment);
      mockConfirmPayment.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      );

      render(<ConfirmationForm payment={mockPayment} />);

      // Check all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      fireEvent.click(confirmButton);

      expect(screen.getByText(/Confirming.../i)).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
    });

    it('should handle confirmation success', async () => {
      const mockConfirmPayment = vi.mocked(paymentApi.confirmPayment);
      mockConfirmPayment.mockResolvedValueOnce({
        success: true,
        message: 'Payment confirmed successfully',
      });

      render(<ConfirmationForm payment={mockPayment} />);

      // Check all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Property confirmed successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle confirmation error', async () => {
      const mockConfirmPayment = vi.mocked(paymentApi.confirmPayment);
      mockConfirmPayment.mockRejectedValueOnce(new Error('Network error'));

      render(<ConfirmationForm payment={mockPayment} />);

      // Check all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Click confirm button
      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to confirm payment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Refund Request Flow', () => {
    it('should show refund modal when request refund is clicked', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      const refundButton = screen.getByRole('button', { name: /Request Refund/i });
      fireEvent.click(refundButton);

      expect(screen.getByText(/Request Refund/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Explain why you're requesting a refund/i)).toBeInTheDocument();
    });

    it('should require reason text before submitting refund', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      // Open modal
      const refundButton = screen.getByRole('button', { name: /Request Refund/i });
      fireEvent.click(refundButton);

      // Try to submit without reason
      const submitButton = screen.getByRole('button', { name: /Submit Refund Request/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when reason is provided', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      // Open modal
      const refundButton = screen.getByRole('button', { name: /Request Refund/i });
      fireEvent.click(refundButton);

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/Explain why you're requesting a refund/i);
      fireEvent.change(reasonInput, { 
        target: { value: 'Property is not as described' } 
      });

      const submitButton = screen.getByRole('button', { name: /Submit Refund Request/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call requestRefund API with reason', async () => {
      const mockRequestRefund = vi.mocked(paymentApi.requestRefund);
      mockRequestRefund.mockResolvedValueOnce({
        success: true,
        message: 'Refund request submitted',
      });

      render(<ConfirmationForm payment={mockPayment} />);

      // Open modal
      const refundButton = screen.getByRole('button', { name: /Request Refund/i });
      fireEvent.click(refundButton);

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/Explain why you're requesting a refund/i);
      const reason = 'Property is not as described';
      fireEvent.change(reasonInput, { target: { value: reason } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Refund Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestRefund).toHaveBeenCalledWith(mockPayment.id, reason);
      });
    });

    it('should handle refund request success', async () => {
      const mockRequestRefund = vi.mocked(paymentApi.requestRefund);
      mockRequestRefund.mockResolvedValueOnce({
        success: true,
        message: 'Refund request submitted successfully',
      });

      render(<ConfirmationForm payment={mockPayment} />);

      // Open modal and submit refund
      const refundButton = screen.getByRole('button', { name: /Request Refund/i });
      fireEvent.click(refundButton);

      const reasonInput = screen.getByPlaceholderText(/Explain why you're requesting a refund/i);
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

      const submitButton = screen.getByRole('button', { name: /Submit Refund Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Refund request submitted/i)).toBeInTheDocument();
      });
    });
  });

  describe('Expired Confirmation Period', () => {
    it('should display expired message when period has passed', () => {
      const expiredPayment = {
        ...mockPayment,
        confirmationPeriodEnd: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      };

      render(<ConfirmationForm payment={expiredPayment} />);

      expect(screen.getByText(/Confirmation period has expired/i)).toBeInTheDocument();
    });

    it('should disable all actions when period has expired', () => {
      const expiredPayment = {
        ...mockPayment,
        confirmationPeriodEnd: new Date(Date.now() - 1000).toISOString(),
      };

      render(<ConfirmationForm payment={expiredPayment} />);

      const confirmButton = screen.getByRole('button', { name: /Confirm Property/i });
      const refundButton = screen.getByRole('button', { name: /Request Refund/i });

      expect(confirmButton).toBeDisabled();
      expect(refundButton).toBeDisabled();
    });
  });

  describe('Already Confirmed Payment', () => {
    it('should display confirmed status', () => {
      const confirmedPayment = {
        ...mockPayment,
        status: 'RELEASED' as const,
      };

      render(<ConfirmationForm payment={confirmedPayment} />);

      expect(screen.getByText(/Payment already confirmed/i)).toBeInTheDocument();
    });

    it('should disable all actions for confirmed payments', () => {
      const confirmedPayment = {
        ...mockPayment,
        status: 'RELEASED' as const,
      };

      render(<ConfirmationForm payment={confirmedPayment} />);

      const confirmButton = screen.queryByRole('button', { name: /Confirm Property/i });
      const refundButton = screen.queryByRole('button', { name: /Request Refund/i });

      expect(confirmButton).not.toBeInTheDocument();
      expect(refundButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Payment confirmation form');
    });

    it('should be keyboard navigable', () => {
      render(<ConfirmationForm payment={mockPayment} />);

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Tab through checkboxes
      checkboxes[0].focus();
      expect(document.activeElement).toBe(checkboxes[0]);

      fireEvent.keyDown(checkboxes[0], { key: 'Tab' });
      fireEvent.keyDown(checkboxes[1], { key: 'Tab' });
    });
  });
});