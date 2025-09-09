// backend/admin-service/src/middleware/documentVerificationValidation.ts

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { DocumentType, DocumentStatus } from '@newcondo/db';

// Validation schemas
const documentVerificationSchema = Joi.object({
  documentId: Joi.string().required().messages({
    'string.empty': 'Document ID is required',
    'any.required': 'Document ID is required'
  }),
  action: Joi.string().valid('approve', 'reject').required().messages({
    'any.only': 'Action must be either "approve" or "reject"',
    'any.required': 'Action is required'
  }),
  verificationNotes: Joi.string().max(1000).optional().messages({
    'string.max': 'Verification notes cannot exceed 1000 characters'
  }),
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  })
});

const bulkDocumentVerificationSchema = Joi.object({
  documentIds: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one document ID is required',
      'array.max': 'Cannot process more than 50 documents at once',
      'any.required': 'Document IDs are required'
    }),
  action: Joi.string().valid('approve', 'reject').required().messages({
    'any.only': 'Action must be either "approve" or "reject"',
    'any.required': 'Action is required'
  }),
  verificationNotes: Joi.string().max(1000).optional().messages({
    'string.max': 'Verification notes cannot exceed 1000 characters'
  }),
  adminId: Joi.string().required().messages({
    'string.empty': 'Admin ID is required',
    'any.required': 'Admin ID is required'
  })
});

const documentQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(DocumentStatus)).optional(),
  documentType: Joi.string().valid(...Object.values(DocumentType)).optional(),
  userId: Joi.string().optional(),
  propertyId: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional().messages({
    'date.min': 'End date must be after start date'
  }),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional().messages({
    'number.max': 'Limit cannot exceed 100'
  }),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'documentType').default('createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
});

const documentTemplateSchema = Joi.object({
  documentType: Joi.string().valid(...Object.values(DocumentType)).required(),
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Template name must be at least 3 characters',
    'string.max': 'Template name cannot exceed 100 characters'
  }),
  description: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 500 characters'
  }),
  templateUrl: Joi.string().uri().optional(),
  isRequired: Joi.boolean().default(false),
  applicableUserTypes: Joi.array()
    .items(Joi.string().valid('LANDLORD', 'PROPERTY_MANAGER', 'AGENT', 'RENTER'))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one user type must be specified'
    }),
  expirationMonths: Joi.number().integer().min(1).max(120).optional().messages({
    'number.min': 'Expiration must be at least 1 month',
    'number.max': 'Expiration cannot exceed 120 months'
  }),
  requirements: Joi.array().items(Joi.string().max(200)).optional(),
  examples: Joi.array().items(Joi.string().uri()).optional()
});

const complianceReportQuerySchema = Joi.object({
  userType: Joi.string().valid('LANDLORD', 'PROPERTY_MANAGER', 'AGENT', 'RENTER').optional(),
  verificationStatus: Joi.string().valid('PENDING', 'VERIFIED', 'REJECTED').optional(),
  complianceThreshold: Joi.number().min(0).max(100).default(80).optional(),
  includeProperties: Joi.boolean().default(false).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

const legalComplianceSettingsSchema = Joi.object({
  requiredDocuments: Joi.array().items(
    Joi.object({
      userType: Joi.string().valid('LANDLORD', 'PROPERTY_MANAGER', 'AGENT', 'RENTER').required(),
      documentTypes: Joi.array().items(Joi.string().valid(...Object.values(DocumentType))).min(1).required()
    })
  ).required(),
  verificationTimeframes: Joi.object({
    standard: Joi.number().integer().min(1).max(30).required(),
    priority: Joi.number().integer().min(1).max(30).required(),
    urgent: Joi.number().integer().min(1).max(30).required()
  }).required(),
  autoReminderSchedule: Joi.object({
    firstReminder: Joi.number().integer().min(1).max(30).required(),
    secondReminder: Joi.number().integer().min(1).max(30).required(),
    finalReminder: Joi.number().integer().min(1).max(30).required()
  }).required(),
  documentExpirationWarning: Joi.number().integer().min(1).max(90).required(),
  maxFileSize: Joi.number().integer().min(1024).max(10485760).required(), // 1KB to 10MB
  allowedFileTypes: Joi.array().items(Joi.string()).min(1).required()
});

// Validation middleware functions
export const validateDocumentVerification = (req: Request, res: Response, next: NextFunction) => {
  const { error } = documentVerificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validateBulkDocumentVerification = (req: Request, res: Response, next: NextFunction) => {
  const { error } = bulkDocumentVerificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validateDocumentQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = documentQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  // Replace query with validated and transformed values
  req.query = value;
  next();
};

export const validateDocumentTemplate = (req: Request, res: Response, next: NextFunction) => {
  const { error } = documentTemplateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

export const validateComplianceReportQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = complianceReportQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.query = value;
  next();
};

export const validateLegalComplianceSettings = (req: Request, res: Response, next: NextFunction) => {
  const { error } = legalComplianceSettingsSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  next();
};

// Additional validation utilities
export const validateDocumentId = (req: Request, res: Response, next: NextFunction) => {
  const { documentId } = req.params;
  
  if (!documentId || typeof documentId !== 'string' || documentId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid document ID is required'
    });
  }
  
  next();
};

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required'
    });
  }
  
  next();
};

export const validateAdminPermissions = (req: Request, res: Response, next: NextFunction) => {
  // This would typically check if the authenticated user is an admin
  // For now, we'll assume the auth middleware has already verified this
  const user = req.user; // Assuming this is set by auth middleware
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin permissions required'
    });
  }
  
  next();
};

// File validation utilities
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'File is required'
    });
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size cannot exceed 10MB'
    });
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'File type not allowed. Only JPEG, PNG, and PDF files are accepted'
    });
  }
  
  next();
};