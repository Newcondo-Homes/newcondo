// apps/platform/hooks/useMapControls.ts
'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useGeolocation } from './useGeolocation';

interface Coordinates {
  lat: number;
  lng: number;
}

interface BoundaryPoint {
  lat: number;
  lng: number;
}

interface PropertyBoundary {
  id?: string;
  coordinates: BoundaryPoint[];
  area: number; // in square meters
  center: Coordinates;
  isComplete: boolean;
}

interface MapState {
  center: Coordinates;
  zoom: number;
  isDrawing: boolean;
  selectedMapType: 'satellite' | 'roadmap' | 'hybrid';
  showExistingBoundaries: boolean;
}

interface UseMapControlsOptions {
  initialCenter?: Coordinates;
  initialZoom?: number;
  maxBoundaryPoints?: number;
  minBoundaryArea?: number; // in square meters
  maxBoundaryArea?: number; // in square meters
}

interface UseMapControlsReturn {
  // Map state
  mapState: MapState;
  setMapState: React.Dispatch<React.SetStateAction<MapState>>;
  
  // Drawing state
  currentBoundary: PropertyBoundary | null;
  isDrawingMode: boolean;
  canCompleteDrawing: boolean;
  
  // Controls
  startDrawing: () => void;
  stopDrawing: () => void;
  clearBoundary: () => void;
  completeBoundary: () => PropertyBoundary | null;
  addBoundaryPoint: (point: BoundaryPoint) => void;
  removeBoundaryPoint: (index: number) => void;
  
  // Map type controls
  toggleMapType: () => void;
  setMapType: (type: 'satellite' | 'roadmap' | 'hybrid') => void;
  toggleExistingBoundaries: () => void;
  
  // Utility functions
  calculateBoundaryArea: (coordinates: BoundaryPoint[]) => number;
  getBoundaryCenter: (coordinates: BoundaryPoint[]) => Coordinates;
  isValidBoundary: (coordinates: BoundaryPoint[]) => boolean;
  
  // Geolocation
  userLocation: Coordinates | null;
  isLocationLoading: boolean;
  locationError: string | null;
  // requestUserLocation: () => void;
  requestUserLocation: () => Promise<Coordinates>;
  
  // Map instance
  mapRef: React.MutableRefObject<google.maps.Map | null>;
}

const DEFAULT_CENTER: Coordinates = { lat: 6.5244, lng: 3.3792 }; // Lagos, Nigeria
const DEFAULT_ZOOM = 18;
const MIN_BOUNDARY_POINTS = 3;
const MAX_BOUNDARY_POINTS = 20;
const MIN_BOUNDARY_AREA = 10; // 10 square meters
const MAX_BOUNDARY_AREA = 5000; // 5000 square meters

