// apps/platform/store/duplicateStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DuplicateProperty {
  id: string;
  title: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  boundaryCoordinates: Array<{
    lat: number;
    lng: number;
  }>;
  ownerId: string;
  ownerName: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'RENTED' | 'UNAVAILABLE';
  markedAt: string;
  buildingFingerprint: string;
}

interface DuplicateConflict {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  status: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED';
  reportedBy?: string;
  conflictReason: string;
  boundaries: {
    original: Array<{ lat: number; lng: number }>;
    duplicate: Array<{ lat: number; lng: number }>;
  };
  overlapPercentage: number;
  createdAt: string;
}

interface BoundaryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  overlapDetected: boolean;
  overlappingProperties: DuplicateProperty[];
  suggestedBoundary?: Array<{ lat: number; lng: number }>;
}

interface DuplicateStore {
  // State
  duplicateProperties: DuplicateProperty[];
  conflicts: DuplicateConflict[];
  isLoading: boolean;
  error: string | null;

  // Boundary validation
  validationResult: BoundaryValidationResult | null;
  isValidating: boolean;

  // Map overlay state
  showDuplicateOverlays: boolean;
  selectedConflict: DuplicateConflict | null;

  // Search and filtering
  searchRadius: number; // in meters
  searchCenter: { lat: number; lng: number } | null;

