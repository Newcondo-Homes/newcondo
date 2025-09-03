import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import {
  SearchQuery,
  SearchResponse,
  SearchSuggestionResponse,
  TrendingSearchResponse,
  ClusterSearchResponse,
  SearchError,
  GeolocationSearchOptions,
  LocationBounds
} from '../types/search';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  /**
   * Search properties with filters, pagination, and sorting
   */
  public searchProperties = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        query,
        city,
        state,
        country,
        propertyType,
        structure,
        minPrice,
        maxPrice,
        currency,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        features,
        isAvailable,
        availableFrom,
        status,
        adminApprovalStatus,
        boundaryVerified,
        minUnits,
        maxUnits,
        minAvailableUnits,
        latitude,
        longitude,
        radius,
        ownerId,
        agentId,
        isOwnerListing,
        sortField = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      // Validate pagination
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

      // Build search query
      const searchQuery: SearchQuery = {
        query: query as string,
        filters: {
          city: city as string,
          state: state as string,
          country: country as string,
          propertyType: propertyType ? (propertyType as string).split(',') : undefined,
          structure: structure as 'SINGLE_UNIT' | 'MULTI_FAMILY',
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          currency: currency as string,
          minBedrooms: minBedrooms ? parseInt(minBedrooms as string) : undefined,
          maxBedrooms: maxBathrooms ? parseInt(maxBathrooms as string) : undefined,
          minBathrooms: minBathrooms ? parseInt(minBathrooms as string) : undefined,
          maxBathrooms: maxBathrooms ? parseInt(maxBathrooms as string) : undefined,
          features: features ? (features as string).split(',') : undefined,
          isAvailable: isAvailable ? isAvailable === 'true' : undefined,
          availableFrom: availableFrom ? new Date(availableFrom as string) : undefined,
          status: status ? (status as string).split(',') : undefined,
          adminApprovalStatus: adminApprovalStatus as 'PENDING' | 'APPROVED' | 'REJECTED',
          boundaryVerified: boundaryVerified ? boundaryVerified === 'true' : undefined,
          minUnits: minUnits ? parseInt(minUnits as string) : undefined,
          maxUnits: maxUnits ? parseInt(maxUnits as string) : undefined,
          minAvailableUnits: minAvailableUnits ? parseInt(minAvailableUnits as string) : undefined,
          latitude: latitude ? parseFloat(latitude as string) : undefined,
          longitude: longitude ? parseFloat(longitude as string) : undefined,
          radius: radius ? parseFloat(radius as string) : undefined,
          ownerId: ownerId as string,
          agentId: agentId as string,
          isOwnerListing: isOwnerListing ? isOwnerListing === 'true' : undefined,
        },
        sort: {
          field: sortField as 'price' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount' | 'city',
          order: sortOrder as 'asc' | 'desc'
        },
        pagination: {
          page: pageNum,
          limit: limitNum
        }
      };

      const result: SearchResponse = await this.searchService.searchProperties(searchQuery);

      res.status(200).json({
        success: true,
        data: result,
        message: `Found ${result.pagination.total} properties`
      });

    } catch (error: any) {
      console.error('Property search error:', error);
      const searchError = error as SearchError;

      res.status(400).json({
        success: false,
        error: {
          code: searchError.code || 'SEARCH_ERROR',
          message: searchError.message || 'Failed to search properties',
          field: searchError.field
        }
      });
    }
  };

  /**
   * Get search suggestions for autocomplete
   */
  public getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, type, limit = 10 } = req.query;

      if (!q || (q as string).length < 2) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Query must be at least 2 characters long'
          }
        });
        return;
      }

      const suggestions: SearchSuggestionResponse = await this.searchService.getSearchSuggestions(
        q as string,
        type as 'city' | 'state' | 'property' | 'address',
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: suggestions
      });

    } catch (error: any) {
      console.error('Search suggestions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: error.message || 'Failed to get search suggestions'
        }
      });
    }
  };

  /**
   * Get trending/popular searches
   */
  public getTrendingSearches = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, limit = 10 } = req.query;

      const trending: TrendingSearchResponse = await this.searchService.getTrendingSearches(
        category as 'location' | 'property_type' | 'feature',
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: trending
      });

    } catch (error: any) {
      console.error('Trending searches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRENDING_ERROR',
          message: error.message || 'Failed to get trending searches'
        }
      });
    }
  };

  /**
   * Search properties for map clustering
   */
  public searchPropertiesForMap = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        north,
        south,
        east,
        west,
        centerLat,
        centerLng,
        radius,
        zoom,
        filters
      } = req.query;

      let geoOptions: GeolocationSearchOptions | undefined;

      // Handle bounds-based search
      if (north && south && east && west) {
        const bounds: LocationBounds = {
          north: parseFloat(north as string),
          south: parseFloat(south as string),
          east: parseFloat(east as string),
          west: parseFloat(west as string)
        };

        geoOptions = {
          center: {
            latitude: (bounds.north + bounds.south) / 2,
            longitude: (bounds.east + bounds.west) / 2
          },
          radius: radius ? parseFloat(radius as string) : 10,
          bounds
        };
      }
      // Handle center + radius search
      else if (centerLat && centerLng) {
        geoOptions = {
          center: {
            latitude: parseFloat(centerLat as string),
            longitude: parseFloat(centerLng as string)
          },
          radius: radius ? parseFloat(radius as string) : 10
        };
      }

      // Parse additional filters if provided
      const parsedFilters = filters ? JSON.parse(filters as string) : {};

      const clusters: ClusterSearchResponse = await this.searchService.searchPropertiesForMap(
        geoOptions,
        parsedFilters,
        parseInt(zoom as string) || 10
      );

      res.status(200).json({
        success: true,
        data: clusters
      });

    } catch (error: any) {
      console.error('Map search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MAP_SEARCH_ERROR',
          message: error.message || 'Failed to search properties for map'
        }
      });
    }
  };

  /**
   * Get available filter options
   */
  public getFilterOptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { city, state } = req.query;

      const filterOptions = await this.searchService.getAvailableFilters({
        city: city as string,
        state: state as string
      });

      res.status(200).json({
        success: true,
        data: filterOptions
      });

    } catch (error: any) {
      console.error('Filter options error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FILTER_OPTIONS_ERROR',
          message: error.message || 'Failed to get filter options'
        }
      });
    }
  };

  /**
   * Get property count by filters (for showing result counts)
   */
  public getPropertyCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        city,
        state,
        propertyType,
        minPrice,
        maxPrice,
        boundaryVerified
      } = req.query;

      const filters = {
        city: city as string,
        state: state as string,
        propertyType: propertyType ? (propertyType as string).split(',') : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        boundaryVerified: boundaryVerified ? boundaryVerified === 'true' : undefined,
      };

      const count = await this.searchService.getPropertyCount(filters);

      res.status(200).json({
        success: true,
        data: { count }
      });

    } catch (error: any) {
      console.error('Property count error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COUNT_ERROR',
          message: error.message || 'Failed to get property count'
        }
      });
    }
  };

  /**
   * Search similar properties (based on current property)
   */
  public getSimilarProperties = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const { limit = 5 } = req.query;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROPERTY_ID',
            message: 'Property ID is required'
          }
        });
        return;
      }

      const similarProperties = await this.searchService.getSimilarProperties(
        propertyId,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: similarProperties
      });

    } catch (error: any) {
      console.error('Similar properties error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SIMILAR_PROPERTIES_ERROR',
          message: error.message || 'Failed to get similar properties'
        }
      });
    }
  };

  /**
   * Search properties by boundary intersection (for duplicate detection)
   */
  public searchByBoundaryIntersection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boundaryCoordinates, excludePropertyId } = req.body;

      if (!boundaryCoordinates || !Array.isArray(boundaryCoordinates)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BOUNDARY',
            message: 'Valid boundary coordinates are required'
          }
        });
        return;
      }

      const intersectingProperties = await this.searchService.searchByBoundaryIntersection(
        boundaryCoordinates,
        excludePropertyId as string
      );

      res.status(200).json({
        success: true,
        data: intersectingProperties
      });

    } catch (error: any) {
      console.error('Boundary intersection search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BOUNDARY_SEARCH_ERROR',
          message: error.message || 'Failed to search by boundary intersection'
        }
      });
    }
  };
}
