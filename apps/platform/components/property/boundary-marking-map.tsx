// packages/platform/src/components/property/boundary-marking-map.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  GoogleMap, 
  LoadScript, 
  Polygon, 
  Marker,
  DrawingManager,
  InfoWindow 
} from '@react-google-maps/api';
import { Button } from '@newcondo/ui/';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Loader2, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePropertyListingStore, PropertyBoundary } from '../../store/property-listing';

const libraries: ("drawing" | "geometry" | "places")[] = ["drawing", "geometry", "places"];

interface BoundaryMarkingMapProps {
  onBoundarySelected: (coordinates: google.maps.LatLngLiteral[]) => void;
  onLocationConfirmed: (location: google.maps.LatLngLiteral) => void;
  initialLocation?: google.maps.LatLngLiteral;
  existingBoundaries?: PropertyBoundary[];
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 6.5244, // Lagos, Nigeria
  lng: 3.3792,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'cooperative',
  mapTypeId: 'satellite', // Start with satellite view for boundary marking
  zoom: 20, // High zoom for detailed boundary marking
};

const drawingManagerOptions: google.maps.drawing.DrawingManagerOptions = {
  drawingMode: google.maps.drawing.OverlayType.POLYGON,
  drawingControl: true,
  drawingControlOptions: {
    position: google.maps.ControlPosition.TOP_CENTER,
    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
  },
  polygonOptions: {
    fillColor: '#3b82f6',
    fillOpacity: 0.3,
    strokeColor: '#1d4ed8',
    strokeOpacity: 1,
    strokeWeight: 2,
    clickable: true,
    editable: true,
    zIndex: 1,
  },
};

