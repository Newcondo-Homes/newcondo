// backend/payment-service/src/services/virtualAccountService.ts

import { PrismaClient } from '@newcondo/db';
import { Response } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

export interface VirtualAccountData {
  userId: string;
  propertyId?: string;
  accountName: string;
  currency?: string;
}

export interface FlutterwaveVirtualAccountResponse {
  status: string;
  message: string;
  data: {
    account_number: string;
    bank_code: string;
    account_reference: string;
    flw_ref: string;
    order_ref: string;
    created_at: string;
  };
}

export interface VirtualAccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
}

class VirtualAccountService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a virtual account for a user/property
   */
  async createVirtualAccount(data: VirtualAccountData): Promise<Response> {
    try {
      // Check if user already has a virtual account for this property
      const existingAccount = await this.prisma.virtualAccount.findFirst({
        where: {
          userId: data.userId,
          propertyId: data.propertyId || null,
        },
      });

      if (existingAccount) {
        return Response.error('Virtual account already exists for this user/property');
      }

      // Generate unique account reference
      const accountReference = `NEWCONDO_${data.userId}_${Date.now()}`;

      // Call Flutterwave API to create virtual account
      const flutterwaveResponse = await this.createFlutterwaveVirtualAccount({
        email: await this.getUserEmail(data.userId),
        bvn: await this.getUserBVN(data.userId),
        tx_ref: accountReference,
        firstname: data.accountName.split(' ')[0],
        lastname: data.accountName.split(' ').slice(1).join(' ') || 'User',
        narration: data.propertyId ? `Property Payment - ${data.propertyId}` : 'Rental Payment',
      });

      if (flutterwaveResponse.status !== 'success') {
        logger.error('Flutterwave virtual account creation failed:', flutterwaveResponse);
        return Response.error('Failed to create virtual account with payment provider');
      }

      // Save virtual account to database
      const virtualAccount = await this.prisma.virtualAccount.create({
        data: {
          accountNumber: flutterwaveResponse.data.account_number,
          accountName: data.accountName,
          bankCode: flutterwaveResponse.data.bank_code,
          userId: data.userId,
          propertyId: data.propertyId,
          currency: data.currency || 'NGN',
          flutterwaveAccountId: flutterwaveResponse.data.account_reference,
          isActive: true,
          balance: 0,
        },
      });

      logger.info(`Virtual account created for user ${data.userId}:`, {
        accountId: virtualAccount.id,
        accountNumber: virtualAccount.accountNumber,
      });

      return Response.success(virtualAccount, 'Virtual account created successfully');
    } catch (error) {
      logger.error('Error creating virtual account:', error);
      return Response.error('Failed to create virtual account');
    }
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(accountId: string): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      return Response.success(account);
    } catch (error) {
      logger.error('Error fetching virtual account:', error);
      return Response.error('Failed to fetch virtual account');
    }
  }

  /**
   * Get virtual accounts for a user
   */
  async getUserVirtualAccounts(userId: string): Promise<Response> {
    try {
      const accounts = await this.prisma.virtualAccount.findMany({
        where: { userId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Response.success(accounts);
    } catch (error) {
      logger.error('Error fetching user virtual accounts:', error);
      return Response.error('Failed to fetch virtual accounts');
    }
  }

  /**
   * Get virtual account by account number
   */
  async getVirtualAccountByNumber(accountNumber: string): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { accountNumber },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      if (!account.isActive) {
        return Response.error('Virtual account is inactive');
      }

      return Response.success(account);
    } catch (error) {
      logger.error('Error fetching virtual account by number:', error);
      return Response.error('Failed to fetch virtual account');
    }
  }

  /**
   * Update virtual account balance
   */
  async updateAccountBalance(accountId: string, amount: number, operation: 'add' | 'subtract'): Promise<Response> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return Response.error('Virtual account not found');
      }

      const currentBalance = parseFloat(account.balance.toString());
      let newBalance: number;

      if (operation === 'add') {
        newBalance = currentBalance + amount;
      } else {
        newBalance = currentBalance - amount;
        if (newBalance < 0) {
          return Response.error('Insufficient balance');
        }
      }

      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { balance: newBalance },
      });

      logger.info(`Virtual account balance updated:`, {
        accountId,
        operation,
        amount,
        oldBalance: currentBalance,
        newBalance,
      });

      return Response.success({
        accountId,
        previousBalance: currentBalance,
        newBalance,
        operation,
        amount,
      });
    } catch (error) {
      logger.error('Error updating account balance:', error);
      return Response.error('Failed to update account balance');
    }
  }

  /**
   * Deactivate virtual account
   */
  async deactivateVirtualAccount(accountId: string): Promise<Response> {
    try {
      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { isActive: false },
      });

      logger.info(`Virtual account deactivated: ${accountId}`);

      return Response.success(updatedAccount, 'Virtual account deactivated successfully');
    } catch (error) {
      logger.error('Error deactivating virtual account:', error);
      return Response.error('Failed to deactivate virtual account');
    }
  }

  /**
   * Get account balance from Flutterwave
   */
  async getFlutterwaveBalance(accountId: string): Promise<Response<VirtualAccountBalance>> {
    try {
      const account = await this.prisma.virtualAccount.findUnique({
        where: { id: accountId },
      });

      if (!account || !account.flutterwaveAccountId) {
        return Response.error('Virtual account not found');
      }

      // Call Flutterwave API to get balance
      const balanceResponse = await this.fetchFlutterwaveBalance(account.flutterwaveAccountId);

      if (balanceResponse.status !== 'success') {
        return Response.error('Failed to fetch balance from payment provider');
      }

      const balance: VirtualAccountBalance = {
        accountId,
        balance: balanceResponse.data.balance,
        currency: account.currency,
        availableBalance: balanceResponse.data.available_balance,
        ledgerBalance: balanceResponse.data.ledger_balance,
      };

      // Sync local balance with Flutterwave balance
      await this.prisma.virtualAccount.update({
        where: { id: accountId },
        data: { balance: balanceResponse.data.balance },
      });

      return Response.success(balance);
    } catch (error) {
      logger.error('Error fetching Flutterwave balance:', error);
      return Response.error('Failed to fetch account balance');
    }
  }

  /**
   * Transfer funds between virtual accounts (internal transfer)
   */
  async internalTransfer(fromAccountId: string, toAccountId: string, amount: number, description?: string): Promise<Response> {
    try {
      // Start transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Check source account
        const fromAccount = await tx.virtualAccount.findUnique({
          where: { id: fromAccountId },
        });

        if (!fromAccount || !fromAccount.isActive) {
          throw new Error('Source account not found or inactive');
        }

        // Check destination account
        const toAccount = await tx.virtualAccount.findUnique({
          where: { id: toAccountId },
        });

        if (!toAccount || !toAccount.isActive) {
          throw new Error('Destination account not found or inactive');
        }

        const fromBalance = parseFloat(fromAccount.balance.toString());
        if (fromBalance < amount) {
          throw new Error('Insufficient balance');
        }

        // Update balances
        await tx.virtualAccount.update({
          where: { id: fromAccountId },
          data: { balance: fromBalance - amount },
        });

        const toBalance = parseFloat(toAccount.balance.toString());
        await tx.virtualAccount.update({
          where: { id: toAccountId },
          data: { balance: toBalance + amount },
        });

        return { fromAccount, toAccount, amount };
      });

      logger.info('Internal transfer completed:', {
        from: fromAccountId,
        to: toAccountId,
        amount,
        description,
      });

      return Response.success({
        transferId: `TXN_${Date.now()}`,
        fromAccountId,
        toAccountId,
        amount,
        description,
        completedAt: new Date(),
      }, 'Transfer completed successfully');
    } catch (error) {
      logger.error('Error processing internal transfer:', error);
      return Response.error(error instanceof Error ? error.message : 'Transfer failed');
    }
  }

  // Private helper methods

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  }

  private async getUserBVN(userId: string): Promise<string> {
    const document = await this.prisma.document.findFirst({
      where: {
        userId,
        documentType: 'BVN',
        status: 'APPROVED',
      },
      select: { documentNumber: true },
    });
    return document?.documentNumber || '';
  }

  private async createFlutterwaveVirtualAccount(data: {
    email: string;
    bvn: string;
    tx_ref: string;
    firstname: string;
    lastname: string;
    narration: string;
  }): Promise<FlutterwaveVirtualAccountResponse> {
    // Mock implementation - replace with actual Flutterwave API call
    return {
      status: 'success',
      message: 'Virtual account created successfully',
      data: {
        account_number: `220${Math.random().toString().substring(2, 10)}`,
        bank_code: '044',
        account_reference: data.tx_ref,
        flw_ref: `FLW_${Date.now()}`,
        order_ref: data.tx_ref,
        created_at: new Date().toISOString(),
      },
    };
  }

  private async fetchFlutterwaveBalance(accountReference: string): Promise<any> {
    // Mock implementation - replace with actual Flutterwave API call
    return {
      status: 'success',
      data: {
        balance: Math.random() * 1000,
        available_balance: Math.random() * 1000,
        ledger_balance: Math.random() * 1000,
      },
    };
  }
}

