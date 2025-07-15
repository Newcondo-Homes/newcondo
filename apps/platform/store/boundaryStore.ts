import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface BoundaryCoordinates {
  lat: number;
  lng: number;
}

export interface PropertyBoundary {
  id: string;
  propertyId: string;
  coordinates: BoundaryCoordinates[];
  area: number; // in square meters
  perimeter: number; // in meters
  isVerified: boolean;
  markedBy?: string;
  markedAt?: Date;
  images?: string[];
  buildingFingerprint?: string;
}

export interface BoundaryValidationError {
  type: 'OVERSIZED' | 'OVERLAPPING' | 'INVALID_SHAPE' | 'TOO_SMALL' | 'OUTSIDE_BOUNDS';
  message: string;
  coordinates?: BoundaryCoordinates[];
}

export interface OverlappingProperty {
  id: string;
  title: string;
  coordinates: BoundaryCoordinates[];
  overlapPercentage: number;
  isVerified: boolean;
  owner: {
    id: string;
    name: string;
  };
}

export interface BoundaryConflict {
  id: string;
  propertyId: string;
  conflictingPropertyId: string;
  conflictType: 'OVERLAP' | 'BOUNDARY_DISPUTE' | 'DUPLICATE_CLAIM';
  status: 'PENDING' | 'RESOLVED' | 'ESCALATED';
  description: string;
  reportedAt: Date;
  reportedBy: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface DrawingState {
  isDrawing: boolean;
  currentPath: BoundaryCoordinates[];
  isComplete: boolean;
  mode: 'DRAW' | 'EDIT' | 'VIEW';
}

export interface MapState {
  center: BoundaryCoordinates;
  zoom: number;
  mapType: 'satellite' | 'roadmap' | 'hybrid';
  showExistingBoundaries: boolean;
  showConflicts: boolean;
  selectedPropertyId?: string;
}

export interface BoundaryStore {
  // Current boundary being worked on
  currentBoundary: PropertyBoundary | null;
  
  // Drawing state
  drawingState: DrawingState;
  
  // Map state
  mapState: MapState;
  
  // Validation
  validationErrors: BoundaryValidationError[];
  isValidating: boolean;
  
  // Existing boundaries (for conflict detection)
  existingBoundaries: PropertyBoundary[];
  overlappingProperties: OverlappingProperty[];
  
  // Conflicts
  boundaryConflicts: BoundaryConflict[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isLoadingExisting: boolean;
  
  // Actions
  setCurrentBoundary: (boundary: PropertyBoundary | null) => void;
  updateBoundaryCoordinates: (coordinates: BoundaryCoordinates[]) => void;
  
  // Drawing actions
  startDrawing: () => void;
  stopDrawing: () => void;
  addCoordinate: (coordinate: BoundaryCoordinates) => void;
  removeLastCoordinate: () => void;
  completeBoundary: () => void;
  clearDrawing: () => void;
  setDrawingMode: (mode: DrawingState['mode']) => void;
  
  // Map actions
  setMapCenter: (center: BoundaryCoordinates) => void;
  setMapZoom: (zoom: number) => void;
  setMapType: (mapType: MapState['mapType']) => void;
  toggleExistingBoundaries: () => void;
  toggleConflictDisplay: () => void;
  setSelectedProperty: (propertyId: string | undefined) => void;
  
  // Validation actions
  validateBoundary: (coordinates: BoundaryCoordinates[]) => Promise<void>;
  clearValidationErrors: () => void;
  
  // Boundary management
  loadExistingBoundaries: (area: { bounds: BoundaryCoordinates[] }) => Promise<void>;
  saveBoundary: (propertyId: string, coordinates: BoundaryCoordinates[]) => Promise<void>;
  deleteBoundary: (propertyId: string) => Promise<void>;
  
  // Conflict management
  checkForConflicts: (coordinates: BoundaryCoordinates[]) => Promise<void>;
  reportConflict: (conflict: Omit<BoundaryConflict, 'id' | 'reportedAt'>) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: string) => Promise<void>;
  
