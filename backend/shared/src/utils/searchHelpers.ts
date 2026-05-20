// backend/shared/src/utils/searchHelpers.ts

import { PropertyType, PropertyStatus, AdminApprovalStatus, PropertyStructure, UnitStatus } from '@newcondo/db';

// Search filter interfaces
export interface PropertySearchFilters {
  query?: string;
  propertyType?: PropertyType | PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number | number[];
  bathrooms?: number | number[];
  city?: string | string[];
  state?: string | string[];
  features?: string | string[];
  isAvailable?: boolean;
  structure?: PropertyStructure;
  minArea?: number;
  maxArea?: number;
  ownerId?: string;
  agentId?: string;
  isOwnerListing?: boolean;
}

export interface SearchPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt' | 'updatedAt' | 'viewCount' | 'favoriteCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PropertySearchResult {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  propertyType: PropertyType;
  structure: PropertyStructure;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  features: string[];
  isAvailable: boolean;
  availableFrom?: Date | null;
  images: Array<{
    id: string;
    url: string;
    altText?: string | null;
    isPrimary: boolean;
  }>;
  owner: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  agent?: {
    id: string;
    name?: string | null;
    image?: string | null;
  } | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  units?: Array<{
    id: string;
    unitNumber: string;
    price: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    status: UnitStatus;
    isAvailable: boolean;
  }>;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  properties: PropertySearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    appliedFilters: PropertySearchFilters;
    availableFilters: {
      propertyTypes: Array<{ type: PropertyType; count: number }>;
      cities: Array<{ city: string; count: number }>;
      states: Array<{ state: string; count: number }>;
      features: Array<{ feature: string; count: number }>;
      priceRange: { min: number; max: number };
      bedroomRange: { min: number; max: number };
      bathroomRange: { min: number; max: number };
    };
  };
}

/**
 * Build Prisma where clause from search filters
 */
export function buildPropertySearchWhere(filters: PropertySearchFilters) {
  const where: any = {
    status: PropertyStatus.PUBLISHED,
    adminApprovalStatus: AdminApprovalStatus.APPROVED,
  };

  if (filters.query) {
    const searchTerms = filters.query.trim().split(/\s+/);
    where.OR = searchTerms.map((term: string) => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { address: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { features: { hasSome: [term] } },
      ],
    }));
  }

  if (filters.propertyType) {
    if (Array.isArray(filters.propertyType)) {
      where.propertyType = { in: filters.propertyType };
    } else {
      where.propertyType = filters.propertyType;
    }
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions: any = {};

    if (filters.minPrice !== undefined) {
      priceConditions.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      priceConditions.lte = filters.maxPrice;
    }

    where.OR = [
      {
        structure: PropertyStructure.SINGLE_UNIT,
        price: priceConditions,
      },
      {
        structure: PropertyStructure.MULTI_FAMILY,
        units: {
          some: {
            price: priceConditions,
            isAvailable: true,
          },
        },
      },
    ];
  }

  if (filters.bedrooms !== undefined) {
    const bedroomConditions = Array.isArray(filters.bedrooms)
      ? { in: filters.bedrooms }
      : { equals: filters.bedrooms };

    where.OR = [
      ...(where.OR || []),
      {
        structure: PropertyStructure.SINGLE_UNIT,
        bedrooms: bedroomConditions,
      },
      {
        structure: PropertyStructure.MULTI_FAMILY,
        units: {
          some: {
            bedrooms: bedroomConditions,
            isAvailable: true,
          },
        },
      },
    ];
  }

  if (filters.bathrooms !== undefined) {
    const bathroomConditions = Array.isArray(filters.bathrooms)
      ? { in: filters.bathrooms }
      : { equals: filters.bathrooms };

    where.OR = [
      ...(where.OR || []),
      {
        structure: PropertyStructure.SINGLE_UNIT,
        bathrooms: bathroomConditions,
      },
      {
        structure: PropertyStructure.MULTI_FAMILY,
        units: {
          some: {
            bathrooms: bathroomConditions,
            isAvailable: true,
          },
        },
      },
    ];
  }

  if (filters.city) {
    if (Array.isArray(filters.city)) {
      where.city = { in: filters.city.map((c: string) => c.toLowerCase()) };
    } else {
      where.city = { equals: filters.city.toLowerCase(), mode: 'insensitive' };
    }
  }

  if (filters.state) {
    if (Array.isArray(filters.state)) {
      where.state = { in: filters.state.map((s: string) => s.toLowerCase()) };
    } else {
      where.state = { equals: filters.state.toLowerCase(), mode: 'insensitive' };
    }
  }

  if (filters.features) {
    const features = Array.isArray(filters.features) ? filters.features : [filters.features];
    where.OR = [
      ...(where.OR || []),
      {
        structure: PropertyStructure.SINGLE_UNIT,
        features: { hasSome: features },
      },
      {
        structure: PropertyStructure.MULTI_FAMILY,
        buildingFeatures: { hasSome: features },
      },
    ];
  }

  if (filters.structure) {
    where.structure = filters.structure;
  }

  if (filters.isAvailable !== undefined) {
    if (filters.isAvailable) {
      where.OR = [
        ...(where.OR || []),
        {
          structure: PropertyStructure.SINGLE_UNIT,
          isAvailable: true,
        },
        {
          structure: PropertyStructure.MULTI_FAMILY,
          availableUnits: { gt: 0 },
        },
      ];
    } else {
      where.isAvailable = false;
    }
  }

  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters.agentId) {
    where.agentId = filters.agentId;
  }

  if (filters.isOwnerListing !== undefined) {
    where.isOwnerListing = filters.isOwnerListing;
  }

  return where;
}

