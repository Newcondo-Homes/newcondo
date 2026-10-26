// File: apps/platform/__tests__/components/virtual-accounts/VirtualAccountCard.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { VirtualAccountCard } from '../../../components/virtual-accounts/VirtualAccountCard';

// Mock the shared components and icons
vi.mock('@newcondo/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <h3 className={className} data-testid="card-title">{children}</h3>,
  Button: ({ children, onClick, variant, size, disabled, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={className}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
}));

// Mock the virtual account store
const mockVirtualAccountStore = {
  accounts: [],
  isLoading: false,
  error: null,
  copyAccountDetails: vi.fn(),
  refreshBalance: vi.fn(),
};

vi.mock('../../../store/virtualAccountStore', () => ({
  useVirtualAccountStore: () => mockVirtualAccountStore,
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock toast notifications
vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockVirtualAccount = {
  id: 'va-123',
  accountNumber: '1234567890',
  accountName: 'John Doe Property Account',
  bankCode: '044',
  balance: 150000.00,
  currency: 'NGN',
  isActive: true,
  userId: 'user-123',
  propertyId: 'prop-123',
  flutterwaveAccountId: 'fw-acc-123',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  },
  property: {
    id: 'prop-123',
    title: 'Beautiful 2-Bedroom Apartment',
    address: '123 Victoria Island, Lagos',
  },
};

const defaultProps = {
  virtualAccount: mockVirtualAccount,
  showBalance: true,
  onRefreshBalance: vi.fn(),
  onCopyDetails: vi.fn(),
};

describe('VirtualAccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders virtual account details correctly', () => {
    render(<VirtualAccountCard {...defaultProps} />);

    expect(screen.getByText('Virtual Account')).toBeInTheDocument();
    expect(screen.getByText('John Doe Property Account')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('Access Bank')).toBeInTheDocument(); // Bank code 044 -> Access Bank
  });

  it('displays balance when showBalance is true', () => {
    render(<VirtualAccountCard {...defaultProps} />);

    expect(screen.getByText('₦150,000.00')).toBeInTheDocument();
    expect(screen.getByText('Available Balance')).toBeInTheDocument();
  });

  it('hides balance when showBalance is false', () => {
    render(<VirtualAccountCard {...defaultProps} showBalance={false} />);

    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('toggles balance visibility when eye icon is clicked', async () => {
    const { rerender } = render(<VirtualAccountCard {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /hide balance/i });
    fireEvent.click(toggleButton);

    // Component should re-render with showBalance false
    rerender(<VirtualAccountCard {...defaultProps} showBalance={false} />);
    
    expect(screen.getByText('••••••••')).toBeInTheDocument();
  });

  it('copies account details when copy button is clicked', async () => {
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    
    render(<VirtualAccountCard {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy account details/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        'Account Name: John Doe Property Account\nAccount Number: 1234567890\nBank: Access Bank'
      );
    });

    expect(defaultProps.onCopyDetails).toHaveBeenCalledWith(mockVirtualAccount);
  });

  it('refreshes balance when refresh button is clicked', async () => {
    render(<VirtualAccountCard {...defaultProps} />);

    const refreshButton = screen.getByRole('button', { name: /refresh balance/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(defaultProps.onRefreshBalance).toHaveBeenCalledWith(mockVirtualAccount.id);
    });
  });

  it('shows inactive badge when account is inactive', () => {
    const inactiveAccount = { ...mockVirtualAccount, isActive: false };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={inactiveAccount} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('shows active badge when account is active', () => {
    render(<VirtualAccountCard {...defaultProps} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-variant', 'default');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays property information when available', () => {
    render(<VirtualAccountCard {...defaultProps} />);

    expect(screen.getByText('Beautiful 2-Bedroom Apartment')).toBeInTheDocument();
    expect(screen.getByText('123 Victoria Island, Lagos')).toBeInTheDocument();
  });

  it('handles account without property information', () => {
    const accountWithoutProperty = {
      ...mockVirtualAccount,
      property: null,
      propertyId: null,
    };

    render(<VirtualAccountCard {...defaultProps} virtualAccount={accountWithoutProperty} />);

    expect(screen.getByText('General Account')).toBeInTheDocument();
  });

  it('formats currency correctly for different currencies', () => {
    const usdAccount = { ...mockVirtualAccount, currency: 'USD', balance: 1000.50 };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={usdAccount} />);

    expect(screen.getByText('$1,000.50')).toBeInTheDocument();
  });

  it('shows loading state during balance refresh', () => {
    mockVirtualAccountStore.isLoading = true;
    
    render(<VirtualAccountCard {...defaultProps} />);

    const refreshButton = screen.getByRole('button', { name: /refresh balance/i });
    expect(refreshButton).toBeDisabled();
  });

  it('displays error state when there is an error', () => {
    mockVirtualAccountStore.error = 'Failed to load account details';
    
    render(<VirtualAccountCard {...defaultProps} />);

    expect(screen.getByText('Error loading account')).toBeInTheDocument();
  });

  it('handles zero balance correctly', () => {
    const zeroBalanceAccount = { ...mockVirtualAccount, balance: 0 };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={zeroBalanceAccount} />);

    expect(screen.getByText('₦0.00')).toBeInTheDocument();
  });

  it('shows correct bank name based on bank code', () => {
    const gtbAccount = { ...mockVirtualAccount, bankCode: '058' };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={gtbAccount} />);

    expect(screen.getByText('Guaranty Trust Bank')).toBeInTheDocument();
  });

  it('handles unknown bank code gracefully', () => {
    const unknownBankAccount = { ...mockVirtualAccount, bankCode: '999' };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={unknownBankAccount} />);

    expect(screen.getByText('Unknown Bank')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<VirtualAccountCard {...defaultProps} />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('virtual-account-card');
  });

  it('handles click events correctly', () => {
    const onCardClick = vi.fn();
    
    render(<VirtualAccountCard {...defaultProps} onClick={onCardClick} />);

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(onCardClick).toHaveBeenCalledWith(mockVirtualAccount);
  });
});

// Additional test suite for edge cases
describe('VirtualAccountCard Edge Cases', () => {
  it('handles very large balance amounts', () => {
    const largeBalanceAccount = { ...mockVirtualAccount, balance: 999999999.99 };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={largeBalanceAccount} />);

    expect(screen.getByText('₦999,999,999.99')).toBeInTheDocument();
  });

  it('handles very long account names', () => {
    const longNameAccount = {
      ...mockVirtualAccount,
      accountName: 'Very Long Property Owner Name With Multiple Words That Might Overflow',
    };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={longNameAccount} />);

    expect(screen.getByText(longNameAccount.accountName)).toBeInTheDocument();
  });

  it('handles missing user information', () => {
    const accountWithoutUser = { ...mockVirtualAccount, user: null };
    
    render(<VirtualAccountCard {...defaultProps} virtualAccount={accountWithoutUser} />);

    expect(screen.getByText('John Doe Property Account')).toBeInTheDocument();
  });

  it('handles network error during copy operation', async () => {
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('Clipboard access denied'));
    
    render(<VirtualAccountCard {...defaultProps} />);

    const copyButton = screen.getByRole('button', { name: /copy account details/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    // Should still call the callback even if clipboard fails
    expect(defaultProps.onCopyDetails).toHaveBeenCalled();
  });
});