/**
 * Commission Display Utilities
 * File: apps/platform/lib/utils/commissionDisplay.ts
 * 
 * Utilities for formatting and displaying commission breakdowns
 */

import { COMMISSION_RATES } from '../constants/commission';

export interface CommissionBreakdown {
  totalRent: number;
  platformCommission: number;
  agentCommission: number;
  listingAgentShare: number;
  subAgentShare: number;
  ownerAmount: number;
  newCondoShare: number;
}

export interface TransactionFees {
  flutterwaveCharge: number;
  platformServiceFee: number;
  totalServiceFee: number;
  refundReserve: number; // Double flutterwave charge for potential refunds
}

/**
 * Calculate commission breakdown for a rental payment
 */
export function calculateCommissionBreakdown(
  rentAmount: number,
  hasListingAgent: boolean,
  hasSubAgent: boolean
): CommissionBreakdown {
  const totalRent = rentAmount;
  
  // Platform takes 20% commission from rent
  const platformCommission = totalRent * COMMISSION_RATES.PLATFORM_RATE;
  
  // Remaining amount goes to property owner
  const ownerAmount = totalRent - platformCommission;
  
  let agentCommission = 0;
  let listingAgentShare = 0;
  let subAgentShare = 0;
  let newCondoShare = platformCommission;
  
  if (hasListingAgent) {
    // Agents get 50% of the 20% platform commission
    agentCommission = platformCommission * COMMISSION_RATES.AGENT_SHARE;
    newCondoShare = platformCommission * COMMISSION_RATES.NEWCONDO_SHARE;
    
    if (hasSubAgent) {
      // Sub-agent and listing agent split the agent commission equally
      listingAgentShare = agentCommission * COMMISSION_RATES.LISTING_AGENT_WITH_SUB;
      subAgentShare = agentCommission * COMMISSION_RATES.SUB_AGENT_SHARE;
    } else {
      // Listing agent gets full agent commission
      listingAgentShare = agentCommission;
    }
  }
  
  return {
    totalRent,
    platformCommission,
    agentCommission,
    listingAgentShare,
    subAgentShare,
    ownerAmount,
    newCondoShare,
  };
}

/**
 * Calculate transaction fees including platform service fee and refund reserve
 */
export function calculateTransactionFees(
  amount: number,
  flutterwaveChargeRate: number = 0.014 // 1.4% default Flutterwave rate
): TransactionFees {
  const flutterwaveCharge = amount * flutterwaveChargeRate;
  
  // Double the Flutterwave charge to cover potential refund costs
  const refundReserve = flutterwaveCharge * 2;
  
  // Platform service fee (non-refundable)
  const platformServiceFee = refundReserve;
  
  return {
    flutterwaveCharge,
    platformServiceFee,
    totalServiceFee: platformServiceFee,
    refundReserve,
  };
}

/**
 * Format currency amount to Nigerian Naira
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format commission breakdown for display
 */
export function formatCommissionBreakdown(
  breakdown: CommissionBreakdown
): {
  label: string;
  amount: string;
  percentage?: string;
}[] {
  const items = [
    {
      label: 'Total Rent',
      amount: formatCurrency(breakdown.totalRent),
    },
    {
      label: 'Platform Commission (20%)',
      amount: formatCurrency(breakdown.platformCommission),
      percentage: '20%',
    },
  ];
  
  if (breakdown.agentCommission > 0) {
    items.push({
      label: 'Agent Commission (50% of platform)',
      amount: formatCurrency(breakdown.agentCommission),
      percentage: '10%',
    });
    
    if (breakdown.subAgentShare > 0) {
      items.push(
        {
          label: '  └─ Listing Agent Share',
          amount: formatCurrency(breakdown.listingAgentShare),
          percentage: '5%',
        },
        {
          label: '  └─ Sub-Agent Share',
          amount: formatCurrency(breakdown.subAgentShare),
          percentage: '5%',
        }
      );
    } else {
      items.push({
        label: '  └─ Listing Agent Share',
        amount: formatCurrency(breakdown.listingAgentShare),
        percentage: '10%',
      });
    }
    
    items.push({
      label: 'NewCondo Share (50% of platform)',
      amount: formatCurrency(breakdown.newCondoShare),
      percentage: '10%',
    });
  } else {
    items.push({
      label: 'NewCondo Share (full platform)',
      amount: formatCurrency(breakdown.newCondoShare),
      percentage: '20%',
    });
  }
  
  items.push({
    label: 'Property Owner Amount',
    amount: formatCurrency(breakdown.ownerAmount),
    percentage: '80%',
  });
  
  return items;
}

/**
 * Format transaction fees for display
 */
export function formatTransactionFees(
  fees: TransactionFees
): {
  label: string;
  amount: string;
  refundable: boolean;
}[] {
  return [
    {
      label: 'Flutterwave Processing Fee',
      amount: formatCurrency(fees.flutterwaveCharge),
      refundable: false,
    },
    {
      label: 'Platform Service Fee (covers refund costs)',
      amount: formatCurrency(fees.platformServiceFee),
      refundable: false,
    },
    {
      label: 'Total Service Fees',
      amount: formatCurrency(fees.totalServiceFee),
      refundable: false,
    },
  ];
}

/**
 * Calculate total amount including fees
 */
export function calculateTotalWithFees(
  rentAmount: number,
  transactionFees: TransactionFees
): number {
  return rentAmount + transactionFees.totalServiceFee;
}

/**
 * Get commission summary text for display
 */
export function getCommissionSummaryText(
  breakdown: CommissionBreakdown,
  hasListingAgent: boolean,
  hasSubAgent: boolean
): string {
  if (!hasListingAgent) {
    return `NewCondo receives ${formatCurrency(breakdown.newCondoShare)} (20% platform commission). Property owner receives ${formatCurrency(breakdown.ownerAmount)} (80% of rent).`;
  }
  
  if (hasSubAgent) {
    return `Property owner receives ${formatCurrency(breakdown.ownerAmount)} (80%). Listing agent and sub-agent each receive ${formatCurrency(breakdown.listingAgentShare)} (5% each). NewCondo receives ${formatCurrency(breakdown.newCondoShare)} (10%).`;
  }
  
  return `Property owner receives ${formatCurrency(breakdown.ownerAmount)} (80%). Listing agent receives ${formatCurrency(breakdown.listingAgentShare)} (10%). NewCondo receives ${formatCurrency(breakdown.newCondoShare)} (10%).`;
}

/**
 * Calculate refund amount after deducting non-refundable fees
 */
export function calculateRefundAmount(
  originalAmount: number,
  transactionFees: TransactionFees
): number {
  // Only deduct the non-refundable service fee
  return originalAmount - transactionFees.totalServiceFee;
}

/**
 * Format refund breakdown
 */
export function formatRefundBreakdown(
  originalAmount: number,
  refundAmount: number,
  transactionFees: TransactionFees
): {
  label: string;
  amount: string;
}[] {
  return [
    {
      label: 'Original Payment',
      amount: formatCurrency(originalAmount),
    },
    {
      label: 'Non-refundable Service Fees',
      amount: `- ${formatCurrency(transactionFees.totalServiceFee)}`,
    },
    {
      label: 'Refund Amount',
      amount: formatCurrency(refundAmount),
    },
  ];
}

/**
 * Get percentage display
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}