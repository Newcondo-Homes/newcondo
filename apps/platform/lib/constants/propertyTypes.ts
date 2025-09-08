// apps/platform/lib/constants/propertyTypes.ts

import { PropertyType, PropertyStructure } from '@prisma/client'

/**
 * Property type configurations with display information
 */
export interface PropertyTypeConfig {
  value: PropertyType
  label: string
  description: string
  icon: string
  category: 'residential' | 'commercial'
  popularityScore: number // Higher score = more popular
  searchKeywords: string[]
}

/**
 * Property structure configurations
 */
export interface PropertyStructureConfig {
  value: PropertyStructure
  label: string
  description: string
  icon: string
  isMultiUnit: boolean
}

/**
 * Property type configurations
 */
export const PROPERTY_TYPES: Record<PropertyType, PropertyTypeConfig> = {
  [PropertyType.APARTMENT]: {
    value: PropertyType.APARTMENT,
    label: 'Apartment',
    description: 'Self-contained housing unit in a building',
    icon: 'Building2',
    category: 'residential',
    popularityScore: 90,
    searchKeywords: ['apartment', 'flat', 'unit', 'residential']
  },
  [PropertyType.HOUSE]: {
    value: PropertyType.HOUSE,
    label: 'House',
    description: 'Standalone residential building',
    icon: 'Home',
    category: 'residential',
    popularityScore: 85,
    searchKeywords: ['house', 'home', 'bungalow', 'detached', 'standalone']
  },
  [PropertyType.DUPLEX]: {
    value: PropertyType.DUPLEX,
    label: 'Duplex',
    description: 'Two-story house or semi-detached building',
    icon: 'Building',
    category: 'residential',
    popularityScore: 75,
    searchKeywords: ['duplex', 'two-story', 'semi-detached', 'maisonette']
  },
  [PropertyType.ROOM]: {
    value: PropertyType.ROOM,
    label: 'Room',
    description: 'Single room accommodation',
    icon: 'DoorOpen',
    category: 'residential',
    popularityScore: 60,
    searchKeywords: ['room', 'single room', 'bedsitter', 'studio']
  },
  [PropertyType.SHARED_APARTMENT]: {
    value: PropertyType.SHARED_APARTMENT,
    label: 'Shared Apartment',
    description: 'Shared accommodation with common areas',
    icon: 'Users',
    category: 'residential',
    popularityScore: 50,
    searchKeywords: ['shared', 'co-living', 'roommate', 'shared apartment']
  },
  [PropertyType.OFFICE]: {
    value: PropertyType.OFFICE,
    label: 'Office',
    description: 'Commercial office space',
    icon: 'Briefcase',
    category: 'commercial',
    popularityScore: 40,
    searchKeywords: ['office', 'workspace', 'commercial', 'business']
  },
  [PropertyType.SHOP]: {
    value: PropertyType.SHOP,
    label: 'Shop',
    description: 'Retail commercial space',
    icon: 'Store',
    category: 'commercial',
    popularityScore: 35,
    searchKeywords: ['shop', 'store', 'retail', 'commercial space']
  },
  [PropertyType.WAREHOUSE]: {
    value: PropertyType.WAREHOUSE,
    label: 'Warehouse',
    description: 'Large storage and distribution facility',
    icon: 'Warehouse',
    category: 'commercial',
    popularityScore: 25,
    searchKeywords: ['warehouse', 'storage', 'industrial', 'logistics']
  }
}

/**
 * Property structure configurations
 */
export const PROPERTY_STRUCTURES: Record<PropertyStructure, PropertyStructureConfig> = {
  [PropertyStructure.SINGLE_UNIT]: {
    value: PropertyStructure.SINGLE_UNIT,
    label: 'Single Unit',
    description: 'Traditional single property listing',
    icon: 'Home',
    isMultiUnit: false
  },
  [PropertyStructure.MULTI_FAMILY]: {
    value: PropertyStructure.MULTI_FAMILY,
    label: 'Multi-Family Building',
    description: 'Building with multiple rental units',
    icon: 'Building2',
    isMultiUnit: true
  }
}

/**
 * Get property types by category
 */
export function getPropertyTypesByCategory(category: 'residential' | 'commercial'): PropertyTypeConfig[] {
  return Object.values(PROPERTY_TYPES)
    .filter(type => type.category === category)
    .sort((a, b) => b.popularityScore - a.popularityScore)
}

/**
 * Get most popular property types
 */
export function getPopularPropertyTypes(limit = 5): PropertyTypeConfig[] {
  return Object.values(PROPERTY_TYPES)
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit)
}

/**
 * Search property types by query
 */
export function searchPropertyTypes(query: string): PropertyTypeConfig[] {
  const lowercaseQuery = query.toLowerCase().trim()
  
  if (!lowercaseQuery) return []
  
  return Object.values(PROPERTY_TYPES).filter(type =>
    type.label.toLowerCase().includes(lowercaseQuery) ||
    type.description.toLowerCase().includes(lowercaseQuery) ||
    type.searchKeywords.some(keyword => keyword.includes(lowercaseQuery))
  ).sort((a, b) => {
    // Prioritize exact matches in label
    const aLabelMatch = a.label.toLowerCase() === lowercaseQuery
    const bLabelMatch = b.label.toLowerCase() === lowercaseQuery
    
    if (aLabelMatch && !bLabelMatch) return -1
    if (!aLabelMatch && bLabelMatch) return 1
    
    // Prioritize startsWith over includes
    const aLabelStartsWith = a.label.toLowerCase().startsWith(lowercaseQuery)
    const bLabelStartsWith = b.label.toLowerCase().startsWith(lowercaseQuery)
    
    if (aLabelStartsWith && !bLabelStartsWith) return -1
    if (!aLabelStartsWith && bLabelStartsWith) return 1
    
    // Sort by popularity score as a final tie-breaker
    return b.popularityScore - a.popularityScore
  })
}

/**
 * Get a single property type config by its value
 */
export function getPropertyTypeConfig(type: PropertyType): PropertyTypeConfig | undefined {
  return PROPERTY_TYPES[type];
}

/**
 * Get a single property structure config by its value
 */
export function getPropertyStructureConfig(structure: PropertyStructure): PropertyStructureConfig | undefined {
  return PROPERTY_STRUCTURES[structure];
}

/**
 * Get all property types as an array
 */
export const ALL_PROPERTY_TYPES: PropertyTypeConfig[] = Object.values(PROPERTY_TYPES);

/**
 * Get all property structures as an array
 */
export const ALL_PROPERTY_STRUCTURES: PropertyStructureConfig[] = Object.values(PROPERTY_STRUCTURES);