export default VirtualAccountService;




// import { PrismaClient, VirtualAccount } from '@newcondo/db';
// import { Decimal } from 'decimal.js';
// import { standardResponse } from '../../../shared/src/utils/response';
// import type { ApiResponse } from '../../../shared/src/types/api';

// export interface CreateVirtualAccountData {
//   userId: string;
//   propertyId?: string;
//   accountName?: string;
// }

// export interface VirtualAccountBalance {
//   accountId: string;
//   balance: Decimal;
//   currency: string;
//   lastUpdated: Date;
// }

// export interface TransferFunds {
//   fromAccountId: string;
//   toAccountId: string;
//   amount: number;
//   description?: string;
// }

// export interface AccountTransaction {
//   id: string;
//   type: 'CREDIT' | 'DEBIT';
//   amount: Decimal;
//   description: string;
//   timestamp: Date;
//   reference: string;
// }

// export class VirtualAccountService {
//   private prisma: PrismaClient;

//   constructor() {
//     this.prisma = new PrismaClient();
//   }

//   /**
//    * Create virtual account for user or property
//    */
//   async createVirtualAccount(data: CreateVirtualAccountData): Promise<ApiResponse<VirtualAccount>> {
//     try {
//       const { userId, propertyId, accountName } = data;

//       // Validate user exists
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId }
//       });

//       if (!user) {
//         return standardResponse(false, 'User not found', null, 404);
//       }

//       // If property account, validate property exists and belongs to user
//       if (propertyId) {
//         const property = await this.prisma.property.findUnique({
//           where: { id: propertyId }
//         });

//         if (!property) {
//           return standardResponse(false, 'Property not found', null, 404);
//         }

//         if (property.ownerId !== userId) {
//           return standardResponse(false, 'Property does not belong to user', null, 403);
//         }

//         // Check if property already has virtual account
//         const existingAccount = await this.prisma.virtualAccount.findUnique({
//           where: { propertyId }
//         });

//         if (existingAccount) {
//           return standardResponse(false, 'Property already has a virtual account', null, 400);
//         }
//       }

//       // Generate unique account number (10 digits)
//       const accountNumber = await this.generateUniqueAccountNumber();
      
//       // Generate account name
//       const finalAccountName = accountName || 
//         (propertyId ? `${user.name || 'User'} - Property Account` : `${user.name || 'User'} - Main Account`);

//       // Create virtual account
//       const virtualAccount = await this.prisma.virtualAccount.create({
//         data: {
//           accountNumber,
//           accountName: finalAccountName,
//           bankCode: '000', // Default bank code for virtual accounts
//           userId,
//           propertyId,
//           balance: new Decimal(0),
//           currency: 'NGN',
//           isActive: true
//         }
//       });

//       return standardResponse(true, 'Virtual account created successfully', virtualAccount);

//     } catch (error) {
//       console.error('Error creating virtual account:', error);
//       return standardResponse(false, 'Failed to create virtual account', null, 500);
//     }
//   }

//   /**
//    * Get virtual account by ID
//    */
//   async getVirtualAccount(accountId: string): Promise<ApiResponse<VirtualAccount | null>> {
//     try {
//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true
//             }
//           },
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true
//             }
//           }
//         }
//       });

//       return standardResponse(true, 'Virtual account retrieved successfully', account);

//     } catch (error) {
//       console.error('Error getting virtual account:', error);
//       return standardResponse(false, 'Failed to get virtual account', null, 500);
//     }
//   }

//   /**
//    * Get user's virtual accounts
//    */
//   async getUserVirtualAccounts(userId: string): Promise<ApiResponse<VirtualAccount[]>> {
//     try {
//       const accounts = await this.prisma.virtualAccount.findMany({
//         where: { 
//           userId,
//           isActive: true
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       });

