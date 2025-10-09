import { Router } from 'express';
import {
  calculateJobCompensation,
  processInitialPayment,
  releaseFullPayment,
  processPartialPayment,
  getCompensationHistory,
  getAgentEarnings,
  getPlatformFees,
  withdrawEarnings,
  getCompensationBreakdown,
} from '../controllers/compensationController';
import { auth } from '../../../shared/src/middleware/auth';
import { checkRolePermission } from '../middleware/rolePermission';
import { validateWithdrawalRequest } from '../middleware/markingValidation';

const router = Router();

/**
 * @route   GET /api/compensation/calculate/:jobId
 * @desc    Calculate compensation breakdown for a job
 * @access  Private (Job owner or assigned agent)
 */
router.get(
  '/calculate/:jobId',
  auth,
  calculateJobCompensation
);

/**
 * @route   GET /api/compensation/breakdown/:jobId
 * @desc    Get detailed compensation breakdown
 * @access  Private (Job owner, assigned agent, or admin)
 */
router.get(
  '/breakdown/:jobId',
  auth,
  getCompensationBreakdown
);

/**
 * @route   POST /api/compensation/:jobId/initial-payment
 * @desc    Process initial partial payment to agent (1000 NGN)
 * @access  Private (System - triggered on job completion)
 */
router.post(
  '/:jobId/initial-payment',
  auth,
  checkRolePermission(['ADMIN']),
  processInitialPayment
);

/**
 * @route   POST /api/compensation/:jobId/partial-payment
 * @desc    Process partial payment after verification timeout
 * @access  Private (System - triggered by cron)
 */
router.post(
  '/:jobId/partial-payment',
  auth,
  checkRolePermission(['ADMIN']),
  processPartialPayment
);

/**
 * @route   POST /api/compensation/:jobId/release
 * @desc    Release full payment to agent after verification
 * @access  Private (System - triggered on owner verification)
 */
router.post(
  '/:jobId/release',
  auth,
  checkRolePermission(['ADMIN']),
  releaseFullPayment
);

/**
 * @route   GET /api/compensation/history
 * @desc    Get compensation history for authenticated user
 * @access  Private (Agent/Premium Renter)
 */
router.get(
  '/history',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  getCompensationHistory
);

/**
 * @route   GET /api/compensation/earnings
 * @desc    Get agent's total earnings
 * @access  Private (Agent/Premium Renter)
 */
router.get(
  '/earnings',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  getAgentEarnings
);

/**
 * @route   GET /api/compensation/platform-fees
 * @desc    Get platform fee summary (admin view)
 * @access  Private (Admin only)
 */
router.get(
  '/platform-fees',
  auth,
  checkRolePermission(['ADMIN']),
  getPlatformFees
);

/**
 * @route   POST /api/compensation/withdraw
 * @desc    Request withdrawal of earned compensation
 * @access  Private (Agent/Premium Renter)
 */
router.post(
  '/withdraw',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  validateWithdrawalRequest,
  withdrawEarnings
);

export default router;