export function BoundaryMarkingMap({
  onBoundarySelected,
  onLocationConfirmed,
  initialLocation,
  existingBoundaries = [],
  className = '',
}: BoundaryMarkingMapProps) {
  const {
    userLocation,
    mapCenter,
    isLocationLoading,
    isMarkingMode,
    selectedBoundary,
    duplicateProperties,
    setUserLocation,
    setMapCenter,
    setLocationLoading,
    setMarkingMode,
    setSelectedBoundary,
    checkForDuplicates,
  } = usePropertyListingStore();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Polygon | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [markedCoordinates, setMarkedCoordinates] = useState<google.maps.LatLngLiteral[]>([]);
  const [conflictingBoundary, setConflictingBoundary] = useState<PropertyBoundary | null>(null);

  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setMapCenter(location);
        
        if (map) {
          map.setCenter(location);
          map.setZoom(20);
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        // Fallback to default location
        setMapCenter(initialLocation || defaultCenter);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, [map, setUserLocation, setMapCenter, setLocationLoading, initialLocation]);

  // Initialize map and get location
  useEffect(() => {
    if (!userLocation && !initialLocation) {
      getCurrentLocation();
    } else if (initialLocation) {
      setMapCenter(initialLocation);
    }
  }, [getCurrentLocation, userLocation, initialLocation, setMapCenter]);

  // Handle polygon completion
  const handlePolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (currentPolygon) {
        currentPolygon.setMap(null);
      }

      setCurrentPolygon(polygon);

      // Get polygon coordinates
      const path = polygon.getPath();
      const coordinates: google.maps.LatLngLiteral[] = [];
      
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({
          lat: point.lat(),
          lng: point.lng(),
        });
      }

      setMarkedCoordinates(coordinates);

      // Check for conflicts with existing boundaries
      checkForDuplicates(coordinates);

      // Check if polygon overlaps with existing boundaries
      const overlapping = existingBoundaries.find(boundary => 
        isPolygonOverlapping(coordinates, boundary.coordinates)
      );

      if (overlapping) {
        setConflictingBoundary(overlapping);
        polygon.setOptions({
          fillColor: '#ef4444',
          strokeColor: '#dc2626',
        });
      } else {
        setConflictingBoundary(null);
        polygon.setOptions({
          fillColor: '#22c55e',
          strokeColor: '#16a34a',
        });
      }

      setShowConfirmation(true);

      // Disable drawing mode after completing a polygon
      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }
    },
    [currentPolygon, drawingManager, existingBoundaries, checkForDuplicates]
  );

  // Check if two polygons overlap
  const isPolygonOverlapping = (
    coords1: google.maps.LatLngLiteral[],
    coords2: google.maps.LatLngLiteral[]
  ): boolean => {
    // Simple bounding box check for now
    const bbox1 = getBoundingBox(coords1);
    const bbox2 = getBoundingBox(coords2);

    return !(
      bbox1.maxLat < bbox2.minLat ||
      bbox1.minLat > bbox2.maxLat ||
      bbox1.maxLng < bbox2.minLng ||
      bbox1.minLng > bbox2.maxLng
    );
  };

  // Get bounding box of coordinates
  const getBoundingBox = (coords: google.maps.LatLngLiteral[]) => {
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  };

  // Handle boundary confirmation
  const handleConfirmBoundary = () => {
    if (conflictingBoundary) {
      // Don't allow confirmation if there's a conflict
      return;
    }

    if (markedCoordinates.length > 0) {
      onBoundarySelected(markedCoordinates);
      setShowConfirmation(false);
      setMarkingMode(false);
    }
  };

  // Handle boundary reset
  const handleResetBoundary = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }
    setMarkedCoordinates([]);
    setConflictingBoundary(null);
    setShowConfirmation(false);
    
    if (drawingManager) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  // Handle enabling marking mode
  const handleEnableMarking = () => {
    setMarkingMode(true);
    if (drawingManager) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Set initial center
    if (mapCenter) {
      map.setCenter(mapCenter);
    } else if (userLocation) {
      map.setCenter(userLocation);
    }
  }, [mapCenter, userLocation]);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    setDrawingManager(drawingManager);
    drawingManagerRef.current = drawingManager;
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mark Property Boundary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Instructions */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Use the drawing tool to outline your property boundaries on the satellite view. 
                Make sure to accurately mark the property boundaries to prevent conflicts.
              </AlertDescription>
            </Alert>

            {/* Location Status */}
            {isLocationLoading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Getting your current location...
                </AlertDescription>
              </Alert>
            )}

            {/* Marking Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleEnableMarking}
                disabled={isLocationLoading || isMarkingMode}
                variant={isMarkingMode ? "secondary" : "default"}
              >
                {isMarkingMode ? "Marking Mode Active" : "Start Marking"}
              </Button>
              
              <Button
                onClick={getCurrentLocation}
                disabled={isLocationLoading}
                variant="outline"
              >
                {isLocationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                Get My Location
              </Button>
            </div>

            {/* Google Map */}
            <LoadScript 
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
              libraries={libraries}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter || defaultCenter}
                zoom={mapCenter ? 20 : 10}
                options={mapOptions}
                onLoad={onLoad}
              >
                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={{
                      url: '/icons/user-location.png',
                      scaledSize: new google.maps.Size(30, 30),
                    }}
                    title="Your Location"
                  />
                )}

                {/* Existing Property Boundaries */}
                {existingBoundaries.map((boundary, index) => (
                  <Polygon
                    key={`existing-${index}`}
                    paths={boundary.coordinates}
                    options={{
                      fillColor: '#ef4444',
                      fillOpacity: 0.3,
                      strokeColor: '#dc2626',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      clickable: true,
                      zIndex: 2,
                    }}
                    onClick={() => setSelectedBoundary(boundary)}
                  />
                ))}

                {/* Duplicate Properties Overlay */}
                {duplicateProperties.map((property, index) => (
                  <Polygon
                    key={`duplicate-${index}`}
                    paths={property.coordinates}
                    options={{
                      fillColor: '#f59e0b',
                      fillOpacity: 0.4,
                      strokeColor: '#d97706',
                      strokeOpacity: 1,
                      strokeWeight: 3,
                      clickable: true,
                      zIndex: 3,
                    }}
                  />
                ))}

                {/* Drawing Manager */}
                {isMarkingMode && (
                  <DrawingManager
                    onLoad={onDrawingManagerLoad}
                    onPolygonComplete={handlePolygonComplete}
                    options={drawingManagerOptions}
                  />
                )}

                {/* Selected Boundary Info Window */}
                {selectedBoundary && (
                  <InfoWindow
                    position={selectedBoundary.center}
                    onCloseClick={() => setSelectedBoundary(null)}
                  >
                    <div className="p-2">
                      <h4 className="font-semibold">Property Already Marked</h4>
                      <p className="text-sm text-gray-600">
                        Marked on: {new Date(selectedBoundary.markedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Address: {selectedBoundary.address}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>

            {/* Boundary Confirmation */}
            {showConfirmation && (
              <Alert className={conflictingBoundary ? "border-red-500" : "border-green-500"}>
                <div className="flex items-center gap-2">
                  {conflictingBoundary ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <AlertDescription>
                    {conflictingBoundary ? (
                      <>
                        <strong>Boundary Conflict Detected!</strong><br />
                        This property boundary overlaps with an existing marked property. 
                        Please adjust your boundary or contact support if you believe this is an error.
                      </>
                    ) : (
                      <>
                        <strong>Boundary Marked Successfully!</strong><br />
                        Review your property boundary and confirm if it accurately represents your property.
                      </>
                    )}
                  </AlertDescription>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleConfirmBoundary}
                    disabled={!!conflictingBoundary}
                    size="sm"
                  >
                    Confirm Boundary
                  </Button>
                  <Button
                    onClick={handleResetBoundary}
                    variant="outline"
                    size="sm"
                  >
                    Reset & Redraw
                  </Button>
                </div>
              </Alert>
            )}

            {/* Duplicate Properties Warning */}
            {duplicateProperties.length > 0 && (
              <Alert className="border-yellow-500">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription>
                  <strong>Similar Properties Found</strong><br />
                  {duplicateProperties.length} similar {duplicateProperties.length === 1 ? 'property' : 'properties'} found in this area. 
                  Please ensure you're marking the correct property boundaries.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}