//       return standardResponse(true, 'User virtual accounts retrieved successfully', accounts);

//     } catch (error) {
//       console.error('Error getting user virtual accounts:', error);
//       return standardResponse(false, 'Failed to get user virtual accounts', null, 500);
//     }
//   }

//   /**
//    * Get virtual account balance
//    */
//   async getAccountBalance(accountId: string): Promise<ApiResponse<VirtualAccountBalance>> {
//     try {
//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId }
//       });

//       if (!account) {
//         return standardResponse(false, 'Virtual account not found', null, 404);
//       }

//       const balance: VirtualAccountBalance = {
//         accountId: account.id,
//         balance: account.balance,
//         currency: account.currency,
//         lastUpdated: account.updatedAt
//       };

//       return standardResponse(true, 'Account balance retrieved successfully', balance);

//     } catch (error) {
//       console.error('Error getting account balance:', error);
//       return standardResponse(false, 'Failed to get account balance', null, 500);
//     }
//   }

//   /**
//    * Credit virtual account
//    */
//   async creditAccount(
//     accountId: string, 
//     amount: number, 
//     description: string,
//     reference?: string
//   ): Promise<ApiResponse<VirtualAccount>> {
//     try {
//       if (amount <= 0) {
//         return standardResponse(false, 'Credit amount must be greater than zero', null, 400);
//       }

//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId }
//       });

//       if (!account) {
//         return standardResponse(false, 'Virtual account not found', null, 404);
//       }

//       if (!account.isActive) {
//         return standardResponse(false, 'Virtual account is inactive', null, 400);
//       }

//       // Credit account
//       const updatedAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: {
//           balance: {
//             increment: new Decimal(amount)
//           }
//         }
//       });

//       // Log transaction (you might want to create a separate transaction log table)
//       console.log(`CREDIT: Account ${accountId}, Amount: ${amount}, Description: ${description}, Reference: ${reference}`);

//       return standardResponse(true, 'Account credited successfully', updatedAccount);

//     } catch (error) {
//       console.error('Error crediting account:', error);
//       return standardResponse(false, 'Failed to credit account', null, 500);
//     }
//   }

//   /**
//    * Debit virtual account
//    */
//   async debitAccount(
//     accountId: string, 
//     amount: number, 
//     description: string,
//     reference?: string
//   ): Promise<ApiResponse<VirtualAccount>> {
//     try {
//       if (amount <= 0) {
//         return standardResponse(false, 'Debit amount must be greater than zero', null, 400);
//       }

//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId }
//       });

//       if (!account) {
//         return standardResponse(false, 'Virtual account not found', null, 404);
//       }

//       if (!account.isActive) {
//         return standardResponse(false, 'Virtual account is inactive', null, 400);
//       }

//       // Check sufficient balance
//       if (account.balance.lt(new Decimal(amount))) {
//         return standardResponse(false, 'Insufficient account balance', null, 400);
//       }

//       // Debit account
//       const updatedAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: {
//           balance: {
//             decrement: new Decimal(amount)
//           }
//         }
//       });

//       // Log transaction
//       console.log(`DEBIT: Account ${accountId}, Amount: ${amount}, Description: ${description}, Reference: ${reference}`);

//       return standardResponse(true, 'Account debited successfully', updatedAccount);

//     } catch (error) {
//       console.error('Error debiting account:', error);
//       return standardResponse(false, 'Failed to debit account', null, 500);
//     }
//   }

//   /**
//    * Transfer funds between virtual accounts
//    */
//   async transferFunds(data: TransferFunds): Promise<ApiResponse<boolean>> {
//     try {
//       const { fromAccountId, toAccountId, amount, description } = data;

//       if (amount <= 0) {
//         return standardResponse(false, 'Transfer amount must be greater than zero', null, 400);
//       }

//       if (fromAccountId === toAccountId) {
//         return standardResponse(false, 'Cannot transfer to the same account', null, 400);
//       }

//       // Get both accounts
//       const [fromAccount, toAccount] = await Promise.all([
//         this.prisma.virtualAccount.findUnique({ where: { id: fromAccountId } }),
//         this.prisma.virtualAccount.findUnique({ where: { id: toAccountId } })
//       ]);

//       if (!fromAccount) {
//         return standardResponse(false, 'Source account not found', null, 404);
//       }

//       if (!toAccount) {
//         return standardResponse(false, 'Destination account not found', null, 404);
//       }

//       if (!fromAccount.isActive || !toAccount.isActive) {
//         return standardResponse(false, 'One or both accounts are inactive', null, 400);
//       }

//       // Check sufficient balance
//       if (fromAccount.balance.lt(new Decimal(amount))) {
//         return standardResponse(false, 'Insufficient balance in source account', null, 400);
//       }

//       // Perform transfer in transaction
//       await this.prisma.$transaction(async (tx) => {
//         // Debit from source account
//         await tx.virtualAccount.update({
//           where: { id: fromAccountId },
//           data: {
//             balance: {
//               decrement: new Decimal(amount)
//             }
//           }
//         });

//         // Credit to destination account
//         await tx.virtualAccount.update({
//           where: { id: toAccountId },
//           data: {
//             balance: {
//               increment: new Decimal(amount)
//             }
//           }
//         });
//       });

//       // Log transfer
//       const transferRef = `TRF-${Date.now()}`;
//       console.log(`TRANSFER: From ${fromAccountId} to ${toAccountId}, Amount: ${amount}, Description: ${description}, Reference: ${transferRef}`);

//       return standardResponse(true, 'Funds transferred successfully', true);

//     } catch (error) {
//       console.error('Error transferring funds:', error);
//       return standardResponse(false, 'Failed to transfer funds', null, 500);
//     }
//   }

//   /**
//    * Freeze/Unfreeze virtual account
//    */
//   async toggleAccountStatus(accountId: string, isActive: boolean): Promise<ApiResponse<VirtualAccount>> {
//     try {
//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId }
//       });

//       if (!account) {
//         return standardResponse(false, 'Virtual account not found', null, 404);
//       }

//       const updatedAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: { isActive }
//       });

//       const action = isActive ? 'activated' : 'deactivated';
//       return standardResponse(true, `Virtual account ${action} successfully`, updatedAccount);

//     } catch (error) {
//       console.error('Error toggling account status:', error);
//       return standardResponse(false, 'Failed to update account status', null, 500);
//     }
//   }