/**
 * Build Prisma orderBy clause from search options
 */
export function buildPropertySearchOrderBy(options: SearchPaginationOptions) {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const orderByMap: Record<string, any> = {
    price: { price: sortOrder },
    createdAt: { createdAt: sortOrder },
    updatedAt: { updatedAt: sortOrder },
    viewCount: { viewCount: sortOrder },
    favoriteCount: { favoriteCount: sortOrder },
  };

  return orderByMap[sortBy] || { createdAt: 'desc' };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  totalCount: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
  };
}

/**
 * Extract search keywords from query string
 */
export function extractSearchKeywords(query: string): string[] {
  if (!query || typeof query !== 'string') return [];

  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word: string) => word.length > 2)
    .slice(0, 10);
}

/**
 * Build property search aggregations for filters
 */
export function buildPropertySearchAggregations() {
  return {
    propertyTypes: {
      _count: { _all: true },
      _group: { propertyType: true },
    },
    locations: {
      _count: { _all: true },
      _group: { city: true, state: true },
    },
    priceRange: {
      _min: { price: true },
      _max: { price: true },
    },
    bedroomRange: {
      _min: { bedrooms: true },
      _max: { bedrooms: true },
    },
    bathroomRange: {
      _min: { bathrooms: true },
      _max: { bathrooms: true },
    },
  };
}

/**
 * Sanitize and validate search filters
 */
