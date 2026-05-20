// backend/admin-service/src/middleware/permissionCheck.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@newcondo/db';
import { AdminPermission } from '../types/admin'
/**
 * Define admin permission levels
 */


/**
 * Admin role definitions with their permissions
 * In a production system, this would be stored in the database
 */
const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
  SUPER_ADMIN: Object.values(AdminPermission), // All permissions
  
  OPERATIONS_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VERIFY_USERS,
    AdminPermission.VIEW_PROPERTIES,
    AdminPermission.APPROVE_PROPERTIES,
    AdminPermission.REJECT_PROPERTIES,
    AdminPermission.RESOLVE_DUPLICATES,
    AdminPermission.VIEW_MARKING_JOBS,
    AdminPermission.ASSIGN_MARKING_JOBS,
    AdminPermission.REVIEW_MARKING_JOBS,
    AdminPermission.VIEW_SUPPORT_TICKETS,
    AdminPermission.RESOLVE_SUPPORT_TICKETS,
    AdminPermission.RESOLVE_BOUNDARY_DISPUTES,
    AdminPermission.VIEW_ANALYTICS
  ],
  
  FINANCE_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_PROPERTIES,
    AdminPermission.VIEW_PAYMENTS,
    AdminPermission.PROCESS_REFUNDS,
    AdminPermission.MANAGE_VIRTUAL_ACCOUNTS,
    AdminPermission.VIEW_FINANCIAL_REPORTS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.EXPORT_DATA,
    AdminPermission.GENERATE_REPORTS
  ],
  
  SUPPORT_ADMIN: [
    AdminPermission.VIEW_USERS,
    AdminPermission.VIEW_PROPERTIES,
    AdminPermission.VIEW_MARKING_JOBS,
    AdminPermission.VIEW_SUPPORT_TICKETS,
    AdminPermission.RESOLVE_SUPPORT_TICKETS,
    AdminPermission.VIEW_ANALYTICS
  ],
  
  QUALITY_ADMIN: [
    AdminPermission.VIEW_PROPERTIES,
    AdminPermission.VIEW_MARKING_JOBS,
    AdminPermission.REVIEW_MARKING_JOBS,
    AdminPermission.RESOLVE_BOUNDARY_DISPUTES,
    AdminPermission.RESOLVE_DUPLICATES,
    AdminPermission.VIEW_ANALYTICS
  ]
};

/**
 * Check if admin has required permission
 */
export const hasPermission = (
  adminRole: string,
  requiredPermission: AdminPermission
): boolean => {
  const permissions = ROLE_PERMISSIONS[adminRole] || [];
  return permissions.includes(requiredPermission);
};

/**
 * Middleware to check if admin has required permission
 */
export const requirePermission = (...requiredPermissions: AdminPermission[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Fetch full admin details to get role info
      const adminUser = await prisma.user.findUnique({
        where: { id: admin.userId },
        select: {
          id: true,
          role: true,
          email: true,
          name: true
        }
      });

      if (!adminUser) {
        res.status(404).json({
          success: false,
          message: 'Admin user not found'
        });
        return;
      }

      // For now, we'll use a simple role-based check
      // In production, you might want to store admin sub-roles in the database
      const adminRole = adminUser.email?.includes('super') ? 'SUPER_ADMIN' : 'OPERATIONS_ADMIN';
      
      // Check if admin has any of the required permissions
      const hasRequiredPermission = requiredPermissions.some(permission =>
        hasPermission(adminRole, permission)
      );

      if (!hasRequiredPermission) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermissions
        });
        return;
      }

      // Attach admin role to request for logging
      req.admin = {
        ...admin,
        role: adminUser.role
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Middleware to check if admin can perform action on specific resource
 */
export const canAccessResource = (resourceType: 'USER' | 'PROPERTY' | 'PAYMENT' | 'MARKING_JOB') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = req.admin;
      const resourceId = req.params.id || req.params.userId || req.params.propertyId || req.params.jobId;

      if (!admin || !resourceId) {
        res.status(400).json({
          success: false,
          message: 'Invalid request'
        });
        return;
      }

      // Additional resource-specific checks can be added here
      // For example, checking if a property belongs to a specific region
      // that the admin is responsible for

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Resource access check failed'
      });
    }
  };
};

/**
 * Get admin's permissions
 */
export const getAdminPermissions = async (adminId: string): Promise<AdminPermission[]> => {
  const adminUser = await prisma.user.findUnique({
    where: { id: adminId },
    select: { email: true, role: true }
  });

  if (!adminUser || adminUser.role !== 'ADMIN') {
    return [];
  }

  // Determine admin role based on email or other criteria
  const adminRole = adminUser.email?.includes('super') ? 'SUPER_ADMIN' : 'OPERATIONS_ADMIN';
  
  return ROLE_PERMISSIONS[adminRole] || [];
};