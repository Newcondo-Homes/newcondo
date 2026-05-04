// apps/platform/hooks/useBoundaryMarking.ts
'use client'

import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { boundaryService, BoundaryCoordinates } from '@/lib/api/boundary';
import { PropertyBoundaryData } from '@/types/boundary';
import { toast } from 'sonner';

interface UseBoundaryMarkingProps {
  propertyId?: string;
  onBoundaryMarked?: (boundaryData: PropertyBoundaryData) => void;
  onConflictDetected?: (conflicts: any[]) => void;
}

export const useBoundaryMarking = ({
  propertyId,
  onBoundaryMarked,
  onConflictDetected,
}: UseBoundaryMarkingProps = {}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [boundaryData, setBoundaryData] = useState<PropertyBoundaryData | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [currentBoundary, setCurrentBoundary] = useState<BoundaryCoordinates[] | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  // Initialize map with user's location
  const initializeMap = useCallback(async (mapElement: HTMLElement) => {
    if (!user?.address) {
      toast.error('Please update your address in profile settings');
      return;
    }

    setIsLoading(true);
    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Initialize map centered on user's location
      const map = new google.maps.Map(mapElement, {
        center: { lat: latitude, lng: longitude },
        zoom: 20, // Max zoom for satellite view
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_CENTER,
          mapTypeIds: [
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.ROADMAP,
          ],
        },
      });

      mapRef.current = map;

      // Add user location marker
      new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285f4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Load existing boundaries for duplicate detection
      await loadExistingBoundaries(map);

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Unable to access your location. Please enable location services.');
      setIsLoading(false);
    }
  }, [user]);

  // Load existing property boundaries
  const loadExistingBoundaries = useCallback(async (map: google.maps.Map) => {
    try {
      const bounds = map.getBounds();
      if (!bounds) return;

      const center = map.getCenter();
      const existingBoundaries = await boundaryService.getNearbyBoundaries({
        latitude: center?.lat() ?? 0,
        longitude: center?.lng() ?? 0,
        radius: 500,
      });

      // Display existing boundaries as red overlays
      existingBoundaries.forEach((boundary) => {
        const polygon = new google.maps.Polygon({
          paths: boundary.coordinates,
          strokeColor: '#ff0000',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          fillColor: '#ff0000',
          fillOpacity: 0.2,
          clickable: false,
        });

        polygon.setMap(map);
      });
    } catch (error) {
      console.error('Error loading existing boundaries:', error);
    }
  }, []);

  // Start boundary marking mode
  const startMarking = useCallback(() => {
    if (!mapRef.current) return;

    setIsMarking(true);
    toast.info('Click on the map to start drawing your property boundary');

    const map = mapRef.current;
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        strokeColor: '#00ff00',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#00ff00',
        fillOpacity: 0.35,
        editable: true,
      },
    });

    drawingManager.setMap(map);

    // Handle polygon completion
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      const path = polygon.getPath();
      const coordinates: BoundaryCoordinates[] = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({
          lat: point.lat(),
          lng: point.lng(),
        });
      }

      setCurrentBoundary(coordinates);
      polygonRef.current = polygon;
      drawingManager.setDrawingMode(null);
      drawingManager.setOptions({ drawingControl: false });

      // Validate boundary
      validateBoundary(coordinates);
    });
  }, []);

  // Validate boundary for conflicts and size
  const validateBoundary = useCallback(async (coordinates: BoundaryCoordinates[]) => {
    if (!coordinates || coordinates.length < 3) {
      toast.error('Please draw a valid boundary with at least 3 points');
      return;
    }

    setIsLoading(true);
    try {

      const validation = await boundaryService.validateBoundary({
        coordinates, // now correctly BoundaryCoordinates[]
      });

      if (!validation.isValid) {
        setConflicts(validation.errors ?? []);
        onConflictDetected?.(validation.errors ?? []);
        toast.error('Boundary conflicts detected. Please resolve before proceeding.');
      } else {
        toast.success('Boundary validated successfully');
      }

      if (validation.warnings.length > 0) {
        toast.warning(validation.warnings[0]);
      }
    } catch (error) {
      console.error('Error validating boundary:', error);
      toast.error('Unable to validate boundary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, onConflictDetected]);

  // Save boundary
  const saveBoundary = useCallback(async () => {
    if (!currentBoundary || !user) {
      toast.error('Please draw a boundary first');
      return;
    }

    setIsLoading(true);
    try {
      const center = currentBoundary.reduce(
        (acc, coord) => ({ lat: acc.lat + coord.lat / currentBoundary.length, lng: acc.lng + coord.lng / currentBoundary.length }),
        { lat: 0, lng: 0 }
      );
      const response = await boundaryService.createBoundary({
        coordinates: currentBoundary,
        propertyId: propertyId ?? '',
        center,
        area: 0, // calculate if needed
        gpsCoordinates: center,
        address: '',
        city: '',
        state: '',
      });

      const mappedBoundaryData: PropertyBoundaryData = {
        id: response.id,
        propertyId: response.propertyId,
        coordinates: response.coordinates,
        center: response.center,
        area: response.area,
        perimeter: 0, // not returned by API, default to 0
        boundingBox: {
          north: Math.max(...response.coordinates.map(c => c.lat)),
          south: Math.min(...response.coordinates.map(c => c.lat)),
          east: Math.max(...response.coordinates.map(c => c.lng)),
          west: Math.min(...response.coordinates.map(c => c.lng)),
        },
        verified: response.verificationStatus === 'verified',
        verifiedBy: response.markedBy,
        confidence: 100,
        source: 'user_drawn',
        metadata: {
          zoomLevel: 20,
          mapType: 'satellite',
          timestamp: new Date(response.markedAt),
        },
      };

      setBoundaryData(mappedBoundaryData);
      setIsMarking(false);
      onBoundaryMarked?.(mappedBoundaryData);
      toast.success('Property boundary saved successfully');
    } catch (error) {
      console.error('Error saving boundary:', error);
      toast.error('Unable to save boundary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentBoundary, user, propertyId, onBoundaryMarked]);

  // Clear current boundary
  const clearBoundary = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setCurrentBoundary(null);
    setConflicts([]);
    setIsMarking(false);
  }, []);

  // Reset marking state
  const resetMarking = useCallback(() => {
    clearBoundary();
    setIsMarking(false);
  }, [clearBoundary]);

  const checkOverlaps = useCallback(async (
    coordinates: google.maps.LatLngLiteral[],
    propertyId?: string
  ) => {
    try {
      const result = await boundaryService.checkForDuplicates({
        coordinates: coordinates.map(c => ({ lat: c.lat, lng: c.lng })),
        center: coordinates[0], // or calculate actual center
        address: '',
      });
      return result.duplicateProperties.map(dup => ({
        propertyId: dup.id,
        overlapPercentage: dup.similarity * 100,
        ownerName: dup.owner.name,
        propertyTitle: dup.title,
      }));
    } catch (error) {
      console.error('Error checking overlaps:', error);
      return [];
    }
  }, []);
  return {
    isLoading,
    isMarking,
    boundaryData,
    conflicts,
    currentBoundary,
    initializeMap,
    startMarking,
    saveBoundary,
    clearBoundary,
    resetMarking,
    validateBoundary,
    checkOverlaps,
  };
};