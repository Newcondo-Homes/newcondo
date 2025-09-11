// backend/admin-service/src/routes/documentTemplates.ts
import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import { adminValidation } from '../middleware/adminValidation';
import { documentTemplateController } from '../controllers/documentTemplateController';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all document templates
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('templateType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'AGENT_AGREEMENT',
      'RENTAL_AGREEMENT',
      'PROPERTY_HANDOVER',
      'TERMINATION_NOTICE',
      'COMPLIANCE_CERTIFICATE'
    ]).withMessage('Invalid template type'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).withMessage('Invalid status'),
    query('category').optional().isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term must be less than 100 characters'),
    adminValidation
  ],
  documentTemplateController.getAllTemplates
);

// Get document template by ID
router.get(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    adminValidation
  ],
  documentTemplateController.getTemplateById
);

// Create new document template
router.post(
  '/',
  [
    body('name').isString().notEmpty().trim().isLength({ min: 3, max: 100 }).withMessage('Template name is required (3-100 characters)'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('templateType').isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'AGENT_AGREEMENT',
      'RENTAL_AGREEMENT',
      'PROPERTY_HANDOVER',
      'TERMINATION_NOTICE',
      'COMPLIANCE_CERTIFICATE'
    ]).withMessage('Invalid template type'),
    body('category').isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    body('content').isString().notEmpty().withMessage('Template content is required'),
    body('variables').optional().isArray().withMessage('Variables must be an array'),
    body('variables.*.name').optional().isString().notEmpty().withMessage('Variable name is required'),
    body('variables.*.type').optional().isIn(['TEXT', 'DATE', 'NUMBER', 'EMAIL', 'PHONE', 'ADDRESS']).withMessage('Invalid variable type'),
    body('variables.*.required').optional().isBoolean().withMessage('Variable required must be boolean'),
    body('variables.*.defaultValue').optional().isString().withMessage('Default value must be string'),
    body('isRequired').optional().isBoolean().withMessage('Is required must be boolean'),
    body('validityPeriodDays').optional().isInt({ min: 1, max: 3650 }).withMessage('Validity period must be between 1 and 3650 days'),
    body('language').optional().isIn(['en', 'ha', 'yo', 'ig']).withMessage('Invalid language'),
    adminValidation
  ],
  documentTemplateController.createTemplate
);

// Update document template
router.put(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('name').optional().isString().trim().isLength({ min: 3, max: 100 }).withMessage('Template name must be 3-100 characters'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('templateType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'AGENT_AGREEMENT',
      'RENTAL_AGREEMENT',
      'PROPERTY_HANDOVER',
      'TERMINATION_NOTICE',
      'COMPLIANCE_CERTIFICATE'
    ]).withMessage('Invalid template type'),
    body('category').optional().isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    body('content').optional().isString().notEmpty().withMessage('Template content cannot be empty'),
    body('variables').optional().isArray().withMessage('Variables must be an array'),
    body('variables.*.name').optional().isString().notEmpty().withMessage('Variable name is required'),
    body('variables.*.type').optional().isIn(['TEXT', 'DATE', 'NUMBER', 'EMAIL', 'PHONE', 'ADDRESS']).withMessage('Invalid variable type'),
    body('variables.*.required').optional().isBoolean().withMessage('Variable required must be boolean'),
    body('variables.*.defaultValue').optional().isString().withMessage('Default value must be string'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).withMessage('Invalid status'),
    body('isRequired').optional().isBoolean().withMessage('Is required must be boolean'),
    body('validityPeriodDays').optional().isInt({ min: 1, max: 3650 }).withMessage('Validity period must be between 1 and 3650 days'),
    body('language').optional().isIn(['en', 'ha', 'yo', 'ig']).withMessage('Invalid language'),
    adminValidation
  ],
  documentTemplateController.updateTemplate
);

// Clone document template
router.post(
  '/:id/clone',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('name').isString().notEmpty().trim().isLength({ min: 3, max: 100 }).withMessage('New template name is required (3-100 characters)'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    adminValidation
  ],
  documentTemplateController.cloneTemplate
);

// Delete document template
router.delete(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('reason').optional().isString().trim().isLength({ min: 10, max: 500 }).withMessage('Deletion reason should be 10-500 characters'),
    adminValidation
  ],
  documentTemplateController.deleteTemplate
);

// Activate/Deactivate template
router.patch(
  '/:id/status',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE'),
    adminValidation
  ],
  documentTemplateController.updateTemplateStatus
);

// Preview template with sample data
router.post(
  '/:id/preview',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    body('sampleData').optional().isObject().withMessage('Sample data must be an object'),
    adminValidation
  ],
  documentTemplateController.previewTemplate
);

// Get template usage statistics
router.get(
  '/:id/usage-stats',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
    adminValidation
  ],
  documentTemplateController.getTemplateUsageStats
);

// Get all template categories
router.get(
  '/meta/categories',
  [adminValidation],
  documentTemplateController.getTemplateCategories
);

// Get template types by category
router.get(
  '/meta/types/:category',
  [
    param('category').isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    adminValidation
  ],
  documentTemplateController.getTemplateTypesByCategory
);

// Bulk operations - activate/deactivate multiple templates
router.patch(
  '/bulk/status',
  [
    body('templateIds').isArray({ min: 1, max: 50 }).withMessage('Template IDs array is required (1-50 items)'),
    body('templateIds.*').isString().notEmpty().withMessage('Each template ID must be a valid string'),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Status must be ACTIVE or INACTIVE'),
    adminValidation
  ],
  documentTemplateController.bulkUpdateTemplateStatus
);

// Export templates
router.get(
  '/export/templates',
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
    query('templateType').optional().isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'AGENT_AGREEMENT',
      'RENTAL_AGREEMENT',
      'PROPERTY_HANDOVER',
      'TERMINATION_NOTICE',
      'COMPLIANCE_CERTIFICATE'
    ]).withMessage('Invalid template type'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']).withMessage('Invalid status'),
    query('category').optional().isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    adminValidation
  ],
  documentTemplateController.exportTemplates
);

// Import templates from file
router.post(
  '/import/templates',
  [
    body('templates').isArray({ min: 1 }).withMessage('Templates array is required'),
    body('templates.*.name').isString().notEmpty().withMessage('Template name is required'),
    body('templates.*.templateType').isIn([
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'AGENT_AGREEMENT',
      'RENTAL_AGREEMENT',
      'PROPERTY_HANDOVER',
      'TERMINATION_NOTICE',
      'COMPLIANCE_CERTIFICATE'
    ]).withMessage('Invalid template type'),
    body('templates.*.category').isIn(['LEGAL', 'COMPLIANCE', 'AGREEMENT', 'NOTICE']).withMessage('Invalid category'),
    body('templates.*.content').isString().notEmpty().withMessage('Template content is required'),
    body('replaceExisting').optional().isBoolean().withMessage('Replace existing must be boolean'),
    adminValidation
  ],
  documentTemplateController.importTemplates
);

// Get template version history
router.get(
  '/:id/versions',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    adminValidation
  ],
  documentTemplateController.getTemplateVersionHistory
);

// Get a specific version of a template
router.get(
  '/:id/versions/:versionId',
  [
    param('id').isString().notEmpty().withMessage('Template ID is required'),
    param('versionId').isString().notEmpty().withMessage('Version ID is required'),
    adminValidation
  ],
  documentTemplateController.getTemplateVersion
);

export default router;