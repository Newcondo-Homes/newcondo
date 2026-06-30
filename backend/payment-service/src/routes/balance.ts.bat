import { Router } from 'express';
import { balanceController } from '../controllers/balanceController';
import { auth } from '../../../shared/src/middleware/auth';
import { validate } from '../../../shared/src/middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const getBalanceSchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format')
  })
});

const transferFundsSchema = z.object({
  body: z.object({
    fromAccountId: z.string().cuid('Invalid source account ID'),
    toAccountId: z.string().cuid('Invalid destination account ID'),
    amount: z.number().positive('Amount must be positive'),
    reference: z.string().min(1, 'Reference is required'),
    description: z.string().optional(),
    transferType: z.enum(['RENT_PAYMENT', 'COMMISSION', 'REFUND', 'WITHDRAWAL', 'INTERNAL_TRANSFER'])
  })
});

const fundAccountSchema = z.object({
  body: z.object({
    accountId: z.string().cuid('Invalid account ID'),
    amount: z.number().positive('Amount must be positive'),
    reference: z.string().min(1, 'Reference is required'),
    description: z.string().optional(),
    sourceType: z.enum(['PAYMENT', 'TOP_UP', 'REFUND'])
  })
});

const withdrawFundsSchema = z.object({
  body: z.object({
    accountId: z.string().cuid('Invalid account ID'),
    amount: z.number().positive('Amount must be positive'),
    reference: z.string().min(1, 'Reference is required'),
    description: z.string().optional(),
    destinationType: z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY', 'WALLET'])
  })
});

const freezeAccountSchema = z.object({
  body: z.object({
    accountId: z.string().cuid('Invalid account ID'),
    reason: z.string().min(1, 'Reason is required'),
    freezeType: z.enum(['TEMPORARY', 'PERMANENT', 'INVESTIGATION'])
  })
});

const getTransactionHistorySchema = z.object({
  params: z.object({
    accountId: z.string().cuid('Invalid account ID format')
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    transactionType: z.enum(['CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'WITHDRAWAL', 'DEPOSIT']).optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional()
  })
});

// Balance inquiry routes
router.get(
  '/account/:accountId', 
  auth,
  validate(getBalanceSchema),
  balanceController.getAccountBalance
);

router.get(
  '/user/:userId/accounts',
  auth,
  balanceController.getUserAccountBalances
);

// Fund management routes
router.post(
  '/fund',
  auth,
  validate(fundAccountSchema),
  balanceController.fundAccount
);

router.post(
  '/transfer',
  auth,
  validate(transferFundsSchema),
  balanceController.transferFunds
);

router.post(
  '/withdraw',
  auth,
  validate(withdrawFundsSchema),
  balanceController.withdrawFunds
);

// Transaction history routes
router.get(
  '/account/:accountId/transactions',
  auth,
  validate(getTransactionHistorySchema),
  balanceController.getTransactionHistory
);

router.get(
  '/account/:accountId/statement',
  auth,
  validate(getBalanceSchema),
  balanceController.generateAccountStatement
);

// Hold and release funds (for rent payments during confirmation period)
router.post(
  '/hold',
  auth,
  validate(z.object({
    body: z.object({
      accountId: z.string().cuid('Invalid account ID'),
      amount: z.number().positive('Amount must be positive'),
      reference: z.string().min(1, 'Reference is required'),
      holdDuration: z.number().positive('Hold duration must be positive (in hours)').max(168, 'Hold duration cannot exceed 7 days'), // Max 7 days
      description: z.string().optional()
    })
  })),
  balanceController.holdFunds
);

router.post(
  '/release',
  auth,
  validate(z.object({
    body: z.object({
      holdId: z.string().cuid('Invalid hold ID'),
      releaseType: z.enum(['FULL', 'PARTIAL']),
      amount: z.number().positive().optional(), // Required for partial release
      reason: z.string().min(1, 'Release reason is required')
    })
  })),
  balanceController.releaseFunds
);

// Account management routes (admin functions)
router.post(
  '/freeze',
  auth,
  validate(freezeAccountSchema),
  balanceController.freezeAccount
);

router.post(
  '/unfreeze',
  auth,
  validate(z.object({
    body: z.object({
      accountId: z.string().cuid('Invalid account ID'),
      reason: z.string().min(1, 'Reason is required')
    })
  })),
  balanceController.unfreezeAccount
);

// Reconciliation routes
router.get(
  '/reconcile/:accountId',
  auth,
  validate(getBalanceSchema),
  balanceController.reconcileAccount
);

router.get(
  '/audit/:accountId',
  auth,
  validate(z.object({
    params: z.object({
      accountId: z.string().cuid('Invalid account ID format')
    }),
    query: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    })
  })),
  balanceController.auditAccount
);

// Bulk operations (admin functions)
router.post(
  '/bulk/transfer',
  auth,
  validate(z.object({
    body: z.object({
      transfers: z.array(z.object({
        fromAccountId: z.string().cuid(),
        toAccountId: z.string().cuid(),
        amount: z.number().positive(),
        reference: z.string().min(1),
        description: z.string().optional()
      })).min(1, 'At least one transfer required').max(100, 'Maximum 100 transfers per batch')
    })
  })),
  balanceController.bulkTransfer
);

// Real-time balance monitoring
router.get(
  '/monitor/:accountId/balance',
  auth,
  validate(getBalanceSchema),
  balanceController.monitorBalance
);

// Low balance alerts
router.post(
  '/alerts/low-balance',
  auth,
  validate(z.object({
    body: z.object({
      accountId: z.string().cuid('Invalid account ID'),
      threshold: z.number().positive('Threshold must be positive'),
      alertType: z.enum(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'])
    })
  })),
  balanceController.setLowBalanceAlert
);

export { router as balanceRoutes };