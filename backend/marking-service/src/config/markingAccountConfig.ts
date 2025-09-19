import { VirtualAccountConfig } from '../../../shared/src/types/flutterwaveVirtualAccount';

interface MarkingServiceVirtualAccountConfig {
  enabled: boolean;
  autoCreateOnAgentRegistration: boolean;
  defaultBalance: number;
  maxBalance: number;
  minBalance: number;
  paymentHoldingPeriod: number; // hours
  commissionRate: number; // percentage
  escrowSettings: {
    enabled: boolean;
    releaseAfterCompletion: boolean;
    holdPeriodHours: number;
  };
}

interface MarkingFeeStructure {
  baseMarkingFee: number;
  urgencyMultipliers: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
  paymentDistribution: {
    agentPercentage: number;
    platformPercentage: number;
  };
}

export class MarkingAccountConfig {
  private static instance: MarkingAccountConfig;

  private constructor(
    public readonly virtualAccount: MarkingServiceVirtualAccountConfig,
    public readonly feeStructure: MarkingFeeStructure
  ) {}

  public static getInstance(): MarkingAccountConfig {
    if (!MarkingAccountConfig.instance) {
      const virtualAccountConfig: MarkingServiceVirtualAccountConfig = {
        enabled: process.env.MARKING_VIRTUAL_ACCOUNTS_ENABLED === 'true',
        autoCreateOnAgentRegistration: process.env.AUTO_CREATE_MARKING_ACCOUNTS === 'true',
        defaultBalance: 0,
        maxBalance: parseFloat(process.env.MARKING_ACCOUNT_MAX_BALANCE || '500000'), // 500K NGN
        minBalance: 0,
        paymentHoldingPeriod: parseInt(process.env.MARKING_PAYMENT_HOLD_HOURS || '24'),
        commissionRate: parseFloat(process.env.MARKING_COMMISSION_RATE || '15'), // 15%
        escrowSettings: {
          enabled: process.env.MARKING_ESCROW_ENABLED === 'true',
          releaseAfterCompletion: process.env.MARKING_AUTO_RELEASE === 'true',
          holdPeriodHours: parseInt(process.env.MARKING_ESCROW_HOLD_HOURS || '72'),
        },
      };

      const feeStructure: MarkingFeeStructure = {
        baseMarkingFee: parseFloat(process.env.BASE_MARKING_FEE || '5000'), // 5K NGN
        urgencyMultipliers: {
          LOW: 0.8, // 20% discount for low priority
          NORMAL: 1.0, // Base rate
          HIGH: 1.5, // 50% premium
          URGENT: 2.0, // 100% premium
        },
        paymentDistribution: {
          agentPercentage: parseFloat(process.env.AGENT_MARKING_PERCENTAGE || '85'), // 85%
          platformPercentage: parseFloat(process.env.PLATFORM_MARKING_PERCENTAGE || '15'), // 15%
        },
      };

      MarkingAccountConfig.instance = new MarkingAccountConfig(
        virtualAccountConfig,
        feeStructure
      );
    }

    return MarkingAccountConfig.instance;
  }

  public getMarkingVirtualAccountConfig(): VirtualAccountConfig {
    return {
      bankCode: process.env.VIRTUAL_ACCOUNT_BANK_CODE || '044',
      bankName: process.env.VIRTUAL_ACCOUNT_BANK_NAME || 'Access Bank',
      currency: 'NGN',
      isPermanent: true,
      maxBalance: this.virtualAccount.maxBalance,
      minBalance: this.virtualAccount.minBalance,
      isActive: this.virtualAccount.enabled,
      allowedTransactionTypes: [
        'MARKING_PAYMENT_RECEIVED',
        'AGENT_PAYOUT',
        'PLATFORM_COMMISSION',
        'ESCROW_HOLD',
        'ESCROW_RELEASE'
      ],
    };
  }

  public calculateMarkingFee(urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'): number {
    const baseAmount = this.feeStructure.baseMarkingFee;
    const multiplier = this.feeStructure.urgencyMultipliers[urgencyLevel];
    return Math.round(baseAmount * multiplier);
  }