//   /**
//    * Get virtual account by account number
//    */
//   async getAccountByNumber(accountNumber: string): Promise<ApiResponse<VirtualAccount | null>> {
//     try {
//       const account = await this.prisma.virtualAccount.findUnique({
//         where: { accountNumber },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true
//             }
//           },
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true
//             }
//           }
//         }
//       });

//       return standardResponse(true, 'Virtual account retrieved successfully', account);

//     } catch (error) {
//       console.error('Error getting account by number:', error);
//       return standardResponse(false, 'Failed to get virtual account', null, 500);
//     }
//   }

//   /**
//    * Process bulk account operations (for admin use)
//    */
//   async bulkAccountOperation(
//     accountIds: string[], 
//     operation: 'activate' | 'deactivate' | 'freeze'
//   ): Promise<ApiResponse<number>> {
//     try {
//       const isActive = operation === 'activate';
      
//       const result = await this.prisma.virtualAccount.updateMany({
//         where: {
//           id: {
//             in: accountIds
//           }
//         },
//         data: {
//           isActive
//         }
//       });

//       return standardResponse(true, `Bulk ${operation} completed successfully`, result.count);

//     } catch (error) {
//       console.error('Error in bulk account operation:', error);
//       return standardResponse(false, `Failed to perform bulk ${operation}`, null, 500);
//     }
//   }

//   /**
//    * Generate unique account number
//    */
//   private async generateUniqueAccountNumber(): Promise<string> {
//     let accountNumber: string;
//     let exists = true;

//     while (exists) {
//       // Generate 10-digit number
//       accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
//       // Check if it exists
//       const existing = await this.prisma.virtualAccount.findUnique({
//         where: { accountNumber }
//       });
      
//       exists = !!existing;
//     }

//     return accountNumber!;
//   }

//   /**
//    * Cleanup method
//    */
//   async disconnect(): Promise<void> {
//     await this.prisma.$disconnect();
//   }
// }


// backend/payment-service/src/services/virtualAccountService.ts

// import { PrismaClient, VirtualAccount } from '@newcondo/db';
// import { FlutterwaveVirtualAccountService } from './flutterwaveVirtualAccountService';
// import { VirtualAccountCreationData, VirtualAccountWithUser } from '../types/virtualAccount';

// export class VirtualAccountService {
//   private prisma: PrismaClient;
//   private flutterwaveService: FlutterwaveVirtualAccountService;

//   constructor() {
//     this.prisma = new PrismaClient();
//     this.flutterwaveService = new FlutterwaveVirtualAccountService();
//   }

//   /**
//    * Create virtual account for property owner
//    */
//   async createOwnerVirtualAccount(userId: string, propertyId?: string): Promise<VirtualAccount> {
//     try {
//       // Check if user already has a virtual account for this property
//       if (propertyId) {
//         const existingAccount = await this.prisma.virtualAccount.findFirst({
//           where: {
//             userId,
//             propertyId,
//             isActive: true
//           }
//         });

//         if (existingAccount) {
//           throw new Error('Virtual account already exists for this property');
//         }
//       }

//       // Get user details
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           phone: true,
//           role: true
//         }
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       // Get property details if propertyId is provided
//       let property = null;
//       if (propertyId) {
//         property = await this.prisma.property.findFirst({
//           where: {
//             id: propertyId,
//             ownerId: userId
//           },
//           select: {
//             id: true,
//             title: true,
//             address: true
//           }
//         });

//         if (!property) {
//           throw new Error('Property not found or not owned by user');
//         }
//       }

//       // Generate account name
//       const accountName = this.generateAccountName(user.name || user.email, 'OWNER', propertyId);
      
//       // Create virtual account with Flutterwave
//       const flutterwaveAccount = await this.flutterwaveService.createVirtualAccount({
//         email: user.email,
//         phoneNumber: user.phone,
//         firstName: user.name?.split(' ')[0] || 'Property',
//         lastName: user.name?.split(' ')[1] || 'Owner',
//         txRef: `VA_${userId}_${propertyId || 'GENERAL'}_${Date.now()}`,
//         accountName: accountName,
//         isPermanent: true
//       });

//       // Save to database
//       const virtualAccount = await this.prisma.virtualAccount.create({
//         data: {
//           accountNumber: flutterwaveAccount.accountNumber,
//           accountName: accountName,
//           bankCode: flutterwaveAccount.bankCode,
//           userId,
//           propertyId,
//           balance: 0,
//           currency: 'NGN',
//           isActive: true,
//           flutterwaveAccountId: flutterwaveAccount.accountId
//         }
//       });

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error creating owner virtual account:', error);
//       throw new Error(`Failed to create virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * Create virtual account for agent
//    */
//   async createAgentVirtualAccount(userId: string): Promise<VirtualAccount> {
//     try {
//       // Check if agent already has a virtual account
//       const existingAccount = await this.prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           propertyId: null, // Agent accounts don't have propertyId
//           isActive: true
//         }
//       });

//       if (existingAccount) {
//         throw new Error('Agent virtual account already exists');
//       }