  // Utility functions
  calculateArea: (coordinates: BoundaryCoordinates[]) => number;
  calculatePerimeter: (coordinates: BoundaryCoordinates[]) => number;
  isPointInBoundary: (point: BoundaryCoordinates, boundary: BoundaryCoordinates[]) => boolean;
  getBoundaryCenter: (coordinates: BoundaryCoordinates[]) => BoundaryCoordinates;
  hasSelfIntersections: (coordinates: BoundaryCoordinates[]) => boolean;
  checkOverlaps: (coordinates: BoundaryCoordinates[]) => Promise<OverlappingProperty[]>;
  
  // Reset
  reset: () => void;
}

const initialDrawingState: DrawingState = {
  isDrawing: false,
  currentPath: [],
  isComplete: false,
  mode: 'VIEW'
};

const initialMapState: MapState = {
  center: { lat: 6.5244, lng: 3.3792 }, // Lagos, Nigeria
  zoom: 18,
  mapType: 'satellite',
  showExistingBoundaries: true,
  showConflicts: true
};

export const useBoundaryStore = create<BoundaryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentBoundary: null,
      drawingState: initialDrawingState,
      mapState: initialMapState,
      validationErrors: [],
      isValidating: false,
      existingBoundaries: [],
      overlappingProperties: [],
      boundaryConflicts: [],
      isLoading: false,
      isSaving: false,
      isLoadingExisting: false,

      // Basic setters
      setCurrentBoundary: (boundary) => {
        set({ currentBoundary: boundary });
      },

      updateBoundaryCoordinates: (coordinates) => {
        const { currentBoundary } = get();
        if (currentBoundary) {
          set({
            currentBoundary: {
              ...currentBoundary,
              coordinates,
              area: get().calculateArea(coordinates),
              perimeter: get().calculatePerimeter(coordinates)
            }
          });
        }
      },

      // Drawing actions
      startDrawing: () => {
        set({
          drawingState: {
            ...get().drawingState,
            isDrawing: true,
            currentPath: [],
            isComplete: false,
            mode: 'DRAW'
          }
        });
        get().clearValidationErrors();
      },

      stopDrawing: () => {
        set({
          drawingState: {
            ...get().drawingState,
            isDrawing: false
          }
        });
      },

      addCoordinate: (coordinate) => {
        const { drawingState } = get();
        if (drawingState.isDrawing) {
          const newPath = [...drawingState.currentPath, coordinate];
          set({
            drawingState: {
              ...drawingState,
              currentPath: newPath
            }
          });
        }
      },

      removeLastCoordinate: () => {
        const { drawingState } = get();
        if (drawingState.currentPath.length > 0) {
          const newPath = drawingState.currentPath.slice(0, -1);
          set({
            drawingState: {
              ...drawingState,
              currentPath: newPath
            }
          });
        }
      },

      completeBoundary: async () => {
        const { drawingState } = get();
        if (drawingState.currentPath.length >= 3) {
          set({
            drawingState: {
              ...drawingState,
              isComplete: true,
              isDrawing: false,
              mode: 'VIEW'
            }
          });
          
          // Validate the completed boundary
          await get().validateBoundary(drawingState.currentPath);
          
          // Check for conflicts
          await get().checkForConflicts(drawingState.currentPath);
        }
      },

      clearDrawing: () => {
        set({
          drawingState: {
            ...initialDrawingState,
            mode: get().drawingState.mode
          }
        });
        get().clearValidationErrors();
      },

      setDrawingMode: (mode) => {
        set({
          drawingState: {
            ...get().drawingState,
            mode
          }
        });
      },

      // Map actions
      setMapCenter: (center) => {
        set({
          mapState: {
            ...get().mapState,
            center
          }
        });
      },

      setMapZoom: (zoom) => {
        set({
          mapState: {
            ...get().mapState,
            zoom
          }
        });
      },

      setMapType: (mapType) => {
        set({
          mapState: {
            ...get().mapState,
            mapType
          }
        });
      },

      toggleExistingBoundaries: () => {
        set({
          mapState: {
            ...get().mapState,
            showExistingBoundaries: !get().mapState.showExistingBoundaries
          }
        });
      },

