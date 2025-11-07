import { Request, Response } from 'express';
import { marketInsightsService } from '../services/marketInsightsService';
import { sendSuccess, sendError } from '../../../shared/src/utils/response';

export class MarketInsightsController {
  /**
   * Get property market overview
   */
  async getMarketOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const overview = await marketInsightsService.getMarketOverview({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, overview, 'Market overview retrieved successfully');
    } catch (error) {
      console.error('Error fetching market overview:', error);
      return sendError(res, 'Failed to fetch market overview', 500);
    }
  }

  /**
   * Get pricing trends by location
   */
  async getPricingTrends(req: Request, res: Response) {
    try {
      const { state, city, propertyType, startDate, endDate } = req.query;

      const trends = await marketInsightsService.getPricingTrends({
        state: state as string,
        city: city as string,
        propertyType: propertyType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, trends, 'Pricing trends retrieved successfully');
    } catch (error) {
      console.error('Error fetching pricing trends:', error);
      return sendError(res, 'Failed to fetch pricing trends', 500);
    }
  }

  /**
   * Get property demand analysis
   */
  async getDemandAnalysis(req: Request, res: Response) {
    try {
      const { state, city, propertyType, startDate, endDate } = req.query;

      const analysis = await marketInsightsService.getDemandAnalysis({
        state: state as string,
        city: city as string,
        propertyType: propertyType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, analysis, 'Demand analysis retrieved successfully');
    } catch (error) {
      console.error('Error fetching demand analysis:', error);
      return sendError(res, 'Failed to fetch demand analysis', 500);
    }
  }

  /**
   * Get vacancy rates by location
   */
  async getVacancyRates(req: Request, res: Response) {
    try {
      const { state, city, propertyType } = req.query;

      const rates = await marketInsightsService.getVacancyRates({
        state: state as string,
        city: city as string,
        propertyType: propertyType as string,
      });

      return sendSuccess(res, rates, 'Vacancy rates retrieved successfully');
    } catch (error) {
      console.error('Error fetching vacancy rates:', error);
      return sendError(res, 'Failed to fetch vacancy rates', 500);
    }
  }

  /**
   * Get property type distribution
   */
  async getPropertyTypeDistribution(req: Request, res: Response) {
    try {
      const { state, city } = req.query;

      const distribution = await marketInsightsService.getPropertyTypeDistribution({
        state: state as string,
        city: city as string,
      });

      return sendSuccess(res, distribution, 'Property type distribution retrieved successfully');
    } catch (error) {
      console.error('Error fetching property type distribution:', error);
      return sendError(res, 'Failed to fetch property type distribution', 500);
    }
  }

  /**
   * Get popular locations
   */
  async getPopularLocations(req: Request, res: Response) {
    try {
      const { limit = '10', metric = 'listings', startDate, endDate } = req.query;

      const locations = await marketInsightsService.getPopularLocations({
        limit: parseInt(limit as string),
        metric: metric as 'listings' | 'rentals' | 'views',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, locations, 'Popular locations retrieved successfully');
    } catch (error) {
      console.error('Error fetching popular locations:', error);
      return sendError(res, 'Failed to fetch popular locations', 500);
    }
  }

  /**
   * Get average time to rent
   */
  async getTimeToRent(req: Request, res: Response) {
    try {
      const { state, city, propertyType, startDate, endDate } = req.query;

      const timeToRent = await marketInsightsService.getTimeToRent({
        state: state as string,
        city: city as string,
        propertyType: propertyType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return sendSuccess(res, timeToRent, 'Time to rent retrieved successfully');
    } catch (error) {
      console.error('Error fetching time to rent:', error);
      return sendError(res, 'Failed to fetch time to rent', 500);
    }
  }

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(req: Request, res: Response) {
    try {
      const { years = '2' } = req.query;

      const trends = await marketInsightsService.getSeasonalTrends({
        years: parseInt(years as string),
      });

      return sendSuccess(res, trends, 'Seasonal trends retrieved successfully');
    } catch (error) {
      console.error('Error fetching seasonal trends:', error);
      return sendError(res, 'Failed to fetch seasonal trends', 500);
    }
  }

  /**
   * Get market competitiveness
   */
  async getMarketCompetitiveness(req: Request, res: Response) {
    try {
      const { state, city, propertyType } = req.query;

      const competitiveness = await marketInsightsService.getMarketCompetitiveness({
        state: state as string,
        city: city as string,
        propertyType: propertyType as string,
      });

      return sendSuccess(res, competitiveness, 'Market competitiveness retrieved successfully');
    } catch (error) {
      console.error('Error fetching market competitiveness:', error);
      return sendError(res, 'Failed to fetch market competitiveness', 500);
    }
  }
}

export const marketInsightsController = new MarketInsightsController();