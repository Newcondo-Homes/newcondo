import { Request, Response } from 'express';
import { KPIService } from '../services/kpiService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class KPIController {
  private kpiService: KPIService;

  constructor() {
    this.kpiService = new KPIService();
  }

  /**
   * Get all KPIs for specified period
   */
  async getAllKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d', compareWith } = req.query;

      const kpis = await this.kpiService.getAllKPIs(
        dateRange as string,
        compareWith as string | undefined
      );

      sendSuccess(res, kpis, 'KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch KPIs');
    }
  }

  /**
   * Get user-related KPIs
   */
  async getUserKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getUserKPIs(dateRange as string);

      sendSuccess(res, kpis, 'User KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch user KPIs');
    }
  }

  /**
   * Get property-related KPIs
   */
  async getPropertyKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getPropertyKPIs(dateRange as string);

      sendSuccess(res, kpis, 'Property KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch property KPIs');
    }
  }

  /**
   * Get revenue-related KPIs
   */
  async getRevenueKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getRevenueKPIs(dateRange as string);

      sendSuccess(res, kpis, 'Revenue KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch revenue KPIs');
    }
  }

  /**
   * Get engagement KPIs
   */
  async getEngagementKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getEngagementKPIs(dateRange as string);

      sendSuccess(res, kpis, 'Engagement KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch engagement KPIs');
    }
  }

  /**
   * Get conversion rate KPIs
   */
  async getConversionKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getConversionKPIs(dateRange as string);

      sendSuccess(res, kpis, 'Conversion KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch conversion KPIs');
    }
  }

  /**
   * Get marking service KPIs
   */
  async getMarkingServiceKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { dateRange = '30d' } = req.query;

      const kpis = await this.kpiService.getMarkingServiceKPIs(dateRange as string);

      sendSuccess(res, kpis, 'Marking service KPIs retrieved successfully');
    } catch (error) {
      sendError(res, error, 'Failed to fetch marking service KPIs');
    }
  }

  /**
   * Get custom KPI calculation
   */
  async calculateCustomKPI(req: Request, res: Response): Promise<void> {
    try {
      const { metric, dateRange, filters } = req.body;

      const kpi = await this.kpiService.calculateCustomKPI(metric, dateRange, filters);

      sendSuccess(res, kpi, 'Custom KPI calculated successfully');
    } catch (error) {
      sendError(res, error, 'Failed to calculate custom KPI');
    }
  }
}