      toggleConflictDisplay: () => {
        set({
          mapState: {
            ...get().mapState,
            showConflicts: !get().mapState.showConflicts
          }
        });
      },

      setSelectedProperty: (propertyId) => {
        set({
          mapState: {
            ...get().mapState,
            selectedPropertyId: propertyId
          }
        });
      },

      // Validation actions
      validateBoundary: async (coordinates) => {
        set({ isValidating: true });
        
        try {
          const errors: BoundaryValidationError[] = [];
          
          // Check minimum area (e.g., 50 square meters)
          const area = get().calculateArea(coordinates);
          if (area < 50) {
            errors.push({
              type: 'TOO_SMALL',
              message: 'Property boundary must be at least 50 square meters'
            });
          }
          
          // Check maximum area (e.g., 5000 square meters for residential)
          if (area > 5000) {
            errors.push({
              type: 'OVERSIZED',
              message: 'Property boundary exceeds maximum allowed size of 5000 square meters'
            });
          }
          
          // Check for self-intersections
          if (get().hasSelfIntersections(coordinates)) {
            errors.push({
              type: 'INVALID_SHAPE',
              message: 'Property boundary cannot intersect with itself'
            });
          }
          
          // Check for overlaps with existing boundaries
          const overlaps = await get().checkOverlaps(coordinates);
          if (overlaps.length > 0) {
            errors.push({
              type: 'OVERLAPPING',
              message: `Property boundary overlaps with ${overlaps.length} existing propert${overlaps.length === 1 ? 'y' : 'ies'}`,
              coordinates: overlaps[0]?.coordinates
            });
          }
          
          set({ validationErrors: errors });
        } catch (error) {
          console.error('Boundary validation error:', error);
          set({
            validationErrors: [{
              type: 'INVALID_SHAPE',
              message: 'Error validating boundary. Please try again.'
            }]
          });
        } finally {
          set({ isValidating: false });
        }
      },

      clearValidationErrors: () => {
        set({ validationErrors: [] });
      },

