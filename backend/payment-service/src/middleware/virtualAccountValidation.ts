// backend/payment-service/src/middleware/virtualAccountValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

// Validation schemas
const createVirtualAccountSchema = z.object({
  body: z.object({
    userId: z.string().cuid('Invalid user ID format'),
    propertyId: z.string().cuid('Invalid property ID format').optional(),
    accountName: z.string()
      .min(3, 'Account name must be at least 3 characters')
      .max(50, 'Account name must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Account name contains invalid characters'),
    bankCode: z.string()
      .min(3, 'Bank code is required')
      .max(10, 'Invalid bank code format'),
  })
});

const updateVirtualAccountSchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format')
  }),
  body: z.object({
    accountName: z.string()
      .min(3, 'Account name must be at least 3 characters')
      .max(50, 'Account name must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Account name contains invalid characters')
      .optional(),
    isActive: z.boolean().optional(),
  })
});

const transferFundsSchema = z.object({
  body: z.object({
    fromAccountId: z.string().cuid('Invalid source account ID format'),
    toAccountId: z.string().cuid('Invalid destination account ID format'),
    amount: z.number()
      .positive('Amount must be positive')
      .max(10000000, 'Amount exceeds maximum limit')
      .refine(val => Number(val.toFixed(2)) === val, 'Amount can have at most 2 decimal places'),
    description: z.string()
      .min(1, 'Description is required')
      .max(255, 'Description too long'),
    reference: z.string()
      .min(1, 'Reference is required')
      .max(50, 'Reference too long')
      .optional(),
  })
});

const getStatementSchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format')
  }),
  query: z.object({
    startDate: z.string()
      .refine(date => !isNaN(Date.parse(date)), 'Invalid start date format')
      .transform(date => new Date(date)),
    endDate: z.string()
      .refine(date => !isNaN(Date.parse(date)), 'Invalid end date format')
      .transform(date => new Date(date)),
    transactionType: z.enum(['CREDIT', 'DEBIT']).optional(),
    source: z.enum(['RENT_PAYMENT', 'MARKING_PAYMENT', 'COMMISSION', 'PLATFORM_FEE', 'WITHDRAWAL', 'REFUND']).optional(),
    minAmount: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val) && val >= 0, 'Invalid minimum amount').optional(),
    maxAmount: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val) && val >= 0, 'Invalid maximum amount').optional(),
    limit: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0 && val <= 1000, 'Limit must be between 1 and 1000').optional(),
    offset: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val >= 0, 'Invalid offset').optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  }, 'Start date must be before or equal to end date')
    .refine(data => {
      if (data.minAmount && data.maxAmount) {
        return data.minAmount <= data.maxAmount;
      }
      return true;
    }, 'Minimum amount must be less than or equal to maximum amount')
});

const balanceInquirySchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format')
  })
});

const accountListSchema = z.object({
  query: z.object({
    userId: z.string().cuid('Invalid user ID format').optional(),
    propertyId: z.string().cuid('Invalid property ID format').optional(),
    isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    limit: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
    offset: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val >= 0, 'Invalid offset').optional(),
  })
});

// Validation middleware factory
function validateSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Update request objects with parsed data
      req.body = result.body || req.body;
      req.params = result.params || req.params;
      req.query = result.query || req.query;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }
  };
}

// Business logic validation middleware
async function validateVirtualAccountOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const { accountId } = req.params;
    const userId = req.user?.id; // Assuming user is attached from auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const account = await prisma.virtualAccount.findUnique({
      where: { id: accountId },
      include: {
        user: { select: { id: true, role: true } },
        property: { 
          select: { 
            id: true, 
            ownerId: true,
            agentId: true 
          } 
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Virtual account not found',
      });
    }

    // Check if user has access to this account
    const hasAccess = 
      account.userId === userId || // Account owner
      account.property?.ownerId === userId || // Property owner
      account.property?.agentId === userId || // Property agent
      req.user?.role === 'ADMIN'; // Admin access

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this virtual account',
      });
    }

    // Attach account to request for use in route handlers
    req.virtualAccount = account;
    next();
  } catch (error) {
    console.error('Virtual account ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during account validation',
    });
  }
}

