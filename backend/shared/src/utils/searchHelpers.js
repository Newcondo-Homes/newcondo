"use strict";
// backend/shared/src/utils/searchHelpers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPropertySearchWhere = buildPropertySearchWhere;
exports.buildPropertySearchOrderBy = buildPropertySearchOrderBy;
exports.calculatePagination = calculatePagination;
exports.extractSearchKeywords = extractSearchKeywords;
exports.buildPropertySearchAggregations = buildPropertySearchAggregations;
exports.sanitizeSearchFilters = sanitizeSearchFilters;
exports.sanitizePaginationOptions = sanitizePaginationOptions;
exports.generateSearchCacheKey = generateSearchCacheKey;
const db_1 = require("@newcondo/db");
/**
 * Build Prisma where clause from search filters
 */
function buildPropertySearchWhere(filters) {
    const where = {
        status: db_1.PropertyStatus.PUBLISHED,
        adminApprovalStatus: db_1.AdminApprovalStatus.APPROVED,
    };
    if (filters.query) {
        const searchTerms = filters.query.trim().split(/\s+/);
        where.OR = searchTerms.map((term) => ({
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
        }
        else {
            where.propertyType = filters.propertyType;
        }
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const priceConditions = {};
        if (filters.minPrice !== undefined) {
            priceConditions.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
            priceConditions.lte = filters.maxPrice;
        }
        where.OR = [
            {
                structure: db_1.PropertyStructure.SINGLE_UNIT,
                price: priceConditions,
            },
            {
                structure: db_1.PropertyStructure.MULTI_FAMILY,
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
                structure: db_1.PropertyStructure.SINGLE_UNIT,
                bedrooms: bedroomConditions,
            },
            {
                structure: db_1.PropertyStructure.MULTI_FAMILY,
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
                structure: db_1.PropertyStructure.SINGLE_UNIT,
                bathrooms: bathroomConditions,
            },
            {
                structure: db_1.PropertyStructure.MULTI_FAMILY,
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
            where.city = { in: filters.city.map((c) => c.toLowerCase()) };
        }
        else {
            where.city = { equals: filters.city.toLowerCase(), mode: 'insensitive' };
        }
    }
    if (filters.state) {
        if (Array.isArray(filters.state)) {
            where.state = { in: filters.state.map((s) => s.toLowerCase()) };
        }
        else {
            where.state = { equals: filters.state.toLowerCase(), mode: 'insensitive' };
        }
    }
    if (filters.features) {
        const features = Array.isArray(filters.features) ? filters.features : [filters.features];
        where.OR = [
            ...(where.OR || []),
            {
                structure: db_1.PropertyStructure.SINGLE_UNIT,
                features: { hasSome: features },
            },
            {
                structure: db_1.PropertyStructure.MULTI_FAMILY,
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
                    structure: db_1.PropertyStructure.SINGLE_UNIT,
                    isAvailable: true,
                },
                {
                    structure: db_1.PropertyStructure.MULTI_FAMILY,
                    availableUnits: { gt: 0 },
                },
            ];
        }
        else {
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
function buildPropertySearchOrderBy(options) {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const orderByMap = {
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
function calculatePagination(page, limit, totalCount) {
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
function extractSearchKeywords(query) {
    if (!query || typeof query !== 'string')
        return [];
    return query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .slice(0, 10);
}
/**
 * Build property search aggregations for filters
 */
function buildPropertySearchAggregations() {
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
function sanitizeSearchFilters(filters) {
    const sanitized = {};
    if (filters.query && typeof filters.query === 'string') {
        sanitized.query = filters.query.trim().substring(0, 200);
    }
    if (filters.propertyType) {
        const validTypes = Object.values(db_1.PropertyType);
        if (Array.isArray(filters.propertyType)) {
            sanitized.propertyType = filters.propertyType.filter((type) => validTypes.includes(type));
        }
        else if (validTypes.includes(filters.propertyType)) {
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
                .map((num) => Number(num))
                .filter((num) => !isNaN(num) && num >= 0 && num <= 10);
        }
        else {
            const bedrooms = Number(filters.bedrooms);
            if (!isNaN(bedrooms) && bedrooms >= 0 && bedrooms <= 10) {
                sanitized.bedrooms = bedrooms;
            }
        }
    }
    if (filters.bathrooms !== undefined) {
        if (Array.isArray(filters.bathrooms)) {
            sanitized.bathrooms = filters.bathrooms
                .map((num) => Number(num))
                .filter((num) => !isNaN(num) && num >= 0 && num <= 10);
        }
        else {
            const bathrooms = Number(filters.bathrooms);
            if (!isNaN(bathrooms) && bathrooms >= 0 && bathrooms <= 10) {
                sanitized.bathrooms = bathrooms;
            }
        }
    }
    if (filters.city && typeof filters.city === 'string') {
        sanitized.city = filters.city.trim().substring(0, 100);
    }
    else if (Array.isArray(filters.city)) {
        sanitized.city = filters.city
            .filter((c) => typeof c === 'string')
            .map((c) => c.trim().substring(0, 100))
            .filter((c) => c.length > 0);
    }
    if (filters.state && typeof filters.state === 'string') {
        sanitized.state = filters.state.trim().substring(0, 100);
    }
    else if (Array.isArray(filters.state)) {
        sanitized.state = filters.state
            .filter((s) => typeof s === 'string')
            .map((s) => s.trim().substring(0, 100))
            .filter((s) => s.length > 0);
    }
    if (filters.features) {
        if (Array.isArray(filters.features)) {
            sanitized.features = filters.features
                .filter((f) => typeof f === 'string')
                .map((f) => f.trim())
                .filter((f) => f.length > 0)
                .slice(0, 20);
        }
        else if (typeof filters.features === 'string') {
            sanitized.features = filters.features.trim();
        }
    }
    if (filters.structure && Object.values(db_1.PropertyStructure).includes(filters.structure)) {
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
function sanitizePaginationOptions(options) {
    const sanitized = {};
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
function generateSearchCacheKey(filters, options) {
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
//# sourceMappingURL=searchHelpers.js.map