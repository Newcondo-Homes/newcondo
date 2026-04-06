'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import {
  Square,
  Move,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoundaryPoint {
  lat: number;
  lng: number;
}

interface BoundaryToolsProps {
  mapRef: React.RefObject<google.maps.Map>;
  onBoundaryComplete: (boundary: BoundaryPoint[]) => void;
  onBoundaryCancel: () => void;
  existingBoundaries?: BoundaryPoint[][];
  userLocation?: { lat: number; lng: number };
  className?: string;
}

type DrawingMode = 'none' | 'rectangle' | 'polygon' | 'move';

export default function BoundaryTools({
  mapRef,
  onBoundaryComplete,
  onBoundaryCancel,
  existingBoundaries = [],
  userLocation,
  className
}: BoundaryToolsProps) {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [currentBoundary, setCurrentBoundary] = useState<BoundaryPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showExistingBoundaries, setShowExistingBoundaries] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const currentOverlayRef = useRef<google.maps.Polygon | google.maps.Rectangle | null>(null);
  const existingOverlaysRef = useRef<google.maps.Polygon[]>([]);

  // Initialize drawing manager
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#2563eb',
        fillOpacity: 0.3,
        strokeColor: '#2563eb',
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1
      },
      rectangleOptions: {
        fillColor: '#2563eb',
        fillOpacity: 0.3,
        strokeColor: '#2563eb',
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1
      }
    });

    drawingManager.setMap(mapRef.current);
    drawingManagerRef.current = drawingManager;

    // Handle overlay completion
    const handleOverlayComplete = (event: google.maps.drawing.OverlayCompleteEvent) => {
      const overlay = event.overlay;

      if (currentOverlayRef.current) {
        currentOverlayRef.current.setMap(null);
      }

      // currentOverlayRef.current = overlay;
      if (
        event.type === google.maps.drawing.OverlayType.POLYGON ||
        event.type === google.maps.drawing.OverlayType.RECTANGLE
      ) {
        currentOverlayRef.current = overlay as google.maps.Polygon | google.maps.Rectangle;
      }
      setIsDrawing(false);

      // Extract boundary points
      let boundaryPoints: BoundaryPoint[] = [];

      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = overlay as google.maps.Polygon;
        const path = polygon.getPath();
        boundaryPoints = path.getArray().map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));
      } else if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const rectangle = overlay as google.maps.Rectangle;
        const bounds = rectangle.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          boundaryPoints = [
            { lat: ne.lat(), lng: sw.lng() },
            { lat: ne.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: ne.lng() },
            { lat: sw.lat(), lng: sw.lng() }
          ];
        }
      }

      setCurrentBoundary(boundaryPoints);

      // Validate boundary
      validateBoundary(boundaryPoints);
    };

    drawingManager.addListener('overlaycomplete', handleOverlayComplete);

    return () => {
      if (drawingManagerRef.current) {
        google.maps.event.clearListeners(drawingManagerRef.current, 'overlaycomplete');
        drawingManagerRef.current.setMap(null);
      }
    };
  }, [mapRef]);

  // Display existing boundaries
  useEffect(() => {
    if (!mapRef.current || !showExistingBoundaries) return;

    // Clear existing overlays
    existingOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    existingOverlaysRef.current = [];

    // Add existing boundaries as red overlays
    existingBoundaries.forEach(boundary => {
      if (boundary.length > 0) {
        const polygon = new google.maps.Polygon({
          paths: boundary,
          fillColor: '#ef4444',
          fillOpacity: 0.4,
          strokeColor: '#dc2626',
          strokeWeight: 2,
          clickable: false,
          zIndex: 0
        });

        polygon.setMap(mapRef.current);
        existingOverlaysRef.current.push(polygon);
      }
    });

    return () => {
      existingOverlaysRef.current.forEach(overlay => overlay.setMap(null));
      existingOverlaysRef.current = [];
    };
  }, [existingBoundaries, showExistingBoundaries, mapRef]);

  // Toggle map type
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(mapType);
    }
  }, [mapType, mapRef]);

  const validateBoundary = useCallback((boundary: BoundaryPoint[]) => {
    setIsValidating(true);
    setError(null);

    // Basic validation
    if (boundary.length < 3) {
      setError('Boundary must have at least 3 points');
      setIsValidating(false);
      return;
    }

    // Check for minimum area (e.g., at least 10 square meters)
    const area = calculatePolygonArea(boundary);
    if (area < 10) {
      setError('Property boundary is too small. Minimum area is 10 square meters.');
      setIsValidating(false);
      return;
    }

    // Check for maximum area (e.g., no more than 10,000 square meters for residential)
    if (area > 10000) {
      setError('Property boundary is too large. Maximum area is 10,000 square meters.');
      setIsValidating(false);
      return;
    }

    // Check for overlaps with existing boundaries
    const hasOverlap = existingBoundaries.some(existing =>
      checkBoundaryOverlap(boundary, existing)
    );

    if (hasOverlap) {
      setError('This property boundary overlaps with an existing property. Please adjust your boundary or contact support if you believe this is an error.');
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
  }, [existingBoundaries]);

  const calculatePolygonArea = (boundary: BoundaryPoint[]): number => {
    if (boundary.length < 3) return 0;

    let area = 0;
    const earthRadius = 6371000; // Earth's radius in meters

    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      const xi = boundary[i].lng * Math.PI / 180;
      const yi = boundary[i].lat * Math.PI / 180;
      const xj = boundary[j].lng * Math.PI / 180;
      const yj = boundary[j].lat * Math.PI / 180;

      area += xi * Math.sin(yj) - xj * Math.sin(yi);
    }

    area = Math.abs(area) * earthRadius * earthRadius / 2;
    return area;
  };

  const checkBoundaryOverlap = (boundary1: BoundaryPoint[], boundary2: BoundaryPoint[]): boolean => {
    // Simple point-in-polygon check for overlap detection
    for (const point of boundary1) {
      if (isPointInPolygon(point, boundary2)) {
        return true;
      }
    }

    for (const point of boundary2) {
      if (isPointInPolygon(point, boundary1)) {
        return true;
      }
    }

    return false;
  };

  const isPointInPolygon = (point: BoundaryPoint, polygon: BoundaryPoint[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
        (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const handleDrawingModeChange = (mode: DrawingMode) => {
    if (!drawingManagerRef.current) return;

    setDrawingMode(mode);
    setError(null);

    if (mode === 'rectangle') {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
      setIsDrawing(true);
    } else if (mode === 'polygon') {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      setIsDrawing(true);
    } else {
      drawingManagerRef.current.setDrawingMode(null);
      setIsDrawing(false);
    }
  };

  const handleReset = () => {
    if (currentOverlayRef.current) {
      currentOverlayRef.current.setMap(null);
      currentOverlayRef.current = null;
    }
    setCurrentBoundary([]);
    setDrawingMode('none');
    setIsDrawing(false);
    setError(null);

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  const handleComplete = () => {
    if (currentBoundary.length === 0) {
      setError('Please draw a boundary first');
      return;
    }

    if (error) {
      return;
    }

    onBoundaryComplete(currentBoundary);
  };

  const handleCancel = () => {
    handleReset();
    onBoundaryCancel();
  };

  const zoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 15;
      mapRef.current.setZoom(Math.min(currentZoom + 1, 21));
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 15;
      mapRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const centerOnUserLocation = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(20);
    }
  };

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Boundary Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant={mapType === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapType('satellite')}
              className="flex-1"
            >
              Satellite
            </Button>
            <Button
              variant={mapType === 'roadmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapType('roadmap')}
              className="flex-1"
            >
              Map
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="flex-1"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="flex-1"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            {userLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={centerOnUserLocation}
                className="flex-1"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Drawing Tools</div>
          <div className="flex gap-2">
            <Button
              variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawingModeChange('rectangle')}
              disabled={isDrawing && drawingMode !== 'rectangle'}
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={drawingMode === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDrawingModeChange('polygon')}
              disabled={isDrawing && drawingMode !== 'polygon'}
              className="flex-1"
            >
              <Move className="h-4 w-4 mr-1" />
              Polygon
            </Button>
          </div>
        </div>

        {/* Boundary Visibility */}
        <div className="flex items-center gap-2">
          <Button
            variant={showExistingBoundaries ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowExistingBoundaries(!showExistingBoundaries)}
          >
            <Layers className="h-4 w-4 mr-1" />
            {showExistingBoundaries ? 'Hide' : 'Show'} Existing
          </Button>
          <span className="text-sm text-muted-foreground">
            ({existingBoundaries.length} properties)
          </span>
        </div>

        {/* Status and Errors */}
        {isDrawing && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {drawingMode === 'rectangle'
                ? 'Click and drag to draw a rectangle around your property'
                : 'Click to add points. Double-click to finish drawing.'
              }
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentBoundary.length > 0 && !error && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Boundary drawn successfully! Area: {calculatePolygonArea(currentBoundary).toFixed(0)} sq meters
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={currentBoundary.length === 0}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={currentBoundary.length === 0 || !!error || isValidating}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            {isValidating ? 'Validating...' : 'Complete'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Use satellite view for better property identification</div>
          <div>• Draw boundaries around your property only</div>
          <div>• Red areas show already marked properties</div>
          <div>• Boundaries cannot overlap with existing properties</div>
        </div>
      </CardContent>
    </Card>
  );
}