async function validatePropertyOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { 
          id: true, 
          ownerId: true, 
          agentId: true,
          status: true,
          adminApprovalStatus: true
        },
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      // Check if user owns or manages the property
      const hasAccess = 
        property.ownerId === userId || 
        property.agentId === userId ||
        req.user?.role === 'ADMIN';

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this property',
        });
      }

      // Check if property is approved for virtual account creation
      if (property.adminApprovalStatus !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Property must be approved before creating virtual account',
        });
      }

      req.property = property;
    }

    next();
  } catch (error) {
    console.error('Property ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during property validation',
    });
  }
}

async function validateUniqueVirtualAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, userId: bodyUserId } = req.body;
    const userId = bodyUserId || req.user?.id;

    if (propertyId) {
      // Check if virtual account already exists for this property
      const existingAccount = await prisma.virtualAccount.findUnique({
        where: { propertyId },
      });

      if (existingAccount) {
        return res.status(409).json({
          success: false,
          message: 'Virtual account already exists for this property',
          data: { accountNumber: existingAccount.accountNumber },
        });
      }
    }

    next();
  } catch (error) {
    console.error('Unique virtual account validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during uniqueness validation',
    });
  }
}

async function validateSufficientBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const { fromAccountId, amount } = req.body;

    const sourceAccount = await prisma.virtualAccount.findUnique({
      where: { id: fromAccountId },
      select: { 
        id: true, 
        balance: true, 
        isActive: true,
        accountName: true 
      },
    });

    if (!sourceAccount) {
      return res.status(404).json({
        success: false,
        message: 'Source account not found',
      });
    }

    if (!sourceAccount.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Source account is not active',
      });
    }

    if (sourceAccount.balance.toNumber() < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance in source account',
        data: {
          availableBalance: sourceAccount.balance.toNumber(),
          requestedAmount: amount,
        },
      });
    }

    req.sourceAccount = sourceAccount;
    next();
  } catch (error) {
    console.error('Balance validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during balance validation',
    });
  }
}

async function validateDestinationAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { toAccountId, fromAccountId } = req.body;

    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination accounts cannot be the same',
      });
    }

    const destinationAccount = await prisma.virtualAccount.findUnique({
      where: { id: toAccountId },
      select: { 
        id: true, 
        isActive: true, 
        accountName: true,
        accountNumber: true 
      },
    });

    if (!destinationAccount) {
      return res.status(404).json({
        success: false,
        message: 'Destination account not found',
      });
    }

    if (!destinationAccount.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Destination account is not active',
      });
    }

    req.destinationAccount = destinationAccount;
    next();
  } catch (error) {
    console.error('Destination account validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during destination account validation',
    });
  }
}

// Rate limiting for account operations
const accountOperationLimits = new Map<string, { count: number; resetTime: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userLimit = accountOperationLimits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      accountOperationLimits.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
    }

    userLimit.count++;
    next();
  };
}

// Exported validation middleware
export const virtualAccountValidation = {
  // Schema validations
  validateCreateAccount: validateSchema(createVirtualAccountSchema),
  validateUpdateAccount: validateSchema(updateVirtualAccountSchema),
  validateTransferFunds: validateSchema(transferFundsSchema),
  validateGetStatement: validateSchema(getStatementSchema),
  validateBalanceInquiry: validateSchema(balanceInquirySchema),
  validateAccountList: validateSchema(accountListSchema),

  // Business logic validations
  validateVirtualAccountOwnership,
  validatePropertyOwnership,
  validateUniqueVirtualAccount,
  validateSufficientBalance,
  validateDestinationAccount,

  // Rate limiting
  rateLimitAccountCreation: rateLimit(5, 60 * 60 * 1000), // 5 accounts per hour
  rateLimitTransfers: rateLimit(20, 60 * 60 * 1000), // 20 transfers per hour
  rateLimitStatements: rateLimit(100, 60 * 60 * 1000), // 100 statement requests per hour
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      virtualAccount?: any;
      property?: any;
      sourceAccount?: any;
      destinationAccount?: any;
    }
  }
}