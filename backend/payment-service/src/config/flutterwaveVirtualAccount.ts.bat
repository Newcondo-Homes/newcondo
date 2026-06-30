import { VirtualAccountConfig, VirtualAccountType } from '../../../shared/src/types/flutterwaveVirtualAccount';

interface FlutterwaveConfig {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  encryptionKey: string;
  webhookSecretHash: string;
}

interface VirtualAccountSettings {
  bankCode: string;
  bankName: string;
  currency: string;
  isPermanent: boolean;
  maxBalance: number;
  reconciliationSchedule: string; // cron expression
  autoCreateOnUserRegistration: boolean;
  autoCreateOnPropertyListing: boolean;
}

export class FlutterwaveVirtualAccountConfig {
  private static instance: FlutterwaveVirtualAccountConfig;
  
  private constructor(
    public readonly flutterwave: FlutterwaveConfig,
    public readonly virtualAccount: VirtualAccountSettings
  ) {}

  public static getInstance(): FlutterwaveVirtualAccountConfig {
    if (!FlutterwaveVirtualAccountConfig.instance) {
      const flutterwaveConfig: FlutterwaveConfig = {
        baseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY!,
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY!,
        encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY!,
        webhookSecretHash: process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH!,
      };

      const virtualAccountSettings: VirtualAccountSettings = {
        bankCode: process.env.VIRTUAL_ACCOUNT_BANK_CODE || '044', // Access Bank
        bankName: process.env.VIRTUAL_ACCOUNT_BANK_NAME || 'Access Bank',
        currency: 'NGN',
        isPermanent: true,
        maxBalance: parseFloat(process.env.VIRTUAL_ACCOUNT_MAX_BALANCE || '10000000'), // 10M NGN
        reconciliationSchedule: process.env.RECONCILIATION_SCHEDULE || '0 0 * * *', // Daily at midnight
        autoCreateOnUserRegistration: process.env.AUTO_CREATE_ON_REGISTRATION === 'true',
        autoCreateOnPropertyListing: process.env.AUTO_CREATE_ON_LISTING === 'true',
      };

      FlutterwaveVirtualAccountConfig.instance = new FlutterwaveVirtualAccountConfig(
        flutterwaveConfig,
        virtualAccountSettings
      );
    }

    return FlutterwaveVirtualAccountConfig.instance;
  }

  public getVirtualAccountConfig(accountType: VirtualAccountType): VirtualAccountConfig {
    const baseConfig = {
      bankCode: this.virtualAccount.bankCode,
      bankName: this.virtualAccount.bankName,
      currency: this.virtualAccount.currency,
      isPermanent: this.virtualAccount.isPermanent,
      isActive: true,
    };

    switch (accountType) {
      case 'PROPERTY_OWNER':
        return {
          ...baseConfig,
          maxBalance: this.virtualAccount.maxBalance,
          minBalance: 0,
          allowedTransactionTypes: ['RENT_PAYMENT', 'DEPOSIT', 'REFUND'],
        };
      
      case 'AGENT':
        return {
          ...baseConfig,
          maxBalance: this.virtualAccount.maxBalance * 0.5, // 50% of owner limit
          minBalance: 0,
          allowedTransactionTypes: ['COMMISSION', 'WITHDRAWAL'],
        };
      
      case 'MARKING_SERVICE':
        return {
          ...baseConfig,
          maxBalance: 500000, // 500K NGN for marking service
          minBalance: 0,
          allowedTransactionTypes: ['MARKING_PAYMENT', 'WITHDRAWAL'],
        };
      
      default:
        return baseConfig;
    }
  }

  public getFlutterwaveHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.flutterwave.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  public validateConfig(): boolean {
    const requiredEnvVars = [
      'FLUTTERWAVE_SECRET_KEY',
      'FLUTTERWAVE_PUBLIC_KEY',
      'FLUTTERWAVE_ENCRYPTION_KEY',
      'FLUTTERWAVE_WEBHOOK_SECRET_HASH',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    return true;
  }

  public getAccountNamingLimits() {
    return {
      maxNameLength: 40, // Flutterwave limit
      allowedCharacters: /^[A-Za-z0-9\s]+$/, // Alphanumeric and spaces only
      reservedPrefixes: ['NGN', 'USD', 'FLW', 'TEST'],
      maxUniqueIdLength: 6,
    };
  }
}

// Account naming utility functions
export class VirtualAccountNaming {
  private static readonly NAMING_LIMITS = FlutterwaveVirtualAccountConfig.getInstance().getAccountNamingLimits();

  public static generateAccountName(
    accountType: VirtualAccountType,
    firstName: string,
    lastName: string,
    uniqueId: string
  ): string {
    const cleanName = this.sanitizeName(`${firstName} ${lastName}`);
    const typePrefix = this.getTypePrefix(accountType);
    const suffix = uniqueId.slice(-4).toUpperCase();
    
    let accountName = `${typePrefix}${cleanName} ${suffix}`;
    
    // Ensure name fits within limits
    if (accountName.length > this.NAMING_LIMITS.maxNameLength) {
      const availableSpace = this.NAMING_LIMITS.maxNameLength - typePrefix.length - suffix.length - 1;
      const truncatedName = cleanName.substring(0, availableSpace).trim();
      accountName = `${typePrefix}${truncatedName} ${suffix}`;
    }
    
    return accountName;
  }

  private static getTypePrefix(accountType: VirtualAccountType): string {
    switch (accountType) {
      case 'PROPERTY_OWNER':
        return '';
      case 'AGENT':
        return 'AGT ';
      case 'MARKING_SERVICE':
        return 'MRK ';
      default:
        return '';
    }
  }

  private static sanitizeName(name: string): string {
    return name
      .replace(/[^A-Za-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .toUpperCase();
  }

  public static validateAccountName(name: string): boolean {
    if (name.length > this.NAMING_LIMITS.maxNameLength) {
      return false;
    }
    
    if (!this.NAMING_LIMITS.allowedCharacters.test(name)) {
      return false;
    }
    
    // Check for reserved prefixes
    const upperName = name.toUpperCase();
    for (const prefix of this.NAMING_LIMITS.reservedPrefixes) {
      if (upperName.startsWith(prefix)) {
        return false;
      }
    }
    
    return true;
  }
}

// Environment validation for virtual accounts
export function validateVirtualAccountEnvironment(): void {
  const config = FlutterwaveVirtualAccountConfig.getInstance();
  config.validateConfig();
  
  console.log('Virtual Account Configuration validated successfully');
  console.log(`Bank: ${config.virtualAccount.bankName} (${config.virtualAccount.bankCode})`);
  console.log(`Currency: ${config.virtualAccount.currency}`);
  console.log(`Max Balance: ${config.virtualAccount.maxBalance.toLocaleString()}`);
}