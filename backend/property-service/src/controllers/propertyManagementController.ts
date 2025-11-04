// backend/property-service/src/controllers/propertyManagementController.ts

import { Request, Response } from 'express';
import propertyManagementService from '../services/propertyManagementService';
import { PropertyManagementFilters, PropertyUpdateInput, PropertyUnitUpdateInput } from '../types/propertyManagement';

export class PropertyManagementController {
  /**
   * Get all properties for the authenticated user
   * GET /api/property-management/properties
   */
  async getUserProperties(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      const filters: PropertyManagementFilters = {
        status: req.query.status as any,
        isAvailable: req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined,
        propertyType: req.query.propertyType as string,
        city: req.query.city as string,
        state: req.query.state as string,
        structure: req.query.structure as any,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await propertyManagementService.getUserProperties(userId, filters);

      return res.status(200).json({
        success: true,
        data: result.properties,
        pagination: {
          total: result.total,
          pages: result.pages,
          currentPage: filters.page,
          limit: filters.limit,
        },
      });
    } catch (error: any) {
      console.error('Get user properties error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch properties',
      });
    }
  }

  /**
   * Get single property details
   * GET /api/property-management/properties/:propertyId
   */
  async getPropertyDetails(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      // Verify access
      const access = await propertyManagementService.verifyPropertyAccess(userId, propertyId);
      if (!access.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to this property',
        });
      }

      const property = await propertyManagementService.getPropertyDetails(propertyId);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: property,
      });
    } catch (error: any) {
      console.error('Get property details error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch property details',
      });
    }
  }

  /**
   * Update property information
   * PUT /api/property-management/properties/:propertyId
   */
  async updateProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;
      const updateData: PropertyUpdateInput = req.body;

      const updatedProperty = await propertyManagementService.updateProperty(
        propertyId,
        userId,
        updateData
      );

      // Log the update
      await this.logPropertyUpdate(userId, propertyId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: updatedProperty,
      });
    } catch (error: any) {
      console.error('Update property error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update property',
      });
    }
  }

  /**
   * Update property boundary
   * PUT /api/property-management/properties/:propertyId/boundary
   */
  async updatePropertyBoundary(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;
      const { boundaryCoordinates, boundaryImages } = req.body;

      if (!boundaryCoordinates || !boundaryImages) {
        return res.status(400).json({
          success: false,
          message: 'Boundary coordinates and images are required',
        });
      }

      await propertyManagementService.updatePropertyBoundary(
        propertyId,
        userId,
        { boundaryCoordinates, boundaryImages }
      );

      return res.status(200).json({
        success: true,
        message: 'Property boundary updated successfully',
      });
    } catch (error: any) {
      console.error('Update property boundary error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update property boundary',
      });
    }
  }

  /**
   * Get management dashboard
   * GET /api/property-management/dashboard
   */
  async getManagementDashboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const dashboard = await propertyManagementService.getManagementDashboard(userId);

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error('Get management dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
      });
    }
  }

  /**
   * Get unit management data (for multi-family properties)
   * GET /api/property-management/properties/:propertyId/units
   */
  async getUnitManagement(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const unitData = await propertyManagementService.getUnitManagement(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: unitData,
      });
    } catch (error: any) {
      console.error('Get unit management error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch unit management data',
      });
    }
  }

  /**
   * Update a specific unit
   * PUT /api/property-management/properties/:propertyId/units/:unitId
   */
  async updatePropertyUnit(req: Request, res: Response) {
    try {
      const { propertyId, unitId } = req.params;
      const userId = (req as any).user.id;
      const updateData: PropertyUnitUpdateInput = req.body;

      await propertyManagementService.updatePropertyUnit(
        unitId,
        propertyId,
        userId,
        updateData
      );

      return res.status(200).json({
        success: true,
        message: 'Unit updated successfully',
      });
    } catch (error: any) {
      console.error('Update property unit error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update unit',
      });
    }
  }

  /**
   * Delete a property
   * DELETE /api/property-management/properties/:propertyId
   */
  async deleteProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      await propertyManagementService.deleteProperty(propertyId, userId);

      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete property error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : error.message.includes('Cannot delete') ? 409 : 500).json({
        success: false,
        message: error.message || 'Failed to delete property',
      });
    }
  }

  /**
   * Get marking service history
   * GET /api/property-management/properties/:propertyId/marking-history
   */
  async getMarkingServiceHistory(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const history = await propertyManagementService.getMarkingServiceHistory(propertyId, userId);

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error('Get marking service history error:', error);
      return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch marking service history',
      });
    }
  }

  /**
   * Verify property ownership
   * GET /api/property-management/properties/:propertyId/verify-access
   */
  async verifyPropertyAccess(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const userId = (req as any).user.id;

      const access = await propertyManagementService.verifyPropertyAccess(userId, propertyId);

      return res.status(200).json({
        success: true,
        data: access,
      });
    } catch (error: any) {
      console.error('Verify property access error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify property access',
      });
    }
  }

  /**
   * Helper: Log property update
   */
  private async logPropertyUpdate(userId: string, propertyId: string, updateData: any) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.eventLog.create({
        data: {
          userId,
          type: 'PROPERTY_UPDATED',
          metadata: {
            propertyId,
            updates: Object.keys(updateData),
          },
        },
      });
    } catch (error) {
      console.error('Error logging property update:', error);
      // Don't throw error - logging failure shouldn't block the operation
    }
  }
}

export default new PropertyManagementController();