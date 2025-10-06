import { useMemo } from 'react';

interface CommissionBreakdown {
  totalRent: number;
  platformCommission: number; // 20% of rent
  platformPercentage: number; // Always 20%
  
  // Agent commissions (50% of platform commission)
  agentTotalCommission: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  
  // Property owner receives
  propertyOwnerAmount: number;
  
  // Newcondo platform receives
  newcondoAmount: number;
  
  // Service fees (Flutterwave charges)
  serviceFee: number;
  serviceFeePercentage: number;
  refundServiceFee: number; // Double service fee for refunds
  
  // Final amounts after all deductions
  totalDeductions: number;
  netPropertyOwnerAmount: number;
}

interface CommissionDistribution {
  propertyOwner: {
    amount: number;
    percentage: number;
  };
  listingAgent: {
    amount: number;
    percentage: number;
  };
  subAgent: {
    amount: number;
    percentage: number;
  };
  newcondo: {
    amount: number;
    percentage: number;
  };
  serviceFee: {
    amount: number;
    description: string;
  };
}

interface CalculationOptions {
  rentAmount: number;
  hasListingAgent: boolean;
  hasSubAgent: boolean;
  includeServiceFee?: boolean;
  serviceFeePercentage?: number; // Default: 1.4% (Flutterwave standard)
}

const DEFAULT_SERVICE_FEE_PERCENTAGE = 1.4; // 1.4% Flutterwave charge
const PLATFORM_COMMISSION_PERCENTAGE = 20; // 20% platform commission
const AGENT_COMMISSION_SPLIT = 50; // Agents get 50% of platform commission

export function useCommissionCalculator() {
  /**
   * Calculate detailed commission breakdown
   */
  const calculateCommissions = useMemo(() => {
    return (options: CalculationOptions): CommissionBreakdown => {
      const {
        rentAmount,
        hasListingAgent,
        hasSubAgent,
        includeServiceFee = true,
        serviceFeePercentage = DEFAULT_SERVICE_FEE_PERCENTAGE,
      } = options;

      // Calculate platform commission (20% of rent)
      const platformCommission = rentAmount * (PLATFORM_COMMISSION_PERCENTAGE / 100);

      // Calculate agent commissions (50% of platform commission)
      const agentTotalCommission = platformCommission * (AGENT_COMMISSION_SPLIT / 100);

      let listingAgentCommission = 0;
      let subAgentCommission = 0;

      if (hasListingAgent && hasSubAgent) {
        // Split equally between listing agent and sub-agent
        listingAgentCommission = agentTotalCommission / 2;
        subAgentCommission = agentTotalCommission / 2;
      } else if (hasListingAgent) {
        // Full agent commission goes to listing agent
        listingAgentCommission = agentTotalCommission;
      }

      // Calculate Newcondo's share
      const newcondoAmount = platformCommission - agentTotalCommission;

      // Calculate service fees
      const serviceFee = includeServiceFee
        ? rentAmount * (serviceFeePercentage / 100)
        : 0;

      const refundServiceFee = serviceFee * 2; // Double for refund coverage

      // Calculate property owner amount
      const propertyOwnerAmount = rentAmount - platformCommission;
      const totalDeductions = platformCommission + (includeServiceFee ? serviceFee : 0);
      const netPropertyOwnerAmount = rentAmount - totalDeductions;

      return {
        totalRent: rentAmount,
        platformCommission,
        platformPercentage: PLATFORM_COMMISSION_PERCENTAGE,
        agentTotalCommission,
        listingAgentCommission,
        subAgentCommission,
        propertyOwnerAmount,
        newcondoAmount,
        serviceFee,
        serviceFeePercentage,
        refundServiceFee,
        totalDeductions,
        netPropertyOwnerAmount,
      };
    };
  }, []);

  /**
   * Get commission distribution for display
   */
  const getCommissionDistribution = useMemo(() => {
    return (options: CalculationOptions): CommissionDistribution => {
      const breakdown = calculateCommissions(options);
      const { rentAmount } = options;

      return {
        propertyOwner: {
          amount: breakdown.netPropertyOwnerAmount,
          percentage: (breakdown.netPropertyOwnerAmount / rentAmount) * 100,
        },
        listingAgent: {
          amount: breakdown.listingAgentCommission,
          percentage: (breakdown.listingAgentCommission / rentAmount) * 100,
        },
        subAgent: {
          amount: breakdown.subAgentCommission,
          percentage: (breakdown.subAgentCommission / rentAmount) * 100,
        },
        newcondo: {
          amount: breakdown.newcondoAmount,
          percentage: (breakdown.newcondoAmount / rentAmount) * 100,
        },
        serviceFee: {
          amount: breakdown.serviceFee,
          description: `Flutterwave transaction fee (${breakdown.serviceFeePercentage}%)`,
        },
      };
    };
  }, [calculateCommissions]);

  /**
   * Calculate total amount renter needs to pay (rent + service fee)
   */
  const calculateTotalPayment = (rentAmount: number, serviceFeePercentage = DEFAULT_SERVICE_FEE_PERCENTAGE): number => {
    const serviceFee = rentAmount * (serviceFeePercentage / 100);
    return rentAmount + serviceFee;
  };

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number, currency = 'NGN'): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Validate commission calculation
   */
  const validateCommissions = (breakdown: CommissionBreakdown): boolean => {
    const total =
      breakdown.netPropertyOwnerAmount +
      breakdown.listingAgentCommission +
      breakdown.subAgentCommission +
      breakdown.newcondoAmount +
      breakdown.serviceFee;

    const expected = breakdown.totalRent + breakdown.serviceFee;

    // Allow for small floating-point differences
    return Math.abs(total - expected) < 0.01;
  };

  /**
   * Get commission summary text
   */
  const getCommissionSummary = (options: CalculationOptions): string => {
    const breakdown = calculateCommissions(options);
    const parts: string[] = [];

    parts.push(`Property Owner receives: ${formatCurrency(breakdown.netPropertyOwnerAmount)}`);

    if (breakdown.listingAgentCommission > 0) {
      parts.push(`Listing Agent receives: ${formatCurrency(breakdown.listingAgentCommission)}`);
    }

    if (breakdown.subAgentCommission > 0) {
      parts.push(`Sub-Agent receives: ${formatCurrency(breakdown.subAgentCommission)}`);
    }

    parts.push(`Newcondo receives: ${formatCurrency(breakdown.newcondoAmount)}`);

    if (breakdown.serviceFee > 0) {
      parts.push(`Service Fee: ${formatCurrency(breakdown.serviceFee)}`);
    }

    return parts.join('\n');
  };

  return {
    calculateCommissions,
    getCommissionDistribution,
    calculateTotalPayment,
    formatCurrency,
    validateCommissions,
    getCommissionSummary,
    
    // Constants for reference
    PLATFORM_COMMISSION_PERCENTAGE,
    AGENT_COMMISSION_SPLIT,
    DEFAULT_SERVICE_FEE_PERCENTAGE,
  };
}

// Export types for use in components
export type { CommissionBreakdown, CommissionDistribution, CalculationOptions };