export const useMapControls = (options: UseMapControlsOptions = {}): UseMapControlsReturn => {
  const {
    initialCenter = DEFAULT_CENTER,
    initialZoom = DEFAULT_ZOOM,
    maxBoundaryPoints = MAX_BOUNDARY_POINTS,
    minBoundaryArea = MIN_BOUNDARY_AREA,
    maxBoundaryArea = MAX_BOUNDARY_AREA,
  } = options;

  // Map ref
  const mapRef = useRef<google.maps.Map | null>(null);

  // Get user location
  const { 
    coordinates: userLocation, 
    loading: isLocationLoading, 
    error: locationError, 
    getCurrentLocation: requestUserLocation 
  } = useGeolocation();

  // Map state
  const [mapState, setMapState] = useState<MapState>({
    center: userLocation || initialCenter,
    zoom: initialZoom,
    isDrawing: false,
    selectedMapType: 'satellite',
    showExistingBoundaries: true,
  });

  // Drawing state
  const [boundaryPoints, setBoundaryPoints] = useState<BoundaryPoint[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Update map center when user location is available
  useEffect(() => {
    if (userLocation && !isDrawingMode) {
      setMapState(prev => ({
        ...prev,
        center: userLocation,
      }));
    }
  }, [userLocation, isDrawingMode]);

  // Calculate boundary area using the Shoelace formula
  const calculateBoundaryArea = useCallback((coordinates: BoundaryPoint[]): number => {
    if (coordinates.length < 3) return 0;

    // Convert to meters using approximate conversion for small areas
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const earthRadius = 6371000; // Earth's radius in meters

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lat1 = toRadians(coordinates[i].lat);
      const lat2 = toRadians(coordinates[j].lat);
      const lng1 = toRadians(coordinates[i].lng);
      const lng2 = toRadians(coordinates[j].lng);

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * earthRadius * earthRadius) / 2;
    return area;
  }, []);

  // Get boundary center
  const getBoundaryCenter = useCallback((coordinates: BoundaryPoint[]): Coordinates => {
    if (coordinates.length === 0) return DEFAULT_CENTER;

    const sum = coordinates.reduce(
      (acc, point) => ({
        lat: acc.lat + point.lat,
        lng: acc.lng + point.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / coordinates.length,
      lng: sum.lng / coordinates.length,
    };
  }, []);

  // Validate boundary
  const isValidBoundary = useCallback((coordinates: BoundaryPoint[]): boolean => {
    if (coordinates.length < MIN_BOUNDARY_POINTS) return false;
    
    const area = calculateBoundaryArea(coordinates);
    return area >= minBoundaryArea && area <= maxBoundaryArea;
  }, [calculateBoundaryArea, minBoundaryArea, maxBoundaryArea]);

  // Current boundary
  const currentBoundary = useMemo((): PropertyBoundary | null => {
    if (boundaryPoints.length === 0) return null;

    const area = calculateBoundaryArea(boundaryPoints);
    const center = getBoundaryCenter(boundaryPoints);
    const isComplete = boundaryPoints.length >= MIN_BOUNDARY_POINTS;

    return {
      coordinates: boundaryPoints,
      area,
      center,
      isComplete,
    };
  }, [boundaryPoints, calculateBoundaryArea, getBoundaryCenter]);

  // Can complete drawing
  const canCompleteDrawing = useMemo(() => {
    return boundaryPoints.length >= MIN_BOUNDARY_POINTS && 
           isValidBoundary(boundaryPoints);
  }, [boundaryPoints, isValidBoundary]);

  // Start drawing
  const startDrawing = useCallback(() => {
    setIsDrawingMode(true);
    setBoundaryPoints([]);
    setMapState(prev => ({
      ...prev,
      isDrawing: true,
      selectedMapType: 'satellite', // Always use satellite for drawing
    }));
  }, []);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    setIsDrawingMode(false);
    setMapState(prev => ({
      ...prev,
      isDrawing: false,
    }));
  }, []);

  // Clear boundary
  const clearBoundary = useCallback(() => {
    setBoundaryPoints([]);
    setIsDrawingMode(false);
    setMapState(prev => ({
      ...prev,
      isDrawing: false,
    }));
  }, []);

  // Complete boundary
  const completeBoundary = useCallback((): PropertyBoundary | null => {
    if (!canCompleteDrawing || !currentBoundary) return null;

    const completedBoundary: PropertyBoundary = {
      ...currentBoundary,
      isComplete: true,
    };

    setIsDrawingMode(false);
    setMapState(prev => ({
      ...prev,
      isDrawing: false,
    }));

    return completedBoundary;
  }, [canCompleteDrawing, currentBoundary]);

  // Add boundary point
  const addBoundaryPoint = useCallback((point: BoundaryPoint) => {
    setBoundaryPoints(prev => {
      if (prev.length >= maxBoundaryPoints) return prev;
      
      // Prevent duplicate points (within 1 meter tolerance)
      const isDuplicate = prev.some(existingPoint => {
        const distance = calculateDistance(existingPoint, point);
        return distance < 1; // 1 meter tolerance
      });

      if (isDuplicate) return prev;

      return [...prev, point];
    });
  }, [maxBoundaryPoints]);

  // Remove boundary point
  const removeBoundaryPoint = useCallback((index: number) => {
    setBoundaryPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Toggle map type
  const toggleMapType = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      selectedMapType: prev.selectedMapType === 'satellite' ? 'roadmap' : 'satellite',
    }));
  }, []);

  // Set specific map type
  const setMapType = useCallback((type: 'satellite' | 'roadmap' | 'hybrid') => {
    setMapState(prev => ({
      ...prev,
      selectedMapType: type,
    }));
  }, []);

  // Toggle existing boundaries visibility
  const toggleExistingBoundaries = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      showExistingBoundaries: !prev.showExistingBoundaries,
    }));
  }, []);

  return {
    // Map state
    mapState,
    setMapState,
    
    // Drawing state
    currentBoundary,
    isDrawingMode,
    canCompleteDrawing,
    
    // Controls
    startDrawing,
    stopDrawing,
    clearBoundary,
    completeBoundary,
    addBoundaryPoint,
    removeBoundaryPoint,
    
    // Map type controls
    toggleMapType,
    setMapType,
    toggleExistingBoundaries,
    
    // Utility functions
    calculateBoundaryArea,
    getBoundaryCenter,
    isValidBoundary,
    
    // Geolocation
    userLocation,
    isLocationLoading,
    locationError,
    requestUserLocation,
    
    // Map instance
    mapRef,
  };
};

// Helper function to calculate distance between two points
function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}