export function sanitizeSearchFilters(filters: any): PropertySearchFilters {
  const sanitized: PropertySearchFilters = {};

  if (filters.query && typeof filters.query === 'string') {
    sanitized.query = filters.query.trim().substring(0, 200);
  }

  if (filters.propertyType) {
    const validTypes = Object.values(PropertyType) as string[];
    if (Array.isArray(filters.propertyType)) {
      sanitized.propertyType = filters.propertyType.filter((type: any) => validTypes.includes(type));
    } else if (validTypes.includes(filters.propertyType)) {
      sanitized.propertyType = filters.propertyType;
    }
  }

  if (filters.minPrice !== undefined) {
    const minPrice = Number(filters.minPrice);
    if (!isNaN(minPrice) && minPrice >= 0) {
      sanitized.minPrice = minPrice;
    }
  }

  if (filters.maxPrice !== undefined) {
    const maxPrice = Number(filters.maxPrice);
    if (!isNaN(maxPrice) && maxPrice >= 0) {
      sanitized.maxPrice = maxPrice;
    }
  }

  if (filters.bedrooms !== undefined) {
    if (Array.isArray(filters.bedrooms)) {
      sanitized.bedrooms = filters.bedrooms
        .map((num: any) => Number(num))
        .filter((num: number) => !isNaN(num) && num >= 0 && num <= 10);
    } else {
      const bedrooms = Number(filters.bedrooms);
      if (!isNaN(bedrooms) && bedrooms >= 0 && bedrooms <= 10) {
        sanitized.bedrooms = bedrooms;
      }
    }
  }

  if (filters.bathrooms !== undefined) {
    if (Array.isArray(filters.bathrooms)) {
      sanitized.bathrooms = filters.bathrooms
        .map((num: any) => Number(num))
        .filter((num: number) => !isNaN(num) && num >= 0 && num <= 10);
    } else {
      const bathrooms = Number(filters.bathrooms);
      if (!isNaN(bathrooms) && bathrooms >= 0 && bathrooms <= 10) {
        sanitized.bathrooms = bathrooms;
      }
    }
  }

  if (filters.city && typeof filters.city === 'string') {
    sanitized.city = filters.city.trim().substring(0, 100);
  } else if (Array.isArray(filters.city)) {
    sanitized.city = filters.city
      .filter((c: any) => typeof c === 'string')
      .map((c: string) => c.trim().substring(0, 100))
      .filter((c: string) => c.length > 0);
  }

  if (filters.state && typeof filters.state === 'string') {
    sanitized.state = filters.state.trim().substring(0, 100);
  } else if (Array.isArray(filters.state)) {
    sanitized.state = filters.state
      .filter((s: any) => typeof s === 'string')
      .map((s: string) => s.trim().substring(0, 100))
      .filter((s: string) => s.length > 0);
  }

  if (filters.features) {
    if (Array.isArray(filters.features)) {
      sanitized.features = filters.features
        .filter((f: any) => typeof f === 'string')
        .map((f: string) => f.trim())
        .filter((f: string) => f.length > 0)
        .slice(0, 20);
    } else if (typeof filters.features === 'string') {
      sanitized.features = filters.features.trim();
    }
  }

  if (filters.structure && Object.values(PropertyStructure).includes(filters.structure)) {
    sanitized.structure = filters.structure;
  }

  if (filters.isAvailable !== undefined) {
    sanitized.isAvailable = Boolean(filters.isAvailable);
  }

  if (filters.isOwnerListing !== undefined) {
    sanitized.isOwnerListing = Boolean(filters.isOwnerListing);
  }

  return sanitized;
}

/**
 * Sanitize and validate pagination options
 */
export function sanitizePaginationOptions(options: any): SearchPaginationOptions {
  const sanitized: SearchPaginationOptions = {};

  if (options.page !== undefined) {
    const page = Number(options.page);
    if (!isNaN(page) && page >= 1 && page <= 1000) {
      sanitized.page = page;
    }
  }

  if (options.limit !== undefined) {
    const limit = Number(options.limit);
    if (!isNaN(limit) && limit >= 1 && limit <= 100) {
      sanitized.limit = limit;
    }
  }

  const validSortBy = ['price', 'createdAt', 'updatedAt', 'viewCount', 'favoriteCount'];
  if (options.sortBy && validSortBy.includes(options.sortBy)) {
    sanitized.sortBy = options.sortBy;
  }

  const validSortOrder = ['asc', 'desc'];
  if (options.sortOrder && validSortOrder.includes(options.sortOrder)) {
    sanitized.sortOrder = options.sortOrder;
  }

  return sanitized;
}

/**
 * Generate cache key for search results
 */
export function generateSearchCacheKey(
  filters: PropertySearchFilters,
  options: SearchPaginationOptions
): string {
  const filterString = JSON.stringify(filters);
  const optionsString = JSON.stringify(options);
  const combined = `${filterString}:${optionsString}`;

  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `property_search:${Math.abs(hash)}`;
}