  public calculatePaymentDistribution(totalAmount: number): {
    agentAmount: number;
    platformAmount: number;
  } {
    const agentAmount = Math.round(totalAmount * (this.feeStructure.paymentDistribution.agentPercentage / 100));
    const platformAmount = totalAmount - agentAmount;
    
    return {
      agentAmount,
      platformAmount,
    };
  }

  public getEscrowHoldPeriod(): Date {
    const holdHours = this.virtualAccount.escrowSettings.holdPeriodHours;
    const releaseDate = new Date();
    releaseDate.setHours(releaseDate.getHours() + holdHours);
    return releaseDate;
  }

  public shouldCreateVirtualAccountForAgent(): boolean {
    return this.virtualAccount.enabled && this.virtualAccount.autoCreateOnAgentRegistration;
  }

  public isEscrowEnabled(): boolean {
    return this.virtualAccount.escrowSettings.enabled;
  }

  public shouldAutoReleaseAfterCompletion(): boolean {
    return this.virtualAccount.escrowSettings.releaseAfterCompletion;
  }

  public getMarkingAccountLimits() {
    return {
      maxDailyTransactions: parseInt(process.env.MARKING_MAX_DAILY_TRANSACTIONS || '50'),
      maxSingleTransactionAmount: parseFloat(process.env.MARKING_MAX_SINGLE_AMOUNT || '100000'), // 100K NGN
      minTransactionAmount: parseFloat(process.env.MARKING_MIN_AMOUNT || '1000'), // 1K NGN
      maxPendingJobs: parseInt(process.env.MARKING_MAX_PENDING_JOBS || '10'),
    };
  }
}

// Marking payment status tracking
export interface MarkingPaymentEscrow {
  jobId: string;
  amount: number;
  agentId: string;
  requesterId: string;
  status: 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  heldAt: Date;
  scheduledReleaseAt: Date;
  releasedAt?: Date;
  disputeReason?: string;
}

// Utility functions for marking service virtual accounts
export class MarkingAccountUtils {
  private static config = MarkingAccountConfig.getInstance();

  public static generateMarkingAccountName(agentName: string, uniqueId: string): string {
    const sanitizedName = agentName
      .replace(/[^A-Za-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    
    const suffix = uniqueId.slice(-4).toUpperCase();
    return `MRK ${sanitizedName} ${suffix}`.substring(0, 40);
  }

  public static validateMarkingTransaction(amount: number): {
    isValid: boolean;
    error?: string;
  } {
    const limits = this.config.getMarkingAccountLimits();
    
    if (amount < limits.minTransactionAmount) {
      return {
        isValid: false,
        error: `Amount must be at least NGN ${limits.minTransactionAmount.toLocaleString()}`,
      };
    }
    
    if (amount > limits.maxSingleTransactionAmount) {
      return {
        isValid: false,
        error: `Amount exceeds maximum of NGN ${limits.maxSingleTransactionAmount.toLocaleString()}`,
      };
    }
    
    return { isValid: true };
  }

  public static calculateAgentEarnings(totalMarkingFee: number): {
    grossAmount: number;
    platformCommission: number;
    netAmount: number;
  } {
    const distribution = this.config.calculatePaymentDistribution(totalMarkingFee);
    
    return {
      grossAmount: totalMarkingFee,
      platformCommission: distribution.platformAmount,
      netAmount: distribution.agentAmount,
    };
  }

  public static getPaymentHoldPeriod(): Date {
    const holdHours = this.config.virtualAccount.paymentHoldingPeriod;
    const releaseDate = new Date();
    releaseDate.setHours(releaseDate.getHours() + holdHours);
    return releaseDate;
  }
}

// Export configuration validation
export function validateMarkingAccountConfig(): void {
  const config = MarkingAccountConfig.getInstance();
  
  if (config.virtualAccount.enabled) {
    console.log('Marking Service Virtual Accounts: ENABLED');
    console.log(`Base Marking Fee: NGN ${config.feeStructure.baseMarkingFee.toLocaleString()}`);
    console.log(`Agent Commission: ${config.feeStructure.paymentDistribution.agentPercentage}%`);
    console.log(`Platform Commission: ${config.feeStructure.paymentDistribution.platformPercentage}%`);
    console.log(`Escrow System: ${config.virtualAccount.escrowSettings.enabled ? 'ENABLED' : 'DISABLED'}`);
  } else {
    console.log('Marking Service Virtual Accounts: DISABLED');
  }
}