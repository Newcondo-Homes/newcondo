// backend/admin-service/src/middleware/auditLog.ts

import { Request, Response, NextFunction } from 'express';
import { prisma, AdminActionType } from '@newcondo/db';

interface AuditLogData {
  action: AdminActionType;
  targetType: string;
  targetId: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Store original res.json to capture response data
 */
const originalJson = Response.prototype.json;

/**
 * Middleware to automatically log admin actions
 */
export const auditLog = (action: AdminActionType, targetType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        next();
        return;
      }

      // Extract target ID from params
      const targetId = 
        req.params.id || 
        req.params.userId || 
        req.params.propertyId || 
        req.params.paymentId || 
        req.params.jobId || 
        req.params.ticketId || 
        req.body.targetId ||
        'BULK_ACTION';

      // Store audit data in request for later use
      req.auditData = {
        action,
        targetType,
        targetId,
        requestBody: req.body,
        requestQuery: req.query,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
        userAgent: req.headers['user-agent']
      };

      // Override res.json to capture response and log after success
      res.json = function (body: any) {
        // Restore original json function
        res.json = originalJson;

        // Only log if the action was successful
        if (body.success === true || res.statusCode < 400) {
          createAuditLog(admin.userId, {
            action,
            targetType,
            targetId,
            description: generateDescription(action, targetType, req),
            metadata: {
              request: {
                body: sanitizeData(req.body),
                query: req.query,
                params: req.params
              },
              response: {
                statusCode: res.statusCode,
                success: body.success
              },
              ipAddress: req.auditData?.ipAddress,
              userAgent: req.auditData?.userAgent
            }
          }).catch(error => {
            console.error('Failed to create audit log:', error);
          });
        }

        // Call original json with the body
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
};

/**
 * Create audit log entry
 */
const createAuditLog = async (
  adminId: string,
  data: AuditLogData
): Promise<void> => {
  try {
    await prisma.adminAction.create({
      data: {
        adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        description: data.description,
        metadata: data.metadata
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

/**
 * Generate human-readable description of the action
 */
const generateDescription = (
  action: AdminActionType,
  targetType: string,
  req: Request
): string => {
  const admin = req.admin;
  const targetId = req.params.id || req.body.targetId || 'unknown';

  switch (action) {
    case AdminActionType.USER_VERIFIED:
      return `Admin ${admin?.email} verified user ${targetId}`;
    
    case AdminActionType.USER_REJECTED:
      return `Admin ${admin?.email} rejected user verification for ${targetId}. Reason: ${req.body.rejectionReason || 'Not specified'}`;
    
    case AdminActionType.PROPERTY_APPROVED:
      return `Admin ${admin?.email} approved property ${targetId}`;
    
    case AdminActionType.PROPERTY_REJECTED:
      return `Admin ${admin?.email} rejected property ${targetId}. Reason: ${req.body.rejectionReason || 'Not specified'}`;
    
    case AdminActionType.PAYMENT_REFUNDED:
      return `Admin ${admin?.email} processed refund for payment ${targetId}. Amount: ${req.body.amount || 'Full'}`;
    
    case AdminActionType.DUPLICATE_RESOLVED:
      return `Admin ${admin?.email} resolved duplicate property report ${targetId}. Status: ${req.body.status}`;
    
    case AdminActionType.BOUNDARY_DISPUTE_RESOLVED:
      return `Admin ${admin?.email} resolved boundary dispute ${targetId}. Action: ${req.body.actionTaken}`;
    
    case AdminActionType.TICKET_RESOLVED:
      return `Admin ${admin?.email} resolved support ticket ${targetId}`;
    
    case AdminActionType.AGENT_SUSPENDED:
      return `Admin ${admin?.email} suspended agent ${targetId}. Duration: ${req.body.suspensionDays} days`;
    
    default:
      return `Admin ${admin?.email} performed ${action} on ${targetType} ${targetId}`;
  }
};

/**
 * Sanitize sensitive data from request body
 */
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Manual audit log creation for complex operations
 */
export const logAdminAction = async (
  adminId: string,
  action: AdminActionType,
  targetType: string,
  targetId: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  await createAuditLog(adminId, {
    action,
    targetType,
    targetId,
    description,
    metadata
  });
};

/**
 * Get audit logs for a specific admin
 */
export const getAdminAuditLogs = async (
  adminId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AdminActionType;
  }
) => {
  return await prisma.adminAction.findMany({
    where: {
      adminId,
      ...(options?.action && { action: options.action }),
      ...(options?.startDate || options?.endDate) && {
        createdAt: {
          ...(options?.startDate && { gte: options.startDate }),
          ...(options?.endDate && { lte: options.endDate })
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });
};

/**
 * Get audit logs for a specific resource
 */
export const getResourceAuditLogs = async (
  targetType: string,
  targetId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) => {
  return await prisma.adminAction.findMany({
    where: {
      targetType,
      targetId
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auditData?: {
        action: AdminActionType;
        targetType: string;
        targetId: string;
        requestBody: any;
        requestQuery: any;
        ipAddress?: string;
        userAgent?: string;
      };
    }
  }
}