      // Boundary management
      loadExistingBoundaries: async (area) => {
        set({ isLoadingExisting: true });
        
        try {
          // Mock API call - replace with actual API
          const response = await fetch('/api/boundaries/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bounds: area.bounds })
          });
          
          const boundaries = await response.json();
          set({ existingBoundaries: boundaries });
        } catch (error) {
          console.error('Error loading existing boundaries:', error);
        } finally {
          set({ isLoadingExisting: false });
        }
      },

      saveBoundary: async (propertyId, coordinates) => {
        set({ isSaving: true });
        
        try {
          const boundary: PropertyBoundary = {
            id: `boundary_${Date.now()}`,
            propertyId,
            coordinates,
            area: get().calculateArea(coordinates),
            perimeter: get().calculatePerimeter(coordinates),
            isVerified: false,
            markedAt: new Date()
          };
          
          // Mock API call - replace with actual API
          const response = await fetch('/api/boundaries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(boundary)
          });
          
          if (response.ok) {
            set({
              currentBoundary: boundary,
              existingBoundaries: [...get().existingBoundaries, boundary]
            });
          }
        } catch (error) {
          console.error('Error saving boundary:', error);
        } finally {
          set({ isSaving: false });
        }
      },

      deleteBoundary: async (propertyId) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`/api/boundaries/${propertyId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            set({
              existingBoundaries: get().existingBoundaries.filter(b => b.propertyId !== propertyId)
            });
          }
        } catch (error) {
          console.error('Error deleting boundary:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Conflict management
      checkForConflicts: async (coordinates) => {
        try {
          const response = await fetch('/api/boundaries/conflicts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates })
          });
          
          const conflicts = await response.json();
          set({ overlappingProperties: conflicts });
        } catch (error) {
          console.error('Error checking for conflicts:', error);
        }
      },

      reportConflict: async (conflict) => {
        try {
          const newConflict: BoundaryConflict = {
            ...conflict,
            id: `conflict_${Date.now()}`,
            reportedAt: new Date()
          };
          
          const response = await fetch('/api/boundary-conflicts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConflict)
          });
          
          if (response.ok) {
            set({
              boundaryConflicts: [...get().boundaryConflicts, newConflict]
            });
          }
        } catch (error) {
          console.error('Error reporting conflict:', error);
        }
      },

      resolveConflict: async (conflictId, resolution) => {
        try {
          const response = await fetch(`/api/boundary-conflicts/${conflictId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution })
          });
          
          if (response.ok) {
            set({
              boundaryConflicts: get().boundaryConflicts.map(conflict =>
                conflict.id === conflictId
                  ? { ...conflict, status: 'RESOLVED' as const, resolution, resolvedAt: new Date() }
                  : conflict
              )
            });
          }
        } catch (error) {
          console.error('Error resolving conflict:', error);
        }
      },

      // Utility functions
      calculateArea: (coordinates) => {
        if (coordinates.length < 3) return 0;
        
        // Using the Shoelace formula
        let area = 0;
        const n = coordinates.length;
        
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          area += coordinates[i].lat * coordinates[j].lng;
          area -= coordinates[j].lat * coordinates[i].lng;
        }
        
        area = Math.abs(area) / 2;
        
        // Convert to square meters (rough approximation)
        // 1 degree ≈ 111,000 meters at equator
        return area * 111000 * 111000;
      },

      calculatePerimeter: (coordinates) => {
        if (coordinates.length < 2) return 0;
        
        let perimeter = 0;
        const n = coordinates.length;
        
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const dx = (coordinates[j].lng - coordinates[i].lng) * 111000;
          const dy = (coordinates[j].lat - coordinates[i].lat) * 111000;
          perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        
        return perimeter;
      },

      isPointInBoundary: (point, boundary) => {
        if (boundary.length < 3) return false;
        
        let inside = false;
        const n = boundary.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const xi = boundary[i].lat;
          const yi = boundary[i].lng;
          const xj = boundary[j].lat;
          const yj = boundary[j].lng;
          
          if (((yi > point.lng) !== (yj > point.lng)) &&
              (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
            inside = !inside;
          }
        }
        
        return inside;
      },

      getBoundaryCenter: (coordinates) => {
        if (coordinates.length === 0) return { lat: 0, lng: 0 };
        
        const sum = coordinates.reduce(
          (acc, coord) => ({
            lat: acc.lat + coord.lat,
            lng: acc.lng + coord.lng
          }),
          { lat: 0, lng: 0 }
        );
        
        return {
          lat: sum.lat / coordinates.length,
          lng: sum.lng / coordinates.length
        };
      },

      hasSelfIntersections: (coordinates) => {
        if (coordinates.length < 4) return false;
        
        const n = coordinates.length;
        
        for (let i = 0; i < n; i++) {
          for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue; // Skip adjacent segments
            
            const p1 = coordinates[i];
            const p2 = coordinates[(i + 1) % n];
            const p3 = coordinates[j];
            const p4 = coordinates[(j + 1) % n];
            
            if (get().doLinesIntersect(p1, p2, p3, p4)) {
              return true;
            }
          }
        }
        
        return false;
      },

      doLinesIntersect: (p1, p2, p3, p4) => {
        const ccw = (A: BoundaryCoordinates, B: BoundaryCoordinates, C: BoundaryCoordinates) => {
          return (C.lng - A.lng) * (B.lat - A.lat) > (B.lng - A.lng) * (C.lat - A.lat);
        };
        
        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
      },

      checkOverlaps: async (coordinates) => {
        try {
          const response = await fetch('/api/boundaries/overlaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates })
          });
          
          return await response.json();
        } catch (error) {
          console.error('Error checking overlaps:', error);
          return [];
        }
      },

      // Reset
      reset: () => {
        set({
          currentBoundary: null,
          drawingState: initialDrawingState,
          mapState: initialMapState,
          validationErrors: [],
          isValidating: false,
          existingBoundaries: [],
          overlappingProperties: [],
          boundaryConflicts: [],
          isLoading: false,
          isSaving: false,
          isLoadingExisting: false
        });
      }
    }),
    { name: 'boundary-store' }
  )
);