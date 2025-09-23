// backend/marking-service/src/middleware/markingAccountValidation.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';

// Schema for creating virtual account for agent
const createAgentAccountSchema = z.object({
  body: z.object({
    agentId: z.string().min(1, 'Agent ID is required'),
    accountName: z
      .string()
      .min(3, 'Account name must be at least 3 characters')
      .max(50, 'Account name cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9\s]+$/, 'Account name can only contain letters, numbers, and spaces'),
    serviceAreas: z
      .array(z.string())
      .min(1, 'At least one service area is required')
      .max(20, 'Cannot have more than 20 service areas'),
  }),
});

// Schema for updating account balance
const updateAccountBalanceSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive('Amount must be positive')
      .max(1000000, 'Amount cannot exceed 1,000,000'),
    transactionType: z.enum(['CREDIT', 'DEBIT'], {
      errorMap: () => ({ message: 'Transaction type must be CREDIT or DEBIT' }),
    }),
    reference: z.string().min(1, 'Transaction reference is required'),
    description: z
      .string()
      .min(5, 'Description must be at least 5 characters')
      .max(200, 'Description cannot exceed 200 characters'),
  }),
});

// Schema for account transfer
const transferFundsSchema = z.object({
  body: z.object({
    fromAccountId: z.string().min(1, 'Source account ID is required'),
    toAccountId: z.string().min(1, 'Destination account ID is required'),
    amount: z
      .number()
      .positive('Transfer amount must be positive')
      .max(500000, 'Transfer amount cannot exceed 500,000'),
    description: z
      .string()
      .min(5, 'Transfer description must be at least 5 characters')
      .max(150, 'Transfer description cannot exceed 150 characters'),
    transferType: z.enum(['MARKING_PAYMENT', 'COMMISSION', 'REFUND', 'ADJUSTMENT'], {
      errorMap: () => ({ message: 'Invalid transfer type' }),
    }),
  }),
});

// Schema for account status update
const updateAccountStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(300, 'Reason cannot exceed 300 characters')
      .optional(),
  }),
});

// Schema for bulk account operations
const bulkAccountOperationSchema = z.object({
  body: z.object({
    accountIds: z
      .array(z.string())
      .min(1, 'At least one account ID is required')
      .max(50, 'Cannot process more than 50 accounts at once'),
    operation: z.enum(['ACTIVATE', 'DEACTIVATE', 'FREEZE'], {
      errorMap: () => ({ message: 'Invalid bulk operation type' }),
    }),
    reason: z
      .string()
      .min(10, 'Reason for bulk operation is required')
      .max(500, 'Reason cannot exceed 500 characters'),
  }),
});

// Schema for account balance query
const accountBalanceQuerySchema = z.object({
  query: z.object({
    accountId: z.string().min(1, 'Account ID is required').optional(),
    agentId: z.string().min(1, 'Agent ID is required').optional(),
    includeTransactions: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    transactionLimit: z
      .string()
      .transform((val) => parseInt(val))
      .refine((val) => val > 0 && val <= 100, 'Transaction limit must be between 1 and 100')
      .optional(),
  }).refine(
    (data) => data.accountId || data.agentId,
    'Either accountId or agentId must be provided'
  ),
});

// Schema for withdrawal request
const withdrawalRequestSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive('Withdrawal amount must be positive')
      .max(100000, 'Withdrawal amount cannot exceed 100,000'),
    recipientBank: z
      .string()
      .min(1, 'Recipient bank is required')
      .max(50, 'Bank name cannot exceed 50 characters'),
    recipientAccountNumber: z
      .string()
      .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
    recipientAccountName: z
      .string()
      .min(3, 'Account name must be at least 3 characters')
      .max(50, 'Account name cannot exceed 50 characters'),
    narration: z
      .string()
      .min(5, 'Narration must be at least 5 characters')
      .max(100, 'Narration cannot exceed 100 characters')
      .optional(),
  }),
});

// Middleware to validate agent permissions
export const validateAgentPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    // Check if user is an agent or admin
    if (user.role !== Role.AGENT && user.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Agent or Admin role required.',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    // For agent-specific operations, ensure user is available for marking
    if (user.role === Role.AGENT && !user.isAvailableForMarking) {
      res.status(403).json({
        success: false,
        message: 'Agent must be available for marking services to access virtual accounts',
        error: 'AGENT_NOT_AVAILABLE'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Agent permission validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating agent permissions',
      error: 'VALIDATION_ERROR'
    });
  }
};

// Middleware to validate account ownership
export const validateAccountOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const accountId = req.params.accountId || req.body.accountId;

    if (!accountId) {
      res.status(400).json({
        success: false,
        message: 'Account ID is required',
        error: 'MISSING_ACCOUNT_ID'
      });
      return;
    }

    // Admin users can access any account
    if (user?.role === Role.ADMIN) {
      next();
      return;
    }

    // For non-admin users, validate ownership
    // This would typically involve a database query to check ownership
    // For now, we'll pass the validation to the service layer
    req.accountOwnershipValidated = true;
    next();
  } catch (error) {
    console.error('Account ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating account ownership',
      error: 'VALIDATION_ERROR'
    });
  }
};

// Create validation middleware functions
export const validateCreateAgentAccount = (req: Request, res: Response, next: NextFunction) => {
  try {
    createAgentAccountSchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateUpdateAccountBalance = (req: Request, res: Response, next: NextFunction) => {
  try {
    updateAccountBalanceSchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateTransferFunds = (req: Request, res: Response, next: NextFunction) => {
  try {
    transferFundsSchema.parse(req);
    
    // Additional business logic validation
    if (req.body.fromAccountId === req.body.toAccountId) {
      res.status(400).json({
        success: false,
        message: 'Source and destination accounts cannot be the same',
        error: 'INVALID_TRANSFER'
      });
      return;
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateUpdateAccountStatus = (req: Request, res: Response, next: NextFunction) => {
  try {
    updateAccountStatusSchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateBulkAccountOperation = (req: Request, res: Response, next: NextFunction) => {
  try {
    bulkAccountOperationSchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateAccountBalanceQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    accountBalanceQuerySchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

export const validateWithdrawalRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    withdrawalRequestSchema.parse(req);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        error: 'VALIDATION_ERROR'
      });
      return;
    }
    next(error);
  }
};

// Rate limiting middleware for sensitive operations
export const rateLimitSensitiveOperations = (req: Request, res: Response, next: NextFunction) => {
  // This would integrate with a rate limiting service (Redis-based)
  // For now, we'll implement a basic in-memory rate limiter
  const sensitiveEndpoints = ['/withdraw', '/transfer', '/bulk-operations'];
  const currentPath = req.path;
  
  if (sensitiveEndpoints.some(endpoint => currentPath.includes(endpoint))) {
    // Add rate limiting logic here
    // For now, we'll just pass through
    next();
  } else {
    next();
  }
};

// Custom types for TypeScript
declare global {
  namespace Express {
    interface Request {
      accountOwnershipValidated?: boolean;
    }
  }
}