//       // Get user details and verify agent role
//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           phone: true,
//           role: true
//         }
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       if (user.role !== 'AGENT') {
//         throw new Error('Only agents can create agent virtual accounts');
//       }

//       // Generate account name
//       const accountName = this.generateAccountName(user.name || user.email, 'AGENT');
      
//       // Create virtual account with Flutterwave
//       const flutterwaveAccount = await this.flutterwaveService.createVirtualAccount({
//         email: user.email,
//         phoneNumber: user.phone,
//         firstName: user.name?.split(' ')[0] || 'Agent',
//         lastName: user.name?.split(' ')[1] || 'Account',
//         txRef: `VA_AGENT_${userId}_${Date.now()}`,
//         accountName: accountName,
//         isPermanent: true
//       });

//       // Save to database
//       const virtualAccount = await this.prisma.virtualAccount.create({
//         data: {
//           accountNumber: flutterwaveAccount.accountNumber,
//           accountName: accountName,
//           bankCode: flutterwaveAccount.bankCode,
//           userId,
//           propertyId: null, // Agent accounts are not tied to specific properties
//           balance: 0,
//           currency: 'NGN',
//           isActive: true,
//           flutterwaveAccountId: flutterwaveAccount.accountId
//         }
//       });

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error creating agent virtual account:', error);
//       throw new Error(`Failed to create agent virtual account: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * Get virtual account by ID
//    */
//   async getVirtualAccountById(accountId: string): Promise<VirtualAccountWithUser | null> {
//     try {
//       const virtualAccount = await this.prisma.virtualAccount.findUnique({
//         where: { id: accountId },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true
//             }
//           },
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true
//             }
//           }
//         }
//       });

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error getting virtual account:', error);
//       throw new Error('Failed to get virtual account');
//     }
//   }

//   /**
//    * Get user's virtual accounts
//    */
//   async getUserVirtualAccounts(userId: string, propertyId?: string): Promise<VirtualAccountWithUser[]> {
//     try {
//       const whereClause: any = {
//         userId,
//         isActive: true
//       };

//       if (propertyId) {
//         whereClause.propertyId = propertyId;
//       }

//       const virtualAccounts = await this.prisma.virtualAccount.findMany({
//         where: whereClause,
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true
//             }
//           },
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true
//             }
//           }
//         },
//         orderBy: {
//           createdAt: 'desc'
//         }
//       });

//       return virtualAccounts;
//     } catch (error) {
//       console.error('Error getting user virtual accounts:', error);
//       throw new Error('Failed to get user virtual accounts');
//     }
//   }

//   /**
//    * Update account balance
//    */
//   async updateAccountBalance(accountId: string, newBalance: number): Promise<VirtualAccount> {
//     try {
//       const virtualAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: {
//           balance: newBalance,
//           updatedAt: new Date()
//         }
//       });

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error updating account balance:', error);
//       throw new Error('Failed to update account balance');
//     }
//   }

//   /**
//    * Deactivate virtual account
//    */
//   async deactivateVirtualAccount(accountId: string): Promise<VirtualAccount> {
//     try {
//       const virtualAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: {
//           isActive: false,
//           updatedAt: new Date()
//         }
//       });

//       // Also deactivate on Flutterwave side if needed
//       if (virtualAccount.flutterwaveAccountId) {
//         await this.flutterwaveService.deactivateVirtualAccount(virtualAccount.flutterwaveAccountId);
//       }

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error deactivating virtual account:', error);
//       throw new Error('Failed to deactivate virtual account');
//     }
//   }

//   /**
//    * Reactivate virtual account
//    */
//   async reactivateVirtualAccount(accountId: string): Promise<VirtualAccount> {
//     try {
//       const virtualAccount = await this.prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: {
//           isActive: true,
//           updatedAt: new Date()
//         }
//       });

//       // Also reactivate on Flutterwave side if needed
//       if (virtualAccount.flutterwaveAccountId) {
//         await this.flutterwaveService.reactivateVirtualAccount(virtualAccount.flutterwaveAccountId);
//       }

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error reactivating virtual account:', error);
//       throw new Error('Failed to reactivate virtual account');
//     }
//   }

//   /**
//    * Process virtual account credit from webhook
//    */
//   async processVirtualAccountCredit(webhookData: any): Promise<void> {
//     try {
//       const { account_id, amount, currency, tx_ref, status } = webhookData;

//       if (status !== 'successful') {
//         console.log('Non-successful transaction, skipping:', tx_ref);
//         return;
//       }

//       // Find virtual account by Flutterwave account ID
//       const virtualAccount = await this.prisma.virtualAccount.findFirst({
//         where: {
//           flutterwaveAccountId: account_id
//         }
//       });

//       if (!virtualAccount) {
//         console.error('Virtual account not found for Flutterwave account ID:', account_id);
//         return;
//       }

//       // Update balance
//       const newBalance = virtualAccount.balance.toNumber() + parseFloat(amount);
//       await this.updateAccountBalance(virtualAccount.id, newBalance);

//       // Log the transaction (you might want to create a transaction log table)
//       console.log(`Virtual account ${virtualAccount.id} credited with ${amount} ${currency}`);

//       // Trigger any additional processing (notifications, etc.)
//       // await this.notificationService.sendCreditNotification(virtualAccount.userId, amount, currency);
//     } catch (error) {
//       console.error('Error processing virtual account credit:', error);
//       throw error;
//     }
//   }

//   /**
//    * Generate unique account name
//    */
//   private generateAccountName(userName: string, accountType: 'OWNER' | 'AGENT', propertyId?: string): string {
//     try {
//       // Clean the user name
//       const cleanName = userName
//         .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
//         .replace(/\s+/g, ' ') // Replace multiple spaces with single space
//         .trim()
//         .substring(0, 20); // Limit to 20 characters

//       // Generate unique suffix
//       const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
//       const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random characters

//       let accountName = '';
      
//       if (accountType === 'AGENT') {
//         accountName = `${cleanName} AGT ${random}${timestamp}`;
//       } else {
//         const suffix = propertyId ? propertyId.substring(0, 4).toUpperCase() : 'GEN';
//         accountName = `${cleanName} ${suffix} ${random}${timestamp}`;
//       }

//       // Ensure account name doesn't exceed bank limits (usually 40-50 characters)
//       return accountName.substring(0, 40);
//     } catch (error) {
//       // Fallback account name
//       const fallbackSuffix = Date.now().toString().slice(-8);
//       return `NEWCONDO ${accountType} ${fallbackSuffix}`;
//     }
//   }

//   /**
//    * Get virtual accounts by property ID (for property owners)
//    */
//   async getVirtualAccountsByProperty(propertyId: string): Promise<VirtualAccount[]> {
//     try {
//       const virtualAccounts = await this.prisma.virtualAccount.findMany({
//         where: {
//           propertyId,
//           isActive: true
//         },
//         orderBy: {
//           createdAt: 'desc'
//         }
//       });

//       return virtualAccounts;
//     } catch (error) {
//       console.error('Error getting virtual accounts by property:', error);
//       throw new Error('Failed to get virtual accounts by property');
//     }
//   }

//   /**
//    * Get virtual account statistics for admin
//    */
//   async getVirtualAccountStats(): Promise<{
//     totalAccounts: number;
//     activeAccounts: number;
//     totalBalance: number;
//     ownerAccounts: number;
//     agentAccounts: number;
//   }> {
//     try {
//       const [
//         totalAccounts,
//         activeAccounts,
//         balanceSum,
//         ownerAccounts,
//         agentAccounts
//       ] = await Promise.all([
//         this.prisma.virtualAccount.count(),
//         this.prisma.virtualAccount.count({ where: { isActive: true } }),
//         this.prisma.virtualAccount.aggregate({
//           _sum: { balance: true },
//           where: { isActive: true }
//         }),
//         this.prisma.virtualAccount.count({
//           where: {
//             isActive: true,
//             propertyId: { not: null }
//           }
//         }),
//         this.prisma.virtualAccount.count({
//           where: {
//             isActive: true,
//             propertyId: null
//           }
//         })
//       ]);

//       return {
//         totalAccounts,
//         activeAccounts,
//         totalBalance: balanceSum._sum.balance?.toNumber() || 0,
//         ownerAccounts,
//         agentAccounts
//       };
//     } catch (error) {
//       console.error('Error getting virtual account stats:', error);
//       throw new Error('Failed to get virtual account statistics');
//     }
//   }
// }



// import { PrismaClient, VirtualAccount } from '@prisma/client';
// import { Decimal } from '@prisma/client/runtime/library';

// const prisma = new PrismaClient();

// interface TransferRequest {
//   fromAccountId: string;
//   toAccountId: string;
//   amount: Decimal;
//   description?: string;
// }

// interface WithdrawalRequest {
//   virtualAccountId: string;
//   amount: Decimal;
//   bankAccountNumber: string;
//   bankCode: string;
//   accountName: string;
// }

// export class VirtualAccountService {
//   /**
//    * Create virtual account for a user
//    */
//   async createVirtualAccount(
//     userId: string,
//     accountName: string
//   ): Promise<VirtualAccount> {
//     // Check if user already has a virtual account
//     const existing = await prisma.virtualAccount.findFirst({
//       where: { userId },
//     });

//     if (existing) {
//       throw new Error('User already has a virtual account');
//     }

//     // Generate account number (in production, this would come from Flutterwave)
//     const accountNumber = this.generateAccountNumber();

//     const virtualAccount = await prisma.virtualAccount.create({
//       data: {
//         userId,
//         accountName,
//         accountNumber,
//         bankCode: '000', // Flutterwave bank code
//         balance: new Decimal(0),
//         currency: 'NGN',
//         isActive: true,
//       },
//     });

//     return virtualAccount;
//   }

//   /**
//    * Create virtual account for a property
//    */
//   async createPropertyVirtualAccount(
//     propertyId: string,
//     ownerId: string,
//     accountName: string
//   ): Promise<VirtualAccount> {
//     // Check if property already has a virtual account
//     const existing = await prisma.virtualAccount.findFirst({
//       where: { propertyId },
//     });

//     if (existing) {
//       throw new Error('Property already has a virtual account');
//     }

//     const accountNumber = this.generateAccountNumber();

//     const virtualAccount = await prisma.virtualAccount.create({
//       data: {
//         userId: ownerId,
//         propertyId,
//         accountName,
//         accountNumber,
//         bankCode: '000',
//         balance: new Decimal(0),
//         currency: 'NGN',
//         isActive: true,
//       },
//     });

//     return virtualAccount;
//   }

//   /**
//    * Get virtual account balance
//    */
//   async getBalance(accountId: string): Promise<Decimal> {
//     const account = await prisma.virtualAccount.findUnique({
//       where: { id: accountId },
//     });

//     if (!account) {
//       throw new Error('Virtual account not found');
//     }

//     return account.balance;
//   }

//   /**
//    * Get user's virtual accounts
//    */
//   async getUserVirtualAccounts(userId: string): Promise<VirtualAccount[]> {
//     return prisma.virtualAccount.findMany({
//       where: { userId },
//       include: {
//         property: true,
//       },
//     });
//   }

//   /**
//    * Credit virtual account
//    */
//   async creditAccount(
//     accountId: string,
//     amount: Decimal,
//     description?: string
//   ): Promise<VirtualAccount> {
//     const account = await prisma.virtualAccount.findUnique({
//       where: { id: accountId },
//     });

//     if (!account) {
//       throw new Error('Virtual account not found');
//     }

//     if (!account.isActive) {
//       throw new Error('Virtual account is not active');
//     }

//     const updatedAccount = await prisma.virtualAccount.update({
//       where: { id: accountId },
//       data: {
//         balance: {
//           increment: amount,
//         },
//       },
//     });

//     // Log transaction
//     await this.logTransaction({
//       accountId,
//       type: 'CREDIT',
//       amount,
//       description,
//       balanceAfter: updatedAccount.balance,
//     });

//     return updatedAccount;
//   }

//   /**
//    * Debit virtual account
//    */
//   async debitAccount(
//     accountId: string,
//     amount: Decimal,
//     description?: string
//   ): Promise<VirtualAccount> {
//     const account = await prisma.virtualAccount.findUnique({
//       where: { id: accountId },
//     });

//     if (!account) {
//       throw new Error('Virtual account not found');
//     }

//     if (!account.isActive) {
//       throw new Error('Virtual account is not active');
//     }

//     if (account.balance.lessThan(amount)) {
//       throw new Error('Insufficient balance');
//     }

//     const updatedAccount = await prisma.virtualAccount.update({
//       where: { id: accountId },
//       data: {
//         balance: {
//           decrement: amount,
//         },
//       },
//     });

//     // Log transaction
//     await this.logTransaction({
//       accountId,
//       type: 'DEBIT',
//       amount,
//       description,
//       balanceAfter: updatedAccount.balance,
//     });

//     return updatedAccount;
//   }

//   /**
//    * Transfer between virtual accounts
//    */
//   async transfer(request: TransferRequest): Promise<{
//     fromAccount: VirtualAccount;
//     toAccount: VirtualAccount;
//   }> {
//     const { fromAccountId, toAccountId, amount, description } = request;

//     // Use transaction to ensure atomicity
//     const result = await prisma.$transaction(async (tx) => {
//       // Debit from account
//       const fromAccount = await tx.virtualAccount.update({
//         where: { id: fromAccountId },
//         data: {
//           balance: {
//             decrement: amount,
//           },
//         },
//       });

//       if (fromAccount.balance.lessThan(0)) {
//         throw new Error('Insufficient balance');
//       }

//       // Credit to account
//       const toAccount = await tx.virtualAccount.update({
//         where: { id: toAccountId },
//         data: {
//           balance: {
//             increment: amount,
//           },
//         },
//       });

//       return { fromAccount, toAccount };
//     });

//     // Log transactions
//     await this.logTransaction({
//       accountId: fromAccountId,
//       type: 'TRANSFER_OUT',
//       amount,
//       description: `Transfer to ${toAccountId}: ${description || ''}`,
//       balanceAfter: result.fromAccount.balance,
//     });

//     await this.logTransaction({
//       accountId: toAccountId,
//       type: 'TRANSFER_IN',
//       amount,
//       description: `Transfer from ${fromAccountId}: ${description || ''}`,
//       balanceAfter: result.toAccount.balance,
//     });

//     return result;
//   }

//   /**
//    * Withdraw to bank account (via Flutterwave)
//    */
//   async withdrawToBankAccount(request: WithdrawalRequest): Promise<{
//     success: boolean;
//     transactionId?: string;
//     message: string;
//   }> {
//     const { virtualAccountId, amount, bankAccountNumber, bankCode, accountName } = request;

//     // Get virtual account
//     const account = await prisma.virtualAccount.findUnique({
//       where: { id: virtualAccountId },
//     });

//     if (!account) {
//       throw new Error('Virtual account not found');
//     }

//     if (account.balance.lessThan(amount)) {
//       throw new Error('Insufficient balance');
//     }

//     // Debit virtual account
//     await this.debitAccount(virtualAccountId, amount, `Withdrawal to ${bankAccountNumber}`);

//     // In production, integrate with Flutterwave Transfer API
//     // For now, we'll simulate the withdrawal
//     const transactionId = `TXN-${Date.now()}`;

//     // Log withdrawal
//     await this.logTransaction({
//       accountId: virtualAccountId,
//       type: 'WITHDRAWAL',
//       amount,
//       description: `Withdrawal to ${accountName} - ${bankAccountNumber}`,
//       balanceAfter: account.balance.sub(amount),
//       metadata: {
//         bankAccountNumber,
//         bankCode,
//         accountName,
//         transactionId,
//       },
//     });

//     return {
//       success: true,
//       transactionId,
//       message: 'Withdrawal initiated successfully',
//     };
//   }

//   /**
//    * Get account transaction history
//    */
//   async getTransactionHistory(
//     accountId: string,
//     limit: number = 50
//   ): Promise<any[]> {
//     const transactions = await prisma.eventLog.findMany({
//       where: {
//         type: {
//           in: ['CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'WITHDRAWAL'],
//         },
//         metadata: {
//           path: ['accountId'],
//           equals: accountId,
//         },
//       },
//       orderBy: {
//         timestamp: 'desc',
//       },
//       take: limit,
//     });

//     return transactions.map((t) => ({
//       id: t.id,
//       type: t.type,
//       timestamp: t.timestamp,
//       ...(typeof t.metadata === 'object' && t.metadata !== null ? t.metadata : {}),
//     }));
//   }

//   /**
//    * Freeze/unfreeze virtual account
//    */
//   async setAccountStatus(accountId: string, isActive: boolean): Promise<VirtualAccount> {
//     return prisma.virtualAccount.update({
//       where: { id: accountId },
//       data: { isActive },
//     });
//   }

//   /**
//    * Generate account number (placeholder - in production use Flutterwave)
//    */
//   private generateAccountNumber(): string {
//     return `VA${Date.now()}${Math.floor(Math.random() * 1000)}`;
//   }

//   /**
//    * Log transaction to event log
//    */
//   private async logTransaction(data: {
//     accountId: string;
//     type: string;
//     amount: Decimal;
//     description?: string;
//     balanceAfter: Decimal;
//     metadata?: any;
//   }): Promise<void> {
//     await prisma.eventLog.create({
//       data: {
//         type: data.type,
//         metadata: {
//           accountId: data.accountId,
//           amount: data.amount.toString(),
//           description: data.description,
//           balanceAfter: data.balanceAfter.toString(),
//           ...data.metadata,
//         },
//       },
//     });
//   }

//   /**
//    * Get NewCondo admin virtual account
//    */
//   async getAdminVirtualAccount(): Promise<VirtualAccount | null> {
//     const adminUser = await prisma.user.findFirst({
//       where: { role: 'ADMIN' },
//     });

//     if (!adminUser) {
//       return null;
//     }

//     return prisma.virtualAccount.findFirst({
//       where: { userId: adminUser.id },
//     });
//   }
// }

// export const virtualAccountService = new VirtualAccountService();





// // backend/payment-service/src/services/virtualAccountService.ts

// import { PrismaClient, Role } from '@prisma/client';
// import { Decimal } from '@prisma/client/runtime/library';
// import axios from 'axios';

// const prisma = new PrismaClient();

// interface FlutterwaveVirtualAccountResponse {
//   status: string;
//   message: string;
//   data: {
//     account_number: string;
//     account_name: string;
//     bank_name: string;
//     bank_code: string;
//     account_reference: string;
//   };
// }

// interface CreateVirtualAccountParams {
//   userId: string;
//   propertyId?: string;
//   accountName?: string;
//   purpose?: 'GENERAL' | 'PROPERTY_SPECIFIC' | 'MARKING_PAYMENT';
// }

// export class VirtualAccountService {
//   private flutterwaveSecretKey: string;
//   private flutterwaveBaseUrl: string;

//   constructor() {
//     this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
//     this.flutterwaveBaseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
//   }

//   /**
//    * Create virtual account for user upon registration
//    */
//   async createVirtualAccountOnRegistration(userId: string): Promise<any> {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: { email: true, name: true, role: true, isPremium: true },
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       // Only create virtual accounts for property owners, agents, and premium renters
//       const shouldCreateAccount = 
//         user.role === Role.OWNER || 
//         user.role === Role.AGENT || 
//         (user.role === Role.RENTER && user.isPremium);

//       if (!shouldCreateAccount) {
//         return null;
//       }

//       return await this.createVirtualAccount({
//         userId,
//         accountName: user.name || user.email,
//         purpose: 'GENERAL',
//       });
//     } catch (error) {
//       console.error('Error creating virtual account on registration:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create virtual account for renter on premium subscription
//    */
//   async createVirtualAccountForPremiumRenter(userId: string): Promise<any> {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: { email: true, name: true, role: true, isPremium: true },
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       if (user.role !== Role.RENTER || !user.isPremium) {
//         throw new Error('Only premium renters can have virtual accounts created');
//       }

//       return await this.createVirtualAccount({
//         userId,
//         accountName: user.name || user.email,
//         purpose: 'GENERAL',
//       });
//     } catch (error) {
//       console.error('Error creating virtual account for premium renter:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create virtual account (core logic)
//    */
//   async createVirtualAccount(params: CreateVirtualAccountParams): Promise<any> {
//     try {
//       const { userId, propertyId, accountName, purpose = 'GENERAL' } = params;

//       // Check if virtual account already exists
//       const existingAccount = await prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           ...(propertyId ? { propertyId } : { propertyId: null }),
//         },
//       });

//       if (existingAccount) {
//         return existingAccount;
//       }

//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: { email: true, name: true },
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       // Generate unique reference
//       const reference = `VA_${userId}_${Date.now()}`;

//       // Call Flutterwave API to create virtual account
//       const response = await axios.post<FlutterwaveVirtualAccountResponse>(
//         `${this.flutterwaveBaseUrl}/virtual-account-numbers`,
//         {
//           email: user.email,
//           is_permanent: true,
//           bvn: '', // Optional: can be added if available
//           tx_ref: reference,
//           firstname: accountName?.split(' ')[0] || user.name?.split(' ')[0] || 'User',
//           lastname: accountName?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || 'Account',
//           narration: `Newcondo ${purpose} Account`,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${this.flutterwaveSecretKey}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       if (response.data.status !== 'success') {
//         throw new Error(response.data.message || 'Failed to create virtual account');
//       }

//       const { account_number, account_name, bank_code } = response.data.data;

//       // Save virtual account to database
//       const virtualAccount = await prisma.virtualAccount.create({
//         data: {
//           accountNumber: account_number,
//           accountName: account_name || accountName || user.name || user.email,
//           bankCode: bank_code,
//           userId,
//           propertyId: propertyId || null,
//           flutterwaveAccountId: reference,
//           isActive: true,
//           balance: new Decimal(0),
//           currency: 'NGN',
//         },
//       });

//       return virtualAccount;
//     } catch (error) {
//       console.error('Error creating virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get user's virtual account
//    */
//   async getUserVirtualAccount(userId: string): Promise<any> {
//     try {
//       return await prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           propertyId: null, // General account
//           isActive: true,
//         },
//       });
//     } catch (error) {
//       console.error('Error fetching user virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get property-specific virtual account
//    */
//   async getPropertyVirtualAccount(propertyId: string): Promise<any> {
//     try {
//       return await prisma.virtualAccount.findUnique({
//         where: {
//           propertyId,
//           isActive: true,
//         },
//       });
//     } catch (error) {
//       console.error('Error fetching property virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Credit virtual account (webhook handler)
//    */
//   async creditVirtualAccount(
//     accountNumber: string,
//     amount: Decimal,
//     transactionReference: string
//   ): Promise<any> {
//     try {
//       const virtualAccount = await prisma.virtualAccount.findUnique({
//         where: { accountNumber },
//       });

//       if (!virtualAccount) {
//         throw new Error('Virtual account not found');
//       }

//       // Update balance
//       const updatedAccount = await prisma.virtualAccount.update({
//         where: { id: virtualAccount.id },
//         data: {
//           balance: virtualAccount.balance.add(amount),
//         },
//       });

//       return updatedAccount;
//     } catch (error) {
//       console.error('Error crediting virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Debit virtual account
//    */
//   async debitVirtualAccount(
//     userId: string,
//     amount: Decimal,
//     purpose: string
//   ): Promise<any> {
//     try {
//       const virtualAccount = await prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           propertyId: null,
//           isActive: true,
//         },
//       });

//       if (!virtualAccount) {
//         throw new Error('Virtual account not found');
//       }

//       if (virtualAccount.balance.lt(amount)) {
//         throw new Error('Insufficient balance');
//       }

//       // Update balance
//       const updatedAccount = await prisma.virtualAccount.update({
//         where: { id: virtualAccount.id },
//         data: {
//           balance: virtualAccount.balance.sub(amount),
//         },
//       });

//       return updatedAccount;
//     } catch (error) {
//       console.error('Error debiting virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get virtual account balance
//    */
//   async getAccountBalance(userId: string): Promise<Decimal> {
//     try {
//       const virtualAccount = await prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           propertyId: null,
//           isActive: true,
//         },
//         select: { balance: true },
//       });

//       return virtualAccount?.balance || new Decimal(0);
//     } catch (error) {
//       console.error('Error fetching account balance:', error);
//       throw error;
//     }
//   }

//   /**
//    * Transfer funds from virtual account
//    */
//   async transferFromVirtualAccount(
//     userId: string,
//     amount: Decimal,
//     recipientDetails: {
//       accountNumber: string;
//       accountBank: string;
//       accountName: string;
//     },
//     narration: string
//   ): Promise<any> {
//     try {
//       // Debit user's virtual account
//       await this.debitVirtualAccount(userId, amount, narration);

//       // Call Flutterwave transfer API
//       const transferData = {
//         account_bank: recipientDetails.accountBank,
//         account_number: recipientDetails.accountNumber,
//         amount: amount.toNumber(),
//         narration,
//         currency: 'NGN',
//         reference: `TRF_${userId}_${Date.now()}`,
//         callback_url: `${process.env.BACKEND_URL}/api/payments/webhooks/transfer`,
//         debit_currency: 'NGN',
//       };

//       const response = await axios.post(
//         `${this.flutterwaveBaseUrl}/transfers`,
//         transferData,
//         {
//           headers: {
//             Authorization: `Bearer ${this.flutterwaveSecretKey}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       console.error('Error transferring from virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Deactivate virtual account
//    */
//   async deactivateVirtualAccount(accountId: string): Promise<any> {
//     try {
//       return await prisma.virtualAccount.update({
//         where: { id: accountId },
//         data: { isActive: false },
//       });
//     } catch (error) {
//       console.error('Error deactivating virtual account:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check if user has active virtual account
//    */
//   async hasActiveVirtualAccount(userId: string): Promise<boolean> {
//     try {
//       const account = await prisma.virtualAccount.findFirst({
//         where: {
//           userId,
//           isActive: true,
//         },
//       });

//       return !!account;
//     } catch (error) {
//       console.error('Error checking virtual account:', error);
//       return false;
//     }
//   }

//   /**
//    * Get all virtual accounts for user (including property-specific)
//    */
//   async getUserVirtualAccounts(userId: string): Promise<any[]> {
//     try {
//       return await prisma.virtualAccount.findMany({
//         where: {
//           userId,
//           isActive: true,
//         },
//         include: {
//           property: {
//             select: {
//               id: true,
//               title: true,
//               address: true,
//             },
//           },
//         },
//       });
//     } catch (error) {
//       console.error('Error fetching user virtual accounts:', error);
//       throw error;
//     }
//   }
// }

// export default new VirtualAccountService();