// backend/payment-service/src/controllers/virtualAccountController.ts
import { Request, Response } from 'express';
import { virtualAccountService } from '../services/virtualAccountService';
import { responseUtil } from '../../../shared/src/utils/response';
import { z } from 'zod';

// Validation schemas
const createVirtualAccountSchema = z.object({
  userId: z.string().min(1),
  propertyId: z.string().min(1).optional(),
  accountName: z.string().min(1),
});

const updateVirtualAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export class VirtualAccountController {
  /**
   * Create a new virtual account
   */
  async createVirtualAccount(req: Request, res: Response) {
    try {
      const validatedData = createVirtualAccountSchema.parse(req.body);
      
      const virtualAccount = await virtualAccountService.createVirtualAccount(validatedData);
      
      return responseUtil.success(res, virtualAccount, 'Virtual account created successfully', 201);
    } catch (error) {
      console.error('Error creating virtual account:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      return responseUtil.error(res, 'Failed to create virtual account');
    }
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const virtualAccount = await virtualAccountService.getVirtualAccountById(accountId);
      
      if (!virtualAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, virtualAccount);
    } catch (error) {
      console.error('Error fetching virtual account:', error);
      return responseUtil.error(res, 'Failed to fetch virtual account');
    }
  }

  /**
   * Get virtual accounts for a user
   */
  async getUserVirtualAccounts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10', isActive } = req.query;
      
      if (!userId) {
        return responseUtil.badRequest(res, 'User ID is required');
      }
      
      const filters = {
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      };
      
      const result = await virtualAccountService.getUserVirtualAccounts(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, result);
    } catch (error) {
      console.error('Error fetching user virtual accounts:', error);
      return responseUtil.error(res, 'Failed to fetch virtual accounts');
    }
  }

  /**
   * Get virtual account for property
   */
  async getPropertyVirtualAccount(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return responseUtil.badRequest(res, 'Property ID is required');
      }
      
      const virtualAccount = await virtualAccountService.getPropertyVirtualAccount(propertyId);
      
      if (!virtualAccount) {
        return responseUtil.notFound(res, 'Virtual account not found for this property');
      }
      
      return responseUtil.success(res, virtualAccount);
    } catch (error) {
      console.error('Error fetching property virtual account:', error);
      return responseUtil.error(res, 'Failed to fetch property virtual account');
    }
  }

  /**
   * Update virtual account
   */
  async updateVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const validatedData = updateVirtualAccountSchema.parse(req.body);
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const updatedAccount = await virtualAccountService.updateVirtualAccount(accountId, validatedData);
      
      if (!updatedAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, updatedAccount, 'Virtual account updated successfully');
    } catch (error) {
      console.error('Error updating virtual account:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      return responseUtil.error(res, 'Failed to update virtual account');
    }
  }

  /**
   * Deactivate virtual account
   */
  async deactivateVirtualAccount(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const deactivatedAccount = await virtualAccountService.deactivateVirtualAccount(accountId);
      
      if (!deactivatedAccount) {
        return responseUtil.notFound(res, 'Virtual account not found');
      }
      
      return responseUtil.success(res, deactivatedAccount, 'Virtual account deactivated successfully');
    } catch (error) {
      console.error('Error deactivating virtual account:', error);
      return responseUtil.error(res, 'Failed to deactivate virtual account');
    }
  }

  /**
   * Get virtual account balance
   */
  async getAccountBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const balance = await virtualAccountService.getAccountBalance(accountId);
      
      return responseUtil.success(res, { balance });
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return responseUtil.error(res, 'Failed to fetch account balance');
    }
  }

  /**
   * Get account transaction history
   */
  async getAccountTransactions(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const { page = '1', limit = '20', startDate, endDate } = req.query;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };
      
      const transactions = await virtualAccountService.getAccountTransactions(
        accountId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, transactions);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      return responseUtil.error(res, 'Failed to fetch account transactions');
    }
  }

  /**
   * Sync virtual account with Flutterwave
   */
  async syncWithFlutterwave(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return responseUtil.badRequest(res, 'Account ID is required');
      }
      
      const syncedAccount = await virtualAccountService.syncWithFlutterwave(accountId);
      
      return responseUtil.success(res, syncedAccount, 'Virtual account synced successfully');
    } catch (error) {
      console.error('Error syncing virtual account:', error);
      return responseUtil.error(res, 'Failed to sync virtual account');
    }
  }
}

export const virtualAccountController = new VirtualAccountController();



// backend/payment-service/src/controllers/virtualAccountController.ts

// import { Request, Response, NextFunction } from 'express';
// import { VirtualAccountService } from '../services/virtualAccountService';
// import { FlutterwaveVirtualAccountService } from '../services/flutterwaveVirtualAccountService';
// import { standardResponse } from '../../../shared/src/utils/response';

// export class VirtualAccountController {
//   private virtualAccountService: VirtualAccountService;
//   private flutterwaveService: FlutterwaveVirtualAccountService;

//   constructor() {
//     this.virtualAccountService = new VirtualAccountService();
//     this.flutterwaveService = new FlutterwaveVirtualAccountService();
//   }

