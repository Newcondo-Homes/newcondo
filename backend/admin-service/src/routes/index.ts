import { Router } from 'express';
import adminRoutes from './admin';
import verificationRoutes from './verification';
import propertyApprovalRoutes from './propertyApproval';
import usersRoutes from './users';
import analyticsRoutes from './analytics';
import boundaryDisputesRoutes from './boundaryDisputes';
import markingOversightRoutes from './markingOversight';
import queueManagementRoutes from './queueManagement';
import supportRoutes from './support';
import transactionsRoutes from './transactions';
import duplicatesRoutes from './duplicates';

const router = Router();

/**
 * Admin Service Routes Configuration
 * 
 * All routes are prefixed with /api/admin
 * All routes require admin authentication
 */

// Core admin routes
router.use('/admin', adminRoutes);

// Verification management routes
router.use('/verifications', verificationRoutes);

// Property approval routes
router.use('/properties', propertyApprovalRoutes);

// User management routes
router.use('/users', usersRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Boundary dispute resolution routes
router.use('/boundary-disputes', boundaryDisputesRoutes);

// Property marking oversight routes
router.use('/marking-oversight', markingOversightRoutes);

// Agent queue management routes
router.use('/queue-management', queueManagementRoutes);

// Support ticket routes
router.use('/support', supportRoutes);

// Transaction monitoring routes
router.use('/transactions', transactionsRoutes);

// Duplicate property management routes
router.use('/duplicates', duplicatesRoutes);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'admin-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API version endpoint
 */
router.get('/version', (req, res) => {
  res.json({
    version: '1.0.0',
    service: 'admin-service',
    features: [
      'user-verification',
      'property-approval',
      'user-management',
      'analytics',
      'boundary-disputes',
      'marking-oversight',
      'queue-management',
      'support-tickets',
      'transaction-monitoring',
      'duplicate-management',
    ],
  });
});

export default router;