  // Actions
  setDuplicateProperties: (properties: DuplicateProperty[]) => void;
  setConflicts: (conflicts: DuplicateConflict[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Boundary validation actions
  validateBoundary: (boundary: Array<{ lat: number; lng: number }>) => Promise<BoundaryValidationResult>;
  clearValidation: () => void;
  calculateDistance: (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ) => number;

  calculateBoundaryArea: (
    boundary: Array<{ lat: number; lng: number }>
  ) => number;

  // Duplicate detection actions
  checkForDuplicates: (coordinates: { lat: number; lng: number }, radius?: number) => Promise<DuplicateProperty[]>;
  reportDuplicate: (originalId: string, duplicateId: string, reason: string) => Promise<void>;

  // Conflict resolution
  selectConflict: (conflict: DuplicateConflict | null) => void;
  resolveConflict: (conflictId: string, resolution: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE') => Promise<void>;

  // Map overlay controls
  toggleDuplicateOverlays: () => void;
  setSearchRadius: (radius: number) => void;
  setSearchCenter: (center: { lat: number; lng: number } | null) => void;

  // Property fingerprinting
  generatePropertyFingerprint: (
    coordinates: { lat: number; lng: number },
    boundary: Array<{ lat: number; lng: number }>,
    buildingFeatures: string[]
  ) => string;

  // Utility actions
  calculateOverlapPercentage: (
    boundary1: Array<{ lat: number; lng: number }>,
    boundary2: Array<{ lat: number; lng: number }>
  ) => number;

  isWithinBoundary: (
    point: { lat: number; lng: number },
    boundary: Array<{ lat: number; lng: number }>
  ) => boolean;

  // Reset actions
  reset: () => void;
  clearError: () => void;
}

const useDuplicateStore = create<DuplicateStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      duplicateProperties: [],
      conflicts: [],
      isLoading: false,
      error: null,
      validationResult: null,
      isValidating: false,
      showDuplicateOverlays: true,
      selectedConflict: null,
      searchRadius: 500, // 500 meters default
      searchCenter: null,

      // Basic setters
      setDuplicateProperties: (properties) => set({ duplicateProperties: properties }),
      setConflicts: (conflicts) => set({ conflicts }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Boundary validation
      validateBoundary: async (boundary) => {
        set({ isValidating: true, error: null });

        try {
          // Calculate boundary area (simplified)
          const area = get().calculateBoundaryArea(boundary);
          const errors: string[] = [];
          const warnings: string[] = [];

          // Validate boundary size
          if (area > 10000) { // 10,000 sq meters max
            errors.push('Property boundary is too large (max 10,000 sq meters)');
          }

          if (area < 10) { // 10 sq meters min
            errors.push('Property boundary is too small (min 10 sq meters)');
          }

          // Check for overlaps with existing properties
          const { duplicateProperties } = get();
          const overlappingProperties: DuplicateProperty[] = [];

          for (const property of duplicateProperties) {
            const overlapPercentage = get().calculateOverlapPercentage(boundary, property.boundaryCoordinates);
            if (overlapPercentage > 10) { // 10% overlap threshold
              overlappingProperties.push(property);
            }
          }

          if (overlappingProperties.length > 0) {
            warnings.push(`Boundary overlaps with ${overlappingProperties.length} existing properties`);
          }

          const result: BoundaryValidationResult = {
            isValid: errors.length === 0,
            errors,
            warnings,
            overlapDetected: overlappingProperties.length > 0,
            overlappingProperties,
          };

          set({ validationResult: result, isValidating: false });
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Validation failed';
          set({ error: errorMessage, isValidating: false });
          throw error;
        }
      },

      clearValidation: () => set({ validationResult: null }),

      // Duplicate detection
      checkForDuplicates: async (coordinates, radius = 500) => {
        set({ isLoading: true, error: null });

        try {
          const { duplicateProperties } = get();
          const nearby = duplicateProperties.filter(property => {
            const distance = get().calculateDistance(coordinates, property.coordinates);
            return distance <= radius;
          });

          set({ isLoading: false });
          return nearby;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to check duplicates';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      reportDuplicate: async (originalId, duplicateId, reason) => {
        set({ isLoading: true, error: null });

        try {
          // This would typically make an API call
          const newConflict: DuplicateConflict = {
            id: `conflict_${Date.now()}`,
            originalPropertyId: originalId,
            duplicatePropertyId: duplicateId,
            status: 'PENDING',
            conflictReason: reason,
            boundaries: {
              original: [],
              duplicate: []
            },
            overlapPercentage: 0,
            createdAt: new Date().toISOString()
          };

          set(state => ({
            conflicts: [...state.conflicts, newConflict],
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to report duplicate';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Conflict resolution
      selectConflict: (conflict) => set({ selectedConflict: conflict }),

      resolveConflict: async (conflictId, resolution) => {
        set({ isLoading: true, error: null });

        try {
          set(state => ({
            conflicts: state.conflicts.map(conflict =>
              conflict.id === conflictId
                ? { ...conflict, status: resolution }
                : conflict
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to resolve conflict';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Map controls
      toggleDuplicateOverlays: () => set(state => ({ showDuplicateOverlays: !state.showDuplicateOverlays })),
      setSearchRadius: (radius) => set({ searchRadius: radius }),
      setSearchCenter: (center) => set({ searchCenter: center }),

      // Property fingerprinting
      generatePropertyFingerprint: (coordinates, boundary, buildingFeatures) => {
        const coordString = `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}`;
        const boundaryString = boundary.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
        const featuresString = buildingFeatures.sort().join(',');

        // Simple hash-like fingerprint (in production, use proper hashing)
        const fingerprint = btoa(`${coordString}:${boundaryString}:${featuresString}`);
        return fingerprint;
      },

      // Utility functions
      calculateOverlapPercentage: (boundary1, boundary2) => {
        // Simplified overlap calculation
        // In production, use proper geometric calculations
        const area1 = get().calculateBoundaryArea(boundary1);
        const area2 = get().calculateBoundaryArea(boundary2);

        // Mock overlap calculation
        const overlapArea = Math.min(area1, area2) * 0.1; // 10% mock overlap
        return (overlapArea / Math.max(area1, area2)) * 100;
      },

      isWithinBoundary: (point, boundary) => {
        // Ray casting algorithm for point-in-polygon
        let inside = false;
        for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
          if (((boundary[i].lat > point.lat) !== (boundary[j].lat > point.lat)) &&
            (point.lng < (boundary[j].lng - boundary[i].lng) * (point.lat - boundary[i].lat) / (boundary[j].lat - boundary[i].lat) + boundary[i].lng)) {
            inside = !inside;
          }
        }
        return inside;
      },

      // Helper functions
      calculateDistance: (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = point1.lat * Math.PI / 180;
        const φ2 = point2.lat * Math.PI / 180;
        const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
        const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
      },

      calculateBoundaryArea: (boundary: Array<{ lat: number; lng: number }>) => {
        // Simplified area calculation using shoelace formula
        let area = 0;
        for (let i = 0; i < boundary.length; i++) {
          const j = (i + 1) % boundary.length;
          area += boundary[i].lat * boundary[j].lng;
          area -= boundary[j].lat * boundary[i].lng;
        }
        return Math.abs(area) / 2 * 111320 * 111320; // Convert to square meters (approximate)
      },

      // Reset actions
      reset: () => set({
        duplicateProperties: [],
        conflicts: [],
        isLoading: false,
        error: null,
        validationResult: null,
        isValidating: false,
        selectedConflict: null,
        searchCenter: null,
      }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'duplicate-store',
    }
  )
);

export default useDuplicateStore;