//   // Create virtual account for property owner
//   createOwnerAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { userId, propertyId } = req.body;
//       const { id: requesterId } = req.user as { id: string };

//       // Verify user owns the property or is the user
//       if (requesterId !== userId) {
//         res.status(403).json(standardResponse(false, 'Unauthorized to create virtual account', null));
//         return;
//       }

//       const virtualAccount = await this.virtualAccountService.createOwnerVirtualAccount(userId, propertyId);
      
//       res.status(201).json(standardResponse(
//         true, 
//         'Virtual account created successfully', 
//         virtualAccount
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Create virtual account for agent
//   createAgentAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { userId } = req.body;
//       const { id: requesterId } = req.user as { id: string };

//       // Verify user is creating for themselves
//       if (requesterId !== userId) {
//         res.status(403).json(standardResponse(false, 'Unauthorized to create virtual account', null));
//         return;
//       }

//       const virtualAccount = await this.virtualAccountService.createAgentVirtualAccount(userId);
      
//       res.status(201).json(standardResponse(
//         true, 
//         'Agent virtual account created successfully', 
//         virtualAccount
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Get virtual account details
//   getVirtualAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       res.json(standardResponse(
//         true, 
//         'Virtual account retrieved successfully', 
//         virtualAccount
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Get user's virtual accounts
//   getUserVirtualAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { id: userId } = req.user as { id: string };
//       const { propertyId } = req.query;

//       const virtualAccounts = await this.virtualAccountService.getUserVirtualAccounts(
//         userId, 
//         propertyId as string
//       );

//       res.json(standardResponse(
//         true, 
//         'Virtual accounts retrieved successfully', 
//         virtualAccounts
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Get virtual account balance
//   getAccountBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       // Get fresh balance from Flutterwave
//       const balance = await this.flutterwaveService.getAccountBalance(virtualAccount.flutterwaveAccountId!);

//       // Update local balance
//       await this.virtualAccountService.updateAccountBalance(accountId, balance);

//       res.json(standardResponse(
//         true, 
//         'Account balance retrieved successfully', 
//         { balance, currency: virtualAccount.currency }
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Deactivate virtual account
//   deactivateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       await this.virtualAccountService.deactivateVirtualAccount(accountId);

//       res.json(standardResponse(
//         true, 
//         'Virtual account deactivated successfully', 
//         null
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Reactivate virtual account
//   reactivateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       await this.virtualAccountService.reactivateVirtualAccount(accountId);

//       res.json(standardResponse(
//         true, 
//         'Virtual account reactivated successfully', 
//         null
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Get virtual account transactions
//   getAccountTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { page = 1, limit = 20, startDate, endDate } = req.query;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       const transactions = await this.flutterwaveService.getAccountTransactions(
//         virtualAccount.flutterwaveAccountId!,
//         {
//           page: parseInt(page as string),
//           limit: parseInt(limit as string),
//           startDate: startDate as string,
//           endDate: endDate as string
//         }
//       );

//       res.json(standardResponse(
//         true, 
//         'Account transactions retrieved successfully', 
//         transactions
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Transfer funds from virtual account
//   transferFunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { accountId } = req.params;
//       const { amount, bankCode, accountNumber, narration } = req.body;
//       const { id: userId } = req.user as { id: string };

//       const virtualAccount = await this.virtualAccountService.getVirtualAccountById(accountId);

//       if (!virtualAccount) {
//         res.status(404).json(standardResponse(false, 'Virtual account not found', null));
//         return;
//       }

//       // Check ownership
//       if (virtualAccount.userId !== userId) {
//         res.status(403).json(standardResponse(false, 'Access denied', null));
//         return;
//       }

//       // Check if account has sufficient balance
//       const currentBalance = await this.flutterwaveService.getAccountBalance(virtualAccount.flutterwaveAccountId!);
      
//       if (currentBalance < amount) {
//         res.status(400).json(standardResponse(false, 'Insufficient balance', null));
//         return;
//       }

//       const transfer = await this.flutterwaveService.transferFunds({
//         sourceAccountId: virtualAccount.flutterwaveAccountId!,
//         amount,
//         bankCode,
//         accountNumber,
//         narration: narration || `Transfer from ${virtualAccount.accountName}`
//       });

//       res.json(standardResponse(
//         true, 
//         'Transfer initiated successfully', 
//         transfer
//       ));
//     } catch (error) {
//       next(error);
//     }
//   };

//   // Webhook for virtual account credit notifications
//   handleVirtualAccountWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const webhookData = req.body;

//       // Verify webhook signature (implement signature verification)
//       const isValidSignature = await this.flutterwaveService.verifyWebhookSignature(
//         req.headers['verif-hash'] as string,
//         webhookData
//       );

//       if (!isValidSignature) {
//         res.status(401).json({ message: 'Invalid webhook signature' });
//         return;
//       }

//       // Process virtual account credit
//       if (webhookData.event === 'charge.completed' && webhookData.data?.charge_type === 'virtual_account') {
//         await this.virtualAccountService.processVirtualAccountCredit(webhookData.data);
//       }

//       res.status(200).json({ message: 'Webhook processed successfully' });
//     } catch (error) {
//       next(error);
//     }
//   };
// }