import { useCallback } from 'react';
import { useComparisonStore } from '@/store/comparisonStore';
import type { PropertyForComparison } from '@/store/comparisonStore';
import { toast } from '@newcondo/ui';


const MAX_COMPARISON_ITEMS = 4; // Maximum number of properties that can be compared

/**
 * Custom hook for managing property comparison functionality
 * Allows users to compare multiple properties side by side
 * 
 * @returns Object with comparison management functions and state
 */
export function usePropertyComparison() {
  const {
    isComparisonOpen,
    addToComparison,
    removeFromComparison,
    clearComparison,
    openComparison,
    closeComparison,
    reorderComparison,
    getComparisonProperties,
    getComparisonStats: storeGetComparisonStats,
    isInComparison: storeIsInComparison,
    canAddMore,
  } = useComparisonStore();


  // Derive comparisonList from the store's ordered properties
  const comparisonList = useComparisonStore((state) => state.getComparisonProperties());


  /**
   * Check if a property is in comparison list
   */
  const isInComparison = useCallback((propertyId: string): boolean => storeIsInComparison(propertyId), [storeIsInComparison]);

  /**
   * Add property to comparison list
   */
  const addPropertyToComparison = useCallback((property: PropertyForComparison) => {
    // Check if already in comparison
    if (isInComparison(property.id)) {
      toast.info('Property is already in comparison');
      return false;
    }

    // Check maximum limit
    if (!canAddMore()) {
      toast.error(`You can only compare up to ${MAX_COMPARISON_ITEMS} properties at once`);
      return false;
    }
    const added = addToComparison(property);
    if (added) toast.success(`${property.title} added to comparison`);
    return added;
  }, [isInComparison, canAddMore, addToComparison]);

  /**
   * Remove property from comparison list
   */
  const removePropertyFromComparison = useCallback((propertyId: string) => {
    const property = comparisonList.find((p) => p.id === propertyId);
    if (!property) return false;

    removeFromComparison(propertyId);
    toast.success(`${property.title} removed from comparison`);
    return true;
  }, [comparisonList, removeFromComparison]);

  /**
   * Toggle property in comparison list
   */
  const togglePropertyComparison = useCallback((property: PropertyForComparison) => {
    if (isInComparison(property.id)) {
      return removePropertyFromComparison(property.id);
    } else {
      return addPropertyToComparison(property);
    }
  }, [isInComparison, addPropertyToComparison, removePropertyFromComparison]);

  /**
   * Clear all properties from comparison
   */
  const clearAllComparison = useCallback(() => {
    if (comparisonList.length === 0) {
      toast.info('Comparison list is already empty');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove all ${comparisonList.length} properties from comparison?`
    );

    if (confirmed) {
      clearComparison();
      toast.success('Comparison list cleared');
    }
  }, [comparisonList.length, clearComparison]);


  const handleOpenComparison = useCallback(() => {
    if (comparisonList.length === 0) {
      toast.info('Add properties to comparison first');
      return;
    }
    if (comparisonList.length < 2) {
      toast.info('Add at least 2 properties to start comparison');
      return;
    }
    openComparison();
  }, [comparisonList.length, openComparison]);

  /**
   * Move property to a different position in comparison list
   */
  const moveProperty = useCallback((fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 || fromIndex >= comparisonList.length ||
      toIndex < 0 || toIndex >= comparisonList.length
    ) return;
    reorderComparison(fromIndex, toIndex);
  }, [comparisonList, reorderComparison]);


  /**
   * Get comparison statistics
   */
  const getComparisonStats = useCallback(() => {
    if (comparisonList.length === 0) return null;
    
    return storeGetComparisonStats();
  }, [comparisonList]);

  /**
   * Export comparison data (for sharing or saving)
   */
  const exportComparison = useCallback(() => {
    if (comparisonList.length === 0) {
      toast.error('No properties to export');
      return null;
    }

    const exportData = {
      properties: comparisonList.map((property: PropertyForComparison) => ({
        id: property.id,
        title: property.title,
        price: property.price,
        currency: property.currency,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        propertyType: property.propertyType,
        city: property.city,
        state: property.state,
        features: property.features,
        address: property.address,
        isAvailable: property.isAvailable,
      })),
      stats: getComparisonStats(),
      exportedAt: new Date().toISOString(),
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `property-comparison-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success('Comparison data exported');

    return exportData;
  }, [comparisonList, getComparisonStats]);

  /**
   * Share comparison via URL (for web sharing)
   */
  const shareComparison = useCallback(async () => {
    if (comparisonList.length === 0) {
      toast.error('No properties to share');
      return;
    }

    const propertyIds = comparisonList.map(p => p.id);
    const shareUrl = `${window.location.origin}/compare?properties=${propertyIds.join(',')}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Property Comparison',
          text: `Compare ${comparisonList.length} properties`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Comparison link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing comparison:', error);
      toast.error('Failed to share comparison');
    }
  }, [comparisonList]);

  /**
   * Get available spaces for more properties
   */
  const getAvailableSlots = useCallback((): number => {
    return MAX_COMPARISON_ITEMS - comparisonList.length;
  }, [comparisonList.length]);

  /**
   * Check if comparison is ready (has at least 2 properties)
   */
  const isComparisonReady = useCallback((): boolean => {
    return comparisonList.length >= 2;
  }, [comparisonList.length]);

  return {
    // State
    comparisonList,
    isComparisonOpen,
    comparisonCount: comparisonList.length,
    maxComparisonItems: MAX_COMPARISON_ITEMS,
    availableSlots: getAvailableSlots(),

    // Status checks
    isInComparison,
    isComparisonFull: !canAddMore(),
    isComparisonReady: comparisonList.length >= 2,

    // Actions
    addPropertyToComparison,
    removePropertyFromComparison,
    togglePropertyComparison,
    clearAllComparison,
    openComparison,
    closeComparison,
    moveProperty,

    // Utilities
    getComparisonStats,
    exportComparison,
    shareComparison,
  };
}