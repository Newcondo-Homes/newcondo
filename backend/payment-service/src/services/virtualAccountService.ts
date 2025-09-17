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