import { PropertyType, PropertyStructure, UnitStatus } from '@newcondo/db';
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
            propertyTypes: Array<{
                type: PropertyType;
                count: number;
            }>;
            cities: Array<{
                city: string;
                count: number;
            }>;
            states: Array<{
                state: string;
                count: number;
            }>;
            features: Array<{
                feature: string;
                count: number;
            }>;
            priceRange: {
                min: number;
                max: number;
            };
            bedroomRange: {
                min: number;
                max: number;
            };
            bathroomRange: {
                min: number;
                max: number;
            };
        };
    };
}
/**
 * Build Prisma where clause from search filters
 */
export declare function buildPropertySearchWhere(filters: PropertySearchFilters): any;
/**
 * Build Prisma orderBy clause from search options
 */
export declare function buildPropertySearchOrderBy(options: SearchPaginationOptions): any;
/**
 * Calculate pagination metadata
 */
export declare function calculatePagination(page: number, limit: number, totalCount: number): {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
};
/**
 * Extract search keywords from query string
 */
export declare function extractSearchKeywords(query: string): string[];
/**
 * Build property search aggregations for filters
 */
export declare function buildPropertySearchAggregations(): {
    propertyTypes: {
        _count: {
            _all: boolean;
        };
        _group: {
            propertyType: boolean;
        };
    };
    locations: {
        _count: {
            _all: boolean;
        };
        _group: {
            city: boolean;
            state: boolean;
        };
    };
    priceRange: {
        _min: {
            price: boolean;
        };
        _max: {
            price: boolean;
        };
    };
    bedroomRange: {
        _min: {
            bedrooms: boolean;
        };
        _max: {
            bedrooms: boolean;
        };
    };
    bathroomRange: {
        _min: {
            bathrooms: boolean;
        };
        _max: {
            bathrooms: boolean;
        };
    };
};
/**
 * Sanitize and validate search filters
 */
export declare function sanitizeSearchFilters(filters: any): PropertySearchFilters;
/**
 * Sanitize and validate pagination options
 */
export declare function sanitizePaginationOptions(options: any): SearchPaginationOptions;
/**
 * Generate cache key for search results
 */
export declare function generateSearchCacheKey(filters: PropertySearchFilters, options: SearchPaginationOptions): string;
//# sourceMappingURL=searchHelpers.d.ts.map